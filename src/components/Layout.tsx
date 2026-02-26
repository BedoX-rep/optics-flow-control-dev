import React, { useState, useEffect } from 'react';
import MainNav from './MainNav';
import { Button } from '@/components/ui/button';
import {
  Home, Package, Receipt, DollarSign, ShoppingCart, CreditCard,
  Menu, Search, Settings, Building, Clock, User, FileText,
  Bell, Users, Shield, ChevronDown, LogOut, Copy, Globe, Palette
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import LanguageToggle from './LanguageToggle';
import OpticianSettings from '@/pages/OpticianSettings';
import Personalisation from '@/pages/Personalisation';
import { Routes, Route, Link } from "react-router-dom";
import { useLanguage } from './LanguageProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, subscription, sessionRole, promoteToAdmin, signOut, exitAdminSession } = useAuth();
  const { toast } = useToast();
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [adminAccessDialogOpen, setAdminAccessDialogOpen] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity-header', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const [clientsRes, receiptsRes, purchasesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('receipts').select('*, clients(name)').eq('user_id', user.id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
        supabase.from('purchases').select('*, supplier:supplier_id(name)').eq('user_id', user.id).eq('is_deleted', false).order('created_at', { ascending: false }).limit(5)
      ]);

      const activity = [
        ...(clientsRes.data || []).map(c => ({ id: `c-${c.id}`, type: 'client' as const, title: t('newClientRegistered'), description: c.name, timestamp: c.created_at })),
        ...(receiptsRes.data || []).map(r => ({ id: `r-${r.id}`, type: 'receipt' as const, title: t('newReceiptCreated'), description: r.clients?.name || t('unknownClient'), timestamp: r.created_at, amount: r.total })),
        ...(purchasesRes.data || []).map(p => ({ id: `p-${p.id}`, type: 'purchase' as const, title: t('newPurchaseRecorded'), description: p.supplier?.name || t('unknownSupplier'), timestamp: p.created_at || p.purchase_date, amount: p.amount }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      return activity;
    },
    enabled: !!user,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <User className="h-3 w-3" />;
      case 'receipt': return <FileText className="h-3 w-3" />;
      case 'purchase': return <ShoppingCart className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'client': return "bg-blue-500";
      case 'receipt': return "bg-teal-500";
      case 'purchase': return "bg-orange-500";
      default: return "bg-slate-500";
    }
  };

  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const pastDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return format(pastDate, 'MMM d');
  }

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarChange = () => {
      const sidebarElement = document.querySelector('[data-sidebar-collapsed]');
      if (sidebarElement) {
        const isCollapsed = sidebarElement.getAttribute('data-sidebar-collapsed') === 'true';
        setSidebarCollapsed(isCollapsed);
      }
    };

    // Initial check
    handleSidebarChange();

    // Create a MutationObserver to watch for attribute changes
    const observer = new MutationObserver(handleSidebarChange);
    const sidebarElement = document.querySelector('[data-sidebar-collapsed]');

    if (sidebarElement) {
      observer.observe(sidebarElement, {
        attributes: true,
        attributeFilter: ['data-sidebar-collapsed']
      });
    }

    // Listen for clicks and resize as fallback
    document.addEventListener('click', handleSidebarChange);
    window.addEventListener('resize', handleSidebarChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleSidebarChange);
      window.removeEventListener('resize', handleSidebarChange);
    };
  }, []);

  const copyReferralCode = () => {
    if (subscription?.referral_code) {
      navigator.clipboard.writeText(subscription.referral_code);
      toast({
        title: "Copied to clipboard",
        description: "Your referral code has been copied to clipboard",
      });
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!accessCodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter an access code",
        variant: "destructive",
      });
      return;
    }

    const result = await promoteToAdmin(accessCodeInput.trim().toUpperCase());

    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setAccessCodeInput('');
      setAdminAccessDialogOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7FAFC]">
      <MainNav onAdminAccessClick={() => setAdminAccessDialogOpen(true)} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-20' : 'ml-72'
          }`}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-slate-200/50 px-8 py-4 flex justify-between items-center transition-all duration-300">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  {t('welcomeBack') || 'Bon retour'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                    {currentDate}
                  </div>
                  <Badge
                    variant={sessionRole === 'Admin' ? 'default' : 'secondary'}
                    className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full shadow-sm ${sessionRole === 'Admin'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none'
                      }`}
                  >
                    {sessionRole}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Controls Group */}
              <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
                {sessionRole === 'Store Staff' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdminAccessDialogOpen(true)}
                    className="h-9 bg-white text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    {t('accessAsAdmin') || 'Accès Admin'}
                  </Button>
                )}

                {sessionRole === 'Admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
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
                    className="h-9 bg-white text-red-600 hover:bg-red-50 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 border border-red-100"
                  >
                    Exit Admin Session
                  </Button>
                )}

                <div className="w-px h-4 bg-slate-200 mx-1" />
                <LanguageToggle />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReferralDialogOpen(true)}
                  className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  title="Your referral code"
                >
                  <Users className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl relative text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                      <Bell className="h-5 w-5" />
                      {recentActivity.length > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-5 rounded-[32px] border-slate-200/50 shadow-2xl backdrop-blur-xl bg-white/95">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t('recentActivity')}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Live Stream</p>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {recentActivity.length} Events
                      </div>
                    </div>
                    <div className="space-y-6 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                      {activityLoading ? (
                        <div className="space-y-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 shrink-0" />
                              <div className="flex-1 space-y-2 py-1">
                                <div className="h-3 bg-slate-100 rounded w-3/4" />
                                <div className="h-2 bg-slate-50 rounded w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : recentActivity.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Clock className="h-6 w-6 text-slate-200" />
                          </div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{t('noRecentActivity')}</p>
                        </div>
                      ) : (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="relative flex gap-4 group cursor-default">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                              getColor(activity.type),
                              activity.type === 'client' && "shadow-blue-500/20",
                              activity.type === 'receipt' && "shadow-teal-500/20",
                              activity.type === 'purchase' && "shadow-orange-500/20"
                            )}>
                              {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex justify-between items-start gap-2 mb-0.5">
                                <p className="text-[11px] font-black text-slate-800 truncate leading-tight tracking-tight">{activity.title}</p>
                                <span className="text-[8px] font-black text-slate-300 uppercase shrink-0 bg-slate-50 px-1.5 py-0.5 rounded-full">{formatTimeAgo(activity.timestamp)}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium truncate opacity-80">{activity.description}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 pl-2 pr-4 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                        {user?.email?.[0].toUpperCase() || 'U'}
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Account</span>
                      <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logged in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                    </div>

                    <Link to="/subscriptions">
                      <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-3">
                        <Bell className="h-4 w-4" />
                        <span>{t('subscriptions')}</span>
                      </DropdownMenuItem>
                    </Link>

                    {sessionRole === 'Admin' && (
                      <>
                        <Link to="/access">
                          <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-3">
                            <Shield className="h-4 w-4" />
                            <span>{t('access')}</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link to="/optician-settings">
                          <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-3">
                            <Settings className="h-4 w-4" />
                            <span>{t('settings')}</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link to="/personalisation">
                          <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-3">
                            <Palette className="h-4 w-4" />
                            <span>{t('personalisation')}</span>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}

                    <div className="h-px bg-slate-100 my-1" />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="cursor-pointer h-10 rounded-xl text-rose-600 focus:text-rose-700 focus:bg-rose-50 transition-colors font-bold flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/50 px-4 py-3 flex flex-col gap-3 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">
                  {t('welcomeBack') || 'Bon retour'}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-slate-500 font-bold text-[9px] uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
                    <div className="w-1 h-1 bg-teal-500 rounded-full animate-pulse" />
                    {currentDate}
                  </div>
                  <Badge
                    variant={sessionRole === 'Admin' ? 'default' : 'secondary'}
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm ${sessionRole === 'Admin'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      }`}
                  >
                    {sessionRole}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-start gap-2 pt-1 border-t border-slate-100/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReferralDialogOpen(true)}
                className="h-9 w-9 rounded-lg text-slate-400"
              >
                <Users className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative text-slate-400">
                    <Bell className="h-4 w-4" />
                    {recentActivity.length > 0 && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white pulse"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px] p-4 rounded-3xl border-slate-200/50 shadow-2xl backdrop-blur-xl bg-white/95">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 px-1">{t('recentActivity')}</h3>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {activityLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />)
                    ) : recentActivity.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 italic">{t('noRecentActivity')}</p>
                    ) : (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="flex gap-3 items-center">
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0", getColor(activity.type))}>
                            {getIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-800 truncate leading-tight">{activity.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[9px] text-slate-500 font-medium truncate">{activity.description}</p>
                              <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">· {formatTimeAgo(activity.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-2 rounded-lg flex items-center gap-2 hover:bg-slate-100">
                    <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-white font-black text-[10px]">
                      {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logged in as</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                  </div>

                  <Link to="/subscriptions">
                    <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>{t('subscriptions')}</span>
                    </DropdownMenuItem>
                  </Link>

                  {sessionRole === 'Admin' && (
                    <>
                      <Link to="/access">
                        <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>{t('access')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/optician-settings">
                        <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>{t('settings')}</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/personalisation">
                        <DropdownMenuItem className="cursor-pointer h-10 rounded-xl text-slate-700 focus:text-slate-900 focus:bg-slate-50 transition-colors font-bold flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          <span>{t('personalisation')}</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-slate-100 my-1" />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer h-10 rounded-lg text-rose-600 font-bold flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full animate-fade-in">
            <Routes>
              <Route path="/optician-settings" element={<OpticianSettings />} />
              <Route path="/personalisation" element={<Personalisation />} />
            </Routes>
            {children}
          </div>
        </main>

        <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-[32px] border-slate-200/50 shadow-3xl bg-white/95 backdrop-blur-xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Your Referral Code</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Invite fellow opticians and grow the Lensly community together.
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 flex flex-col items-center gap-6 mt-8">
              <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center group transition-all hover:border-teal-400 hover:bg-teal-50/30">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-3">Unique Code</span>
                <div className="text-4xl font-black text-slate-900 tracking-[0.2em] font-mono">
                  {subscription?.referral_code || '------'}
                </div>
              </div>
              <Button
                className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                onClick={copyReferralCode}
              >
                <Copy className="h-4 w-4" />
                Copy Referral Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={adminAccessDialogOpen} onOpenChange={setAdminAccessDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-[32px] border-slate-200/50 shadow-3xl bg-white/95 backdrop-blur-xl p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full -ml-16 -mt-16 blur-2xl" />
            <DialogHeader className="relative z-10">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
                <Shield className="h-6 w-6 text-rose-500" />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                {t('accessAsAdmin') || 'Accès Admin'}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                {t('enterAccessCodeToElevate') || 'Entrez votre code d\'accès pour élever vos privilèges Admin pour cette session.'}
              </DialogDescription>
            </DialogHeader>
            <div className="relative z-10 space-y-6 mt-8">
              <div className="space-y-3">
                <Label htmlFor="admin-access-code" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('accessCode') || 'Code d\'Accès'}</Label>
                <Input
                  id="admin-access-code"
                  placeholder="• • • • •"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="h-16 text-center text-3xl font-black tracking-[0.5em] bg-slate-50 border-slate-200 rounded-2xl focus:ring-rose-500 focus:border-rose-500 transition-all placeholder:text-slate-200"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                  onClick={() => setAdminAccessDialogOpen(false)}
                >
                  {t('cancel') || 'Annuler'}
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                  onClick={handlePromoteToAdmin}
                >
                  {t('elevateAccess') || 'Élever l\'Accès'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Layout;