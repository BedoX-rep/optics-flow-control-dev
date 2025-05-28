
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

    return filtered;
  }, [purchases, purchaseSearchTerm, categoryFilter, supplierFilter, dateRange]);

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

  const handleSubmitSupplier = async (e: React.FormEvent) => {
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
          .eq('id', editingSupplier.id)
          .eq('user_id', user.id);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white">
                  <Receipt className="h-8 w-8" />
                </div>
                Purchases & Suppliers
              </h1>
              <p className="text-gray-600 text-lg">Manage your business expenses and supplier relationships</p>
            </div>

            {/* Summary Cards */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6" />
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Expenses</p>
                      <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6" />
                    <div>
                      <p className="text-blue-100 text-sm font-medium">This Month</p>
                      <p className="text-2xl font-bold">${monthlyTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="purchases" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
              >
                <Package className="h-4 w-4 mr-2" />
                Purchases
              </TabsTrigger>
              <TabsTrigger 
                value="suppliers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Suppliers
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={activeTab === 'purchases' ? handleRecordNewPurchase : () => handleOpenSupplierDialog()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl font-medium px-6 py-2.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              {activeTab === 'purchases' ? 'Record Purchase' : 'Add Supplier'}
            </Button>
          </div>

          <TabsContent value="purchases" className="space-y-6">
            {/* Purchase Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredPurchases.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Purchase</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${filteredPurchases.length > 0 ? (totalExpenses / filteredPurchases.length).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                      <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Search purchases..." 
                      className="pl-10 bg-white border-gray-200 rounded-xl shadow-sm"
                      value={purchaseSearchTerm}
                      onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Input
                        type="date"
                        placeholder="From date"
                        className="border-0 p-0 h-auto bg-transparent w-32"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      />
                      <span className="text-sm text-gray-400">to</span>
                      <Input
                        type="date"
                        placeholder="To date"
                        className="border-0 p-0 h-auto bg-transparent w-32"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      />
                    </div>
                    {(dateRange.from || dateRange.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDateRange({ from: '', to: '' })}
                        className="text-sm h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48 bg-white border-gray-200 rounded-xl shadow-sm">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {EXPENSE_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-48 bg-white border-gray-200 rounded-xl shadow-sm">
                      <SelectValue placeholder="Filter by supplier" />
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
                </div>
              </CardContent>
            </Card>

            {/* Purchases List */}
            {purchasesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse bg-white/70 backdrop-blur-sm border border-gray-200">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPurchases.length === 0 ? (
              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <Receipt className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No purchases found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {purchaseSearchTerm || categoryFilter !== 'all' || supplierFilter !== 'all'
                      ? "No purchases match your current filters. Try adjusting your search criteria."
                      : "Start tracking your business expenses by recording your first purchase."}
                  </p>
                  <Button 
                    onClick={handleRecordNewPurchase}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Purchase
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPurchases.map((purchase) => (
                  <Card key={purchase.id} className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {purchase.description}
                          </CardTitle>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-green-100 rounded-lg">
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xl font-bold text-green-600">
                                  ${(purchase.amount_ttc || purchase.amount).toFixed(2)}
                                </p>
                                <p className="text-xs text-green-600 font-medium">TTC</p>
                              </div>
                            </div>
                            {purchase.amount_ht && (
                              <p className="text-sm text-gray-500 ml-8">
                                ${purchase.amount_ht.toFixed(2)} HT
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPurchaseDialog(purchase)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {purchase.suppliers && (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">{purchase.suppliers.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          {purchase.category && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {purchase.category}
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(purchase.purchase_date), 'MMM dd')}</span>
                          </div>
                        </div>

                        {purchase.receipt_number && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                            Receipt: {purchase.receipt_number}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 border-t pt-2">
                          Payment: {purchase.payment_method}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Supplier Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredSuppliers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Partnerships</p>
                      <p className="text-2xl font-bold text-gray-900">{suppliers.filter(s => purchases.some(p => p.supplier_id === s.id)).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suppliers Search */}
            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search suppliers..." 
                    className="pl-10 bg-white border-gray-200 rounded-xl shadow-sm"
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Suppliers List */}
            {filteredSuppliers.length === 0 ? (
              <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <Building2 className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No suppliers found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {supplierSearchTerm
                      ? "No suppliers match your search criteria. Try different keywords."
                      : "Build your supplier network by adding your first business partner."}
                  </p>
                  <Button 
                    onClick={() => handleOpenSupplierDialog()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                  <Card key={supplier.id} className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="line-clamp-1">{supplier.name}</span>
                          </CardTitle>
                          {supplier.contact_person && (
                            <p className="text-sm text-gray-600 ml-9">{supplier.contact_person}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSupplierDialog(supplier)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {supplier.phone && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-900">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                            <Mail className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-900 line-clamp-1">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                            <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-orange-900 line-clamp-2">{supplier.address}</span>
                          </div>
                        )}
                        
                        {/* Purchase count */}
                        <div className="border-t pt-2">
                          <p className="text-xs text-gray-500">
                            {purchases.filter(p => p.supplier_id === supplier.id).length} purchases
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Record Purchase Dialog */}
        <RecordPurchaseDialog
          isOpen={isPurchaseDialogOpen && !editingPurchase}
          onClose={() => setIsPurchaseDialogOpen(false)}
          suppliers={suppliers}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['purchases', user?.id] });
          }}
        />

        {/* Edit Purchase Dialog */}
        {editingPurchase && (
          <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Purchase</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitPurchase} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={purchaseFormData.description}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter purchase description"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount_ht">Amount HT (Before Tax) *</Label>
                    <Input
                      id="amount_ht"
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseFormData.amount_ht}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, amount_ht: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount_ttc">Amount TTC (After Tax) *</Label>
                    <Input
                      id="amount_ttc"
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseFormData.amount_ttc}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, amount_ttc: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={purchaseFormData.purchase_date}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select
                      value={purchaseFormData.supplier_id || undefined}
                      onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, supplier_id: value || '' }))}
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
                      value={purchaseFormData.category}
                      onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                      value={purchaseFormData.payment_method}
                      onValueChange={(value) => setPurchaseFormData(prev => ({ ...prev, payment_method: value }))}
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

                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={purchaseFormData.notes}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this purchase"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPurchaseDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !purchaseFormData.description.trim() || !purchaseFormData.amount_ht || !purchaseFormData.amount_ttc}
                  >
                    {isSubmitting ? 'Saving...' : 'Update Purchase'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Supplier Dialog */}
        <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitSupplier} className="space-y-4">
              <div>
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={supplierFormData.contact_person}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter supplier address"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="supplier_notes">Notes</Label>
                <Textarea
                  id="supplier_notes"
                  value={supplierFormData.notes}
                  onChange={(e) => setSupplierFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this supplier"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSupplierDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !supplierFormData.name.trim()}
                >
                  {isSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Purchases;
