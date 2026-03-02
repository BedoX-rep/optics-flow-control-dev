import { createContext, useContext, useEffect, useState, useRef } from 'react';
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

// Rate limiting for subscription API calls
interface RateLimitTracker {
  [userId: string]: {
    lastCall: number;
    callsInWindow: number[];
  };
}

const permissionsCache: PermissionsCache = {};
const subscriptionCache: SubscriptionCache = {};
const rateLimitTracker: RateLimitTracker = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MIN_CALL_INTERVAL = 60 * 1000; // 1 minute
const MAX_CALLS_PER_WINDOW = 3; // 3 calls per 5 minutes

type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'inactive' | 'expired' |
  'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';

type UserRole = 'owner' | 'employee';

interface UserSubscription {
  subscription_status: SubscriptionStatus;
  subscription_type: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
  start_date: string | null;
  end_date: string | null;
  is_recurring: boolean;
  trial_used: boolean;
  store_name?: string;
  display_name?: string;
  email?: string;
  referral_code?: string;
  referred_by?: string;
  access_code?: string;
  role?: UserRole;
  store_id?: string;
}

interface UserPermissions {
  can_manage_products: boolean;
  can_manage_clients: boolean;
  can_manage_receipts: boolean;
  can_view_financial: boolean;
  can_manage_purchases: boolean;
  can_access_dashboard: boolean;
  can_manage_invoices: boolean;
  can_access_appointments: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  subscription: UserSubscription | null;
  permissions: UserPermissions | null;
  userRole: UserRole;
  storeId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: (force?: boolean) => Promise<void>;
  invalidatePermissionsCache: (userId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [storeId, setStoreId] = useState<string | null>(null);
  const userRoleRef = useRef(userRole);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

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

  // Rate limiting check for subscription API calls
  const canMakeSubscriptionCall = (userId: string): boolean => {
    const now = Date.now();

    if (!rateLimitTracker[userId]) {
      rateLimitTracker[userId] = {
        lastCall: 0,
        callsInWindow: []
      };
    }

    const userTracker = rateLimitTracker[userId];

    // Check minimum interval (1 call per minute)
    if (now - userTracker.lastCall < MIN_CALL_INTERVAL) {
      return false;
    }

    // Clean up old calls outside the 5-minute window
    userTracker.callsInWindow = userTracker.callsInWindow.filter(
      callTime => now - callTime < RATE_LIMIT_WINDOW
    );

    // Check if we've exceeded max calls per window
    if (userTracker.callsInWindow.length >= MAX_CALLS_PER_WINDOW) {
      return false;
    }

    return true;
  };

  const fetchSubscription = async (userId: string, force: boolean = false) => {
    const now = Date.now();

    // Get current subscription state to avoid stale closure
    const getCurrentSubscription = () => {
      return subscription;
    };

    // Check if we have cached data and it's still fresh (unless forced)
    if (!force && getCurrentSubscription() && now - lastRefreshTime < REFRESH_INTERVAL) {
      return { role: userRoleRef.current, userStoreId: null }; // Skip if recently fetched
    }

    // Apply rate limiting for API calls
    if (!canMakeSubscriptionCall(userId)) {
      return { role: userRoleRef.current, userStoreId: null }; // Skip API call
    }

    try {
      // Update rate limit tracker
      if (!rateLimitTracker[userId]) {
        rateLimitTracker[userId] = { lastCall: 0, callsInWindow: [] };
      }
      rateLimitTracker[userId].lastCall = now;
      rateLimitTracker[userId].callsInWindow.push(now);

      // 1. Get user role and store directly from helper function
      const { data: storeRoleData, error: storeRoleError } = await supabase.rpc('get_user_store_role');
      if (storeRoleError) throw storeRoleError;

      const role = (storeRoleData?.[0]?.user_role as UserRole) || 'owner';
      const userStoreId = storeRoleData?.[0]?.store_id || null;

      setUserRole(role);
      userRoleRef.current = role;
      setStoreId(userStoreId);

      // 2. Fetch the corresponding subscription based on role
      let subscriptionQuery = supabase.from('subscriptions').select('*');

      if (role === 'employee' && userStoreId) {
        subscriptionQuery = subscriptionQuery.eq('store_id', userStoreId).eq('role', 'owner');
      } else {
        subscriptionQuery = subscriptionQuery.eq('user_id', userId);
      }

      const { data: subscriptionData, error: subError } = await subscriptionQuery.single();

      if (subError && role === 'owner') {
        throw subError; // Owners must have a subscription, employees might not if owner data is broken
      }

      if (subscriptionData) {
        setSubscription(subscriptionData as UserSubscription);
      } else {
        setSubscription(null);
      }

      setLastRefreshTime(now);

      return { role, userStoreId };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      return { role: userRoleRef.current, userStoreId: null };
    }
  };

  // Real-time subscription and permissions handler
  const setupRealtimeSubscription = (userId: string, role: string, storeId: string | null) => {
    let subFilterString = `user_id=eq.${userId}`;
    if (role === 'employee' && storeId) {
      subFilterString = `store_id=eq.${storeId}`;
    }

    const channel = supabase
      .channel(`user-data-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: subFilterString,
        },
        (payload) => {
          if (role === 'employee' && (payload.new as any)?.role !== 'owner') {
            return; // Ignore updates to any non-owner subscription
          }

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as UserSubscription;
            setSubscription(newData);
            setLastRefreshTime(Date.now());
          } else if (payload.eventType === 'DELETE') {
            setSubscription(null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permissions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newPerms = payload.new as UserPermissions;
            setPermissions(newPerms);
            setCachedPermissions(userId, newPerms);
          }
        }
      )
      .subscribe();

    return channel;
  };

  const updatePermissionsForRole = (userId: string, role: UserRole) => {
    if (role === 'owner') {
      // Owner gets all permissions immediately
      const ownerPermissions = {
        can_manage_products: true,
        can_manage_clients: true,
        can_manage_receipts: true,
        can_view_financial: true,
        can_manage_purchases: true,
        can_access_dashboard: true,
        can_manage_invoices: true,
        can_access_appointments: true,
      };
      setPermissions(ownerPermissions);
      setCachedPermissions(userId, ownerPermissions);
    } else {
      // Check cache first for employees
      const cachedPermissions = getCachedPermissions(userId);
      if (cachedPermissions) {
        setPermissions(cachedPermissions);
        return;
      }

      // Fetch actual permissions for employee
      supabase
        .from('permissions')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data: permissionsData, error: permError }) => {
          if (permError) {
            console.error('Error fetching permissions:', permError);
            // Set default employee permissions if none exist
            const defaultPermissions = {
              can_manage_products: true,
              can_manage_clients: true,
              can_manage_receipts: true,
              can_view_financial: false,
              can_manage_purchases: false,
              can_access_dashboard: true,
              can_manage_invoices: true,
              can_access_appointments: true,
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

    // Check rate limiting even for forced calls
    if (force && !canMakeSubscriptionCall(user.id)) {
      return;
    }

    // Only make API call if forced or no subscription data exists
    if (force || !subscription) {
      await fetchSubscription(user.id, force);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole('employee');
    invalidatePermissionsCache(); // Clear entire cache on sign out
  };

  useEffect(() => {
    let realtimeChannel: RealtimeChannel | null = null;
    let sessionCheckTimeout: NodeJS.Timeout | null = null;
    let hasInitialized = false;

    const debouncedSessionCheck = (currentSession: Session | null, isInitialCheck: boolean = false, forceSubscriptionFetch: boolean = false) => {
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }

      sessionCheckTimeout = setTimeout(async () => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          let role = userRoleRef.current;
          let storeId: string | null = null;

          // Only fetch subscription on initial load or force
          if (isInitialCheck || forceSubscriptionFetch) {
            const userInfo = await fetchSubscription(currentSession.user.id, false);
            role = userInfo?.role || role;
            storeId = userInfo?.userStoreId || null;
          }

          updatePermissionsForRole(currentSession.user.id, role as UserRole);

          // Set up real-time subscription for existing session if not already set up
          if (!realtimeChannel) {
            realtimeChannel = setupRealtimeSubscription(currentSession.user.id, role, storeId);
          }
        } else {
          setSubscription(null);
          setPermissions(null);
          setUserRole('employee');
          setStoreId(null);

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

  // Handle instant permission updates when userRole changes
  useEffect(() => {
    userRoleRef.current = userRole;
    if (user && !isLoading) {
      updatePermissionsForRole(user.id, userRole);
    }
  }, [userRole, user, isLoading]);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      subscription,
      permissions,
      userRole,
      storeId,
      isLoading,
      signOut,
      refreshSubscription,
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