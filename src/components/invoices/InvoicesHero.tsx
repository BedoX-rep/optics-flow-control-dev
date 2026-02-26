import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, TrendingUp, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

interface InvoicesHeroProps {
    onAddInvoice: () => void;
    invoices: any[];
}

const InvoicesHero = ({
    onAddInvoice,
    invoices
}: InvoicesHeroProps) => {
    const { t } = useLanguage();

    const isCurrentMonth = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const stats = {
        total: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        monthlyAmount: invoices
            .filter(inv => isCurrentMonth(inv.invoice_date))
            .reduce((sum, inv) => sum + (inv.total || 0), 0),
        pendingAmount: invoices
            .filter(inv => inv.status !== 'Paid')
            .reduce((sum, inv) => sum + (inv.balance || 0), 0),
    };

    return (
        <div className="w-full px-4 lg:px-6 pt-6 relative z-10">
            <div className="w-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-600 text-white rounded-[32px] py-10 px-8 md:px-12 shadow-xl relative overflow-hidden mb-8">
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
                                        {t('invoicesOverview') || 'Invoices Overview'}
                                    </h1>
                                    <p className="text-white/70 font-medium tracking-wide text-sm uppercase">
                                        {t('invoicesOverviewDesc') || 'Track and manage your customer invoices'}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px md:h-12 w-full md:w-px bg-white/20" />

                            <div className="flex flex-wrap items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100/60 mb-1">{t('totalAmount') || 'Total Amount'}</span>
                                    <span className="text-2xl font-black text-white">{stats.totalAmount.toFixed(2)} DH</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100/60 mb-1">{t('thisMonth') || 'This Month'}</span>
                                    <span className="text-2xl font-black text-teal-300">{stats.monthlyAmount.toFixed(2)} DH</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/60 mb-1">{t('pendingPayments') || 'Pending'}</span>
                                    <span className="text-2xl font-black text-rose-300">{stats.pendingAmount.toFixed(2)} DH</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={onAddInvoice}
                                className="bg-teal-400 hover:bg-teal-300 text-teal-950 border-0 rounded-2xl px-8 h-12 md:h-14 font-black shadow-2xl shadow-teal-900/40 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="mr-3 h-5 w-5" /> {t('addInvoice') || 'Add Invoice'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div >
        </div >
    );
};

export default InvoicesHero;
