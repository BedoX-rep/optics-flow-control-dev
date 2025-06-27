import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Building2, Package, Calculator, Wallet, AlertTriangle, PieChart, Target, ShoppingCart, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Receipt {
  id: string;
  total: number;
  cost_ttc: number;
  products_cost: number;
  montage_costs: number;
  created_at: string;
  is_deleted: boolean;
  balance: number;
  advance_payment: number;
  delivery_status: string;
  montage_status: string;
  receipt_items: Array<{
    product?: {
      category?: string;
      stock?: number;
    };
    cost: number;
    price: number;
    quantity: number;
  }>;
}

interface Purchase {
  id: string;
  amount_ttc: number;
  amount: number;
  advance_payment: number;
  balance: number;
  purchase_type: string;
  purchase_date: string;
  is_deleted: boolean;
  linking_category?: string;
  linked_receipts?: string[];
  description: string;
  supplier?: {
    name: string;
  };
}

const Financial = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  // Receipt Items Analysis filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedPaidAtDelivery, setSelectedPaidAtDelivery] = useState('all');
  const [includePaidAtDelivery, setIncludePaidAtDelivery] = useState(true);

  // Detailed Expenditure Analysis filters
  const [selectedExpenseType, setSelectedExpenseType] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');

  // Fetch receipts with more detailed data
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['receipts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          total,
          cost_ttc,
          products_cost,
          montage_costs,
          created_at,
          is_deleted,
          balance,
          advance_payment,
          delivery_status,
          montage_status,
          paid_at_delivery_cost,
          receipt_items (
            cost,
            price,
            quantity,
            paid_at_delivery,
            custom_item_name,
            product:product_id (
              name,
              category,
              stock,
              stock_status,
              company
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to handle NULL company values consistently
      const processedData = data?.map(receipt => ({
        ...receipt,
        receipt_items: receipt.receipt_items?.map(item => ({
          ...item,
          product: item.product ? {
            ...item.product,
            // Consistent company handling - normalize empty/null values to 'None'
            company: (item.product.company && 
                     typeof item.product.company === 'string' && 
                     item.product.company.trim() !== '' &&
                     item.product.company.trim().toLowerCase() !== 'null' &&
                     item.product.company.trim().toLowerCase() !== 'undefined') 
              ? item.product.company.trim() 
              : 'None'
          } : null
        }))
      })) || [];

      console.log('Processed receipts data:', processedData);

      return processedData;
    },
    enabled: !!user,
    staleTime: 0, // Force refresh to ensure fresh data
    refetchOnMount: true,
  });

  // Fetch purchases with supplier info
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:supplier_id (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 0, // Force refresh to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Set up real-time subscription for purchases
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Purchase change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Filter data by date range and exclude deleted receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      if (receipt.is_deleted) return false; // Exclude deleted receipts
      const receiptDate = new Date(receipt.created_at);
      return receiptDate >= new Date(dateFrom) && receiptDate <= new Date(dateTo);
    });
  }, [receipts, dateFrom, dateTo]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      return purchaseDate >= new Date(dateFrom) && purchaseDate <= new Date(dateTo);
    });
  }, [purchases, dateFrom, dateTo]);

  // Enhanced financial metrics calculation
  const financialMetrics = useMemo(() => {
    // Revenue calculations - use total from receipts directly
    const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
    const totalReceived = filteredReceipts.reduce((sum, receipt) => sum + (receipt.advance_payment || 0), 0);
    const totalOutstanding = filteredReceipts.reduce((sum, receipt) => sum + (receipt.balance || 0), 0);

    // Product costs - use products_cost field and receipt_items as fallback
    const totalProductCosts = filteredReceipts.reduce((sum, receipt) => {
      // Use products_cost field if available, otherwise calculate from receipt_items
      if (receipt.products_cost && receipt.products_cost > 0) {
        return sum + receipt.products_cost;
      }

      // Fallback to calculating from receipt_items
      if (Array.isArray(receipt.receipt_items)) {
        const itemsCost = receipt.receipt_items.reduce((itemSum, item) => {
          const quantity = Number(item.quantity) || 1;
          const cost = Number(item.cost) || 0;
          return itemSum + (cost * quantity);
        }, 0);
        return sum + itemsCost;
      }

      return sum;
    }, 0);

    // Enhanced product costs analysis by category, stock status, and company
    const productAnalysis = filteredReceipts.reduce((acc, receipt) => {
      if (Array.isArray(receipt.receipt_items)) {
        receipt.receipt_items.forEach(item => {
          const quantity = Number(item.quantity) || 1;
          const cost = Number(item.cost) || 0;
          const price = Number(item.price) || 0;
          const totalItemCost = cost * quantity;
          const totalItemRevenue = price * quantity;
          const category = item.product?.category || 'Unknown';
          const stock = item.product?.stock || 0;
          // Consistent company handling - normalize empty/null values to 'None'
          const company = (item.product?.company && 
                          typeof item.product.company === 'string' && 
                          item.product.company.trim() !== '' &&
                          item.product.company.trim().toLowerCase() !== 'null' &&
                          item.product.company.trim().toLowerCase() !== 'undefined') 
            ? item.product.company.trim() 
            : 'None';

          // Use actual stock status from product
          const stockStatus = item.product?.stock_status || 'Order';

          // Category analysis
          if (!acc.categories[category]) {
            acc.categories[category] = { cost: 0, revenue: 0, profit: 0, margin: 0, items: 0 };
          }
          acc.categories[category].cost += totalItemCost;
          acc.categories[category].revenue += totalItemRevenue;
          acc.categories[category].profit = acc.categories[category].revenue - acc.categories[category].cost;
          acc.categories[category].margin = acc.categories[category].revenue > 0 ? (acc.categories[category].profit / acc.categories[category].revenue) * 100 : 0;
          acc.categories[category].items += quantity;

          // Stock status analysis
          if (!acc.stockStatus[stockStatus]) {
            acc.stockStatus[stockStatus] = { cost: 0, revenue: 0, profit: 0, margin: 0, items: 0 };
          }
          acc.stockStatus[stockStatus].cost += totalItemCost;
          acc.stockStatus[stockStatus].revenue += totalItemRevenue;
          acc.stockStatus[stockStatus].profit = acc.stockStatus[stockStatus].revenue - acc.stockStatus[stockStatus].cost;
          acc.stockStatus[stockStatus].margin = acc.stockStatus[stockStatus].revenue > 0 ? (acc.stockStatus[stockStatus].profit / acc.stockStatus[stockStatus].revenue) * 100 : 0;
          acc.stockStatus[stockStatus].items += quantity;

          // Company analysis
          if (!acc.companies[company]) {
            acc.companies[company] = { cost: 0, revenue: 0, profit: 0, margin: 0, items: 0 };
          }
          acc.companies[company].cost += totalItemCost;
          acc.companies[company].revenue += totalItemRevenue;
          acc.companies[company].profit = acc.companies[company].revenue - acc.companies[company].cost;
          acc.companies[company].margin = acc.companies[company].revenue > 0 ? (acc.companies[company].profit / acc.companies[company].revenue) * 100 : 0;
          acc.companies[company].items += quantity;

          // Combined analysis for filtering
          const key = `${category}|${stockStatus}|${company}`;
          if (!acc.combined[key]) {
            acc.combined[key] = { 
              category, 
              stockStatus,
              company,
              cost: 0, 
              revenue: 0, 
              profit: 0, 
              margin: 0, 
              items: 0 
            };
          }
          acc.combined[key].cost += totalItemCost;
          acc.combined[key].revenue += totalItemRevenue;
          acc.combined[key].profit = acc.combined[key].revenue - acc.combined[key].cost;
          acc.combined[key].margin = acc.combined[key].revenue > 0 ? (acc.combined[key].profit / acc.combined[key].revenue) * 100 : 0;
          acc.combined[key].items += quantity;
        });
      }
      return acc;
    }, { 
      categories: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number }>, 
      stockStatus: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number }>,
      companies: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number }>,
      combined: {} as Record<string, { category: string; stockStatus: string; company: string; cost: number; revenue: number; profit: number; margin: number; items: number }>
    });

    // Enhanced montage costs tracking (exclude deleted receipts)
    const linkedMontageReceipts = new Set();
    filteredPurchases.forEach(purchase => {
      if (purchase.linking_category === 'montage_costs' && purchase.linked_receipts) {
        purchase.linked_receipts.forEach(receiptId => {
          // Only add to linked set if the receipt exists and is not deleted
          const linkedReceipt = receipts.find(r => r.id === receiptId);
          if (linkedReceipt && !linkedReceipt.is_deleted) {
            linkedMontageReceipts.add(receiptId);
          }
        });
      }
    });

    const montageMetrics = filteredReceipts.reduce((acc, receipt) => {
      // Double check that receipt is not deleted (safety check)
      if (receipt.is_deleted) {
        return acc;
      }

      const montageCost = receipt.montage_costs || 0;

      // Only include receipts in InCutting, Ready, or Paid costs phases
      const validMontageStatuses = ['InCutting', 'Ready', 'Paid costs'];
      if (montageCost > 0 && validMontageStatuses.includes(receipt.montage_status)) {
        acc.total += montageCost;

        // Only count as operational cost if not linked to a purchase
        if (!linkedMontageReceipts.has(receipt.id)) {
          acc.operational += montageCost;
        }

        // Track paid/unpaid based on montage status
        if (receipt.montage_status === 'Paid costs') {
          acc.paid += montageCost;
        } else {
          // InCutting and Ready phases are considered unpaid
          acc.unpaid += montageCost;
        }
      }
      return acc;
    }, { total: 0, operational: 0, paid: 0, unpaid: 0 });

    // Operational expenses breakdown (paid and unpaid)
    const operationalExpenses = filteredPurchases
      .filter(purchase => purchase.purchase_type === 'Operational Expenses')
      .reduce((acc, purchase) => {
        const total = purchase.amount_ttc || purchase.amount;
        const paid = purchase.advance_payment || 0;
        const unpaid = total - paid;

        acc.total += total;
        acc.paid += paid;
        acc.unpaid += unpaid;
        return acc;
      }, { total: 0, paid: 0, unpaid: 0 });

    // Enhanced capital expenditure breakdown
    const capitalPurchases = filteredPurchases.filter(purchase => purchase.purchase_type === 'Capital Expenditure');
    const capitalAnalysis = capitalPurchases.reduce((acc, purchase) => {
      const total = purchase.amount_ttc || purchase.amount;
      const paid = purchase.advance_payment || 0;
      const outstanding = total - paid;

      acc.total += total;
      acc.paid += paid;
      acc.outstanding += outstanding;
      acc.purchases.push({
        id: purchase.id,
        description: purchase.description,
        supplier: purchase.supplier?.name || 'Unknown',
        total,
        paid,
        outstanding,
        date: purchase.purchase_date
      });

      return acc;
    }, { 
      total: 0, 
      paid: 0, 
      outstanding: 0, 
      purchases: [] as Array<{
        id: string;
        description: string;
        supplier: string;
        total: number;
        paid: number;
        outstanding: number;
        date: string;
      }>
    });

    // Calculate total paid_at_delivery_cost
    const totalPaidAtDeliveryCost = filteredReceipts.reduce((sum, receipt) => {
      return sum + (receipt.paid_at_delivery_cost || 0);
    }, 0);

    // Enhanced cash flow and profit calculations
    const cashInflow = totalReceived; // Actually received payments
    const totalExpensesPaid = operationalExpenses.paid + montageMetrics.operational; // Actually paid expenses
    const totalExpensesUnpaid = operationalExpenses.unpaid + montageMetrics.unpaid; // Unpaid expenses
    const netCashFlow = cashInflow - operationalExpenses.paid - montageMetrics.paid - totalPaidAtDeliveryCost; // Deduct paid_at_delivery for cash flow
    const availableCash = netCashFlow; // Current cash position

    // Comprehensive profit calculations using correct product costs (which include paid_at_delivery)
    const grossProfit = totalRevenue - totalProductCosts;
    const netProfitAfterPaidExpenses = grossProfit - totalExpensesPaid;
    const netProfitAfterAllExpenses = grossProfit - operationalExpenses.total - montageMetrics.total;

    // Performance ratios
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMarginPaid = totalRevenue > 0 ? (netProfitAfterPaidExpenses / totalRevenue) * 100 : 0;
    const netMarginTotal = totalRevenue > 0 ? (netProfitAfterAllExpenses / totalRevenue) * 100 : 0;
    const collectionRate = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    return {
      // Revenue
      totalRevenue,
      totalReceived,
      totalOutstanding,

      // Enhanced Cost Analysis
      totalProductCosts,
      productAnalysis,
      montageMetrics,
      operationalExpenses,
      totalPaidAtDeliveryCost,

      // Enhanced Capital Analysis
      capitalAnalysis,

      // Cash Flow
      cashInflow,
      totalExpensesPaid,
      totalExpensesUnpaid,
      netCashFlow,
      availableCash,

      // Enhanced Profits
      grossProfit,
      netProfitAfterPaidExpenses,
      netProfitAfterAllExpenses,

      // Ratios
      grossMargin,
      netMarginPaid,
      netMarginTotal,
      collectionRate
    };
  }, [filteredReceipts, filteredPurchases, receipts.length, purchases.length]);

  // Comprehensive receipt items analysis
  const receiptItemsAnalysis = useMemo(() => {
    // Don't process if data is still loading
    if (receiptsLoading || !receipts.length) {
      return { 
        allItems: [], 
        summaryData: {
          categories: {},
          companies: {},
          stockStatus: {},
          paidAtDelivery: {}
        }
      };
    }

    // Debug: Log a sample of receipt items to check data structure
    if (filteredReceipts.length > 0 && filteredReceipts[0].receipt_items?.length > 0) {
      console.log('Sample receipt item structure:', filteredReceipts[0].receipt_items[0]);
      console.log('Sample product data:', filteredReceipts[0].receipt_items[0]?.product);
    }

    const allItems: Array<{
      id: string;
      receiptId: string;
      productName: string;
      category: string;
      company: string;
      stockStatus: string;
      quantity: number;
      cost: number;
      price: number;
      totalCost: number;
      totalRevenue: number;
      profit: number;
      margin: number;
      paidAtDelivery: boolean;
    }> = [];

    const summaryData = {
      categories: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number; count: number }>,
      companies: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number; count: number }>,
      stockStatus: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number; count: number }>,
      paidAtDelivery: {} as Record<string, { cost: number; revenue: number; profit: number; margin: number; items: number; count: number }>
    };

    filteredReceipts.forEach(receipt => {
      if (Array.isArray(receipt.receipt_items)) {
        receipt.receipt_items.forEach((item, index) => {
          const quantity = Number(item.quantity) || 1;
          const cost = Number(item.cost) || 0;
          const price = Number(item.price) || 0;
          const totalCost = cost * quantity;
          const totalRevenue = price * quantity;
          const profit = totalRevenue - totalCost;
          const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

          const productName = item.custom_item_name || item.product?.name || `Product ${index + 1}`;
          const category = item.product?.category || 'Unknown';
          // Consistent company handling - normalize empty/null values to 'None'
          const company = (item.product?.company && 
                          typeof item.product.company === 'string' && 
                          item.product.company.trim() !== '' &&
                          item.product.company.trim().toLowerCase() !== 'null' &&
                          item.product.company.trim().toLowerCase() !== 'undefined') 
            ? item.product.company.trim() 
            : 'None';
          const stockStatus = item.product?.stock_status || 'Order';
          const paidAtDelivery = Boolean(item.paid_at_delivery);

          // Filter based on includePaidAtDelivery setting
          if (!includePaidAtDelivery && paidAtDelivery) {
            return; // Skip this item if we're excluding paid at delivery items
          }

          const itemData = {
            id: `${receipt.id}-${index}`,
            receiptId: receipt.id,
            productName,
            category,
            company,
            stockStatus,
            quantity,
            cost,
            price,
            totalCost,
            totalRevenue,
            profit,
            margin,
            paidAtDelivery
          };

          allItems.push(itemData);

          // Update summary data
          [
            ['categories', category],
            ['companies', company],
            ['stockStatus', stockStatus],
            ['paidAtDelivery', paidAtDelivery ? 'Yes' : 'No']
          ].forEach(([type, key]) => {
            if (!summaryData[type][key]) {
              summaryData[type][key] = { cost: 0, revenue: 0, profit: 0, margin: 0, items: 0, count: 0 };
            }
            summaryData[type][key].cost += totalCost;
            summaryData[type][key].revenue += totalRevenue;
            summaryData[type][key].profit += profit;
            summaryData[type][key].items += quantity;
            summaryData[type][key].count += 1;
            summaryData[type][key].margin = summaryData[type][key].revenue > 0 
              ? (summaryData[type][key].profit / summaryData[type][key].revenue) * 100 
              : 0;
          });
        });
      }
    });

    return { allItems, summaryData };
  }, [filteredReceipts, includePaidAtDelivery, receiptsLoading, receipts.length]);

  // Filter receipt items based on selected filters
  const filteredReceiptItems = useMemo(() => {
    return receiptItemsAnalysis.allItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesCompany = selectedCompany === 'all' || item.company === selectedCompany;
      const matchesStockStatus = selectedStockStatus === 'all' || item.stockStatus === selectedStockStatus;
      const matchesPaidAtDelivery = selectedPaidAtDelivery === 'all' || 
        (selectedPaidAtDelivery === 'yes' && item.paidAtDelivery) ||
        (selectedPaidAtDelivery === 'no' && !item.paidAtDelivery);

      return matchesCategory && matchesCompany && matchesStockStatus && matchesPaidAtDelivery;
    });
  }, [receiptItemsAnalysis, selectedCategory, selectedCompany, selectedStockStatus, selectedPaidAtDelivery]);

  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'thisMonth':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case 'thisYear':
        setDateFrom(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
        setDateTo(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      {/* Header with integrated date filter */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">{t('financial')}</h1>
        </div>

        {/* Integrated Date Range Filter */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateFrom" className="text-sm font-medium">{t('fromDate')}</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateTo" className="text-sm font-medium">{t('toDate')}</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleQuickDateRange('thisMonth')}
                className="text-xs"
              >
                {t('thisMonth')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickDateRange('lastMonth')}
                className="text-xs"
              >
                {t('lastMonth')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickDateRange('thisYear')}
                className="text-xs"
              >
                {t('thisYear')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Available Cash Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-lg font-semibold text-green-700 mb-2">{t('availableCash')}</p>
                <p className={cn(
                  "text-3xl font-bold mb-2",
                  financialMetrics.availableCash >= 0 ? "text-green-900" : "text-red-600"
                )}>
                  {financialMetrics.availableCash.toFixed(2)} DH
                </p>
                <p className="text-sm text-green-600">
                  {t('netFlow')}: {financialMetrics.netCashFlow >= 0 ? '+' : ''}{financialMetrics.netCashFlow.toFixed(2)} DH
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <Wallet className="h-10 w-10 text-green-700" />
              </div>
            </div>
            <details className="mt-4">
              <summary className="text-sm text-green-700 cursor-pointer hover:text-green-800 font-medium">
                {t('viewCalculation')}
              </summary>
              <div className="mt-3 text-sm space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span>{t('revenueReceived')}:</span>
                  <span className="font-medium">+{financialMetrics.totalReceived.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('paidOperationalExpenses')}:</span>
                  <span className="font-medium">-{financialMetrics.operationalExpenses.paid.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('paidMontageExpenses')}:</span>
                  <span className="font-medium">-{financialMetrics.montageMetrics.paid.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('paidAtDeliveryCosts')}:</span>
                  <span className="font-medium">-{financialMetrics.totalPaidAtDeliveryCost.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-green-800">
                  <span>{t('availableCash')}:</span>
                  <span>{financialMetrics.availableCash.toFixed(2)} DH</span>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Total Revenue Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-lg font-semibold text-blue-700 mb-2">{t('totalRevenue')}</p>
                <p className="text-3xl font-bold text-blue-900 mb-2">
                  {financialMetrics.totalRevenue.toFixed(2)} DH
                </p>
                <p className="text-sm text-blue-600">
                  {t('collected')}: {financialMetrics.collectionRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <TrendingUp className="h-10 w-10 text-blue-700" />
              </div>
            </div>
            <details className="mt-4">
              <summary className="text-sm text-blue-700 cursor-pointer hover:text-blue-800 font-medium">
                {t('viewCalculation')}
              </summary>
              <div className="mt-3 text-sm space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span>{t('totalInvoicedRevenue')}:</span>
                  <span className="font-medium">{financialMetrics.totalRevenue.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('revenueReceived')}:</span>
                  <span className="font-medium">{financialMetrics.totalReceived.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('unclaimedBalance')}:</span>
                  <span className="font-medium">{financialMetrics.totalOutstanding.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-blue-800">
                  <span>{t('collectionValue')}:</span>
                  <span>{financialMetrics.totalReceived.toFixed(2)} DH ({financialMetrics.collectionRate.toFixed(1)}%)</span>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Net Profit (Total) Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg">
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-lg font-semibold text-emerald-700 mb-2">{t('netProfitTotal')}</p>
                <p className={cn(
                  "text-3xl font-bold mb-2",
                  financialMetrics.netProfitAfterAllExpenses >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {financialMetrics.netProfitAfterAllExpenses.toFixed(2)} DH
                </p>
                <p className="text-sm text-emerald-600">
                  {t('margin')}: {financialMetrics.totalRevenue > 0 ? (financialMetrics.netMarginTotal).toFixed(1) : '0.0'}%
                </p>
              </div>
              <div className="bg-emerald-200 p-3 rounded-full">
                <Target className="h-10 w-10 text-emerald-700" />
              </div>
            </div>
            <details className="mt-4">
              <summary className="text-sm text-emerald-700 cursor-pointer hover:text-emerald-800 font-medium">
                {t('viewCalculation')}
              </summary>
              <div className="mt-3 text-sm space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span>{t('totalInvoicedRevenue')}:</span>
                  <span className="font-medium">+{financialMetrics.totalRevenue.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('productCosts')} (COGS):</span>
                  <span className="font-medium">-{financialMetrics.totalProductCosts.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('totalOperationalExpenses')}:</span>
                  <span className="font-medium">-{financialMetrics.operationalExpenses.total.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('totalMontageExpenses')}:</span>
                  <span className="font-medium">-{financialMetrics.montageMetrics.total.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-emerald-800">
                  <span>{t('netProfitTotal')}:</span>
                  <span>{financialMetrics.netProfitAfterAllExpenses.toFixed(2)} DH</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  * {t('includesUnpaidBalance')} ({financialMetrics.totalOutstanding.toFixed(2)} DH)
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Expense Analysis */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Operational Expenses Detail */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2 text-lg">{t('operationalExpenses')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">{t('total')}</span>
                  <span className="font-bold text-purple-600">{financialMetrics.operationalExpenses.total.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-600">{t('paid')}</span>
                  <span className="font-bold text-green-600">{financialMetrics.operationalExpenses.paid.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-600">{t('unpaid')}</span>
                  <span className="font-bold text-red-600">{financialMetrics.operationalExpenses.unpaid.toFixed(2)} DH</span>
                </div>
                {financialMetrics.operationalExpenses.total > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {t('payment')}: {((financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100).toFixed(1)}%
                    </div>
                    <Progress value={(financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100} className="h-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Montage Costs Detail */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2 text-lg">{t('montageCosts')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="font-medium">{t('total')}</span>
                  <span className="font-bold text-indigo-600">{financialMetrics.montageMetrics.total.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-600">{t('paid')}</span>
                  <span className="font-bold text-green-600">{financialMetrics.montageMetrics.paid.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-600">{t('unpaid')}</span>
                  <span className="font-bold text-red-600">{financialMetrics.montageMetrics.unpaid.toFixed(2)} DH</span>
                </div>
                {financialMetrics.montageMetrics.total > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {t('payment')}: {((financialMetrics.montageMetrics.paid / financialMetrics.montageMetrics.total) * 100).toFixed(1)}%
                    </div>
                    <Progress value={(financialMetrics.montageMetrics.paid / financialMetrics.montageMetrics.total) * 100} className="h-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Costs Analysis by Category */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2 text-lg">{t('productCostsByCategory')}</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(financialMetrics.productAnalysis.categories).map(([category, data]) => (
                  <div key={category} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between font-medium mb-2">
                      <span className="text-gray-800">{category}</span>
                      <span className="text-gray-900">{data.cost.toFixed(2)} DH</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('profit')}:</span>
                        <span className={cn("font-medium", data.profit >= 0 ? "text-green-600" : "text-red-600")}>
                          {data.profit.toFixed(2)} DH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('margin')}:</span>
                        <span className={cn("font-medium", data.margin >= 0 ? "text-green-600" : "text-red-600")}>
                          {data.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between font-bold text-blue-800">
                  <span>{t('totalProductCosts')}:</span>
                  <span>{financialMetrics.totalProductCosts.toFixed(2)} DH</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Receipt Items Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('comprehensiveReceiptItemsAnalysis')}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {t('detailedAnalysisAllSoldItems')}
          </p>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="space-y-4 mb-6">
            {/* Include/Exclude Paid at Delivery Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
              <input
                type="checkbox"
                id="includePaidAtDelivery"
                checked={includePaidAtDelivery}
                onChange={(e) => setIncludePaidAtDelivery(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <Label htmlFor="includePaidAtDelivery" className="text-sm font-medium">
                {t('includePaidAtDeliveryItems')}
              </Label>
              <span className="text-xs text-gray-500 ml-2">
                ({includePaidAtDelivery ? t('currentlyIncluding') : t('currentlyExcluding')} {t('paidAtDeliveryItems')})
              </span>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="categoryFilter">{t('categoryFilter')}</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCategories')}</SelectItem>
                    {Object.keys(receiptItemsAnalysis.summaryData.categories).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="companyFilter">{t('companyFilter')}</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCompanies')}</SelectItem>
                    {!receiptsLoading && Object.keys(receiptItemsAnalysis.summaryData.companies).map(company => (
                      <SelectItem key={company} value={company}>{company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stockFilter">{t('stockStatusFilter')}</Label>
                <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStockStatus')}</SelectItem>
                    <SelectItem value="InStock">{t('inStock')}</SelectItem>
                    <SelectItem value="Fabrication">{t('fabrication')}</SelectItem>
                    <SelectItem value="Order">{t('order')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paidAtDeliveryFilter">{t('paidAtDeliveryFilter')}</Label>
                <Select value={selectedPaidAtDelivery} onValueChange={setSelectedPaidAtDelivery}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allItems')}</SelectItem>
                    <SelectItem value="yes">{t('paidAtDelivery')}</SelectItem>
                    <SelectItem value="no">{t('notPaidAtDelivery')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600 mb-1">{t('totalItems')}</p>
              <p className="text-xl font-bold text-blue-900">{filteredReceiptItems.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600 mb-1">{t('totalRevenue')}</p>
              <p className="text-xl font-bold text-green-900">
                {filteredReceiptItems.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)} DH
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-600 mb-1">{t('totalCost')}</p>
              <p className="text-xl font-bold text-red-900">
                {filteredReceiptItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)} DH
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600 mb-1">{t('totalProfit')}</p>
              <p className={cn(
                "text-xl font-bold",
                filteredReceiptItems.reduce((sum, item) => sum + item.profit, 0) >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {filteredReceiptItems.reduce((sum, item) => sum + item.profit, 0).toFixed(2)} DH
              </p>
            </div>
          </div>

          {/* Detailed Items List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredReceiptItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{item.productName}</h5>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{item.category}</span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{item.company}</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{item.stockStatus}</span>
                      {item.paidAtDelivery && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Paid at Delivery</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">Qty: {item.quantity}</div>
                    <div className="text-sm text-gray-600">
                      {item.price.toFixed(2)} DH × {item.quantity} = {item.totalRevenue.toFixed(2)} DH
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Unit Cost: </span>
                    <span className="font-medium">{item.cost.toFixed(2)} DH</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost: </span>
                    <span className="font-medium text-red-600">{item.totalCost.toFixed(2)} DH</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profit: </span>
                    <span className={cn(
                      "font-medium",
                      item.profit >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {item.profit.toFixed(2)} DH
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Margin: </span>
                    <span className={cn(
                      "font-medium",
                      item.margin >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {item.margin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredReceiptItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('noItemsFoundMatchingFilters')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Capital Expenditure and Operational Expenses Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('detailedExpenditureAnalysis')}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {t('analysisOfCapitalExpenditureAndOperationalExpenses')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Summary Cards with Better Visual Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capital Expenditure Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-200 p-3 rounded-full">
                    <Package className="h-6 w-6 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg">{t('totalCapitalExpenditure')}</h3>
                    <p className="text-sm text-purple-700">{t('capitalPurchases')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-900">
                    {financialMetrics.capitalAnalysis.total.toFixed(2)} DH
                  </div>
                  {financialMetrics.capitalAnalysis.total > 0 && (
                    <div className="text-sm text-purple-600">
                      {((financialMetrics.capitalAnalysis.paid / financialMetrics.capitalAnalysis.total) * 100).toFixed(1)}% {t('paidPercentage')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">{t('amountPaid')}</div>
                  <div className="font-bold text-green-700">{financialMetrics.capitalAnalysis.paid.toFixed(2)} DH</div>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">{t('outstandingBalance')}</div>
                  <div className="font-bold text-red-600">{financialMetrics.capitalAnalysis.outstanding.toFixed(2)} DH</div>
                </div>
              </div>

              {financialMetrics.capitalAnalysis.total > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-purple-700 font-medium">{t('paymentProgress')}</div>
                  <Progress 
                    value={(financialMetrics.capitalAnalysis.paid / financialMetrics.capitalAnalysis.total) * 100} 
                    className="h-3 bg-white bg-opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Operational Expenses Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-200 p-3 rounded-full">
                    <TrendingDown className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">{t('totalOperationalExpenses')}</h3>
                    <p className="text-sm text-blue-700">{t('operational')} {t('expenses')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {financialMetrics.operationalExpenses.total.toFixed(2)} DH
                  </div>
                  {financialMetrics.operationalExpenses.total > 0 && (
                    <div className="text-sm text-blue-600">
                      {((financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100).toFixed(1)}% {t('paidPercentage')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">{t('amountPaid')}</div>
                  <div className="font-bold text-green-700">{financialMetrics.operationalExpenses.paid.toFixed(2)} DH</div>
                </div>
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">{t('outstandingBalance')}</div>
                  <div className="font-bold text-red-600">{financialMetrics.operationalExpenses.unpaid.toFixed(2)} DH</div>
                </div>
              </div>

              {financialMetrics.operationalExpenses.total > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-blue-700 font-medium">{t('paymentProgress')}</div>
                  <Progress 
                    value={(financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100} 
                    className="h-3 bg-white bg-opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-gray-600" />
              <h4 className="font-semibold text-gray-800">{t('expenseFilters')}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expenseTypeFilter" className="text-sm font-medium text-gray-700">{t('expenseTypeFilter')}</Label>
                <Select value={selectedExpenseType} onValueChange={setSelectedExpenseType}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allExpenseTypes')}</SelectItem>
                    <SelectItem value="Capital Expenditure">{t('capitalExpenditure')}</SelectItem>
                    <SelectItem value="Operational Expenses">{t('operationalExpenses')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatusFilter" className="text-sm font-medium text-gray-700">{t('paymentStatusFilter')}</Label>
                <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allPaymentStatus')}</SelectItem>
                    <SelectItem value="paid">{t('paid')}</SelectItem>
                    <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                    <SelectItem value="partial">{t('partiallyPaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supplierFilter" className="text-sm font-medium text-gray-700">{t('supplierFilter')}</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allSuppliers')}</SelectItem>
                    {Array.from(new Set(filteredPurchases.map(p => p.supplier?.name || 'Unknown'))).map(supplier => (
                      <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enhanced Expenses List with Better Design */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t('capitalExpenditureBreakdown')}
            </h4>
            
            <div className="bg-white border rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                {(() => {
                  const filteredExpenses = filteredPurchases.filter(purchase => {
                    const matchesType = selectedExpenseType === 'all' || purchase.purchase_type === selectedExpenseType;
                    const matchesSupplier = selectedSupplier === 'all' || (purchase.supplier?.name || 'Unknown') === selectedSupplier;

                    const paid = purchase.advance_payment || 0;
                    const total = purchase.amount_ttc || purchase.amount || 0;
                    const outstanding = total - paid;

                    let matchesPaymentStatus = true;
                    if (selectedPaymentStatus === 'paid') {
                      matchesPaymentStatus = outstanding === 0 && paid > 0;
                    } else if (selectedPaymentStatus === 'unpaid') {
                      matchesPaymentStatus = paid === 0;
                    } else if (selectedPaymentStatus === 'partial') {
                      matchesPaymentStatus = paid > 0 && outstanding > 0;
                    }

                    return matchesType && matchesSupplier && matchesPaymentStatus;
                  });

                  if (filteredExpenses.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <AlertTriangle className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">{t('noExpensesFoundMatchingFilters')}</p>
                        <p className="text-sm">Try adjusting your filters to see more expenses</p>
                      </div>
                    );
                  }

                  return filteredExpenses.map((purchase, index) => {
                    const total = purchase.amount_ttc || purchase.amount || 0;
                    const paid = purchase.advance_payment || 0;
                    const outstanding = total - paid;
                    const paymentPercentage = total > 0 ? (paid / total) * 100 : 0;

                    return (
                      <div key={purchase.id} className={cn(
                        "p-4 transition-colors hover:bg-gray-50",
                        index !== filteredExpenses.length - 1 && "border-b"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900 truncate pr-4">{purchase.description}</h5>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-bold text-gray-900">{total.toFixed(2)} DH</div>
                                <div className="text-xs text-gray-500">{format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}</div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                purchase.purchase_type === 'Capital Expenditure' ? 
                                  "bg-purple-100 text-purple-700 border border-purple-200" : 
                                  "bg-blue-100 text-blue-700 border border-blue-200"
                              )}>
                                {purchase.purchase_type === 'Capital Expenditure' ? t('capitalExpenditure') : t('operationalExpenses')}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                                {t('supplier')}: {purchase.supplier?.name || 'Unknown'}
                              </span>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium border",
                                outstanding === 0 && paid > 0 ? 
                                  "bg-green-100 text-green-700 border-green-200" :
                                paid === 0 ? 
                                  "bg-red-100 text-red-700 border-red-200" :
                                  "bg-yellow-100 text-yellow-700 border-yellow-200"
                              )}>
                                {outstanding === 0 && paid > 0 ? t('fullyPaid') :
                                 paid === 0 ? t('unpaid') : t('partiallyPaid')}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                                <div className="text-xs text-green-600 mb-1">{t('paid')}</div>
                                <div className="font-bold text-green-700">{paid.toFixed(2)} DH</div>
                              </div>
                              {outstanding > 0 && (
                                <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                  <div className="text-xs text-red-600 mb-1">{t('outstanding')}</div>
                                  <div className="font-bold text-red-700">{outstanding.toFixed(2)} DH</div>
                                </div>
                              )}
                            </div>

                            {total > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>{t('paymentProgress')}</span>
                                  <span>{paymentPercentage.toFixed(1)}%</span>
                                </div>
                                <Progress 
                                  value={paymentPercentage} 
                                  className="h-2"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Enhanced Summary Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-gray-600" />
                {t('totalFilteredExpenses')}
              </h4>
              <div className="text-sm text-gray-500">
                {(() => {
                  const filteredExpenses = filteredPurchases.filter(purchase => {
                    const matchesType = selectedExpenseType === 'all' || purchase.purchase_type === selectedExpenseType;
                    const matchesSupplier = selectedSupplier === 'all' || (purchase.supplier?.name || 'Unknown') === selectedSupplier;

                    const paid = purchase.advance_payment || 0;
                    const total = purchase.amount_ttc || purchase.amount || 0;
                    const outstanding = total - paid;

                    let matchesPaymentStatus = true;
                    if (selectedPaymentStatus === 'paid') {
                      matchesPaymentStatus = outstanding === 0 && paid > 0;
                    } else if (selectedPaymentStatus === 'unpaid') {
                      matchesPaymentStatus = paid === 0;
                    } else if (selectedPaymentStatus === 'partial') {
                      matchesPaymentStatus = paid > 0 && outstanding > 0;
                    }

                    return matchesType && matchesSupplier && matchesPaymentStatus;
                  });
                  return `${filteredExpenses.length} ${t('itemsCount')}`;
                })()}
              </div>
            </div>
            
            {(() => {
              const filteredExpenses = filteredPurchases.filter(purchase => {
                const matchesType = selectedExpenseType === 'all' || purchase.purchase_type === selectedExpenseType;
                const matchesSupplier = selectedSupplier === 'all' || (purchase.supplier?.name || 'Unknown') === selectedSupplier;

                const paid = purchase.advance_payment || 0;
                const total = purchase.amount_ttc || purchase.amount || 0;
                const outstanding = total - paid;

                let matchesPaymentStatus = true;
                if (selectedPaymentStatus === 'paid') {
                  matchesPaymentStatus = outstanding === 0 && paid > 0;
                } else if (selectedPaymentStatus === 'unpaid') {
                  matchesPaymentStatus = paid === 0;
                } else if (selectedPaymentStatus === 'partial') {
                  matchesPaymentStatus = paid > 0 && outstanding > 0;
                }

                return matchesType && matchesSupplier && matchesPaymentStatus;
              });

              const totalAmount = filteredExpenses.reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount || 0), 0);
              const totalPaid = filteredExpenses.reduce((sum, purchase) => sum + (purchase.advance_payment || 0), 0);
              const totalOutstanding = totalAmount - totalPaid;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">{t('totalAmount')}</div>
                    <div className="text-2xl font-bold text-gray-900">{totalAmount.toFixed(2)} DH</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                    <div className="text-sm text-green-600 mb-1">{t('totalPaid')}</div>
                    <div className="text-2xl font-bold text-green-700">{totalPaid.toFixed(2)} DH</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                    <div className="text-sm text-red-600 mb-1">{t('totalOutstanding')}</div>
                    <div className="text-2xl font-bold text-red-700">{totalOutstanding.toFixed(2)} DH</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default Financial;