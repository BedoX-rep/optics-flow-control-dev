
import React from "react";
import { Filter, Glasses, Album, Building2, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCompanies } from "@/hooks/useCompanies";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses",
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories",
  "Service",
  "Other"
];

const INDEX_OPTIONS = ["1.50", "1.56", "1.59", "1.6", "1.67", "1.74"];
const TREATMENT_OPTIONS = ["White", "AR", "Blue", "Photochromic", "Polarized", "UV protection", "Tint"];

const STOCK_STATUS_OPTIONS = ["Order", "inStock", "Fabrication", "Out Of Stock"];

export interface ProductFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  const { allCompanies } = useCompanies();
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
      {/* Category Filter */}
      <Select value={filters.category || "all_categories"} onValueChange={v => onChange({ category: v })}>
        <SelectTrigger className={cn(
          "h-12 w-[130px] sm:w-[150px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
          filters.category !== 'all_categories'
            ? "bg-teal-50 text-teal-700 border-teal-200 shadow-teal-100/50"
            : "bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md text-slate-600"
        )}>
          <div className="flex items-center gap-2 truncate">
            <Glasses className={cn("h-4 w-4 flex-shrink-0", filters.category !== 'all_categories' ? "text-teal-600" : "text-slate-400")} />
            <span className="truncate">
              {filters.category === 'all_categories' ? t('filterCategory') : t(filters.category.replace(/\s+/g, '').toLowerCase())}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
          <SelectItem value="all_categories">
            <div className="flex items-center gap-2 py-0.5">
              <Glasses className="h-4 w-4 text-slate-400" />
              <span>{t('allCategories')}</span>
            </div>
          </SelectItem>
          {CATEGORY_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2 py-0.5">
                <Glasses className="h-4 w-4 text-teal-500" />
                <span>{t(opt.replace(/\s+/g, '').toLowerCase())}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Index Filter */}
      <Select value={filters.index || "all_indexes"} onValueChange={v => onChange({ index: v })}>
        <SelectTrigger className={cn(
          "h-12 w-[110px] sm:w-[130px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
          filters.index !== 'all_indexes'
            ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100/50"
            : "bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md text-slate-600"
        )}>
          <div className="flex items-center gap-2 truncate">
            <Album className={cn("h-4 w-4 flex-shrink-0", filters.index !== 'all_indexes' ? "text-indigo-600" : "text-slate-400")} />
            <span className="truncate">
              {filters.index === 'all_indexes' ? t('filterIndex') : filters.index}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
          <SelectItem value="all_indexes">
            <div className="flex items-center gap-2 py-0.5">
              <Album className="h-4 w-4 text-slate-400" />
              <span>{t('allIndexes')}</span>
            </div>
          </SelectItem>
          {INDEX_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2 py-0.5">
                <Album className="h-4 w-4 text-indigo-500" />
                <span>{opt}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Treatment Filter */}
      <Select value={filters.treatment || "all_treatments"} onValueChange={v => onChange({ treatment: v })}>
        <SelectTrigger className={cn(
          "h-12 w-[130px] sm:w-[150px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
          filters.treatment !== 'all_treatments'
            ? "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100/50"
            : "bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-md text-slate-600"
        )}>
          <div className="flex items-center gap-2 truncate">
            <Filter className={cn("h-4 w-4 flex-shrink-0", filters.treatment !== 'all_treatments' ? "text-purple-600" : "text-slate-400")} />
            <span className="truncate">
              {filters.treatment === 'all_treatments' ? t('filterTreatment') : t(filters.treatment.toLowerCase())}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
          <SelectItem value="all_treatments">
            <div className="flex items-center gap-2 py-0.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>{t('allTreatments')}</span>
            </div>
          </SelectItem>
          {TREATMENT_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2 py-0.5">
                <Filter className="h-4 w-4 text-purple-500" />
                <span>{t(opt.toLowerCase())}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Company Filter */}
      <Select value={filters.company || "all_companies"} onValueChange={v => onChange({ company: v })}>
        <SelectTrigger className={cn(
          "h-12 w-[130px] sm:w-[150px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
          filters.company !== 'all_companies'
            ? "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50"
            : "bg-slate-50/50 hover:bg-white hover:border-amber-200 hover:shadow-md text-slate-600"
        )}>
          <div className="flex items-center gap-2 truncate">
            <Building2 className={cn("h-4 w-4 flex-shrink-0", filters.company !== 'all_companies' ? "text-amber-600" : "text-slate-400")} />
            <span className="truncate">
              {filters.company === 'all_companies' ? t('filterCompany') : filters.company}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
          <SelectItem value="all_companies">
            <div className="flex items-center gap-2 py-0.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>{t('allCompanies')}</span>
            </div>
          </SelectItem>
          {allCompanies.map(opt => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2 py-0.5">
                <Building2 className="h-4 w-4 text-amber-500" />
                <span>{opt}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stock Status Filter */}
      <Select value={filters.stock_status || "all_stock_statuses"} onValueChange={v => onChange({ stock_status: v })}>
        <SelectTrigger className={cn(
          "h-12 w-[120px] sm:w-[140px] border border-slate-100 shadow-sm rounded-2xl gap-2 transition-all duration-300 min-w-0 flex-shrink-0 font-bold text-xs uppercase tracking-tight",
          filters.stock_status !== 'all_stock_statuses'
            ? "bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100/50"
            : "bg-slate-50/50 hover:bg-white hover:border-rose-200 hover:shadow-md text-slate-600"
        )}>
          <div className="flex items-center gap-2 truncate">
            <Package className={cn("h-4 w-4 flex-shrink-0", filters.stock_status !== 'all_stock_statuses' ? "text-rose-600" : "text-slate-400")} />
            <span className="truncate">
              {filters.stock_status === 'all_stock_statuses' ? t('filterStock') : (filters.stock_status === 'inStock' ? t('inStock') : filters.stock_status)}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
          <SelectItem value="all_stock_statuses">
            <div className="flex items-center gap-2 py-0.5">
              <Package className="h-4 w-4 text-slate-400" />
              <span>{t('allStockStatuses')}</span>
            </div>
          </SelectItem>
          {STOCK_STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2 py-0.5">
                <Package className={cn("h-4 w-4", opt === 'inStock' ? "text-emerald-500" : "text-rose-500")} />
                <span>{opt === 'inStock' ? t('inStock') : opt}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductFilters;
