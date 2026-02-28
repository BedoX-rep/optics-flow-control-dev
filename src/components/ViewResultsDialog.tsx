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
import { Eye, User, Save, X, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const inputClass = "h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-center font-black text-slate-800 text-sm";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl bg-[#E2E2DE] p-0 overflow-y-auto max-h-[96vh] min-h-[85vh] flex flex-col custom-scrollbar">
                {/* Background Watermark Icons */}
                <div className="absolute top-32 right-6 opacity-[0.05] pointer-events-none rotate-12">
                    <Eye size={120} strokeWidth={1} />
                </div>
                <div className="absolute bottom-20 left-6 opacity-[0.03] pointer-events-none -rotate-12">
                    <Activity size={100} strokeWidth={1} />
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
                            {t('viewresults') || 'View Results'}
                        </DialogTitle>
                        <DialogDescription className="text-teal-50/70 text-xs font-medium tracking-wide">
                            {appointment.client_name} • {appointment.appointment_date}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5 relative z-10 custom-scrollbar flex-1 flex flex-col">
                    {/* Examiner Section */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1 flex items-center gap-2">
                            <User className="h-3 w-3" /> {t('examinerName')}
                        </Label>
                        <Input
                            value={examinerName}
                            onChange={(e) => setExaminerName(e.target.value)}
                            placeholder={t('enterExaminerName')}
                            className="h-10 rounded-[1rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-base font-black text-slate-800 placeholder:text-[#AAA]"
                        />
                    </div>

                    {/* Prescription Table */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-[#5C5C59] uppercase tracking-[0.15em] px-1 flex items-center gap-2">
                            <Eye className="h-3 w-3" /> {t('prescriptionResults')}
                        </Label>

                        {/* OD - Right Eye */}
                        <div className="bg-white/40 rounded-[1.5rem] p-4 border border-white/60 shadow-sm space-y-3 backdrop-blur-sm">
                            <p className="text-[10px] font-black text-[#063D31] uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#063D31]" />
                                {t('rightEyeShort')} (OD)
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-[#8E8E8A] uppercase tracking-widest">SPH</Label>
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
                                    <Label className="text-[9px] font-black text-[#8E8E8A] uppercase tracking-widest">CYL</Label>
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
                                    <Label className="text-[9px] font-black text-[#8E8E8A] uppercase tracking-widest">AXE</Label>
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
                        <div className="bg-white/40 rounded-[1.5rem] p-4 border border-white/60 shadow-sm space-y-3 backdrop-blur-sm">
                            <p className="text-[10px] font-black text-[#063D31] uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#063D31]" />
                                {t('leftEyeShort')} (OS)
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5 text-center">
                                    <Label className="text-[9px] font-black text-[#8E8E8A] uppercase tracking-widest">SPH</Label>
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
                                    <Label className="text-[9px] font-black text-[#8E8E8A] uppercase tracking-widest">CYL</Label>
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
                                    <Label className="text-[9px] font-black text-[#8E8E8A] uppercase tracking-widest">AXE</Label>
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
                        <div className="bg-[#063D31] rounded-[1.5rem] p-4 text-white flex items-center justify-between border border-[#042F26] shadow-xl shadow-teal-900/10">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {t('addPower') || 'ADD Power'}
                                </p>
                            </div>
                            <Input
                                type="number"
                                step="0.25"
                                value={addValue}
                                onChange={(e) => setAddValue(e.target.value)}
                                placeholder="0.00"
                                className="h-10 w-24 rounded-[1rem] border-none bg-white text-[#063D31] shadow-xl text-center font-black text-base focus:ring-0"
                            />
                        </div>
                    </div>
                </form>

                <div className="p-6 pt-2 flex items-center justify-between z-20 mt-auto bg-gradient-to-t from-[#E2E2DE] via-[#E2E2DE] to-transparent">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl font-black uppercase text-xs tracking-[0.2em] text-[#063D31] hover:translate-y-[-2px] transition-all border-b-2 border-[#063D31]"
                    >
                        {t('close') || 'Close'}
                    </button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className={cn(
                            "px-8 h-12 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl transition-all duration-500 active:scale-95 flex items-center gap-2 border-none",
                            isSaving
                                ? "bg-gradient-to-br from-[#8E8E8A] to-[#63635F] text-slate-900 opacity-50 cursor-not-allowed"
                                : "bg-gradient-to-br from-[#063D31] to-[#042F26] text-white hover:shadow-teal-900/40 hover:translate-y-[-2px]"
                        )}
                    >
                        {isSaving ? (
                            <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <><Save className="h-5 w-5 mr-1" /> {t('saveChanges') || 'Save Changes'}</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewResultsDialog;
