
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
    onValueChange={onChange}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa] border border-neutral-300 rounded text-xs font-medium px-2">
      <SelectValue placeholder="Select treatment" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {TREATMENT_OPTIONS.map(treat => (
        <SelectItem key={treat} value={treat}>{treat}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default TreatmentCellEditor;
