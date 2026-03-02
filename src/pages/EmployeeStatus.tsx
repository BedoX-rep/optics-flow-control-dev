import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Shield, Package, Users, Receipt, DollarSign,
    ShoppingCart, LayoutDashboard, FileText, CalendarDays,
    Building, CheckCircle2, XCircle, Store
} from 'lucide-react';

const EmployeeStatus = () => {
    const { user, permissions, userRole, subscription } = useAuth();
    const { t } = useLanguage();

    // Fetch employee's store info
    const { data: storeInfo, isLoading: storeLoading } = useQuery({
        queryKey: ['employee-store-info', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data: employeeRecord, error: empError } = await supabase
                .from('store_employees')
                .select('*, stores:store_id(name, owner_id)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            if (empError) {
                console.error('Error fetching employee info:', empError);
                return null;
            }

            return employeeRecord;
        },
        enabled: !!user && userRole === 'employee',
    });

    const permissionItems = [
        { id: 'can_access_dashboard', label: t('accessDashboard') || 'Access Dashboard', icon: LayoutDashboard, color: 'teal' },
        { id: 'can_manage_products', label: t('manageProducts') || 'Manage Products', icon: Package, color: 'blue' },
        { id: 'can_manage_clients', label: t('manageClients') || 'Manage Clients', icon: Users, color: 'purple' },
        { id: 'can_manage_receipts', label: t('manageReceipts') || 'Manage Receipts', icon: Receipt, color: 'emerald' },
        { id: 'can_view_financial', label: t('viewFinancial') || 'View Financial', icon: DollarSign, color: 'amber' },
        { id: 'can_manage_purchases', label: t('managePurchases') || 'Manage Purchases', icon: ShoppingCart, color: 'orange' },
        { id: 'can_manage_invoices', label: t('manageInvoices') || 'Manage Invoices', icon: FileText, color: 'indigo' },
        { id: 'can_access_appointments', label: t('accessAppointments') || 'Access Appointments', icon: CalendarDays, color: 'rose' },
    ];

    const getColorClasses = (color: string, enabled: boolean) => {
        if (!enabled) return 'bg-slate-50 border-slate-200/60 text-slate-400';
        const colorMap: Record<string, string> = {
            teal: 'bg-teal-50 border-teal-200 text-teal-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700',
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            amber: 'bg-amber-50 border-amber-200 text-amber-700',
            orange: 'bg-orange-50 border-orange-200 text-orange-700',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            rose: 'bg-rose-50 border-rose-200 text-rose-700',
        };
        return colorMap[color] || 'bg-slate-50 border-slate-200 text-slate-700';
    };

    const getIconBgClasses = (color: string, enabled: boolean) => {
        if (!enabled) return 'bg-slate-200/50';
        const colorMap: Record<string, string> = {
            teal: 'bg-teal-500',
            blue: 'bg-blue-500',
            purple: 'bg-purple-500',
            emerald: 'bg-emerald-500',
            amber: 'bg-amber-500',
            orange: 'bg-orange-500',
            indigo: 'bg-indigo-500',
            rose: 'bg-rose-500',
        };
        return colorMap[color] || 'bg-slate-500';
    };

    // If the user is an owner, redirect info
    if (userRole === 'owner') {
        return (
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full max-w-none animate-fade-in">
                <div className="text-center py-12">
                    <Store className="h-12 w-12 text-teal-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900">{t('youAreStoreOwner') || 'You are a Store Owner'}</h2>
                    <p className="text-slate-500 mt-2">{t('ownersHaveFullAccess') || 'Store owners have full access to all features.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full max-w-none animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('myStatus') || 'My Status'}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">{t('viewYourPermissions') || 'View your role and permissions'}</p>
                </div>
            </div>

            {subscription && subscription.subscription_status.toLowerCase() !== 'active' && (
                <div className="bg-rose-50 border-2 border-rose-200/60 text-rose-700 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                    <XCircle className="h-6 w-6 mt-0.5 flex-shrink-0 text-rose-500" />
                    <div>
                        <h3 className="text-lg font-black tracking-tight">{t('storeSubscriptionExpired') || 'Store Subscription Expired'}</h3>
                        <p className="text-sm font-medium text-rose-600/90 mt-1">
                            {t('storeSubscriptionExpiredDesc') || 'Your store owner\'s subscription has expired. Access to the dashboard and operational features is currently restricted. Please contact your store owner to resolve this.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Role & Store Info Card */}
            <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
                <CardHeader className="border-b border-slate-100/60 pb-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                            <Shield className="h-5 w-5" />
                        </div>
                        {t('yourRole') || 'Your Role'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('role') || 'Role'}</p>
                            <div className="flex items-center gap-3">
                                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none text-sm font-bold px-4 py-1.5 rounded-full">
                                    {t('employee') || 'Employee'}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('store') || 'Store'}</p>
                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                                <Building className="h-4 w-4 text-teal-500" />
                                <p className="text-sm font-bold text-slate-800">
                                    {storeLoading ? (
                                        <span className="animate-pulse bg-slate-200 rounded h-4 w-24 inline-block" />
                                    ) : (
                                        (storeInfo as any)?.stores?.name || t('unknownStore') || 'Unknown Store'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('status') || 'Status'}</p>
                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                                <p className="text-sm font-bold text-emerald-700">
                                    {storeInfo?.status === 'active' ? (t('active') || 'Active') : (t('suspended') || 'Suspended')}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Permissions Card */}
            <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
                <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50">
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{t('yourPermissions') || 'Your Permissions'}</CardTitle>
                    <p className="text-sm font-medium text-slate-500 mt-1">{t('permissionsGrantedByOwner') || 'These permissions are managed by your store owner'}</p>
                </CardHeader>
                <CardContent className="pt-8 pb-8 px-6 md:px-8">
                    {!permissions ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {permissionItems.map((perm) => {
                                const enabled = !!permissions[perm.id as keyof typeof permissions];
                                const Icon = perm.icon;
                                return (
                                    <div
                                        key={perm.id}
                                        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${getColorClasses(perm.color, enabled)}`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${getIconBgClasses(perm.color, enabled)}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            {enabled ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-slate-300" />
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {perm.label}
                                        </p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${enabled ? 'text-emerald-600' : 'text-slate-300'}`}>
                                            {enabled ? (t('granted') || 'Granted') : (t('restricted') || 'Restricted')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeStatus;
