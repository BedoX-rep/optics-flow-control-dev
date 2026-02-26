import React from 'react';
import { Calculator, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Expenditure Analysis */}
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-slate-50 px-8 py-6 bg-teal-50/20">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-teal-600" />
                        {t('expenditureAnalysis')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Operational Expenses */}
                        <div className="space-y-6">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {t('operationalExpenses')}
                            </h4>
                            <div className="p-5 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('total')}</span>
                                    <span className="text-xl font-bold text-slate-900">{metrics.operationalExpenses.total.toLocaleString()} DH</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-4 border-t border-blue-100/30">
                                    <span className="text-xs font-bold text-teal-600">{t('paid')}</span>
                                    <span className="font-bold text-teal-600">{metrics.operationalExpenses.paid.toLocaleString()} DH</span>
                                </div>
                            </div>
                            <div className="px-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('paymentProgress')}</span>
                                    <span className="text-[10px] font-bold text-blue-600">
                                        {metrics.operationalExpenses.total > 0 ? ((metrics.operationalExpenses.paid / metrics.operationalExpenses.total) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <Progress value={metrics.operationalExpenses.total > 0 ? (metrics.operationalExpenses.paid / metrics.operationalExpenses.total) * 100 : 0} className="h-1 bg-slate-100" />
                            </div>
                        </div>

                        {/* Montage Costs */}
                        <div className="space-y-6">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                {t('montageCosts')}
                            </h4>
                            <div className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100/50">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('total')}</span>
                                    <span className="text-xl font-bold text-slate-900">{metrics.montageMetrics.total.toLocaleString()} DH</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-4 border-t border-teal-100/30">
                                    <span className="text-xs font-bold text-teal-600">{t('paid')}</span>
                                    <span className="font-bold text-teal-600">{metrics.montageMetrics.paid.toLocaleString()} DH</span>
                                </div>
                            </div>
                            <div className="px-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('paymentProgress')}</span>
                                    <span className="text-[10px] font-bold text-teal-600">
                                        {metrics.montageMetrics.total > 0 ? ((metrics.montageMetrics.paid / metrics.montageMetrics.total) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <Progress value={metrics.montageMetrics.total > 0 ? (metrics.montageMetrics.paid / metrics.montageMetrics.total) * 100 : 0} className="h-1 bg-slate-100" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Cost Analysis */}
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-slate-50 px-8 py-6 bg-blue-50/20">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        {t('productCostsByCategory')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 flex flex-col h-[400px]">
                    <div className="space-y-3 pr-2 overflow-y-auto custom-scrollbar flex-1">
                        {Object.entries(metrics.productAnalysis.categories).length > 0 ? (
                            Object.entries(metrics.productAnalysis.categories).map(([category, data]) => (
                                <div key={category} className="group p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/80 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-[10px] uppercase">
                                                {category.substring(0, 2)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{category}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 text-sm">{data.cost.toLocaleString()} DH</p>
                                            <p className={cn("text-[10px] font-bold uppercase tracking-tight", data.margin >= 0 ? "text-emerald-500" : "text-red-400")}>
                                                {data.margin.toFixed(1)}% {t('margin')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                                <Package className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">{t('noDataFound')}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50">
                        <div className="flex justify-between items-center px-6 py-5 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('totalInventoryCost')}</span>
                                <span className="text-xl font-bold tracking-tight">{metrics.totalProductCosts.toLocaleString()} <span className="text-xs font-normal opacity-50 ml-1">DH</span></span>
                            </div>
                            <div className="p-2 bg-white/10 rounded-xl">
                                <Package className="h-5 w-5 text-teal-400" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuickExpenditureAnalysis;
