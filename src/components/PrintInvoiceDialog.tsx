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
import { Printer, Download, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const isFrench = language === 'fr';

  const [userInfo, setUserInfo] = useState<UserInformation | null>(null);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    client_name: '',
    client_phone: '',
    notes: ''
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [printOptions, setPrintOptions] = useState({
    showAdvancePayment: false,
    showBalance: false,
    printProductNames: false // Default to false (categories only)
  });

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
  const [optionsOpen, setOptionsOpen] = useState(false);

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

      // Set invoice items
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

    if (!invoiceData.invoice_number.trim()) {
      errors.push('Invoice number is required');
    }
    if (!invoiceData.client_name.trim()) {
      errors.push('Client name is required');
    }
    if (invoiceItems.length === 0) {
      errors.push('At least one item is required');
    }

    invoiceItems.forEach((item, index) => {
      if (!printOptions.printProductNames && !item.category) {
        errors.push(`Item ${index + 1} category is required`);
      }
      if (printOptions.printProductNames && !item.name.trim()) {
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

  const translateCategory = (category: string) => {
    if (!isFrench) return category;

    const translations: { [key: string]: string } = {
      'Single Vision Lenses': 'Verres Unifocaux',
      'Progressive Lenses': 'Verres Progressifs',
      'Frames': 'Montures',
      'Sunglasses': 'Lunettes de Soleil',
      'Contact Lenses': 'Lentilles de Contact',
      'Accessories': 'Accessoires'
    };

    return translations[category] || category;
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

      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(printContent);
        pdfWindow.document.close();

        pdfWindow.onload = () => {
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
      const printContent = generatePrintContent();

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

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

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceData.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; padding: 20px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { max-width: 120px; max-height: 80px; }
            .company-info { text-align: right; }
            .company-info h1 { font-size: 24px; color: #333; margin-bottom: 5px; }
            .company-info p { margin-bottom: 3px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .invoice-details, .client-details { width: 48%; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .invoice-details h3, .client-details h3 { color: #333; margin-bottom: 10px; font-size: 16px; font-weight: bold; }
            .invoice-details p, .client-details p { font-size: 14px; margin-bottom: 5px; }
            .prescription { margin: 15px 0; padding: 10px; background: #f8f9fa; border: 1px solid #ddd; }
            .prescription h3 { margin-bottom: 8px; font-size: 14px; }
            .prescription-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .prescription-table th, .prescription-table td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            .prescription-table th { background: #f0f0f0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .items-table th { background: #f0f0f0; font-weight: bold; font-size: 11px; }
            .items-table td { font-size: 11px; }
            .items-table .number { text-align: center; }
            .items-table .price { text-align: right; }
            .total-section { margin-top: 15px; text-align: right; }
            .total-line { margin: 3px 0; font-size: 14px; }
            .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
            .notes { margin-top: 20px; }
            .notes h3 { margin-bottom: 8px; font-size: 14px; }
            .notes p { font-size: 12px; }
            @media print { 
              body { padding: 0; margin: 0; background: white !important; }
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
                    <td><strong>${isFrench ? 'OD' : 'Right'}</strong></td>
                    <td>${prescriptionData.right_eye_sph || '-'}</td>
                    <td>${prescriptionData.right_eye_cyl || '-'}</td>
                    <td>${prescriptionData.right_eye_axe || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>${isFrench ? 'OG' : 'Left'}</strong></td>
                    <td>${prescriptionData.left_eye_sph || '-'}</td>
                    <td>${prescriptionData.left_eye_cyl || '-'}</td>
                    <td>${prescriptionData.left_eye_axe || '-'}</td>
                  </tr>
                  ${prescriptionData.add_value ? `
                    <tr>
                      <td colspan="4"><strong>ADD:</strong> ${prescriptionData.add_value}</td>
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
                <th>${printOptions.printProductNames ? (isFrench ? 'Nom de l\'Article' : 'Item Name') : (isFrench ? 'Catégorie' : 'Category')}</th>
                <th class="number">${isFrench ? 'Quantité' : 'Qty'}</th>
                <th class="price">${isFrench ? 'Prix' : 'Price'}</th>
                <th class="price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.map((item, index) => `
                <tr>
                  <td class="number">${index + 1}</td>
                  <td>${printOptions.printProductNames ? item.name : translateCategory(item.category)}</td>
                  <td class="number">${item.quantity}</td>
                  <td class="price">${item.price.toFixed(2)} DH</td>
                  <td class="price">${(item.quantity * item.price).toFixed(2)} DH</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-final">
              <strong>${isFrench ? 'Total:' : 'Total:'} ${total.toFixed(2)} DH</strong>
            </div>
            ${printOptions.showAdvancePayment && invoice?.advance_payment ? `
              <div class="total-line">
                <strong>${isFrench ? 'Acompte:' : 'Advance:'} ${invoice.advance_payment.toFixed(2)} DH</strong>
              </div>
            ` : ''}
            ${printOptions.showBalance && invoice ? `
              <div class="total-line">
                <strong>${isFrench ? 'Solde:' : 'Balance:'} ${(total - (invoice.advance_payment || 0)).toFixed(2)} DH</strong>
              </div>
            ` : ''}
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="h-4 w-4 text-blue-600" />
            {isFrench ? `Imprimer Facture ${invoiceData.invoice_number}` : `Print Invoice ${invoiceData.invoice_number}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-1">
          {/* Quick Edit Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{isFrench ? 'N° Facture' : 'Invoice #'}</Label>
              <Input
                value={invoiceData.invoice_number}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-sm">{isFrench ? 'Client' : 'Client'}</Label>
              <Input
                value={invoiceData.client_name}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                className="h-8"
              />
            </div>
          </div>

          {/* Invoice Items Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">{isFrench ? 'Articles' : 'Items'}</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {invoiceItems.map((item, index) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate flex-1">
                    {index + 1}. {printOptions.printProductNames ? item.name : translateCategory(item.category)}
                  </span>
                  <span className="ml-2 font-medium">
                    {item.quantity} × {item.price.toFixed(2)} = {(item.quantity * item.price).toFixed(2)} DH
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>{isFrench ? 'Total' : 'Total'}</span>
              <span>{total.toFixed(2)} DH</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm">{isFrench ? 'Notes' : 'Notes'}</Label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Print Options */}
          <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full h-8">
                <Settings className="h-3 w-3 mr-2" />
                {isFrench ? 'Options d\'Impression' : 'Print Options'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="printProductNames"
                    checked={printOptions.printProductNames}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, printProductNames: e.target.checked }))}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="printProductNames" className="text-sm">
                    {isFrench ? 'Imprimer les noms des produits (sinon catégories)' : 'Print product names (otherwise categories)'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAdvancePayment"
                    checked={printOptions.showAdvancePayment}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, showAdvancePayment: e.target.checked }))}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="showAdvancePayment" className="text-sm">
                    {isFrench ? 'Afficher l\'acompte' : 'Show advance payment'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showBalance"
                    checked={printOptions.showBalance}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, showBalance: e.target.checked }))}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="showBalance" className="text-sm">
                    {isFrench ? 'Afficher le solde' : 'Show balance due'}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose} className="h-8">
            {isFrench ? 'Annuler' : 'Cancel'}
          </Button>
          <Button 
            onClick={downloadPDF} 
            disabled={isLoading}
            variant="outline"
            className="h-8 border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="h-3 w-3 mr-1" />
            {isLoading ? '...' : 'PDF'}
          </Button>
          <Button 
            onClick={handlePrint} 
            disabled={isLoading}
            className="h-8 bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="h-3 w-3 mr-1" />
            {isLoading ? (isFrench ? 'Impression...' : 'Printing...') : (isFrench ? 'Imprimer' : 'Print')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceDialog;