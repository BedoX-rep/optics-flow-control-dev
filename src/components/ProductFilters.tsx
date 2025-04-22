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

export interface ProductFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
      {/* Category filter */}
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

      {/* Sort Selector */}
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