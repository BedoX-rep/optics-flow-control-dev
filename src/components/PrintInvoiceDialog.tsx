
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
import { Printer, Building2, Phone, MapPin, FileText, Download, Calculator, Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    showProductNames: false,
    showClientPhone: false,
    colorTheme: 'default'
  });

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
    const translatedCategories = uniqueCategories.map(category => translateCategory(category));
    return translatedCategories.join(' + ');
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

  const generatePrintContent = () => {
    const total = calculateTotal();
    const currentDate = format(new Date(), 'dd/MM/yyyy');
    const logoUrl = userInfo?.business_logo || '/placeholder.svg';
    const purchaseType = getPurchaseType();
    const isFrench = language === 'fr';

    // Color theme styles
    const getColorThemeStyles = () => {
      switch (printOptions.colorTheme) {
        case 'blue':
          return {
            primary: '#1e40af',
            secondary: '#3b82f6',
            background: '#eff6ff',
            border: '#1e40af',
            lightBg: '#dbeafe'
          };
        case 'green':
          return {
            primary: '#059669',
            secondary: '#10b981',
            background: '#ecfdf5',
            border: '#059669',
            lightBg: '#d1fae5'
          };
        default:
          return {
            primary: '#333',
            secondary: '#666',
            background: '#f8f9fa',
            border: '#333',
            lightBg: '#f0f0f0'
          };
      }
    };

    const colors = getColorThemeStyles();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceData.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: ${colors.primary}; padding: 20px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid ${colors.border}; padding-bottom: 20px; page-break-inside: avoid; }
            .logo { max-width: 120px; max-height: 80px; }
            .company-info { text-align: right; }
            .company-info h1 { font-size: 24px; color: ${colors.primary}; margin-bottom: 5px; }
            .company-info p { margin-bottom: 3px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .invoice-details, .client-details { width: 48%; padding: 20px; background: ${colors.background}; border-radius: 8px; }
            .invoice-details h3, .client-details h3 { color: ${colors.primary}; margin-bottom: 15px; font-size: 20px; font-weight: bold; }
            .invoice-details p, .client-details p { font-size: 15px; margin-bottom: 8px; line-height: 1.6; }
            .invoice-details strong, .client-details strong { font-weight: bold; }
            .prescription { margin: 20px 0; padding: 15px; background: ${colors.background}; border: 1px solid ${colors.secondary}; }
            .prescription h3 { margin-bottom: 10px; color: ${colors.primary}; }
            .prescription-table { width: 100%; border-collapse: collapse; }
            .prescription-table th, .prescription-table td { border: 1px solid ${colors.secondary}; padding: 8px; text-align: center; }
            .prescription-table th { background: ${colors.lightBg}; color: ${colors.primary}; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid ${colors.secondary}; padding: 12px; text-align: left; }
            .items-table th { background: ${colors.lightBg}; font-weight: bold; color: ${colors.primary}; }
            .items-table .number { text-align: center; }
            .items-table .price { text-align: right; }
            .total-section { margin-top: 20px; text-align: right; }
            .total-line { margin: 5px 0; }
            .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid ${colors.border}; padding-top: 10px; margin-top: 10px; color: ${colors.primary}; }
            .notes { margin-top: 30px; }
            .notes h3 { margin-bottom: 10px; color: ${colors.primary}; }
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
              ${printOptions.showClientPhone && invoiceData.client_phone ? `<p><strong>${isFrench ? 'Téléphone:' : 'Phone:'}</strong> ${invoiceData.client_phone}</p>` : ''}
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
                <th>${isFrench ? 'Article' : 'Item'}</th>
                <th class="number">${isFrench ? 'Quantité' : 'Quantity'}</th>
                <th class="price">${isFrench ? 'Prix Unitaire' : 'Unit Price'}</th>
                <th class="price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.map((item, index) => `
                <tr>
                  <td class="number">${index + 1}</td>
                  <td>${printOptions.showProductNames ? item.name : translateCategory(item.category)}</td>
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
            ${printOptions.showAdvancePayment && invoice?.advance_payment ? `
              <div class="total-line">
                <strong>${isFrench ? 'Acompte:' : 'Advance Payment:'} ${invoice.advance_payment.toFixed(2)} DH</strong>
              </div>
            ` : ''}
            ${printOptions.showBalance && invoice ? `
              <div class="total-line">
                <strong>${isFrench ? 'Solde Restant:' : 'Balance Due:'} ${(total - (invoice.advance_payment || 0)).toFixed(2)} DH</strong>
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
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-teal-100 pb-4 mb-6">
          <DialogTitle className="text-3xl font-bold text-teal-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Printer className="h-6 w-6 text-teal-600" />
            </div>
            {isFrench ? `Imprimer la Facture - ${invoiceData.invoice_number}` : `Print Invoice - ${invoiceData.invoice_number}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="invoice-details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-teal-50 border border-teal-200">
            <TabsTrigger value="invoice-details" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              {isFrench ? 'Détails Facture' : 'Invoice Details'}
            </TabsTrigger>
            <TabsTrigger value="print-options" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              {isFrench ? 'Options d\'Impression' : 'Print Options'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoice-details" className="flex-1 overflow-auto mt-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Business Information */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    {isFrench ? 'Informations Entreprise' : 'Business Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-teal-600">{isFrench ? 'Nom du Magasin' : 'Store Name'}</Label>
                      <p className="font-medium text-teal-800">{userInfo?.store_name || (isFrench ? 'Non défini' : 'Not set')}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-teal-600">{isFrench ? 'Téléphone' : 'Phone'}</Label>
                      <p className="font-medium text-teal-800">{userInfo?.phone || (isFrench ? 'Non défini' : 'Not set')}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-teal-600">{isFrench ? 'Adresse' : 'Address'}</Label>
                      <p className="font-medium text-teal-800">{userInfo?.address || (isFrench ? 'Non définie' : 'Not set')}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-teal-600">ICE</Label>
                      <p className="font-medium text-teal-800">{userInfo?.ice || (isFrench ? 'Non défini' : 'Not set')}</p>
                    </div>
                  </div>

                  <Separator className="my-4 border-teal-200" />

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="invoice_number" className="text-sm font-medium text-teal-700">{isFrench ? 'Numéro de Facture' : 'Invoice Number'}</Label>
                      <Input
                        id="invoice_number"
                        value={invoiceData.invoice_number}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                        className="mt-1 border-teal-200 focus:border-teal-500 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_name" className="text-sm font-medium text-teal-700">{isFrench ? 'Nom du Client' : 'Client Name'}</Label>
                      <Input
                        id="client_name"
                        value={invoiceData.client_name}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                        className="mt-1 border-teal-200 focus:border-teal-500 h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_phone" className="text-sm font-medium text-teal-700">{isFrench ? 'Téléphone du Client' : 'Client Phone'}</Label>
                      <Input
                        id="client_phone"
                        value={invoiceData.client_phone}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, client_phone: e.target.value }))}
                        className="mt-1 border-teal-200 focus:border-teal-500 h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items & Prescription */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <Calculator className="h-4 w-4" />
                    {isFrench ? 'Articles & Prescription' : 'Items & Prescription'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Prescription Section */}
                  {Object.values(prescriptionData).some(val => val) && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-teal-700">{isFrench ? 'Prescription' : 'Prescription'}</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs text-teal-600">{isFrench ? 'OD SPH' : 'Right SPH'}</Label>
                          <Input
                            value={prescriptionData.right_eye_sph}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_sph: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-teal-600">{isFrench ? 'OD CYL' : 'Right CYL'}</Label>
                          <Input
                            value={prescriptionData.right_eye_cyl}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_cyl: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-teal-600">{isFrench ? 'OD AXE' : 'Right AXE'}</Label>
                          <Input
                            value={prescriptionData.right_eye_axe}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_axe: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-teal-600">ADD</Label>
                          <Input
                            value={prescriptionData.add_value}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, add_value: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-teal-600">{isFrench ? 'OG SPH' : 'Left SPH'}</Label>
                          <Input
                            value={prescriptionData.left_eye_sph}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_sph: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-teal-600">{isFrench ? 'OG CYL' : 'Left CYL'}</Label>
                          <Input
                            value={prescriptionData.left_eye_cyl}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_cyl: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-teal-600">{isFrench ? 'OG AXE' : 'Left AXE'}</Label>
                          <Input
                            value={prescriptionData.left_eye_axe}
                            onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_axe: e.target.value }))}
                            className="h-8 text-xs border-teal-200 focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="border-teal-200" />

                  {/* Invoice Items */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-teal-700">{isFrench ? 'Articles' : 'Items'}</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {invoiceItems.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-5 gap-2 p-2 bg-teal-50 rounded-lg">
                          <div>
                            <Input
                              value={item.name}
                              onChange={(e) => updateInvoiceItem(index, 'name', e.target.value)}
                              className="h-8 text-xs border-teal-200 focus:border-teal-500"
                              placeholder="Name"
                            />
                          </div>
                          <div>
                            <Select
                              value={item.category}
                              onValueChange={(value) => updateInvoiceItem(index, 'category', value)}
                            >
                              <SelectTrigger className="h-8 text-xs border-teal-200 focus:border-teal-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {translateCategory(category)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="h-8 text-xs border-teal-200 focus:border-teal-500"
                              placeholder="Qty"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateInvoiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs border-teal-200 focus:border-teal-500"
                              placeholder="Price"
                            />
                          </div>
                          <div>
                            <p className="h-8 px-2 bg-white rounded text-xs flex items-center font-medium text-teal-800">
                              {(item.quantity * item.price).toFixed(2)} DH
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-xl font-bold text-teal-800 text-center">
                        Total: {total.toFixed(2)} DH
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-teal-700">{isFrench ? 'Notes' : 'Notes'}</Label>
                    <Textarea
                      value={invoiceData.notes}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={isFrench ? "Notes supplémentaires..." : "Additional notes..."}
                      rows={2}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="print-options" className="flex-1 overflow-auto mt-6">
            <div className="max-w-2xl mx-auto">
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    {isFrench ? 'Options d\'Impression' : 'Print Options'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showAdvancePayment" className="text-sm font-medium text-teal-700">
                        {isFrench ? 'Afficher l\'acompte' : 'Show advance payment'}
                      </Label>
                      <input
                        type="checkbox"
                        id="showAdvancePayment"
                        checked={printOptions.showAdvancePayment}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, showAdvancePayment: e.target.checked }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-teal-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showBalance" className="text-sm font-medium text-teal-700">
                        {isFrench ? 'Afficher le solde restant' : 'Show balance due'}
                      </Label>
                      <input
                        type="checkbox"
                        id="showBalance"
                        checked={printOptions.showBalance}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, showBalance: e.target.checked }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-teal-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showProductNames" className="text-sm font-medium text-teal-700">
                        {isFrench ? 'Afficher les noms des produits' : 'Show product names'}
                      </Label>
                      <input
                        type="checkbox"
                        id="showProductNames"
                        checked={printOptions.showProductNames}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, showProductNames: e.target.checked }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-teal-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showClientPhone" className="text-sm font-medium text-teal-700">
                        {isFrench ? 'Afficher le téléphone du client' : 'Show client phone number'}
                      </Label>
                      <input
                        type="checkbox"
                        id="showClientPhone"
                        checked={printOptions.showClientPhone}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, showClientPhone: e.target.checked }))}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-teal-300 rounded"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-teal-700">
                        {isFrench ? 'Thème de couleur' : 'Color Theme'}
                      </Label>
                      <Select
                        value={printOptions.colorTheme}
                        onValueChange={(value) => setPrintOptions(prev => ({ ...prev, colorTheme: value }))}
                      >
                        <SelectTrigger className="border-teal-200 focus:border-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">{isFrench ? 'Défaut (Noir)' : 'Default (Black)'}</SelectItem>
                          <SelectItem value="blue">{isFrench ? 'Bleu' : 'Blue'}</SelectItem>
                          <SelectItem value="green">{isFrench ? 'Vert' : 'Green'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h4 className="font-semibold text-teal-800 mb-2 text-sm">
                      {isFrench ? 'Aperçu des options' : 'Options Preview'}
                    </h4>
                    <div className="text-xs text-teal-600 space-y-1">
                      <div>
                        {printOptions.showProductNames
                          ? (isFrench ? '✓ Noms complets des produits' : '✓ Full product names')
                          : (isFrench ? '✗ Seules les catégories' : '✗ Categories only')
                        }
                      </div>
                      <div>
                        {printOptions.showClientPhone
                          ? (isFrench ? '✓ Téléphone du client' : '✓ Client phone number')
                          : (isFrench ? '✗ Téléphone du client masqué' : '✗ Client phone hidden')
                        }
                      </div>
                      <div>
                        {isFrench ? `Thème: ${printOptions.colorTheme === 'default' ? 'Défaut' : printOptions.colorTheme === 'blue' ? 'Bleu' : 'Vert'}`
                          : `Theme: ${printOptions.colorTheme === 'default' ? 'Default' : printOptions.colorTheme.charAt(0).toUpperCase() + printOptions.colorTheme.slice(1)}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-teal-100 mt-auto">
          <Button variant="outline" onClick={onClose} className="border-teal-300 text-teal-700 hover:bg-teal-50">
            {isFrench ? 'Annuler' : 'Cancel'}
          </Button>
          <Button
            onClick={downloadPDF}
            disabled={isLoading}
            variant="outline"
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? (isFrench ? 'Génération...' : 'Generating...') : (isFrench ? 'Télécharger PDF' : 'Download PDF')}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isLoading ? (isFrench ? 'Impression...' : 'Printing...') : (isFrench ? 'Imprimer' : 'Print')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceDialog;
