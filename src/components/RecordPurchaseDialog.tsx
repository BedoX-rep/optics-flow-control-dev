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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { format } from 'date-fns';
import { Calculator, User, CreditCard, Calendar, RotateCcw, Receipt } from 'lucide-react';
import { Plus, Building2 } from 'lucide-react';
import { Link } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

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
  created_at: string;
}

interface RecordPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSuccess: () => void;
  editingPurchase?: Purchase | null;
}

const RecordPurchaseDialog: React.FC<RecordPurchaseDialogProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSuccess,
  editingPurchase
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const EXPENSE_CATEGORIES = [
    t('officeSupplies'),
    t('equipment'),
    t('software'),
    t('marketing'),
    t('travel'),
    t('utilities'),
    t('rent'),
    t('professionalServices'),
    t('inventory'),
    t('maintenance'),
    t('insurance'),
    t('loan'),
    t('other')
  ];

  const PAYMENT_METHODS = [
    t('cash'),
    t('creditCard'),
    t('debitCard'),
    t('bankTransfer'),
    t('check'),
    t('digitalWallet')
  ];

  const RECURRING_TYPES = [
    { value: 'none', label: t('none') },
    { value: '1_month', label: t('oneMonth') },
    { value: '3_months', label: t('threeMonths') },
    { value: '6_months', label: t('sixMonths') },
    { value: '1_year', label: t('oneYear') }
  ];

  const PURCHASE_TYPES = [
    t('operationalExpenses'),
    t('capitalExpenditure')
  ];

  const [formData, setFormData] = useState({
    description: '',
    amount_ht: '',
    amount_ttc: '',
    tax_percentage: '20',
    supplier_id: '',
    category: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'Cash',
    notes: '',
    advance_payment: '',
    balance: '',
    payment_status: 'Unpaid',
    payment_urgency: '',
    recurring_type: 'none',
    purchase_type: 'Operational Expenses',
    linking_category: 'none',
    link_date_from: '',
    link_date_to: ''
  });

  // Initialize form with editing purchase data
  React.useEffect(() => {
    if (editingPurchase) {
      setFormData({
        description: editingPurchase.description,
        amount_ht: (editingPurchase.amount_ht || editingPurchase.amount).toString(),
        amount_ttc: (editingPurchase.amount_ttc || editingPurchase.amount).toString(),
        tax_percentage: (editingPurchase.tax_percentage || 20).toString(),
        supplier_id: editingPurchase.supplier_id || '',
        category: editingPurchase.category || '',
        purchase_date: format(new Date(editingPurchase.purchase_date), 'yyyy-MM-dd'),
        payment_method: editingPurchase.payment_method,
        notes: editingPurchase.notes || '',
        advance_payment: (editingPurchase.advance_payment || 0).toString(),
        balance: (editingPurchase.balance || 0).toString(),
        payment_status: editingPurchase.payment_status || 'Unpaid',
        payment_urgency: editingPurchase.payment_urgency ? format(new Date(editingPurchase.payment_urgency), 'yyyy-MM-dd') : '',
        recurring_type: editingPurchase.recurring_type || 'none',
        purchase_type: editingPurchase.purchase_type || 'Operational Expenses',
        linking_category: editingPurchase.linking_category || 'none',
        link_date_from: editingPurchase.link_date_from || '',
        link_date_to: editingPurchase.link_date_to || ''
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
      tax_percentage: '20',
      supplier_id: '',
      category: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Cash',
      notes: '',
      advance_payment: '',
      balance: '',
      payment_status: 'Unpaid',
      payment_urgency: '',
      recurring_type: 'none',
      purchase_type: 'Operational Expenses',
      linking_category: 'none',
      link_date_from: '',
      link_date_to: ''
    });
  };

  const calculateAmountTTC = (amountHT: number, taxPercentage: number): number => {
    return amountHT * (1 + taxPercentage / 100);
  };

  const calculateAmountHT = (amountTTC: number, taxPercentage: number): number => {
    return amountTTC / (1 + taxPercentage / 100);
  };

  const handleAmountHTChange = (value: string) => {
    const amountHT = parseFloat(value) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

    if (amountHT > 0 && taxPercentage >= 0) {
      const calculatedTTC = calculateAmountTTC(amountHT, taxPercentage);
      setFormData(prev => ({
        ...prev,
        amount_ht: value,
        amount_ttc: calculatedTTC.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ ...prev, amount_ht: value }));
    }
  };

  const handleAmountTTCChange = (value: string) => {
    const amountTTC = parseFloat(value) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

    if (amountTTC > 0 && taxPercentage >= 0) {
      const calculatedHT = calculateAmountHT(amountTTC, taxPercentage);
      setFormData(prev => ({
        ...prev,
        amount_ttc: value,
        amount_ht: calculatedHT.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ ...prev, amount_ttc: value }));
    }
  };

  const handleTaxPercentageChange = (value: string) => {
    const taxPercentage = parseFloat(value) || 0;
    const amountHT = parseFloat(formData.amount_ht) || 0;

    if (amountHT > 0 && taxPercentage >= 0) {
      const calculatedTTC = calculateAmountTTC(amountHT, taxPercentage);
      setFormData(prev => ({
        ...prev,
        tax_percentage: value,
        amount_ttc: calculatedTTC.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ ...prev, tax_percentage: value }));
    }
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
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

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
        linking_category: formData.linking_category === 'none' ? null : formData.linking_category,
        link_date_from: formData.linking_category !== 'none' && formData.link_date_from ? formData.link_date_from : null,
        link_date_to: formData.linking_category !== 'none' && formData.link_date_to ? formData.link_date_to : null,
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
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto" aria-describedby="record-purchase-description">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Receipt className="h-5 w-5 text-primary" />
            {editingPurchase ? t('editPurchase') : t('recordPurchase')}
          </DialogTitle>
        </DialogHeader>

        <div id="record-purchase-description" className="sr-only">
          {editingPurchase ? t('editPurchase') : t('recordPurchase')}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                {t('businessInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="description">{t('description')} *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('enterDescription')}
                    required
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">{t('supplier')}</Label>
                  <Select
                    value={formData.supplier_id || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value || '' }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('selectSupplier')} />
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
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select
                    value={formData.category || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('selectCategory')} />
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
                  <Label htmlFor="purchase_type">{t('purchaseType')} *</Label>
                  <Select
                    value={formData.purchase_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, purchase_type: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('selectPurchaseType')} />
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
                {t('paymentDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tax_percentage">{t('taxIndicator')} (%)</Label>
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
                  <Label htmlFor="amount_ht">{t('amountHT')} *</Label>
                  <Input
                    id="amount_ht"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount_ht}
                    onChange={(e) => handleAmountHTChange(e.target.value)}
                    placeholder={t('enterAmount')}
                    required
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="amount_ttc">{t('amountTTC')} *</Label>
                  <Input
                    id="amount_ttc"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount_ttc}
                    onChange={(e) => handleAmountTTCChange(e.target.value)}
                    placeholder={t('enterAmount')}
                    required
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advance_payment">{t('advancePayment')}</Label>
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
                        let paymentStatus = t('unpaid');
                        if (advancePayment >= amountTtc && amountTtc > 0) {
                          paymentStatus = t('paid');
                        } else if (advancePayment > 0) {
                          paymentStatus = t('partiallyPaid');
                        }
                        return { 
                          ...prev, 
                          advance_payment: newAdvancePayment,
                          balance: balance.toString(),
                          payment_status: paymentStatus
                        };
                      });
                    }}
                    placeholder={t('enterAmount')}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="balance">{t('balance')}</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    placeholder={t('enterAmount')}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Status Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" />
                {t('paymentDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">{t('paymentMethod')}</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('selectPaymentMethod')} />
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
                  <Label htmlFor="payment_status">{t('paymentStatus')}</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('selectPaymentStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={t('unpaid')}>{t('unpaid')}</SelectItem>
                      <SelectItem value={t('partiallyPaid')}>{t('partiallyPaid')}</SelectItem>
                      <SelectItem value={t('paid')}>{t('paid')}</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <SelectItem value="none">No Linking</SelectItem>
                    <SelectItem value="montage_costs">Montage Costs</SelectItem>
                    <SelectItem value="product_costs">Product Costs (Future)</SelectItem>
                    <SelectItem value="total_costs">Total Costs (Future)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.description.trim() || !formData.amount_ht || !formData.amount_ttc}
              className="min-w-[150px]"
            >
              {isSubmitting ? (editingPurchase ? t('updating') : t('saving')) : (editingPurchase ? t('editPurchase') : t('recordPurchase'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPurchaseDialog;