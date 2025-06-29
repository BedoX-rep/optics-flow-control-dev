import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Permissions cache
interface PermissionsCache {
  [userId: string]: {
    permissions: UserPermissions;
    timestamp: number;
  };
}

// Subscription cache
interface SubscriptionCache {
  [userId: string]: {
    subscription: UserSubscription;
    timestamp: number;
  };
}

const permissionsCache: PermissionsCache = {};
const subscriptionCache: SubscriptionCache = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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
  can_manage_invoices: boolean;
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
  exitAdminSession: () => void;
  invalidatePermissionsCache: (userId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [sessionRole, setSessionRole] = useState<'Admin' | 'Store Staff'>(
    (typeof window !== 'undefined' && localStorage.getItem('sessionRole')) as 'Admin' | 'Store Staff' || 'Store Staff'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [lastAccessCodeAttempt, setLastAccessCodeAttempt] = useState<number>(0);

  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

  // Cache helper functions
  const getCachedPermissions = (userId: string): UserPermissions | null => {
    const cached = permissionsCache[userId];
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.permissions;
    }
    return null;
  };

  const setCachedPermissions = (userId: string, permissions: UserPermissions) => {
    permissionsCache[userId] = {
      permissions,
      timestamp: Date.now()
    };
  };

  const invalidatePermissionsCache = (userId?: string) => {
    if (userId) {
      delete permissionsCache[userId];
    } else {
      // Clear entire cache
      Object.keys(permissionsCache).forEach(key => {
        delete permissionsCache[key];
      });
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError) throw subError;

      setSubscription(subscriptionData);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  // Real-time subscription handler
  const setupRealtimeSubscription = (userId: string) => {
    const channel = supabase
      .channel(`subscription-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time subscription update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSubscription(payload.new as UserSubscription);
            setLastRefreshTime(Date.now());
          } else if (payload.eventType === 'DELETE') {
            setSubscription(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription channel status:', status);
      });

    return channel;
  };

  const updatePermissionsForRole = (userId: string, role: 'Admin' | 'Store Staff') => {
    if (role === 'Admin') {
      // Admin gets all permissions immediately
      const adminPermissions = {
        can_manage_products: true,
        can_manage_clients: true,
        can_manage_receipts: true,
        can_view_financial: true,
        can_manage_purchases: true,
        can_access_dashboard: true,
        can_manage_invoices: true,
      };
      setPermissions(adminPermissions);
      setCachedPermissions(userId, adminPermissions);
    } else {
      // Check cache first for Store Staff
      const cachedPermissions = getCachedPermissions(userId);
      if (cachedPermissions) {
        setPermissions(cachedPermissions);
        return;
      }

      // Fetch actual permissions for Store Staff
      supabase
        .from('permissions')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data: permissionsData, error: permError }) => {
          if (permError) {
            console.error('Error fetching permissions:', permError);
            // Set default Store Staff permissions if none exist
            const defaultPermissions = {
              can_manage_products: true,
              can_manage_clients: true,
              can_manage_receipts: true,
              can_view_financial: false,
              can_manage_purchases: false,
              can_access_dashboard: true,
              can_manage_invoices: true,
            };
            setPermissions(defaultPermissions);
            setCachedPermissions(userId, defaultPermissions);
          } else {
            setPermissions(permissionsData);
            setCachedPermissions(userId, permissionsData);
          }
        });
    }
  };

  const refreshSubscription = async (force: boolean = false) => {
    const now = Date.now();
    
    // With real-time subscriptions, only refresh if forced or very stale
    if (!force && subscription && now - lastRefreshTime < REFRESH_INTERVAL) {
      return; // Skip if recently refreshed and we have real-time data
    }

    if (!user) return;
    
    // Only make API call if forced or no subscription data exists
    if (force || !subscription) {
      await fetchSubscription(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sessionRole');
    setSessionRole('Store Staff'); // Reset to default role
    invalidatePermissionsCache(); // Clear entire cache on sign out
  };

  const promoteToAdmin = async (accessCode: string) => {
    try {
      // Anti-spam protection: 10 seconds cooldown
      const now = Date.now();
      const timeSinceLastAttempt = now - lastAccessCodeAttempt;
      const cooldownPeriod = 10 * 1000; // 10 seconds

      if (timeSinceLastAttempt < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 1000);
        return { 
          success: false, 
          message: `Please wait ${remainingTime} seconds before trying again` 
        };
      }

      setLastAccessCodeAttempt(now);

      const { data, error } = await supabase.rpc('check_access_code', {
        input_access_code: accessCode
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.valid) {
          updateSessionRole('Admin');
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
    let realtimeChannel: any = null;

    // First set up auth state listener to catch changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Clean up previous real-time subscription
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }

        // Clear subscription data on sign out
        if (event === 'SIGNED_OUT') {
          setSubscription(null);
          setPermissions(null);
          localStorage.removeItem('sessionRole');
          setSessionRole('Store Staff');
          setIsLoading(false);
        } 
        // Fetch subscription and set up real-time only on actual sign in
        else if (event === 'SIGNED_IN' && newSession?.user) {
          fetchSubscription(newSession.user!.id);
          updatePermissionsForRole(newSession.user!.id, sessionRole);
          
          // Set up real-time subscription
          realtimeChannel = setupRealtimeSubscription(newSession.user!.id);
          
          setIsLoading(false);
        }
        // Handle token refresh without fetching subscription (real-time handles updates)
        else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          updatePermissionsForRole(newSession.user!.id, sessionRole);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchSubscription(currentSession.user.id);
        updatePermissionsForRole(currentSession.user.id, sessionRole);
        
        // Set up real-time subscription for existing session
        realtimeChannel = setupRealtimeSubscription(currentSession.user.id);
      }

      setIsLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  // Handle instant permission updates when sessionRole changes
  useEffect(() => {
    if (user && !isLoading) {
      updatePermissionsForRole(user.id, sessionRole);
    }
  }, [sessionRole, user, isLoading]);

  const updateSessionRole = (role: 'Admin' | 'Store Staff') => {
    setSessionRole(role);
    localStorage.setItem('sessionRole', role);
  };

  const exitAdminSession = () => {
    setSessionRole('Store Staff');
    localStorage.removeItem('sessionRole');
  };

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
      setSessionRole: updateSessionRole,
      exitAdminSession,
      invalidatePermissionsCache
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