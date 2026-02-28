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
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="group relative"
        >
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-1 flex flex-col h-full hover:shadow-2xl hover:border-teal-400/30 transition-all duration-500 overflow-hidden">
                {/* Header/Status Strip */}
                <div className={`h-1.5 w-full rounded-full mb-1 ${sc.bgColor.replace('bg-', 'bg-gradient-to-r from-')}`} />

                <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <Badge className={`${sc.bgColor} ${sc.color} ${sc.borderColor} border-0 font-black text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-lg mb-2`}>
                                {t(appt.status === 'In Progress' ? 'inProgress' : (appt.status.toLowerCase() === 'scheduled' ? 'scheduled' : appt.status.toLowerCase()))}
                            </Badge>
                            <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-teal-700 transition-colors uppercase tracking-tight">
                                {appt.client_name}
                            </h3>
                            {appt.client_phone && (
                                <p className="text-xs text-slate-400 flex items-center gap-1.5 font-bold">
                                    <Phone className="h-3 w-3 text-teal-500" /> {appt.client_phone}
                                </p>
                            )}
                        </div>

                        {/* Large Time Indicator */}
                        <div className="bg-slate-50 rounded-2xl p-3 text-center min-w-[65px] border border-slate-100 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                            <Clock className="h-3 w-3 text-slate-300 mx-auto mb-1 group-hover:text-teal-400" />
                            <p className="text-slate-900 font-black text-sm">{appt.appointment_time?.slice(0, 5)}</p>
                        </div>
                    </div>

                    {appt.notes && (
                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                            <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2">
                                "{appt.notes}"
                            </p>
                        </div>
                    )}

                    {appt.status === 'Finished' && appt.examiner_name && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <User className="h-3 w-3 text-emerald-600" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">{appt.examiner_name}</span>
                            </div>
                            {(appt.right_eye_sph !== null || appt.left_eye_sph !== null) && (
                                <Badge variant="outline" className="text-[9px] font-bold border-teal-200 text-teal-600 bg-teal-50/30">
                                    <Eye className="h-2.5 w-2.5 mr-1" /> RX DATA
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Glass Footer Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 group-hover:bg-teal-50/50 transition-colors">
                    {appt.status !== 'Finished' && appt.status !== 'Cancelled' ? (
                        <Button
                            onClick={() => onFinalize(appt)}
                            className="flex-1 h-10 rounded-xl bg-slate-900 text-white hover:bg-teal-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-950/20"
                        >
                            <CheckCircle className="h-3.5 w-3.5 mr-2 text-teal-400" />
                            {t('finalize')}
                        </Button>
                    ) : (
                        <div className="flex-1" />
                    )}
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(appt)}
                            className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-teal-600 transition-all border border-transparent hover:border-slate-200"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(appt)}
                            className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-red-600 transition-all border border-transparent hover:border-slate-200"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


export default AppointmentCard;
