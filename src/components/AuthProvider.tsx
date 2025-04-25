
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'inactive' | 'expired';

interface UserSubscription {
  subscription_status: SubscriptionStatus;
  subscription_type: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
  start_date: string | null;
  end_date: string | null;
  is_recurring: boolean;
  trial_used: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  subscription: UserSubscription | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const refreshSubscription = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && now - lastRefreshTime < REFRESH_INTERVAL) {
      return; // Skip if recently refreshed
    }
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_status, subscription_type, start_date, end_date, is_recurring, trial_used')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setSubscription(data);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Clear subscription data on sign out
        if (event === 'SIGNED_OUT') {
          setSubscription(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Fetch subscription status after a slight delay to avoid race conditions
        setTimeout(() => {
          refreshSubscription();
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // Refresh subscription when user changes - but DON'T refresh on tab changes
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      subscription, 
      isLoading, 
      signOut,
      refreshSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
