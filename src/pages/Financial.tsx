
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Building2, Package, Wrench, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
}

const Financial = () => {
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Fetch receipts
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

  // Fetch purchases
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
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

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    // Total Revenue
    const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);

    // Product costs by category
    const productCostsByCategory = filteredReceipts.reduce((acc, receipt) => {
      if (Array.isArray(receipt.receipt_items)) {
        receipt.receipt_items.forEach(item => {
          const quantity = Number(item.quantity) || 1;
          const cost = Number(item.cost) || 0;
          const totalItemCost = cost * quantity;
          const category = item.product?.category || 'Unknown';

          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += totalItemCost;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const totalProductCosts = Object.values(productCostsByCategory).reduce((sum, cost) => sum + cost, 0);

    // Montage costs (excluding linked purchases to avoid double counting)
    const linkedMontageReceipts = new Set();
    filteredPurchases.forEach(purchase => {
      if (purchase.linking_category === 'montage_costs' && purchase.linked_receipts) {
        purchase.linked_receipts.forEach(receiptId => linkedMontageReceipts.add(receiptId));
      }
    });

    const totalMontageCosts = filteredReceipts.reduce((sum, receipt) => {
      // Only count montage costs if this receipt is not linked to a purchase
      if (!linkedMontageReceipts.has(receipt.id)) {
        return sum + (receipt.montage_costs || 0);
      }
      return sum;
    }, 0);

    // Operational expenses
    const operationalExpenses = filteredPurchases
      .filter(purchase => purchase.purchase_type === 'Operational Expenses')
      .reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount), 0);

    // Capital expenditure
    const capitalExpenditure = filteredPurchases
      .filter(purchase => purchase.purchase_type === 'Capital Expenditure')
      .reduce((sum, purchase) => sum + (purchase.amount_ttc || purchase.amount), 0);

    const capitalPaidOff = filteredPurchases
      .filter(purchase => purchase.purchase_type === 'Capital Expenditure')
      .reduce((sum, purchase) => sum + (purchase.advance_payment || 0), 0);

    const capitalOutstanding = capitalExpenditure - capitalPaidOff;

    // Total profit calculation
    const totalProfit = totalRevenue - operationalExpenses - totalProductCosts - totalMontageCosts;

    return {
      totalRevenue,
      totalProductCosts,
      productCostsByCategory,
      totalMontageCosts,
      operationalExpenses,
      capitalExpenditure,
      capitalPaidOff,
      capitalOutstanding,
      totalProfit
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
          <p className="text-gray-600 mt-1">Comprehensive business financial analytics</p>
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

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {financialMetrics.totalRevenue.toFixed(2)} DH
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Profit</p>
                <p className={cn(
                  "text-2xl font-bold",
                  financialMetrics.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {financialMetrics.totalProfit.toFixed(2)} DH
                </p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Operational Expenses</p>
                <p className="text-2xl font-bold text-orange-900">
                  {financialMetrics.operationalExpenses.toFixed(2)} DH
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Capital Expenditure</p>
                <p className="text-2xl font-bold text-purple-900">
                  {financialMetrics.capitalExpenditure.toFixed(2)} DH
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cost Breakdown
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
              <div className="ml-4 space-y-2">
                {Object.entries(financialMetrics.productCostsByCategory).map(([category, cost]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium">{cost.toFixed(2)} DH</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Montage Costs</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.totalMontageCosts.toFixed(2)} DH
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Operational Expenses</span>
                <span className="font-bold text-red-600">
                  {financialMetrics.operationalExpenses.toFixed(2)} DH
                </span>
              </div>
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((financialMetrics.capitalPaidOff / financialMetrics.capitalExpenditure) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Number of Receipts</p>
              <p className="text-2xl font-bold text-blue-600">{filteredReceipts.length}</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Number of Purchases</p>
              <p className="text-2xl font-bold text-orange-600">{filteredPurchases.length}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
              <p className={cn(
                "text-2xl font-bold",
                financialMetrics.totalRevenue > 0 
                  ? (financialMetrics.totalProfit / financialMetrics.totalRevenue) >= 0 
                    ? "text-green-600" 
                    : "text-red-600"
                  : "text-gray-600"
              )}>
                {financialMetrics.totalRevenue > 0 
                  ? ((financialMetrics.totalProfit / financialMetrics.totalRevenue) * 100).toFixed(1)
                  : '0.0'
                }%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
