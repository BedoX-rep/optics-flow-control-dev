
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { User, Eye, Package2, Receipt, Banknote, FileText, Search, Trash, Plus, Save, Edit } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ReceiptEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

const ProductSelector = memo(() => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-linking', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <>
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchProducts')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      </div>
      {products.map(product => (
        <SelectItem key={product.id} value={product.id}>
          <div className="flex justify-between items-center w-full gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{product.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {product.category} • {product.company || 'No Company'}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-1 rounded ${
                product.stock_status === 'inStock' ? 'bg-green-100 text-green-700' :
                product.stock_status === 'Out Of Stock' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {product.stock_status}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {product.price?.toFixed(2)} DH
              </span>
            </div>
          </div>
        </SelectItem>
      ))}
      {products.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          {t('noProductsFound')}
        </div>
      )}
    </>
  );
});

ProductSelector.displayName = 'ProductSelector';

const ItemCard = memo(({ item, index, onUpdateItem, onRemoveItem, t }: {
  item: any;
  index: number;
  onUpdateItem: (index: number, updates: any) => void;
  onRemoveItem: (index: number) => void;
  t: (key: string) => string;
}) => {
  const handleInputChange = useCallback((field: string, value: any) => {
    onUpdateItem(index, { [field]: value });
  }, [index, onUpdateItem]);

  const handleProductLink = useCallback(async (productId: string) => {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (product) {
      onUpdateItem(index, { 
        product_id: productId,
        product: product,
        price: product.price,
        cost: product.cost_ttc || 0,
        custom_item_name: null
      });
    }
  }, [index, onUpdateItem]);

  const handleUnlink = useCallback(() => {
    onUpdateItem(index, { 
      product_id: null, 
      product: null,
      custom_item_name: item.product?.name || item.custom_item_name || ''
    });
  }, [index, onUpdateItem, item]);

  const handleRemove = useCallback(() => {
    onRemoveItem(index);
  }, [index, onRemoveItem]);

  return (
    <div className="border border-teal-200 rounded-lg bg-white shadow-sm">
      <div className="p-3">
        {/* Header Row - Product Link */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-teal-50 rounded border border-teal-200">
          <Package2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
          {item.product_id ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-teal-800 text-sm">{item.product?.name || t('unknownProduct')}</span>
                <div className="text-xs text-teal-600 truncate">
                  {item.product?.category} • {item.product?.company || 'No Company'}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-teal-600 font-medium">
                  {item.product?.price?.toFixed(2)} DH
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUnlink}
                  className="h-6 px-2 text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <Select value="" onValueChange={handleProductLink}>
              <SelectTrigger className="h-8 text-sm border-teal-200 focus:border-teal-500">
                <SelectValue placeholder={t('linkToProduct') || 'Link to Product'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <ProductSelector />
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-2 items-end">
          {/* Item Name */}
          <div className="col-span-3">
            <Label className="text-xs text-teal-700 font-medium">{t('itemName') || 'Item'}</Label>
            <Input
              value={item.custom_item_name || item.product?.name || ''}
              onChange={(e) => handleInputChange('custom_item_name', e.target.value)}
              placeholder="Item name"
              className="h-8 text-sm border-teal-200 focus:border-teal-500"
            />
          </div>

          {/* Quantity */}
          <div className="col-span-1">
            <Label className="text-xs text-teal-700 font-medium">{t('qty') || 'Qty'}</Label>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              className="h-8 text-sm border-teal-200 focus:border-teal-500"
            />
          </div>

          {/* Price */}
          <div className="col-span-2">
            <Label className="text-xs text-teal-700 font-medium">{t('price') || 'Price'}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm border-teal-200 focus:border-teal-500"
            />
          </div>

          {/* Cost */}
          <div className="col-span-2">
            <Label className="text-xs text-teal-700 font-medium">{t('cost') || 'Cost'}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.cost}
              onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
              className="h-8 text-sm border-teal-200 focus:border-teal-500"
            />
          </div>

          {/* Total */}
          <div className="col-span-2">
            <Label className="text-xs text-teal-700 font-medium">{t('total') || 'Total'}</Label>
            <div className="h-8 px-3 py-1 rounded-md bg-teal-50 font-medium flex items-center border border-teal-200 text-teal-800 text-sm">
              {(item.price * item.quantity).toFixed(2)} DH
            </div>
          </div>

          {/* Profit */}
          <div className="col-span-1">
            <Label className="text-xs text-teal-700 font-medium">Profit</Label>
            <div className={`h-8 px-2 py-1 rounded-md font-medium flex items-center text-xs ${
              ((item.price - (item.cost || 0)) * item.quantity) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
            }`}>
              {((item.price - (item.cost || 0)) * item.quantity).toFixed(0)}
            </div>
          </div>

          {/* Remove Button */}
          <div className="col-span-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Bottom Row - Additional Options */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-teal-100">
          <div className="flex items-center gap-4">
            {/* Payment Status */}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id={`paid-delivery-${index}`}
                checked={item.paid_at_delivery || false}
                onChange={(e) => handleInputChange('paid_at_delivery', e.target.checked)}
                className="h-3 w-3 text-teal-600 focus:ring-teal-500 border-teal-300 rounded"
              />
              <Label htmlFor={`paid-delivery-${index}`} className="text-xs text-teal-700">
                {t('paidAtDelivery') || 'Paid at Delivery'}
              </Label>
            </div>

            {/* Eye Linking for Lens Products */}
            {item.product?.category?.includes('Lenses') && (
              <div className="flex items-center gap-1">
                <Label className="text-xs text-teal-700">{t('eye') || 'Eye'}</Label>
                <Select
                  value={item.linked_eye || 'none'}
                  onValueChange={(value) => handleInputChange('linked_eye', value === 'none' ? null : value)}
                >
                  <SelectTrigger className="w-16 h-6 text-xs border-teal-200 focus:border-teal-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none') || 'None'}</SelectItem>
                    <SelectItem value="RE">RE</SelectItem>
                    <SelectItem value="LE">LE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ItemCard.displayName = 'ItemCard';

const ReceiptEditDialog = ({ isOpen, onClose, receipt }: ReceiptEditDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    right_eye_sph: '',
    right_eye_cyl: '',
    right_eye_axe: '',
    left_eye_sph: '',
    left_eye_cyl: '',
    left_eye_axe: '',
    add: '',
    montage_costs: 0,
    total_discount: 0,
    tax: 0,
    advance_payment: 0,
    delivery_status: '',
    montage_status: '',
    order_type: '',
    items: [] as any[],
    total: 0,
    created_at: ''
  });

  // Memoized calculations
  const itemsTotal = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal + (formData.tax || 0) - (formData.total_discount || 0);
  }, [formData.items, formData.tax, formData.total_discount]);

  // Update total when itemsTotal changes
  useEffect(() => {
    if (formData.items.length > 0) {
      setFormData(prev => ({ ...prev, total: itemsTotal }));
    }
  }, [itemsTotal]);

  // Optimized handlers with useCallback
  const handleUpdateItem = useCallback((index: number, updates: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item)
    }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  const handleAddItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: null,
        custom_item_name: '',
        price: 0,
        cost: 0,
        quantity: 1,
        paid_at_delivery: false,
        linked_eye: null
      }]
    }));
  }, []);

  const handleFormFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    const loadReceiptData = async () => {
      if (receipt) {
        // Fetch full receipt data with product information and client data
        const { data: fullReceipt, error } = await supabase
          .from('receipts')
          .select(`
            *,
            clients!client_id (
              id,
              name,
              phone
            ),
            receipt_items (
              *,
              product:product_id (
                id,
                name,
                category,
                company,
                price,
                cost_ttc,
                stock_status
              )
            )
          `)
          .eq('id', receipt.id)
          .single();

        if (error) {
          console.error('Error fetching receipt details:', error);
          return;
        }

        // Use client data from clients table if available, otherwise fallback to receipt fields
        const clientName = fullReceipt.clients?.name || fullReceipt.client_name || '';
        const clientPhone = fullReceipt.clients?.phone || fullReceipt.client_phone || '';

        setFormData({
          client_name: clientName,
          client_phone: clientPhone,
          right_eye_sph: fullReceipt.right_eye_sph !== null ? String(fullReceipt.right_eye_sph) : '',
          right_eye_cyl: fullReceipt.right_eye_cyl !== null ? String(fullReceipt.right_eye_cyl) : '',
          right_eye_axe: fullReceipt.right_eye_axe !== null ? String(fullReceipt.right_eye_axe) : '',
          left_eye_sph: fullReceipt.left_eye_sph !== null ? String(fullReceipt.left_eye_sph) : '',
          left_eye_cyl: fullReceipt.left_eye_cyl !== null ? String(fullReceipt.left_eye_cyl) : '',
          left_eye_axe: fullReceipt.left_eye_axe !== null ? String(fullReceipt.left_eye_axe) : '',
          add: fullReceipt.add !== null ? String(fullReceipt.add) : '',
          montage_costs: fullReceipt.montage_costs || 0,
          total_discount: fullReceipt.total_discount || 0,
          tax: fullReceipt.tax || 0,
          advance_payment: fullReceipt.advance_payment || 0,
          delivery_status: fullReceipt.delivery_status || '',
          montage_status: fullReceipt.montage_status || '',
          order_type: fullReceipt.order_type || '',
          items: (fullReceipt.receipt_items || []).map(item => ({
            ...item,
            paid_at_delivery: Boolean(item.paid_at_delivery),
            product: item.product // This will now contain the full product data
          })),
          total: fullReceipt.total || 0,
          created_at: fullReceipt.created_at ? new Date(fullReceipt.created_at).toISOString().slice(0, 16) : ''
        });
      }
    };

    if (isOpen && receipt) {
      loadReceiptData();
    }
  }, [receipt, isOpen]);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const totalProductsCost = formData.items.reduce((sum, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0);
      const costTtc = totalProductsCost + (formData.montage_costs || 0);
      const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + (formData.tax || 0) - (formData.total_discount || 0);

      // Calculate paid_at_delivery_cost
      const paidAtDeliveryCost = formData.items.reduce((sum, item) => {
        if (item.paid_at_delivery) {
          return sum + ((item.cost || 0) * (item.quantity || 1));
        }
        return sum;
      }, 0);

      const { error: receiptError } = await supabase
        .from('receipts')
        .update({
          right_eye_sph: formData.right_eye_sph ? parseFloat(formData.right_eye_sph) : null,
          right_eye_cyl: formData.right_eye_cyl ? parseFloat(formData.right_eye_cyl) : null,
          right_eye_axe: formData.right_eye_axe ? parseInt(formData.right_eye_axe) : null,
          left_eye_sph: formData.left_eye_sph ? parseFloat(formData.left_eye_sph) : null,
          left_eye_cyl: formData.left_eye_cyl ? parseFloat(formData.left_eye_cyl) : null,
          left_eye_axe: formData.left_eye_axe ? parseInt(formData.left_eye_axe) : null,
          add: formData.add ? parseFloat(formData.add) : null,
          montage_costs: formData.montage_costs,
          advance_payment: formData.advance_payment,
          delivery_status: formData.delivery_status,
          montage_status: formData.montage_status,
          order_type: formData.order_type,
          products_cost: totalProductsCost,
          cost_ttc: costTtc,
          total: total,
          paid_at_delivery_cost: paidAtDeliveryCost,
          total_discount: formData.total_discount || 0,
          tax: formData.tax || 0,
          created_at: formData.created_at ? new Date(formData.created_at).toISOString() : null
        })
        .eq('id', receipt.id);

      if (receiptError) throw receiptError;

      // Update client table if client_id exists
      if (receipt.client_id) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            name: formData.client_name,
            phone: formData.client_phone
          })
          .eq('id', receipt.client_id);

        if (clientError) throw clientError;
      }

      // Prepare items for update. Differentiate between existing and new items.
      const itemsToUpdate = formData.items.filter(item => item.id);
      const newItems = formData.items.filter(item => !item.id);

      // Update existing items
      for (const item of itemsToUpdate) {
        const { error: itemError } = await supabase
          .from('receipt_items')
          .update({
            product_id: item.product_id || null,
            custom_item_name: item.custom_item_name,
            price: item.price || 0,
            cost: item.cost || 0,
            quantity: item.quantity || 1,
            paid_at_delivery: Boolean(item.paid_at_delivery),
            linked_eye: item.linked_eye || null,
            profit: ((item.price || 0) - (item.cost || 0)) * (item.quantity || 1)
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      // Insert new items
      for (const item of newItems) {
        const { error: itemError } = await supabase
          .from('receipt_items')
          .insert({
            receipt_id: receipt.id,
            user_id: receipt.user_id, // Add user_id which is required
            product_id: item.product_id || null,
            custom_item_name: item.custom_item_name || null,
            price: item.price || 0,
            cost: item.cost || 0,
            quantity: item.quantity || 1,
            paid_at_delivery: Boolean(item.paid_at_delivery),
            linked_eye: item.linked_eye || null,
            profit: ((item.price || 0) - (item.cost || 0)) * (item.quantity || 1),
            is_deleted: false
          });

        if (itemError) {
          console.error('Error inserting new item:', itemError);
          throw itemError;
        }
      }

      toast({
        title: t('success'),
        description: t('receiptUpdatedSuccessfully'),
      });

      queryClient.invalidateQueries(['receipts']);
      onClose();
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast({
        title: t('error'),
        description: t('failedToUpdateReceipt'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, receipt, t, toast, queryClient, onClose]);

  if (!receipt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-teal-100 pb-4 mb-6">
          <DialogTitle className="text-3xl font-bold text-teal-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Edit className="h-6 w-6 text-teal-600" />
            </div>
            {t('editReceipt') || 'Edit Receipt'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="client-prescription" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-teal-50 border border-teal-200">
            <TabsTrigger value="client-prescription" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Client & Prescription
            </TabsTrigger>
            <TabsTrigger value="status-financial" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Receipt className="h-4 w-4 mr-2" />
              Status & Financial
            </TabsTrigger>
            <TabsTrigger value="items" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Package2 className="h-4 w-4 mr-2" />
              Items
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="client-prescription" className="flex-1 overflow-auto mt-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Client Information */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200">
                  <CardTitle className="text-teal-800 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('clientInformation') || 'Client Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-teal-700 font-medium">{t('name') || 'Name'}</Label>
                      <Input
                        value={formData.client_name}
                        onChange={(e) => handleFormFieldChange('client_name', e.target.value)}
                        className="border-teal-200 focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-teal-700 font-medium">{t('phone') || 'Phone'}</Label>
                      <Input
                        value={formData.client_phone}
                        onChange={(e) => handleFormFieldChange('client_phone', e.target.value)}
                        className="border-teal-200 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prescription */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200">
                  <CardTitle className="text-teal-800 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {t('prescriptionDetails') || 'Prescription Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-teal-700">{t('rightEye') || 'Right Eye'}</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-teal-700 font-medium">SPH</Label>
                          <Input
                            value={formData.right_eye_sph}
                            onChange={(e) => handleFormFieldChange('right_eye_sph', e.target.value)}
                            className="border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-teal-700 font-medium">CYL</Label>
                          <Input
                            value={formData.right_eye_cyl}
                            onChange={(e) => handleFormFieldChange('right_eye_cyl', e.target.value)}
                            className="border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-teal-700 font-medium">AXE</Label>
                          <Input
                            value={formData.right_eye_axe}
                            onChange={(e) => handleFormFieldChange('right_eye_axe', e.target.value)}
                            className="border-teal-200 focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-teal-700">{t('leftEye') || 'Left Eye'}</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-teal-700 font-medium">SPH</Label>
                          <Input
                            value={formData.left_eye_sph}
                            onChange={(e) => handleFormFieldChange('left_eye_sph', e.target.value)}
                            className="border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-teal-700 font-medium">CYL</Label>
                          <Input
                            value={formData.left_eye_cyl}
                            onChange={(e) => handleFormFieldChange('left_eye_cyl', e.target.value)}
                            className="border-teal-200 focus:border-teal-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-teal-700 font-medium">AXE</Label>
                          <Input
                            value={formData.left_eye_axe}
                            onChange={(e) => handleFormFieldChange('left_eye_axe', e.target.value)}
                            className="border-teal-200 focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Label className="text-teal-700 font-medium">ADD</Label>
                    <Input
                      value={formData.add}
                      onChange={(e) => handleFormFieldChange('add', e.target.value)}
                      className="mt-2 w-1/3 border-teal-200 focus:border-teal-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="status-financial" className="flex-1 overflow-auto mt-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Status Information */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200">
                  <CardTitle className="text-teal-800 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    {t('orderStatus') || 'Order Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('deliveryStatus') || 'Delivery Status'}</Label>
                    <Select
                      value={formData.delivery_status}
                      onValueChange={(value) => handleFormFieldChange('delivery_status', value)}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500">
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Undelivered">{t('undelivered')}</SelectItem>
                        <SelectItem value="Completed">{t('completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('orderType') || 'Order Type'}</Label>
                    <Select
                      value={formData.order_type || 'Unspecified'}
                      onValueChange={(value) => handleFormFieldChange('order_type', value)}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500">
                        <SelectValue placeholder={t('selectOrderType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unspecified">{t('unspecified')}</SelectItem>
                        <SelectItem value="Montage">{t('montage')}</SelectItem>
                        <SelectItem value="Retoyage">{t('retoyage')}</SelectItem>
                        <SelectItem value="Sell">{t('sell')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('montageStatus') || 'Montage Status'}</Label>
                    <Select
                      value={formData.montage_status}
                      onValueChange={(value) => handleFormFieldChange('montage_status', value)}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500">
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UnOrdered">{t('unOrdered')}</SelectItem>
                        <SelectItem value="Ordered">{t('ordered')}</SelectItem>
                        <SelectItem value="InStore">{t('inStore')}</SelectItem>
                        <SelectItem value="InCutting">{t('inCutting')}</SelectItem>
                        <SelectItem value="Ready">{t('ready')}</SelectItem>
                        <SelectItem value="Paid costs">{t('paidCosts')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('createdAt') || 'Created At'}</Label>
                    <Input
                      type="datetime-local"
                      value={formData.created_at}
                      onChange={(e) => handleFormFieldChange('created_at', e.target.value)}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200">
                  <CardTitle className="text-teal-800 flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    {t('financialDetails') || 'Financial Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('additionalCosts') || 'Additional Costs'}</Label>
                    <Input
                      type="number"
                      value={formData.montage_costs}
                      onChange={(e) => handleFormFieldChange('montage_costs', parseFloat(e.target.value) || 0)}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('totalDiscount') || 'Total Discount'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_discount || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        handleFormFieldChange('total_discount', isNaN(value) ? 0 : value);
                      }}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('tax') || 'Tax'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.tax || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        handleFormFieldChange('tax', isNaN(value) ? 0 : value);
                      }}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium">{t('advancePayment') || 'Advance Payment'}</Label>
                    <Input
                      type="number"
                      value={formData.advance_payment}
                      onChange={(e) => handleFormFieldChange('advance_payment', parseFloat(e.target.value) || 0)}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>

                  {/* Financial Summary */}
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200 mt-6">
                    <h4 className="font-semibold mb-3 text-teal-800">{t('summary') || 'Summary'}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-teal-600">{t('total') || 'Total'}:</span>
                        <span className="font-medium text-teal-800">{itemsTotal.toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="flex-1 overflow-auto mt-6">
            <Card className="border-teal-200 shadow-sm h-full">
              <CardHeader className="bg-teal-50 border-b border-teal-200 flex flex-row items-center justify-between">
                <CardTitle className="text-teal-800 flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  {t('items') || 'Items'}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold text-teal-700">
                    {t('total') || 'Total'}: {itemsTotal.toFixed(2)} DH
                  </div>
                  <Button onClick={handleAddItem} size="sm" className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addItem') || 'Add Item'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <ItemCard 
                      key={`${item.id || 'new'}-${index}`}
                      item={item}
                      index={index}
                      onUpdateItem={handleUpdateItem}
                      onRemoveItem={handleRemoveItem}
                      t={t}
                    />
                  ))}

                  {formData.items.length === 0 && (
                    <div className="text-center py-8 text-teal-500">
                      <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('noItemsAdded') || 'No items added yet'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-teal-100 mt-auto">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            {loading ? 'Updating...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('updateReceipt') || 'Update Receipt'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ReceiptEditDialog);
