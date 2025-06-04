import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
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
  };
}

const Access = () => {
  const { user, subscription, sessionRole, promoteToAdmin, permissions, invalidatePermissionsCache } = useAuth();
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = sessionRole === 'Admin';

  // Redirect staff users who haven't elevated to admin
  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (sessionRole === 'Store Staff') {
    return <Navigate to="/dashboard" replace />;
  }

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

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          user_id,
          email,
          display_name,
          access_code,
          permissions (
            can_manage_products,
            can_manage_clients,
            can_manage_receipts,
            can_view_financial,
            can_manage_purchases,
            can_access_dashboard
          )
        `);

      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: isAdmin,
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
        title: "Success",
        description: "Your permissions updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update permissions",
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
        title: "Success",
        description: "Staff permissions updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update staff permissions",
        variant: "destructive",
      });
    },
  });

  const handlePromoteToAdmin = async () => {
    if (!accessCodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter an access code",
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
        <h1 className="text-3xl font-bold">Access Management</h1>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Access Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Session Role</Label>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{sessionRole}</p>
              {sessionRole === 'Admin' && (
                <Badge variant="secondary">Session Elevated</Badge>
              )}
            </div>
          </div>
          <div>
            <Label>Access Code</Label>
            <p className="text-lg font-mono">{subscription?.access_code}</p>
          </div>
        </CardContent>
      </Card>

      {/* User's Own Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>Manage your own access permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {userPermissionsLoading ? (
            <p>Loading your permissions...</p>
          ) : userPermissions ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_products}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_products', checked)
                  }
                />
                <Label>Manage Products</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_clients}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_clients', checked)
                  }
                />
                <Label>Manage Clients</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_receipts}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_receipts', checked)
                  }
                />
                <Label>Manage Receipts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_view_financial}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_view_financial', checked)
                  }
                />
                <Label>View Financial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_manage_purchases}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_manage_purchases', checked)
                  }
                />
                <Label>Manage Purchases</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={userPermissions.can_access_dashboard}
                  onCheckedChange={(checked) => 
                    handleOwnPermissionChange('can_access_dashboard', checked)
                  }
                />
                <Label>Access Dashboard</Label>
              </div>
            </div>
          ) : (
            <p>No permissions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Access;