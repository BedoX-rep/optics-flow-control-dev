import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Phone, User, Eye, Edit, Trash2, CheckCircle, Play, XCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/integrations/supabase/types';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AppointmentCardProps {
    appointment: Appointment;
    index: number;
    statusConfig: Record<string, { color: string; bgColor: string; borderColor: string }>;
    isMobile: boolean;
    onFinalize: (appt: Appointment) => void;
    onEdit: (appt: Appointment) => void;
    onDelete: (appt: Appointment) => void;
    onStatusChange: (appt: Appointment, status: string) => void;
    onConvertToClient: (appt: Appointment) => void;
}

const AppointmentCard = ({
    appointment: appt,
    index,
    statusConfig,
    isMobile,
    onFinalize,
    onEdit,
    onDelete,
    onStatusChange,
    onConvertToClient,
}: AppointmentCardProps) => {
    const { t } = useLanguage();
    const sc = statusConfig[appt.status] || statusConfig['Scheduled'];

    // Get first letter of name for avatar
    const nameInitial = appt.client_name ? appt.client_name.charAt(0).toUpperCase() : '?';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="group relative h-[380px]"
        >
            <div className="h-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 flex flex-col hover:shadow-2xl hover:border-teal-400/30 transition-all duration-500 overflow-hidden">
                {/* Status Bar */}
                <div className={cn("h-1.5 w-full", sc.bgColor)} />

                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                    {/* Header: Date + Info */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1.5 min-w-0">
                            {/* Prominent Date */}
                            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl w-fit shadow-lg shadow-slate-900/10 mb-2">
                                <Calendar className="h-4 w-4 text-teal-400" />
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {format(new Date(appt.appointment_date + 'T00:00:00'), 'EEEE, MMM d')}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center border border-teal-200/50 shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                    <span className="font-black text-teal-700 text-lg">{nameInitial}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={`${sc.bgColor} ${sc.color} ${sc.borderColor} border font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg`}>
                                            {t(appt.status === 'Confirmation' ? 'confirmed' : (appt.status.toLowerCase() === 'scheduled' ? 'scheduled' : appt.status.toLowerCase()))}
                                        </Badge>
                                        {!appt.client_id && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onConvertToClient(appt)}
                                                className="h-5 px-1.5 text-[8px] font-black uppercase bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-md border border-amber-100 transition-all active:scale-95"
                                            >
                                                {t('convertToClient')}
                                            </Button>
                                        )}
                                    </div>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight truncate uppercase tracking-tight group-hover:text-teal-700 transition-colors">
                                        {appt.client_name}
                                    </h3>
                                    {appt.client_phone && (
                                        <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                                            <Phone className="h-3 w-3 text-teal-500" /> {appt.client_phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Schedule Time Badge */}
                        <div className="bg-slate-100/50 rounded-xl px-3 py-3 border border-slate-200/50 flex flex-col items-center min-w-[75px] group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors self-start mt-1">
                            <Clock className="h-4 w-4 text-slate-400 mb-1 group-hover:text-teal-500" />
                            <span className="text-base font-black text-slate-700">{appt.appointment_time?.slice(0, 5)}</span>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        {appt.notes && (
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 relative">
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
                                    "{appt.notes}"
                                </p>
                            </div>
                        )}

                        {appt.status === 'Confirmation' && appt.confirmation_date && (
                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">{t('confirmationDate')}</span>
                                </div>
                                <span className="text-xs font-bold text-blue-900">{format(new Date(appt.confirmation_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                            </div>
                        )}

                        {appt.status === 'Finished' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="h-3 w-3 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">{t('optician')}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-emerald-900 truncate">{appt.examiner_name || t('notSpecified')}</p>
                                    </div>
                                    <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Eye className="h-3 w-3 text-teal-600" />
                                            <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest">{t('prescription')}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-teal-900">{t('results')}</p>
                                    </div>
                                </div>

                                {(appt.right_eye_sph !== null || appt.left_eye_sph !== null) && (
                                    <div className="bg-white/50 rounded-2xl border border-slate-100 p-3">
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('eye')}</div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('sph')}</div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('cyl')}</div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('axe')}</div>

                                            <div className="text-[9px] font-black text-teal-700 uppercase">OD</div>
                                            <div className="text-[10px] font-bold text-slate-700">{appt.right_eye_sph ?? '—'}</div>
                                            <div className="text-[10px] font-bold text-slate-700">{appt.right_eye_cyl ?? '—'}</div>
                                            <div className="text-[10px] font-bold text-slate-700">{appt.right_eye_axe ?? '—'}</div>

                                            <div className="text-[9px] font-black text-teal-700 uppercase">OS</div>
                                            <div className="text-[10px] font-bold text-slate-700">{appt.left_eye_sph ?? '—'}</div>
                                            <div className="text-[10px] font-bold text-slate-700">{appt.left_eye_cyl ?? '—'}</div>
                                            <div className="text-[10px] font-bold text-slate-700">{appt.left_eye_axe ?? '—'}</div>
                                        </div>
                                        {appt.add_value && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center px-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Addition</span>
                                                <span className="text-[10px] font-black text-teal-700">+{appt.add_value}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Status Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t('appointmentStatus')}</span>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="flex items-center gap-2">
                            {appt.status === 'Scheduled' && (
                                <Button
                                    onClick={() => onStatusChange(appt, 'Confirmation')}
                                    className="flex-1 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    <CheckCircle className="h-3.5 w-3.5 mr-2" /> {t('confirmed')}
                                </Button>
                            )}

                            {appt.status === 'Confirmation' && (
                                <Button
                                    variant="outline"
                                    onClick={() => onStatusChange(appt, 'Scheduled')}
                                    className="flex-1 h-10 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-2 text-blue-400" /> {t('cancelConfirmation')}
                                </Button>
                            )}

                            {(appt.status === 'Scheduled' || appt.status === 'Confirmation') && (
                                <Button
                                    onClick={() => onFinalize(appt)}
                                    className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
                                >
                                    <CheckCircle className="h-3.5 w-3.5 mr-2 text-teal-200" /> {t('finalize')}
                                </Button>
                            )}

                            {appt.status !== 'Cancelled' && appt.status !== 'Finished' && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onStatusChange(appt, 'Cancelled')}
                                    className="h-10 w-10 min-w-10 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 active:scale-95 transition-all"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            )}

                            {appt.status === 'Cancelled' && (
                                <Button
                                    onClick={() => onStatusChange(appt, 'Scheduled')}
                                    className="flex-1 h-10 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    {t('restore')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(appt)}
                            className="h-10 w-10 text-slate-400 hover:text-teal-600 hover:bg-teal-100/50 rounded-xl transition-all"
                        >
                            <Edit size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(appt)}
                            className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-xl transition-all"
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            ID: #{appt.id.slice(0, 6)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AppointmentCard;
