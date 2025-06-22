
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses",
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories",
  "Service",
  "Other"
];

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}
const CategoryCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => (
  <Select
    value={value || ""}
    onValueChange={onChange}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa] border border-neutral-300 rounded text-xs font-medium px-2">
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {CATEGORY_OPTIONS.map(cat => (
        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default CategoryCellEditor;
