
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SubscriptionDetails {
  subscription_status: 'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';
  subscription_type: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
  end_date: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscription: SubscriptionDetails | null;
  subscriptionLoading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch subscription details
  const fetchSubscription = async (userId: string) => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_status, subscription_type, end_date')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data) {
        setSubscription(data as SubscriptionDetails);
      }
    } catch (error) {
      console.error('Error in subscription fetch:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Function to refresh subscription data
  const refreshSubscription = async () => {
    if (user?.id) {
      await fetchSubscription(user.id);
    }
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(null);
    navigate('/auth');
  };

  useEffect(() => {
    // Set up auth state change listener first
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(() => {
          fetchSubscription(currentSession.user.id);
        }, 0);
      } else {
        setSubscription(null);
      }
      
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchSubscription(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    subscription,
    subscriptionLoading,
    signOut,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
