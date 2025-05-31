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
import { Plus, Edit, Trash2, Search, Building2, Receipt, Calendar, DollarSign, Phone, Mail, MapPin, Filter, X, TrendingUp, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import RecordPurchaseDialog from '@/components/RecordPurchaseDialog';
import AddSupplierDialog from '@/components/AddSupplierDialog';
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
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
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

      // When renewing, keep the existing balance if it's not fully paid
      const currentBalance = purchase.balance || 0;
      const totalAmount = purchase.amount_ttc || purchase.amount;
      
      const renewalData = {
        purchase_date: format(currentDate, 'yyyy-MM-dd'),
        next_recurring_date: nextRecurringDate,
        // Keep the existing balance structure
        balance: currentBalance,
        advance_payment: purchase.advance_payment || 0,
        payment_status: currentBalance === 0 ? 'Paid' : 
                       (purchase.advance_payment || 0) > 0 ? 'Partially Paid' : 'Unpaid'
      };

      // Record balance history if balance exists
      if (currentBalance > 0) {
        const { error: historyError } = await supabase
          .from('purchase_balance_history')
          .insert({
            purchase_id: purchase.id,
            user_id: user.id,
            old_balance: currentBalance,
            new_balance: currentBalance,
            change_amount: 0,
            change_reason: 'Recurring purchase renewed - balance carried forward',
            change_date: currentDate.toISOString()
          });

        if (historyError) {
          console.error('Error recording balance history:', historyError);
        }
      }

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
    
    if (!user || !purchaseFormData.description.trim() || !purchaseFormData.amount_ht || !purchaseFormData.amount_ttc) {
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
        description: purchaseFormData.description.trim(),
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

    if (!purchaseFormData.description.trim() || !purchaseFormData.amount_ht || !purchaseFormData.amount_ttc) {
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
        description: purchaseFormData.description.trim(),
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

      <div className="mb-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search purchases or suppliers..." 
              className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <Select
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value)}
            >
              <SelectTrigger className={cn(
                "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
                dateFilter !== 'all'
                  ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                  : "bg-white/10 hover:bg-white/20"
              )}>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date">
                  {dateFilter === 'all' ? 'Date' :
                   dateFilter === 'today' ? 'Today' :
                   dateFilter === 'week' ? 'This Week' :
                   dateFilter === 'month' ? 'This Month' : 'This Year'}
                </SelectValue>
                {dateFilter !== 'all' && (
                  <X
                    className="h-3 w-3 ml-auto hover:text-blue-900 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFilter('all');
                    }}
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filters */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-[140px] bg-white/10 border-white/10 rounded-xl"
                placeholder="From date"
              />
              <span className="text-sm text-gray-400">to</span>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-[140px] bg-white/10 border-white/10 rounded-xl"
                placeholder="To date"
              />
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: '', to: '' })}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Supplier Filter */}
            <Select
              value={supplierFilter}
              onValueChange={(value) => setSupplierFilter(value)}
            >
              <SelectTrigger className={cn(
                "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
                supplierFilter !== 'all'
                  ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                  : "bg-white/10 hover:bg-white/20"
              )}>
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Supplier">
                  {supplierFilter === 'all' ? 'Supplier' : 
                   suppliers.find(s => s.id === supplierFilter)?.name || 'Unknown'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-600">All Suppliers</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Purchase Type Filter */}
            <Select
              value={purchaseTypeFilter}
              onValueChange={(value) => setPurchaseTypeFilter(value)}
            >
              <SelectTrigger className={cn(
                "w-[160px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
                purchaseTypeFilter !== 'all'
                  ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                  : "bg-white/10 hover:bg-white/20"
              )}>
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type">
                  {purchaseTypeFilter === 'all' ? 'Type' : purchaseTypeFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-600">All Types</SelectItem>
                {PURCHASE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-6">
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
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-l-4 border-l-primary w-full">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header Section */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-primary" />
                                <h3 className="text-lg font-semibold text-gray-800 truncate">
                                  {suppliers.find(s => s.id === purchase.supplier_id)?.name || 'No Supplier'}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}</span>
                                {purchase.category && (
                                  <>
                                    <span>•</span>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                      {purchase.category}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  purchase.purchase_type === 'Capital Expenditure' 
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {purchase.purchase_type || 'Operational Expenses'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditPurchase(purchase)}
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeletePurchase(purchase.id)}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          {purchase.description && (
                            <div className="bg-blue-50 rounded-lg p-3 border-l-2 border-blue-200">
                              <p className="text-sm text-gray-700 font-medium">{purchase.description}</p>
                            </div>
                          )}

                          {/* Financial Information */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-3 w-3 text-blue-600" />
                                <p className="text-xs font-medium text-blue-700">Amount HT</p>
                              </div>
                              <p className="text-lg font-bold text-blue-800">{(purchase.amount_ht || purchase.amount).toFixed(2)} DH</p>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <p className="text-xs font-medium text-green-700">Amount TTC</p>
                              </div>
                              <p className="text-lg font-bold text-green-800">{(purchase.amount_ttc || purchase.amount).toFixed(2)} DH</p>
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 border">
                              <p className="text-xs text-gray-500 mb-1">Advance Payment</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {purchase.advance_payment ? `${purchase.advance_payment.toFixed(2)} DH` : '0.00 DH'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 border">
                              <p className="text-xs text-gray-500 mb-1">Balance</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {purchase.balance ? `${purchase.balance.toFixed(2)} DH` : '0.00 DH'}
                              </p>
                            </div>
                          </div>

                          {/* Status and Payment Method */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                purchase.payment_status === 'Paid' 
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : purchase.payment_status === 'Partially Paid'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {purchase.payment_status || 'Unpaid'}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {purchase.payment_method}
                              </span>
                            </div>
                            {purchase.payment_urgency && (
                              <div className="flex items-center gap-1 text-xs text-orange-600">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {format(new Date(purchase.payment_urgency), 'MMM dd')}</span>
                              </div>
                            )}
                          </div>

                          {/* Recurring Information */}
                          {purchase.recurring_type && (
                            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs font-medium text-purple-700">
                                  Recurring: {RECURRING_TYPES.find(t => t.value === purchase.recurring_type)?.label}
                                </span>
                                {purchase.next_recurring_date && (
                                  <span className="text-xs text-purple-600 ml-auto">
                                    Next: {format(new Date(purchase.next_recurring_date), 'MMM dd, yyyy')}
                                  </span>
                                )}
                              </div>
                              {purchase.next_recurring_date && new Date(purchase.next_recurring_date) <= new Date() && (
                                <Button
                                  size="sm"
                                  onClick={() => handleRecurringRenewal(purchase)}
                                  className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                >
                                  Renew Now
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {purchase.notes && (
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                              <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                              <p className="text-sm text-amber-800">{purchase.notes}</p>
                            </div>
                          )}

                          {/* Created Date */}
                          <div className="text-xs text-gray-400 text-right">
                            Created: {format(new Date(purchase.created_at), 'MMM dd, yyyy HH:mm')}
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
    </div>
  );
};

export default Purchases;