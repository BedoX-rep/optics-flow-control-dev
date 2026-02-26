
import React from "react";
import { Filter, Calendar, Wallet, Package, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

export interface ReceiptFiltersProps {
    dateFilter: string;
    paymentFilter: string;
    deliveryFilter: string;
    montageFilter: string;
    onFilterChange: (key: string, value: string) => void;
}

const ReceiptFilters: React.FC<ReceiptFiltersProps> = ({
    dateFilter,
    paymentFilter,
    deliveryFilter,
    montageFilter,
    onFilterChange
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => onFilterChange('date', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[140px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    dateFilter !== 'all'
                        ? "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Calendar className={cn("h-4 w-4 flex-shrink-0", dateFilter !== 'all' ? "text-blue-600" : "text-slate-400")} />
                        <span className="truncate">
                            {dateFilter === 'all' ? t('date') :
                                dateFilter === 'today' ? t('today') :
                                    dateFilter === 'week' ? t('thisWeek') :
                                        dateFilter === 'month' ? t('thisMonth') : t('thisYear')}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">
                        <div className="flex items-center gap-2 py-0.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{t('allDates')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="today">
                        <div className="flex items-center gap-2 py-0.5">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{t('today')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="week">
                        <div className="flex items-center gap-2 py-0.5">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{t('thisWeek')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="month">
                        <div className="flex items-center gap-2 py-0.5">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{t('thisMonth')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="year">
                        <div className="flex items-center gap-2 py-0.5">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{t('thisYear')}</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={(v) => onFilterChange('payment', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[140px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    paymentFilter !== 'all'
                        ? (paymentFilter === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50" :
                            paymentFilter === 'partial' ? "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50" :
                                "bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100/50")
                        : "bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Wallet className={cn("h-4 w-4 flex-shrink-0", paymentFilter !== 'all' ? (paymentFilter === 'paid' ? "text-emerald-600" : paymentFilter === 'partial' ? "text-amber-600" : "text-rose-600") : "text-slate-400")} />
                        <span className="truncate">
                            {paymentFilter === 'all' ? t('payment') :
                                paymentFilter === 'paid' ? t('paid') :
                                    paymentFilter === 'partial' ? t('partial') : t('unpaid')}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">
                        <div className="flex items-center gap-2 py-0.5">
                            <Wallet className="h-4 w-4 text-slate-400" />
                            <span>{t('allPayments')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="paid">
                        <div className="flex items-center gap-2 py-0.5">
                            <Wallet className="h-4 w-4 text-emerald-500" />
                            <span>{t('paid')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="partial">
                        <div className="flex items-center gap-2 py-0.5">
                            <Wallet className="h-4 w-4 text-amber-500" />
                            <span>{t('partial')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="unpaid">
                        <div className="flex items-center gap-2 py-0.5">
                            <Wallet className="h-4 w-4 text-rose-500" />
                            <span>{t('unpaid')}</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Delivery Filter */}
            <Select value={deliveryFilter} onValueChange={(v) => onFilterChange('delivery', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[140px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    deliveryFilter !== 'all'
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Package className={cn("h-4 w-4 flex-shrink-0", deliveryFilter !== 'all' ? "text-indigo-600" : "text-slate-400")} />
                        <span className="truncate">
                            {deliveryFilter === 'all' ? t('deliveryLabel') :
                                deliveryFilter === 'Completed' ? t('delivered') : t('undelivered')}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">
                        <div className="flex items-center gap-2 py-0.5">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span>{t('allDeliveries')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="Completed">
                        <div className="flex items-center gap-2 py-0.5">
                            <Package className="h-4 w-4 text-indigo-500" />
                            <span>{t('delivered')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="Undelivered">
                        <div className="flex items-center gap-2 py-0.5">
                            <Package className="h-4 w-4 text-rose-500" />
                            <span>{t('undelivered')}</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* Montage Status Filter */}
            <Select value={montageFilter} onValueChange={(v) => onFilterChange('montage', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[160px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    montageFilter !== 'all'
                        ? "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Filter className={cn("h-4 w-4 flex-shrink-0", montageFilter !== 'all' ? "text-purple-600" : "text-slate-400")} />
                        <span className="truncate">
                            {montageFilter === 'all' ? t('montageLabel') : (
                                montageFilter === 'UnOrdered' ? t('unOrdered') :
                                    montageFilter === 'Ordered' ? t('ordered') :
                                        montageFilter === 'InStore' ? t('inStore') :
                                            montageFilter === 'InCutting' ? t('inCutting') :
                                                montageFilter === 'Ready' ? t('ready') : t('paidCosts')
                            )}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <span>{t('allMontageStatuses') || 'All Statuses'}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="UnOrdered">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-purple-500" />
                            <span>{t('unOrdered')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="Ordered">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-purple-500" />
                            <span>{t('ordered')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="InStore">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-purple-500" />
                            <span>{t('inStore')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="InCutting">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-purple-500" />
                            <span>{t('inCutting')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="Ready">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-purple-500" />
                            <span>{t('ready')}</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="Paid costs">
                        <div className="flex items-center gap-2 py-0.5">
                            <Filter className="h-4 w-4 text-purple-500" />
                            <span>{t('paidCosts')}</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default ReceiptFilters;
