
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Building2, Package, Wrench, Calculator, Wallet, AlertTriangle, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Receipt {
  id: string;
  total: number;
  cost_ttc: number;
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
  supplier?: {
    name: string;
  };
}

const Financial = () => {
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

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
              category
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
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

  // Filter data by date range
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
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
    // Revenue calculations
    const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
    const totalReceived = filteredReceipts.reduce((sum, receipt) => sum + (receipt.advance_payment || 0), 0);
    const totalOutstanding = filteredReceipts.reduce((sum, receipt) => sum + (receipt.balance || 0), 0);

    // Product costs by category with better tracking
    const productCostsByCategory = filteredReceipts.reduce((acc, receipt) => {
      if (Array.isArray(receipt.receipt_items)) {
        receipt.receipt_items.forEach(item => {
          const quantity = Number(item.quantity) || 1;
          const cost = Number(item.cost) || 0;
          const price = Number(item.price) || 0;
          const totalItemCost = cost * quantity;
          const totalItemRevenue = price * quantity;
          const category = item.product?.category || 'Unknown';

          if (!acc[category]) {
            acc[category] = { cost: 0, revenue: 0, profit: 0, margin: 0 };
          }
          acc[category].cost += totalItemCost;
          acc[category].revenue += totalItemRevenue;
          acc[category].profit = acc[category].revenue - acc[category].cost;
          acc[category].margin = acc[category].revenue > 0 ? (acc[category].profit / acc[category].revenue) * 100 : 0;
        });
      }
      return acc;
    }, {} as Record<string, { cost: number; revenue: number; profit: number; margin: number }>);

    const totalProductCosts = Object.values(productCostsByCategory).reduce((sum, cat) => sum + cat.cost, 0);

    // Enhanced montage costs tracking
    const linkedMontageReceipts = new Set();
    filteredPurchases.forEach(purchase => {
      if (purchase.linking_category === 'montage_costs' && purchase.linked_receipts) {
        purchase.linked_receipts.forEach(receiptId => linkedMontageReceipts.add(receiptId));
      }
    });

    const montageMetrics = filteredReceipts.reduce((acc, receipt) => {
      const montageCost = receipt.montage_costs || 0;
      if (montageCost > 0) {
        acc.total += montageCost;
        
        // Only count as operational cost if not linked to a purchase
        if (!linkedMontageReceipts.has(receipt.id)) {
          acc.operational += montageCost;
        }
        
        // Track paid/unpaid based on montage status
        if (receipt.montage_status === 'Paid costs') {
          acc.paid += montageCost;
        } else {
          acc.unpaid += montageCost;
        }
      }
      return acc;
    }, { total: 0, operational: 0, paid: 0, unpaid: 0 });

    // Operational expenses (actually paid)
    const operationalExpenses = filteredPurchases
      .filter(purchase => purchase.purchase_type === 'Operational Expenses')
      .reduce((sum, purchase) => sum + (purchase.advance_payment || 0), 0);

    // Capital expenditure breakdown
    const capitalPurchases = filteredPurchases.filter(purchase => purchase.purchase_type === 'Capital Expenditure');
    const capitalExpenditure = capitalPurchases.reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount), 0);
    const capitalPaidOff = capitalPurchases.reduce((sum, purchase) => sum + (purchase.advance_payment || 0), 0);
    const capitalOutstanding = capitalExpenditure - capitalPaidOff;

    // Cash flow calculation
    const cashInflow = totalReceived; // Actually received payments
    const cashOutflow = operationalExpenses + montageMetrics.operational; // Actually paid expenses
    const netCashFlow = cashInflow - cashOutflow;
    const availableCash = netCashFlow; // Current cash position

    // Profit calculations
    const grossProfit = totalRevenue - totalProductCosts;
    const netProfit = grossProfit - operationalExpenses - montageMetrics.operational;

    // Performance ratios
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const collectionRate = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    return {
      // Revenue
      totalRevenue,
      totalReceived,
      totalOutstanding,
      
      // Costs
      totalProductCosts,
      productCostsByCategory,
      montageMetrics,
      operationalExpenses,
      
      // Capital
      capitalExpenditure,
      capitalPaidOff,
      capitalOutstanding,
      
      // Cash Flow
      cashInflow,
      cashOutflow,
      netCashFlow,
      availableCash,
      
      // Profits
      grossProfit,
      netProfit,
      
      // Ratios
      grossMargin,
      netMargin,
      collectionRate
    };
  }, [filteredReceipts, filteredPurchases]);

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
          <p className="text-gray-600 mt-1">Comprehensive business financial analytics & cash flow tracking</p>
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

      {/* Cash Flow & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                  Cash Flow: {financialMetrics.netCashFlow >= 0 ? '+' : ''}{financialMetrics.netCashFlow.toFixed(2)} DH
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
                  Received: {financialMetrics.totalReceived.toFixed(2)} DH
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
                <p className="text-sm font-medium text-purple-600">Net Profit</p>
                <p className={cn(
                  "text-2xl font-bold",
                  financialMetrics.netProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {financialMetrics.netProfit.toFixed(2)} DH
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Margin: {financialMetrics.netMargin.toFixed(1)}%
                </p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-900">
                  {financialMetrics.totalOutstanding.toFixed(2)} DH
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Collection Rate: {financialMetrics.collectionRate.toFixed(1)}%
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
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-900">
                  {(financialMetrics.operationalExpenses + financialMetrics.montageMetrics.operational).toFixed(2)} DH
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Actually Paid
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue & Cash Flow Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue & Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Total Revenue</span>
                <span className="font-bold text-blue-600">
                  {financialMetrics.totalRevenue.toFixed(2)} DH
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Cash Received</span>
                <span className="font-bold text-green-600">
                  {financialMetrics.totalReceived.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Outstanding Balance</span>
                <span className="font-bold text-orange-600">
                  {financialMetrics.totalOutstanding.toFixed(2)} DH
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Collection Progress</span>
                  <span>{financialMetrics.collectionRate.toFixed(1)}%</span>
                </div>
                <Progress value={financialMetrics.collectionRate} className="h-2" />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Net Cash Flow</span>
                  <span className={cn(
                    "font-bold",
                    financialMetrics.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {financialMetrics.netCashFlow >= 0 ? '+' : ''}{financialMetrics.netCashFlow.toFixed(2)} DH
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Product Costs</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.totalProductCosts.toFixed(2)} DH
                </span>
              </div>
              
              {/* Product costs by category */}
              <div className="ml-4 space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(financialMetrics.productCostsByCategory).map(([category, data]) => (
                  <div key={category} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{category}</span>
                    <div className="text-right">
                      <div className="font-medium">{data.cost.toFixed(2)} DH</div>
                      <div className={cn(
                        "text-xs",
                        data.margin >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {data.margin.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Montage Costs (Operational)</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.montageMetrics.operational.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Operational Expenses (Paid)</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.operationalExpenses.toFixed(2)} DH
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">Total Cash Outflow</span>
                  <span className="font-bold text-red-600">
                    {financialMetrics.cashOutflow.toFixed(2)} DH
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Montage & Capital Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Montage Costs Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Montage Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Total Montage Costs</span>
                <span className="font-bold text-purple-900">
                  {financialMetrics.montageMetrics.total.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Paid Montage</span>
                <span className="font-bold text-green-600">
                  {financialMetrics.montageMetrics.paid.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Unpaid Montage</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.montageMetrics.unpaid.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Operational Impact</span>
                <span className="font-bold text-orange-600">
                  {financialMetrics.montageMetrics.operational.toFixed(2)} DH
                </span>
              </div>

              {financialMetrics.montageMetrics.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Payment Progress</span>
                    <span>{((financialMetrics.montageMetrics.paid / financialMetrics.montageMetrics.total) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(financialMetrics.montageMetrics.paid / financialMetrics.montageMetrics.total) * 100} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capital Expenditure Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Capital Expenditure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Total Capital Expenditure</span>
                <span className="font-bold text-purple-900">
                  {financialMetrics.capitalExpenditure.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Amount Paid</span>
                <span className="font-bold text-green-600">
                  {financialMetrics.capitalPaidOff.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Outstanding Balance</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.capitalOutstanding.toFixed(2)} DH
                </span>
              </div>

              {financialMetrics.capitalExpenditure > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Payment Progress</span>
                    <span>{((financialMetrics.capitalPaidOff / financialMetrics.capitalExpenditure) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(financialMetrics.capitalPaidOff / financialMetrics.capitalExpenditure) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <p className="text-sm text-gray-600 mb-1">Number of Orders</p>
              <p className="text-2xl font-bold text-blue-600">{filteredReceipts.length}</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Purchases Made</p>
              <p className="text-2xl font-bold text-orange-600">{filteredPurchases.length}</p>
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
              <p className="text-sm text-gray-600 mb-1">Net Margin</p>
              <p className={cn(
                "text-2xl font-bold",
                financialMetrics.netMargin >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {financialMetrics.netMargin.toFixed(1)}%
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
