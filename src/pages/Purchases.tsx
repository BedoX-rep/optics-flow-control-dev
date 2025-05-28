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
    });
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
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-[#f2f4f8] w-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold truncate">
                                      {suppliers.find(s => s.id === purchase.supplier_id)?.name || 'No Supplier'}
                                    </h3>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                      {purchase.receipt_number}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 mt-0.5 block">
                                    {format(new Date(purchase.created_at), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              </div>
                              {purchase.description && (
                                <p className="text-sm text-gray-600 mb-2">{purchase.description}</p>
                              )}
                            </div>

                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditPurchase(purchase)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeletePurchase(purchase.id)}
                                className="h-8 w-8 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-0.5">Amount HT</p>
                              <p className="font-medium text-blue-600">{purchase.amount_ht.toFixed(2)} DH</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-0.5">Amount TTC</p>
                              <p className="font-medium text-green-600">{purchase.amount_ttc.toFixed(2)} DH</p>
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

      {/* Record Purchase Dialog */}
      <RecordPurchaseDialog
        isOpen={isPurchaseDialogOpen && !editingPurchase}
        onClose={() => setIsPurchaseDialogOpen(false)}
        suppliers={suppliers}
        onSuccess={handlePurchaseSuccess}
      />

      {/* Edit Purchase Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={() => setEditingPurchase(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          {editingPurchase && (
            <form onSubmit={handleUpdatePurchase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="edit_description">Description *</Label>
                  <Input
                    id="edit_description"
                    value={purchaseFormData.description}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter purchase description"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_amount_ht">Amount HT (Before Tax) *</Label>
                  <Input
                    id="edit_amount_ht"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={purchaseFormData.amount_ht}
                    onChange={(e) => {
                      const newAmountHt = e.target.value;
                      setPurchaseFormData(prev => {
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
                  <Label htmlFor="edit_amount_ttc">Amount TTC (After Tax) *</Label>
                  <Input
                    id="edit_amount_ttc"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={purchaseFormData.amount_ttc}
                    onChange={(e) => {
                      const newAmountTtc = e.target.value;
                      setPurchaseFormData(prev => {
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
                  <Label htmlFor="edit_advance_payment">Advance Payment</Label>
                  <Input
                    id="edit_advance_payment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchaseFormData.advance_payment}
                    onChange={(e) => {
                      const newAdvancePayment = e.target.value;
                      setPurchaseFormData(prev => {
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
                  <Label htmlFor="edit_balance">Balance</Label>
                  <Input
                    id="edit_balance"
                    type="number"
                    step="0.01"
                    value={purchaseFormData.balance}
                    placeholder="0.00"
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_purchase_date">Purchase Date</Label>
                  <Input
                    id="edit_purchase_date"
                    type="date"
                    value={purchaseFormData.purchase_date}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_supplier">Supplier</Label>
                  <Select
                    value={purchaseFormData.supplier_id || undefined}
                    onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, supplier_id: value || '' }))}
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
                  <Label htmlFor="edit_category">Category</Label>
                  <Select
                    value={purchaseFormData.category}
                    onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, category: value }))}
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
                  <Label htmlFor="edit_payment_method">Payment Method</Label>
                  <Select
                    value={purchaseFormData.payment_method}
                    onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, payment_method: value }))}
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
                  <Label htmlFor="edit_payment_status">Payment Status</Label>
                  <Select
                    value={purchaseFormData.payment_status}
                    onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, payment_status: value }))}
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
                  <Label htmlFor="edit_payment_urgency">Payment Urgency</Label>
                  <Input
                    id="edit_payment_urgency"
                    type="date"
                    value={purchaseFormData.payment_urgency}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, payment_urgency: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_recurring_type">Recurring Type</Label>
                  <Select
                    value={purchaseFormData.recurring_type}
                    onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, recurring_type: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurring period (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Recurring</SelectItem>
                      {RECURRING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={purchaseFormData.notes}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                  onClick={() => setEditingPurchase(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !purchaseFormData.description.trim() || !purchaseFormData.amount_ht || !purchaseFormData.amount_ttc}
                >
                  {isSubmitting ? 'Updating...' : 'Update Purchase'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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