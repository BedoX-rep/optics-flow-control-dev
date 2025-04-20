
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="flex gap-4 flex-wrap mb-4">
      <div>
        <Label>Category</Label>
        <Select value={filters.category || ""} onValueChange={v => onChange({ category: v })}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="all_categories">All</SelectItem>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Index</Label>
        <Select value={filters.index || ""} onValueChange={v => onChange({ index: v })}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="all_indexes">All</SelectItem>
            {INDEX_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Treatment</Label>
        <Select value={filters.treatment || ""} onValueChange={v => onChange({ treatment: v })}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="all_treatments">All</SelectItem>
            {TREATMENT_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Company</Label>
        <Select value={filters.company || ""} onValueChange={v => onChange({ company: v })}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="all_companies">All</SelectItem>
            {COMPANY_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Sort</Label>
        <Select value={filters.sort || "arrange"} onValueChange={v => onChange({ sort: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="arrange">By Category/Spec</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductFilters;
