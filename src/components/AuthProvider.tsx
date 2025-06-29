import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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

  const fetchSubscription = async (userId: string, force: boolean = false) => {
    const now = Date.now();

    // Check if we have cached data and it's still fresh (unless forced)
    if (!force && subscription && now - lastRefreshTime < REFRESH_INTERVAL) {
      return; // Skip if recently fetched and not forced
    }

    try {
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError) throw subError;

      setSubscription(subscriptionData);
      setLastRefreshTime(now);
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
      await fetchSubscription(user.id, force);
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
    let realtimeChannel: RealtimeChannel | null = null;
    let sessionCheckTimeout: NodeJS.Timeout | null = null;
    let hasInitialized = false;

    const debouncedSessionCheck = (currentSession: Session | null, isInitialCheck: boolean = false, forceSubscriptionFetch: boolean = false) => {
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }

      sessionCheckTimeout = setTimeout(() => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Only fetch subscription on initial load, force, or if we don't have any subscription data
          if (isInitialCheck || forceSubscriptionFetch || !subscription) {
            fetchSubscription(currentSession.user.id, false);
          }
          updatePermissionsForRole(currentSession.user.id, sessionRole);

          // Set up real-time subscription for existing session if not already set up
          if (!realtimeChannel) {
            realtimeChannel = setupRealtimeSubscription(currentSession.user.id);
          }
        } else {
          setSubscription(null);
          setPermissions(null);
          setSessionRole('Store Staff');

          // Clean up real-time subscription when logged out
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
        }
        setIsLoading(false);
      }, 100); // 100ms debounce
    };

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change event:', event); // Debug log
      
      // Clean up existing real-time subscription on auth change
      if (realtimeChannel && event === 'SIGNED_OUT') {
        await supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      // Only handle specific auth events that actually require action
      if (event === 'SIGNED_IN') {
        debouncedSessionCheck(currentSession, true, true); // Force subscription fetch for new sign-in
      } else if (event === 'SIGNED_OUT') {
        debouncedSessionCheck(currentSession, false, false); // Don't fetch subscription for sign-out
      } else if (event === 'TOKEN_REFRESHED') {
        // For token refresh, just update session without fetching subscription
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      // Ignore all other events (INITIAL_SESSION, PASSWORD_RECOVERY, USER_UPDATED, etc.)
    });

    // Check for existing session - only once on mount
    if (!hasInitialized) {
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        hasInitialized = true;
        debouncedSessionCheck(currentSession, true, true);
      });
    }

    return () => {
      authSubscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }
    };
  }, []); // Empty dependency array to run only once

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};