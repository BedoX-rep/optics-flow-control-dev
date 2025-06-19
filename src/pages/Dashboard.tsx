
import React, { useEffect, useState, useMemo } from 'react';
import { Users, ShoppingBag, Receipt, Calendar, TrendingUp, Eye, Glasses } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import StatCard from '@/components/StatCard';
import BarChartComponent from '@/components/BarChart';
import AreaChartComponent from '@/components/AreaChart';
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

  // Filter receipts for current month
  const currentMonthReceipts = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return receipts.filter(receipt => {
      const receiptDate = new Date(receipt.created_at);
      return receiptDate >= monthStart && receiptDate <= monthEnd;
    });
  }, [receipts]);

  useEffect(() => {
    const calculateDashboardData = async () => {
      try {
        setIsLoading(true);

        // Calculate revenue metrics
        const totalRevenue = currentMonthReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
        const outstandingBalance = currentMonthReceipts.reduce((sum, receipt) => sum + (receipt.balance || 0), 0);
        const avgSaleValue = currentMonthReceipts.length ? totalRevenue / currentMonthReceipts.length : 0;

        // Calculate montage vs product revenue
        const montageRevenue = currentMonthReceipts.reduce((sum, receipt) => {
          const validMontageStatuses = ['InCutting', 'Ready', 'Paid costs'];
          const montageCost = receipt.montage_costs || 0;
          return validMontageStatuses.includes(receipt.montage_status) ? sum + montageCost : sum;
        }, 0);

        const productRevenue = currentMonthReceipts.reduce((sum, receipt) => {
          return sum + (receipt.products_cost || 0);
        }, 0);

        // Calculate receipt status counts
        const pendingReceipts = currentMonthReceipts.filter(r => 
          r.delivery_status !== 'Completed' || r.balance > 0
        ).length;
        
        const completedReceipts = currentMonthReceipts.filter(r => 
          r.delivery_status === 'Completed' && r.balance === 0
        ).length;

        // Prepare revenue data for last 7 days
        const lastSevenDays = [...Array(7)].map((_, i) => {
          const date = subDays(new Date(), 6 - i);
          const formattedDate = format(date, 'EEE');
          
          const dayReceipts = receipts.filter(r => {
            const receiptDate = new Date(r.created_at);
            return receiptDate.getDate() === date.getDate() && 
                   receiptDate.getMonth() === date.getMonth() && 
                   receiptDate.getFullYear() === date.getFullYear();
          });
          
          const value = dayReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
          
          return { name: formattedDate, value };
        });

        setRevenueData(lastSevenDays);

        // Prepare category data for chart
        const categoryAnalysis = currentMonthReceipts.reduce((acc, receipt) => {
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
  }, [receipts, clients, purchases, currentMonthReceipts]);

  return (
    <div>
      <div className="mb-6">
        <PageTitle 
          title={t('dashboard')} 
          subtitle={`${t('dashboardSubtitle')} ${format(new Date(), 'MMMM yyyy')}`}
        />
      </div>
      
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
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">{t('recentActivity')}</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">{t('loadingRecentActivity')}</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-4 text-gray-500">{t('noRecentActivity')}</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex-shrink-0 bg-optics-100 p-2 rounded-full mr-3">
                  {activity.type === 'client' && <Users className="h-5 w-5 text-optics-600" />}
                  {activity.type === 'receipt' && <Receipt className="h-5 w-5 text-optics-600" />}
                  {activity.type === 'purchase' && <ShoppingBag className="h-5 w-5 text-optics-600" />}
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
      </div>
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
