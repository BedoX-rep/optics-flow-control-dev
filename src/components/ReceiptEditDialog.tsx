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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Package2, User, Receipt, Banknote } from "lucide-react";

interface ReceiptEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

const ReceiptEditDialog = ({ isOpen, onClose, receipt }: ReceiptEditDialogProps) => {
  const { toast } = useToast();
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
    advance_payment: 0,
    delivery_status: '',
    montage_status: '',
    items: [] as any[],
    total: 0
  });

  useEffect(() => {
    if (receipt) {
      setFormData({
        client_name: receipt.client_name || '',
        client_phone: receipt.client_phone || '',
        right_eye_sph: receipt.right_eye_sph !== null ? String(receipt.right_eye_sph) : '',
        right_eye_cyl: receipt.right_eye_cyl !== null ? String(receipt.right_eye_cyl) : '',
        right_eye_axe: receipt.right_eye_axe !== null ? String(receipt.right_eye_axe) : '',
        left_eye_sph: receipt.left_eye_sph !== null ? String(receipt.left_eye_sph) : '',
        left_eye_cyl: receipt.left_eye_cyl !== null ? String(receipt.left_eye_cyl) : '',
        left_eye_axe: receipt.left_eye_axe !== null ? String(receipt.left_eye_axe) : '',
        add: receipt.add !== null ? String(receipt.add) : '',
        montage_costs: receipt.montage_costs || 0,
        total_discount: receipt.total_discount || 0,
        advance_payment: receipt.advance_payment || 0,
        delivery_status: receipt.delivery_status || '',
        montage_status: receipt.montage_status || '',
        items: receipt.receipt_items || [],
        total: receipt.total || 0
      });
    }
  }, [receipt]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const totalProductsCost = formData.items.reduce((sum, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0);
      const costTtc = totalProductsCost + (formData.montage_costs || 0);
      const total = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
          products_cost: totalProductsCost,
          cost_ttc: costTtc,
          total: total
        })
        .eq('id', receipt.id);

      if (receiptError) throw receiptError;

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

      for (const item of formData.items) {
        const { error: itemError } = await supabase
          .from('receipt_items')
          .update({
            custom_item_name: item.custom_item_name,
            price: item.price,
            cost: item.cost,
            quantity: item.quantity
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      toast({
        title: "Success",
        description: "Receipt updated successfully",
      });

      queryClient.invalidateQueries(['receipts']);
      onClose();
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to update receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateItemsTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal - (formData.total_discount || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Receipt</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Client Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Client Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
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
                <h3 className="font-semibold">Prescription</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Right Eye</h4>
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
                <div className="space-y-4">
                  <h4 className="font-medium">Left Eye</h4>
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
              <div className="mt-4">
                <Label>ADD</Label>
                <Input
                  value={formData.add}
                  onChange={(e) => setFormData({ ...formData, add: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status and Costs */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Status</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Delivery Status</Label>
                  <Select
                    value={formData.delivery_status}
                    onValueChange={(value) => setFormData({ ...formData, delivery_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Undelivered">Undelivered</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Order Type</Label>
                  <Select
                    value={formData.order_type || 'Unspecified'}
                    onValueChange={(value) => setFormData({ ...formData, order_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unspecified">Unspecified</SelectItem>
                      <SelectItem value="Montage">Montage</SelectItem>
                      <SelectItem value="Retoyage">Retoyage</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label className="mt-4">Montage Status</Label>
                  <Select
                    value={formData.montage_status}
                    onValueChange={(value) => setFormData({ ...formData, montage_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UnOrdered">UnOrdered</SelectItem>
                      <SelectItem value="Ordered">Ordered</SelectItem>
                      <SelectItem value="InStore">InStore</SelectItem>
                      <SelectItem value="InCutting">InCutting</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="Paid costs">Paid costs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Financial Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Montage Costs</Label>
                  <Input
                    type="number"
                    value={formData.montage_costs}
                    onChange={(e) => setFormData({ ...formData, montage_costs: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Total Discount</Label>
                  <Input
                    type="number"
                    value={formData.total_discount}
                    onChange={(e) => setFormData({ ...formData, total_discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Advance Payment</Label>
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

        {/* Items */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Package2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Items</h3>
            </div>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={item.custom_item_name || item.product?.name || ''}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index] = { ...item, custom_item_name: e.target.value };
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        const newQuantity = parseInt(e.target.value) || 1;
                        newItems[index] = { ...item, quantity: newQuantity };
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
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
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      value={item.cost}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index] = { ...item, cost: parseFloat(e.target.value) || 0 };
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="text-right font-medium">
                Total: {calculateItemsTotal().toFixed(2)} DH
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptEditDialog;