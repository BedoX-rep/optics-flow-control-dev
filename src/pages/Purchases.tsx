
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Edit, Trash2, Search, Building2, Receipt, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import AddSupplierDialog from '@/components/AddSupplierDialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');

  const [formData, setFormData] = useState({
    supplier_id: '',
    description: '',
    amount: '',
    category: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    receipt_number: '',
    payment_method: 'Cash',
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
  const { data: purchases = [], isLoading } = useQuery({
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

    return filtered;
  }, [purchases, searchTerm, categoryFilter, supplierFilter]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  }, [filteredPurchases]);

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      description: '',
      amount: '',
      category: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      receipt_number: '',
      payment_method: 'Cash',
      notes: '',
    });
    setEditingPurchase(null);
  };

  const handleOpenPurchaseDialog = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setFormData({
        supplier_id: purchase.supplier_id || '',
        description: purchase.description,
        amount: purchase.amount.toString(),
        category: purchase.category || '',
        purchase_date: format(new Date(purchase.purchase_date), 'yyyy-MM-dd'),
        receipt_number: purchase.receipt_number || '',
        payment_method: purchase.payment_method,
        notes: purchase.notes || '',
      });
    } else {
      resetForm();
    }
    setIsPurchaseDialogOpen(true);
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.description.trim() || !formData.amount) return;

    try {
      setIsSubmitting(true);
      const purchaseData = {
        supplier_id: formData.supplier_id || null,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category || null,
        purchase_date: formData.purchase_date,
        receipt_number: formData.receipt_number || null,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        user_id: user.id,
      };

      if (editingPurchase) {
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editingPurchase.id)
          .eq('user_id', user.id);

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
      resetForm();
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

  const handleSupplierAdded = (supplier: Supplier) => {
    queryClient.invalidateQueries({ queryKey: ['suppliers', user?.id] });
    setFormData(prev => ({ ...prev, supplier_id: supplier.id }));
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Purchases
          </h1>
          <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-full">
            <DollarSign className="h-4 w-4" />
            Total: ${totalExpenses.toFixed(2)}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setIsSupplierDialogOpen(true)}
            variant="outline"
            className="rounded-xl font-medium"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Button
            onClick={() => handleOpenPurchaseDialog()}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Purchase
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search purchases..." 
              className="pl-9 bg-white/5 border-white/10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-48">
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
      </div>

      {/* Purchases List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-32 bg-neutral-200 rounded" />
                  <div className="h-3 w-24 bg-neutral-200 rounded" />
                  <div className="h-3 w-16 bg-neutral-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPurchases.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No purchases found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || categoryFilter !== 'all' || supplierFilter !== 'all'
              ? "No purchases match your current filters"
              : "Start by recording your first business purchase"}
          </p>
          <Button onClick={() => handleOpenPurchaseDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Record Purchase
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPurchases.map((purchase) => (
            <Card key={purchase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-1">
                      {purchase.description}
                    </CardTitle>
                    <p className="text-2xl font-bold text-green-600">
                      ${purchase.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPurchaseDialog(purchase)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePurchase(purchase.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  {purchase.suppliers && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{purchase.suppliers.name}</span>
                    </div>
                  )}
                  {purchase.category && (
                    <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {purchase.category}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {purchase.receipt_number && (
                    <div className="text-xs text-gray-500">
                      Receipt: {purchase.receipt_number}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Payment: {purchase.payment_method}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPurchase} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter purchase description"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No supplier</SelectItem>
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
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
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
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                  placeholder="Enter receipt number"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                disabled={isSubmitting || !formData.description.trim() || !formData.amount}
              >
                {isSubmitting ? 'Saving...' : editingPurchase ? 'Update Purchase' : 'Record Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        isOpen={isSupplierDialogOpen}
        onClose={() => setIsSupplierDialogOpen(false)}
        onSupplierAdded={handleSupplierAdded}
      />
    </div>
  );
};

export default Purchases;
