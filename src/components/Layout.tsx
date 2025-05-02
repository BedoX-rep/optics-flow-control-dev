
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import MainNav from './MainNav';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import ReferralCodeDialog from './ReferralCodeDialog';

export default function Layout() {
  const { session } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      const fetchReferralCode = async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('referral_code')
          .eq('user_id', session.user.id)
          .single();

        if (data && !error) {
          setReferralCode(data.referral_code);
        } else if (error) {
          console.error('Error fetching referral code:', error);
        }
      };

      fetchReferralCode();
    }
  }, [session]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <MainNav />
          <div className="flex items-center space-x-2">
            {session && referralCode && <ReferralCodeDialog referralCode={referralCode} />}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
