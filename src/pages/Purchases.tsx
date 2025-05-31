import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Building2, Receipt, Calendar, DollarSign, Phone, Mail, MapPin, Filter, X, TrendingUp, Package, History, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import RecordPurchaseDialog from '@/components/RecordPurchaseDialog';
import AddSupplierDialog from '@/components/AddSupplierDialog';
import PurchaseBalanceHistory from '@/components/PurchaseBalanceHistory';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
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
  suppliers?: Supplier;
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

const Purchases = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('purchases');

  // Search and filter states
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const [searchTerm, setSearchTerm] = useState(''); // General search term
  const [dateFilter, setDateFilter] = useState('all');

  // Dialog states
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isBalanceHistoryDialogOpen, setIsBalanceHistoryDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedPurchaseForHistory, setSelectedPurchaseForHistory] = useState<Purchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle URL-based navigation
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/suppliers')) {
      setActiveTab('suppliers');
    } else {
      setActiveTab('purchases');
    }
  }, [location.pathname]);

  // Check and renew recurring purchases on page mount
  useEffect(() => {
    const checkRecurringPurchases = async () => {
      if (!user) return;

      try {
        // Get the current session to pass the authorization header
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.error('No active session found');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-recurring-purchases', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error checking recurring purchases:', error);
          return;
        }

        console.log('Recurring purchases check result:', data);

        if (data?.processed > 0) {
          toast({
            title: "Recurring Purchases Renewed",
            description: `${data.processed} recurring purchase(s) have been automatically renewed.`,
          });

          // Refresh the purchases list
          queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
        }
      } catch (error) {
        console.error('Error invoking create-recurring-purchases function:', error);
        toast({
          title: "Error",
          description: "Failed to check recurring purchases",
          variant: "destructive",
        });
      }
    };

    checkRecurringPurchases();
  }, [user, toast, queryClient]);

  const handleRecurringRenewal = async (purchase: Purchase) => {
    if (!user) return;

    try {
      const currentDate = new Date();
      const nextRecurringDate = calculateNextRecurringDate(
        format(currentDate, 'yyyy-MM-dd'), 
        purchase.recurring_type || ''
      );

      // Calculate new totals for renewal
      const currentBalance = purchase.balance || 0;
      const currentAdvancePayment = purchase.advance_payment || 0;
      const originalAmount = purchase.amount_ttc || purchase.amount;
      const taxPercentage = purchase.tax_percentage || 20;

      // For recurring renewal:
      // - If balance = 0 (fully paid), reset to original amount
      // - If balance > 0 (unpaid), add remaining balance to original amount
      const newTotalAmount = currentBalance === 0 ? originalAmount : originalAmount + currentBalance;

      // Reset advance payment to 0 for new cycle and calculate new balance
      const newAdvancePayment = 0;
      const newBalance = newTotalAmount - newAdvancePayment;

      // Calculate HT amount from TTC amount using tax percentage
      const newAmountHT = newTotalAmount / (1 + taxPercentage / 100);

      const renewalData = {
        purchase_date: format(currentDate, 'yyyy-MM-dd'),
        next_recurring_date: nextRecurringDate,
        amount_ht: newAmountHT, // Update HT amount based on TTC and tax percentage
        amount_ttc: newTotalAmount, // Update total amount
        amount: newTotalAmount, // Keep for backward compatibility
        tax_percentage: taxPercentage, // Keep existing tax percentage
        balance: newBalance, // New balance after renewal
        advance_payment: newAdvancePayment, // Reset advance payment to 0
        payment_status: 'Unpaid' // Reset to unpaid for new cycle
      };

      // Balance history will be automatically recorded by the database trigger

      const { error } = await supabase
        .from('purchases')
        .update(renewalData)
        .eq('id', purchase.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recurring purchase renewed successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
    } catch (error) {
      console.error('Error renewing recurring purchase:', error);
      toast({
        title: "Error",
        description: "Failed to renew recurring purchase",
        variant: "destructive",
      });
    }
  };

  // Form states
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplier_id: '',
    description: '',
    amount_ht: '',
    amount_ttc: '',
    category: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'Cash',
    notes: '',
    advance_payment: '',
    balance: '',
    payment_status: 'Unpaid',
    payment_urgency: '',
    recurring_type: '',
    purchase_type: 'Operational Expenses',
  });

  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_person,
            phone,
            email
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    let filtered = [...purchases];

    if (purchaseSearchTerm) {
      const search = purchaseSearchTerm.toLowerCase();
      filtered = filtered.filter(purchase => 
        purchase.description.toLowerCase().includes(search) ||
        purchase.suppliers?.name.toLowerCase().includes(search) ||
        purchase.receipt_number?.toLowerCase().includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.category === categoryFilter);
    }

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.supplier_id === supplierFilter);
    }

    if (purchaseTypeFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.purchase_type === purchaseTypeFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(purchase => 
        new Date(purchase.purchase_date) >= new Date(dateRange.from)
      );
    }

    if (dateRange.to) {
      filtered = filtered.filter(purchase => 
        new Date(purchase.purchase_date) <= new Date(dateRange.to)
      );
    }

    // Date Filter Logic
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;

      if (dateFilter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      } else if (dateFilter === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      if (startDate) {
        filtered = filtered.filter(purchase => {
          const purchaseDate = new Date(purchase.purchase_date);
          return purchaseDate >= startDate;
        });
      }
    }

    return filtered;
  }, [purchases, purchaseSearchTerm, categoryFilter, supplierFilter, dateRange, dateFilter]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) return suppliers;
    const search = supplierSearchTerm.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(search) ||
      supplier.contact_person?.toLowerCase().includes(search) ||
      supplier.email?.toLowerCase().includes(search)
    );
  }, [suppliers, supplierSearchTerm]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredPurchases.reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount), 0);
  }, [filteredPurchases]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return purchases
      .filter(purchase => {
        const purchaseDate = new Date(purchase.purchase_date);
        return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
      })
      .reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount), 0);
  }, [purchases]);

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      supplier_id: '',
      description: '',
      amount_ht: '',
      amount_ttc: '',
      category: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Cash',
      notes: '',
      advance_payment: '',
      balance: '',
      payment_status: 'Unpaid',
      payment_urgency: '',
      recurring_type: '',
      purchase_type: 'Operational Expenses',
    });
    setEditingPurchase(null);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setEditingSupplier(null);
  };

  const handleOpenPurchaseDialog = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setPurchaseFormData({
        supplier_id: purchase.supplier_id || '',
        description: purchase.description,
        amount_ht: (purchase.amount_ht || purchase.amount).toString(),
        amount_ttc: (purchase.amount_ttc || purchase.amount).toString(),
        category: purchase.category || '',
        purchase_date: format(new Date(purchase.purchase_date), 'yyyy-MM-dd'),
        payment_method: purchase.payment_method,
        notes: purchase.notes || '',
        advance_payment: (purchase.advance_payment || 0).toString(),
        balance: (purchase.balance || 0).toString(),
        payment_status: purchase.payment_status || 'Unpaid',
        payment_urgency: purchase.payment_urgency ? format(new Date(purchase.payment_urgency), 'yyyy-MM-dd') : '',
        recurring_type: purchase.recurring_type || '',
        purchase_type: purchase.purchase_type || 'Operational Expenses',
      });
    } else {
      resetPurchaseForm();
    }
    setIsPurchaseDialogOpen(true);
  };

  const handleRecordNewPurchase = () => {
    resetPurchaseForm();
    setIsPurchaseDialogOpen(true);
  };

  const handleOpenSupplierDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    } else {
      resetSupplierForm();
    }
    setIsSupplierDialogOpen(true);
  };

  const handleOpenBalanceHistoryDialog = (purchase: Purchase) => {
    setSelectedPurchaseForHistory(purchase);
    setIsBalanceHistoryDialogOpen(true);
  };

  const handleSupplierAdded = (supplier: any) => {
    queryClient.invalidateQueries({ queryKey: ['suppliers', user?.id] });
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

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !purchaseFormData.amount_ht || !purchaseFormData.amount_ttc) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountHt = parseFloat(purchaseFormData.amount_ht);
    const amountTtc = parseFloat(purchaseFormData.amount_ttc);

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
        supplier_id: purchaseFormData.supplier_id || null,
        description: purchaseFormData.description.trim() || null,
        amount_ht: amountHt,
        amount_ttc: amountTtc,
        amount: amountTtc, // Keep for backward compatibility
        category: purchaseFormData.category || null,
        purchase_date: purchaseFormData.purchase_date,
        payment_method: purchaseFormData.payment_method,
        notes: purchaseFormData.notes || null,
        purchase_type: purchaseFormData.purchase_type,
        user_id: user.id,
      };

      if (editingPurchase) {
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editingPurchase.id);

        if (error) throw error;
        toast({ title: "Success", description: "Purchase updated successfully" });
      } else {
        const { error } = await supabase
          .from('purchases')
          .insert(purchaseData);

        if (error) throw error;
        toast({ title: "Success", description: "Purchase recorded successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
      setIsPurchaseDialogOpen(false);
      resetPurchaseForm();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast({
        title: "Error",
        description: "Failed to save purchase",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDeletePurchase = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this purchase?")) return;

    try {
      const { error } = await supabase
        .from('purchases')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
      toast({ title: "Success", description: "Purchase deleted successfully" });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this supplier?")) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['suppliers', user.id] });
      toast({ title: "Success", description: "Supplier deleted successfully" });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['purchases', user?.id] });
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsPurchaseDialogOpen(true);
  };

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !editingPurchase) return;

    if (!purchaseFormData.amount_ht || !purchaseFormData.amount_ttc) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountHt = parseFloat(purchaseFormData.amount_ht);
    const amountTtc = parseFloat(purchaseFormData.amount_ttc);
    const advancePayment = parseFloat(purchaseFormData.advance_payment) || 0;

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
      const nextRecurringDate = calculateNextRecurringDate(purchaseFormData.purchase_date, purchaseFormData.recurring_type);

      const purchaseData = {
        supplier_id: purchaseFormData.supplier_id || null,
        description: purchaseFormData.description.trim() || null,
        amount_ht: amountHt,
        amount_ttc: amountTtc,
        amount: amountTtc,
        category: purchaseFormData.category || null,
        purchase_date: purchaseFormData.purchase_date,
        payment_method: purchaseFormData.payment_method,
        notes: purchaseFormData.notes || null,
        advance_payment: advancePayment,
        balance: balance,
        payment_status: purchaseFormData.payment_status,
        payment_urgency: purchaseFormData.payment_urgency || null,
        recurring_type: purchaseFormData.recurring_type || null,
        next_recurring_date: nextRecurringDate,
      };

      const { error } = await supabase
        .from('purchases')
        .update(purchaseData)
        .eq('id', editingPurchase.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "Success", description: "Purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
      setEditingPurchase(null);
      resetPurchaseForm();

    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !supplierFormData.name.trim()) return;

    try {
      setIsSubmitting(true);

      const supplierData = {
        name: supplierFormData.name.trim(),
        contact_person: supplierFormData.contact_person || null,
        phone: supplierFormData.phone || null,
        email: supplierFormData.email || null,
        address: supplierFormData.address || null,
        notes: supplierFormData.notes || null,
        user_id: user.id,
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id);

        if (error) throw error;
        toast({ title: "Success", description: "Supplier updated successfully" });
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert(supplierData);

        if (error) throw error;
        toast({ title: "Success", description: "Supplier added successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ['suppliers', user.id] });
      setIsSupplierDialogOpen(false);
      resetSupplierForm();

    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      {console.log('Dialog render check:', { isPurchaseDialogOpen, editingPurchase, shouldShow: isPurchaseDialogOpen && !editingPurchase })}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={handleRecordNewPurchase}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Purchase
          </Button>
          <Button
            onClick={handleOpenSupplierDialog}
            variant="outline"
            className="rounded-xl border-2 bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-400 hover:border-emerald-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Search purchases or suppliers..." 
            className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Compact Inline Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Quick Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{filteredPurchases.length} purchases</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-blue-600">{totalExpenses.toFixed(2)} DH</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm">This month: <span className="font-semibold text-green-600">{monthlyTotal.toFixed(2)} DH</span></span>
          </div>
        </div>

        {/* Compact Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateFilter === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateFilter(option.value)}
                className={cn(
                  "h-7 px-2 text-xs font-medium transition-all duration-200 rounded-md",
                  dateFilter === option.value
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Category Filters */}
          <Select
            value={supplierFilter}
            onValueChange={(value) => setSupplierFilter(value)}
          >
            <SelectTrigger className={cn(
              "w-[110px] h-9 border transition-all duration-200 rounded-lg bg-white/50 backdrop-blur-sm",
              supplierFilter !== 'all'
                ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            )}>
              <Building2 className="h-4 w-4 mr-1" />
              <SelectValue>
                {supplierFilter === 'all' ? 'Supplier' : 
                 suppliers.find(s => s.id === supplierFilter)?.name?.slice(0, 6) + '...' || 'Unknown'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={purchaseTypeFilter}
            onValueChange={(value) => setPurchaseTypeFilter(value)}
          >
            <SelectTrigger className={cn(
              "w-[100px] h-9 border transition-all duration-200 rounded-lg bg-white/50 backdrop-blur-sm",
              purchaseTypeFilter !== 'all'
                ? "bg-purple-50 text-purple-700 border-purple-200 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            )}>
              <TrendingUp className="h-4 w-4 mr-1" />
              <SelectValue>
                {purchaseTypeFilter === 'all' ? 'Type' : 
                 purchaseTypeFilter === 'Operational Expenses' ? 'Ops' : 'Cap'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PURCHASE_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
```text

            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className={cn(
              "w-[100px] h-9 border transition-all duration-200 rounded-lg bg-white/50 backdrop-blur-sm",
              categoryFilter !== 'all'
                ? "bg-orange-50 text-orange-700 border-orange-200 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            )}>
              <Package className="h-4 w-4 mr-1" />
              <SelectValue>
                {categoryFilter === 'all' ? 'Category' : categoryFilter.slice(0, 6) + '...'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Tags - Only show when filters are active */}
      {(dateFilter !== 'all' || supplierFilter !== 'all' || categoryFilter !== 'all' || purchaseTypeFilter !== 'all') && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Active:</span>
          {dateFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100/80 backdrop-blur-sm text-blue-700 rounded-md text-xs border border-blue-200">
              {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'This Year'}
              <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setDateFilter('all')} />
            </span>
          )}
          {supplierFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100/80 backdrop-blur-sm text-green-700 rounded-md text-xs border border-green-200">
              {suppliers.find(s => s.id === supplierFilter)?.name}
              <X className="h-3 w-3 cursor-pointer hover:text-green-900" onClick={() => setSupplierFilter('all')} />
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100/80 backdrop-blur-sm text-orange-700 rounded-md text-xs border border-orange-200">
              {categoryFilter}
              <X className="h-3 w-3 cursor-pointer hover:text-orange-900" onClick={() => setCategoryFilter('all')} />
            </span>
          )}
          {purchaseTypeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100/80 backdrop-blur-sm text-purple-700 rounded-md text-xs border border-purple-200">
              {purchaseTypeFilter}
              <X className="h-3 w-3 cursor-pointer hover:text-purple-900" onClick={() => setPurchaseTypeFilter('all')} />
            </span>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
          <TabsTrigger 
            value="purchases" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
          >
            <Package className="h-4 w-4 mr-2" />
            Purchases ({filteredPurchases.length})
          </TabsTrigger>
          <TabsTrigger 
            value="suppliers" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Suppliers ({suppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-6">
            <AnimatePresence>
              {filteredPurchases.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                  No purchases found
                </div>
              ) : (
                filteredPurchases.map((purchase) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full"
                  >
                    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 hover:border-gray-200 w-full h-[350px]">
                      <CardContent className="p-5 space-y-4 flex flex-col justify-between">
                        {/* Header Section */}
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  purchase.purchase_type === 'Capital Expenditure' 
                                    ? 'bg-violet-500'
                                    : 'bg-blue-500'
                                }`}></div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {suppliers.find(s => s.id === purchase.supplier_id)?.name || 'No Supplier'}
                                  </h3>
                                  {purchase.description && (
                                    <p className="text-sm text-gray-500">{purchase.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Purchase type and category */}
                              <div className="flex items-center gap-2">
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${
                                  purchase.purchase_type === 'Capital Expenditure' 
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {purchase.purchase_type === 'Capital Expenditure' ? 'CAPEX' : 'OPEX'}
                                </span>
                                {purchase.category && (
                                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                                    {purchase.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenBalanceHistoryDialog(purchase)}
                                className="h-8 w-8 hover:bg-gray-50 rounded-lg"
                                title="View Balance History"
                              >
                                <History className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditPurchase(purchase)}
                                className="h-8 w-8 hover:bg-gray-50 rounded-lg"
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeletePurchase(purchase.id)}
                                className="h-8 w-8 hover:bg-gray-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Amount, Date and Payment Info */}
                        <div>
                          <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">
                              {(purchase.amount_ttc || purchase.amount).toFixed(2)}
                              <span className="text-lg font-medium text-gray-600 ml-1">DH</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Amount</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                              Purchase Date: {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                            </p>
                        </div>

                        <div>
                          {/* Payment Info */}
                          {(purchase.advance_payment || purchase.balance) && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-blue-600 font-medium">Advance</p>
                                <p className="text-blue-900 font-semibold">
                                  {purchase.advance_payment ? `${purchase.advance_payment.toFixed(2)} DH` : '0.00 DH'}
                                </p>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-3">
                                <p className="text-orange-600 font-medium">Balance</p>
                                <p className="text-orange-900 font-semibold">
                                  {purchase.balance ? `${purchase.balance.toFixed(2)} DH` : '0.00 DH'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Status and Payment Method */}
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              purchase.payment_status === 'Paid' 
                                ? 'bg-green-100 text-green-700'
                                : purchase.payment_status === 'Partially Paid'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {purchase.payment_status || 'Unpaid'}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Receipt className="h-3 w-3" />
                              <span>{purchase.payment_method}</span>
                            </div>
                          </div>

                          {/* Due Date */}
                          {purchase.payment_urgency && (
                            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {format(new Date(purchase.payment_urgency), 'MMM dd, yyyy')}</span>
                            </div>
                          )}

                          {/* Recurring */}
                          {purchase.recurring_type && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <RotateCcw className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-700">
                                    {RECURRING_TYPES.find(t => t.value === purchase.recurring_type)?.label}
                                  </span>
                                </div>
                                {purchase.next_recurring_date && new Date(purchase.next_recurring_date) <= new Date() && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRecurringRenewal(purchase)}
                                    className="h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md"
                                  >
                                    Renew
                                  </Button>
                                )}
                              </div>
                              {purchase.next_recurring_date && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Next: {format(new Date(purchase.next_recurring_date), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-6">
            <AnimatePresence>
              {suppliers.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                  No suppliers found
                </div>
              ) : (
                suppliers.filter(supplier => 
                  supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((supplier) => (
                  <motion.div
                    key={supplier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-[#f2f4f8] w-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold truncate">{supplier.name}</h3>
                                  {supplier.phone && (
                                    <div className="flex items-center gap-1.5 text-blue-600">
                                      <Phone className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium">{supplier.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {supplier.address && (
                                <p className="text-sm text-gray-600 mb-2">{supplier.address}</p>
                              )}
                            </div>

                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenSupplierDialog(supplier)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="h-8 w-8 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-baseline">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Total Purchases</p>
                                                               <p className="font-medium text-emerald-600">
                                  {purchases.filter(p => p.supplier_id === supplier.id).length}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                                <p className="font-medium text-orange-600">
                                  {purchases
                                    .filter(p => p.supplier_id === supplier.id)
                                    .reduce((sum, p) => sum + p.amount_ttc, 0)
                                    .toFixed(2)} DH
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record/Edit Purchase Dialog */}
      <RecordPurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => {
          setIsPurchaseDialogOpen(false);
          setEditingPurchase(null);
        }}
        suppliers={suppliers}
        onSuccess={handlePurchaseSuccess}
        editingPurchase={editingPurchase}
      />

      {/* Add/Edit Supplier Dialog */}
      <AddSupplierDialog
        isOpen={isSupplierDialogOpen}
        onClose={() => setIsSupplierDialogOpen(false)}
        onSupplierAdded={handleSupplierAdded}
      />

      {/* Balance History Dialog */}
      <Dialog open={isBalanceHistoryDialogOpen} onOpenChange={setIsBalanceHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Balance History - {selectedPurchaseForHistory?.description}
            </DialogTitle>
          </DialogHeader>
          {selectedPurchaseForHistory && user && (
            <PurchaseBalanceHistory
              purchaseId={selectedPurchaseForHistory.id}
              userId={user.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;