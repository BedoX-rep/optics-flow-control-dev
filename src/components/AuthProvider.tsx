
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, AuthError, User } from '@supabase/supabase-js';

interface SignUpOptions {
  email: string;
  password: string;
  options?: {
    data?: {
      display_name?: string;
      store_name?: string;
      referred_by?: string | null;
    }
  }
}

interface SignInOptions {
  email: string;
  password: string;
}

interface Subscription {
  subscription_status: string;
  referral_code?: string;
  store_name?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  signUp: (options: SignUpOptions) => Promise<{ error: AuthError | null }>;
  signIn: (options: SignInOptions) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch subscription data
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (data && !error) {
            setSubscription(data);
          }
        } else {
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch subscription data
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (data && !error) {
          setSubscription(data);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, options }: SignUpOptions) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: options
    });
  };

  const signIn = async ({ email, password }: SignInOptions) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    subscription,
    isLoading: loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
