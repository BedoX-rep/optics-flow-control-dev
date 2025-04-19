
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  FileText,
  Bell
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Receipts', href: '/receipts', icon: Receipt },
  { name: 'New Receipt', href: '/new-receipt', icon: FileText },
  { name: 'Subscriptions', href: '/subscriptions', icon: Bell },
];

const MainNav = () => {
  const location = useLocation();

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-optics-700">Optics Flow</h2>
        <p className="text-sm text-gray-500">Store Management</p>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                isActive
                  ? "bg-optics-50 text-optics-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 flex-shrink-0 h-5 w-5",
                  isActive ? "text-optics-600" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MainNav;
