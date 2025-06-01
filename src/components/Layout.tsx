import React, { useState } from 'react';
import MainNav from './MainNav';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, ChevronDown, Users, Copy } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user, subscription } = useAuth();
  const { toast } = useToast();
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  const copyReferralCode = () => {
    if (subscription?.referral_code) {
      navigator.clipboard.writeText(subscription.referral_code);
      toast({
        title: "Copied to clipboard",
        description: "Your referral code has been copied to clipboard",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7FAFC]">
      <MainNav />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-gray-500">{currentDate}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
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
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="h-full animate-fade-in">
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
      </div>
    </div>
  );
};

export default Layout;