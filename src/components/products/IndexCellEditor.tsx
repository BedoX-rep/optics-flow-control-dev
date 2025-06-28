
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const INDEX_OPTIONS = ["1.50", "1.56", "1.59", "1.6", "1.67", "1.74"];

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}
const IndexCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => (
  <Select
    value={value || ""}
    onValueChange={onChange}
    disabled={disabled}
  >
    <SelectTrigger className="w-full h-8 bg-[#fafafa] border border-neutral-300 rounded text-xs font-medium px-2">
      <SelectValue placeholder="Select index" />
    </SelectTrigger>
    <SelectContent className="z-50 bg-white">
      {INDEX_OPTIONS.map(idx => (
        <SelectItem key={idx} value={idx}>{idx}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default IndexCellEditor;
