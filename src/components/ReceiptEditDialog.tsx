import React, { useState, useEffect } from 'react';
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
import { Card, CardContent } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { User, Eye, Package2, Receipt, Banknote, FileText, Search, Trash } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ReceiptEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

const ProductSelector = () => {
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
    enabled: true
  });

  return (
    <>
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchProducts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
};

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
    note: '',
    items: [] as any[],
    total: 0
  });

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
          note: fullReceipt.note || '',
          items: (fullReceipt.receipt_items || []).map(item => ({
            ...item,
            paid_at_delivery: Boolean(item.paid_at_delivery),
            product: item.product // This will now contain the full product data
          })),
          total: fullReceipt.total || 0
        });
      }
    };

    loadReceiptData();
  }, [receipt]);

  const handleSubmit = async () => {
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
          note: formData.note,
          products_cost: totalProductsCost,
          cost_ttc: costTtc,
          total: total,
          paid_at_delivery_cost: paidAtDeliveryCost
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
  };

  const calculateItemsTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + (formData.tax || 0) - (formData.total_discount || 0);
    return total;
  };

  const handleAddItem = () => {
    // Add a new empty item to the form data
    setFormData({
      ...formData,
      items: [...formData.items, {
        product_id: null,
        custom_item_name: '',
        price: 0,
        cost: 0,
        quantity: 1,
        paid_at_delivery: false,
        linked_eye: null
      }]
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            {t('editReceipt')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t('clientInformation')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('name')}</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('phone')}</Label>
                  <Input
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t('prescriptionDetails')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">{t('rightEye')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>SPH</Label>
                      <Input
                        value={formData.right_eye_sph}
                        onChange={(e) => setFormData({ ...formData, right_eye_sph: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>CYL</Label>
                      <Input
                        value={formData.right_eye_cyl}
                        onChange={(e) => setFormData({ ...formData, right_eye_cyl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>AXE</Label>
                      <Input
                        value={formData.right_eye_axe}
                        onChange={(e) => setFormData({ ...formData, right_eye_axe: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">{t('leftEye')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>SPH</Label>
                      <Input
                        value={formData.left_eye_sph}
                        onChange={(e) => setFormData({ ...formData, left_eye_sph: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>CYL</Label>
                      <Input
                        value={formData.left_eye_cyl}
                        onChange={(e) => setFormData({ ...formData, left_eye_cyl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>AXE</Label>
                      <Input
                        value={formData.left_eye_axe}
                        onChange={(e) => setFormData({ ...formData, left_eye_axe: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 w-1/3">
                <Label>ADD</Label>
                <Input
                  value={formData.add}
                  onChange={(e) => setFormData({ ...formData, add: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status and Financial Details */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('orderStatus')}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>{t('deliveryStatus')}</Label>
                    <Select
                      value={formData.delivery_status}
                      onValueChange={(value) => setFormData({ ...formData, delivery_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Undelivered">{t('undelivered')}</SelectItem>
                        <SelectItem value="Completed">{t('completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('orderType')}</Label>
                    <Select
                      value={formData.order_type || 'Unspecified'}
                      onValueChange={(value) => setFormData({ ...formData, order_type: value })}
                    >
                      <SelectTrigger>
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
                  <div>
                    <Label>{t('montageStatus')}</Label>
                    <Select
                      value={formData.montage_status}
                      onValueChange={(value) => setFormData({ ...formData, montage_status: value })}
                    >
                      <SelectTrigger>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Banknote className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('financialDetails')}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>{t('additionalCosts') || 'Additional Costs'}</Label>
                    <Input
                      type="number"
                      value={formData.montage_costs}
                      onChange={(e) => setFormData({ ...formData, montage_costs: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>{t('totalDiscount')}</Label>
                    <Input
                      type="number"
                      value={formData.total_discount}
                      onChange={(e) => setFormData({ ...formData, total_discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>{t('tax')}</Label>
                    <Input
                      type="number"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>{t('advancePayment')}</Label>
                    <Input
                      type="number"
                      value={formData.advance_payment}
                      onChange={(e) => setFormData({ ...formData, advance_payment: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t('notes')}</h3>
              </div>
              <div>
                <Label>{t('additionalNotes')}</Label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                  placeholder={t('enterAdditionalNotes')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('items')}</h3>
                </div>
                <div className="text-lg font-semibold">
                  {t('total')}: {calculateItemsTotal().toFixed(2)} DH
                </div>
              </div>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <Card key={index} className="border-dashed">
                    <CardContent className="pt-4">
                      {/* Product Linking Section */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Package2 className="h-4 w-4 text-blue-600" />
                          <Label className="text-sm font-semibold">{t('productLink')}</Label>
                        </div>
                        {item.product_id ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 p-2 bg-white rounded border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{item.product?.name || t('unknownProduct')}</span>
                                  <div className="text-sm text-gray-500">
                                    {item.product?.category} • {item.product?.company || 'No Company'} • Stock: {item.product?.stock_status}
                                  </div>
                                </div>
                                <div className="text-sm text-blue-600">
                                  {item.product?.price?.toFixed(2)} DH
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                // Unlink product
                                const newItems = [...formData.items];
                                newItems[index] = { 
                                  ...item, 
                                  product_id: null, 
                                  product: null,
                                  custom_item_name: item.product?.name || item.custom_item_name || ''
                                };
                                setFormData({ ...formData, items: newItems });
                              }}
                            >
                              {t('unlink')}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select
                              value=""
                              onValueChange={async (productId) => {
                                // Fetch product details
                                const { data: product } = await supabase
                                  .from('products')
                                  .select('*')
                                  .eq('id', productId)
                                  .single();

                                if (product) {
                                  const newItems = [...formData.items];
                                  newItems[index] = { 
                                    ...item, 
                                    product_id: productId,
                                    product: product,
                                    price: product.price,
                                    cost: product.cost_ttc || 0,
                                    custom_item_name: null
                                  };
                                  setFormData({ ...formData, items: newItems });
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={t('linkToProduct')} />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {/* We'll fetch products dynamically */}
                                <ProductSelector />
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Item Details Section */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>{t('itemName')}</Label>
                          <Input
                            value={item.custom_item_name || item.product?.name || ''}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = { ...item, custom_item_name: e.target.value };
                              setFormData({ ...formData, items: newItems });
                            }}
                            placeholder={t('enterItemName')}
                          />
                        </div>
                        <div>
                          <Label>{t('quantity')}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              const newQuantity = parseInt(e.target.value) || 1;
                              newItems[index] = { ...item, quantity: newQuantity };
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                      </div>

                      {/* Financial Details Section */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label>{t('price')}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              const newPrice = parseFloat(e.target.value) || 0;
                              newItems[index] = { ...item, price: newPrice };
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                        <div>
                          <Label>{t('cost')} ({t('perUnit') || 'Per Unit'})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cost}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = { ...item, cost: parseFloat(e.target.value) || 0 };
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                        <div>
                          <Label>{t('totalCost') || 'Total Cost'}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={((item.cost || 0) * item.quantity).toFixed(2)}
                            onChange={(e) => {
                              const totalCost = parseFloat(e.target.value) || 0;
                              const costPerUnit = item.quantity > 0 ? totalCost / item.quantity : 0;
                              const newItems = [...formData.items];
                              newItems[index] = { ...item, cost: costPerUnit };
                              setFormData({ ...formData, items: newItems });
                            }}
                          />
                        </div>
                        <div>
                          <Label>{t('total')}</Label>
                          <div className="h-10 px-3 py-2 rounded-md bg-gray-50 font-medium flex items-center">
                            {(item.price * item.quantity).toFixed(2)} DH
                          </div>
                        </div>
                      </div>

                      {/* Additional Options */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Payment Status */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`paid-delivery-${index}`}
                              checked={item.paid_at_delivery || false}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index] = { ...item, paid_at_delivery: e.target.checked };
                                setFormData({ ...formData, items: newItems });
                              }}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <Label htmlFor={`paid-delivery-${index}`} className="text-sm">
                              {t('paidAtDelivery')}
                            </Label>
                          </div>

                          {/* Eye Linking for Lens Products */}
                          {item.product?.category?.includes('Lenses') && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">{t('eye')}</Label>
                              <Select
                                value={item.linked_eye || 'none'}
                                onValueChange={(value) => {
                                  const newItems = [...formData.items];
                                  newItems[index] = { 
                                    ...item, 
                                    linked_eye: value === 'none' ? null : value 
                                  };
                                  setFormData({ ...formData, items: newItems });
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">{t('none')}</SelectItem>
                                  <SelectItem value="RE">RE</SelectItem>
                                  <SelectItem value="LE">LE</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Profit Display and Remove Button */}
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-gray-500">{t('profit')} </span>
                            <span className={`font-medium ${((item.price - (item.cost || 0)) * item.quantity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {((item.price - (item.cost || 0)) * item.quantity).toFixed(2)} DH
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newItems = formData.items.filter((_, i) => i !== index);
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Item Button */}
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddItem}
              >
                {t('addItem')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? t('updating') : t('updateReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptEditDialog;