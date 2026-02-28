import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from './LanguageProvider';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Search, X, CalendarDays, Clock, FileText } from 'lucide-react';
import { Appointment, Client } from '@/integrations/supabase/types';
import { format } from 'date-fns';

interface AddEditAppointmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    appointment?: Appointment | null;
    isSaving?: boolean;
}

const AddEditAppointmentDialog = ({ isOpen, onClose, onSave, appointment, isSaving }: AddEditAppointmentDialogProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const isEditing = !!appointment;

    const [selectionMode, setSelectionMode] = useState<'existing' | 'manual'>('existing');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientId, setClientId] = useState<string | null>(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Scheduled');
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    // Fetch clients for autocomplete
    const { data: clients } = useQuery({
        queryKey: ['clients-for-appointment', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, phone')
                .eq('user_id', user?.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Pick<Client, 'id' | 'name' | 'phone'>[];
        },
        enabled: !!user && isOpen,
    });

    const filteredClients = useMemo(() => {
        if (!clients || !clientSearch) return clients?.slice(0, 5) || [];
        return clients.filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(clientSearch))
        ).slice(0, 5);
    }, [clients, clientSearch]);

    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                setClientName(appointment.client_name || '');
                setClientPhone(appointment.client_phone || '');
                setClientId(appointment.client_id || null);
                setAppointmentDate(appointment.appointment_date || '');
                setAppointmentTime(appointment.appointment_time || '');
                setNotes(appointment.notes || '');
                setStatus(appointment.status || 'Scheduled');
                setSelectionMode(appointment.client_id ? 'existing' : 'manual');
            } else {
                setClientName('');
                setClientPhone('');
                setClientId(null);
                setAppointmentDate(format(new Date(), 'yyyy-MM-dd'));
                setAppointmentTime('09:00');
                setNotes('');
                setStatus('Scheduled');
                setSelectionMode('existing');
            }
            setClientSearch('');
            setShowClientDropdown(false);
        }
    }, [isOpen, appointment]);

    const handleSelectClient = (client: Pick<Client, 'id' | 'name' | 'phone'>) => {
        setClientId(client.id);
        setClientName(client.name);
        setClientPhone(client.phone || '');
        setClientSearch('');
        setShowClientDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            client_id: selectionMode === 'existing' ? clientId : null,
            client_name: clientName,
            client_phone: clientPhone,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            notes,
            status,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-slate-200/60 shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-teal-600 to-emerald-600 text-white">
                    <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                        {isEditing ? t('editAppointment') : t('newAppointment')}
                    </DialogTitle>
                    <p className="text-white text-sm font-medium mt-1 opacity-90">
                        {isEditing ? t('updateAppointmentDetails') : t('scheduleNewEyeExam')}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Client Selection Mode Toggle */}
                    {!isEditing && (
                        <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 flex gap-1">
                            <button
                                type="button"
                                onClick={() => { setSelectionMode('existing'); setClientId(null); }}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectionMode === 'existing' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-900 hover:text-slate-600'}`}
                            >
                                <Users className="h-3 w-3 inline mr-2" />
                                {t('selectExistingClient')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectionMode('manual');
                                    setClientId(null);
                                    if (clientSearch && !clientName) setClientName(clientSearch);
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectionMode === 'manual' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-900 hover:text-slate-600'}`}
                            >
                                <UserPlus className="h-3 w-3 inline mr-2" />
                                {t('manualEntry')}
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Client Info Section */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">{t('clientInformation')}</Label>

                            {selectionMode === 'existing' && !isEditing ? (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900" />
                                    <Input
                                        placeholder={t('clientSearchPlaceholder')}
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                            if (clientId) setClientId(null);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        className="pl-10 h-12 rounded-2xl border-slate-200 focus:ring-teal-500/20"
                                    />
                                    {showClientDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                            {!clientSearch && (
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('recentlyAddedClients')}</p>
                                                </div>
                                            )}
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectClient(c)}
                                                        className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-black text-slate-900 text-sm">{c.name}</p>
                                                                {c.phone && <p className="text-[10px] text-slate-900 font-bold">{c.phone}</p>}
                                                            </div>
                                                            <Users className="h-3 w-3 text-slate-200" />
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center">
                                                    <p className="text-xs text-slate-900 font-bold">{t('noClientsFound')}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {clientId && (
                                        <div className="mt-3 bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black text-teal-800 uppercase tracking-tight">{clientName}</p>
                                                <p className="text-[10px] text-teal-600 font-bold">{clientPhone || t('noPhone')}</p>
                                            </div>
                                            <button type="button" onClick={() => { setClientId(null); setClientName(''); }} className="text-teal-400 hover:text-teal-600">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    <Input
                                        placeholder={t('clientName')}
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="h-12 rounded-2xl border-slate-200 focus:ring-teal-500/20 font-bold"
                                        required
                                    />
                                    <Input
                                        placeholder={t('phone')}
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        className="h-12 rounded-2xl border-slate-200 focus:ring-teal-500/20 font-bold"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Date & Time Section */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">{t('appointmentDate')}</Label>
                                <Input
                                    type="date"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 focus:ring-teal-500/20 font-mono text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">{t('appointmentTime')}</Label>
                                <Input
                                    type="time"
                                    value={appointmentTime}
                                    onChange={(e) => setAppointmentTime(e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 focus:ring-teal-500/20 font-mono text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">{t('appointmentNotes')}</Label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none text-sm font-medium text-slate-600 bg-white"
                                placeholder={t('addSpecialInstructions')}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-900 hover:text-slate-600"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !clientName.trim()}
                            className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white hover:bg-teal-600 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 transition-all"
                        >
                            {isSaving ? '...' : isEditing ? t('update') : t('create')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditAppointmentDialog;
