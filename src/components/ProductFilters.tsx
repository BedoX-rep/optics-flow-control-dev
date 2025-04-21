
import React from "react";
import { ChevronDown, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const FilterPill = ({
  value,
  placeholder,
  children,
  onChange,
}: {
  value: string;
  placeholder: string;
  children: React.ReactNode;
  onChange: (newValue: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="rounded-full shadow-xs border-gray-200 min-w-[94px] text-sm h-9 pr-7 bg-white">
      <SelectValue placeholder={placeholder} />
      <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {children}
    </SelectContent>
  </Select>
);

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="flex gap-2 flex-wrap mb-2 items-center">
      <span className="hidden md:inline-flex items-center text-xs font-medium text-gray-600 bg-[#F7FAFC] py-1 px-2 rounded-full border border-gray-200 mr-2">
        <Filter size={14} className="mr-1" /> Filters
      </span>
      <FilterPill
        value={filters.category || "all_categories"}
        placeholder="Category"
        onChange={v => onChange({ category: v })}
      >
        <SelectItem value="all_categories">All</SelectItem>
        {CATEGORY_OPTIONS.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </FilterPill>
      <FilterPill
        value={filters.index || "all_indexes"}
        placeholder="Index"
        onChange={v => onChange({ index: v })}
      >
        <SelectItem value="all_indexes">All</SelectItem>
        {INDEX_OPTIONS.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </FilterPill>
      <FilterPill
        value={filters.treatment || "all_treatments"}
        placeholder="Treatment"
        onChange={v => onChange({ treatment: v })}
      >
        <SelectItem value="all_treatments">All</SelectItem>
        {TREATMENT_OPTIONS.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </FilterPill>
      <FilterPill
        value={filters.company || "all_companies"}
        placeholder="Company"
        onChange={v => onChange({ company: v })}
      >
        <SelectItem value="all_companies">All</SelectItem>
        {COMPANY_OPTIONS.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </FilterPill>
      <FilterPill
        value={filters.sort || "arrange"}
        placeholder="Sort"
        onChange={v => onChange({ sort: v })}
      >
        <SelectItem value="arrange">By Category/Spec</SelectItem>
        <SelectItem value="latest">Latest</SelectItem>
      </FilterPill>
    </div>
  );
};

export default ProductFilters;
