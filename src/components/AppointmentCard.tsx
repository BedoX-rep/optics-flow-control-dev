import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Phone,
    User,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    Play,
    XCircle,
    Calendar,
    Plus,
    Save,
    X,
    AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/integrations/supabase/types';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ViewResultsDialog from './ViewResultsDialog';

interface AppointmentCardProps {
    appointment: Appointment;
    index: number;
    statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; ringColor: string }>;
    isMobile: boolean;
    onFinalize: (appt: Appointment) => void;
    onEdit: (appt: Appointment) => void;
    onDelete: (appt: Appointment) => void;
    onStatusChange: (appt: Appointment, status: string) => void;
    onConvertToClient: (appt: Appointment) => void;
    onUpdateResults?: (appt: Appointment, data: any) => void;
}

const AppointmentCard = forwardRef<HTMLDivElement, AppointmentCardProps>(({
    appointment: appt,
    index,
    statusConfig,
    isMobile,
    onFinalize,
    onEdit,
    onDelete,
    onStatusChange,
    onConvertToClient,
    onUpdateResults,
}, ref) => {
    const { t } = useLanguage();
    const sc = statusConfig[appt.status] || statusConfig['Scheduled'];
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

    const nameInitial = appt.client_name ? appt.client_name.charAt(0).toUpperCase() : '?';

    const isCancelled = appt.status === 'Cancelled';
    const isFinished = appt.status === 'Finished';
    const isConfirmed = appt.status === 'Confirmation';
    const isExpired = appt.status === 'Expired';

    // Status colors for the left indicator bar
    const indicatorColor = isCancelled ? 'bg-red-500' : isFinished ? 'bg-slate-900' : isExpired ? 'bg-amber-500' : isConfirmed ? 'bg-blue-500' : 'bg-teal-500';

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
            className="group relative h-[420px]"
        >
            <div className={cn(
                "relative h-full flex flex-col bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden pl-2",
                "hover:border-slate-300"
            )}>
                {/* Status Indicator Bar (Left side) */}
                <div className={cn("absolute top-0 left-0 w-2 h-full", indicatorColor)} />

                <div className="p-7 flex-1 flex flex-col overflow-hidden">
                    {/* Header: Date + Time/Status on Right + Action Buttons */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex flex-col gap-2.5">
                            <div className="bg-slate-950 text-white px-4 py-2.5 rounded-[1.25rem] text-[12px] font-black uppercase tracking-[0.1em] w-fit shadow-xl shadow-slate-900/20 border-b-4 border-teal-500 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-teal-400" />
                                {format(new Date(appt.appointment_date + 'T00:00:00'), 'EEEE, MMM d')}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 font-black text-base pl-2">
                                <Clock className="h-5 w-5 text-teal-500" />
                                <span className="tracking-tighter">{appt.appointment_time?.slice(0, 5)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 relative z-10">
                            {/* Top Right Action Buttons */}
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <button
                                    onClick={() => onStatusChange(appt, 'Cancelled')}
                                    className="text-slate-400 hover:text-rose-600 transition-all p-2 bg-white rounded-xl hover:bg-rose-50 border border-slate-100 shadow-sm active:scale-90"
                                    title={t('cancelled')}
                                >
                                    <X size={16} />
                                </button>
                                <button onClick={() => onEdit(appt)} className="text-slate-500 hover:text-slate-950 transition-all p-2 bg-white rounded-xl hover:bg-slate-50 border border-slate-100 shadow-sm active:scale-90">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => onDelete(appt)} className="text-slate-400 hover:text-rose-600 transition-all p-2 bg-white rounded-xl hover:bg-rose-50 border border-slate-100 shadow-sm active:scale-90">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <Badge className={cn(
                                "border font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-xl shadow-sm",
                                isFinished ? "bg-slate-100 text-slate-800 border-slate-200" : cn(sc.bgColor, sc.color, sc.borderColor)
                            )}>
                                {t(appt.status === 'Confirmation' ? 'confirmed' : (appt.status.toLowerCase() === 'scheduled' ? 'scheduled' : appt.status.toLowerCase()))}
                            </Badge>

                            {!appt.client_id && !isFinished && (
                                <button
                                    onClick={() => onConvertToClient(appt)}
                                    className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-600 flex items-center gap-1.5 transition-colors bg-amber-50 px-2 py-1 rounded-lg mt-1"
                                >
                                    <Plus className="h-3 w-3" />
                                    {t('convertToClient')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Client Identity & Summary */}
                    <div className="flex items-center gap-5 mb-6">
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-all group-hover:bg-slate-50",
                            isFinished ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-teal-50/30 border-teal-100 text-teal-600"
                        )}>
                            {nameInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-black text-slate-900 text-xl truncate uppercase tracking-tighter leading-tight">
                                {appt.client_name}
                            </h3>
                            {appt.client_phone && (
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1">
                                    <Phone className="h-3.5 w-3.5 text-teal-500/60" /> {appt.client_phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 relative z-0">
                        {/* Scrollable Notes/Results */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4">
                            {isFinished ? (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{t('optician')}</span>
                                            <p className="text-sm font-black text-slate-700 truncate">{appt.examiner_name || t('notSpecified')}</p>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setIsResultsDialogOpen(true)}
                                                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-teal-500 text-white hover:bg-teal-400 border-none rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-2" />
                                                {t('viewresults')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                appt.notes && (
                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 group/notes hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                                            <Edit size={10} className="opacity-50" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Notes</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed font-bold italic">
                                            "{appt.notes}"
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Fixed Status/Alert Section */}
                        {!isFinished && !isCancelled && !isExpired && (
                            <div className="mt-auto space-y-3">
                                {appt.confirmation_date ? (
                                    <div className="bg-blue-600 rounded-[1.25rem] p-3.5 text-white flex items-center justify-between border border-blue-400 shadow-xl shadow-blue-500/10">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest">{t('confirmationDate')}</span>
                                        </div>
                                        <span className="text-[11px] font-black">{format(new Date(appt.confirmation_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-amber-50 rounded-[1.25rem] p-4 border border-amber-100 flex items-center gap-4 shadow-sm"
                                    >
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-amber-100 flex items-center justify-center border-4 border-white shadow-sm">
                                            <AlertCircle className="h-5 w-5 text-amber-500 animate-pulse" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest truncate">
                                                {t('awaitingConfirmation')}
                                            </p>
                                            <p className="text-[9px] text-amber-700 font-bold opacity-70 truncate">
                                                {t('confirmationPendingDesc')}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Hub */}
                    <div className="mt-6 pt-5 border-t border-slate-100 relative z-10">
                        <div className="flex items-center gap-2">
                            {isFinished ? (
                                <div className="flex-1 flex gap-2">
                                    <div className="flex-1 h-12 rounded-xl bg-slate-900 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10">
                                        <CheckCircle className="h-4 w-4 text-emerald-400 font-bold" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{t('finished')}</span>
                                    </div>
                                </div>
                            ) : isExpired ? (
                                <div className="flex-1 flex gap-2 w-full">
                                    <Button
                                        onClick={() => onEdit(appt)}
                                        className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                    >
                                        <Clock className="h-4 w-4 mr-2" /> {t('reschedule') || 'Reschedule'}
                                    </Button>
                                    <Button
                                        onClick={() => onFinalize(appt)}
                                        className="flex-1 h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" /> {t('finalize')}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {!isCancelled ? (
                                        <>
                                            {!isConfirmed ? (
                                                <Button
                                                    onClick={() => onStatusChange(appt, 'Confirmation')}
                                                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" /> {t('confirmed')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onStatusChange(appt, 'Scheduled')}
                                                    className="flex-1 h-12 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                                >
                                                    {t('cancelConfirmation')}
                                                </Button>
                                            )}

                                            <Button
                                                onClick={() => onFinalize(appt)}
                                                className="flex-1 h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" /> {t('finalize')}
                                            </Button>

                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => onStatusChange(appt, 'Scheduled')}
                                            className="flex-1 h-12 rounded-xl bg-slate-900 text-white hover:bg-black text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/40"
                                        >
                                            <Play className="h-4 w-4 mr-2 text-slate-400" /> {t('restore')}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ViewResultsDialog
                isOpen={isResultsDialogOpen}
                onClose={() => setIsResultsDialogOpen(false)}
                appointment={appt}
                onSave={(data) => {
                    if (onUpdateResults) onUpdateResults(appt, data);
                    setIsResultsDialogOpen(false);
                }}
            />
        </motion.div >
    );
});

AppointmentCard.displayName = 'AppointmentCard';

export default AppointmentCard;
