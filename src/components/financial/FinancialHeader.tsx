import React from 'react';
import { format } from 'date-fns';
import { Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import { motion } from 'framer-motion';

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
        <div className="w-full mb-12">
            {/* Hero Section - Matching Dashboard */}
            <div className="w-full px-6 lg:px-10 pt-8 relative z-10">
                <div className="w-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-600 text-white rounded-[32px] py-8 px-8 md:px-10 shadow-xl relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/20 rounded-full -ml-40 -mb-40 blur-3xl" />

                    <div className="w-full relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white uppercase">
                                    {t('financialOverview')}
                                </h1>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Date Filters - Matching Dashboard */}
            <div className="w-full px-6 lg:px-10 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[32px] shadow-sm flex flex-wrap items-center gap-6"
                >
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 shadow-inner rounded-2xl border border-slate-100/50">
                        <Calendar className="h-4 w-4 text-indigo-600" />
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
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl px-4 h-10 transition-all border border-transparent hover:border-indigo-100"
                            >
                                {t(period)}
                            </Button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FinancialHeader;
