
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Invoice, InvoiceItem } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

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
            assurance
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
      
      console.log('Fetched receipts data:', data);
      
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
      setInvoiceData(prev => ({
        ...prev,
        client_name: selectedReceipt.client_name || '',
        client_phone: selectedReceipt.client_phone || '',
        client_assurance: selectedReceipt.client_assurance || '',
        assurance_total: selectedReceipt.tax || 0
      }));

      // Populate prescription data from receipt
      setPrescriptionData({
        right_eye_sph: selectedReceipt.right_eye_sph?.toString() || '',
        right_eye_cyl: selectedReceipt.right_eye_cyl?.toString() || '',
        right_eye_axe: selectedReceipt.right_eye_axe?.toString() || '',
        left_eye_sph: selectedReceipt.left_eye_sph?.toString() || '',
        left_eye_cyl: selectedReceipt.left_eye_cyl?.toString() || '',
        left_eye_axe: selectedReceipt.left_eye_axe?.toString() || '',
        add_value: selectedReceipt.Add?.toString() || ''
      });

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

  // Calculate totals (excluding assurance/tax)
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const total = subtotal; // Total is just subtotal, assurance is separate

  // Update balance when advance payment or total changes
  useEffect(() => {
    const newBalance = total - invoiceData.advance_payment;
    setInvoiceData(prev => ({ ...prev, balance: newBalance }));
  }, [total, invoiceData.advance_payment]);

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
          tax_percentage: 0, // Not used anymore
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addInvoice') || 'Add Invoice'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receipt Selection for Data Copying */}
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
              <Label>{t('clientName') || 'Client Name'}</Label>
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

          {/* Prescription Section */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">{t('prescription') || 'Prescription'}</Label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">{t('rightEye') || 'Right Eye'}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SPH</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={prescriptionData.right_eye_sph}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_sph: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CYL</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={prescriptionData.right_eye_cyl}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_cyl: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">AXE</Label>
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
              <div className="space-y-3">
                <h4 className="font-medium">{t('leftEye') || 'Left Eye'}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SPH</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={prescriptionData.left_eye_sph}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_sph: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CYL</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={prescriptionData.left_eye_cyl}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_cyl: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">AXE</Label>
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
            <div className="w-1/3">
              <Label className="text-xs">{t('add') || 'ADD'}</Label>
              <Input
                type="number"
                step="0.25"
                value={prescriptionData.add_value}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, add_value: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">{t('items') || 'Items'}</Label>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('addItem') || 'Add Item'}
              </Button>
            </div>
            
            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">{t('productName') || 'Product Name'}</Label>
                        <Input
                          value={item.product_name || ''}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          placeholder={t('productName') || 'Product Name'}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">{t('description') || 'Description'}</Label>
                        <Input
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder={t('description') || 'Description'}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">{t('quantity') || 'Quantity'}</Label>
                        <Input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">{t('unitPrice') || 'Unit Price'}</Label>
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
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium">
                        {t('total') || 'Total'}: {(item.total_price || 0).toFixed(2)} DH
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment and Assurance Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Assurance Total</Label>
              <Input
                type="number"
                step="0.01"
                value={invoiceData.assurance_total}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, assurance_total: Number(e.target.value) }))}
                min="0"
              />
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

          {/* Totals Summary */}
          <div className="space-y-4 text-right">
            <div>
              <span className="text-sm text-gray-600">{t('subtotal') || 'Subtotal'}: </span>
              <span className="font-medium">{subtotal.toFixed(2)} DH</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Assurance Total: </span>
              <span className="font-medium">{invoiceData.assurance_total.toFixed(2)} DH</span>
            </div>
            <div>
              <span className="text-lg font-bold">{t('total') || 'Total'}: </span>
              <span className="text-lg font-bold text-blue-600">{total.toFixed(2)} DH</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('notes') || 'Notes'}</Label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('notes') || 'Notes'}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (t('saving') || 'Saving') : (t('createInvoice') || 'Create Invoice')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;
