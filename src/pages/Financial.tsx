
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Building2, Package, Calculator, Wallet, AlertTriangle, PieChart, Target, ShoppingCart, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
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
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedPaidAtDelivery, setSelectedPaidAtDelivery] = useState('all');
  const [includePaidAtDelivery, setIncludePaidAtDelivery] = useState(true);

  // Fetch receipts with more detailed data
  const { data: receipts = [] } = useQuery({
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
      return data || [];
    },
    enabled: !!user,
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
  });

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
          const company = item.product?.company || 'Unknown';
          
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
  }, [filteredReceipts, filteredPurchases]);

  // Comprehensive receipt items analysis
  const receiptItemsAnalysis = useMemo(() => {
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
          
          const productName = item.product?.name || `Product ${index + 1}`;
          const category = item.product?.category || 'Unknown';
          const company = item.product?.company || 'Unknown';
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
  }, [filteredReceipts, includePaidAtDelivery]);

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
  }, [receiptItemsAnalysis.allItems, selectedCategory, selectedCompany, selectedStockStatus, selectedPaidAtDelivery]);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-600 mt-1">Comprehensive business financial analytics & profitability tracking</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateTo">To Date</Label>
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
                This Month
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickDateRange('lastMonth')}
                className="text-xs"
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickDateRange('thisYear')}
                className="text-xs"
              >
                This Year
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Available Cash</p>
                <p className={cn(
                  "text-2xl font-bold",
                  financialMetrics.availableCash >= 0 ? "text-green-900" : "text-red-600"
                )}>
                  {financialMetrics.availableCash.toFixed(2)} DH
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Net Flow: {financialMetrics.netCashFlow >= 0 ? '+' : ''}{financialMetrics.netCashFlow.toFixed(2)} DH
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  {financialMetrics.totalRevenue.toFixed(2)} DH
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Collected: {financialMetrics.collectionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Net Profit (Paid)</p>
                <p className={cn(
                  "text-2xl font-bold",
                  financialMetrics.netProfitAfterPaidExpenses >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {financialMetrics.netProfitAfterPaidExpenses.toFixed(2)} DH
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Margin: {financialMetrics.netMarginPaid.toFixed(1)}%
                </p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Net Profit (Total)</p>
                <p className={cn(
                  "text-2xl font-bold",
                  financialMetrics.netProfitAfterAllExpenses >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {financialMetrics.netProfitAfterAllExpenses.toFixed(2)} DH
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Margin: {financialMetrics.netMarginTotal.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Unpaid Expenses</p>
                <p className="text-2xl font-bold text-orange-900">
                  {financialMetrics.totalExpensesUnpaid.toFixed(2)} DH
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Outstanding Liabilities
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Product Costs</p>
                <p className="text-2xl font-bold text-red-900">
                  {financialMetrics.totalProductCosts.toFixed(2)} DH
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Total COGS
                </p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Receipt Items Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Comprehensive Receipt Items Analysis
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Detailed analysis of all sold items with advanced filtering capabilities
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
                Include Paid at Delivery Items
              </Label>
              <span className="text-xs text-gray-500 ml-2">
                ({includePaidAtDelivery ? 'Currently including' : 'Currently excluding'} paid at delivery items)
              </span>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="categoryFilter">Category Filter</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(receiptItemsAnalysis.summaryData.categories).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="companyFilter">Company Filter</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {Object.keys(receiptItemsAnalysis.summaryData.companies).map(company => (
                      <SelectItem key={company} value={company}>{company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stockFilter">Stock Status Filter</Label>
                <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Status</SelectItem>
                    <SelectItem value="InStock">In Stock</SelectItem>
                    <SelectItem value="Fabrication">Fabrication</SelectItem>
                    <SelectItem value="Order">Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paidAtDeliveryFilter">Paid at Delivery Filter</Label>
                <Select value={selectedPaidAtDelivery} onValueChange={setSelectedPaidAtDelivery}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="yes">Paid at Delivery</SelectItem>
                    <SelectItem value="no">Not Paid at Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600 mb-1">Total Items</p>
              <p className="text-xl font-bold text-blue-900">{filteredReceiptItems.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600 mb-1">Total Revenue</p>
              <p className="text-xl font-bold text-green-900">
                {filteredReceiptItems.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)} DH
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-600 mb-1">Total Cost</p>
              <p className="text-xl font-bold text-red-900">
                {filteredReceiptItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)} DH
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600 mb-1">Total Profit</p>
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
              No items found matching the selected filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprehensive Financial Analysis - Integrated Profit & Expenses */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Comprehensive Financial Analysis & Profit Breakdown
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Complete profit analysis including all costs, expenses, and unclaimed balance scenarios
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Revenue and Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Side */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">Revenue Analysis</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Total Revenue (Invoiced)</span>
                    <span className="font-bold text-blue-600">
                      {financialMetrics.totalRevenue.toFixed(2)} DH
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Revenue Received</span>
                    <span className="font-bold text-green-600">
                      {financialMetrics.totalReceived.toFixed(2)} DH
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Unclaimed Balance</span>
                    <span className="font-bold text-orange-600">
                      {financialMetrics.totalOutstanding.toFixed(2)} DH
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">Cost Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Product Costs (COGS)</span>
                    <span className="font-bold text-red-600">
                      {financialMetrics.totalProductCosts.toFixed(2)} DH
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Operational Expenses</span>
                    <span className="font-bold text-purple-600">
                      {financialMetrics.operationalExpenses.total.toFixed(2)} DH
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                    <span className="font-medium">Montage Costs</span>
                    <span className="font-bold text-indigo-600">
                      {financialMetrics.montageMetrics.total.toFixed(2)} DH
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Expense Analysis */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Detailed Expense Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Operational Expenses Detail */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 border-b pb-1">Operational Expenses</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total</span>
                      <span className="font-medium">{financialMetrics.operationalExpenses.total.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Paid</span>
                      <span className="font-medium text-green-600">{financialMetrics.operationalExpenses.paid.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Unpaid</span>
                      <span className="font-medium text-red-600">{financialMetrics.operationalExpenses.unpaid.toFixed(2)} DH</span>
                    </div>
                    {financialMetrics.operationalExpenses.total > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">
                          Payment: {((financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100).toFixed(1)}%
                        </div>
                        <Progress value={(financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Montage Costs Detail */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 border-b pb-1">Montage Costs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total</span>
                      <span className="font-medium">{financialMetrics.montageMetrics.total.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Paid</span>
                      <span className="font-medium text-green-600">{financialMetrics.montageMetrics.paid.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Unpaid</span>
                      <span className="font-medium text-red-600">{financialMetrics.montageMetrics.unpaid.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">Operational</span>
                      <span className="font-medium text-orange-600">{financialMetrics.montageMetrics.operational.toFixed(2)} DH</span>
                    </div>
                    {financialMetrics.montageMetrics.total > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">
                          Payment: {((financialMetrics.montageMetrics.paid / financialMetrics.montageMetrics.total) * 100).toFixed(1)}%
                        </div>
                        <Progress value={(financialMetrics.montageMetrics.paid / financialMetrics.montageMetrics.total) * 100} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Costs Detail */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 border-b pb-1">Product Costs (COGS)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Product Costs</span>
                      <span className="font-medium">{financialMetrics.totalProductCosts.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Direct Material Costs</span>
                      <span className="font-medium text-gray-600">{financialMetrics.totalProductCosts.toFixed(2)} DH</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Cost of goods sold from receipt items
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Analysis with Revenue Scenarios */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Profit Analysis & Revenue Scenarios</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Scenario (Based on Received Revenue) */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 bg-gray-50 p-2 rounded">Current Position (Received Revenue)</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Revenue Received</span>
                        <span className="font-bold text-blue-600">{financialMetrics.totalReceived.toFixed(2)} DH</span>
                      </div>
                      <div className="text-xs text-blue-600">Actual cash received from customers</div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Less: Product Costs (Including Paid at Delivery)</span>
                        <span className="text-red-600">-{financialMetrics.totalProductCosts.toFixed(2)} DH</span>
                      </div>
                      <div className="text-xs text-red-500 mb-2">Product costs breakdown:</div>
                      <div className="pl-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>• Direct material costs</span>
                          <span>{(financialMetrics.totalProductCosts - financialMetrics.totalPaidAtDeliveryCost).toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Paid at delivery costs</span>
                          <span>{financialMetrics.totalPaidAtDeliveryCost.toFixed(2)} DH</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-1 mt-2">
                        <span className="text-sm">Less: Paid Op. Expenses</span>
                        <span className="text-red-600">-{financialMetrics.operationalExpenses.paid.toFixed(2)} DH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Less: Paid Montage</span>
                        <span className="text-red-600">-{financialMetrics.montageMetrics.paid.toFixed(2)} DH</span>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Current Net Position</span>
                        <span className={cn(
                          "font-bold text-lg",
                          financialMetrics.availableCash >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {financialMetrics.availableCash.toFixed(2)} DH
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        This is your current cash position after all paid costs
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-yellow-800">Pending Liabilities</span>
                        <span className="font-bold text-yellow-800">-{financialMetrics.totalExpensesUnpaid.toFixed(2)} DH</span>
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">
                        Unpaid expenses that will impact future cash flow
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Scenario (If All Revenue Collected) */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 bg-gray-50 p-2 rounded">Full Potential (If All Revenue Collected)</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Total Invoiced Revenue</span>
                        <span className="font-bold text-blue-600">{financialMetrics.totalRevenue.toFixed(2)} DH</span>
                      </div>
                      <div className="text-xs text-blue-600">Including unclaimed balance: +{financialMetrics.totalOutstanding.toFixed(2)} DH</div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Less: Product Costs (Including Paid at Delivery)</span>
                        <span className="text-red-600">-{financialMetrics.totalProductCosts.toFixed(2)} DH</span>
                      </div>
                      <div className="text-xs text-red-500 mb-2">Product costs breakdown:</div>
                      <div className="pl-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>• Direct material costs</span>
                          <span>{(financialMetrics.totalProductCosts - financialMetrics.totalPaidAtDeliveryCost).toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Paid at delivery costs</span>
                          <span>{financialMetrics.totalPaidAtDeliveryCost.toFixed(2)} DH</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-1 mt-2">
                        <span className="text-sm">Less: All Op. Expenses</span>
                        <span className="text-red-600">-{financialMetrics.operationalExpenses.total.toFixed(2)} DH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Less: All Montage</span>
                        <span className="text-red-600">-{financialMetrics.montageMetrics.total.toFixed(2)} DH</span>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Net Profit</span>
                        <span className={cn(
                          "font-bold text-lg",
                          financialMetrics.netProfitAfterAllExpenses >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {financialMetrics.netProfitAfterAllExpenses.toFixed(2)} DH
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Maximum potential profit if all revenue collected
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-800">Collection Impact</span>
                        <span className="font-bold text-purple-800">
                          +{(financialMetrics.netProfitAfterAllExpenses - financialMetrics.availableCash).toFixed(2)} DH
                        </span>
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        Additional profit from collecting outstanding balance and paying remaining expenses
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Financial Performance Metrics</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Gross Margin</p>
                  <p className={cn(
                    "text-xl font-bold",
                    financialMetrics.grossMargin >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.grossMargin.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net Margin (Current)</p>
                  <p className={cn(
                    "text-xl font-bold",
                    financialMetrics.netMarginPaid >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.netMarginPaid.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net Margin (Full)</p>
                  <p className={cn(
                    "text-xl font-bold",
                    financialMetrics.netMarginTotal >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.netMarginTotal.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
                  <p className="text-xl font-bold text-blue-600">
                    {financialMetrics.collectionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Capital Expenditure Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detailed Capital Expenditure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <span className="font-medium">Total Capital Expenditure</span>
              <span className="font-bold text-purple-900">
                {financialMetrics.capitalAnalysis.total.toFixed(2)} DH
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-medium">Amount Paid</span>
              <span className="font-bold text-green-600">
                {financialMetrics.capitalAnalysis.paid.toFixed(2)} DH
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <span className="font-medium">Outstanding Balance</span>
              <span className="font-bold text-red-600">
                {financialMetrics.capitalAnalysis.outstanding.toFixed(2)} DH
              </span>
            </div>
          </div>

          {financialMetrics.capitalAnalysis.total > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Payment Progress</span>
                <span>{((financialMetrics.capitalAnalysis.paid / financialMetrics.capitalAnalysis.total) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(financialMetrics.capitalAnalysis.paid / financialMetrics.capitalAnalysis.total) * 100} 
                className="h-3"
              />
            </div>
          )}

          {financialMetrics.capitalAnalysis.purchases.length > 0 && (
            <div>
              <h4 className="font-medium mb-4">Capital Expenditure Breakdown</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {financialMetrics.capitalAnalysis.purchases.map((purchase) => (
                  <div key={purchase.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{purchase.description}</h5>
                        <p className="text-sm text-gray-600">Supplier: {purchase.supplier}</p>
                        <p className="text-xs text-gray-500">Date: {format(new Date(purchase.date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{purchase.total.toFixed(2)} DH</div>
                        <div className="text-sm text-green-600">Paid: {purchase.paid.toFixed(2)} DH</div>
                        {purchase.outstanding > 0 && (
                          <div className="text-sm text-red-600">Outstanding: {purchase.outstanding.toFixed(2)} DH</div>
                        )}
                      </div>
                    </div>
                    
                    {purchase.total > 0 && (
                      <div className="mt-3">
                        <Progress 
                          value={(purchase.paid / purchase.total) * 100} 
                          className="h-2"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {((purchase.paid / purchase.total) * 100).toFixed(1)}% paid
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{filteredReceipts.length}</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Capital Purchases</p>
              <p className="text-2xl font-bold text-orange-600">{financialMetrics.capitalAnalysis.purchases.length}</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Gross Margin</p>
              <p className={cn(
                "text-2xl font-bold",
                financialMetrics.grossMargin >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {financialMetrics.grossMargin.toFixed(1)}%
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Net Margin (Paid)</p>
              <p className={cn(
                "text-2xl font-bold",
                financialMetrics.netMarginPaid >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {financialMetrics.netMarginPaid.toFixed(1)}%
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-600">
                {filteredReceipts.length > 0 
                  ? (financialMetrics.totalRevenue / filteredReceipts.length).toFixed(2)
                  : '0.00'
                } DH
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
