import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  Palette,
  Printer,
  LogOut
} from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useToast } from '@/hooks/use-toast';
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
  { name: t('invoices'), href: '/invoices', icon: Printer, permission: 'can_manage_invoices' },
  { name: t('purchases'), href: '/purchases', icon: ShoppingCart, permission: 'can_manage_purchases' },
  { name: t('financial'), href: '/financial', icon: Calculator, permission: 'can_view_financial' },
];

const NavItem = ({ item, collapsed, isActive, onNavigate }: { item: any, collapsed: boolean, isActive: boolean, onNavigate?: () => void }) => (
  <Link
    to={item.href}
    onClick={onNavigate}
    className={cn(
      "relative flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 group overflow-hidden mb-1",
      isActive
        ? "text-white"
        : "text-white/60 hover:text-white"
    )}
  >
    {isActive && (
      <motion.div
        layoutId="active-indicator"
        className="absolute inset-0 bg-white/10 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div className={cn(
      "flex-shrink-0 z-10 p-2 rounded-xl transition-all duration-300",
      isActive ? "bg-white/20 shadow-lg shadow-white/5" : "group-hover:bg-white/10"
    )}>
      <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
    </div>

    {!collapsed && (
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="ml-4 z-10 font-bold whitespace-nowrap"
      >
        {item.name}
      </motion.span>
    )}

    {isActive && (
      <motion.div
        layoutId="active-line"
        className="absolute left-1 w-1.5 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
  </Link>
);

const NavigationContent = ({
  filteredNavigation,
  collapsed,
  location,
  t,
  onNavigate
}: {
  filteredNavigation: any[],
  collapsed: boolean,
  location: any,
  t: any,
  onNavigate?: () => void
}) => (
  <nav className="p-3 space-y-2 mt-2">
    <div className="space-y-1">
      {filteredNavigation.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          collapsed={collapsed}
          isActive={location.pathname === item.href}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  </nav>
);

const MainNav = ({ onAdminAccessClick }: { onAdminAccessClick?: () => void }) => {
  const { user, subscription, permissions, sessionRole, exitAdminSession } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage(); // Include language to trigger re-renders
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Regenerate navigation items when language changes
  const navigation = useMemo(() => getNavigation(t), [t, language]);

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


  // Mobile Navigation
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-50 bg-[#0B6E63] text-white hover:bg-[#0D8276] shadow-xl rounded-2xl w-12 h-12 shadow-teal-900/20 active:scale-95 transition-all"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-gradient-to-br from-[#0B6E63] via-[#0D8276] to-[#14998B] border-none"
        >
          <div className="min-h-full h-full relative flex flex-col overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

            <div className="p-6 flex items-center gap-3 border-b border-white/5 relative z-10">
              <div className="w-10 h-10 rounded-[14px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-xl font-black text-white italic">L</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter">Lensly</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              <NavigationContent
                filteredNavigation={filteredNavigation}
                collapsed={false}
                location={location}
                t={t}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>

            <div className="p-4 border-t border-white/10 relative z-10 mt-auto bg-white/5 backdrop-blur-md shrink-0">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] px-1 text-center">Settings & Access</p>
                <div className="bg-white/10 rounded-2xl p-1.5 flex justify-between items-center border border-white/20 shadow-inner">
                  <div className="flex-1 pr-2 border-r border-white/10 flex justify-center [&_button]:bg-transparent [&_button]:text-white [&_button]:border-none [&_button:hover]:bg-white/20 [&_span.text-slate-900]:text-white [&_.text-slate-400]:text-white/70">
                    <LanguageToggle />
                  </div>
                  <div className="pl-2 flex justify-center w-14">
                    {sessionRole === 'Store Staff' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMobileOpen(false);
                          onAdminAccessClick?.();
                        }}
                        className="h-10 w-10 bg-white/10 text-white rounded-xl hover:bg-white/20 hover:text-white shadow-sm border border-white/10 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    )}
                    {sessionRole === 'Admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          exitAdminSession();
                          toast({
                            title: "Session Updated",
                            description: "You are now signed out of the admin session",
                          });
                          setTimeout(() => {
                            window.location.reload();
                          }, 100);
                        }}
                        className="h-10 w-10 bg-rose-500/20 text-rose-200 rounded-xl hover:bg-rose-500/40 hover:text-white shadow-sm border border-rose-500/30 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Navigation
  return (
    <div
      className={cn(
        "h-screen bg-gradient-to-br from-[#0B6E63] via-[#0D8276] to-[#14998B] border-r border-white/5 transition-all duration-500 fixed top-0 left-0 z-50 overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.05)] flex flex-col",
        collapsed ? "w-20" : "w-72"
      )}
      data-sidebar-collapsed={collapsed}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-900/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

      <div className="p-6 pb-4 flex items-center justify-between relative z-10 border-b border-white/5">
        <div className={cn("flex items-center gap-3 transition-all duration-500 flex-1", collapsed && "justify-center w-full")}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg shadow-black/10">
              <span className="text-xl font-black text-white italic">L</span>
            </div>
            {!collapsed && (
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-black text-white tracking-tighter"
              >
                Lensly<span className="text-white/30 truncate ml-0.5">.</span>
              </motion.h2>
            )}
          </Link>
        </div>

        <button
          onClick={toggleSidebar}
          className="ml-2 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 py-2">
        <NavigationContent
          filteredNavigation={filteredNavigation}
          collapsed={collapsed}
          location={location}
          t={t}
        />
        <div className="h-4" />
      </div>

      <div className="p-4 border-t border-white/5 relative z-10 mt-auto shrink-0 bg-black/5 backdrop-blur-sm">
        {collapsed ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <ChevronRight size={14} />
            </button>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          </div>
        ) : (
          <div className="p-4 rounded-[24px] bg-white/5 border border-white/10 relative group cursor-default overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[11px] font-bold text-white/80">Systems Operational</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainNav;