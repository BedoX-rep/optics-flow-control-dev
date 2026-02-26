import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

interface FinancialHeaderProps {
    dateFrom: string;
    dateTo: string;
    setDateFrom: (val: string) => void;
    setDateTo: (val: string) => void;
    onQuickSelect: (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => void;
}

const FinancialHeader: React.FC<FinancialHeaderProps> = ({
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    onQuickSelect,
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-6 mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                </div>
            </div>

            <div className="p-3 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[32px] shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 shadow-inner rounded-2xl border border-slate-100/50">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 w-32 outline-none"
                        />
                        <span className="text-slate-300 font-black">→</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 w-32 outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {(['thisMonth', 'lastMonth', 'thisYear'] as const).map((period) => (
                        <Button
                            key={period}
                            variant="ghost"
                            size="sm"
                            onClick={() => onQuickSelect(period as any)}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl px-4 h-10 transition-all border border-transparent hover:border-teal-100"
                        >
                            {t(period)}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinancialHeader;
