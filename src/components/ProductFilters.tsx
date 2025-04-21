
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
    <SelectTrigger className="rounded-full border border-black/15 min-w-[96px] text-[13px] h-9 pr-8 bg-white focus:ring-2 focus:ring-black shadow-none font-inter font-medium aria-expanded:ring-2 aria-expanded:ring-black/50 transition">
      <SelectValue placeholder={placeholder} />
      <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
    </SelectTrigger>
    <SelectContent className="z-[60] bg-white shadow-xl border border-black/10 rounded-[.9em] min-w-[140px]">
      {children}
    </SelectContent>
  </Select>
);

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="flex gap-2 flex-wrap items-center">
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
};

export default ProductFilters;
