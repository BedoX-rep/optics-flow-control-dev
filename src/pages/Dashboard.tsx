import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';

// Modular Components
import DashboardHero from '@/components/dashboard/DashboardHero';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import DashboardStockAlerts from '@/components/dashboard/DashboardStockAlerts';
import DashboardActivity from '@/components/dashboard/DashboardActivity';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';

interface DashboardStats {
  newClients: number;
  totalRevenue: number;
  avgSaleValue: number;
  pendingBalance: number;
  pendingReceipts: number;
  completedReceipts: number;
  additionalCosts: number;
  unpaidAdditionalCosts: number;
}

interface ActivityItem {
  id: string;
  type: 'client' | 'receipt' | 'purchase';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Data Fetching
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['receipts-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select(`*, clients(name), receipt_items(*, product:product_id(category))`)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-dashboard-brief', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('products').select('*').eq('user_id', user.id).eq('is_deleted', false);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases-dashboard-brief', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select(`*, supplier:supplier_id(name)`)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const isLoading = receiptsLoading || clientsLoading || productsLoading || purchasesLoading;

  const filteredReceipts = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    return receipts.filter(r => {
      const d = new Date(r.created_at);
      return d >= from && d <= to;
    });
  }, [receipts, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const totalRevenue = filteredReceipts.reduce((s, r) => s + (r.total || 0), 0);
    const outstandingBalance = filteredReceipts.reduce((s, r) => s + (r.balance || 0), 0);
    const avgSaleValue = filteredReceipts.length ? totalRevenue / filteredReceipts.length : 0;

    const montageMetrics = filteredReceipts.reduce((acc, r) => {
      const cost = r.montage_costs || 0;
      if (cost > 0 && ['InCutting', 'Ready', 'Paid costs'].includes(r.montage_status)) {
        acc.total += cost;
        if (r.montage_status === 'Paid costs') acc.paid += cost;
      }
      return acc;
    }, { total: 0, paid: 0 });

    const unpaidAdditionalCosts = montageMetrics.total - montageMetrics.paid;

    const newClientsCount = clients.filter(c => {
      const d = new Date(c.created_at);
      return d >= from && d <= to;
    }).length;

    const pending = filteredReceipts.filter(r => r.delivery_status !== 'Completed' || r.balance > 0).length;
    const completed = filteredReceipts.filter(r => r.delivery_status === 'Completed' && r.balance === 0).length;

    return {
      newClients: newClientsCount,
      totalRevenue,
      avgSaleValue,
      pendingBalance: outstandingBalance,
      pendingReceipts: pending,
      completedReceipts: completed,
      additionalCosts: montageMetrics.total,
      unpaidAdditionalCosts
    };
  }, [filteredReceipts, clients, dateFrom, dateTo]);

  const revenueData = useMemo(() => {
    const dFrom = new Date(dateFrom);
    const dTo = new Date(dateTo);
    const diffDays = Math.ceil((dTo.getTime() - dFrom.getTime()) / (1000 * 3600 * 24)) + 1;

    // If range is more than 30 days, group by month
    if (diffDays > 31) {
      const months: { name: string; value: number }[] = [];
      let current = new Date(dFrom.getFullYear(), dFrom.getMonth(), 1);
      const end = new Date(dTo.getFullYear(), dTo.getMonth(), 1);

      while (current <= end) {
        const monthStart = current;
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);

        const val = filteredReceipts.filter(r => {
          const d = new Date(r.created_at);
          return d >= monthStart && d <= monthEnd;
        }).reduce((s, r) => s + (r.total || 0), 0);

        months.push({
          name: format(current, 'MMM yyyy'),
          value: val
        });

        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      return months;
    }

    // Daily view for ranges <= 31 days
    return [...Array(diffDays)].map((_, i) => {
      const d = new Date(dFrom);
      d.setDate(dFrom.getDate() + i);
      const val = filteredReceipts.filter(r => new Date(r.created_at).toDateString() === d.toDateString())
        .reduce((s, r) => s + (r.total || 0), 0);
      return {
        name: format(d, diffDays <= 7 ? 'EEE' : 'MMM dd'),
        value: val
      };
    });
  }, [filteredReceipts, dateFrom, dateTo]);

  const categoryData = useMemo(() => {
    const cats = filteredReceipts.reduce((acc: any, r) => {
      (r.receipt_items || []).forEach((item: any) => {
        const c = item.product?.category || 'Other';
        acc[c] = (acc[c] || 0) + (item.price * item.quantity);
      });
      return acc;
    }, {});

    return Object.entries(cats)
      .map(([name, value]) => ({
        name: t(name) || name, // Apply translation
        value: value as number
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredReceipts, t]);

  const recentActivity = useMemo(() => {
    return [
      ...clients.map(c => ({ id: `c-${c.id}`, type: 'client' as const, title: t('newClientRegistered'), description: c.name, timestamp: c.created_at })),
      ...receipts.map(r => ({ id: `r-${r.id}`, type: 'receipt' as const, title: t('newReceiptCreated'), description: r.clients?.name || t('unknownClient'), timestamp: r.created_at, amount: r.total })),
      ...purchases.map(p => ({ id: `p-${p.id}`, type: 'purchase' as const, title: t('newPurchaseRecorded'), description: p.supplier?.name || t('unknownSupplier'), timestamp: p.created_at || p.purchase_date, amount: p.amount }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  }, [clients, receipts, purchases, t]);

  const handleQuickRange = (range: string) => {
    const now = new Date();
    if (range === 'thisMonth') { setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd')); setDateTo(format(endOfMonth(now), 'yyyy-MM-dd')); }
    else if (range === 'lastMonth') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setDateFrom(format(startOfMonth(lm), 'yyyy-MM-dd'));
      setDateTo(format(endOfMonth(lm), 'yyyy-MM-dd'));
    }
    else if (range === 'thisYear') { setDateFrom(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd')); setDateTo(format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd')); }
    else if (range === 'last7Days') { setDateFrom(format(subDays(now, 6), 'yyyy-MM-dd')); setDateTo(format(now, 'yyyy-MM-dd')); }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden animate-in fade-in duration-700">
      <DashboardHero
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
        onNewReceipt={() => navigate('/receipts')}
        onAddClient={() => navigate('/clients')}
      />

      <div className="w-full px-6 lg:px-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[32px] shadow-sm flex flex-wrap items-center gap-6 mb-12"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 shadow-inner rounded-2xl border border-slate-100/50">
            <Calendar className="h-4 w-4 text-teal-600" />
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 w-32 outline-none"
              />
              <span className="text-slate-300 font-black">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 w-32 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['last7Days', 'thisMonth', 'lastMonth', 'thisYear'].map((r) => (
              <Button
                key={r}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickRange(r)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl px-4 h-10 transition-all border border-transparent hover:border-teal-100"
              >
                {t(r)}
              </Button>
            ))}
          </div>
        </motion.div>

        <DashboardMetrics stats={stats} isLoading={isLoading} />
        <DashboardCharts revenueData={revenueData} categoryData={categoryData} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-1">
            <DashboardQuickActions />
          </div>
          <div className="xl:col-span-1">
            <DashboardStockAlerts products={products} isLoading={isLoading} />
          </div>
          <div className="xl:col-span-1">
            <DashboardActivity activity={recentActivity} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
