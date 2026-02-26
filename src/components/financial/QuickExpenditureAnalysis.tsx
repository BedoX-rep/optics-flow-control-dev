import React from 'react';
import { Calculator, Package, Info, Activity } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickExpenditureAnalysisProps {
    metrics: {
        operationalExpenses: { total: number; paid: number };
        montageMetrics: { total: number; paid: number };
        totalProductCosts: number;
        productAnalysis: {
            categories: Record<string, { cost: number; profit: number; margin: number }>;
        };
    };
}

const QuickExpenditureAnalysis: React.FC<QuickExpenditureAnalysisProps> = ({ metrics }) => {
    const { t } = useLanguage();

    const opExpTotal = metrics.operationalExpenses.total;
    const opExpPaid = metrics.operationalExpenses.paid;
    const opExpProgress = opExpTotal > 0 ? (opExpPaid / opExpTotal) * 100 : 0;

    const montageTotal = metrics.montageMetrics.total;
    const montagePaid = metrics.montageMetrics.paid;
    const montageProgress = montageTotal > 0 ? (montagePaid / montageTotal) * 100 : 0;

    return (
        <div className="mb-12">
            {/* Header matches new dashboard styling */}
            <div className="flex items-center gap-2 mb-6 ml-1">
                <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                    {t('expenditureAnalysis')} & {t('productCostsByCategory')}
                </h3>
            </div>

            {/* Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-none rounded-[32px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
                {/* Visual gradient anchor on top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-500" />

                <div className="grid grid-cols-1 lg:grid-cols-2">

                    {/* LEFT COLUMN: Expenditure Analysis */}
                    <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-teal-50 rounded-2xl text-teal-600">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{t('expenditureAnalysis')}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Operational & Montage</p>
                            </div>
                        </div>

                        <div className="space-y-10 flex-1">
                            {/* Operational Expenses */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        {t('operationalExpenses')}
                                    </h5>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 group transition-colors hover:bg-slate-50">
                                    <div className="flex items-end justify-between mb-4">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('total')}</span>
                                        <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {opExpTotal.toLocaleString()} <span className="text-xs text-slate-500 ml-1">DH</span>
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200/60 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">{t('paid')} ({opExpProgress.toFixed(0)}%)</span>
                                        <span className="text-sm font-black text-blue-600">{opExpPaid.toLocaleString()} DH</span>
                                    </div>
                                    <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${opExpProgress}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Montage Metrics */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                                        {t('montageCosts')}
                                    </h5>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 group transition-colors hover:bg-slate-50">
                                    <div className="flex items-end justify-between mb-4">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('total')}</span>
                                        <span className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                                            {montageTotal.toLocaleString()} <span className="text-xs text-slate-500 ml-1">DH</span>
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200/60 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">{t('paid')} ({montageProgress.toFixed(0)}%)</span>
                                        <span className="text-sm font-black text-teal-600">{montagePaid.toLocaleString()} DH</span>
                                    </div>
                                    <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${montageProgress}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Product Costs */}
                    <div className="p-8 lg:p-10 flex flex-col h-full bg-slate-50/20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{t('productCostsByCategory')}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Inventory Breakdown</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            {Object.entries(metrics.productAnalysis.categories).length > 0 ? (
                                Object.entries(metrics.productAnalysis.categories).map(([category, data]) => (
                                    <div key={category} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50/80 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase group-hover:scale-110 transition-transform">
                                                {category.substring(0, 2)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm tracking-tight">{category}</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <p className="font-black text-slate-900">{data.cost.toLocaleString()} <span className="text-xs text-slate-500">DH</span></p>
                                            <div className={cn(
                                                "mt-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                                data.margin >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {data.margin.toFixed(1)}% {t('margin')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <Package className="h-8 w-8 mb-3 text-slate-300" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('noDataFound')}</p>
                                </div>
                            )}
                        </div>

                        {/* Grand Total Footer for Product Costs */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="flex justify-between items-center px-8 py-6 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                        {t('totalInventoryCost')}
                                    </span>
                                    <span className="text-3xl font-black tracking-tight leading-none text-white">
                                        {metrics.totalProductCosts.toLocaleString()} <span className="text-sm font-bold text-slate-400 ml-1">DH</span>
                                    </span>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                                    <Info className="h-6 w-6 text-indigo-400" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuickExpenditureAnalysis;
