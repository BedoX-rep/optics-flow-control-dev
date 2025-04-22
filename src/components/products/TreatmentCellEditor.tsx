
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TREATMENT_OPTIONS = ["White", "AR", "Blue", "Photochromic"];

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}

const TreatmentCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => (
  <Select
    value={value || ""}
    onValueChange={v => onChange(v === "Custom" ? null : v)}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa]">
      <SelectValue placeholder="Select treatment" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {TREATMENT_OPTIONS.map(treat => (
        <SelectItem key={treat} value={treat}>{treat}</SelectItem>
      ))}
      <SelectItem value="Custom">Custom</SelectItem>
    </SelectContent>
  </Select>
);

export default TreatmentCellEditor;
