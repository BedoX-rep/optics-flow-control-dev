
import React, { useEffect, useState, useMemo } from 'react';
import { Users, ShoppingBag, Receipt, Calendar, TrendingUp, Eye, Glasses } from 'lucide-react';

import StatCard from '@/components/StatCard';
import BarChartComponent from '@/components/BarChart';
import AreaChartComponent from '@/components/AreaChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';

interface DashboardStats {
  activeClients: number;
  totalRevenue: number;
  avgSaleValue: number;
  outstandingBalance: number;
  pendingReceipts: number;
  completedReceipts: number;
  montageRevenue: number;
  productRevenue: number;
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
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    totalRevenue: 0,
    avgSaleValue: 0,
    outstandingBalance: 0,
    pendingReceipts: 0,
    completedReceipts: 0,
    montageRevenue: 0,
    productRevenue: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch receipts with all necessary data
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          clients (
            id,
            name,
            phone
          ),
          receipt_items (
            id,
            quantity,
            price,
            cost,
            product:product_id (
              name,
              category,
              stock_status
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)  // Exclude deleted receipts
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.id],
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

  // Fetch purchases
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
        .order('purchase_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Filter receipts by date range
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const receiptDate = new Date(receipt.created_at);
      return receiptDate >= new Date(dateFrom) && receiptDate <= new Date(dateTo);
    });
  }, [receipts, dateFrom, dateTo]);

  useEffect(() => {
    const calculateDashboardData = async () => {
      try {
        setIsLoading(true);

        // Calculate revenue metrics
        const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
        const outstandingBalance = filteredReceipts.reduce((sum, receipt) => sum + (receipt.balance || 0), 0);
        const avgSaleValue = filteredReceipts.length ? totalRevenue / filteredReceipts.length : 0;

        // Calculate montage vs product revenue
        const montageRevenue = filteredReceipts.reduce((sum, receipt) => {
          const validMontageStatuses = ['InCutting', 'Ready', 'Paid costs'];
          const montageCost = receipt.montage_costs || 0;
          return validMontageStatuses.includes(receipt.montage_status) ? sum + montageCost : sum;
        }, 0);

        const productRevenue = filteredReceipts.reduce((sum, receipt) => {
          return sum + (receipt.products_cost || 0);
        }, 0);

        // Calculate receipt status counts
        const pendingReceipts = filteredReceipts.filter(r => 
          r.delivery_status !== 'Completed' || r.balance > 0
        ).length;
        
        const completedReceipts = filteredReceipts.filter(r => 
          r.delivery_status === 'Completed' && r.balance === 0
        ).length;

        // Prepare revenue data for the selected date range (daily breakdown)
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const dailyRevenue = [...Array(Math.min(daysDiff, 30))].map((_, i) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const formattedDate = format(date, daysDiff <= 7 ? 'EEE' : 'MMM dd');
          
          const dayReceipts = filteredReceipts.filter(r => {
            const receiptDate = new Date(r.created_at);
            return receiptDate.getDate() === date.getDate() && 
                   receiptDate.getMonth() === date.getMonth() && 
                   receiptDate.getFullYear() === date.getFullYear();
          });
          
          const value = dayReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
          
          return { name: formattedDate, value };
        });

        setRevenueData(dailyRevenue);

        // Prepare category data for chart
        const categoryAnalysis = filteredReceipts.reduce((acc, receipt) => {
          if (Array.isArray(receipt.receipt_items)) {
            receipt.receipt_items.forEach(item => {
              const category = item.product?.category || 'Unknown';
              const quantity = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;
              const revenue = price * quantity;
              
              if (!acc[category]) {
                acc[category] = 0;
              }
              acc[category] += revenue;
            });
          }
          return acc;
        }, {});

        const categoryChartData = Object.entries(categoryAnalysis)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setCategoryData(categoryChartData);

        // Create activity feed
        const activity: ActivityItem[] = [
          ...clients.slice(0, 3).map(client => ({
            id: `client-${client.id}`,
            type: 'client' as const,
            title: t('newClientRegistered'),
            description: client.name,
            timestamp: client.created_at
          })),
          ...receipts.slice(0, 5).map(receipt => ({
            id: `receipt-${receipt.id}`,
            type: 'receipt' as const,
            title: t('newReceiptCreated'),
            description: `${receipt.clients?.name || t('unknownClient')}`,
            timestamp: receipt.created_at,
            amount: receipt.total
          })),
          ...purchases.slice(0, 2).map(purchase => ({
            id: `purchase-${purchase.id}`,
            type: 'purchase' as const,
            title: t('newPurchaseRecorded'),
            description: `${purchase.supplier?.name || t('unknownSupplier')}`,
            timestamp: purchase.purchase_date,
            amount: purchase.total_amount
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

        setRecentActivity(activity);

        // Update stats
        setStats({
          activeClients: clients.length,
          totalRevenue,
          avgSaleValue,
          outstandingBalance,
          pendingReceipts,
          completedReceipts,
          montageRevenue,
          productRevenue
        });

      } catch (error) {
        console.error('Error calculating dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (receipts.length >= 0 && clients.length >= 0) {
      calculateDashboardData();
    }
  }, [receipts, clients, purchases, filteredReceipts, dateFrom, dateTo]);

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
      case 'last7Days':
        setDateFrom(format(subDays(now, 6), 'yyyy-MM-dd'));
        setDateTo(format(now, 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboardSubtitle')}</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('dateRangeFilter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateFrom">{t('fromDate')}</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateTo">{t('toDate')}</Label>
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
                onClick={() => handleQuickDateRange('last7Days')}
                className="text-xs"
              >
                {t('last7Days')}
              </Button>
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
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title={t('totalClients')} 
          value={isLoading ? t('loading') : `${stats.activeClients}`}
          change={4.65} 
          icon={<Users className="h-6 w-6" />} 
        />
        <StatCard 
          title={t('monthlyRevenue')} 
          value={isLoading ? t('loading') : `DH${stats.totalRevenue.toFixed(2)}`}
          change={2.3} 
          icon={<ShoppingBag className="h-6 w-6" />} 
        />
        <StatCard 
          title={t('avgSaleValue')} 
          value={isLoading ? t('loading') : `DH${stats.avgSaleValue.toFixed(2)}`}
          icon={<Receipt className="h-6 w-6" />} 
        />
        <StatCard 
          title={t('outstandingBalance')} 
          value={isLoading ? t('loading') : `DH${stats.outstandingBalance.toFixed(2)}`}
          change={-3.2}
          icon={<Calendar className="h-6 w-6" />} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title={t('pendingReceipts')} 
          value={isLoading ? t('loading') : `${stats.pendingReceipts}`}
          icon={<Eye className="h-6 w-6" />} 
        />
        <StatCard 
          title={t('completedReceipts')} 
          value={isLoading ? t('loading') : `${stats.completedReceipts}`}
          icon={<Glasses className="h-6 w-6" />} 
        />
        <StatCard 
          title={t('montageRevenue')} 
          value={isLoading ? t('loading') : `DH${stats.montageRevenue.toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6" />} 
        />
        <StatCard 
          title={t('productRevenue')} 
          value={isLoading ? t('loading') : `DH${stats.productRevenue.toFixed(2)}`}
          icon={<ShoppingBag className="h-6 w-6" />} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartComponent data={revenueData} title={t('revenueTrend')} />
        <AreaChartComponent data={categoryData} title={t('revenueByCategory')} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">{t('loadingRecentActivity')}</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-4 text-gray-500">{t('noRecentActivity')}</div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full mr-3">
                    {activity.type === 'client' && <Users className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'receipt' && <Receipt className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'purchase' && <ShoppingBag className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    {activity.amount && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        DH{activity.amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to format timestamps as "time ago"
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const pastDate = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  // For older dates, just return the formatted date
  return format(pastDate, 'MMM d');
}

export default Dashboard;
