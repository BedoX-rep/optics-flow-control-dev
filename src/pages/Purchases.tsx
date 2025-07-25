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
import { Plus, Edit, Trash2, Search, Building2, Receipt, Calendar, DollarSign, Phone, Mail, MapPin, Filter, X, TrendingUp, Package, History, Link } from 'lucide-react';
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
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  // Dialog states
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isBalanceHistoryDialogOpen, setIsBalanceHistoryDialogOpen] = useState(false);
  const [isLinkingDialogOpen, setIsLinkingDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedPurchaseForHistory, setSelectedPurchaseForHistory] = useState<Purchase | null>(null);
  const [selectedPurchaseForLinking, setSelectedPurchaseForLinking] = useState<Purchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Linking states
  const [linkDateFrom, setLinkDateFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [linkDateTo, setLinkDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

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
              queryClient.invalidateQueries({ queryKey: ['receipts', user.id] });
              queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
              queryClient.invalidateQueries({ queryKey: ['receipts', user.id] });
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

  // Fetch receipts
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', user?.id],
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

  // Calculate purchase linking when purchases and receipts are loaded
  useEffect(() => {
    const updateLinkedPurchases = async () => {
      if (!purchases || !Array.isArray(purchases) || purchases.length === 0 || !receipts || !Array.isArray(receipts) || receipts.length === 0 || !user) {
        return;
      }

      // Find purchases with linking configurations that need updating
      const linkedPurchases = purchases.filter(p => 
        p.linking_category === 'montage_costs' && p.link_date_from && p.link_date_to
      );

      if (linkedPurchases.length === 0) return;

      let hasUpdates = false;

      for (const purchase of linkedPurchases) {
        const shouldUpdate = await calculatePurchaseLinking(purchase);
        if (shouldUpdate) hasUpdates = true;
      }

      // Only refresh if there were actual updates
      if (hasUpdates) {
        queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
      }
    };

    // Only run when both purchases and receipts are loaded and user is available
    if (purchases.length > 0 && receipts.length >= 0 && user) {
      updateLinkedPurchases();
    }
  }, [purchases, receipts, user, queryClient]);

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

  // Function to calculate and update purchase linking
  const calculatePurchaseLinking = async (purchase: Purchase): Promise<boolean> => {
    if (!purchase.linking_category || purchase.linking_category !== 'montage_costs' || !purchase.link_date_from || !purchase.link_date_to) {
      return false;
    }

    // Get receipts in the date range using cached data, excluding deleted receipts
    const linkedReceipts = receipts.filter(receipt => {
      // First check if receipt is deleted
      if (receipt.is_deleted) {
        return false;
      }

      const receiptDate = new Date(receipt.created_at);
      const fromDate = new Date(purchase.link_date_from!);
      const toDate = new Date(purchase.link_date_to!);

      // Set time to start/end of day for accurate comparison
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      return receiptDate >= fromDate && receiptDate <= toDate;
    });

    let totalAmount = 0;
    let paidAmount = 0;

    linkedReceipts.forEach(receipt => {
      const montageCost = receipt.montage_costs || 0;

      // Only include receipts in InCutting, Ready, or Paid costs phases
      const validMontageStatuses = ['InCutting', 'Ready', 'Paid costs'];
      if (montageCost > 0 && validMontageStatuses.includes(receipt.montage_status)) {
        totalAmount += montageCost;

        // Only count as paid if status is specifically 'Paid costs'
        if (receipt.montage_status === 'Paid costs') {
          paidAmount += montageCost;
        }
      }
    });

    const balance = totalAmount - paidAmount;
    const linkedReceiptIds = linkedReceipts.map(r => r.id);

    // Check if values have actually changed to avoid unnecessary updates
    const currentAmountTTC = purchase.amount_ttc || purchase.amount || 0;
    const currentAdvancePayment = purchase.advance_payment || 0;
    const currentBalance = purchase.balance || 0;
    const currentLinkedReceipts = purchase.linked_receipts || [];

    const hasChanges = 
      Math.abs(currentAmountTTC - totalAmount) > 0.01 ||
      Math.abs(currentAdvancePayment - paidAmount) > 0.01 ||
      Math.abs(currentBalance - balance) > 0.01 ||
      JSON.stringify(currentLinkedReceipts.sort()) !== JSON.stringify(linkedReceiptIds.sort());

    if (!hasChanges) {
      return false;
    }

    try {
      // Update the purchase record
      const { error } = await supabase
        .from('purchases')
        .update({
          linked_receipts: linkedReceiptIds,
          amount_ttc: totalAmount,
          amount_ht: totalAmount / 1.2,
          amount: totalAmount,
          advance_payment: paidAmount,
          balance: balance,
          payment_status: balance === 0 && totalAmount > 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid'
        })
        .eq('id', purchase.id);

      if (error) {
        console.error('Error updating purchase linking:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in calculatePurchaseLinking:', error);
      return false;
    }
  };

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

  const handleOpenLinkingDialog = (purchase: Purchase) => {
    setSelectedPurchaseForLinking(purchase);
    setLinkDateFrom(purchase.link_date_from || format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    setLinkDateTo(purchase.link_date_to || format(new Date(), 'yyyy-MM-dd'));
    setIsLinkingDialogOpen(true);
  };

  const getFilteredReceipts = () => {
    return receipts.filter(receipt => {
      // Exclude deleted receipts
      if (receipt.is_deleted) {
        return false;
      }

      const receiptDate = new Date(receipt.created_at);
      const fromDate = new Date(linkDateFrom);
      const toDate = new Date(linkDateTo);
      // Include all receipts within the date range, regardless of when they were created
      return receiptDate >= fromDate && receiptDate <= toDate;
    });
  };

  const calculateMontageData = () => {
    const filteredReceipts = getFilteredReceipts();
    let totalMontage = 0;
    let paidMontage = 0;

    filteredReceipts.forEach(receipt => {
      const montageCost = receipt.montage_costs || 0;

      // Only include receipts in InCutting, Ready, or Paid costs phases
      const validMontageStatuses = ['InCutting', 'Ready', 'Paid costs'];
      if (montageCost > 0 && validMontageStatuses.includes(receipt.montage_status)) {
        totalMontage += montageCost;

        // Only count as paid if status is 'Paid costs'
        if (receipt.montage_status === 'Paid costs') {
          paidMontage += montageCost;
        }
      }
    });

    const unpaidMontage = totalMontage - paidMontage;

    return {
      totalMontage,
      paidMontage,
      unpaidMontage,
      receiptCount: filteredReceipts.length
    };
  };

  const handleLinkMontageToReceipt = async () => {
    if (!selectedPurchaseForLinking || !user) return;

    try {
      setIsSubmitting(true);
      const filteredReceipts = getFilteredReceipts();
      const montageData = calculateMontageData();

      const linkedReceiptIds = filteredReceipts.map(r => r.id);

      // Store the date range for future receipt matching
      // This will allow the system to automatically include receipts created in the future
      // that fall within this date range
      const { error } = await supabase
        .from('purchases')
        .update({
          linked_receipts: linkedReceiptIds,
          link_date_from: linkDateFrom,
          link_date_to: linkDateTo,
          linking_category: 'montage_costs', // Set the linking category
          amount_ttc: montageData.totalMontage,
          amount_ht: montageData.totalMontage / 1.2, // Assuming 20% tax
          amount: montageData.totalMontage,
          advance_payment: montageData.paidMontage,
          balance: montageData.unpaidMontage,
          payment_status: montageData.unpaidMontage === 0 && montageData.totalMontage > 0 ? 'Paid' : montageData.paidMontage > 0 ? 'Partially Paid' : 'Unpaid'
        })
        .eq('id', selectedPurchaseForLinking.id);

      if (error) throw error;

      const dateRangeText = linkDateFrom === linkDateTo 
        ? `for ${format(new Date(linkDateFrom), 'MMM dd, yyyy')}`
        : `from ${format(new Date(linkDateFrom), 'MMM dd, yyyy')} to ${format(new Date(linkDateTo), 'MMM dd, yyyy')}`;

      toast({
        title: "Success",
        description: `Linked ${montageData.receiptCount} current receipts ${dateRangeText}. Future receipts in this date range will be automatically included.`,
      });

      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
      setIsLinkingDialogOpen(false);
    } catch (error) {
      console.error('Error linking receipts:', error);
      toast({
        title: "Error",
        description: "Failed to link receipts to purchase",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={handleRecordNewPurchase}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('recordPurchase')}
          </Button>
          <Button
            onClick={() => handleOpenSupplierDialog()}
            variant="outline"
            className="rounded-xl border-2 bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-400 hover:border-emerald-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addSupplier')}
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder={t('searchPurchasesSuppliers')} 
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
            <span className="font-medium">{filteredPurchases.length} {t('purchasesCount')}</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-blue-600">{totalExpenses.toFixed(2)} DH</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm">{t('thisMonth')} <span className="font-semibold text-green-600">{monthlyTotal.toFixed(2)} DH</span></span>
          </div>
        </div>

        {/* Compact Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
            {[
              { value: 'all', label: t('all') },
              { value: 'today', label: t('today') },
              { value: 'week', label: t('week') },
              { value: 'month', label: t('month') },
              { value: 'year', label: t('year') }
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
                {supplierFilter === 'all' ? t('supplier') : 
                 suppliers.find(s => s.id === supplierFilter)?.name?.slice(0, 6) + '...' || t('unknownSupplier')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allSuppliers')}</SelectItem>
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
                {purchaseTypeFilter === 'all' ? t('type') : 
                 purchaseTypeFilter === t('operationalExpenses') ? 'Ops' : 'Cap'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes')}</SelectItem>
              {PURCHASE_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
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
                {categoryFilter === 'all' ? t('category') : categoryFilter.slice(0, 6) + '...'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCategories')}</SelectItem>
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
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-200 w-full">
                      <CardContent className="p-4">
                        {/* Header Section with Description, Dates, and Actions */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Receipt className="h-4 w-4 text-primary flex-shrink-0" />
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                  {purchase.description}
                                </h3>
                              </div>                              <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
                                {purchase.payment_urgency && (
                                  <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium">
                                    Due: {format(new Date(purchase.payment_urgency), 'MMM dd')}
                                  </span>
                                )}
                                {purchase.next_recurring_date && !purchase.already_recurred && (
                                  <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded font-medium">
                                    {t('next')}: {format(new Date(purchase.next_recurring_date), 'MMM dd')}
                                  </span>
                                )}
                                {purchase.next_recurring_date && purchase.already_recurred && (
                                  <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded font-medium">
                                    {t('alreadyPassed')}: {format(new Date(purchase.next_recurring_date), 'MMM dd')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">
                                  {suppliers.find(s => s.id === purchase.supplier_id)?.name || t('noSupplier')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenBalanceHistoryDialog(purchase)}
                              className="h-7 w-7 hover:bg-purple-50 hover:text-purple-600"
                              title="View Balance History"
                            >
                              <History className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditPurchase(purchase)}
                              className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {purchase.payment_status !== 'Paid' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleMarkAsPaid(purchase)}
                                className="h-7 w-7 hover:bg-green-50 hover:text-green-600"
                                title="Mark as Paid"
                              >
                                <DollarSign className="h-3 w-3" />
                            </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Main TTC Amount - Prominent Display */}
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 mb-3 border-l-4 border-primary">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600">{t('totalAmountTTC')}</p>
                              <p className="text-xl font-bold text-primary">{(purchase.amount_ttc || purchase.amount).toFixed(2)} DH</p>
                            </div>
                            <DollarSign className="h-5 w-5 text-primary/60" />
                          </div>
                        </div>

                        {/* Compact Financial Details */}
                        <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs text-gray-500">{t('advance')}</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {purchase.advance_payment ? `${purchase.advance_payment.toFixed(2)} DH` : '0.00 DH'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs text-gray-500">{t('balance')}</p>
                            <p className="text-sm font-semibold text-red-600">
                              {purchase.balance ? `${purchase.balance.toFixed(2)} DH` : '0.00 DH'}
                            </p>
                          </div>
                        </div>

                        {/* Status Row */}
                        <div className="border-t border-gray-100 pt-2 mt-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-wrap min-w-0 flex-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                purchase.payment_status === 'Paid' 
                                  ? 'bg-green-100 text-green-800'
                                  : purchase.payment_status === 'Partially Paid'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {purchase.payment_status === 'Paid' ? t('paid') : 
                                 purchase.payment_status === 'Partially Paid' ? t('partiallyPaid') : 
                                 purchase.payment_status === 'Unpaid' ? t('unpaid') : t('unpaid')}
                              </span>
                              {purchase.category && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs flex-shrink-0 whitespace-nowrap">
                                  {getTranslatedCategory(purchase.category)}
                                </span>
                              )}
                              {purchase.linked_receipts && purchase.linked_receipts.length > 0 && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                                  <Link className="h-3 w-3" />
                                  {purchase.linked_receipts.length} {t('receipts')}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {!purchase.already_recurred && purchase.recurring_type && purchase.next_recurring_date && new Date(purchase.next_recurring_date) <= new Date() && (
                                <Button
                                  size="sm"
                                  onClick={() => handleRecurringRenewal(purchase)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-6 px-3"
                                >
                                  {t('renewNow')}
                                </Button>
                              )}
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
                                <p className="text-xs text-gray-500 mb-0.5">{t('totalPurchases')}</p>
                                <p className="font-medium text-emerald-600">
                                  {purchases.filter(p => p.supplier_id === supplier.id).length}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">{t('totalAmount')}</p>
                                <p className="font-medium text-orange-600">
                                  {purchases
                                    .filter(p => p.supplier_id === supplier.id)
                                    .reduce((sum, p) => sum + (p.amount_ttc || p.amount), 0)
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

      {/* Receipt Linking Dialog */}
      <Dialog open={isLinkingDialogOpen} onOpenChange={setIsLinkingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Link Receipts to Purchase - {selectedPurchaseForLinking?.description}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link_date_from">From Date</Label>
                    <Input
                      id="link_date_from"
                      type="date"
                      value={linkDateFrom}
                      onChange={(e) => setLinkDateFrom(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_date_to">To Date</Label>
                    <Input
                      id="link_date_to"
                      type="date"
                      value={linkDateTo}
                      onChange={(e) => setLinkDateTo(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Montage Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Montage Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {(() =>{
                  const montageData = calculateMontageData();
                  return (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Receipts</p>
                        <p className="text-xl font-bold text-blue-600">{montageData.receiptCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Montage</p>
                        <p className="text-xl font-bold text-primary">{montageData.totalMontage.toFixed(2)} DH</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Paid Montage</p>
                        <p className="text-xl font-bold text-green-600">{montageData.paidMontage.toFixed(2)} DH</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Unpaid Balance</p>
                        <p className="text-xl font-bold text-red-600">{montageData.unpaidMontage.toFixed(2)} DH</p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Receipt List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filtered Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  {getFilteredReceipts().length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No receipts found in selected date range</p>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredReceipts().map((receipt) => (
                        <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{receipt.customer_name}</p>
                            <p className="text-sm text-gray-600">{format(new Date(receipt.created_at), 'MMM dd, yyyy')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{receipt.montage_costs.toFixed(2)} DH</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              receipt.montage_status === 'Paid costs' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {receipt.montage_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsLinkingDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLinkMontageToReceipt}
              disabled={isSubmitting || getFilteredReceipts().length === 0}
            >
              {isSubmitting ? 'Linking...' : 'Link to Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;