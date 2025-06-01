
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'inactive' | 'expired' |
                         'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';

interface UserSubscription {
  subscription_status: SubscriptionStatus;
  subscription_type: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
  start_date: string | null;
  end_date: string | null;
  is_recurring: boolean;
  trial_used: boolean;
  store_name?: string;
  display_name?: string;
  referral_code?: string;
  referred_by?: string;
  access_code?: string;
}

interface UserPermissions {
  can_manage_products: boolean;
  can_manage_clients: boolean;
  can_manage_receipts: boolean;
  can_view_financial: boolean;
  can_manage_purchases: boolean;
  can_access_dashboard: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  subscription: UserSubscription | null;
  permissions: UserPermissions | null;
  sessionRole: 'Admin' | 'Store Staff';
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: (force?: boolean) => Promise<void>;
  promoteToAdmin: (accessCode: string) => Promise<{ success: boolean; message: string }>;
  setSessionRole: (role: 'Admin' | 'Store Staff') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [sessionRole, setSessionRole] = useState<'Admin' | 'Store Staff'>('Store Staff');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_status, subscription_type, start_date, end_date, is_recurring, trial_used, store_name, display_name, referral_code, referred_by, access_code')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const formattedSubscription: UserSubscription = {
          ...data,
          subscription_status: data.subscription_status as SubscriptionStatus
        };
        setSubscription(formattedSubscription);
      }
      
      // Fetch permissions based on session role
      if (sessionRole === 'Admin') {
        // For Admin session role, get admin permissions
        const { data: adminPermissions, error: adminError } = await supabase.rpc('get_admin_permissions');
        
        if (adminError) {
          console.error('Error fetching admin permissions:', adminError);
          // Set default admin permissions
          setPermissions({
            can_manage_products: true,
            can_manage_clients: true,
            can_manage_receipts: true,
            can_view_financial: true,
            can_manage_purchases: true,
            can_access_dashboard: true
          });
        } else if (adminPermissions && adminPermissions.length > 0) {
          setPermissions(adminPermissions[0]);
        }
      } else {
        // For Store Staff session role, fetch from database
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('permissions')
          .select('can_manage_products, can_manage_clients, can_manage_receipts, can_view_financial, can_manage_purchases, can_access_dashboard')
          .eq('user_id', userId)
          .single();
        
        if (permissionsError) {
          console.error('Error fetching permissions:', permissionsError);
          // Set default Store Staff permissions
          setPermissions({
            can_manage_products: true,
            can_manage_clients: true,
            can_manage_receipts: true,
            can_view_financial: false,
            can_manage_purchases: false,
            can_access_dashboard: true
          });
        } else {
          setPermissions(permissionsData);
        }
      }
      
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      setPermissions(null);
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
    setSessionRole('Store Staff'); // Reset to default role
  };

  const promoteToAdmin = async (accessCode: string) => {
    try {
      const { data, error } = await supabase.rpc('check_access_code', {
        input_access_code: accessCode
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        if (result.valid) {
          setSessionRole('Admin');
          // Refresh permissions for the new role
          if (user) {
            await fetchSubscription(user.id);
          }
          return { success: true, message: 'Successfully elevated to Admin for this session' };
        } else {
          return { success: false, message: result.message };
        }
      }
      
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Error elevating to admin:', error);
      return { success: false, message: 'Failed to elevate to admin' };
    }
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
          setPermissions(null);
          setSessionRole('Store Staff');
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
      permissions,
      sessionRole,
      isLoading, 
      signOut,
      refreshSubscription,
      promoteToAdmin,
      setSessionRole
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
