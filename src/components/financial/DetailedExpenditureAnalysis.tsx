import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface DetailedExpenditureAnalysisProps {
    purchases: any[];
    expenseTypeFilter: string;
    setExpenseTypeFilter: (val: string) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    supplierFilter: string;
    setSupplierFilter: (val: string) => void;
    filteredSummary: {
        total: number;
        paid: number;
        outstanding: number;
        count: number;
    };
}

const DetailedExpenditureAnalysis: React.FC<DetailedExpenditureAnalysisProps> = ({
    purchases,
    expenseTypeFilter,
    setExpenseTypeFilter,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    filteredSummary,
}) => {
    const { t } = useLanguage();
    const suppliers = Array.from(new Set(purchases.map(p => p.supplier?.name || 'Unknown')));
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mb-12">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between group mb-4"
            >
                <div className="flex items-center gap-4">
                    <div className="h-1.5 w-10 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all group-hover:w-16 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {t('detailedExpenditureAnalysis')}
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

                                {/* Smarter, Inline Filters Bar */}
                                <div className="p-6 md:p-8 border-b border-slate-100 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                                        <div className="p-2 bg-slate-50 rounded-full hidden md:flex items-center justify-center shrink-0">
                                            <Filter className="w-4 h-4 text-blue-600" />
                                        </div>

                                        <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
                                            <SelectTrigger className="w-auto min-w-[140px] bg-slate-50 border-slate-200 rounded-2xl h-10 text-xs font-black transition-all hover:border-blue-500 focus:ring-blue-500">
                                                <SelectValue placeholder={t('type')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200">
                                                <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
                                                <SelectItem value="Capital Expenditure">{t('capitalExpenditure')}</SelectItem>
                                                <SelectItem value="Operational Expenses">{t('operationalExpenses')}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-auto min-w-[130px] bg-slate-50 border-slate-200 rounded-2xl h-10 text-xs font-black transition-all hover:border-blue-500 focus:ring-blue-500">
                                                <SelectValue placeholder={t('status')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200">
                                                <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
                                                <SelectItem value="paid">{t('paid')}</SelectItem>
                                                <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                                                <SelectItem value="partial">{t('partiallyPaid')}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                                            <SelectTrigger className="w-auto min-w-[140px] bg-slate-50 border-slate-200 rounded-2xl h-10 text-xs font-black transition-all hover:border-blue-500 focus:ring-blue-500">
                                                <SelectValue placeholder={t('supplier')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200">
                                                <SelectItem value="all">{t('allSuppliers') || 'All Suppliers'}</SelectItem>
                                                {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-2xl shrink-0">
                                        {filteredSummary.count} {t('items')}
                                    </div>
                                </div>

                                {/* List Container */}
                                <div className="p-8 md:p-10 bg-slate-50/50">
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {purchases.length > 0 ? (
                                            purchases.map((purchase) => {
                                                const total = purchase.amount_ttc || purchase.amount || 0;
                                                const paid = purchase.advance_payment || 0;
                                                const outstanding = total - paid;
                                                const progress = total > 0 ? (paid / total) * 100 : 0;

                                                const isCapEx = purchase.purchase_type === 'Capital Expenditure';

                                                // Theme colors matched precisely with QuickExpenditureAnalysis styling
                                                const themeColor = {
                                                    cardHover: isCapEx ? 'hover:border-teal-500 hover:shadow-teal-900/10' : 'hover:border-blue-500 hover:shadow-blue-900/10',
                                                    iconArea: isCapEx ? 'bg-teal-50 border-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white' : 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
                                                    pill: isCapEx ? 'text-teal-600' : 'text-blue-600',
                                                    progressLeft: isCapEx ? 'bg-teal-100 group-hover/progress:bg-teal-600' : 'bg-blue-100 group-hover/progress:bg-blue-600',
                                                    progressBg: isCapEx ? 'bg-teal-50' : 'bg-blue-50',
                                                    progressFill: isCapEx ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]' : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]',
                                                    textMain: isCapEx ? 'text-teal-600' : 'text-blue-600',
                                                };

                                                return (
                                                    <div key={purchase.id} className={cn("flex flex-col p-6 rounded-3xl bg-white border border-slate-200 transition-all group", themeColor.cardHover)}>
                                                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                                            <div className="flex items-start gap-4">
                                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all border", themeColor.iconArea)}>
                                                                    {purchase.id.toString().substring(0, 3)}
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-black text-slate-900 tracking-tight text-lg leading-none mb-2">{purchase.description}</h5>
                                                                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                                                                            {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                                                                        </span>
                                                                        <span className={cn("bg-slate-100 px-2 py-0.5 rounded-md", themeColor.pill)}>
                                                                            {purchase.purchase_type}
                                                                        </span>
                                                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                                                                            {purchase.supplier?.name || 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                                                    {total.toLocaleString()} <span className="text-sm font-bold text-slate-500 ml-1">DH</span>
                                                                </p>
                                                                <div className={cn(
                                                                    "inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 border",
                                                                    outstanding <= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                                                )}>
                                                                    {outstanding <= 0 ? t('full') : t('partial')}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Progress Area aligned with QEA style */}
                                                        <div className="group/progress relative pl-8">
                                                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors rounded-full", themeColor.progressLeft)} />
                                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                                <div className="flex gap-4">
                                                                    <span className="text-slate-900">{t('paid')}: <span className="text-emerald-600">{paid.toLocaleString()} DH</span></span>
                                                                    <span className="text-slate-900">{t('outstanding')}: <span className="text-rose-600">{outstanding.toLocaleString()} DH</span></span>
                                                                </div>
                                                                <span className={themeColor.textMain}>{progress.toFixed(0)}%</span>
                                                            </div>
                                                            <div className={cn("flex-1 h-2 rounded-full overflow-hidden", themeColor.progressBg)}>
                                                                <div
                                                                    className={cn("h-full transition-all duration-1000", themeColor.progressFill)}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="h-40 flex items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-[24px]">
                                                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">{t('noDataFound')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Footer */}
                                    <div className="mt-10 bg-slate-900 rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden group shadow-2xl">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 rounded-full -mr-24 -mt-24 blur-3xl transition-all" />
                                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/20 rounded-full -ml-20 -mb-20 blur-3xl transition-all" />

                                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-8">
                                            <div>
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-2">
                                                    {t('totalAmount')}
                                                </span>
                                                <p className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                                    {filteredSummary.total.toLocaleString()} <span className="text-lg font-bold text-slate-500 ml-1">DH</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-12">
                                                <div className="relative pl-6">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                                                        {t('paid')}
                                                    </span>
                                                    <p className="text-2xl font-black text-emerald-400">
                                                        {filteredSummary.paid.toLocaleString()} <span className="text-sm font-bold text-slate-500">DH</span>
                                                    </p>
                                                </div>
                                                <div className="relative pl-6">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-full" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                                                        {t('outstanding')}
                                                    </span>
                                                    <p className="text-2xl font-black text-rose-500">
                                                        {filteredSummary.outstanding.toLocaleString()} <span className="text-sm font-bold text-slate-500">DH</span>
                                                    </p>
                                                </div>
                                                <div className="hidden md:block h-5 w-5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse ml-4" />
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

export default DetailedExpenditureAnalysis;
