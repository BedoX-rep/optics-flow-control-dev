
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
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Package2, User, Receipt, Banknote, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    order_type: '',
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
        order_type: receipt.order_type || '',
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
          order_type: formData.order_type,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Edit Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {/* Left Column - Client & Status */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" /> Client Details
              </div>
              <Input
                placeholder="Name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package2 className="h-4 w-4" /> Order Status
              </div>
              <Select
                value={formData.delivery_status}
                onValueChange={(value) => setFormData({ ...formData, delivery_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Delivery Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Undelivered">Undelivered</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.order_type || 'Unspecified'}
                onValueChange={(value) => setFormData({ ...formData, order_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unspecified">Unspecified</SelectItem>
                  <SelectItem value="Montage">Montage</SelectItem>
                  <SelectItem value="Retoyage">Retoyage</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.montage_status}
                onValueChange={(value) => setFormData({ ...formData, montage_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Montage Status" />
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

          {/* Middle Column - Prescription */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" /> Prescription
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Right Eye</Label>
                <Input
                  placeholder="SPH"
                  value={formData.right_eye_sph}
                  onChange={(e) => setFormData({ ...formData, right_eye_sph: e.target.value })}
                />
                <Input
                  placeholder="CYL"
                  value={formData.right_eye_cyl}
                  onChange={(e) => setFormData({ ...formData, right_eye_cyl: e.target.value })}
                />
                <Input
                  placeholder="AXE"
                  value={formData.right_eye_axe}
                  onChange={(e) => setFormData({ ...formData, right_eye_axe: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Left Eye</Label>
                <Input
                  placeholder="SPH"
                  value={formData.left_eye_sph}
                  onChange={(e) => setFormData({ ...formData, left_eye_sph: e.target.value })}
                />
                <Input
                  placeholder="CYL"
                  value={formData.left_eye_cyl}
                  onChange={(e) => setFormData({ ...formData, left_eye_cyl: e.target.value })}
                />
                <Input
                  placeholder="AXE"
                  value={formData.left_eye_axe}
                  onChange={(e) => setFormData({ ...formData, left_eye_axe: e.target.value })}
                />
              </div>
            </div>
            
            <div className="pt-2">
              <Label className="text-xs">ADD</Label>
              <Input
                value={formData.add}
                onChange={(e) => setFormData({ ...formData, add: e.target.value })}
              />
            </div>
          </div>

          {/* Right Column - Financial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Banknote className="h-4 w-4" /> Financial Details
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Montage Costs"
                value={formData.montage_costs}
                onChange={(e) => setFormData({ ...formData, montage_costs: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                placeholder="Total Discount"
                value={formData.total_discount}
                onChange={(e) => setFormData({ ...formData, total_discount: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                placeholder="Advance Payment"
                value={formData.advance_payment}
                onChange={(e) => setFormData({ ...formData, advance_payment: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package2 className="h-4 w-4" /> Items
            </div>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-center bg-muted/30 p-2 rounded-lg">
                <Input
                  className="col-span-2"
                  placeholder="Name"
                  value={item.custom_item_name || item.product?.name || ''}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index] = { ...item, custom_item_name: e.target.value };
                    setFormData({ ...formData, items: newItems });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index] = { ...item, quantity: parseInt(e.target.value) || 1 };
                    setFormData({ ...formData, items: newItems });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index] = { ...item, price: parseFloat(e.target.value) || 0 };
                    setFormData({ ...formData, items: newItems });
                  }}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Cost"
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
          </div>
          
          <div className="flex justify-end text-sm font-medium">
            Total: {formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} DH
          </div>
        </div>

        <DialogFooter className="mt-4">
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
