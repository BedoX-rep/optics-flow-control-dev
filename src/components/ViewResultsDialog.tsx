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
import { Appointment } from '@/integrations/supabase/types';
import { Eye, User, Save, X } from 'lucide-react';

interface ViewResultsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    appointment: Appointment;
    isSaving?: boolean;
}

const ViewResultsDialog = ({ isOpen, onClose, onSave, appointment, isSaving }: ViewResultsDialogProps) => {
    const { t } = useLanguage();

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
        if (isOpen && appointment) {
            setExaminerName(appointment.examiner_name || '');
            setRightSph(appointment.right_eye_sph?.toString() || '');
            setRightCyl(appointment.right_eye_cyl?.toString() || '');
            setRightAxe(appointment.right_eye_axe?.toString() || '');
            setLeftSph(appointment.left_eye_sph?.toString() || '');
            setLeftCyl(appointment.left_eye_cyl?.toString() || '');
            setLeftAxe(appointment.left_eye_axe?.toString() || '');
            setAddValue(appointment.add_value?.toString() || '');
            setError('');
        }
    }, [isOpen, appointment]);

    const parseNum = (val: string): number | null => {
        if (!val.trim()) return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
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

    const inputClass = "rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-10 text-center font-mono text-sm";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] rounded-[2rem] border-slate-200/60 shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-6 bg-slate-900 text-white relative">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Eye className="h-5 w-5 text-teal-400" />
                        {t('viewResults') || 'View Results'}
                    </DialogTitle>
                    <DialogDescription className="text-white text-xs mt-1 font-bold uppercase tracking-widest opacity-90">
                        {appointment.client_name} • {appointment.appointment_date}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Examiner Section */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <User className="h-3 w-3" /> {t('examinerName')}
                        </Label>
                        <Input
                            value={examinerName}
                            onChange={(e) => setExaminerName(e.target.value)}
                            placeholder={t('enterExaminerName')}
                            className="rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 h-11 font-bold"
                        />
                    </div>

                    {/* Prescription Table */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <Eye className="h-3 w-3" /> {t('prescriptionResults')}
                        </Label>

                        {/* OD - Right Eye */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                {t('rightEyeShort')} (OD)
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">SPH</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={rightSph}
                                        onChange={(e) => setRightSph(e.target.value)}
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">CYL</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={rightCyl}
                                        onChange={(e) => setRightCyl(e.target.value)}
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">AXE</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={rightAxe}
                                        onChange={(e) => setRightAxe(e.target.value)}
                                        placeholder="0"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* OS - Left Eye */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                {t('leftEyeShort')} (OS)
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">SPH</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={leftSph}
                                        onChange={(e) => setLeftSph(e.target.value)}
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">CYL</Label>
                                    <Input
                                        type="number"
                                        step="0.25"
                                        value={leftCyl}
                                        onChange={(e) => setLeftCyl(e.target.value)}
                                        placeholder="0.00"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">AXE</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={leftAxe}
                                        onChange={(e) => setLeftAxe(e.target.value)}
                                        placeholder="0"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ADD Value */}
                        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg shadow-slate-900/20">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                                    {t('addPower') || 'ADD Power'}
                                </Label>
                                <Input
                                    type="number"
                                    step="0.25"
                                    value={addValue}
                                    onChange={(e) => setAddValue(e.target.value)}
                                    placeholder="0.00"
                                    className="rounded-xl border-slate-700 bg-slate-800 text-white focus:border-teal-400 focus:ring-teal-400/20 h-10 w-24 text-center font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-900 hover:text-slate-600 hover:bg-slate-100"
                    >
                        <X className="h-4 w-4 mr-2" />
                        {t('close') || 'Close'}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-[2] h-12 rounded-2xl bg-teal-500 text-slate-950 hover:bg-teal-400 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-500/20 transition-all border-none"
                    >
                        {isSaving ? (
                            <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <><Save className="h-4 w-4 mr-2" /> {t('saveChanges') || 'Save Changes'}</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewResultsDialog;
