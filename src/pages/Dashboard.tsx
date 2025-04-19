
import React from 'react';
import { Users, ShoppingBag, Receipt, Calendar } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import StatCard from '@/components/StatCard';
import BarChartComponent from '@/components/BarChart';
import AreaChartComponent from '@/components/AreaChart';

const revenueData = [
  { name: 'Mon', value: 2400 },
  { name: 'Tue', value: 1398 },
  { name: 'Wed', value: 2300 },
  { name: 'Thu', value: 3908 },
  { name: 'Fri', value: 4800 },
  { name: 'Sat', value: 3800 },
  { name: 'Sun', value: 4300 },
];

const clientsData = [
  { name: 'Jan', value: 45 },
  { name: 'Feb', value: 52 },
  { name: 'Mar', value: 48 },
  { name: 'Apr', value: 61 },
  { name: 'May', value: 55 },
  { name: 'Jun', value: 67 },
  { name: 'Jul', value: 70 },
];

const Dashboard = () => {
  return (
    <div>
      <PageTitle 
        title="Dashboard" 
        subtitle="Overview of your optical store performance"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active Clients" 
          value="84" 
          change={4.65} 
          icon={<Users className="h-6 w-6" />} 
        />
        <StatCard 
          title="Total Revenue" 
          value="DH12622.00" 
          change={2.3} 
          icon={<ShoppingBag className="h-6 w-6" />} 
        />
        <StatCard 
          title="Avg. Sale Value" 
          value="DH332.16" 
          icon={<Receipt className="h-6 w-6" />} 
        />
        <StatCard 
          title="Upcoming Expirations" 
          value="DH1400.00" 
          change={-3.2}
          icon={<Calendar className="h-6 w-6" />} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartComponent data={revenueData} title="Revenue Trend" />
        <AreaChartComponent data={clientsData} title="New Clients" />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <div key={index} className="flex items-start border-b border-gray-100 pb-4">
              <div className="flex-shrink-0 bg-optics-100 p-2 rounded-full mr-3">
                {index % 2 === 0 ? (
                  <Users className="h-5 w-5 text-optics-600" />
                ) : (
                  <Receipt className="h-5 w-5 text-optics-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {index % 2 === 0 ? 'New client registered' : 'New receipt created'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {index % 2 === 0 ? 'John Doe' : 'DH350.00 - Prescription Glasses'}
                </p>
              </div>
              <span className="ml-auto text-xs text-gray-400">
                {index === 0 ? 'Just now' : `${index * 2} hours ago`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
