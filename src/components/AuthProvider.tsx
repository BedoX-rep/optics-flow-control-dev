
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

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_status, subscription_type, start_date, end_date, is_recurring, trial_used')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      // Convert status to lowercase to match our expected type
      if (data) {
        const formattedSubscription: UserSubscription = {
          ...data,
          subscription_status: data.subscription_status.toLowerCase() as SubscriptionStatus
        };
        setSubscription(formattedSubscription);
      }
      
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  const refreshSubscription = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && now - lastRefreshTime < REFRESH_INTERVAL) {
      return; // Skip if recently refreshed
    }
    
    if (!user) return;
    await fetchSubscription(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // First set up auth state listener to catch changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Clear subscription data on sign out
        if (event === 'SIGNED_OUT') {
          setSubscription(null);
          setIsLoading(false);
        } 
        // Fetch subscription on sign in or token refresh
        else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase auth
          setTimeout(() => {
            fetchSubscription(newSession.user!.id);
            setIsLoading(false);
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchSubscription(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

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
