
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanies } from "@/hooks/useCompanies";

export const COMPANY_OPTIONS = [
  "None",
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
const CompanyCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { allCompanies } = useCompanies();
  const companiesWithNone = ["None", ...allCompanies];
  
  return (
    <Select
      value={value || ""}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full h-8 bg-[#fafafa] border border-neutral-300 rounded text-xs font-medium px-2">
        <SelectValue placeholder="Select company" />
      </SelectTrigger>
      <SelectContent className="z-50 bg-white">
        {companiesWithNone.map(comp => (
          <SelectItem key={comp} value={comp}>{comp}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CompanyCellEditor;
