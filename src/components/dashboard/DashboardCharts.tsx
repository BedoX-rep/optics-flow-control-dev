import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, PieChart, Info } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface DashboardChartsProps {
    revenueData: Array<{ name: string; value: number }>;
    categoryData: Array<{ name: string; value: number }>;
}

const DashboardCharts = ({ revenueData, categoryData }: DashboardChartsProps) => {
    const { t } = useLanguage();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-white/40 p-4 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
                    <p className="text-lg font-black text-slate-800">DH {payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
            {/* Revenue Trend Chart */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="xl:col-span-8 bg-white border-none rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-lg bg-teal-50 flex items-center justify-center">
                                <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('revenuePerformance')}</h3>
                        </div>
                        <p className="text-slate-400 text-xs font-medium">{t('revenuePerformanceDesc') || "Tracking your daily sales conversion and growth."}</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-black tracking-widest uppercase">{t('daily')}</div>
                    </div>
                </div>

                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#14b8a6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Category Distribution Chart */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="xl:col-span-4 bg-white border-none rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300"
            >
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <PieChart className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('salesByCategory')}</h3>
                        </div>
                        <p className="text-slate-400 text-xs font-medium">{t('salesByCategoryDesc') || "Revenue distribution by product type."}</p>
                    </div>
                </div>

                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: -20, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }}
                                width={100}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={['#14b8a6', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6'][index % 5]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardCharts;
