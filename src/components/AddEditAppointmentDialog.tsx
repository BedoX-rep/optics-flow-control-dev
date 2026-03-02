import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from './LanguageProvider';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, Search, X, Calendar, Clock, FileText, ChevronRight, Eye } from 'lucide-react';
import { Appointment, Client } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
            <DialogContent className="sm:max-w-[540px] rounded-[2.5rem] border-none shadow-2xl bg-[#E2E2DE] p-0 overflow-y-auto max-h-[96vh] custom-scrollbar">
                {/* Background Watermark Icons */}

                <div className="absolute top-24 right-4 opacity-[0.05] pointer-events-none rotate-12">
                    <Eye size={120} strokeWidth={1} />
                </div>

                <DialogHeader className="p-6 pb-6 bg-gradient-to-b from-[#063D31] to-[#042F26] text-white relative rounded-b-[2.5rem] shadow-xl">
                    <button
                        onClick={onClose}
                        className="absolute right-8 top-8 text-teal-200/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex flex-col items-center text-center space-y-2">
                        <DialogTitle className="text-2xl font-black tracking-[0.2em] uppercase leading-none">
                            {isEditing ? t('editAppointment') : t('newAppointment')}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {isEditing ? 'Update existing eye exam appointment details' : 'Schedule a new eye exam for a client'}
                        </DialogDescription>
                        <p className="text-teal-50/70 text-xs font-medium tracking-wide">
                            {isEditing ? t('updateAppointmentDetails') : t('scheduleNewEyeExam')}
                        </p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5 relative z-10 flex-1 flex flex-col">
                    {/* Client Selection Mode Toggle */}
                    {!isEditing && (
                        <div className="bg-[#B5B5B2] p-1.5 rounded-[2rem] shadow-inner flex gap-1 mx-auto max-w-md">
                            <button
                                type="button"
                                onClick={() => { setSelectionMode('existing'); setClientId(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${selectionMode === 'existing' ? 'bg-[#063D31] text-white shadow-xl translate-y-[-1px]' : 'text-slate-100 hover:text-white'}`}
                            >
                                <Users className="h-4 w-4" />
                                {t('selectExistingClient')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectionMode('manual');
                                    setClientId(null);
                                    if (clientSearch && !clientName) setClientName(clientSearch);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${selectionMode === 'manual' ? 'bg-[#063D31] text-white shadow-xl translate-y-[-1px]' : 'text-slate-100 hover:text-white'}`}
                            >
                                <UserPlus className="h-4 w-4" />
                                {t('manualEntry')}
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Client Info Section */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1">{t('clientInformation')}</Label>

                            {selectionMode === 'existing' && !isEditing ? (
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8E8E8A] transition-colors group-focus-within:text-[#063D31]" />
                                    <Input
                                        placeholder={t('clientSearchPlaceholder')}
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                            if (clientId) setClientId(null);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                        className="pl-12 h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-slate-800 font-medium text-base placeholder:text-[#AAA]"
                                    />
                                    {showClientDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#E2E2DE] border border-black/5 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 backdrop-blur-md">
                                            {!clientSearch && (
                                                <div className="px-5 py-3 border-b border-black/5">
                                                    <p className="text-[10px] font-black text-[#8E8E8A] uppercase tracking-widest">{t('recentlyAddedClients')}</p>
                                                </div>
                                            )}
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectClient(c)}
                                                        className="w-full text-left px-5 py-4 hover:bg-[#063D31]/5 transition-colors border-b border-black/5 last:border-0 flex items-center justify-between group/item"
                                                    >
                                                        <div>
                                                            <p className="font-black text-slate-900 text-base">{c.name}</p>
                                                            {c.phone && <p className="text-xs text-[#8E8E8A] font-bold mt-0.5">{c.phone}</p>}
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-[#AAA] group-hover/item:translate-x-1 transition-transform" />
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-6 text-center">
                                                    <p className="text-sm text-[#8E8E8A] font-bold">{t('noClientsFound')}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {clientId && (
                                        <div className="mt-4 bg-[#063D31]/5 rounded-[1.5rem] p-5 flex items-center justify-between border border-[#063D31]/10 animate-in slide-in-from-top-2">
                                            <div>
                                                <p className="text-sm font-black text-[#063D31] uppercase tracking-wider">{clientName}</p>
                                                <p className="text-xs text-[#063D31]/60 font-bold mt-0.5">{clientPhone || t('noPhone')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setClientId(null); setClientName(''); }}
                                                className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#CC4B4B] hover:bg-[#CC4B4B] hover:text-white transition-all shadow-sm"
                                            >
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
                                        className="h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-base font-black text-slate-800"
                                        required
                                    />
                                    <Input
                                        placeholder={t('phone')}
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        className="h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-base font-bold text-slate-800"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Date & Time Section */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1">{t('appointmentDate')}</Label>
                                <div className="relative group">
                                    <Input
                                        type="date"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                        className="h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-base font-black text-slate-800 pr-10 appearance-none"
                                        required
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E8A] pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1">{t('appointmentTime')}</Label>
                                <div className="relative group">
                                    <Input
                                        type="time"
                                        value={appointmentTime}
                                        onChange={(e) => setAppointmentTime(e.target.value)}
                                        className="h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-base font-black text-slate-800 pr-10 appearance-none"
                                        required
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E8A] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1">{t('appointmentNotes')}</Label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full min-h-[80px] rounded-[1rem] border-none bg-black/[0.04] p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#063D31]/10 transition-all text-sm font-bold text-slate-700 placeholder:text-[#AAA] shadow-inner"
                                placeholder={t('addSpecialInstructions')}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl font-black uppercase text-xs tracking-[0.2em] text-[#063D31] hover:translate-y-[-2px] transition-all border-b-2 border-[#063D31]"
                        >
                            {t('cancel')}
                        </button>
                        <Button
                            type="submit"
                            disabled={isSaving || !clientName.trim()}
                            className={cn(
                                "px-8 h-12 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl transition-all duration-500 active:scale-95 flex items-center gap-2 border-none",
                                (isSaving || !clientName.trim())
                                    ? "bg-gradient-to-br from-[#8E8E8A] to-[#63635F] text-slate-900 opacity-50 cursor-not-allowed"
                                    : "bg-gradient-to-br from-[#063D31] to-[#042F26] text-white hover:shadow-teal-900/40 hover:translate-y-[-2px]"
                            )}
                        >
                            {isSaving ? (
                                <div className="h-5 w-5 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isEditing ? t('update') : t('create')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditAppointmentDialog;
