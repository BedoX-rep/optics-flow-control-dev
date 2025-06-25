import React, { useState } from 'react';
import MainNav from './MainNav';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, ChevronDown, Users, Copy, Shield, User } from 'lucide-react';
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
import { Home, Package, Receipt, DollarSign, ShoppingCart, CreditCard, Menu, Search, Settings, Building } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import OpticianSettings from '@/pages/OpticianSettings';
import Personalisation from '@/pages/Personalisation';
import {
  Routes,
  Route,
  Link
} from "react-router-dom";

import SidebarMenuButton from './SidebarMenuButton';
import SidebarMenuItem from './SidebarMenuItem';
import { useLanguage } from './LanguageProvider';
import { useIsMobile } from '@/hooks/use-mobile';

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
      <MainNav />
      <div className={`flex-1 flex flex-col ${isMobile ? 'ml-0' : 'ml-20 lg:ml-64'}`}>
        {/* Desktop Header */}
        {!isMobile && (
          <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-medium text-gray-800">
                  Welcome back, {user?.email?.split('@')[0] || 'User'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{currentDate}</p>
                  <Badge 
                    variant={sessionRole === 'Admin' ? 'default' : 'secondary'}
                    className={`text-xs ${sessionRole === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                  >
                    {sessionRole}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Left side controls */}
              <div className="flex items-center space-x-2">
                {sessionRole === 'Store Staff' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdminAccessDialogOpen(true)}
                    className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:text-teal-800 px-3 py-1.5 text-xs font-medium"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Access as Admin
                  </Button>
                )}
                <LanguageToggle />
              </div>

              {/* Right side controls */}
              <div className="flex items-center space-x-3">
                {sessionRole === 'Admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exitAdminSession();
                      toast({
                        title: "Session Updated",
                        description: "You are now signed out of the admin session",
                      });
                      // Small delay to ensure state updates, then refresh
                      setTimeout(() => {
                        window.location.reload();
                      }, 100);
                    }}
                    className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Exit Admin Session
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReferralDialogOpen(true)}
                  title="Your referral code"
                >
                  <Users className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <span>Account</span>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
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
          <header className="bg-white shadow-sm px-4 py-3">
            <div className="flex flex-col space-y-3">
              {/* Welcome Message */}
              <div>
                <h2 className="text-base font-medium text-gray-800">
                  Welcome back, {user?.email?.split('@')[0] || 'User'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">{currentDate}</p>
                  <Badge 
                    variant={sessionRole === 'Admin' ? 'default' : 'secondary'}
                    className={`text-xs ${sessionRole === 'Admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                  >
                    {sessionRole}
                  </Badge>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {sessionRole === 'Store Staff' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdminAccessDialogOpen(true)}
                      className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:text-teal-800 px-2 py-1 text-xs font-medium"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Button>
                  )}
                  <LanguageToggle />
                </div>

                <div className="flex items-center space-x-2">
                  {sessionRole === 'Admin' && (
                    <Button
                      variant="outline"
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
                      className="text-xs text-red-600 border-red-300 hover:bg-red-50 px-2 py-1"
                    >
                      Exit Admin
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReferralDialogOpen(true)}
                    title="Your referral code"
                  >
                    <Users className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Your Referral Code</DialogTitle>
              <DialogDescription>
                Share this code with others to refer them to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
              <div className="grid flex-1 gap-2">
                <div className="bg-muted p-4 rounded-md text-center text-2xl font-mono tracking-widest">
                  {subscription?.referral_code || 'Loading...'}
                </div>
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="px-3" 
                onClick={copyReferralCode}
              >
                <span className="sr-only">Copy</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={adminAccessDialogOpen} onOpenChange={setAdminAccessDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Access as Admin</DialogTitle>
              <DialogDescription>
                Enter your access code to elevate to Admin privileges for this session.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="admin-access-code">Access Code</Label>
                <Input
                  id="admin-access-code"
                  placeholder="Enter 5-character access code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="text-center font-mono tracking-widest"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAdminAccessDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePromoteToAdmin}>
                  Elevate Access
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