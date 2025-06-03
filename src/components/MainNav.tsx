import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calculator,
  Shield
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Avatar } from '@/components/ui/avatar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Receipts', href: '/receipts', icon: Receipt },
  { name: 'New Receipt', href: '/new-receipt', icon: FileText },
  { name: 'Subscriptions', href: '/subscriptions', icon: Bell },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
  { name: 'Financial', href: '/financial', icon: Calculator },
  { name: 'Access', href: '/access', icon: Shield },
];

const MainNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const sessionRole = user?.role;

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div 
      className={cn(
        "sidebar-gradient min-h-screen border-r border-teal-600/20 transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-teal-600/20">
        <div className={cn("flex items-center", collapsed && "justify-center w-full")}>
          {!collapsed && (
            <h2 className="text-xl font-bold text-white">Lensly</h2>
          )}
          {collapsed && (
            <h2 className="text-xl font-bold text-white">L</h2>
          )}
        </div>
        <button 
          onClick={toggleSidebar}
          className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-teal-600/20"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="p-3 space-y-1 mt-2">
        {navigation.map((item) => {
          if (item.name === 'Access' && sessionRole !== 'Admin') {
            return null;
          }
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isActive ? "text-white" : "text-white/70 group-hover:text-white"
                )}
              />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-600/20">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border-2 border-white/20">
              <span className="text-xs font-medium">
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-white/60">Active Subscription</p>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-teal-600/20 flex justify-center">
          <Avatar className="h-9 w-9 border-2 border-white/20">
            <span className="text-xs font-medium">
              {user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          </Avatar>
        </div>
      )}
    </div>
  );
};

export default MainNav;