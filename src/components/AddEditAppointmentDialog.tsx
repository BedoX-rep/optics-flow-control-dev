import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from './LanguageProvider';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, User, Phone, FileText, Search, X, Save } from 'lucide-react';
import { Appointment, Client } from '@/integrations/supabase/types';

interface AddEditAppointmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    appointment?: Appointment | null;
    isSaving?: boolean;
}

import { format } from 'date-fns';

const AddEditAppointmentDialog = ({ isOpen, onClose, onSave, appointment, isSaving }: AddEditAppointmentDialogProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const isEditing = !!appointment;

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
                .order('name');
            if (error) throw error;
            return data as Pick<Client, 'id' | 'name' | 'phone'>[];
        },
        enabled: !!user && isOpen,
    });

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
            } else {
                setClientName('');
                setClientPhone('');
                setClientId(null);
                setAppointmentDate(format(new Date(), 'yyyy-MM-dd'));
                setAppointmentTime('09:00');
                setNotes('');
                setStatus('Scheduled');
            }
            setClientSearch('');
            setShowClientDropdown(false);
        }
    }, [isOpen, appointment]);

    const filteredClients = clients?.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.phone && c.phone.includes(clientSearch))
    ) || [];

    const handleSelectClient = (client: Pick<Client, 'id' | 'name' | 'phone'>) => {
        setClientName(client.name);
        setClientPhone(client.phone || '');
        setClientId(client.id);
        setClientSearch('');
        setShowClientDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName.trim() || !appointmentDate || !appointmentTime) return;

        onSave({
            client_name: clientName.trim(),
            client_phone: clientPhone.trim() || null,
            client_id: clientId,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            notes: notes.trim() || null,
            status,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px] rounded-3xl border-slate-200/60 shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-teal-500 to-teal-600">
                    <DialogTitle className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        {isEditing ? t('editAppointment') : t('newAppointment')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Client Selection */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <User className="h-3 w-3" /> {t('client')}
                        </Label>
                        <div className="relative">
                            <Input
                                value={showClientDropdown ? clientSearch : clientName}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setClientName(e.target.value);
                                    setClientId(null);
                                    setShowClientDropdown(true);
                                }}
                                onFocus={() => setShowClientDropdown(true)}
                                placeholder={t('selectClient')}
                                className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-11"
                                required
                            />
                            {showClientDropdown && filteredClients.length > 0 && (
                                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                    {filteredClients.slice(0, 8).map((client) => (
                                        <button
                                            key={client.id}
                                            type="button"
                                            onClick={() => handleSelectClient(client)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center justify-between transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        >
                                            <span className="font-semibold text-slate-800 text-sm">{client.name}</span>
                                            <span className="text-xs text-slate-400">{client.phone}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showClientDropdown && (
                                <button
                                    type="button"
                                    onClick={() => setShowClientDropdown(false)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {t('phone')}
                        </Label>
                        <Input
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="06XXXXXXXX"
                            className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-11"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarDays className="h-3 w-3" /> {t('appointmentDate')}
                            </Label>
                            <Input
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> {t('appointmentTime')}
                            </Label>
                            <Input
                                type="time"
                                value={appointmentTime}
                                onChange={(e) => setAppointmentTime(e.target.value)}
                                className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-11"
                                required
                            />
                        </div>
                    </div>

                    {/* Status (edit only) */}
                    {isEditing && appointment?.status !== 'Finished' && (
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                {t('appointmentStatus')}
                            </Label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 bg-white"
                            >
                                <option value="Scheduled">{t('scheduled')}</option>
                                <option value="In Progress">{t('inProgress')}</option>
                                <option value="Cancelled">{t('cancelled')}</option>
                            </select>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> {t('appointmentNotes')}
                        </Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('appointmentNotes')}
                            className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !clientName.trim() || !appointmentDate || !appointmentTime}
                            className="flex-1 h-11 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/20"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? '...' : (isEditing ? t('save') : t('newAppointment'))}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditAppointmentDialog;
