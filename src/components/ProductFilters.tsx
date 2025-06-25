
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
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
      {/* Category Filter */}
      <Select value={filters.category || "all_categories"} onValueChange={v => onChange({ category: v })}>
        <SelectTrigger className={cn(
          "w-[120px] sm:w-[140px] border-2 shadow-md rounded-xl gap-1 sm:gap-2 transition-all duration-200 min-w-0 flex-shrink-0",
          filters.category !== 'all_categories'
            ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          {filters.category === 'all_categories' ? (
            <>
              <Glasses className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('filterCategory')}</span>
            </>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_categories">{t('allCategories')}</SelectItem>
          {CATEGORY_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Index Filter */}
      <Select value={filters.index || "all_indexes"} onValueChange={v => onChange({ index: v })}>
        <SelectTrigger className={cn(
          "w-[100px] sm:w-[120px] border-2 shadow-md rounded-xl gap-1 sm:gap-2 transition-all duration-200 min-w-0 flex-shrink-0",
          filters.index !== 'all_indexes'
            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          {filters.index === 'all_indexes' ? (
            <>
              <Album className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('filterIndex')}</span>
            </>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_indexes">{t('allIndexes')}</SelectItem>
          {INDEX_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Treatment Filter */}
      <Select value={filters.treatment || "all_treatments"} onValueChange={v => onChange({ treatment: v })}>
        <SelectTrigger className={cn(
          "w-[120px] sm:w-[140px] border-2 shadow-md rounded-xl gap-1 sm:gap-2 transition-all duration-200 min-w-0 flex-shrink-0",
          filters.treatment !== 'all_treatments'
            ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          {filters.treatment === 'all_treatments' ? (
            <>
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('filterTreatment')}</span>
            </>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_treatments">{t('allTreatments')}</SelectItem>
          {TREATMENT_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Company Filter */}
      <Select value={filters.company || "all_companies"} onValueChange={v => onChange({ company: v })}>
        <SelectTrigger className={cn(
          "w-[120px] sm:w-[140px] border-2 shadow-md rounded-xl gap-1 sm:gap-2 transition-all duration-200 min-w-0 flex-shrink-0",
          filters.company !== 'all_companies'
            ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          {filters.company === 'all_companies' ? (
            <>
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('filterCompany')}</span>
            </>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_companies">{t('allCompanies')}</SelectItem>
          {allCompanies.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stock Status Filter */}
      <Select value={filters.stock_status || "all_stock_statuses"} onValueChange={v => onChange({ stock_status: v })}>
        <SelectTrigger className={cn(
          "w-[100px] sm:w-[120px] border-2 shadow-md rounded-xl gap-1 sm:gap-2 transition-all duration-200 min-w-0 flex-shrink-0",
          filters.stock_status !== 'all_stock_statuses'
            ? "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          {filters.stock_status === 'all_stock_statuses' ? (
            <>
              <Package className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('filterStock')}</span>
            </>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_stock_statuses">{t('allStockStatuses')}</SelectItem>
          {STOCK_STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>
              {opt === 'inStock' ? t('inStock') : opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductFilters;
