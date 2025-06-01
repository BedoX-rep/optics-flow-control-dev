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
  const { user, subscription, sessionRole, setSessionRole } = useAuth();
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = sessionRole === 'Admin';

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

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, newPermissions }: { userId: string; newPermissions: Partial<StaffMember['permissions']> }) => {
      const { error } = await supabase
        .from('permissions')
        .update(newPermissions)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({
        title: "Success",
        description: "Permissions updated successfully",
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

  const handlePermissionChange = (userId: string, permission: keyof StaffMember['permissions'], value: boolean) => {
    updatePermissionsMutation.mutate({
      userId,
      newPermissions: { [permission]: value }
    });
  };

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

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

          {!isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="admin-access-code">Promote to Admin</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-access-code"
                  placeholder="Enter access code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                  maxLength={5}
                />
                <Button onClick={handlePromoteToAdmin}>
                  Promote
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Panel */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Manage permissions for all staff members</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading staff members...</p>
            ) : (
              <div className="space-y-4">
                {staffMembers?.map((staff) => (
                  <div key={staff.user_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-medium">{staff.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{staff.email}</p>
                        <p className="text-sm">Access Code: {staff.access_code}</p>
                      </div>
                    </div>

                    {staff.permissions && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={staff.permissions.can_manage_products}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(staff.user_id, 'can_manage_products', checked)
                            }
                          />
                          <Label>Manage Products</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={staff.permissions.can_manage_clients}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(staff.user_id, 'can_manage_clients', checked)
                            }
                          />
                          <Label>Manage Clients</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={staff.permissions.can_manage_receipts}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(staff.user_id, 'can_manage_receipts', checked)
                            }
                          />
                          <Label>Manage Receipts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={staff.permissions.can_view_financial}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(staff.user_id, 'can_view_financial', checked)
                            }
                          />
                          <Label>View Financial</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={staff.permissions.can_manage_purchases}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(staff.user_id, 'can_manage_purchases', checked)
                            }
                          />
                          <Label>Manage Purchases</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={staff.permissions.can_access_dashboard}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(staff.user_id, 'can_access_dashboard', checked)
                            }
                          />
                          <Label>Access Dashboard</Label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Access;