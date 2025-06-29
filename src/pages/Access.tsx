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
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .in('user_id', userIds);

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
        }
      }));
      
      return staffWithPermissions as StaffMember[];
    },
    enabled: isAdmin,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    cacheTime: 60 * 60 * 1000, // Keep in cache for 60 minutes
  });

  // Update own permissions mutation
  const updateOwnPermissionsMutation = useMutation({
    mutationFn: async (newPermissions: Partial<typeof userPermissions>) => {
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('accessManagement')}</h1>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('yourAccessInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('currentSessionRole')}</Label>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{sessionRole === 'Admin' ? t('admin') : t('storeStaff')}</p>
              {sessionRole === 'Admin' && (
                <Badge variant="secondary">{t('sessionElevated')}</Badge>
              )}
            </div>
          </div>
          <div>
            <Label>{t('accessCode')}</Label>
            <p className="text-lg font-mono">{subscription?.access_code}</p>
          </div>
        </CardContent>
      </Card>

      {/* User's Own Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('yourPermissions')}</CardTitle>
          <CardDescription>{t('manageOwnPermissions')}</CardDescription>
        </CardHeader>
        <CardContent>
          {userPermissionsLoading ? (
            <p>{t('loadingPermissions')}</p>
          ) : userPermissions ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_products}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_products', checked)
                  }
                />
                <Label>{t('manageProducts')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_clients}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_clients', checked)
                  }
                />
                <Label>{t('manageClients')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_receipts}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_receipts', checked)
                  }
                />
                <Label>{t('manageReceipts')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_view_financial}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_view_financial', checked)
                  }
                />
                <Label>{t('viewFinancial')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_purchases}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_purchases', checked)
                  }
                />
                <Label>{t('managePurchases')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_access_dashboard}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_access_dashboard', checked)
                  }
                />
                <Label>{t('accessDashboard')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_invoices}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_invoices', checked)
                  }
                />
                <Label>{t('manageInvoices')}</Label>
              </div>
            </div>
          ) : (
            <p>{t('noPermissionsFound')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Access;