import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Building2, Package2, Tag, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_OPTIONS } from "@/components/products/CompanyCellEditor";
import { useCompanies } from "@/hooks/useCompanies";

const CATEGORY_OPTIONS = [
  'Single Vision',
  'Progressive',
  'Frames',
  'Sunglasses',
  'Contact Lens',
  'Accessories'
];

const TREATMENT_OPTIONS = [
  'None',
  'Anti-Reflection',
  'Blue Light',
  'Photochromic',
  'Polarized',
  'Mirror'
];

export interface ProductFilters {
  category?: string;
  company?: string;
  treatment?: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onClearAll: () => void;
}

const ProductFilters = ({ filters, onChange, onClearAll }: ProductFiltersProps) => {
  const { companies } = useCompanies();

  // Combine default companies with user's custom companies
  const allCompanies = [
    ...COMPANY_OPTIONS,
    ...companies.filter(c => !COMPANY_OPTIONS.includes(c.name)).map(c => c.name)
  ];

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all_categories' && v !== 'all_companies' && v !== 'all_treatments').length;

  const clearFilter = (key: keyof ProductFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onChange(newFilters);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 font-medium text-gray-700">
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <Select value={filters.category || "all_categories"} onValueChange={v => onChange({ ...filters, category: v })}>
          <SelectTrigger className={cn(
            "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
            filters.category && filters.category !== 'all_categories'
              ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
              : "bg-white/10 hover:bg-white/20"
          )}>
            {filters.category && filters.category !== 'all_categories' ? (
              <SelectValue />
            ) : (
              <>
                <Package2 className="h-4 w-4" />
                <span>Category</span>
              </>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_categories">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Company Filter */}
        <Select value={filters.company || "all_companies"} onValueChange={v => onChange({ ...filters, company: v })}>
          <SelectTrigger className={cn(
            "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
            filters.company && filters.company !== 'all_companies'
              ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
              : "bg-white/10 hover:bg-white/20"
          )}>
            {filters.company && filters.company !== 'all_companies' ? (
              <SelectValue />
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                <span>Company</span>
              </>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_companies">All Companies</SelectItem>
            {allCompanies.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Treatment Filter */}
        <Select value={filters.treatment || "all_treatments"} onValueChange={v => onChange({ ...filters, treatment: v })}>
          <SelectTrigger className={cn(
            "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
            filters.treatment && filters.treatment !== 'all_treatments'
              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
              : "bg-white/10 hover:bg-white/20"
          )}>
            {filters.treatment && filters.treatment !== 'all_treatments' ? (
              <SelectValue />
            ) : (
              <>
                <Tag className="h-4 w-4" />
                <span>Treatment</span>
              </>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_treatments">All Treatments</SelectItem>
            {TREATMENT_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 ml-2">
          {filters.category && filters.category !== 'all_categories' && (
            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
              {filters.category}
              <button
                onClick={() => clearFilter('category')}
                className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.company && filters.company !== 'all_companies' && (
            <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
              {filters.company}
              <button
                onClick={() => clearFilter('company')}
                className="ml-1 hover:bg-orange-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.treatment && filters.treatment !== 'all_treatments' && (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-200">
              {filters.treatment}
              <button
                onClick={() => clearFilter('treatment')}
                className="ml-1 hover:bg-green-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;