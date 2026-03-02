import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '@/integrations/supabase/types';
import AddEditAppointmentDialog from '@/components/AddEditAppointmentDialog';
import FinalizeAppointmentDialog from '@/components/FinalizeAppointmentDialog';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import {
    CalendarDays,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Filter,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import AppointmentCard from '@/components/AppointmentCard';
import DateRangeFilter from '@/components/ui/DateRangeFilter';

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; ringColor: string }> = {
    'Scheduled': { color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', ringColor: 'ring-teal-500/5' },
    'Confirmation': { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', ringColor: 'ring-blue-500/5' },
    'Finished': { color: 'text-white', bgColor: 'bg-slate-900', borderColor: 'border-slate-800', ringColor: 'ring-slate-900/10' },
    'Cancelled': { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', ringColor: 'ring-red-500/5' },
    'Expired': { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', ringColor: 'ring-amber-500/5' },
};

const Appointments = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();

    const [dateFilter, setDateFilter] = useState('all');
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Calculate start and end dates based on filter
    const activeRange = useMemo(() => {
        if (dateFilter === 'custom' && dateRange.from) {
            return {
                start: format(dateRange.from, 'yyyy-MM-dd'),
                end: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd')
            };
        }

        const now = new Date();
        if (dateFilter === 'today') {
            const d = format(now, 'yyyy-MM-dd');
            return { start: d, end: d };
        }
        if (dateFilter === 'month') {
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
        }
        if (dateFilter === 'year') {
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear(), 11, 31);
            return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
        }
        if (dateFilter === 'all') {
            return { start: '1900-01-01', end: '2100-12-31' };
        }

        // Default to 'week' (current week)
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    }, [dateFilter, dateRange]);

    // Dialog states
    const [addEditOpen, setAddEditOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [finalizeOpen, setFinalizeOpen] = useState(false);
    const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

    // Fetch appointments
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', user?.id, activeRange.start, activeRange.end],
        queryFn: async () => {
            if (!user?.id) return [];
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('is_deleted', false)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true });

            if (activeRange.start === activeRange.end) {
                query = query.eq('appointment_date', activeRange.start);
            } else {
                query = query.gte('appointment_date', activeRange.start)
                    .lte('appointment_date', activeRange.end);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Appointment[];
        },
        enabled: !!user?.id,
    });

    // Filtered appointments
    const filteredAppointments = useMemo(() => {
        if (!appointments) return [];

        const now = new Date();
        const processedAppointments = appointments.map(appt => {
            if (appt.status === 'Scheduled' || appt.status === 'Confirmation') {
                const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
                if (apptDateTime < now) {
                    return { ...appt, status: 'Expired' };
                }
            }
            return appt;
        });

        const filtered = processedAppointments.filter(appt => {
            const matchesSearch = !searchQuery ||
                appt.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (appt.client_phone && appt.client_phone.includes(searchQuery));
            const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        // Ensure Finished are at the bottom, otherwise recent date first (if they didn't specify, descending makes sense, but the supabase API does ascending. 
        // "Still filtered by the most recent date" -> Let's keep original order (which is ascending from DB) but push Finished to the bottom.
        return filtered.sort((a, b) => {
            if (a.status === 'Finished' && b.status !== 'Finished') return 1;
            if (a.status !== 'Finished' && b.status === 'Finished') return -1;

            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`).getTime();
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`).getTime();
            return dateA - dateB;
        });
    }, [appointments, searchQuery, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        if (!appointments) return { total: 0, scheduled: 0, finished: 0, upcomingToday: 0, upcomingThisWeek: 0 };

        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        return {
            total: appointments.length,
            scheduled: appointments.filter(a => a.status === 'Scheduled').length,
            finished: appointments.filter(a => a.status === 'Finished').length,
            appointmentsToday: appointments.filter(a => a.appointment_date === todayStr).length,
            upcomingToday: appointments.filter(a =>
                a.appointment_date === todayStr &&
                (a.status === 'Scheduled' || a.status === 'Confirmation')
            ).length,
            upcomingThisWeek: appointments.filter(a => {
                const apptDate = new Date(a.appointment_date + 'T00:00:00');
                return apptDate >= weekStart &&
                    apptDate <= weekEnd &&
                    (a.status === 'Scheduled' || a.status === 'Confirmation');
            }).length,
        };
    }, [appointments]);

    // Mutations (Create, Update, Finalize, Delete)
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.from('appointments').insert({
                ...data,
                user_id: user?.id,
                is_deleted: false,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setAddEditOpen(false);
            toast({ title: t('success'), description: t('appointmentCreated') });
        },
        onError: () => {
            toast({ title: t('error'), description: t('failedToCreateAppointment'), variant: 'destructive' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase.from('appointments').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setAddEditOpen(false);
            setEditingAppointment(null);
            toast({ title: t('success'), description: t('appointmentUpdated') });
        },
        onError: () => {
            toast({ title: t('error'), description: t('failedToUpdateAppointment'), variant: 'destructive' });
        },
    });

    const finalizeMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const { error } = await supabase.from('appointments').update({
                ...data,
                status: 'Finished',
            }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setFinalizeOpen(false);
            setFinalizingAppointment(null);
            toast({ title: t('success'), description: t('appointmentFinalized') });
        },
        onError: () => {
            toast({ title: t('error'), description: t('failedToUpdateAppointment'), variant: 'destructive' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('appointments').update({ is_deleted: true }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setDeleteOpen(false);
            setDeletingAppointment(null);
            toast({ title: t('success'), description: t('appointmentDeleted') });
        },
        onError: () => {
            toast({ title: t('error'), description: t('failedToDeleteAppointment'), variant: 'destructive' });
        },
    });

    const handleSave = (data: any) => {
        if (editingAppointment) {
            updateMutation.mutate({ id: editingAppointment.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleFinalize = (data: any) => {
        if (finalizingAppointment) {
            finalizeMutation.mutate({ id: finalizingAppointment.id, data });
        }
    };

    const handleStatusChange = (appt: Appointment, newStatus: string) => {
        const data: any = { status: newStatus };
        if (newStatus === 'Confirmation') {
            data.confirmation_date = format(new Date(), 'yyyy-MM-dd');
        } else if (newStatus === 'Scheduled') {
            data.confirmation_date = null;
        }
        updateMutation.mutate({ id: appt.id, data });
    };

    const handleConvertToClient = async (appt: Appointment) => {
        if (!user?.id) return;

        try {
            const { data: newClient, error } = await supabase
                .from('clients')
                .insert({
                    name: appt.client_name,
                    phone: appt.client_phone || '',
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Link appointment to new client
            await supabase
                .from('appointments')
                .update({ client_id: newClient.id })
                .eq('id', appt.id);

            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast({ title: t('success'), description: t('clientConverted') });
        } catch (error) {
            toast({ title: t('error'), description: t('failedToCreateClient'), variant: 'destructive' });
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-10 pt-6 w-full animate-fade-in pb-20">
            {/* Header Section - More Compact & Horizontal */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-6 md:p-8 text-white shadow-2xl shadow-teal-900/40">
                {/* Abstract Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"
                />

                <div className="relative z-10">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                                    <CalendarDays className="h-6 w-6 text-teal-400" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tighter leading-none text-white uppercase">
                                    {t('appointmentsOverview')}
                                </h1>
                            </div>

                            <div className="hidden md:block h-10 w-px bg-white/10" />

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                {[
                                    { label: t('total'), value: stats.total, color: 'text-white', action: () => { setDateFilter('all'); setStatusFilter('All'); } },
                                    { label: t('appointmentsToday') || 'Appointments Today', value: stats.appointmentsToday, color: 'text-blue-400', action: () => { setDateFilter('today'); setStatusFilter('All'); } },
                                    { label: t('upcomingThisWeek'), value: stats.upcomingThisWeek, color: 'text-teal-400', action: () => { setDateFilter('week'); setStatusFilter('All'); } },
                                    { label: t('finished'), value: stats.finished, color: 'text-emerald-400', action: () => { setDateFilter('all'); setStatusFilter('Finished'); } },
                                ].map((stat, i) => (
                                    <button
                                        key={i}
                                        onClick={stat.action}
                                        className="flex flex-col text-left hover:scale-105 transition-transform group/stat"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-hover/stat:text-white/60 mb-1 leading-none transition-colors">{stat.label}</span>
                                        <span className={`text-xl md:text-2xl font-black ${stat.color} leading-none`}>{stat.value}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => { setEditingAppointment(null); setAddEditOpen(true); }}
                            className="bg-teal-500 hover:bg-teal-400 text-white font-black rounded-2xl h-12 px-8 shadow-xl shadow-teal-500/20 group/btn transition-all duration-300 w-fit"
                        >
                            <Plus className="h-4 w-4 mr-2 group-hover/btn:rotate-90 transition-transform" />
                            {t('newAppointment')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Unified Filter Hub - Purchases Style */}
            <div className="relative -mt-10 mb-8 p-3 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/40 z-30">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search Section */}
                    <div className="flex items-center flex-1 min-w-[280px] px-5 py-3 bg-slate-50/50 shadow-inner rounded-2xl border border-slate-100/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all group">
                        <Search className="h-5 w-5 text-teal-600 mr-3 transition-transform group-focus-within:scale-110" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('searchAppointments')}
                            className="bg-transparent border-none text-sm font-black text-slate-700 focus:ring-0 w-full outline-none placeholder:text-slate-400/70"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="hidden lg:block h-10 w-px bg-slate-200/60" />

                    {/* Filters Section */}
                    <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                        {/* Date Filter Component - EXACT Style as Purchases */}
                        <DateRangeFilter
                            dateFilter={dateFilter}
                            dateRange={dateRange}
                            onFilterChange={(key, value) => {
                                if (key === 'date') setDateFilter(value);
                                else if (key === 'dateRange') setDateRange(value);
                            }}
                            accentColor="teal"
                        />

                        {/* Status Filter Select - Redesigned Label */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 w-[200px] border border-slate-100 shadow-sm rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest bg-slate-50/50 hover:bg-white transition-all text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-emerald-600" />
                                    <span>{statusFilter === 'All' ? t('appointmentStatusFilter') || 'Appointment Status' : t(statusFilter === 'Confirmation' ? 'confirmed' : statusFilter.toLowerCase())}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                                <SelectItem value="All">{t('appointmentStatusFilter') || 'Appointment Status'}</SelectItem>
                                <SelectItem value="Scheduled">{t('scheduled')}</SelectItem>
                                <SelectItem value="Confirmation">{t('confirmed')}</SelectItem>
                                <SelectItem value="Finished">{t('finished')}</SelectItem>
                                <SelectItem value="Cancelled">{t('cancelled')}</SelectItem>
                                <SelectItem value="Expired">{t('expired') || 'Expired'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center p-12 bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200/60">
                        <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold">{t('noAppointmentsFound')}</p>
                        <Button
                            onClick={() => { setEditingAppointment(null); setAddEditOpen(true); }}
                            className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('newAppointment')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredAppointments.map((appt, index) => (
                                <AppointmentCard
                                    key={appt.id}
                                    appointment={appt}
                                    index={index}
                                    statusConfig={statusConfig}
                                    isMobile={isMobile}
                                    onFinalize={(a) => { setFinalizingAppointment(a); setFinalizeOpen(true); }}
                                    onEdit={(a) => { setEditingAppointment(a); setAddEditOpen(true); }}
                                    onDelete={(a) => { setDeletingAppointment(a); setDeleteOpen(true); }}
                                    onStatusChange={handleStatusChange}
                                    onConvertToClient={handleConvertToClient}
                                    onUpdateResults={(appt, data) => updateMutation.mutate({ id: appt.id, data })}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <AddEditAppointmentDialog
                isOpen={addEditOpen}
                onClose={() => { setAddEditOpen(false); setEditingAppointment(null); }}
                onSave={handleSave}
                appointment={editingAppointment}
                isSaving={createMutation.isPending || updateMutation.isPending}
            />

            <FinalizeAppointmentDialog
                isOpen={finalizeOpen}
                onClose={() => { setFinalizeOpen(false); setFinalizingAppointment(null); }}
                onFinalize={handleFinalize}
                appointment={finalizingAppointment}
                isSaving={finalizeMutation.isPending}
            />

            <DeleteConfirmationDialog
                isOpen={deleteOpen}
                onClose={() => { setDeleteOpen(false); setDeletingAppointment(null); }}
                onConfirm={() => deletingAppointment && deleteMutation.mutate(deletingAppointment.id)}
                title={t('deleteAppointment')}
                message={t('confirmDeleteAppointment')}
            />
        </div>
    );
};

export default Appointments;
