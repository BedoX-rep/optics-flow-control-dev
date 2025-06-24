
import { CellEditor } from "ag-grid-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanies } from "@/hooks/useCompanies";

export const COMPANY_OPTIONS = ['Indo', 'ABlens', 'Essilor', 'GLASSANDLENS', 'Optifak'];

export const CompanyCellEditor: CellEditor = (props) => {
  const { companies } = useCompanies();
  
  // Combine default companies with user's custom companies
  const allCompanies = [
    ...COMPANY_OPTIONS,
    ...companies.filter(c => !COMPANY_OPTIONS.includes(c.name)).map(c => c.name)
  ];

  const handleValueChange = (value: string) => {
    props.onValueChange?.(value);
    props.stopEditing?.();
  };

  return (
    <Select value={props.value || ''} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select company" />
      </SelectTrigger>
      <SelectContent>
        {allCompanies.map(company => (
          <SelectItem key={company} value={company}>
            {company}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
