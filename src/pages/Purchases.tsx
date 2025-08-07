import React, { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Search, Building2, Receipt, Calendar, DollarSign, Phone, Mail, MapPin, Filter, X, TrendingUp, Package, History, Link, Eye, BarChart2, Truck, ArrowUpDown, CheckCircle, AlertCircle, Clock, MoreHorizontal } from 'lucide-react';
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
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


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
  is_deleted?: boolean;
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
  // New fields for the card redesign
  supplier_name?: string;
  supplier_contact?: string;
  total_amount: number;
  paid_amount: number;
  purchase_type_new: 'One-time' | 'Recurring';
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';
  due_date?: string;
  user_id?: string;
}

const PurchaseCard = ({ 
  purchase, 
  onView, 
  onEdit, 
  onDelete,
  onPayment
}: {
  purchase: Purchase;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPayment: () => void;
}) => {
  const { t } = useLanguage();

  const getTimeDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} ${t('minutesAgoShort') || 'min ago'}`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ${t('hoursAgoShort') || 'h ago'}`;
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'Overdue':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'Pending':
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return <Clock className="h-3.5 w-3.5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="h-[420px] border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50/30 to-seafoam-50/20 hover:border-l-teal-600 hover:shadow-lg transition-all duration-200 flex flex-col">
        {/* Header Section */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-200">
                  <Building2 className="h-6 w-6 text-teal-700" />
                </div>
                {purchase.purchase_type_new === 'Recurring' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-poppins font-semibold text-base text-teal-800 truncate">
                  {purchase.supplier_name || 'Unknown Supplier'}
                </h3>
                <div className="flex items-center gap-1.5 text-teal-600 mt-1">
                  <Package className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{purchase.purchase_type_new}</span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  {getTimeDisplay(purchase.purchase_date)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-poppins font-semibold text-teal-700">
                {(purchase.amount_ttc || purchase.amount || 0).toFixed(2)} DH
              </div>
              <div className="text-xs text-gray-500">{t('total') || 'Total'}</div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className={cn("text-xs border flex items-center gap-1 px-2 py-1 rounded-full", getStatusColor(purchase.status))}>
              {getStatusIcon(purchase.status)}
              {purchase.status === 'Paid' ? t('paid') : 
               purchase.status === 'Partially Paid' ? t('partial') :
               purchase.status === 'Overdue' ? t('overdue') : t('pending')}
            </div>

            {purchase.due_date && (
              <div className="text-xs border bg-blue-50 text-blue-700 border-blue-200 px-2 py-1 rounded-full flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(purchase.due_date), 'MMM dd')}
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-50 border border-teal-200">
              <Truck className="h-3 w-3 text-teal-600" />
              <span className="text-xs font-medium text-teal-700">
                {t('supplier') || 'Supplier'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-4 py-2">
          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {purchase.balance > 0 && (
              <Button
                size="sm"
                onClick={onPayment}
                className="h-8 w-8 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                title={t('recordPayment') || 'Record Payment'}
              >
                <DollarSign className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              size="sm"
              onClick={onView}
              className="h-8 w-8 p-0 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              title={t('view') || 'View'}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-sm"
              title={t('edit') || 'Edit'}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm"
              title={t('delete') || 'Delete'}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Financial Information Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">
                {t('paidAmount') || 'Paid'}
              </p>
              <p className="font-inter font-semibold text-emerald-600">
                {(purchase.paid_amount || 0).toFixed(2)} DH
              </p>
            </div>
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">
                {t('balance') || 'Balance'}
              </p>
              <p className="font-inter font-semibold text-red-600">
                {(purchase.balance || 0).toFixed(2)} DH
              </p>
            </div>
          </div>

          {/* Description */}
          {purchase.description && (
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-2">
                {t('description') || 'Description'}
              </p>
              <p className="text-sm text-gray-700 font-inter line-clamp-2">
                {purchase.description}
              </p>
            </div>
          )}

          {/* Payment Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-teal-700 font-poppins font-medium">
                {t('paymentProgress') || 'Payment Progress'}
              </span>
              <span className="text-xs text-teal-600 font-medium">
                {purchase.total_amount > 0 ? Math.round((purchase.paid_amount / purchase.total_amount) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-teal-100 rounded-full h-2">
              <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${purchase.total_amount > 0 ? (purchase.paid_amount / purchase.total_amount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Contact Information */}
          {purchase.supplier_contact && (
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">
                {t('contact') || 'Contact'}
              </p>
              <p className="text-xs text-gray-600 font-inter truncate">
                {purchase.supplier_contact}
              </p>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-4 pt-0 border-t-2 border-teal-100">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {purchase.due_date && (
                <span>
                  {t('dueDate') || 'Due'}: {format(new Date(purchase.due_date), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('view') || 'View'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('edit') || 'Edit'}
                </DropdownMenuItem>
                {purchase.balance > 0 && (
                  <DropdownMenuItem onClick={onPayment}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t('recordPayment') || 'Record Payment'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete') || 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const Purchases = () => {
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
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
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
          ),
          is_deleted
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
      
      // Map to the new interface structure for PurchaseCard
      return (data || []).map(purchase => ({
        ...purchase,
        supplier_name: purchase.suppliers?.name || 'Unknown Supplier',
        supplier_contact: purchase.suppliers?.contact_info || purchase.suppliers?.email || purchase.suppliers?.phone || '',
        total_amount: purchase.amount_ttc || purchase.amount || 0,
        paid_amount: purchase.advance_payment || 0,
        purchase_type_new: purchase.purchase_type === 'Recurring' ? 'Recurring' : 'One-time',
        status: purchase.payment_status === 'Paid' ? 'Paid' :
                purchase.payment_status === 'Partially Paid' ? 'Partially Paid' :
                purchase.payment_urgency && new Date(purchase.payment_urgency) < new Date() && purchase.payment_status !== 'Paid' ? 'Overdue' :
                'Pending',
        due_date: purchase.payment_urgency,
        user_id: purchase.user_id,
      }));
    },
    enabled: !!user,
    staleTime: 0, // Ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Calculate purchase linking when purchases and receipts are loaded
  useEffect(() => {
    const updateLinkedPurchases = async () => {
      if (!purchases || !Array.isArray(purchases) || purchases.length === 0 || !receipts || !Array.isArray(receipts) || !user) {
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
  const filteredPurchases = React.useMemo(() => {
    if (!purchases) return [];
    let filtered = [...purchases];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(purchase => 
        (purchase.description || '').toLowerCase().includes(search) ||
        (purchase.suppliers?.name || '').toLowerCase().includes(search) ||
        (purchase.receipt_number || '').toLowerCase().includes(search)
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
          return purchaseDate >= startDate!;
        });
      }
    }

    return filtered;
  }, [purchases, searchTerm, categoryFilter, supplierFilter, purchaseTypeFilter, dateRange, dateFilter]);

  // Filter suppliers
  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm) return suppliers;
    const search = searchTerm.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(search) ||
      (supplier.contact_person || '').toLowerCase().includes(search) ||
      (supplier.email || '').toLowerCase().includes(search)
    );
  }, [suppliers, searchTerm]);

  // Calculate total expenses
  const totalExpenses = React.useMemo(() => {
    return filteredPurchases.reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount || 0), 0);
  }, [filteredPurchases]);

  // Calculate monthly total
  const monthlyTotal = React.useMemo(() => {
    if (!purchases) return 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return purchases
      .filter(purchase => {
        const purchaseDate = new Date(purchase.purchase_date);
        return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
      })
      .reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount || 0), 0);
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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);

  const openDeleteDialog = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries(['purchases']);
      toast({
        title: "Purchase Deleted",
        description: "Purchase has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button 
            onClick={() => setIsRecordDialogOpen(true)}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('recordPurchase') || 'Record Purchase'}
          </Button>
          <Button
            onClick={() => handleOpenSupplierDialog()}
            variant="outline"
            className="rounded-xl border-2 bg-teal-500 text-white hover:bg-teal-600 border-teal-400 hover:border-teal-500 transition-all duration-200 shadow-lg hover:shadow-teal-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addSupplier')}
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
              placeholder={t('searchPurchasesSuppliers') || 'Search purchases and suppliers...'} 
              className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-2 shadow-md rounded-xl">
                <SelectValue placeholder={t('status') || 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
                <SelectItem value="Paid">{t('paid') || 'Paid'}</SelectItem>
                <SelectItem value="Partially Paid">{t('partial') || 'Partial'}</SelectItem>
                <SelectItem value="Pending">{t('pending') || 'Pending'}</SelectItem>
                <SelectItem value="Overdue">{t('overdue') || 'Overdue'}</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] border-2 shadow-md rounded-xl">
                <SelectValue placeholder={t('type') || 'Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
                <SelectItem value="One-time">{t('oneTime') || 'One-time'}</SelectItem>
                <SelectItem value="Recurring">{t('recurring') || 'Recurring'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Purchases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-6">
        <AnimatePresence>
          {purchasesLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="h-[420px] p-6 animate-pulse bg-gray-50 border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </Card>
            ))
          ) : filteredPurchases.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              {t('noPurchasesFound') || 'No purchases found'}
            </div>
          ) : (
            filteredPurchases.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                onView={() => {/* TODO: Implement view */}}
                onEdit={() => handleOpenPurchaseDialog(purchase)}
                onDelete={() => openDeleteDialog(purchase)}
                onPayment={() => {/* TODO: Implement payment */}}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
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
                            <p className="font-semibold">{receipt.montage_costs?.toFixed(2)} DH</p>
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

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setPurchaseToDelete(null);
        }}
        onConfirm={handleDelete}
        title={t('deletePurchase') || 'Delete Purchase'}
        message={t('deletePurchaseConfirmation') || `Are you sure you want to delete this purchase? This action cannot be undone.`}
        itemName={`Purchase from ${purchaseToDelete?.supplier_name}`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Purchases;