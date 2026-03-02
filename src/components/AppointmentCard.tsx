import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
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
    X,
    AlertCircle,
    MoreVertical,
    Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/integrations/supabase/types';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ViewResultsDialog from './ViewResultsDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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
    const [showResultsDialog, setShowResultsDialog] = useState(false);

    const nameInitial = appt.client_name ? appt.client_name.charAt(0).toUpperCase() : '?';

    const isCancelled = appt.status === 'Cancelled';
    const isFinished = appt.status === 'Finished';
    const isConfirmed = appt.status === 'Confirmation';
    const isExpired = appt.status === 'Expired';

    const statusClasses = {
        'Scheduled': {
            card: "border-teal-100 shadow-teal-900/5",
            header: "bg-teal-50/50",
            accent: "teal",
            icon: "text-teal-600"
        },
        'Confirmation': {
            card: "border-blue-100 shadow-blue-900/5",
            header: "bg-blue-50/50",
            accent: "blue",
            icon: "text-blue-600"
        },
        'Finished': {
            card: "border-[#E5E7EB] shadow-sm bg-[#F9FAFB]",
            header: "bg-[#E5E7EB]/50",
            accent: "emerald",
            icon: "text-slate-500"
        },
        'Cancelled': {
            card: "border-rose-100 shadow-rose-900/5 grayscale-[0.5] opacity-80",
            header: "bg-rose-50/50",
            accent: "rose",
            icon: "text-rose-400"
        },
        'Expired': {
            card: "border-amber-100 shadow-amber-900/5",
            header: "bg-amber-50/50",
            accent: "amber",
            icon: "text-amber-500"
        }
    };

    const st = statusClasses[appt.status as keyof typeof statusClasses] || statusClasses['Scheduled'];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="h-full"
        >
            <div className={cn(
                "relative h-full flex flex-col rounded-[2.5rem] border shadow-md transition-all duration-300 overflow-hidden group/card",
                st.card,
                "hover:shadow-xl hover:translate-y-[-4px]"
            )}>

                {/* Status Header Area */}
                <div className={cn("px-6 py-4 flex items-center justify-between border-b transition-colors", st.header, "border-black/[0.03]")}>
                    <div className="flex items-center gap-3">
                        {isFinished ? (
                            <span className="text-sm font-black text-slate-700 tracking-tight">
                                {appt.appointment_time?.slice(0, 5)} • {format(new Date(appt.appointment_date + 'T00:00:00'), 'MMM d, yyyy')}
                            </span>
                        ) : (
                            <>
                                <div className={cn("p-2 rounded-xl bg-white shadow-sm", st.icon)}>
                                    <Clock size={16} strokeWidth={3} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-slate-800 tracking-tighter leading-none">
                                        {appt.appointment_time?.slice(0, 5)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {format(new Date(appt.appointment_date + 'T00:00:00'), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge className={cn(
                            "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest border shadow-none",
                            isFinished ? "bg-emerald-500 text-white border-emerald-500" :
                                isCancelled ? "bg-rose-100 text-rose-700 border-rose-200" :
                                    isConfirmed ? "bg-blue-100 text-blue-700 border-blue-200" :
                                        isExpired ? "bg-amber-100 text-amber-700 border-amber-200" :
                                            "bg-teal-100 text-teal-700 border-teal-200"
                        )}>
                            {t(appt.status === 'Confirmation' ? 'confirmed' : appt.status.toLowerCase())}
                        </Badge>

                        <div className="flex items-center gap-1">
                            {!isFinished && !isCancelled && (
                                <button
                                    onClick={() => onStatusChange(appt, 'Cancelled')}
                                    className="p-2 hover:bg-rose-100 rounded-xl text-rose-500 transition-colors focus:outline-none"
                                    title={t('cancel')}
                                >
                                    <X size={18} strokeWidth={3} />
                                </button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:bg-black/5 rounded-xl text-slate-400 transition-colors focus:outline-none">
                                        <MoreVertical size={18} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl p-2 min-w-[160px]">
                                    <DropdownMenuItem onClick={() => onEdit(appt)} className="rounded-xl px-4 py-3 gap-3 cursor-pointer">
                                        <Edit size={16} className="text-slate-400" />
                                        <span className="font-bold text-xs text-slate-700 uppercase tracking-widest">{t('edit')}</span>
                                    </DropdownMenuItem>
                                    {!isFinished && !isCancelled && (
                                        <DropdownMenuItem onClick={() => onStatusChange(appt, 'Cancelled')} className="rounded-xl px-4 py-3 gap-3 cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold">
                                            <XCircle size={16} />
                                            <span className="text-xs uppercase tracking-widest">{t('cancel')}</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                    <DropdownMenuItem onClick={() => onDelete(appt)} className="rounded-xl px-4 py-3 gap-3 cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold">
                                        <Trash2 size={16} />
                                        <span className="text-xs uppercase tracking-widest">{t('delete')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 flex flex-col gap-6">
                    {/* Client Identity */}
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "h-14 w-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl border-2 transition-all duration-300",
                            isFinished ? "bg-[#E5E7EB]/50 border-[#E5E7EB] text-slate-400" :
                                isCancelled ? "bg-rose-50 border-rose-100 text-rose-300" :
                                    "bg-white border-black/[0.03] text-slate-800 shadow-sm"
                        )}>
                            {nameInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={cn(
                                "font-black text-slate-900 text-xl truncate uppercase tracking-tighter leading-none mb-1.5",
                                isCancelled && "line-through opacity-50"
                            )}>
                                {appt.client_name}
                            </h3>
                            {appt.client_phone ? (
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 opacity-50" /> {appt.client_phone}
                                </p>
                            ) : (
                                !appt.client_id && !isFinished && !isCancelled && (
                                    <button
                                        onClick={() => onConvertToClient(appt)}
                                        className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        {t('convertToClient')}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Status Specific Detail */}
                    <div className="flex-1 flex flex-col justify-center">
                        {isFinished ? (
                            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{t('optician')}</span>
                                    <p className="text-sm font-black text-slate-700">{appt.examiner_name || t('notSpecified')}</p>
                                </div>
                                <Button
                                    onClick={() => setShowResultsDialog(true)}
                                    variant="ghost"
                                    className="p-2 h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400"
                                    title={t('viewresults')}
                                >
                                    <Eye className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : isCancelled ? (
                            <div className="text-center py-6 bg-rose-50/20 rounded-3xl border border-dashed border-rose-200">
                                <span className="text-sm font-black text-rose-300 uppercase tracking-[0.2em] italic">{t('appointmentCancelled')}</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appt.notes && (
                                    <div className="bg-slate-50/30 p-5 rounded-3xl border border-slate-100 text-sm text-slate-600 font-bold leading-relaxed italic border-l-4 border-l-teal-500/30">
                                        "{appt.notes}"
                                    </div>
                                )}

                                {!appt.confirmation_date && !isExpired && !isCancelled && (
                                    <div className="flex items-center gap-4 bg-blue-50 text-blue-700 px-5 py-4 rounded-3xl border border-blue-100 shadow-sm">
                                        <div className="h-10 w-10 rounded-xl bg-blue-200/50 flex items-center justify-center shadow-inner">
                                            <AlertCircle className="h-5 w-5 animate-pulse" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">{t('awaitingConfirmation')}</span>
                                    </div>
                                )}

                                {appt.confirmation_date && (
                                    <div className="flex items-center gap-4 bg-emerald-500 text-white px-5 py-4 rounded-3xl shadow-lg shadow-emerald-500/10">
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Arrival Confirmed</span>
                                            <span className="text-xs font-black">{format(new Date(appt.confirmation_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                )}

                                {isExpired && (
                                    <div className="flex items-center gap-4 bg-rose-50 text-rose-700 px-5 py-4 rounded-3xl border border-rose-100">
                                        <div className="h-10 w-10 rounded-xl bg-rose-200/50 flex items-center justify-center">
                                            <XCircle className="h-5 w-5 text-rose-500" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">{t('appointmentExpired')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2">
                        {isFinished ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-6 bg-[#E5E7EB]/20 border border-[#E5E7EB]/50 rounded-[2rem] shadow-inner w-full">
                                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <Check size={28} strokeWidth={4} />
                                </div>
                                <span className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em]">{t('completed') || 'COMPLETED'}</span>
                            </div>
                        ) : isCancelled ? (
                            <Button
                                onClick={() => onStatusChange(appt, 'Scheduled')}
                                className="w-full h-14 rounded-[1.5rem] bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-200"
                            >
                                <Play className="h-4 w-4 mr-2" text-slate-400 /> {t('restore')}
                            </Button>
                        ) : (
                            <div className="flex gap-4">
                                {(isExpired || !isConfirmed) ? (
                                    <Button
                                        onClick={() => isExpired ? onEdit(appt) : onStatusChange(appt, 'Confirmation')}
                                        className={cn(
                                            "flex-1 h-14 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all shadow-md active:scale-95 border-none",
                                            isExpired
                                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
                                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                                        )}
                                    >
                                        {isExpired ? (
                                            <><Calendar className="h-4 w-4 mr-2" /> {t('reschedule')}</>
                                        ) : (
                                            <>{t('confirm')}</>
                                        )}
                                    </Button>
                                ) : null}

                                <Button
                                    onClick={() => onFinalize(appt)}
                                    className={cn(
                                        "h-14 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 shadow-md flex-1",
                                        isConfirmed || isExpired
                                            ? "bg-[#063D31] hover:bg-[#042F26] text-white shadow-teal-900/10"
                                            : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200"
                                    )}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {t('finalize')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ViewResultsDialog
                isOpen={showResultsDialog}
                onClose={() => setShowResultsDialog(false)}
                appointment={appt}
                onSave={(data) => {
                    if (onUpdateResults) onUpdateResults(appt, data);
                    setShowResultsDialog(false);
                }}
            />
        </motion.div >
    );
});

AppointmentCard.displayName = 'AppointmentCard';

export default AppointmentCard;
