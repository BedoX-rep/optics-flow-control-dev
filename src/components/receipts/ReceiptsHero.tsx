import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, FileText, BarChart2, CheckCircle, Clock, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

interface ReceiptsHeroProps {
    onNewReceipt: () => void;
    onViewStats: () => void;
    receipts: any[];
}

const ReceiptsHero = ({
    onNewReceipt,
    onViewStats,
    receipts
}: ReceiptsHeroProps) => {
    const { t } = useLanguage();

    const isCurrentMonth = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const stats = {
        total: receipts.length,
        unpaid: receipts.filter(r => r.balance > 0).length,
        pending: receipts.filter(r => r.delivery_status !== 'Completed').length,
        undeliveredMonth: receipts.filter(r => r.delivery_status !== 'Completed' && isCurrentMonth(r.created_at)).length,
        pendingMonth: receipts.filter(r => r.balance > 0 && isCurrentMonth(r.created_at)).length,
        totalAmount: receipts.reduce((sum, r) => sum + (r.total || 0), 0)
    };

    return (
        <div className="w-full px-4 lg:px-6 pt-6 relative z-10">
            <div className="w-full bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 text-white rounded-[32px] py-10 px-8 md:px-12 shadow-xl relative overflow-hidden mb-8">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mb-40 blur-3xl" />

                <div className="w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col xl:flex-row xl:items-center justify-between gap-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                    <FileText className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white uppercase mb-2">
                                        {t('receiptsOverview') || 'Receipts Overview'}
                                    </h1>
                                    <p className="text-white/70 font-medium tracking-wide text-sm uppercase">
                                        {t('manageOrders') || 'Manage and track all customer orders'}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px md:h-12 w-full md:w-px bg-white/20" />

                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100/60 mb-1">Total Orders</span>
                                    <span className="text-2xl font-black text-white">{stats.total}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/60 mb-1">Undelivered (Month)</span>
                                    <span className="text-2xl font-black text-rose-300">{stats.undeliveredMonth}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/60 mb-1">Pending Receipts (Month)</span>
                                    <span className="text-2xl font-black text-amber-300">{stats.pendingMonth}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={onViewStats}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-6 h-12 md:h-14 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <BarChart2 className="mr-3 h-5 w-5" /> {t('statistics')}
                            </Button>

                            <Button
                                onClick={onNewReceipt}
                                className="bg-teal-400 hover:bg-teal-300 text-teal-950 border-0 rounded-2xl px-8 h-12 md:h-14 font-black shadow-2xl shadow-teal-900/40 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="mr-3 h-5 w-5" /> {t('newReceipt')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptsHero;
