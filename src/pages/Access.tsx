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
import { createClient } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Users, UserPlus, Shield, Trash2, Eye, EyeOff, Mail, User, Store
} from 'lucide-react';

interface EmployeeWithPermissions {
  id: string;
  user_id: string | null;
  email: string;
  display_name: string | null;
  status: string;
  created_at: string;
  permissions: {
    can_manage_products: boolean;
    can_manage_clients: boolean;
    can_manage_receipts: boolean;
    can_view_financial: boolean;
    can_manage_purchases: boolean;
    can_access_dashboard: boolean;
    can_manage_invoices: boolean;
    can_access_appointments: boolean;
  } | null;
}

const Access = () => {
  const { user, subscription, userRole, storeId, invalidatePermissionsCache } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);

  const isOwner = userRole === 'owner';

  // Fetch the owner's store
  const { data: store } = useQuery({
    queryKey: ['owner-store', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && isOwner,
  });

  // Fetch employees for this store
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['store-employees', store?.id],
    queryFn: async () => {
      if (!store) return [];

      const { data: empData, error: empError } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', store.id);

      if (empError) throw empError;

      // Get permissions for employees that have user_id
      const userIds = empData
        .filter(e => e.user_id)
        .map(e => e.user_id as string);

      let permissionsMap = new Map();
      if (userIds.length > 0) {
        const { data: permsData } = await supabase
          .from('permissions')
          .select('*')
          .in('user_id', userIds);

        if (permsData) {
          permsData.forEach(p => permissionsMap.set(p.user_id, p));
        }
      }

      return empData.map(emp => ({
        ...emp,
        permissions: emp.user_id ? (permissionsMap.get(emp.user_id) || null) : null,
      })) as EmployeeWithPermissions[];
    },
    enabled: !!store,
    staleTime: 5 * 60 * 1000,
  });

  // Create employee account
  const handleCreateEmployee = async () => {
    if (!newEmployeeEmail || !newEmployeePassword || !newEmployeeName) {
      toast({
        title: t('error') || 'Error',
        description: t('fillAllRequiredFields') || 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (newEmployeePassword.length < 6) {
      toast({
        title: t('error') || 'Error',
        description: t('passwordTooShort') || 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!store) {
      toast({
        title: t('error') || 'Error',
        description: t('storeNotFound') || 'Store information not found. Please try refreshing the page.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingEmployee(true);

    try {
      // 1. Create the store_employees record first (before signUp triggers handle_new_user)
      const { error: empError } = await supabase
        .from('store_employees')
        .insert({
          store_id: store!.id,
          email: newEmployeeEmail.toLowerCase(),
          display_name: newEmployeeName,
          status: 'active',
        });

      if (empError) {
        if (empError.code === '23505') {
          toast({
            title: t('error') || 'Error',
            description: t('employeeAlreadyExists') || 'An employee with this email already exists',
            variant: 'destructive',
          });
          setIsCreatingEmployee(false);
          return;
        }
        throw empError;
      }

      // 2. Create the auth user using a session-isolated Supabase client
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vbcdgubnvbilavetsjlr.supabase.co";
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiY2RndWJudmJpbGF2ZXRzamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTE4MDYsImV4cCI6MjA2MDY2NzgwNn0.aNeLdgw7LTsVl73gzKIjxT5w0AyT99x1bh-BSV3HeCQ";

      // Create isolated client that won't affect the owner's session
      const isolatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });

      const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
        email: newEmployeeEmail.toLowerCase(),
        password: newEmployeePassword,
        options: {
          data: {
            display_name: newEmployeeName,
            user_type: 'employee',
            store_id: store!.id,
          },
        },
      });

      if (signUpError) {
        // Clean up the store_employees record on sign-up failure
        await supabase
          .from('store_employees')
          .delete()
          .eq('store_id', store!.id)
          .eq('email', newEmployeeEmail.toLowerCase())
          .is('user_id', null);
        throw signUpError;
      }

      toast({
        title: t('success') || 'Success',
        description: t('employeeAccountCreated') || `Employee account created for ${newEmployeeName}. They can now login using their email and the password you provided.`,
      });

      // Reset form
      setNewEmployeeEmail('');
      setNewEmployeePassword('');
      setNewEmployeeName('');
      setAddEmployeeOpen(false);

      // Refresh employee list
      queryClient.invalidateQueries({ queryKey: ['store-employees'] });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: t('error') || 'Error',
        description: error.message || t('failedToCreateEmployee') || 'Failed to create employee account',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  // Update employee permissions
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, permission, value }: { userId: string; permission: string; value: boolean }) => {
      const { error } = await supabase
        .from('permissions')
        .update({ [permission]: value })
        .eq('user_id', userId);
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['store-employees'] });
      invalidatePermissionsCache(userId);
      toast({
        title: t('success') || 'Success',
        description: t('permissionsUpdated') || 'Permissions updated',
      });
    },
    onError: () => {
      toast({
        title: t('error') || 'Error',
        description: t('failedToUpdatePermissions') || 'Failed to update permissions',
        variant: 'destructive',
      });
    },
  });

  // Remove employee
  const removeEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('store_employees')
        .delete()
        .eq('id', employeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-employees'] });
      toast({
        title: t('success') || 'Success',
        description: t('employeeRemoved') || 'Employee removed',
      });
    },
    onError: () => {
      toast({
        title: t('error') || 'Error',
        description: t('failedToRemoveEmployee') || 'Failed to remove employee',
        variant: 'destructive',
      });
    },
  });

  // Redirect non-owners
  if (!user) {
    return <div>{t('pleaseLoginToAccess') || 'Please log in'}</div>;
  }

  if (!isOwner) {
    return <Navigate to="/my-status" replace />;
  }

  const permissionsList = [
    { id: 'can_manage_products', label: t('manageProducts') || 'Products' },
    { id: 'can_manage_clients', label: t('manageClients') || 'Clients' },
    { id: 'can_manage_receipts', label: t('manageReceipts') || 'Receipts' },
    { id: 'can_view_financial', label: t('viewFinancial') || 'Financial' },
    { id: 'can_manage_purchases', label: t('managePurchases') || 'Purchases' },
    { id: 'can_access_dashboard', label: t('accessDashboard') || 'Dashboard' },
    { id: 'can_manage_invoices', label: t('manageInvoices') || 'Invoices' },
    { id: 'can_access_appointments', label: t('accessAppointments') || 'Appointments' },
  ];

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full max-w-none animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('teamManagement') || 'Team Management'}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">{t('manageEmployeeAccounts') || 'Add employees and manage their permissions'}</p>
        </div>
        <Button
          onClick={() => setAddEmployeeOpen(true)}
          className="h-12 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold shadow-lg shadow-teal-500/25 transition-all active:scale-95"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t('addEmployee') || 'Add Employee'}
        </Button>
      </div>

      {/* Store Info */}
      <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('yourStore') || 'Your Store'}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{store?.name || subscription?.store_name || 'My Store'}</h3>
            </div>
            <div className="ml-auto">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-xs">
                {employees.length} {employees.length === 1 ? (t('employee') || 'Employee') : (t('employees') || 'Employees')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      {employeesLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-700">{t('noEmployeesYet') || 'No employees yet'}</h3>
            <p className="text-sm text-slate-500 mt-2">{t('addFirstEmployee') || 'Add your first employee to start managing your team'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {employees.map((employee) => (
            <Card key={employee.id} className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
              <CardHeader className="border-b border-slate-100/60 pb-4 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                      {employee.display_name?.[0]?.toUpperCase() || employee.email[0]?.toUpperCase() || 'E'}
                    </div>
                    <div>
                      <CardTitle className="text-base font-black text-slate-900">
                        {employee.display_name || employee.email}
                      </CardTitle>
                      <CardDescription className="text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${employee.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                      {employee.status === 'active' ? (t('active') || 'Active') : (t('suspended') || 'Suspended')}
                    </Badge>
                    {!employee.user_id && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {t('pendingVerification') || 'Pending Verification'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(t('confirmRemoveEmployee') || `Are you sure you want to remove ${employee.display_name || employee.email}?`)) {
                          removeEmployeeMutation.mutate(employee.id);
                        }
                      }}
                      className="h-9 w-9 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-6 px-6 md:px-8">
                {employee.permissions ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {permissionsList.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:border-teal-300 hover:shadow-md transition-all group"
                      >
                        <Label
                          htmlFor={`${employee.id}-${perm.id}`}
                          className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-teal-700 transition-colors"
                        >
                          {perm.label}
                        </Label>
                        <Switch
                          id={`${employee.id}-${perm.id}`}
                          checked={!!employee.permissions[perm.id as keyof typeof employee.permissions]}
                          onCheckedChange={(checked) =>
                            updatePermissionMutation.mutate({
                              userId: employee.user_id!,
                              permission: perm.id,
                              value: checked,
                            })
                          }
                          className="data-[state=checked]:bg-teal-500"
                          disabled={!employee.user_id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">
                    {t('permissionsAvailableAfterVerification') || 'Permissions will be available once the employee verifies their email'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] border-slate-200/50 shadow-3xl bg-white/95 backdrop-blur-xl p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <DialogHeader className="relative z-10">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-teal-100">
              <UserPlus className="h-6 w-6 text-teal-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {t('addEmployee') || 'Add Employee'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              {t('addEmployeeDescription') || 'Create an account for your employee. They will receive an email verification.'}
            </DialogDescription>
          </DialogHeader>
          <div className="relative z-10 space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="emp-name" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {t('fullName') || 'Full Name'} *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="emp-name"
                  placeholder={t('fullNamePlaceholder') || 'Employee full name'}
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="h-12 pl-10 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {t('emailAddress') || 'Email Address'} *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="emp-email"
                  type="email"
                  placeholder={t('enterEmailPlaceholder') || 'employee@email.com'}
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  className="h-12 pl-10 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-password" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {t('temporaryPassword') || 'Temporary Password'} *
              </Label>
              <div className="relative">
                <Input
                  id="emp-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('createStrongPasswordPlaceholder') || 'Create a temporary password'}
                  value={newEmployeePassword}
                  onChange={(e) => setNewEmployeePassword(e.target.value)}
                  className="h-12 pr-12 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {t('passwordMinLength') || 'Minimum 6 characters. Share this password with the employee.'}
              </p>
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                onClick={() => setAddEmployeeOpen(false)}
                disabled={isCreatingEmployee}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                onClick={handleCreateEmployee}
                disabled={isCreatingEmployee}
              >
                {isCreatingEmployee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('creating') || 'Creating...'}</span>
                  </div>
                ) : (
                  <span>{t('createAccount') || 'Create Account'}</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Access;