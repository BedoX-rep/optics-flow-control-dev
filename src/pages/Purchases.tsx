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
import { Plus, Edit, Trash2, Search, Building2, Receipt, Calendar, DollarSign, Phone, Mail, MapPin, Filter, X, TrendingUp, Package, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import RecordPurchaseDialog from '@/components/RecordPurchaseDialog';
import AddSupplierDialog from '@/components/AddSupplierDialog';
import PurchaseBalanceHistory from '@/components/PurchaseBalanceHistory';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import PurchaseCard from '@/components/PurchaseCard';
import PurchasesHero from '@/components/purchases/PurchasesHero';
import PurchaseFilters from '@/components/purchases/PurchaseFilters';
import SupplierCard from '@/components/purchases/SupplierCard';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface Receipt {
  id: string;
  created_at: string;
  montage_costs?: number;
  montage_status: string;
  customer_name?: string;
  clients?: {
    name: string;
  };
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
  linked_receipts?: string[];
  link_date_from?: string;
  link_date_to?: string;
  created_at: string;
  suppliers?: Supplier;
  already_recurred?: boolean;
  tax_percentage?: number;
}

const Purchases = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('purchases');

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

  // Helper function to get translated category
  const getTranslatedCategory = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Office Supplies': t('officeSupplies'),
      'Equipment': t('equipment'),
      'Software': t('software'),
      'Marketing': t('marketing'),
      'Travel': t('travel'),
      'Utilities': t('utilities'),
      'Rent': t('rent'),
      'Professional Services': t('professionalServices'),
      'Inventory': t('inventory'),
      'Maintenance': t('maintenance'),
      'Insurance': t('insurance'),
      'Loan': t('loan'),
      'Other': t('other')
    };
    return categoryMap[category] || category;
  };

  const PAYMENT_METHODS = [
    t('cash'),
    t('creditCard'),
    t('debitCard'),
    t('bankTransfer'),
    t('check'),
    t('digitalWallet')
  ];

  const RECURRING_TYPES = [
    { value: '1_month', label: t('oneMonth') },
    { value: '3_months', label: t('threeMonths') },
    { value: '6_months', label: t('sixMonths') },
    { value: '1_year', label: t('oneYear') }
  ];

  const PURCHASE_TYPES = [
    t('operationalExpenses'),
    t('capitalExpenditure')
  ];

  // Consolidated search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

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

    // Set up real-time subscription for receipt changes that might affect purchase linking
    if (user) {
      const channel = supabase
        .channel('receipt-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'receipts',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Only invalidate if the change affects montage_costs or montage_status
            if (payload.eventType === 'UPDATE' &&
              (payload.new?.montage_costs !== payload.old?.montage_costs ||
                payload.new?.montage_status !== payload.old?.montage_status)) {
              // bump both caches
              queryClient.invalidateQueries({ queryKey: ['receipts', user.id] });
              queryClient.invalidateQueries({ queryKey: ['receipts', user.id, 'light'] });
              queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
              queryClient.invalidateQueries({ queryKey: ['receipts', user.id] });
              queryClient.invalidateQueries({ queryKey: ['receipts', user.id, 'light'] });
              queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, toast, queryClient]);

  const handleRecurringRenewal = async (purchase: Purchase) => {
    if (!user) return;

    try {
      // Get the current session to pass the authorization header
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No active session found');
        toast({
          title: "Error",
          description: "Authentication required. Please login again.",
          variant: "destructive",
        });
        return;
      }

      // First, mark the purchase as due for renewal by updating its next_recurring_date to today
      const today = format(new Date(), 'yyyy-MM-dd');

      const { error: updateError } = await supabase
        .from('purchases')
        .update({ next_recurring_date: today })
        .eq('id', purchase.id);

      if (updateError) {
        console.error('Error updating purchase date:', updateError);
        throw updateError;
      }

      // Now call the edge function to process the renewal
      const { data, error } = await supabase.functions.invoke('create-recurring-purchases', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error calling recurring purchases function:', error);
        throw error;
      }

      console.log('Recurring purchase renewal result:', data);

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

  const handleMarkAsPaid = async (purchase: Purchase) => {
    if (!user) return;

    try {
      const currentTotalAmount = purchase.amount_ttc || purchase.amount;

      const { error } = await supabase
        .from('purchases')
        .update({
          advance_payment: currentTotalAmount,
          balance: 0,
          payment_status: 'Paid'
        })
        .eq('id', purchase.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase marked as paid successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
    } catch (error) {
      console.error('Error marking purchase as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark purchase as paid",
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

  // Fetch a light version of receipts for purchase linking.  The query key is intentionally
  // different from the full receipts list so we don't pollute the cache with objects that
  // don't contain all of the fields needed by the receipts page.  When you navigate from
  // Purchases → Receipts the cached data will no longer be reused, which avoids the empty
  // list bug.
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', user?.id, 'light'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          created_at,
          montage_costs,
          montage_status,
          clients (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(receipt => ({
        ...receipt,
        customer_name: receipt.clients?.name || 'Unknown Customer'
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: false, // Remove auto-refetch to reduce API calls
  });

  // Fetch purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching purchases for user:', user.id);
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

      if (error) {
        console.error('Error fetching purchases:', error);
        throw error;
      }
      console.log('Fetched purchases count:', data?.length || 0);
      return data || [];
    },
    enabled: !!user,
    staleTime: 0, // Ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    let filtered = [...purchases];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
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

    if (dateRange.from && dateFilter === 'custom') {
      filtered = filtered.filter(purchase =>
        new Date(purchase.purchase_date) >= dateRange.from!
      );
    }

    if (dateRange.to && dateFilter === 'custom') {
      filtered = filtered.filter(purchase =>
        new Date(purchase.purchase_date) <= dateRange.to!
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
  }, [purchases, searchTerm, categoryFilter, supplierFilter, purchaseTypeFilter, dateRange, dateFilter]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    const search = searchTerm.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(search) ||
      supplier.contact_person?.toLowerCase().includes(search) ||
      supplier.email?.toLowerCase().includes(search)
    );
  }, [suppliers, searchTerm]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredPurchases.reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount), 0);
  }, [filteredPurchases]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    if (!purchases) return 0;
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

  if (purchasesLoading) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loadingPurchases')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden animate-in fade-in duration-700">
      <PurchasesHero
        onNewPurchase={handleRecordNewPurchase}
        onAddSupplier={() => handleOpenSupplierDialog()}
        purchases={purchases || []}
      />

      <div className="w-full px-6 lg:px-10 relative z-20">
        <div className="mb-10 p-3 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center flex-1 min-w-[300px] px-5 py-3 bg-slate-50/50 shadow-inner rounded-2xl border border-slate-100/50 group focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search className="h-5 w-5 text-indigo-600 mr-3 transition-transform group-focus-within:scale-110" />
              <input
                type="text"
                placeholder={t('searchPurchasesSuppliers')}
                className="bg-transparent border-none text-sm font-black text-slate-700 focus:ring-0 w-full outline-none placeholder:text-slate-400/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="hidden lg:block h-10 w-px bg-slate-200/60" />

            <div className="flex items-center gap-3">
              <PurchaseFilters
                dateFilter={dateFilter}
                dateRange={dateRange}
                categoryFilter={categoryFilter}
                supplierFilter={supplierFilter}
                purchaseTypeFilter={purchaseTypeFilter}
                categories={EXPENSE_CATEGORIES}
                suppliers={suppliers}
                onFilterChange={(key, value) => {
                  if (key === 'date') setDateFilter(value);
                  else if (key === 'dateRange') setDateRange(value);
                  else if (key === 'category') setCategoryFilter(value);
                  else if (key === 'supplier') setSupplierFilter(value);
                  else if (key === 'purchaseType') setPurchaseTypeFilter(value);
                }}
              />
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
              {t('purchases')} ({filteredPurchases.length})
            </TabsTrigger>
            <TabsTrigger
              value="suppliers"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
            >
              <Building2 className="h-4 w-4 mr-2" />
              {t('suppliers')} ({suppliers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-6">
              <AnimatePresence>
                {filteredPurchases.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    {t('noPurchasesFound')}
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
                      <PurchaseCard
                        purchase={purchase}
                        suppliers={suppliers}
                        onEdit={handleEditPurchase}
                        onDelete={handleDeletePurchase}
                        onMarkAsPaid={handleMarkAsPaid}
                        onViewBalanceHistory={handleOpenBalanceHistoryDialog}
                        onRecurringRenewal={handleRecurringRenewal}
                      />
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
                    {t('noSuppliersFound')}
                  </div>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <motion.div
                      key={supplier.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full"
                    >
                      <SupplierCard
                        supplier={supplier}
                        purchases={purchases || []}
                        onEdit={handleOpenSupplierDialog}
                        onDelete={handleDeleteSupplier}
                        t={t}
                      />
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
    </div>
  );
};

export default Purchases;