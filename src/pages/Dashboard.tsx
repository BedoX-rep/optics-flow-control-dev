
import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Receipt, Calendar } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import StatCard from '@/components/StatCard';
import BarChartComponent from '@/components/BarChart';
import AreaChartComponent from '@/components/AreaChart';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface DashboardStats {
  activeClients: number;
  totalRevenue: number;
  avgSaleValue: number;
  upcomingExpirations: number;
}

interface ActivityItem {
  id: string;
  type: 'client' | 'receipt';
  title: string;
  description: string;
  timestamp: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    totalRevenue: 0,
    avgSaleValue: 0,
    upcomingExpirations: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch client count
        const { count: clientCount, error: clientError } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        if (clientError) throw clientError;

        // Fetch receipts summary
        const { data: receipts, error: receiptsError } = await supabase
          .from('receipts')
          .select('total, created_at');

        if (receiptsError) throw receiptsError;

        // Calculate dashboard stats
        const totalRevenue = receipts?.reduce((sum, receipt) => sum + Number(receipt.total), 0) || 0;
        const avgSaleValue = receipts?.length ? totalRevenue / receipts.length : 0;

        // Prepare revenue data for chart
        const lastSevenDays = [...Array(7)].map((_, i) => {
          const date = subDays(new Date(), 6 - i);
          const formattedDate = format(date, 'EEE');
          
          const dayReceipts = receipts?.filter(r => {
            const receiptDate = new Date(r.created_at);
            return receiptDate.getDate() === date.getDate() && 
                   receiptDate.getMonth() === date.getMonth() && 
                   receiptDate.getFullYear() === date.getFullYear();
          }) || [];
          
          const value = dayReceipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
          
          return { name: formattedDate, value };
        });

        setRevenueData(lastSevenDays);

        // Fetch recent clients
        const { data: recentClients, error: recentClientsError } = await supabase
          .from('clients')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentClientsError) throw recentClientsError;

        // Fetch recent receipts
        const { data: recentReceipts, error: recentReceiptsError } = await supabase
          .from('receipts')
          .select('id, total, created_at, clients(name)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentReceiptsError) throw recentReceiptsError;

        // Create activity feed
        const activity: ActivityItem[] = [
          ...recentClients.map(client => ({
            id: `client-${client.id}`,
            type: 'client' as const,
            title: 'New client registered',
            description: client.name,
            timestamp: client.created_at
          })),
          ...recentReceipts.map(receipt => ({
            id: `receipt-${receipt.id}`,
            type: 'receipt' as const,
            title: 'New receipt created',
            description: `DH${receipt.total.toFixed(2)} - ${receipt.clients?.name || 'Unknown client'}`,
            timestamp: receipt.created_at
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

        setRecentActivity(activity);

        // Update stats
        setStats({
          activeClients: clientCount || 0,
          totalRevenue,
          avgSaleValue,
          upcomingExpirations: 0 // Would calculate from actual data in a real app
        });

        // Generate some dummy client growth data
        const lastSixMonths = [...Array(6)].map((_, i) => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const date = new Date();
          date.setMonth(date.getMonth() - 5 + i);
          const monthName = monthNames[date.getMonth()];
          
          // Random growth between 30-80
          const value = Math.floor(Math.random() * 50) + 30;
          
          return { name: monthName, value };
        });

        setClientsData(lastSixMonths);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <PageTitle 
        title="Dashboard" 
        subtitle="Overview of your optical store performance"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active Clients" 
          value={isLoading ? "Loading..." : `${stats.activeClients}`}
          change={4.65} 
          icon={<Users className="h-6 w-6" />} 
        />
        <StatCard 
          title="Total Revenue" 
          value={isLoading ? "Loading..." : `DH${stats.totalRevenue.toFixed(2)}`}
          change={2.3} 
          icon={<ShoppingBag className="h-6 w-6" />} 
        />
        <StatCard 
          title="Avg. Sale Value" 
          value={isLoading ? "Loading..." : `DH${stats.avgSaleValue.toFixed(2)}`}
          icon={<Receipt className="h-6 w-6" />} 
        />
        <StatCard 
          title="Upcoming Expirations" 
          value={isLoading ? "Loading..." : `DH${stats.upcomingExpirations.toFixed(2)}`}
          change={-3.2}
          icon={<Calendar className="h-6 w-6" />} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartComponent data={revenueData} title="Revenue Trend (Last 7 Days)" />
        <AreaChartComponent data={clientsData} title="New Clients (Last 6 Months)" />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading recent activity...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No recent activity found.</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4">
                <div className="flex-shrink-0 bg-optics-100 p-2 rounded-full mr-3">
                  {activity.type === 'client' ? (
                    <Users className="h-5 w-5 text-optics-600" />
                  ) : (
                    <Receipt className="h-5 w-5 text-optics-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
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
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  
  // For older dates, just return the formatted date
  return format(pastDate, 'MMM d, yyyy');
}

export default Dashboard;
