
import React, { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
}

interface RecordPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Equipment',
  'Software',
  'Marketing',
  'Travel',
  'Utilities',
  'Rent',
  'Professional Services',
  'Inventory',
  'Maintenance',
  'Insurance',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'Digital Wallet'
];

const RecordPurchaseDialog: React.FC<RecordPurchaseDialogProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount_ht: '',
    amount_ttc: '',
    supplier_id: '',
    category: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'Cash',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount_ht: '',
      amount_ttc: '',
      supplier_id: '',
      category: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Cash',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to record a purchase",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim() || !formData.amount_ht || !formData.amount_ttc) {
      toast({
        title: "Error",
        description: "Please fill in description, HT amount, and TTC amount",
        variant: "destructive",
      });
      return;
    }

    const amountHt = parseFloat(formData.amount_ht);
    const amountTtc = parseFloat(formData.amount_ttc);
    
    if (isNaN(amountHt) || amountHt <= 0 || isNaN(amountTtc) || amountTtc <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid amounts",
        variant: "destructive",
      });
      return;
    }

    if (amountTtc < amountHt) {
      toast({
        title: "Error",
        description: "TTC amount cannot be less than HT amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const purchaseData = {
        user_id: user.id,
        description: formData.description.trim(),
        amount_ht: amountHt,
        amount_ttc: amountTtc,
        amount: amountTtc, // Keep for backward compatibility
        supplier_id: formData.supplier_id || null,
        category: formData.category || null,
        purchase_date: formData.purchase_date,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        is_deleted: false
      };

      const { error } = await supabase
        .from('purchases')
        .insert(purchaseData);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Purchase recorded successfully",
      });

      resetForm();
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error recording purchase:', error);
      toast({
        title: "Error",
        description: "Failed to record purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Purchase</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter purchase description"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="amount_ht">Amount HT (Before Tax) *</Label>
              <Input
                id="amount_ht"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount_ht}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_ht: e.target.value }))}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="amount_ttc">Amount TTC (After Tax) *</Label>
              <Input
                id="amount_ttc"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount_ttc}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_ttc: e.target.value }))}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplier_id || undefined}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value || '' }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this purchase (optional)"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.description.trim() || !formData.amount_ht || !formData.amount_ttc}
            >
              {isSubmitting ? 'Recording...' : 'Record Purchase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPurchaseDialog;
