import React from "react";
import { Filter, Calendar, Tag, Package, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

export interface InvoiceFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    dateFilter: string;
    dateRange: { from: Date | undefined; to: Date | undefined };
    statusFilter: string;
    onFilterChange: (key: string, value: any) => void;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
    searchTerm,
    onSearchChange,
    dateFilter,
    dateRange,
    statusFilter,
    onFilterChange
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative group max-w-md w-full">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder={t('searchInvoices') || 'Search invoices...'}
                        className="pl-12 h-14 bg-white/80 backdrop-blur-md border-slate-100 shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600 font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                {/* Date Filter */}
                <DateRangeFilter
                    dateFilter={dateFilter}
                    dateRange={dateRange}
                    onFilterChange={onFilterChange}
                    accentColor="indigo"
                />

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => onFilterChange('status', v)}>
                    <SelectTrigger className={cn(
                        "h-12 w-[140px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                        statusFilter !== 'all'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50"
                            : "bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md text-slate-600"
                    )}>
                        <div className="flex items-center gap-2 truncate">
                            <Package className={cn("h-4 w-4 flex-shrink-0", statusFilter !== 'all' ? "text-emerald-600" : "text-slate-400")} />
                            <span className="truncate">
                                {statusFilter === 'all' ? t('status') : statusFilter}
                            </span>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                        <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
                        <SelectItem value="Draft">{t('draft')}</SelectItem>
                        <SelectItem value="Pending">{t('pending')}</SelectItem>
                        <SelectItem value="Paid">{t('paid')}</SelectItem>
                        <SelectItem value="Overdue">{t('overdue')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default InvoiceFilters;
