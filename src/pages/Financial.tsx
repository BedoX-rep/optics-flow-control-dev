import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';

// Modular Components
import FinancialHeader from '@/components/financial/FinancialHeader';
import FinancialMetricsGrid from '@/components/financial/FinancialMetricsGrid';
import QuickExpenditureAnalysis from '@/components/financial/QuickExpenditureAnalysis';
import OrdersAnalysisSection from '@/components/financial/OrdersAnalysisSection';
import DetailedExpenditureAnalysis from '@/components/financial/DetailedExpenditureAnalysis';

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
  paid_at_delivery_cost?: number;
  clients?: {
    name: string;
  };
  receipt_items: Array<{
    product?: {
      name?: string;
      category?: string;
      stock?: number;
      stock_status?: string;
      company?: string;
    };
    cost: number;
    price: number;
    quantity: number;
    paid_at_delivery?: boolean;
    custom_item_name?: string;
  }>;
}

interface Purchase {
  id: string;
  amount_ttc?: number;
  amount: number;
  advance_payment?: number;
  balance?: number;
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

  // Date State
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Shared Filter State
  const [includePaidAtDelivery, setIncludePaidAtDelivery] = useState(true);
  const [selectedExpenseType, setSelectedExpenseType] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');

  // Logic for quick date range selection
  const handleQuickSelect = (period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    let from = now;
    let to = now;

    switch (period) {
      case 'today':
        from = now;
        to = now;
        break;
      case 'week':
        from = subWeeks(now, 1);
        to = now;
        break;
      case 'month':
        from = subMonths(now, 1);
        to = now;
        break;
      case 'quarter':
        from = subQuarters(now, 1);
        to = now;
        break;
      case 'year':
        from = subYears(now, 1);
        to = now;
        break;
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
    }
    setDateFrom(format(from, 'yyyy-MM-dd'));
    setDateTo(format(to, 'yyyy-MM-dd'));
  };

  // Data Fetching: Receipts
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<Receipt[]>({
    queryKey: ['receipts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id, total, cost_ttc, products_cost, montage_costs, created_at, is_deleted, balance, advance_payment, delivery_status, montage_status, paid_at_delivery_cost,
          clients ( name ),
          receipt_items (
            cost, price, quantity, paid_at_delivery, custom_item_name,
            product:product_id ( name, category, stock, stock_status, company )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any) as Receipt[] || [];
    },
    enabled: !!user,
  });

  // Data Fetching: Purchases
  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select('*, supplier:supplier_id ( name )')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return (data as any) as Purchase[] || [];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('fin-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `user_id=eq.${user.id}` }, () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', user.id] });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Derived Data
  const filteredReceipts = useMemo(() => {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    return receipts.filter(r => {
      if (r.is_deleted) return false;
      const receiptDate = new Date(r.created_at);
      return receiptDate >= fromDate && receiptDate <= toDate;
    });
  }, [receipts, dateFrom, dateTo]);

  const filteredPurchases = useMemo(() => {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    return purchases.filter(p => {
      const purchaseDate = new Date(p.purchase_date);
      return purchaseDate >= fromDate && purchaseDate <= toDate;
    });
  }, [purchases, dateFrom, dateTo]);

  // Comprehensive Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalReceived = filteredReceipts.reduce((sum, r) => sum + (r.advance_payment || 0), 0);
    const totalOutstanding = filteredReceipts.reduce((sum, r) => sum + (r.balance || 0), 0);
    const totalProductCosts = filteredReceipts.reduce((sum, r) => sum + (r.products_cost || 0), 0);
    const totalPaidAtDeliveryCost = filteredReceipts.reduce((sum, r) => sum + (r.paid_at_delivery_cost || 0), 0);

    const operationalExpenses = filteredPurchases.filter(p => p.purchase_type === 'Operational Expenses').reduce((acc, p) => {
      const t = p.amount_ttc || p.amount || 0;
      const pa = p.advance_payment || 0;
      acc.total += t; acc.paid += pa; return acc;
    }, { total: 0, paid: 0 });

    const montageMetrics = filteredReceipts.reduce((acc, r) => {
      const cost = r.montage_costs || 0;
      if (cost > 0 && ['InCutting', 'Ready', 'Paid costs'].includes(r.montage_status)) {
        acc.total += cost;
        if (r.montage_status === 'Paid costs') acc.paid += cost;
      }
      return acc;
    }, { total: 0, paid: 0 });

    const grossProfit = totalRevenue - totalProductCosts;
    const netProfitAfterAllExpenses = grossProfit - operationalExpenses.total - montageMetrics.total;
    const netMarginTotal = totalRevenue > 0 ? (netProfitAfterAllExpenses / totalRevenue) * 100 : 0;
    const availableCash = totalReceived - operationalExpenses.paid - montageMetrics.paid - totalPaidAtDeliveryCost;

    const productAnalysis = {
      categories: filteredReceipts.reduce((acc: any, r) => {
        (r.receipt_items || []).forEach((item: any) => {
          const cat = item.product?.category || 'Unknown';
          const q = item.quantity || 1;
          const c = (item.cost || 0) * q;
          const rev = (item.price || 0) * q;
          if (!acc[cat]) acc[cat] = { cost: 0, revenue: 0, profit: 0, margin: 0 };
          acc[cat].cost += c; acc[cat].revenue += rev;
          acc[cat].profit = acc[cat].revenue - acc[cat].cost;
          acc[cat].margin = acc[cat].revenue > 0 ? (acc[cat].profit / acc[cat].revenue) * 100 : 0;
        });
        return acc;
      }, {})
    };

    return {
      availableCash, totalRevenue, netProfitAfterAllExpenses, totalReceived, totalOutstanding, totalProductCosts,
      operationalExpenses, montageMetrics, netMarginTotal, grossProfit, productAnalysis
    };
  }, [filteredReceipts, filteredPurchases]);

  // Specialized filtering for the detailed expenditure list
  const expenditurePurchases = useMemo(() => {
    return filteredPurchases.filter(p => {
      const matchesType = selectedExpenseType === 'all' || p.purchase_type === selectedExpenseType;
      const matchesSupplier = selectedSupplier === 'all' || (p.supplier?.name || 'Unknown') === selectedSupplier;

      const total = p.amount_ttc || p.amount || 0;
      const paid = p.advance_payment || 0;
      const isPaid = total > 0 && paid >= total;
      const isUnpaid = paid <= 0;
      const isPartial = paid > 0 && paid < total;

      let matchesStatus = true;
      if (selectedPaymentStatus === 'paid') matchesStatus = isPaid;
      else if (selectedPaymentStatus === 'unpaid') matchesStatus = isUnpaid;
      else if (selectedPaymentStatus === 'partial') matchesStatus = isPartial;

      return matchesType && matchesSupplier && matchesStatus;
    });
  }, [filteredPurchases, selectedExpenseType, selectedSupplier, selectedPaymentStatus]);

  const expenditureSummary = useMemo(() => {
    return expenditurePurchases.reduce((acc, p) => {
      const t = p.amount_ttc || p.amount || 0;
      const pa = p.advance_payment || 0;
      acc.total += t; acc.paid += pa; acc.outstanding += (t - pa); acc.count++;
      return acc;
    }, { total: 0, paid: 0, outstanding: 0, count: 0 });
  }, [expenditurePurchases]);

  const categories = useMemo(() => Array.from(new Set(receipts.flatMap(r => (r.receipt_items || []).map((i: any) => i.product?.category)).filter(Boolean))), [receipts]);
  const companies = useMemo(() => Array.from(new Set(receipts.flatMap(r => (r.receipt_items || []).map((i: any) => i.product?.company)).filter(Boolean))), [receipts]);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden animate-in fade-in duration-700">
      <FinancialHeader
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        onQuickSelect={handleQuickSelect}
      />

      <div className="w-full px-6 lg:px-10 relative z-20">
        <FinancialMetricsGrid metrics={metrics} />

        <QuickExpenditureAnalysis metrics={metrics} />

        <OrdersAnalysisSection
          receipts={filteredReceipts}
          itemsLoading={receiptsLoading}
          includePaidAtDelivery={includePaidAtDelivery}
          setIncludePaidAtDelivery={setIncludePaidAtDelivery}
          categories={categories as string[]}
          companies={companies as string[]}
        />

        <DetailedExpenditureAnalysis
          purchases={expenditurePurchases}
          expenseTypeFilter={selectedExpenseType}
          setExpenseTypeFilter={setSelectedExpenseType}
          statusFilter={selectedPaymentStatus}
          setStatusFilter={setSelectedPaymentStatus}
          supplierFilter={selectedSupplier}
          setSupplierFilter={setSelectedSupplier}
          filteredSummary={expenditureSummary}
        />
      </div>
    </div>
  );
};

export default Financial;