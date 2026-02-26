import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface QuickExpenditureAnalysisProps {
    metrics: {
        operationalExpenses: { total: number; paid: number };
        capitalExpenditure?: { total: number; paid: number };
        montageMetrics: { total: number; paid: number };
        totalProductCosts: number;
        productAnalysis: {
            categories: Record<string, { cost: number; profit: number; margin: number }>;
        };
    };
}

const QuickExpenditureAnalysis: React.FC<QuickExpenditureAnalysisProps> = ({ metrics }) => {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    const opExpTotal = metrics.operationalExpenses.total;
    const opExpPaid = metrics.operationalExpenses.paid;
    const opExpProgress = opExpTotal > 0 ? (opExpPaid / opExpTotal) * 100 : 0;

    const capExpTotal = metrics.capitalExpenditure?.total || 0;
    const capExpPaid = metrics.capitalExpenditure?.paid || 0;
    const capExpProgress = capExpTotal > 0 ? (capExpPaid / capExpTotal) * 100 : 0;

    const montageTotal = metrics.montageMetrics.total;
    const montagePaid = metrics.montageMetrics.paid;
    const montageLeft = montageTotal - montagePaid;
    const montageProgress = montageTotal > 0 ? (montagePaid / montageTotal) * 100 : 0;

    return (
        <div className="mb-12">
            {/* Header with teal/blue accents */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between group mb-4"
            >
                <div className="flex items-center gap-4">
                    <div className="h-1.5 w-10 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all group-hover:w-16 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {t('expenditureAndProductCosts')}
                    </h3>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-2 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all shadow-sm">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-white transition-colors">
                        {isExpanded ? t('collapse') || 'Minimize' : t('expand') || 'Review'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600 group-hover:text-white" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6">
                            <div className="bg-white border-2 border-slate-900/10 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50">
                                <div className="grid grid-cols-1 lg:grid-cols-2">

                                    {/* Column 1: Blue-themed Expenditure Detail */}
                                    <div className="p-10 border-b lg:border-b-0 lg:border-r border-slate-100">
                                        <div className="mb-12">
                                            <h4 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
                                                {t('expenditureAnalysis')}
                                            </h4>
                                            <div className="h-1 w-12 bg-blue-600 rounded-full" />
                                        </div>

                                        <div className="space-y-12">
                                            {/* Operational Expenses */}
                                            <div className="group relative pl-8">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-100 group-hover:bg-blue-600 transition-colors rounded-full" />
                                                <div className="mb-4">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">
                                                        {t('operationalExpenses')}
                                                    </span>
                                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                                        {opExpTotal.toLocaleString()} <span className="text-sm font-bold text-blue-600">DH</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-2 bg-blue-50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-1000"
                                                            style={{ width: `${opExpProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black text-blue-700">
                                                        {opExpProgress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Capital Expenditures */}
                                            <div className="group relative pl-8">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-100 group-hover:bg-indigo-600 transition-colors rounded-full" />
                                                <div className="mb-4">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">
                                                        {t('capitalExpenditure')}
                                                    </span>
                                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                                        {capExpTotal.toLocaleString()} <span className="text-sm font-bold text-indigo-600">DH</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-2 bg-indigo-50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)] transition-all duration-1000"
                                                            style={{ width: `${capExpProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black text-indigo-700">
                                                        {capExpProgress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Montage Costs */}
                                            <div className="group relative pl-8">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-100 group-hover:bg-teal-600 transition-colors rounded-full" />
                                                <div className="mb-4">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">
                                                        {t('montageCosts')}
                                                    </span>
                                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                                        {montageTotal.toLocaleString()} <span className="text-sm font-bold text-teal-600">DH</span>
                                                    </p>
                                                    <p className="text-[11px] font-black text-rose-600 mt-1 uppercase tracking-widest">
                                                        {montageLeft.toLocaleString()} DH {t('outstanding')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-2 bg-teal-50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)] transition-all duration-1000"
                                                            style={{ width: `${montageProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black text-teal-700">
                                                        {montageProgress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Teal-themed Category Breakdown */}
                                    <div className="p-10 bg-slate-50/50">
                                        <div className="mb-10">
                                            <h4 className="text-sm font-black text-teal-600 uppercase tracking-[0.2em] mb-1">
                                                {t('productCostsByCategory')}
                                            </h4>
                                            <div className="h-1 w-12 bg-teal-600 rounded-full" />
                                        </div>

                                        <div className="space-y-4">
                                            {Object.entries(metrics.productAnalysis.categories).length > 0 ? (
                                                Object.entries(metrics.productAnalysis.categories).map(([category, data]) => (
                                                    <div key={category} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-900/10 transition-all group">
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-[11px] font-black text-slate-900 group-hover:text-teal-600 transition-colors tracking-tighter uppercase w-10">
                                                                {category.substring(0, 3)}
                                                            </div>
                                                            <span className="font-black text-slate-900 text-sm tracking-tight">{t(category)}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-slate-900">{data.cost.toLocaleString()} DH</p>
                                                            <div className={cn(
                                                                "inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest mt-1",
                                                                data.margin >= 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                                                            )}>
                                                                {data.margin.toFixed(1)}% {t('margin')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-40 flex items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-[24px]">
                                                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">{t('noDataFound')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Total Footer */}
                                        <div className="mt-12 bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/40 rounded-full -mr-16 -mt-16 blur-2xl transition-all" />
                                            <div className="relative z-10 flex justify-between items-end">
                                                <div>
                                                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] block mb-2">
                                                        {t('totalInventoryCost')}
                                                    </span>
                                                    <p className="text-4xl font-black tracking-tighter leading-none">
                                                        {metrics.totalProductCosts.toLocaleString()} <span className="text-sm font-bold text-slate-400 ml-1">DH</span>
                                                    </p>
                                                </div>
                                                <div className="h-5 w-5 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.8)] animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickExpenditureAnalysis;
