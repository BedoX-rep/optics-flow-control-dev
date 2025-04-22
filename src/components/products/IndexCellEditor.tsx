
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const INDEX_OPTIONS = ["1.56", "1.6", "1.67", "1.74"];

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}

const IndexCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => (
  <Select
    value={value || ""}
    onValueChange={v => onChange(v === "Custom" ? null : v)}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa]">
      <SelectValue placeholder="Select index" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {INDEX_OPTIONS.map(idx => (
        <SelectItem key={idx} value={idx}>{idx}</SelectItem>
      ))}
      <SelectItem value="Custom">Custom</SelectItem>
    </SelectContent>
  </Select>
);

export default IndexCellEditor;
