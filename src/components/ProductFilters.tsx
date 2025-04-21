
import React from "react";
import { ChevronDown } from "lucide-react";
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

// Ultra-compact/modernized filter select
const FilterSelect = ({
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
    <SelectTrigger className="rounded-lg border border-black/10 min-w-[86px] text-xs h-8 pr-6 bg-white focus:ring-1 focus:ring-black shadow-none font-inter font-medium aria-expanded:ring-1 aria-expanded:ring-black/50 transition">
      <SelectValue placeholder={placeholder} />
      <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
    </SelectTrigger>
    <SelectContent className="z-[80] bg-white shadow-xl border border-black/10 rounded-lg min-w-[120px] py-1">
      {children}
    </SelectContent>
  </Select>
);

// All filters arranged horizontally with small gap
const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => (
  <div className="flex gap-2 flex-wrap justify-end">
    <FilterSelect
      value={filters.category || "all_categories"}
      placeholder="Category"
      onChange={v => onChange({ category: v })}
    >
      <SelectItem value="all_categories">All</SelectItem>
      {CATEGORY_OPTIONS.map(opt => (
        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
      ))}
    </FilterSelect>
    <FilterSelect
      value={filters.index || "all_indexes"}
      placeholder="Index"
      onChange={v => onChange({ index: v })}
    >
      <SelectItem value="all_indexes">All</SelectItem>
      {INDEX_OPTIONS.map(opt => (
        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
      ))}
    </FilterSelect>
    <FilterSelect
      value={filters.treatment || "all_treatments"}
      placeholder="Treatment"
      onChange={v => onChange({ treatment: v })}
    >
      <SelectItem value="all_treatments">All</SelectItem>
      {TREATMENT_OPTIONS.map(opt => (
        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
      ))}
    </FilterSelect>
    <FilterSelect
      value={filters.company || "all_companies"}
      placeholder="Company"
      onChange={v => onChange({ company: v })}
    >
      <SelectItem value="all_companies">All</SelectItem>
      {COMPANY_OPTIONS.map(opt => (
        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
      ))}
    </FilterSelect>
    <FilterSelect
      value={filters.sort || "arrange"}
      placeholder="Sort"
      onChange={v => onChange({ sort: v })}
    >
      <SelectItem value="arrange">Sort: Category</SelectItem>
      <SelectItem value="latest">Sort: Latest</SelectItem>
    </FilterSelect>
  </div>
);

export default ProductFilters;
