
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
    onValueChange={v => onChange(v === "Custom" ? null : v)}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa]">
      <SelectValue placeholder="Select company" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {COMPANY_OPTIONS.map(comp => (
        <SelectItem key={comp} value={comp}>{comp}</SelectItem>
      ))}
      <SelectItem value="Custom">Custom</SelectItem>
    </SelectContent>
  </Select>
);

export default CompanyCellEditor;
