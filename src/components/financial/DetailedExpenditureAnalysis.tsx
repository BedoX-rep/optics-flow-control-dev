import React, { useState } from 'react';
import { Building2, Filter, DollarSign, Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden mb-10 rounded-3xl">
            <CardHeader
                className="border-b border-slate-50 px-8 py-6 bg-slate-900/5 cursor-pointer hover:bg-slate-900/10 transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-teal-600" />
                            {t('detailedExpenditureAnalysis')}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1 font-medium">{t('trackingOperationalAndCapitalExpenditure')}</p>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-colors ml-2">
                        {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-teal-600" />}
                    </div>
                </div>
            </CardHeader>

            {!isCollapsed && (
                <CardContent className="px-8 py-8">
                    {/* Subdued Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('type')}</Label>
                            <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
                                <SelectTrigger className="bg-white border-slate-100 shadow-sm rounded-2xl h-11 text-xs font-poppins font-bold transition-all hover:border-teal-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 font-poppins">
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    <SelectItem value="Capital Expenditure">{t('capitalExpenditure')}</SelectItem>
                                    <SelectItem value="Operational Expenses">{t('operationalExpenses')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('status')}</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-white border-slate-100 shadow-sm rounded-2xl h-11 text-xs font-poppins font-bold transition-all hover:border-teal-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 font-poppins">
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    <SelectItem value="paid">{t('paid')}</SelectItem>
                                    <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                                    <SelectItem value="partial">{t('partiallyPaid')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('supplier')}</Label>
                            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                                <SelectTrigger className="bg-white border-slate-100 shadow-sm rounded-2xl h-11 text-xs font-poppins font-bold transition-all hover:border-teal-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 font-poppins">
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Purchases List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar mb-10">
                        {purchases.length > 0 ? (
                            purchases.map((purchase) => {
                                const total = purchase.amount_ttc || purchase.amount || 0;
                                const paid = purchase.advance_payment || 0;
                                const outstanding = total - paid;
                                const progress = total > 0 ? (paid / total) * 100 : 0;

                                return (
                                    <div key={purchase.id} className="group p-6 border border-slate-50 rounded-[32px] bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                                                    <Building2 className="h-6 w-6 text-teal-600" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800 tracking-tight leading-snug">{purchase.description}</h5>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                            purchase.purchase_type === 'Capital Expenditure' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                                                        )}>
                                                            {purchase.purchase_type}
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                                            {purchase.supplier?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1.5">
                                                        <Calendar className="h-2.5 w-2.5" />
                                                        {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col justify-between">
                                                <div>
                                                    <p className="text-xl font-black text-slate-900">{total.toLocaleString()} DH</p>
                                                    <div className="flex items-center justify-end gap-2 mt-1">
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                            outstanding <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                        )}>
                                                            {outstanding <= 0 ? t('full') : t('partial')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100/50">
                                            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                <div className="flex gap-4">
                                                    <span>{t('paid')}: <span className="text-emerald-500">{paid.toLocaleString()} DH</span></span>
                                                    <span>{t('outstanding')}: <span className="text-rose-500">{outstanding.toLocaleString()} DH</span></span>
                                                </div>
                                                <span>{progress.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={progress} className="h-1 bg-white" />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <DollarSign className="h-12 w-12 text-slate-100 mb-2" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('noData')}</p>
                            </div>
                        )}
                    </div>

                    {/* Warm Summary Footer */}
                    <div className="flex justify-end border-t border-slate-50 pt-10">
                        <div className="w-full md:w-[320px] p-8 rounded-[40px] bg-teal-900 text-white shadow-2xl shadow-teal-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-400/80 mb-6">{t('summary')}</h4>
                            <div className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-teal-200/60 uppercase tracking-wide">{t('totalAmount')}</span>
                                    <span className="text-2xl font-black text-white">{filteredSummary.total.toLocaleString()} DH</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-teal-200/60 uppercase tracking-wide">{t('paid')}</span>
                                    <span className="text-lg font-bold text-emerald-400">{filteredSummary.paid.toLocaleString()} DH</span>
                                </div>
                                <div className="flex justify-between items-end border-t border-teal-800 pt-5">
                                    <span className="text-xs font-bold text-teal-200/60 uppercase tracking-wide">{t('outstanding')}</span>
                                    <span className="text-lg font-bold text-rose-400">{filteredSummary.outstanding.toLocaleString()} DH</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default DetailedExpenditureAnalysis;
