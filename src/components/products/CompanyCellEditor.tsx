
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanies } from "@/hooks/useCompanies";

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}
const CompanyCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { companies } = useCompanies();
  
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
        <SelectItem value="None">None</SelectItem>
        {companies.map(company => (
          <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CompanyCellEditor;
