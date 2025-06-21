import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { Printer, AlertTriangle, Building2, Phone, MapPin, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrintInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

interface UserInformation {
  store_name?: string;
  address?: string;
  phone?: string;
  ice?: string;
  business_logo?: string;
}

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

const PrintInvoiceDialog: React.FC<PrintInvoiceDialogProps> = ({ isOpen, onClose, invoice }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [userInfo, setUserInfo] = useState<UserInformation | null>(null);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    client_name: '',
    client_phone: '',
    notes: ''
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Category options for items
  const CATEGORY_OPTIONS = [
    'Single Vision Lenses',
    'Progressive Lenses', 
    'Frames',
    'Sunglasses',
    'Contact Lenses',
    'Accessories'
  ];

  const [prescriptionData, setPrescriptionData] = useState({
    right_eye_sph: '',
    right_eye_cyl: '',
    right_eye_axe: '',
    left_eye_sph: '',
    left_eye_cyl: '',
    left_eye_axe: '',
    add_value: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user information
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_information')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user info:', error);
        } else {
          setUserInfo(data);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    if (isOpen && user) {
      fetchUserInfo();
    }
  }, [isOpen, user]);

  // Load invoice data when dialog opens
  useEffect(() => {
    if (isOpen && invoice) {
      setInvoiceData({
        invoice_number: invoice.invoice_number || '',
        client_name: invoice.client_name || '',
        client_phone: invoice.client_phone || '',
        notes: invoice.notes || ''
      });

      setPrescriptionData({
        right_eye_sph: invoice.right_eye_sph?.toString() || '',
        right_eye_cyl: invoice.right_eye_cyl?.toString() || '',
        right_eye_axe: invoice.right_eye_axe?.toString() || '',
        left_eye_sph: invoice.left_eye_sph?.toString() || '',
        left_eye_cyl: invoice.left_eye_cyl?.toString() || '',
        left_eye_axe: invoice.left_eye_axe?.toString() || '',
        add_value: invoice.add_value?.toString() || ''
      });

      // Set invoice items - fix the data structure mapping
      const items = invoice.invoice_items?.map(item => ({
        id: item.id,
        name: item.product_name || '',
        quantity: item.quantity || 0,
        price: item.unit_price || 0,
        category: item.item_category || 'Single Vision Lenses'
      })) || [];
      setInvoiceItems(items);
    }
  }, [isOpen, invoice]);

  const validateForPrint = () => {
    const errors = [];

    // Check required invoice data
    if (!invoiceData.invoice_number.trim()) {
      errors.push('Invoice number is required');
    }
    if (!invoiceData.client_name.trim()) {
      errors.push('Client name is required');
    }
    if (invoiceItems.length === 0) {
      errors.push('At least one item is required');
    }

    // Check items have valid data
    invoiceItems.forEach((item, index) => {
      if (!item.name.trim()) {
        errors.push(`Item ${index + 1} name is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1} quantity must be greater than 0`);
      }
      if (item.price <= 0) {
        errors.push(`Item ${index + 1} price must be greater than 0`);
      }
    });

    return errors;
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const getPurchaseType = () => {
    const uniqueCategories = [...new Set(invoiceItems.map(item => item.category).filter(Boolean))];
    return uniqueCategories.join(' + ');
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const downloadPDF = async () => {
    const validationErrors = validateForPrint();

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const printContent = generatePrintContent();

      // Create a new window for PDF generation
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(printContent);
        pdfWindow.document.close();

        // Wait for content to load
        pdfWindow.onload = () => {
          // Focus the window and trigger print dialog (user can save as PDF)
          pdfWindow.focus();
          pdfWindow.print();
        };
      }

      toast({
        title: "Success",
        description: "PDF download initiated. Use your browser's print dialog to save as PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    const validationErrors = validateForPrint();

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate the print content
      const printContent = generatePrintContent();

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load before printing
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      }

      toast({
        title: "Success",
        description: "Invoice sent to printer successfully",
      });

      onClose();
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to print invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePrintContent = () => {
    const total = calculateTotal();
    const currentDate = format(new Date(), 'dd/MM/yyyy');
    const logoUrl = userInfo?.business_logo || '/placeholder.svg';
    const purchaseType = getPurchaseType();
    const isFrench = language === 'fr';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceData.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; padding: 20px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; page-break-inside: avoid; }
            .logo { max-width: 120px; max-height: 80px; }
            .company-info { text-align: right; }
            .company-info h1 { font-size: 24px; color: #333; margin-bottom: 5px; }
            .company-info p { margin-bottom: 3px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .invoice-details, .client-details { width: 48%; }
            .invoice-details h3, .client-details h3 { color: #333; margin-bottom: 10px; font-size: 16px; }
            .prescription { margin: 20px 0; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; }
            .prescription h3 { margin-bottom: 10px; }
            .prescription-table { width: 100%; border-collapse: collapse; }
            .prescription-table th, .prescription-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            .prescription-table th { background: #f0f0f0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background: #f0f0f0; font-weight: bold; }
            .items-table .number { text-align: center; }
            .items-table .price { text-align: right; }
            .total-section { margin-top: 20px; text-align: right; }
            .total-line { margin: 5px 0; }
            .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            .notes { margin-top: 30px; }
            .notes h3 { margin-bottom: 10px; }
            @media print { 
              body { padding: 0; margin: 0; background: white !important; }
              .header { page-break-inside: avoid; }
              .prescription { page-break-inside: avoid; }
              .items-table { page-break-inside: avoid; }
              .total-section { page-break-inside: avoid; }
              @page { margin: 0.5in; size: A4; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" alt="Logo" class="logo" />
            <div class="company-info">
              <h1>${userInfo?.store_name || 'Optical Store'}</h1>
              ${userInfo?.address ? `<p>${userInfo.address}</p>` : ''}
              ${userInfo?.phone ? `<p>Phone: ${userInfo.phone}</p>` : ''}
              ${userInfo?.ice ? `<p>ICE: ${userInfo.ice}</p>` : ''}
            </div>
          </div>

          <div class="invoice-info">
            <div class="invoice-details">
              <h3>${isFrench ? 'Détails de la Facture' : 'Invoice Details'}</h3>
              <p><strong>${isFrench ? 'Facture #:' : 'Invoice #:'}</strong> ${invoiceData.invoice_number}</p>
              <p><strong>${isFrench ? 'Date:' : 'Date:'}</strong> ${currentDate}</p>
              ${purchaseType ? `<p><strong>${isFrench ? 'Type d\'Achat:' : 'Purchase Type:'}</strong> ${purchaseType}</p>` : ''}
            </div>
            <div class="client-details">
              <h3>${isFrench ? 'Détails du Client' : 'Client Details'}</h3>
              <p><strong>${isFrench ? 'Nom:' : 'Name:'}</strong> ${invoiceData.client_name}</p>
              ${invoiceData.client_phone ? `<p><strong>${isFrench ? 'Téléphone:' : 'Phone:'}</strong> ${invoiceData.client_phone}</p>` : ''}
            </div>
          </div>

          ${Object.values(prescriptionData).some(val => val) ? `
            <div class="prescription">
              <h3>${isFrench ? 'Détails de la Prescription' : 'Prescription Details'}</h3>
              <table class="prescription-table">
                <thead>
                  <tr>
                    <th>${isFrench ? 'Œil' : 'Eye'}</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${isFrench ? 'Œil Droit' : 'Right Eye'}</strong></td>
                    <td>${prescriptionData.right_eye_sph || '-'}</td>
                    <td>${prescriptionData.right_eye_cyl || '-'}</td>
                    <td>${prescriptionData.right_eye_axe || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>${isFrench ? 'Œil Gauche' : 'Left Eye'}</strong></td>
                    <td>${prescriptionData.left_eye_sph || '-'}</td>
                    <td>${prescriptionData.left_eye_cyl || '-'}</td>
                    <td>${prescriptionData.left_eye_axe || '-'}</td>
                  </tr>
                  ${prescriptionData.add_value ? `
                    <tr>
                      <td colspan="4"><strong>${isFrench ? 'Valeur ADD:' : 'ADD Value:'}</strong> ${prescriptionData.add_value}</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          ` : ''}

          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>${isFrench ? 'Nom de l\'Article' : 'Item Name'}</th>
                <th>${isFrench ? 'Catégorie' : 'Category'}</th>
                <th class="number">${isFrench ? 'Quantité' : 'Quantity'}</th>
                <th class="price">${isFrench ? 'Prix Unitaire' : 'Unit Price'}</th>
                <th class="price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.map((item, index) => `
                <tr>
                  <td class="number">${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.category}</td>
                  <td class="number">${item.quantity}</td>
                  <td class="price">${item.price.toFixed(2)} DH</td>
                  <td class="price">${(item.quantity * item.price).toFixed(2)} DH</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-final">
              <strong>${isFrench ? 'Montant Total:' : 'Total Amount:'} ${total.toFixed(2)} DH</strong>
            </div>
          </div>

          ${invoiceData.notes ? `
            <div class="notes">
              <h3>${isFrench ? 'Notes' : 'Notes'}</h3>
              <p>${invoiceData.notes}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  if (!invoice) return null;

  const total = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <Printer className="h-5 w-5 text-blue-600" />
            Print Invoice - {invoiceData.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Information Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-600">Store Name</Label>
                <p className="font-medium">{userInfo?.store_name || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Phone</Label>
                <p className="font-medium">{userInfo?.phone || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Address</Label>
                <p className="font-medium">{userInfo?.address || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">ICE</Label>
                <p className="font-medium">{userInfo?.ice || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice_number" className="text-sm font-medium">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  value={invoiceData.invoice_number}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_name" className="text-sm font-medium">Client Name</Label>
                <Input
                  id="client_name"
                  value={invoiceData.client_name}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_phone" className="text-sm font-medium">Client Phone</Label>
                <Input
                  id="client_phone"
                  value={invoiceData.client_phone}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Current Date</Label>
                <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Details */}
          {Object.values(prescriptionData).some(val => val) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prescription Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Right Eye SPH</Label>
                  <Input
                    value={prescriptionData.right_eye_sph}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_sph: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Right Eye CYL</Label>
                  <Input
                    value={prescriptionData.right_eye_cyl}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_cyl: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Right Eye AXE</Label>
                  <Input
                    value={prescriptionData.right_eye_axe}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_axe: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">ADD Value</Label>
                  <Input
                    value={prescriptionData.add_value}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, add_value: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Left Eye SPH</Label>
                  <Input
                    value={prescriptionData.left_eye_sph}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_sph: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Left Eye CYL</Label>
                  <Input
                    value={prescriptionData.left_eye_cyl}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_cyl: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Left Eye AXE</Label>
                  <Input
                    value={prescriptionData.left_eye_axe}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_axe: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoiceItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-xs text-gray-600">{t('productName') || 'Item Name'}</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateInvoiceItem(index, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">{t('category') || 'Category'}</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateInvoiceItem(index, 'category', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(category => (
                            <SelectItem key={category} value={category}>
                              {t(category.toLowerCase().replace(/\s+/g, '')) || category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">{t('quantity') || 'Quantity'}</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">{t('unitPrice') || 'Unit Price'} (DH)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateInvoiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Total</Label>
                      <p className="mt-1 p-2 bg-white rounded font-medium">
                        {(item.quantity * item.price).toFixed(2)} DH
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  Total: {total.toFixed(2)} DH
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for the invoice..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={downloadPDF} 
              disabled={isLoading}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button 
              onClick={handlePrint} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              {isLoading ? 'Printing...' : 'Print Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceDialog;