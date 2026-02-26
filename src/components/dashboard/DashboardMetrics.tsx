import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Receipt, Wallet, ShoppingBag, Glasses, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

interface MetricProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    color: 'teal' | 'indigo' | 'orange' | 'emerald';
    isLoading: boolean;
}

const MetricRow = ({ title, value, icon, change, color, isLoading }: MetricProps) => {
    const colorStyles = {
        teal: "text-teal-600 bg-teal-50",
        indigo: "text-indigo-600 bg-indigo-50",
        orange: "text-orange-600 bg-orange-50",
        emerald: "text-emerald-600 bg-emerald-50",
    };

    return (
        <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-3 rounded-2xl transition-transform group-hover:scale-110",
                    colorStyles[color]
                )}>
                    {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</p>
            </div>

            <div className="flex items-center gap-6">
                {change !== undefined && (
                    <div className={cn(
                        "hidden sm:flex items-center px-2 py-1 rounded-md text-[10px] font-black tracking-wider uppercase",
                        change >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                    )}>
                        {change >= 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                        {Math.abs(change)}%
                    </div>
                )}
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-right min-w-[120px]">
                    {isLoading ? (
                        <div className="h-7 w-full bg-slate-100 animate-pulse rounded-lg" />
                    ) : value}
                </h3>
            </div>
        </div>
    );
};

interface DashboardMetricsProps {
    stats: {
        newClients: number;
        totalRevenue: number;
        avgSaleValue: number;
        pendingBalance: number;
        pendingReceipts: number;
        completedReceipts: number;
        additionalCosts: number;
        unpaidAdditionalCosts: number;
    };
    isLoading: boolean;
}

const DashboardMetrics = ({ stats, isLoading }: DashboardMetricsProps) => {
    const { t } = useLanguage();

    const metricsLeft = [
        {
            title: t('monthlyRevenue'),
            value: `DH ${stats.totalRevenue.toLocaleString()}`,
            icon: <TrendingUp />,
            change: 5.2,
            color: "teal" as const
        },
        {
            title: t('avgOrderValue'),
            value: `DH ${stats.avgSaleValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: <Receipt />,
            color: "indigo" as const
        },
        {
            title: t('newClients'),
            value: stats.newClients,
            icon: <Users />,
            change: 12,
            color: "emerald" as const
        },
        {
            title: t('completedOrders'),
            value: stats.completedReceipts,
            icon: <ShoppingBag />,
            color: "teal" as const
        }
    ];

    const metricsRight = [
        {
            title: t('pendingBalance'),
            value: `DH ${stats.pendingBalance.toLocaleString()}`,
            icon: <Wallet />,
            color: "orange" as const
        },
        {
            title: t('additionalCostsToBePaid'),
            value: `DH ${stats.unpaidAdditionalCosts.toLocaleString()}`,
            icon: <Glasses />,
            color: "indigo" as const
        },
        {
            title: t('pendingReceipts'),
            value: stats.pendingReceipts,
            icon: <Calendar />,
            color: "orange" as const
        }
    ];

    return (
        <div className="mb-12">
            <div className="flex items-center gap-2 mb-6 ml-1">
                <div className="h-6 w-6 rounded-lg bg-teal-50 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                    {t('financialData')}
                </h3>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative">
                {/* Visual gradient anchor */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-indigo-400 to-orange-400" />

                <div className="grid grid-cols-1 lg:grid-cols-2 pt-1">
                    <div className="border-b lg:border-b-0 lg:border-r border-slate-100">
                        {metricsLeft.map((metric, i) => (
                            <MetricRow key={i} {...metric} isLoading={isLoading} />
                        ))}
                    </div>
                    <div>
                        {metricsRight.map((metric, i) => (
                            <MetricRow key={i} {...metric} isLoading={isLoading} />
                        ))}
                        {/* Empty filler row to balance the 4 vs 3 layout visually on desktop */}
                        <div className="hidden lg:flex items-center justify-between p-6 border-slate-100 h-[104px]">
                            <div className="w-1/2 h-px bg-slate-50/50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardMetrics;
