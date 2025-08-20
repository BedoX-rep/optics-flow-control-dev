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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { format } from 'date-fns';
import { Calculator, User, CreditCard, Calendar, Receipt, Building2, Save, FileText } from 'lucide-react';
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
  tax_percentage?: number;
  already_recurred?: boolean;
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
    purchase_type: t('operationalExpenses'),
    next_recurring_date: '',
    already_recurred: false
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
        purchase_type: editingPurchase.purchase_type || t('operationalExpenses'),
        next_recurring_date: editingPurchase.next_recurring_date ? format(new Date(editingPurchase.next_recurring_date), 'yyyy-MM-dd') : '',
        already_recurred: editingPurchase.already_recurred || false
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
      purchase_type: t('operationalExpenses'),
      next_recurring_date: '',
      already_recurred: false
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
        next_recurring_date: formData.next_recurring_date || nextRecurringDate,
        purchase_type: formData.purchase_type,
        already_recurred: formData.already_recurred,
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
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-teal-100 pb-4 mb-6">
          <DialogTitle className="text-3xl font-bold text-teal-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-6 w-6 text-teal-600" />
            </div>
            {editingPurchase ? t('editPurchase') : t('recordPurchase')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="business-details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-teal-50 border border-teal-200">
            <TabsTrigger value="business-details" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Building2 className="h-4 w-4 mr-2" />
              Business Details
            </TabsTrigger>
            <TabsTrigger value="payment-recurring" className="text-teal-700 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment & Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business-details" className="flex-1 overflow-auto mt-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Business Information */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    {t('businessInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('description')} *</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('enterDescription')}
                      required
                      disabled={isSubmitting}
                      className="border-teal-200 focus:border-teal-500 h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('supplier')}</Label>
                    <Select
                      value={formData.supplier_id || undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value || '' }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500 h-9">
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

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('category')}</Label>
                    <Select
                      value={formData.category || undefined}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500 h-9">
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

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('purchaseType')} *</Label>
                    <Select
                      value={formData.purchase_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, purchase_type: value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500 h-9">
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

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">Purchase Date</Label>
                    <Input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                      disabled={isSubmitting}
                      className="border-teal-200 focus:border-teal-500 h-9"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <Calculator className="h-4 w-4" />
                    {t('financialDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('taxIndicator')} (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_percentage}
                      onChange={(e) => handleTaxPercentageChange(e.target.value)}
                      placeholder="20.00"
                      disabled={isSubmitting}
                      className="border-teal-200 focus:border-teal-500 h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-teal-700 font-medium text-sm">{t('amountHT')} *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount_ht}
                        onChange={(e) => handleAmountHTChange(e.target.value)}
                        placeholder={t('enterAmount')}
                        required
                        disabled={isSubmitting}
                        className="border-teal-200 focus:border-teal-500 h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-teal-700 font-medium text-sm">{t('amountTTC')} *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount_ttc}
                        onChange={(e) => handleAmountTTCChange(e.target.value)}
                        placeholder={t('enterAmount')}
                        required
                        disabled={isSubmitting}
                        className="border-teal-200 focus:border-teal-500 h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-teal-700 font-medium text-sm">{t('advancePayment')}</Label>
                      <Input
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
                        className="border-teal-200 focus:border-teal-500 h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-teal-700 font-medium text-sm">{t('balance')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        placeholder={t('enterAmount')}
                        disabled
                        className="bg-teal-50 border-teal-200 h-9"
                      />
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 mt-4">
                    <h4 className="font-semibold mb-2 text-teal-800 text-sm">{t('summary') || 'Summary'}</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-teal-600">Amount TTC:</span>
                        <span className="font-medium text-teal-800">{formData.amount_ttc || '0.00'} DH</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-teal-600">Advance Payment:</span>
                        <span className="font-medium text-teal-800">{formData.advance_payment || '0.00'} DH</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-teal-200 pt-1">
                        <span className="font-bold text-teal-700">Balance:</span>
                        <span className="font-bold text-teal-800">{formData.balance || '0.00'} DH</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('notes')}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this purchase (optional)"
                      rows={3}
                      disabled={isSubmitting}
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment-recurring" className="flex-1 overflow-auto mt-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Payment Details */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    {t('paymentDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('paymentMethod')}</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500 h-9">
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

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">{t('paymentStatus')}</Label>
                    <Select
                      value={formData.payment_status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500 h-9">
                        <SelectValue placeholder={t('selectPaymentStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={t('unpaid')}>{t('unpaid')}</SelectItem>
                        <SelectItem value={t('partiallyPaid')}>{t('partiallyPaid')}</SelectItem>
                        <SelectItem value={t('paid')}>{t('paid')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">Payment Due Date</Label>
                    <Input
                      type="date"
                      value={formData.payment_urgency}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_urgency: e.target.value }))}
                      disabled={isSubmitting}
                      className="border-teal-200 focus:border-teal-500 h-9"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Recurring Settings */}
              <Card className="border-teal-200 shadow-sm">
                <CardHeader className="bg-teal-50 border-b border-teal-200 py-3">
                  <CardTitle className="text-teal-800 flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Recurring Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-teal-700 font-medium text-sm">Recurring Type</Label>
                    <Select
                      value={formData.recurring_type}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        recurring_type: value,
                        next_recurring_date: value === 'none' ? '' : prev.next_recurring_date
                      }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="border-teal-200 focus:border-teal-500 h-9">
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

                  {formData.recurring_type !== 'none' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-teal-700 font-medium text-sm">Next Recurring Date</Label>
                        <Input
                          type="date"
                          value={formData.next_recurring_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, next_recurring_date: e.target.value }))}
                          disabled={isSubmitting}
                          className="border-teal-200 focus:border-teal-500 h-9"
                        />
                        <p className="text-xs text-teal-600">
                          Auto-calculated: {formData.purchase_date && formData.recurring_type !== 'none' 
                            ? calculateNextRecurringDate(formData.purchase_date, formData.recurring_type) || 'Invalid date'
                            : 'Set purchase date first'
                          }
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="already_recurred"
                            checked={formData.already_recurred}
                            onChange={(e) => setFormData(prev => ({ ...prev, already_recurred: e.target.checked }))}
                            disabled={isSubmitting}
                            className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                          />
                          <Label htmlFor="already_recurred" className="text-teal-700 font-medium text-sm">
                            Already Recurred
                          </Label>
                        </div>
                        <p className="text-xs text-teal-600">
                          Mark this if the recurring purchase has already been processed
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-teal-100 mt-auto">
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.description.trim() || !formData.amount_ht || !formData.amount_ttc}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              {isSubmitting ? (editingPurchase ? t('updating') : t('saving')) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPurchase ? t('updatePurchase') : t('recordPurchase')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPurchaseDialog;