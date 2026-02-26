import React, { useState } from 'react';
import { TrendingUp, DollarSign, Wallet, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

interface FinancialMetricsGridProps {
    metrics: {
        availableCash: number;
        totalRevenue: number;
        netProfitAfterAllExpenses: number;
        totalReceived: number;
        totalOutstanding: number;
        totalProductCosts: number;
        operationalExpenses: { total: number; paid: number };
        montageMetrics: { total: number; paid: number };
        netMarginTotal: number;
        grossProfit: number;
    };
}

const FinancialMetricsGrid: React.FC<FinancialMetricsGridProps> = ({ metrics }) => {
    const { t } = useLanguage();
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const toggleExpand = (card: string) => {
        setExpandedCard(expandedCard === card ? null : card);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Available Cash Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300 rounded-3xl">
                <CardContent className="p-8 relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-teal-50/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />

                    <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('availableCash')}</span>
                                <h3 className="text-3xl font-black text-slate-900 leading-tight">
                                    {metrics.availableCash.toLocaleString()} <span className="text-sm font-medium opacity-40">DH</span>
                                </h3>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50">
                            <button
                                onClick={() => toggleExpand('cash')}
                                className="flex justify-between items-center w-full text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors"
                            >
                                <span className="flex items-center gap-1.5"><Calculator className="h-3 w-3" /> {t('viewCalculation')}</span>
                                {expandedCard === 'cash' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>

                            {expandedCard === 'cash' && (
                                <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('totalReceived')}</span>
                                        <span className="text-slate-900">+{metrics.totalReceived.toLocaleString()} DH</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('paidExpenses')}</span>
                                        <span className="text-rose-500">-{metrics.operationalExpenses.paid.toLocaleString()} DH</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('paidMontage')}</span>
                                        <span className="text-rose-500">-{metrics.montageMetrics.paid.toLocaleString()} DH</span>
                                    </div>
                                    <div className="border-t border-slate-50 pt-2 flex justify-between text-[10px] font-black text-slate-900 uppercase">
                                        <span>{t('netCash')}</span>
                                        <span>{metrics.availableCash.toLocaleString()} DH</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Total Revenue Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300 rounded-3xl">
                <CardContent className="p-8 relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />

                    <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('totalRevenue')}</span>
                                <h3 className="text-3xl font-black text-slate-900 leading-tight">
                                    {metrics.totalRevenue.toLocaleString()} <span className="text-sm font-medium opacity-40">DH</span>
                                </h3>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50">
                            <button
                                onClick={() => toggleExpand('revenue')}
                                className="flex justify-between items-center w-full text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <span className="flex items-center gap-1.5"><Calculator className="h-3 w-3" /> {t('viewCalculation')}</span>
                                {expandedCard === 'revenue' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>

                            {expandedCard === 'revenue' && (
                                <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('paymentCollected')}</span>
                                        <span className="text-emerald-600">{metrics.totalReceived.toLocaleString()} DH</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('outstanding')}</span>
                                        <span className="text-rose-500">{metrics.totalOutstanding.toLocaleString()} DH</span>
                                    </div>
                                    <div className="border-t border-slate-50 pt-2 flex justify-between text-[10px] font-black text-slate-900 uppercase">
                                        <span>{t('totalInvoiced')}</span>
                                        <span>{metrics.totalRevenue.toLocaleString()} DH</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Net Profit Card */}
            <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300 rounded-3xl">
                <CardContent className="p-8 relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />

                    <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('netProfit')}</span>
                                <h3 className="text-3xl font-black text-slate-900 leading-tight">
                                    {metrics.netProfitAfterAllExpenses.toLocaleString()} <span className="text-sm font-medium opacity-40">DH</span>
                                </h3>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50">
                            <button
                                onClick={() => toggleExpand('profit')}
                                className="flex justify-between items-center w-full text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                <span className="flex items-center gap-1.5"><Calculator className="h-3 w-3" /> {t('viewCalculation')}</span>
                                {expandedCard === 'profit' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>

                            {expandedCard === 'profit' && (
                                <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('grossProfit')}</span>
                                        <span className="text-emerald-600">{metrics.grossProfit.toLocaleString()} DH</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('opExpenses')}</span>
                                        <span className="text-rose-500">-{metrics.operationalExpenses.total.toLocaleString()} DH</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{t('montageCosts')}</span>
                                        <span className="text-rose-500">-{metrics.montageMetrics.total.toLocaleString()} DH</span>
                                    </div>
                                    <div className="border-t border-slate-50 pt-2 flex justify-between text-[10px] font-black text-slate-900 uppercase">
                                        <span>{t('netProfit')}</span>
                                        <span>{metrics.netProfitAfterAllExpenses.toLocaleString()} DH</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FinancialMetricsGrid;
