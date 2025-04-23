
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const COMPANY_OPTIONS = [
  "Indo",
  "ABlens",
  "Essilor",
  "GLASSANDLENS",
  "Optifak"
];

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}

const CompanyCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => (
  <Select
    value={value || ""}
    onValueChange={onChange}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa] border border-neutral-300 rounded text-xs font-medium px-2">
      <SelectValue placeholder="Select company" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {COMPANY_OPTIONS.map(comp => (
        <SelectItem key={comp} value={comp}>{comp}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default CompanyCellEditor;
