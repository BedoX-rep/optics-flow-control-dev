
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

interface Purchase {
  id: string;
  supplier_id?: string;
  description: string;
  amount: number;
  amount_ht?: number;
  amount_ttc?: number;
  category?: string;
  purchase_date: string;
  receipt_number?: string;
  payment_method: string;
  notes?: string;
  advance_payment?: number;
  balance?: number;
  payment_status?: string;
  payment_urgency?: string;
  recurring_type?: string;
  next_recurring_date?: string;
  purchase_type?: string;
  created_at: string;
}

interface RecordPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSuccess: () => void;
  editingPurchase?: Purchase | null;
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
  'Loan',
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

const RECURRING_TYPES = [
  { value: '1_month', label: '1 Month' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' }
];

const PURCHASE_TYPES = [
  'Operational Expenses',
  'Capital Expenditure'
];

const RecordPurchaseDialog: React.FC<RecordPurchaseDialogProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSuccess,
  editingPurchase
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
    notes: '',
    advance_payment: '',
    balance: '',
    payment_status: 'Unpaid',
    payment_urgency: '',
    recurring_type: '',
    purchase_type: 'Operational Expenses'
  });

  // Initialize form with editing purchase data
  React.useEffect(() => {
    if (editingPurchase) {
      setFormData({
        description: editingPurchase.description,
        amount_ht: (editingPurchase.amount_ht || editingPurchase.amount).toString(),
        amount_ttc: (editingPurchase.amount_ttc || editingPurchase.amount).toString(),
        supplier_id: editingPurchase.supplier_id || '',
        category: editingPurchase.category || '',
        purchase_date: format(new Date(editingPurchase.purchase_date), 'yyyy-MM-dd'),
        payment_method: editingPurchase.payment_method,
        notes: editingPurchase.notes || '',
        advance_payment: (editingPurchase.advance_payment || 0).toString(),
        balance: (editingPurchase.balance || 0).toString(),
        payment_status: editingPurchase.payment_status || 'Unpaid',
        payment_urgency: editingPurchase.payment_urgency ? format(new Date(editingPurchase.payment_urgency), 'yyyy-MM-dd') : '',
        recurring_type: editingPurchase.recurring_type || '',
        purchase_type: editingPurchase.purchase_type || 'Operational Expenses'
      });
    } else {
      resetForm();
    }
  }, [editingPurchase]);

  const resetForm = () => {
    setFormData({
      description: '',
      amount_ht: '',
      amount_ttc: '',
      supplier_id: '',
      category: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Cash',
      notes: '',
      advance_payment: '',
      balance: '',
      payment_status: 'Unpaid',
      payment_urgency: '',
      recurring_type: '',
      purchase_type: 'Operational Expenses'
    });
  };

  const calculateNextRecurringDate = (purchaseDate: string, recurringType: string): string | null => {
    if (!recurringType) return null;
    
    const date = new Date(purchaseDate);
    
    switch (recurringType) {
      case '1_month':
        date.setMonth(date.getMonth() + 1);
        break;
      case '3_months':
        date.setMonth(date.getMonth() + 3);
        break;
      case '6_months':
        date.setMonth(date.getMonth() + 6);
        break;
      case '1_year':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return null;
    }
    
    return format(date, 'yyyy-MM-dd');
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
    const advancePayment = parseFloat(formData.advance_payment) || 0;
    
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

    if (advancePayment > amountTtc) {
      toast({
        title: "Error",
        description: "Advance payment cannot be more than TTC amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const balance = amountTtc - advancePayment;
      let paymentStatus = 'Unpaid';
      if (advancePayment >= amountTtc && amountTtc > 0) {
        paymentStatus = 'Paid';
      } else if (advancePayment > 0) {
        paymentStatus = 'Partially Paid';
      }

      const nextRecurringDate = calculateNextRecurringDate(formData.purchase_date, formData.recurring_type);
      
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
        advance_payment: advancePayment,
        balance: balance,
        payment_status: paymentStatus,
        payment_urgency: formData.payment_urgency || null,
        recurring_type: formData.recurring_type || null,
        next_recurring_date: nextRecurringDate,
        purchase_type: formData.purchase_type,
        is_deleted: false
      };

      if (editingPurchase) {
        // Update existing purchase
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editingPurchase.id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Purchase updated successfully",
        });
      } else {
        // Insert new purchase
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
      }

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}</DialogTitle>
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
                onChange={(e) => {
                  const newAmountHt = e.target.value;
                  setFormData(prev => {
                    const amountHt = parseFloat(newAmountHt) || 0;
                    const amountTtc = parseFloat(prev.amount_ttc) || 0;
                    const advancePayment = parseFloat(prev.advance_payment) || 0;
                    const balance = amountTtc - advancePayment;
                    return { 
                      ...prev, 
                      amount_ht: newAmountHt,
                      balance: balance.toString()
                    };
                  });
                }}
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
                onChange={(e) => {
                  const newAmountTtc = e.target.value;
                  setFormData(prev => {
                    const amountTtc = parseFloat(newAmountTtc) || 0;
                    const advancePayment = parseFloat(prev.advance_payment) || 0;
                    const balance = amountTtc - advancePayment;
                    let paymentStatus = 'Unpaid';
                    if (advancePayment >= amountTtc && amountTtc > 0) {
                      paymentStatus = 'Paid';
                    } else if (advancePayment > 0) {
                      paymentStatus = 'Partially Paid';
                    }
                    return { 
                      ...prev, 
                      amount_ttc: newAmountTtc,
                      balance: balance.toString(),
                      payment_status: paymentStatus
                    };
                  });
                }}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="advance_payment">Advance Payment</Label>
              <Input
                id="advance_payment"
                type="number"
                step="0.01"
                min="0"
                value={formData.advance_payment}
                onChange={(e) => {
                  const newAdvancePayment = e.target.value;
                  setFormData(prev => {
                    const amountTtc = parseFloat(prev.amount_ttc) || 0;
                    const advancePayment = parseFloat(newAdvancePayment) || 0;
                    const balance = amountTtc - advancePayment;
                    let paymentStatus = 'Unpaid';
                    if (advancePayment >= amountTtc && amountTtc > 0) {
                      paymentStatus = 'Paid';
                    } else if (advancePayment > 0) {
                      paymentStatus = 'Partially Paid';
                    }
                    return { 
                      ...prev, 
                      advance_payment: newAdvancePayment,
                      balance: balance.toString(),
                      payment_status: paymentStatus
                    };
                  });
                }}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="balance">Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                placeholder="0.00"
                disabled
                className="bg-gray-50"
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
              <Label htmlFor="payment_urgency">Payment Urgency</Label>
              <Input
                id="payment_urgency"
                type="date"
                value={formData.payment_urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_urgency: e.target.value }))}
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

            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recurring_type">Recurring Type</Label>
              <Select
                value={formData.recurring_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_type: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurring period (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purchase_type">Purchase Type *</Label>
              <Select
                value={formData.purchase_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, purchase_type: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
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
              {isSubmitting ? (editingPurchase ? 'Updating...' : 'Recording...') : (editingPurchase ? 'Update Purchase' : 'Record Purchase')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPurchaseDialog;
