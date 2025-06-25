
import React, { useState, useEffect, useMemo } from 'react';
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
  Shield,
  Settings,
  ChevronDown,
  ChevronUp,
  Menu
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const getNavigation = (t: any) => [
  { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard, permission: 'can_access_dashboard' },
  { name: t('products'), href: '/products', icon: Package, permission: 'can_manage_products' },
  { name: t('clients'), href: '/clients', icon: Users, permission: 'can_manage_clients' },
  { name: t('receipts'), href: '/receipts', icon: Receipt, permission: 'can_manage_receipts' },
  { name: t('newReceipt'), href: '/new-receipt', icon: FileText, permission: 'can_manage_receipts' },
  { name: t('invoices'), href: '/invoices', icon: FileText, permission: 'can_manage_invoices' },
  { name: t('purchases'), href: '/purchases', icon: ShoppingCart, permission: 'can_manage_purchases' },
  { name: t('financial'), href: '/financial', icon: Calculator, permission: 'can_view_financial' },
];

const getAdministrationNavigation = (t: any) => [
  { name: t('subscriptions'), href: '/subscriptions', icon: Bell, permission: null }, // Always visible
  { name: t('access'), href: '/access', icon: Shield, permission: 'admin_session' },
  { name: t('settings'), href: '/optician-settings', icon: Settings, permission: 'admin_session' },
  { name: t('personalisation'), href: '/personalisation', icon: Settings, permission: 'admin_session' },
];

const NavigationContent = ({ 
  filteredNavigation, 
  filteredAdministrationNavigation, 
  isAdministrationActive,
  administrationOpen,
  toggleAdministration,
  collapsed,
  location,
  t,
  onNavigate 
}: {
  filteredNavigation: any[],
  filteredAdministrationNavigation: any[],
  isAdministrationActive: boolean,
  administrationOpen: boolean,
  toggleAdministration: () => void,
  collapsed: boolean,
  location: any,
  t: any,
  onNavigate?: () => void
}) => (
  <nav className="p-3 space-y-1 mt-2">
    {filteredNavigation.map((item) => {
      const isActive = location.pathname === item.href;
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={onNavigate}
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

    {/* Administration Dropdown */}
    {filteredAdministrationNavigation.length > 0 && (
      <div className="space-y-1">
        <button
          onClick={toggleAdministration}
          className={cn(
            "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group",
            isAdministrationActive
              ? "bg-white/10 text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings
            className={cn(
              "flex-shrink-0 h-5 w-5",
              isAdministrationActive ? "text-white" : "text-white/70 group-hover:text-white"
            )}
          />
          {!collapsed && (
            <>
              <span className="ml-3 flex-1 text-left">{t('administration')}</span>
              {administrationOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </>
          )}
        </button>

        {!collapsed && administrationOpen && (
          <div className="ml-8 space-y-1">
            {filteredAdministrationNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all group",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 h-4 w-4",
                      isActive ? "text-white" : "text-white/70 group-hover:text-white"
                    )}
                  />
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    )}
  </nav>
);

const MainNav = () => {
  const { user, subscription, permissions, sessionRole } = useAuth();
  const { t, language } = useLanguage(); // Include language to trigger re-renders
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [administrationOpen, setAdministrationOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Regenerate navigation items when language changes
  const navigation = useMemo(() => getNavigation(t), [t, language]);
  const administrationNavigation = useMemo(() => getAdministrationNavigation(t), [t, language]);

  useEffect(() => {
    const handleResize = () => {
      // Only set collapsed for desktop breakpoint
      if (!isMobile) {
        setCollapsed(window.innerWidth < 1024); // lg breakpoint
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleAdministration = () => {
    setAdministrationOpen(!administrationOpen);
  };

  // Memoize filtered navigation to react to permission and role changes instantly
  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => {
      if (item.permission === null) return true; // Always show items without permission requirements

      // Special case for admin session requirement
      if (item.permission === 'admin_session') {
        return sessionRole === 'Admin';
      }

      // Admin session role bypasses all other permission checks
      if (sessionRole === 'Admin') return true;

      if (!permissions) return false; // Hide if permissions are not loaded

      return permissions[item.permission as keyof typeof permissions];
    });
  }, [navigation, permissions, sessionRole]);

  // Filter administration navigation
  const filteredAdministrationNavigation = useMemo(() => {
    return administrationNavigation.filter(item => {
      if (item.permission === null) return true; // Always show items without permission requirements

      // Special case for admin session requirement
      if (item.permission === 'admin_session') {
        return sessionRole === 'Admin';
      }

      // Admin session role bypasses all other permission checks
      if (sessionRole === 'Admin') return true;

      if (!permissions) return false; // Hide if permissions are not loaded

      return permissions[item.permission as keyof typeof permissions];
    });
  }, [administrationNavigation, permissions, sessionRole]);

  // Check if any administration page is currently active
  const isAdministrationActive = useMemo(() => {
    return filteredAdministrationNavigation.some(item => location.pathname === item.href);
  }, [filteredAdministrationNavigation, location.pathname]);

  // Mobile Navigation
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-teal-600/80 text-white hover:bg-teal-600 backdrop-blur-sm"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-80 p-0 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 border-teal-600/20"
        >
          <div className="sidebar-gradient min-h-full">
            <div className="p-4 flex items-center border-b border-teal-600/20">
              <h2 className="text-xl font-bold text-white">Lensly</h2>
            </div>
            
            <NavigationContent
              filteredNavigation={filteredNavigation}
              filteredAdministrationNavigation={filteredAdministrationNavigation}
              isAdministrationActive={isAdministrationActive}
              administrationOpen={administrationOpen}
              toggleAdministration={toggleAdministration}
              collapsed={false}
              location={location}
              t={t}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Navigation
  return (
    <div 
      className={cn(
        "sidebar-gradient min-h-screen border-r border-teal-600/20 transition-all duration-300 fixed top-0 left-0 z-40",
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

      <NavigationContent
        filteredNavigation={filteredNavigation}
        filteredAdministrationNavigation={filteredAdministrationNavigation}
        isAdministrationActive={isAdministrationActive}
        administrationOpen={administrationOpen}
        toggleAdministration={toggleAdministration}
        collapsed={collapsed}
        location={location}
        t={t}
      />
    </div>
  );
};

export default MainNav;
