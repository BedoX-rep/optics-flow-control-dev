
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Invoice, InvoiceItem } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, AlertTriangle, DollarSign, Calculator } from 'lucide-react';

interface AddInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddInvoiceDialog: React.FC<AddInvoiceDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    client_name: '',
    client_phone: '',
    client_assurance: '',
    assurance_total: 0,
    advance_payment: 0,
    balance: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Draft',
    notes: ''
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
  
  const [invoiceItems, setInvoiceItems] = useState<Partial<InvoiceItem>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAssuranceAlert, setShowAssuranceAlert] = useState(false);

  // Fetch receipts with full details for data copying
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts-for-invoice', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          client_id,
          total,
          tax,
          created_at,
          clients!receipts_client_id_fkey (
            name,
            phone,
            assurance,
            right_eye_sph,
            right_eye_cyl,
            right_eye_axe,
            left_eye_sph,
            left_eye_cyl,
            left_eye_axe,
            Add
          ),
          receipt_items (
            id,
            quantity,
            price,
            custom_item_name,
            product:product_id (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching receipts:', error);
        throw error;
      }
      
      return data?.map(receipt => ({
        ...receipt,
        client_name: receipt.clients?.name || 'No Client',
        client_phone: receipt.clients?.phone || 'N/A',
        client_assurance: receipt.clients?.assurance || ''
      })) || [];
    },
    enabled: !!user && isOpen,
  });

  // Generate invoice number
  useEffect(() => {
    if (isOpen && !invoiceData.invoice_number) {
      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      setInvoiceData(prev => ({ ...prev, invoice_number: invoiceNumber }));
    }
  }, [isOpen, invoiceData.invoice_number]);

  // Handle receipt selection for data copying
  const handleReceiptSelect = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    
    if (receiptId === "no-receipt") {
      setInvoiceItems([]);
      setInvoiceData(prev => ({
        ...prev,
        client_name: '',
        client_phone: '',
        client_assurance: '',
        assurance_total: 0
      }));
      setPrescriptionData({
        right_eye_sph: '',
        right_eye_cyl: '',
        right_eye_axe: '',
        left_eye_sph: '',
        left_eye_cyl: '',
        left_eye_axe: '',
        add_value: ''
      });
      return;
    }
    
    const selectedReceipt = receipts.find(r => r.id === receiptId);
    
    if (selectedReceipt) {
      const itemsTotal = selectedReceipt.receipt_items?.reduce((sum, item) => 
        sum + ((item.quantity || 1) * (item.price || 0)), 0) || 0;
      
      // Set assurance total from receipt tax, or use items total if tax is 0
      const assuranceTotal = (selectedReceipt.tax && selectedReceipt.tax > 0) 
        ? selectedReceipt.tax 
        : itemsTotal;

      setInvoiceData(prev => ({
        ...prev,
        client_name: selectedReceipt.client_name || '',
        client_phone: selectedReceipt.client_phone || '',
        client_assurance: selectedReceipt.client_assurance || '',
        assurance_total: assuranceTotal
      }));

      // Populate prescription data from the client linked to the receipt
      if (selectedReceipt.clients) {
        setPrescriptionData({
          right_eye_sph: selectedReceipt.clients.right_eye_sph?.toString() || '',
          right_eye_cyl: selectedReceipt.clients.right_eye_cyl?.toString() || '',
          right_eye_axe: selectedReceipt.clients.right_eye_axe?.toString() || '',
          left_eye_sph: selectedReceipt.clients.left_eye_sph?.toString() || '',
          left_eye_cyl: selectedReceipt.clients.left_eye_cyl?.toString() || '',
          left_eye_axe: selectedReceipt.clients.left_eye_axe?.toString() || '',
          add_value: selectedReceipt.clients.Add?.toString() || ''
        });
      }

      // Convert receipt items to invoice items with manual price and quantity
      const items = selectedReceipt.receipt_items?.map(item => ({
        product_name: item.product?.name || item.custom_item_name || 'Unknown Product',
        description: '',
        quantity: item.quantity || 1,
        unit_price: item.price || 0,
        total_price: (item.quantity || 1) * (item.price || 0)
      })) || [];
      
      setInvoiceItems(items);
    }
  };

  // Add new item
  const addItem = () => {
    setInvoiceItems(prev => [...prev, {
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate total price for quantity and unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = field === 'quantity' ? value : updated[index].quantity || 0;
        const unitPrice = field === 'unit_price' ? value : updated[index].unit_price || 0;
        updated[index].total_price = quantity * unitPrice;
      }
      
      return updated;
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const total = subtotal;

  // Check if assurance total matches items total
  const isAssuranceMismatch = Math.abs(invoiceData.assurance_total - subtotal) > 0.01;

  // Update balance when advance payment or total changes
  useEffect(() => {
    const newBalance = total - invoiceData.advance_payment;
    setInvoiceData(prev => ({ ...prev, balance: newBalance }));
  }, [total, invoiceData.advance_payment]);

  // Show alert when there's a mismatch
  useEffect(() => {
    setShowAssuranceAlert(isAssuranceMismatch && subtotal > 0);
  }, [isAssuranceMismatch, subtotal]);

  // Auto-adjust item prices to match assurance total
  const adjustItemPrices = () => {
    if (invoiceItems.length === 0 || invoiceData.assurance_total <= 0) return;

    const targetTotal = invoiceData.assurance_total;
    const totalQuantity = invoiceItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    if (totalQuantity === 0) return;

    // Calculate new unit prices proportionally
    const updatedItems = invoiceItems.map(item => {
      const itemWeight = (item.quantity || 1) / totalQuantity;
      const newUnitPrice = (targetTotal * itemWeight) / (item.quantity || 1);
      return {
        ...item,
        unit_price: newUnitPrice,
        total_price: newUnitPrice * (item.quantity || 1)
      };
    });

    setInvoiceItems(updatedItems);
    
    toast({
      title: "Prices Adjusted",
      description: "Item prices have been adjusted to match the assurance total.",
    });
  };

  // Auto-calculate status based on balance
  const getInvoiceStatus = () => {
    if (invoiceData.balance <= 0 && total > 0) return 'Paid';
    if (invoiceData.advance_payment > 0 && invoiceData.balance > 0) return 'Pending';
    if (invoiceData.advance_payment === 0 && total > 0) return 'Draft';
    return 'Draft';
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!invoiceData.client_name.trim()) {
      toast({
        title: "Error",
        description: "Client name is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "At least one item is required.",
        variant: "destructive",
      });
      return;
    }

    // Check if assurance total matches items total
    if (isAssuranceMismatch) {
      toast({
        title: "Error",
        description: "Assurance total must equal the total amount of items. Please adjust the prices or assurance total.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const finalStatus = getInvoiceStatus();
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          client_phone: invoiceData.client_phone,
          client_assurance: invoiceData.client_assurance,
          subtotal,
          tax_percentage: 0,
          tax_amount: invoiceData.assurance_total,
          total,
          advance_payment: invoiceData.advance_payment,
          balance: invoiceData.balance,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date || null,
          status: finalStatus,
          notes: invoiceData.notes,
          right_eye_sph: prescriptionData.right_eye_sph ? parseFloat(prescriptionData.right_eye_sph) : null,
          right_eye_cyl: prescriptionData.right_eye_cyl ? parseFloat(prescriptionData.right_eye_cyl) : null,
          right_eye_axe: prescriptionData.right_eye_axe ? parseInt(prescriptionData.right_eye_axe) : null,
          left_eye_sph: prescriptionData.left_eye_sph ? parseFloat(prescriptionData.left_eye_sph) : null,
          left_eye_cyl: prescriptionData.left_eye_cyl ? parseFloat(prescriptionData.left_eye_cyl) : null,
          left_eye_axe: prescriptionData.left_eye_axe ? parseInt(prescriptionData.left_eye_axe) : null,
          add_value: prescriptionData.add_value ? parseFloat(prescriptionData.add_value) : null
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        user_id: user.id,
        product_name: item.product_name || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      queryClient.invalidateQueries(['invoices']);
      toast({
        title: "Success",
        description: "Invoice created successfully!",
      });
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReceiptId('');
    setInvoiceData({
      invoice_number: '',
      client_name: '',
      client_phone: '',
      client_assurance: '',
      assurance_total: 0,
      advance_payment: 0,
      balance: 0,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'Draft',
      notes: ''
    });
    setPrescriptionData({
      right_eye_sph: '',
      right_eye_cyl: '',
      right_eye_axe: '',
      left_eye_sph: '',
      left_eye_cyl: '',
      left_eye_axe: '',
      add_value: ''
    });
    setInvoiceItems([]);
    setShowAssuranceAlert(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t('addInvoice') || 'Add Invoice'}</DialogTitle>
        </DialogHeader>
        
        {/* Assurance Mismatch Alert */}
        {showAssuranceAlert && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Assurance Total Mismatch:</strong> The assurance total ({invoiceData.assurance_total.toFixed(2)} DH) 
                  doesn't match the items total ({subtotal.toFixed(2)} DH). 
                  You cannot save the invoice until these amounts match.
                </div>
                <Button 
                  onClick={adjustItemPrices}
                  size="sm"
                  className="ml-4 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Auto-Adjust Prices
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice & Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Receipt Selection */}
                <div className="space-y-2">
                  <Label>{t('copyFromReceipt') || 'Copy from Receipt'} ({t('optional') || 'Optional'})</Label>
                  <Select value={selectedReceiptId} onValueChange={handleReceiptSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectReceipt') || 'Select Receipt'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-receipt">{t('noReceipt') || 'No Receipt'}</SelectItem>
                      {receipts.length === 0 ? (
                        <SelectItem value="no-data" disabled>No receipts available</SelectItem>
                      ) : (
                        receipts.map(receipt => (
                          <SelectItem key={receipt.id} value={receipt.id}>
                            {receipt.client_name} - {receipt.total?.toFixed(2) || '0.00'} DH - {new Date(receipt.created_at).toLocaleDateString()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('invoiceNumber') || 'Invoice Number'}</Label>
                    <Input
                      value={invoiceData.invoice_number}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                      placeholder={t('invoiceNumber') || 'Invoice Number'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('status') || 'Status'} (Auto-calculated)</Label>
                    <Input
                      value={getInvoiceStatus()}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                {/* Client Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('clientName') || 'Client Name'} *</Label>
                    <Input
                      value={invoiceData.client_name}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                      placeholder={t('clientName') || 'Client Name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('clientPhone') || 'Client Phone'}</Label>
                    <Input
                      value={invoiceData.client_phone}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, client_phone: e.target.value }))}
                      placeholder={t('clientPhone') || 'Client Phone'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('clientAssurance') || 'Client Assurance'}</Label>
                  <Input
                    value={invoiceData.client_assurance}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, client_assurance: e.target.value }))}
                    placeholder={t('clientAssurance') || 'Client Assurance'}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('invoiceDate') || 'Invoice Date'}</Label>
                    <Input
                      type="date"
                      value={invoiceData.invoice_date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('dueDate') || 'Due Date'}</Label>
                    <Input
                      type="date"
                      value={invoiceData.due_date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>{t('notes') || 'Notes'}</Label>
                  <Textarea
                    value={invoiceData.notes}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('notes') || 'Notes'}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescription Tab */}
          <TabsContent value="prescription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('prescription') || 'Prescription'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t('rightEye') || 'Right Eye'}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>SPH</Label>
                        <Input
                          type="number"
                          step="0.25"
                          value={prescriptionData.right_eye_sph}
                          onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_sph: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CYL</Label>
                        <Input
                          type="number"
                          step="0.25"
                          value={prescriptionData.right_eye_cyl}
                          onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_cyl: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>AXE</Label>
                        <Input
                          type="number"
                          value={prescriptionData.right_eye_axe}
                          onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_axe: e.target.value }))}
                          placeholder="0"
                          min="0"
                          max="180"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t('leftEye') || 'Left Eye'}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>SPH</Label>
                        <Input
                          type="number"
                          step="0.25"
                          value={prescriptionData.left_eye_sph}
                          onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_sph: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CYL</Label>
                        <Input
                          type="number"
                          step="0.25"
                          value={prescriptionData.left_eye_cyl}
                          onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_cyl: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>AXE</Label>
                        <Input
                          type="number"
                          value={prescriptionData.left_eye_axe}
                          onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_axe: e.target.value }))}
                          placeholder="0"
                          min="0"
                          max="180"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 w-1/3">
                  <Label>{t('add') || 'ADD'}</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={prescriptionData.add_value}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, add_value: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('items') || 'Items'}</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addItem') || 'Add Item'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoiceItems.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-4">
                            <Label className="text-sm">{t('productName') || 'Product Name'}</Label>
                            <Input
                              value={item.product_name || ''}
                              onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                              placeholder={t('productName') || 'Product Name'}
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-sm">{t('description') || 'Description'}</Label>
                            <Input
                              value={item.description || ''}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder={t('description') || 'Description'}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-sm">{t('quantity') || 'Quantity'}</Label>
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-sm">{t('unitPrice') || 'Unit Price'}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price || ''}
                              onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                              min="0"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              onClick={() => removeItem(index)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 text-right">
                          <span className="text-sm font-medium bg-blue-50 px-3 py-1 rounded">
                            {t('total') || 'Total'}: {(item.total_price || 0).toFixed(2)} DH
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {invoiceItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>{t('noItemsAdded') || 'No items added yet'}</p>
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('subtotal') || 'Subtotal'}:</span>
                      <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">{t('total') || 'Total'}:</span>
                      <span className="font-bold text-blue-600">{total.toFixed(2)} DH</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment & Assurance Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-blue-600">
                      Assurance Total *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceData.assurance_total}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, assurance_total: Number(e.target.value) }))}
                      min="0"
                      className={isAssuranceMismatch ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}
                    />
                    <p className="text-sm text-gray-600">
                      Must equal items total: {subtotal.toFixed(2)} DH
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('advancePayment') || 'Advance Payment'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceData.advance_payment}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, advance_payment: Number(e.target.value) }))}
                      min="0"
                      max={total}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('balance') || 'Balance'} (Auto-calculated)</Label>
                    <Input
                      value={invoiceData.balance.toFixed(2)}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Payment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Items Total:</span>
                      <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assurance Total:</span>
                      <span className={`font-medium ${isAssuranceMismatch ? 'text-red-600' : 'text-green-600'}`}>
                        {invoiceData.assurance_total.toFixed(2)} DH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Advance Payment:</span>
                      <span className="font-medium">{invoiceData.advance_payment.toFixed(2)} DH</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg">
                      <span className="font-bold">Balance Due:</span>
                      <span className="font-bold text-blue-600">{invoiceData.balance.toFixed(2)} DH</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || isAssuranceMismatch}
            className={isAssuranceMismatch ? 'bg-gray-400 cursor-not-allowed' : ''}
          >
            {isLoading ? (t('saving') || 'Saving...') : (t('createInvoice') || 'Create Invoice')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;
