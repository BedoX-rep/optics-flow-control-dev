import React from "react";
import { Filter, Calendar, Tag, Truck, ShoppingBag, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

export interface PurchaseFiltersProps {
    dateFilter: string;
    categoryFilter: string;
    supplierFilter: string;
    purchaseTypeFilter: string;
    categories: string[];
    suppliers: Array<{ id: string; name: string }>;
    onFilterChange: (key: string, value: string) => void;
}

const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
    dateFilter,
    categoryFilter,
    supplierFilter,
    purchaseTypeFilter,
    categories,
    suppliers,
    onFilterChange
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 no-scrollbar mb-6">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => onFilterChange('date', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[140px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    dateFilter !== 'all'
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Calendar className={cn("h-4 w-4 flex-shrink-0", dateFilter !== 'all' ? "text-indigo-600" : "text-slate-400")} />
                        <span className="truncate">
                            {dateFilter === 'all' ? t('date') :
                                dateFilter === 'today' ? t('today') :
                                    dateFilter === 'week' ? t('thisWeek') :
                                        dateFilter === 'month' ? t('thisMonth') : t('thisYear')}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">{t('allDates')}</SelectItem>
                    <SelectItem value="today">{t('today')}</SelectItem>
                    <SelectItem value="week">{t('thisWeek')}</SelectItem>
                    <SelectItem value="month">{t('thisMonth')}</SelectItem>
                    <SelectItem value="year">{t('thisYear')}</SelectItem>
                </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(v) => onFilterChange('category', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[150px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    categoryFilter !== 'all'
                        ? "bg-teal-50 text-teal-700 border-teal-200 shadow-teal-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Tag className={cn("h-4 w-4 flex-shrink-0", categoryFilter !== 'all' ? "text-teal-600" : "text-slate-400")} />
                        <span className="truncate">
                            {categoryFilter === 'all' ? t('category') : categoryFilter}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">{t('allCategories')}</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Supplier Filter */}
            <Select value={supplierFilter} onValueChange={(v) => onFilterChange('supplier', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[160px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    supplierFilter !== 'all'
                        ? "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-amber-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <Truck className={cn("h-4 w-4 flex-shrink-0", supplierFilter !== 'all' ? "text-amber-600" : "text-slate-400")} />
                        <span className="truncate">
                            {supplierFilter === 'all' ? t('supplier') :
                                suppliers.find(s => s.id === supplierFilter)?.name || t('supplier')}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">{t('allSuppliers')}</SelectItem>
                    {suppliers.map(sup => (
                        <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Purchase Type Filter */}
            <Select value={purchaseTypeFilter} onValueChange={(v) => onFilterChange('purchaseType', v)}>
                <SelectTrigger className={cn(
                    "h-12 w-[180px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
                    purchaseTypeFilter !== 'all'
                        ? "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100/50"
                        : "bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-md text-slate-600"
                )}>
                    <div className="flex items-center gap-2 truncate">
                        <ShoppingBag className={cn("h-4 w-4 flex-shrink-0", purchaseTypeFilter !== 'all' ? "text-purple-600" : "text-slate-400")} />
                        <span className="truncate">
                            {purchaseTypeFilter === 'all' ? t('purchaseType') : purchaseTypeFilter}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    <SelectItem value="Operational Expenses">{t('operationalExpenses')}</SelectItem>
                    <SelectItem value="Capital Expenditure">{t('capitalExpenditure')}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default PurchaseFilters;
