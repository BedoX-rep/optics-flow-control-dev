
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
  const [costAnalysisFilter, setCostAnalysisFilter] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');

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
          receipt_items (
            cost,
            price,
            quantity,
            product:product_id (
              category,
              stock,
              stock_status
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

    // Enhanced product costs analysis by category and stock status
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

          // Combined analysis for filtering
          const key = `${category}|${stockStatus}`;
          if (!acc.combined[key]) {
            acc.combined[key] = { 
              category, 
              stockStatus, 
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
      combined: {} as Record<string, { category: string; stockStatus: string; cost: number; revenue: number; profit: number; margin: number; items: number }>
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

    // Enhanced cash flow and profit calculations
    const cashInflow = totalReceived; // Actually received payments
    const totalExpensesPaid = operationalExpenses.paid + montageMetrics.operational; // Actually paid expenses
    const totalExpensesUnpaid = operationalExpenses.unpaid + montageMetrics.unpaid; // Unpaid expenses
    const netCashFlow = cashInflow - totalExpensesPaid;
    const availableCash = netCashFlow; // Current cash position

    // Comprehensive profit calculations using correct product costs
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

  // Filter data for comprehensive cost analysis
  const filteredCostData = useMemo(() => {
    const { productAnalysis } = financialMetrics;
    
    if (costAnalysisFilter === 'category') {
      const filtered = Object.entries(productAnalysis.categories);
      if (selectedCategory === 'all') return filtered;
      return filtered.filter(([category]) => category === selectedCategory);
    } else if (costAnalysisFilter === 'stock') {
      const filtered = Object.entries(productAnalysis.stockStatus);
      if (selectedStockStatus === 'all') return filtered;
      return filtered.filter(([status]) => status === selectedStockStatus);
    } else {
      // Combined filter
      const filtered = Object.values(productAnalysis.combined);
      return filtered.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesStock = selectedStockStatus === 'all' || item.stockStatus === selectedStockStatus;
        return matchesCategory && matchesStock;
      });
    }
  }, [financialMetrics.productAnalysis, costAnalysisFilter, selectedCategory, selectedStockStatus]);

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

      {/* Comprehensive Cost Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Comprehensive Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="analysisType">Analysis Type</Label>
              <Select value={costAnalysisFilter} onValueChange={setCostAnalysisFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">By Category</SelectItem>
                  <SelectItem value="stock">By Stock Status</SelectItem>
                  <SelectItem value="combined">Combined Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(costAnalysisFilter === 'category' || costAnalysisFilter === 'combined') && (
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="categoryFilter">Category Filter</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(financialMetrics.productAnalysis.categories).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(costAnalysisFilter === 'stock' || costAnalysisFilter === 'combined') && (
              <div className="flex-1 min-w-[200px]">
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
            )}
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {costAnalysisFilter === 'combined' ? (
              filteredCostData.map((item: any, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="font-medium text-gray-700">{item.category}</span>
                      <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">{item.stockStatus}</span>
                    </div>
                    <span className="font-bold text-gray-900">{item.cost.toFixed(2)} DH</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Items: </span>
                      <span className="font-medium">{item.items}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue: </span>
                      <span className="font-medium">{item.revenue.toFixed(2)} DH</span>
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
              ))
            ) : (
              filteredCostData.map(([key, data]: [string, any]) => (
                <div key={key} className="border rounded-lg p-3 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{key}</span>
                    <span className="font-bold text-gray-900">{data.cost.toFixed(2)} DH</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>Items: {data.items}</div>
                    <div>Revenue: {data.revenue.toFixed(2)} DH</div>
                    <div className={cn(
                      "font-medium",
                      data.margin >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      Margin: {data.margin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Product Costs</span>
              <span className="font-bold text-red-600">
                {financialMetrics.totalProductCosts.toFixed(2)} DH
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis & Operational Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Enhanced Profit Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comprehensive Profit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Gross Profit</span>
                <span className={cn(
                  "font-bold",
                  financialMetrics.grossProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {financialMetrics.grossProfit.toFixed(2)} DH
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg mb-2">
                  <span className="font-medium">Net Profit (After Paid Expenses)</span>
                  <span className={cn(
                    "font-bold",
                    financialMetrics.netProfitAfterPaidExpenses >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.netProfitAfterPaidExpenses.toFixed(2)} DH
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  This is your actual profit after all paid operational expenses and montage costs.
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg mb-2">
                  <span className="font-medium">Net Profit (After All Expenses)</span>
                  <span className={cn(
                    "font-bold",
                    financialMetrics.netProfitAfterAllExpenses >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.netProfitAfterAllExpenses.toFixed(2)} DH
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  This shows total profit after accounting for all expenses (paid and unpaid).
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-yellow-800">Impact of Unpaid Expenses</span>
                  <span className="font-bold text-yellow-800">
                    -{financialMetrics.totalExpensesUnpaid.toFixed(2)} DH
                  </span>
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  These unpaid expenses will affect future cash flow when paid.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Operational Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Operational Expenses Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Operational Expenses</span>
                <span className="font-bold text-gray-900">
                  {financialMetrics.operationalExpenses.total.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Paid Expenses</span>
                <span className="font-bold text-green-600">
                  {financialMetrics.operationalExpenses.paid.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Unpaid Expenses</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.operationalExpenses.unpaid.toFixed(2)} DH
                </span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Montage Costs</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Montage</span>
                    <span className="font-medium">{financialMetrics.montageMetrics.total.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Paid Montage</span>
                    <span className="font-medium text-green-600">{financialMetrics.montageMetrics.paid.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Unpaid Montage</span>
                    <span className="font-medium text-red-600">{financialMetrics.montageMetrics.unpaid.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Operational Impact</span>
                    <span className="font-medium text-orange-600">{financialMetrics.montageMetrics.operational.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>

              {financialMetrics.operationalExpenses.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Payment Progress</span>
                    <span>{((financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(financialMetrics.operationalExpenses.paid / financialMetrics.operationalExpenses.total) * 100} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
