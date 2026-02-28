import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Navigate } from 'react-router-dom';

interface StaffMember {
  user_id: string;
  email: string;
  display_name: string;
  access_code: string;
  permissions: {
    can_manage_products: boolean;
    can_manage_clients: boolean;
    can_manage_receipts: boolean;
    can_view_financial: boolean;
    can_manage_purchases: boolean;
    can_access_dashboard: boolean;
    can_manage_invoices: boolean;
    can_access_appointments: boolean;
  };
}

const Access = () => {
  const { user, subscription, sessionRole, promoteToAdmin, permissions, invalidatePermissionsCache } = useAuth();
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const isAdmin = sessionRole === 'Admin';

  // Fetch user's own permissions
  const { data: userPermissions, isLoading: userPermissionsLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all staff members (admin only)
  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      if (!isAdmin) return [];

      // Use cached subscription data when available for current user
      let subscriptionsData;
      if (subscription && user) {
        // For current user, use cached data and fetch others
        const { data: otherSubscriptions, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select(`
            user_id,
            email,
            display_name,
            access_code
          `)
          .neq('user_id', user.id);

        if (subscriptionsError) throw subscriptionsError;

        // Combine current user's cached data with others
        subscriptionsData = [
          {
            user_id: user.id,
            email: subscription.email || user.email,
            display_name: subscription.display_name,
            access_code: subscription.access_code
          },
          ...otherSubscriptions
        ];
      } else {
        // Fallback to fetching all if no cached data
        const { data, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select(`
            user_id,
            email,
            display_name,
            access_code
          `);

        if (subscriptionsError) throw subscriptionsError;
        subscriptionsData = data;
      }

      // Get all user IDs
      const userIds = subscriptionsData.map(staff => staff.user_id);

      // Fetch all permissions in a single query
      const { data: rawPermissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .in('user_id', userIds);

      const permissionsData = (rawPermissions || []) as Database['public']['Tables']['permissions']['Row'][];

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
      }

      // Create a map of permissions by user_id for quick lookup
      const permissionsMap = new Map();
      if (permissionsData) {
        permissionsData.forEach(perm => {
          permissionsMap.set(perm.user_id, perm);
        });
      }

      // Combine staff data with permissions
      const staffWithPermissions = subscriptionsData.map(staff => ({
        ...staff,
        permissions: permissionsMap.get(staff.user_id) || {
          can_manage_products: true,
          can_manage_clients: true,
          can_manage_receipts: true,
          can_view_financial: false,
          can_manage_purchases: false,
          can_access_dashboard: true,
          can_manage_invoices: true,
          can_access_appointments: true,
        }
      }));

      return staffWithPermissions as StaffMember[];
    },
    enabled: isAdmin,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 60 minutes
  });

  // Update own permissions mutation
  const updateOwnPermissionsMutation = useMutation({
    mutationFn: async (newPermissions: Partial<Database['public']['Tables']['permissions']['Update']>) => {
      const { error } = await supabase
        .from('permissions')
        .update(newPermissions)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', user?.id] });
      // Invalidate permissions cache for current user
      if (user?.id) {
        invalidatePermissionsCache(user.id);
      }
      toast({
        title: t('success'),
        description: t('yourPermissionsUpdated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToUpdatePermissions'),
        variant: "destructive",
      });
    },
  });

  // Update staff permissions mutation (admin only)
  const updateStaffPermissionsMutation = useMutation({
    mutationFn: async ({ userId, newPermissions }: { userId: string; newPermissions: Partial<StaffMember['permissions']> }) => {
      const { error } = await supabase
        .from('permissions')
        .update(newPermissions)
        .eq('user_id', userId);

      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      // Invalidate permissions cache for the updated user
      invalidatePermissionsCache(userId);
      toast({
        title: t('success'),
        description: t('staffPermissionsUpdated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToUpdatePermissions'),
        variant: "destructive",
      });
    },
  });

  // Redirect staff users who haven't elevated to admin (after hooks)
  if (!user) {
    return <div>{t('pleaseLoginToAccess')}</div>;
  }

  if (sessionRole === 'Store Staff') {
    return <Navigate to="/dashboard" replace />;
  }

  const handlePromoteToAdmin = async () => {
    if (!accessCodeInput.trim()) {
      toast({
        title: t('error'),
        description: t('pleaseEnterAccessCode'),
        variant: "destructive",
      });
      return;
    }

    const result = await promoteToAdmin(accessCodeInput.trim().toUpperCase());

    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setAccessCodeInput('');
    }
  };

  const handleOwnPermissionChange = (permission: string, value: boolean) => {
    updateOwnPermissionsMutation.mutate({ [permission]: value });
  };

  const handleStaffPermissionChange = (userId: string, permission: keyof StaffMember['permissions'], value: boolean) => {
    updateStaffPermissionsMutation.mutate({
      userId,
      newPermissions: { [permission]: value }
    });
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full max-w-none animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('accessManagement')}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage staff privileges and permissions</p>
        </div>
      </div>

      {/* Current User Info */}
      <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
        <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50">
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{t('yourAccessInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('currentSessionRole')}</Label>
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-base font-black text-slate-800">{sessionRole === 'Admin' ? t('admin') : t('storeStaff')}</p>
                {sessionRole === 'Admin' && (
                  <Badge className="bg-teal-500 hover:bg-teal-600 text-white border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">{t('sessionElevated')}</Badge>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('accessCode')}</Label>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <p className="text-base font-mono font-bold tracking-widest text-teal-400">{subscription?.access_code}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Own Permissions */}
      <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
        <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50">
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{t('yourPermissions')}</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 mt-1">{t('manageOwnPermissions')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8 px-6 md:px-8">
          {userPermissionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : userPermissions ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'can_manage_products', label: t('manageProducts') },
                { id: 'can_manage_clients', label: t('manageClients') },
                { id: 'can_manage_receipts', label: t('manageReceipts') },
                { id: 'can_view_financial', label: t('viewFinancial') },
                { id: 'can_manage_purchases', label: t('managePurchases') },
                { id: 'can_access_dashboard', label: t('accessDashboard') },
                { id: 'can_manage_invoices', label: t('manageInvoices') },
                { id: 'can_access_appointments', label: t('accessAppointments') }
              ].map((perm) => (
                <div key={perm.id} className="flex items-center justify-between p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:border-teal-300 hover:shadow-md transition-all group">
                  <Label htmlFor={perm.id} className="text-sm font-bold text-slate-800 cursor-pointer group-hover:text-teal-700 transition-colors">{perm.label}</Label>
                  <Switch
                    id={perm.id}
                    checked={!!userPermissions[perm.id as keyof typeof userPermissions]}
                    onCheckedChange={(checked) =>
                      handleOwnPermissionChange(perm.id, checked)
                    }
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {t('noPermissionsFound')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Access;