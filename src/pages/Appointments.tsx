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
import { format } from 'date-fns';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Dialog states
    const [addEditOpen, setAddEditOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [finalizeOpen, setFinalizeOpen] = useState(false);
    const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

    // Generate week days around the selected date
    const weekDays = useMemo(() => {
        const date = new Date(selectedDate + 'T00:00:00');
        const dayOfWeek = date.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(date);
        monday.setDate(date.getDate() + mondayOffset);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(format(d, 'yyyy-MM-dd'));
        }
        return days;
    }, [selectedDate]);

    // Fetch appointments
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', user?.id, selectedDate],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id)
                .eq('appointment_date', selectedDate)
                .eq('is_deleted', false)
                .order('appointment_time', { ascending: true });
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

    // Create appointment
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

    // Update appointment
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

    // Finalize appointment
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

    // Delete appointment (soft delete)
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
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-none animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-6 md:p-8 text-white shadow-xl shadow-teal-500/10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t('eyeExamAppointments')}</h1>
                            <p className="text-white/70 text-sm mt-1 font-medium">{t('eyeExamAppointmentsDesc')}</p>
                        </div>
                        <Button
                            onClick={() => { setEditingAppointment(null); setAddEditOpen(true); }}
                            className="bg-white text-teal-700 hover:bg-white/90 font-bold rounded-2xl px-6 h-11 shadow-lg shadow-black/10 shrink-0"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('newAppointment')}
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { label: t('todaysAppointments'), value: stats.total },
                            { label: t('scheduled'), value: stats.scheduled },
                            { label: t('finished'), value: stats.finished },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/10">
                                <p className="text-2xl md:text-3xl font-black">{stat.value}</p>
                                <p className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-wider mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Day Navigation Strip */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/40 p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => navigateWeek(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-200"
                    >
                        {t('today')}
                    </button>
                    <button onClick={() => navigateWeek(1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                    <p className="text-sm font-bold text-slate-600 ml-auto hidden md:block">{formatDisplayDate(selectedDate)}</p>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                        const d = new Date(day + 'T00:00:00');
                        const isSelected = day === selectedDate;
                        const isToday = day === todayStr;
                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(day)}
                                className={`flex flex-col items-center p-2 md:p-3 rounded-2xl transition-all duration-200 ${isSelected
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 scale-105'
                                    : isToday
                                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                        : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                    {dayNames[d.getDay()]}
                                </span>
                                <span className="text-lg font-black mt-0.5">{d.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchAppointments')}
                        className="pl-11 h-11 rounded-2xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 bg-white/80 backdrop-blur-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['All', 'Scheduled', 'In Progress', 'Finished', 'Cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === status
                                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                                }`}
                        >
                            {status === 'All' ? t('all') : t(status === 'In Progress' ? 'inProgress' : status.toLowerCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-3">
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
