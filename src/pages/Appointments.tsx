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
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import AppointmentCard from '@/components/AppointmentCard';

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
    'Scheduled': { color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    'In Progress': { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    'Finished': { color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    'Cancelled': { color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
};

const Appointments = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();

    const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Dialog states
    const [addEditOpen, setAddEditOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [finalizeOpen, setFinalizeOpen] = useState(false);
    const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

    // Calculate start and end dates based on viewMode
    const dateRange = useMemo(() => {
        const baseDate = new Date(selectedDate + 'T00:00:00');
        if (viewMode === 'today') {
            return {
                start: selectedDate,
                end: selectedDate
            };
        } else if (viewMode === 'week') {
            const start = startOfWeek(baseDate, { weekStartsOn: 1 });
            const end = endOfWeek(baseDate, { weekStartsOn: 1 });
            return {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd')
            };
        } else {
            const start = startOfMonth(baseDate);
            const end = endOfMonth(baseDate);
            return {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd')
            };
        }
    }, [selectedDate, viewMode]);

    // Generate week days around the selected date
    const weekDays = useMemo(() => {
        const date = new Date(selectedDate + 'T00:00:00');
        const start = startOfWeek(date, { weekStartsOn: 1 });

        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(format(addDays(start, i), 'yyyy-MM-dd'));
        }
        return days;
    }, [selectedDate]);

    // Fetch appointments
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', user?.id, dateRange.start, dateRange.end],
        queryFn: async () => {
            if (!user?.id) return [];
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_deleted', false)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true });

            if (dateRange.start === dateRange.end) {
                query = query.eq('appointment_date', dateRange.start);
            } else {
                query = query.gte('appointment_date', dateRange.start)
                    .lte('appointment_date', dateRange.end);
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
        return appointments.filter(appt => {
            const matchesSearch = !searchQuery ||
                appt.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (appt.client_phone && appt.client_phone.includes(searchQuery));
            const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [appointments, searchQuery, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        if (!appointments) return { total: 0, scheduled: 0, finished: 0 };
        return {
            total: appointments.length,
            scheduled: appointments.filter(a => a.status === 'Scheduled').length,
            finished: appointments.filter(a => a.status === 'Finished').length,
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

    const navigateWeek = (direction: number) => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() + direction * 7);
        setSelectedDate(format(d, 'yyyy-MM-dd'));
    };

    const goToToday = () => {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const formatDisplayDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-10 pt-6 w-full animate-fade-in pb-20">
            {/* Header Section */}
            <div className="relative group overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-6 md:p-10 text-white shadow-2xl shadow-teal-900/40">
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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-2">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-1">
                                    {t('appointmentsOverview')}
                                </h1>
                                <p className="text-teal-100/60 text-base font-medium max-w-md">
                                    {t('eyeExamAppointmentsDesc')}
                                </p>
                            </motion.div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => { setEditingAppointment(null); setAddEditOpen(true); }}
                                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl h-12 px-6 shadow-xl shadow-teal-500/20 group/btn transition-all duration-300"
                            >
                                <Plus className="h-4 w-4 mr-2 group-hover/btn:rotate-90 transition-transform" />
                                {t('newAppointment')}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Tiles */}
                    <div className="grid grid-cols-3 gap-3 mt-8 max-w-2xl">
                        {[
                            { label: t('todaysAppointments'), value: stats.total, color: 'text-white' },
                            { label: t('scheduled'), value: stats.scheduled, color: 'text-teal-400' },
                            { label: t('finished'), value: stats.finished, color: 'text-emerald-400' },
                        ].map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                key={i}
                                className="bg-white/5 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <p className={`text-3xl md:text-4xl font-black ${stat.color}`}>{stat.value}</p>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Strip Container - Overhauled */}
            <div className="relative -mt-12 px-2 z-20">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 shadow-2xl shadow-slate-200/50 p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                        <div className="flex items-center p-1 bg-slate-50 rounded-2xl border border-slate-100 w-full md:w-auto">
                            {[
                                { id: 'today', label: t('today') },
                                { id: 'week', label: t('thisWeek') },
                                { id: 'month', label: t('thisMonth') }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setViewMode(mode.id as any)}
                                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode.id
                                            ? 'bg-white shadow-sm text-teal-600'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate + 'T00:00:00');
                                        const newDate = viewMode === 'month' ? subDays(d, 30) : subDays(d, 7);
                                        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
                                    }}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-teal-600"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate + 'T00:00:00');
                                        const newDate = viewMode === 'month' ? addDays(d, 30) : addDays(d, 7);
                                        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
                                    }}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-teal-600"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-slate-900 font-black tracking-tight text-lg whitespace-nowrap">{formatDisplayDate(selectedDate)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 md:gap-4 h-24 md:h-28">
                        {weekDays.map((day) => {
                            const d = new Date(day + 'T00:00:00');
                            const isSelected = day === selectedDate;
                            const isToday = day === todayStr;
                            return (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    key={day}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative flex flex-col items-center justify-center rounded-3xl transition-all duration-300 ${isSelected
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/30'
                                        : isToday
                                            ? 'bg-teal-50 border-2 border-teal-500/30 text-teal-700'
                                            : 'bg-slate-50 border border-slate-100 text-slate-400 hover:bg-white hover:border-teal-200 hover:text-teal-600'
                                        }`}
                                >
                                    {isToday && !isSelected && (
                                        <div className="absolute top-2 w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-teal-300' : 'opacity-60'}`}>
                                        {dayNames[d.getDay()]}
                                    </span>
                                    <span className="text-xl md:text-2xl font-black mt-1 leading-none">{d.getDate()}</span>
                                    {isSelected && (
                                        <motion.div
                                            layoutId="indicator"
                                            className="absolute -bottom-1 w-12 h-1 bg-teal-400 rounded-full blur-[1px]"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50/50 p-2 rounded-3xl border border-slate-100">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchAppointments')}
                        className="pl-11 h-12 rounded-2xl border-transparent bg-white shadow-sm focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
                    {['All', 'Scheduled', 'In Progress', 'Finished', 'Cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === status
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                : 'text-slate-400 hover:text-teal-600'
                                }`}
                        >
                            {status === 'All' ? t('all') : t(status === 'In Progress' ? 'inProgress' : status.toLowerCase())}
                        </button>
                    ))}
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
                        <p className="text-slate-500 font-bold">{t('noAppointmentsForDay')}</p>
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
