import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Phone, User, Eye, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/integrations/supabase/types';
import { useLanguage } from '@/components/LanguageProvider';

interface AppointmentCardProps {
    appointment: Appointment;
    index: number;
    statusConfig: Record<string, { color: string; bgColor: string; borderColor: string }>;
    isMobile: boolean;
    onFinalize: (appt: Appointment) => void;
    onEdit: (appt: Appointment) => void;
    onDelete: (appt: Appointment) => void;
}

const AppointmentCard = ({
    appointment: appt,
    index,
    statusConfig,
    isMobile,
    onFinalize,
    onEdit,
    onDelete,
}: AppointmentCardProps) => {
    const { t } = useLanguage();
    const sc = statusConfig[appt.status] || statusConfig['Scheduled'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/20 p-5 hover:shadow-xl hover:border-teal-200/60 transition-all duration-300 group"
        >
            <div className="flex items-start gap-4">
                {/* Time Block */}
                <div className="flex-shrink-0 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl px-3 py-2.5 text-center min-w-[70px] shadow-lg shadow-teal-500/15">
                    <Clock className="h-3.5 w-3.5 text-white/70 mx-auto mb-0.5" />
                    <p className="text-white font-black text-sm">{appt.appointment_time?.slice(0, 5)}</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-base truncate">{appt.client_name}</h3>
                        <Badge className={`${sc.bgColor} ${sc.color} ${sc.borderColor} border font-bold text-[10px] uppercase tracking-wider px-2 py-0.5`}>
                            {t(appt.status === 'In Progress' ? 'inProgress' : (appt.status.toLowerCase() === 'scheduled' ? 'scheduled' : appt.status.toLowerCase()))}
                        </Badge>
                    </div>

                    {appt.client_phone && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {appt.client_phone}
                        </p>
                    )}

                    {appt.notes && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-1 italic">{appt.notes}</p>
                    )}

                    {appt.status === 'Finished' && appt.examiner_name && (
                        <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-semibold">
                            <User className="h-3 w-3" /> {appt.examiner_name}
                            {(appt.right_eye_sph !== null || appt.left_eye_sph !== null) && (
                                <span className="ml-2 flex items-center gap-0.5 text-teal-600">
                                    <Eye className="h-3 w-3" /> Rx
                                </span>
                            )}
                        </p>
                    )}
                </div>

                {/* Actions (Desktop) */}
                <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {appt.status !== 'Finished' && appt.status !== 'Cancelled' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onFinalize(appt)}
                            className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200"
                            title={t('finalize')}
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(appt)}
                        className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-600 border border-slate-200"
                        title={t('edit')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(appt)}
                        className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                        title={t('delete')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Mobile actions - always visible */}
            {isMobile && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {appt.status !== 'Finished' && appt.status !== 'Cancelled' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFinalize(appt)}
                            className="flex-1 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold border border-emerald-200"
                        >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t('finalize')}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(appt)}
                        className="h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-teal-50 text-xs font-bold border border-slate-200 px-3"
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(appt)}
                        className="h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-50 text-xs font-bold border border-slate-200 px-3"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default AppointmentCard;
