
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
    client_address: '',
    tax_percentage: 20,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Draft',
    notes: ''
  });
  
  const [invoiceItems, setInvoiceItems] = useState<Partial<InvoiceItem>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch receipts for selection
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts-for-invoice', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          client_name,
          client_phone,
          total,
          created_at,
          clients (name, phone),
          receipt_items (
            id,
            quantity,
            price,
            custom_item_name,
            product:product_id (name)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(receipt => ({
        ...receipt,
        client_name: receipt.clients?.name || receipt.client_name || 'No Client',
        client_phone: receipt.clients?.phone || receipt.client_phone || 'N/A'
      }));
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
  }, [isOpen]);

  // Handle receipt selection
  const handleReceiptSelect = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    const selectedReceipt = receipts.find(r => r.id === receiptId);
    
    if (selectedReceipt) {
      setInvoiceData(prev => ({
        ...prev,
        client_name: selectedReceipt.client_name || '',
        client_phone: selectedReceipt.client_phone || ''
      }));

      // Convert receipt items to invoice items
      const items = selectedReceipt.receipt_items?.map(item => ({
        product_name: item.product?.name || item.custom_item_name || 'Unknown Product',
        description: '',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price
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
  const taxAmount = (subtotal * invoiceData.tax_percentage) / 100;
  const total = subtotal + taxAmount;

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
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          receipt_id: selectedReceiptId || null,
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          client_phone: invoiceData.client_phone,
          client_address: invoiceData.client_address,
          subtotal,
          tax_percentage: invoiceData.tax_percentage,
          tax_amount: taxAmount,
          total,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date || null,
          status: invoiceData.status,
          notes: invoiceData.notes
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
      client_address: '',
      tax_percentage: 20,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'Draft',
      notes: ''
    });
    setInvoiceItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addInvoice')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Receipt Selection */}
          <div className="space-y-2">
            <Label>{t('linkToReceipt')} ({t('optional')})</Label>
            <Select value={selectedReceiptId} onValueChange={handleReceiptSelect}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectReceipt')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('noReceipt')}</SelectItem>
                {receipts.map(receipt => (
                  <SelectItem key={receipt.id} value={receipt.id}>
                    {receipt.client_name} - {receipt.total.toFixed(2)} DH - {new Date(receipt.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('invoiceNumber')}</Label>
              <Input
                value={invoiceData.invoice_number}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder={t('invoiceNumber')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('status')}</Label>
              <Select
                value={invoiceData.status}
                onValueChange={(value) => setInvoiceData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">{t('draft')}</SelectItem>
                  <SelectItem value="Pending">{t('pending')}</SelectItem>
                  <SelectItem value="Paid">{t('paid')}</SelectItem>
                  <SelectItem value="Overdue">{t('overdue')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('clientName')}</Label>
              <Input
                value={invoiceData.client_name}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder={t('clientName')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('clientPhone')}</Label>
              <Input
                value={invoiceData.client_phone}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, client_phone: e.target.value }))}
                placeholder={t('clientPhone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('clientAddress')}</Label>
            <Textarea
              value={invoiceData.client_address}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, client_address: e.target.value }))}
              placeholder={t('clientAddress')}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('invoiceDate')}</Label>
              <Input
                type="date"
                value={invoiceData.invoice_date}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dueDate')}</Label>
              <Input
                type="date"
                value={invoiceData.due_date}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">{t('items')}</Label>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('addItem')}
              </Button>
            </div>
            
            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">{t('productName')}</Label>
                        <Input
                          value={item.product_name || ''}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          placeholder={t('productName')}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">{t('description')}</Label>
                        <Input
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder={t('description')}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">{t('quantity')}</Label>
                        <Input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">{t('unitPrice')}</Label>
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
                        {t('total')}: {(item.total_price || 0).toFixed(2)} DH
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tax and Total */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('taxPercentage')}</Label>
              <Input
                type="number"
                step="0.01"
                value={invoiceData.tax_percentage}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, tax_percentage: Number(e.target.value) }))}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-4 text-right">
              <div>
                <span className="text-sm text-gray-600">{t('subtotal')}: </span>
                <span className="font-medium">{subtotal.toFixed(2)} DH</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t('tax')} ({invoiceData.tax_percentage}%): </span>
                <span className="font-medium">{taxAmount.toFixed(2)} DH</span>
              </div>
              <div>
                <span className="text-lg font-bold">{t('total')}: </span>
                <span className="text-lg font-bold text-blue-600">{total.toFixed(2)} DH</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? t('saving') : t('createInvoice')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;
