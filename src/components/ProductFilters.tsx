
import React from "react";
import { Filter, Package, Building2, Glasses, Album } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses",
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories"
];

const INDEX_OPTIONS = ["1.50", "1.56", "1.59", "1.60", "1.67", "1.74"];
const TREATMENT_OPTIONS = ["Standard", "Blue Cut", "Photochromic", "Polarized"];
const COMPANY_OPTIONS = ["Essilor", "Hoya", "Zeiss", "Rodenstock", "Shamir"];

export interface ProductFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Category Filter */}
      <Select value={filters.category} onValueChange={v => onChange({ category: v })}>
        <SelectTrigger className={cn(
          "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
          filters.category
            ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          <Glasses className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          {CATEGORY_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Index Filter */}
      <Select value={filters.index} onValueChange={v => onChange({ index: v })}>
        <SelectTrigger className={cn(
          "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
          filters.index
            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          <Album className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Index" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Indexes</SelectItem>
          {INDEX_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Treatment Filter */}
      <Select value={filters.treatment} onValueChange={v => onChange({ treatment: v })}>
        <SelectTrigger className={cn(
          "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
          filters.treatment
            ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Treatment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Treatments</SelectItem>
          {TREATMENT_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Company Filter */}
      <Select value={filters.company} onValueChange={v => onChange({ company: v })}>
        <SelectTrigger className={cn(
          "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
          filters.company
            ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
            : "bg-white/10 hover:bg-white/20"
        )}>
          <Building2 className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Companies</SelectItem>
          {COMPANY_OPTIONS.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductFilters;
