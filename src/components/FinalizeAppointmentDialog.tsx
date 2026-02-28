import React, { useState, useEffect } from 'react';
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
import { Appointment } from '@/integrations/supabase/types';
import { Eye, User, CheckCircle } from 'lucide-react';

interface FinalizeAppointmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onFinalize: (data: {
        examiner_name: string;
        right_eye_sph: number | null;
        right_eye_cyl: number | null;
        right_eye_axe: number | null;
        left_eye_sph: number | null;
        left_eye_cyl: number | null;
        left_eye_axe: number | null;
        add_value: number | null;
    }) => void;
    appointment?: Appointment | null;
    isSaving?: boolean;
}

const FinalizeAppointmentDialog = ({ isOpen, onClose, onFinalize, appointment, isSaving }: FinalizeAppointmentDialogProps) => {
    const { t } = useLanguage();
    const { subscription } = useAuth();

    const [examinerName, setExaminerName] = useState('');
    const [rightSph, setRightSph] = useState('');
    const [rightCyl, setRightCyl] = useState('');
    const [rightAxe, setRightAxe] = useState('');
    const [leftSph, setLeftSph] = useState('');
    const [leftCyl, setLeftCyl] = useState('');
    const [leftAxe, setLeftAxe] = useState('');
    const [addValue, setAddValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Pre-fill examiner name with current user display name
            setExaminerName(subscription?.display_name || '');
            // If appointment already has prescription data, pre-fill
            if (appointment) {
                setRightSph(appointment.right_eye_sph?.toString() || '');
                setRightCyl(appointment.right_eye_cyl?.toString() || '');
                setRightAxe(appointment.right_eye_axe?.toString() || '');
                setLeftSph(appointment.left_eye_sph?.toString() || '');
                setLeftCyl(appointment.left_eye_cyl?.toString() || '');
                setLeftAxe(appointment.left_eye_axe?.toString() || '');
                setAddValue(appointment.add_value?.toString() || '');
            } else {
                setRightSph(''); setRightCyl(''); setRightAxe('');
                setLeftSph(''); setLeftCyl(''); setLeftAxe('');
                setAddValue('');
            }
            setError('');
        }
    }, [isOpen, appointment, subscription]);

    const parseNum = (val: string): number | null => {
        if (!val.trim()) return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!examinerName.trim()) {
            setError(t('mustEnterExaminerName'));
            return;
        }
        onFinalize({
            examiner_name: examinerName.trim(),
            right_eye_sph: parseNum(rightSph),
            right_eye_cyl: parseNum(rightCyl),
            right_eye_axe: parseNum(rightAxe),
            left_eye_sph: parseNum(leftSph),
            left_eye_cyl: parseNum(leftCyl),
            left_eye_axe: parseNum(leftAxe),
            add_value: parseNum(addValue),
        });
    };

    const prescriptionInputClass = "rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-10 text-center font-mono text-sm";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] rounded-3xl border-slate-200/60 shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-emerald-500 to-teal-500">
                    <DialogTitle className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        {t('finalizeAppointment')}
                    </DialogTitle>
                    <DialogDescription className="text-white text-sm mt-1 opacity-90">
                        {t('finalizeAppointmentDesc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Client Info Banner */}
                    {appointment && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{appointment.client_name}</p>
                                <p className="text-xs text-slate-500">{appointment.appointment_date} • {appointment.appointment_time}</p>
                            </div>
                        </div>
                    )}

                    {/* Examiner / Optician Name */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                            <User className="h-3 w-3" /> {t('examinerName')}
                        </Label>
                        <Input
                            value={examinerName}
                            onChange={(e) => { setExaminerName(e.target.value); setError(''); }}
                            placeholder={t('enterExaminerName')}
                            className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-11"
                            required
                        />
                        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
                    </div>

                    {/* Prescription Results */}
                    <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                            <Eye className="h-3 w-3" /> {t('prescriptionResults')}
                        </Label>

                        {/* Right Eye */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <p className="text-xs font-black text-teal-600 uppercase tracking-wider">
                                {t('rightEyeShort')} (OD)
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-900 text-center block">SPH</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={rightSph}
                                        onChange={(e) => setRightSph(e.target.value)}
                                        placeholder="0.00"
                                        className={prescriptionInputClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-900 text-center block">CYL</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={rightCyl}
                                        onChange={(e) => setRightCyl(e.target.value)}
                                        placeholder="0.00"
                                        className={prescriptionInputClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-900 text-center block">AXE</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={rightAxe}
                                        onChange={(e) => setRightAxe(e.target.value)}
                                        placeholder="0"
                                        className={prescriptionInputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Left Eye */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <p className="text-xs font-black text-teal-600 uppercase tracking-wider">
                                {t('leftEyeShort')} (OS)
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-900 text-center block">SPH</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={leftSph}
                                        onChange={(e) => setLeftSph(e.target.value)}
                                        placeholder="0.00"
                                        className={prescriptionInputClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-900 text-center block">CYL</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={leftCyl}
                                        onChange={(e) => setLeftCyl(e.target.value)}
                                        placeholder="0.00"
                                        className={prescriptionInputClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-slate-900 text-center block">AXE</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={leftAxe}
                                        onChange={(e) => setLeftAxe(e.target.value)}
                                        placeholder="0"
                                        className={prescriptionInputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ADD Value */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center gap-4">
                                <Label className="text-xs font-black text-teal-600 uppercase tracking-wider whitespace-nowrap">
                                    {t('addPower')}
                                </Label>
                                <Input
                                    type="number"
                                    step="0.25"
                                    value={addValue}
                                    onChange={(e) => setAddValue(e.target.value)}
                                    placeholder="0.00"
                                    className={`${prescriptionInputClass} max-w-[120px]`}
                                />
                            </div>
                        </div>
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
                            disabled={isSaving || !examinerName.trim()}
                            className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isSaving ? '...' : t('finalize')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FinalizeAppointmentDialog;
