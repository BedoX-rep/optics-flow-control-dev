
import React, { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses",
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories"
];
const INDEX_OPTIONS = ["1.56", "1.6", "1.67", "1.74"];
const TREATMENT_OPTIONS = ["White", "AR", "Blue", "Photochromic"];
const COMPANY_OPTIONS = [
  "Indo",
  "ABlens",
  "Essilor",
  "GLASSANDLENS",
  "Optifak"
];

export interface ProductFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

// Only show Category filter by default; others appear after adding from +Filter menu
const FILTER_FIELDS = [
  { key: "company", label: "Company", options: COMPANY_OPTIONS },
  { key: "index", label: "Index", options: INDEX_OPTIONS },
  { key: "treatment", label: "Treatment", options: TREATMENT_OPTIONS },
];

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  const [activeExtraFilter, setActiveExtraFilter] = useState<string | null>(null);
  const [showAddFilterList, setShowAddFilterList] = useState(false);

  function handleAddFilter(field: string) {
    setActiveExtraFilter(field);
    setShowAddFilterList(false);
  }

  function handleRemoveExtraFilter() {
    if (activeExtraFilter) {
      onChange({ [activeExtraFilter]: `all_${activeExtraFilter}s` });
    }
    setActiveExtraFilter(null);
  }

  return (
    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
      {/* Compact Category filter */}
      <Select value={filters.category || "all_categories"} onValueChange={v => onChange({ category: v })}>
        <SelectTrigger className="rounded-lg border border-black/10 min-w-[100px] text-xs h-8 pr-6 bg-white focus:ring-1 focus:ring-black font-inter font-medium shadow-none transition">
          <SelectValue placeholder="Category" />
          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
        </SelectTrigger>
        <SelectContent className="z-[80] bg-white shadow-xl border border-black/10 rounded-lg min-w-[120px] py-1">
          <SelectItem value="all_categories">All</SelectItem>
          {CATEGORY_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Add Filter Button */}
      {!activeExtraFilter && (
        <div className="relative">
          <Button
            type="button"
            size="icon"
            className="h-8 w-8 bg-white border border-black/10 text-black/60 hover:bg-neutral-100 transition"
            onClick={() => setShowAddFilterList(v => !v)}
            aria-label="Add filter"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {showAddFilterList && (
            <div className="absolute right-0 mt-1 min-w-[120px] bg-white rounded-lg border border-black/10 shadow-xl z-[100] py-1">
              {FILTER_FIELDS.map(f =>
                <button
                  key={f.key}
                  className="w-full px-3 py-1 text-left text-xs hover:bg-neutral-100 bg-white"
                  disabled={activeExtraFilter === f.key}
                  onClick={() => handleAddFilter(f.key)}
                >{f.label}</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Render only one extra filter at a time */}
      {activeExtraFilter && (
        <div className="flex items-center gap-1">
          <Select
            value={filters[activeExtraFilter] || `all_${activeExtraFilter}s`}
            onValueChange={v => onChange({ [activeExtraFilter]: v })}
          >
            <SelectTrigger className="rounded-lg border border-black/10 min-w-[90px] text-xs h-8 pr-6 bg-white focus:ring-1 focus:ring-black font-inter font-medium shadow-none transition">
              <SelectValue placeholder={FILTER_FIELDS.find(f => f.key === activeExtraFilter)?.label} />
              <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </SelectTrigger>
            <SelectContent className="z-[80] bg-white shadow-xl border border-black/10 rounded-lg min-w-[110px] py-1">
              <SelectItem value={`all_${activeExtraFilter}s`}>All</SelectItem>
              {FILTER_FIELDS.find(f => f.key === activeExtraFilter)?.options.map(opt =>
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-neutral-500 hover:text-black"
            onClick={handleRemoveExtraFilter}
            aria-label="Remove filter"
          >
            ×
          </Button>
        </div>
      )}

      {/* Sort Selector - tiny */}
      <Select value={filters.sort || "arrange"} onValueChange={v => onChange({ sort: v })}>
        <SelectTrigger className="rounded-lg border border-black/10 min-w-[90px] text-xs h-8 pr-6 bg-white focus:ring-1 focus:ring-black font-inter font-medium shadow-none transition">
          <SelectValue placeholder="Sort" />
          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
        </SelectTrigger>
        <SelectContent className="z-[80] bg-white shadow-xl border border-black/10 rounded-lg min-w-[110px] py-1">
          <SelectItem value="arrange">Sort: Category</SelectItem>
          <SelectItem value="latest">Sort: Latest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductFilters;
