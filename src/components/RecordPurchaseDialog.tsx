
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { format } from 'date-fns';
import { Calculator, User, CreditCard, Calendar, RotateCcw, Receipt, Link } from 'lucide-react';

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
  linking_category?: string;
  tax_percentage?: number;
  link_date_from?: string;
  link_date_to?: string;
  linked_receipts?: string[];
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
  { value: 'none', label: 'None' },
  { value: '1_month', label: '1 Month' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' }
];

const PURCHASE_TYPES = [
  'Operational Expenses',
  'Capital Expenditure'
];

const LINKING_CATEGORIES = [
  { value: '', label: 'No Linking' },
  { value: 'montage_costs', label: 'Montage Costs' },
  { value: 'product_costs', label: 'Product Costs (Future)' },
  { value: 'total_costs', label: 'Total Costs (Future)' }
];

const RecordPurchaseDialog: React.FC<RecordPurchaseDialogProps> = ({
  isOpen,
  onClose,
  suppliers = [],
  onSuccess,
  editingPurchase
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with default values to prevent undefined issues
  const getInitialFormData = () => ({
    description: '',
    amount_ht: '',
    amount_ttc: '',
    tax_percentage: '20',
    supplier_id: '',
    category: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'Cash',
    notes: '',
    advance_payment: '0',
    payment_status: 'Unpaid',
    payment_urgency: '',
    recurring_type: 'none',
    purchase_type: 'Operational Expenses',
    linking_category: '',
    link_date_from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    link_date_to: format(new Date(), 'yyyy-MM-dd')
  });

  const [formData, setFormData] = useState(getInitialFormData());

  // Reset form when dialog opens/closes or when editing purchase changes
  useEffect(() => {
    if (isOpen) {
      if (editingPurchase) {
        setFormData({
          description: editingPurchase.description || '',
          amount_ht: (editingPurchase.amount_ht || editingPurchase.amount || 0).toString(),
          amount_ttc: (editingPurchase.amount_ttc || editingPurchase.amount || 0).toString(),
          tax_percentage: (editingPurchase.tax_percentage || 20).toString(),
          supplier_id: editingPurchase.supplier_id || '',
          category: editingPurchase.category || '',
          purchase_date: editingPurchase.purchase_date ? format(new Date(editingPurchase.purchase_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          payment_method: editingPurchase.payment_method || 'Cash',
          notes: editingPurchase.notes || '',
          advance_payment: (editingPurchase.advance_payment || 0).toString(),
          payment_status: editingPurchase.payment_status || 'Unpaid',
          payment_urgency: editingPurchase.payment_urgency ? format(new Date(editingPurchase.payment_urgency), 'yyyy-MM-dd') : '',
          recurring_type: editingPurchase.recurring_type || 'none',
          purchase_type: editingPurchase.purchase_type || 'Operational Expenses',
          linking_category: editingPurchase.linking_category || '',
          link_date_from: editingPurchase.link_date_from || format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
          link_date_to: editingPurchase.link_date_to || format(new Date(), 'yyyy-MM-dd')
        });
      } else {
        setFormData(getInitialFormData());
      }
    }
  }, [isOpen, editingPurchase]);

  // Calculation helpers
  const calculateAmountTTC = (amountHT: number, taxPercentage: number): number => {
    return amountHT * (1 + taxPercentage / 100);
  };

  const calculateAmountHT = (amountTTC: number, taxPercentage: number): number => {
    return amountTTC / (1 + taxPercentage / 100);
  };

  const calculateBalance = (): number => {
    const amountTTC = parseFloat(formData.amount_ttc) || 0;
    const advancePayment = parseFloat(formData.advance_payment) || 0;
    return Math.max(0, amountTTC - advancePayment);
  };

  const calculatePaymentStatus = (): string => {
    const amountTTC = parseFloat(formData.amount_ttc) || 0;
    const advancePayment = parseFloat(formData.advance_payment) || 0;

    if (amountTTC === 0) return 'Unpaid';
    if (advancePayment >= amountTTC) return 'Paid';
    if (advancePayment > 0) return 'Partially Paid';
    return 'Unpaid';
  };

  // Event handlers
  const handleAmountHTChange = (value: string) => {
    const amountHT = parseFloat(value) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

    setFormData(prev => {
      const newData = { ...prev, amount_ht: value };
      
      if (amountHT > 0 && taxPercentage >= 0) {
        const calculatedTTC = calculateAmountTTC(amountHT, taxPercentage);
        newData.amount_ttc = calculatedTTC.toFixed(2);
      }
      
      return newData;
    });
  };

  const handleAmountTTCChange = (value: string) => {
    const amountTTC = parseFloat(value) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

    setFormData(prev => {
      const newData = { ...prev, amount_ttc: value };
      
      if (amountTTC > 0 && taxPercentage >= 0) {
        const calculatedHT = calculateAmountHT(amountTTC, taxPercentage);
        newData.amount_ht = calculatedHT.toFixed(2);
      }
      
      return newData;
    });
  };

  const handleTaxPercentageChange = (value: string) => {
    const taxPercentage = parseFloat(value) || 0;
    const amountHT = parseFloat(formData.amount_ht) || 0;

    setFormData(prev => {
      const newData = { ...prev, tax_percentage: value };
      
      if (amountHT > 0 && taxPercentage >= 0) {
        const calculatedTTC = calculateAmountTTC(amountHT, taxPercentage);
        newData.amount_ttc = calculatedTTC.toFixed(2);
      }
      
      return newData;
    });
  };

  const handleAdvancePaymentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      advance_payment: value,
      payment_status: calculatePaymentStatus()
    }));
  };

  const calculateNextRecurringDate = (purchaseDate: string, recurringType: string): string | null => {
    if (!recurringType || recurringType === 'none') return null;

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

  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      });
      return false;
    }

    const amountHt = parseFloat(formData.amount_ht);
    const amountTtc = parseFloat(formData.amount_ttc);
    const advancePayment = parseFloat(formData.advance_payment) || 0;

    if (!amountHt || !amountTtc || amountHt <= 0 || amountTtc <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid amounts for both HT and TTC",
        variant: "destructive",
      });
      return false;
    }

    if (amountTtc < amountHt) {
      toast({
        title: "Error",
        description: "TTC amount cannot be less than HT amount",
        variant: "destructive",
      });
      return false;
    }

    if (advancePayment > amountTtc) {
      toast({
        title: "Error",
        description: "Advance payment cannot exceed TTC amount",
        variant: "destructive",
      });
      return false;
    }

    // Validate linking dates if linking is enabled
    if (formData.linking_category && (!formData.link_date_from || !formData.link_date_to)) {
      toast({
        title: "Error",
        description: "Please provide both start and end dates for receipt linking",
        variant: "destructive",
      });
      return false;
    }

    if (formData.link_date_from && formData.link_date_to && new Date(formData.link_date_from) > new Date(formData.link_date_to)) {
      toast({
        title: "Error",
        description: "Link start date cannot be after end date",
        variant: "destructive",
      });
      return false;
    }

    return true;
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

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const amountHt = parseFloat(formData.amount_ht);
      const amountTtc = parseFloat(formData.amount_ttc);
      const advancePayment = parseFloat(formData.advance_payment) || 0;
      const taxPercentage = parseFloat(formData.tax_percentage) || 0;
      const balance = calculateBalance();
      const paymentStatus = calculatePaymentStatus();
      const nextRecurringDate = calculateNextRecurringDate(formData.purchase_date, formData.recurring_type);

      const purchaseData = {
        user_id: user.id,
        description: formData.description.trim(),
        amount_ht: amountHt,
        amount_ttc: amountTtc,
        amount: amountTtc, // Keep for backward compatibility
        tax_percentage: taxPercentage,
        supplier_id: formData.supplier_id || null,
        category: formData.category || null,
        purchase_date: formData.purchase_date,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        advance_payment: advancePayment,
        balance: balance,
        payment_status: paymentStatus,
        payment_urgency: formData.payment_urgency || null,
        recurring_type: formData.recurring_type === 'none' ? null : formData.recurring_type,
        next_recurring_date: nextRecurringDate,
        purchase_type: formData.purchase_type,
        linking_category: formData.linking_category || null,
        link_date_from: formData.linking_category ? formData.link_date_from : null,
        link_date_to: formData.linking_category ? formData.link_date_to : null,
        is_deleted: false
      };

      if (editingPurchase) {
        // Update existing purchase
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editingPurchase.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase updated successfully",
        });
      } else {
        // Insert new purchase
        const { error } = await supabase
          .from('purchases')
          .insert(purchaseData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Purchase recorded successfully",
        });
      }

      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error saving purchase:', error);
      toast({
        title: "Error",
        description: "Failed to save purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Receipt className="h-5 w-5 text-primary" />
            {editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Supplier</SelectItem>
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
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
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
                    <SelectTrigger className="mt-1">
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
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-4 w-4" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_percentage}
                    onChange={(e) => handleTaxPercentageChange(e.target.value)}
                    placeholder="20.00"
                    disabled={isSubmitting}
                    className="mt-1"
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
                    onChange={(e) => handleAmountHTChange(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                    className="mt-1"
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
                    onChange={(e) => handleAmountTTCChange(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advance_payment">Advance Payment</Label>
                  <Input
                    id="advance_payment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.advance_payment}
                    onChange={(e) => handleAdvancePaymentChange(e.target.value)}
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="balance">Balance (Calculated)</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={calculateBalance().toFixed(2)}
                    placeholder="0.00"
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="payment_status">Payment Status (Auto-calculated)</Label>
                  <Input
                    value={calculatePaymentStatus()}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Recurring Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4" />
                Date & Recurring Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="payment_urgency">Payment Due Date</Label>
                  <Input
                    id="payment_urgency"
                    type="date"
                    value={formData.payment_urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_urgency: e.target.value }))}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="recurring_type" className="flex items-center gap-2">
                    <RotateCcw className="h-3 w-3" />
                    Recurring Type
                  </Label>
                  <Select
                    value={formData.recurring_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_type: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select recurring period" />
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
              </div>
            </CardContent>
          </Card>

          {/* Receipt Linking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link className="h-4 w-4" />
                Receipt Linking (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linking_category">Linking Category</Label>
                <Select
                  value={formData.linking_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, linking_category: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select linking category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINKING_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.linking_category && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link_date_from">Link From Date</Label>
                    <Input
                      id="link_date_from"
                      type="date"
                      value={formData.link_date_from}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_date_from: e.target.value }))}
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_date_to">Link To Date</Label>
                    <Input
                      id="link_date_to"
                      type="date"
                      value={formData.link_date_to}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_date_to: e.target.value }))}
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              {editingPurchase?.linked_receipts && editingPurchase.linked_receipts.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    Currently linked to {editingPurchase.linked_receipts.length} receipt(s)
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Linking settings will be updated when you save this purchase
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this purchase (optional)"
                rows={3}
                disabled={isSubmitting}
                className="mt-1"
              />
            </CardContent>
          </Card>

          <DialogFooter className="pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.description.trim() || !formData.amount_ht || !formData.amount_ttc}
              className="min-w-[150px]"
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
