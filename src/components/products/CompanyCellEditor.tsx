
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  value: string | null | undefined;
  onChange: (newValue: string | null) => void;
  disabled?: boolean;
}

const CompanyCellEditor: React.FC<Props> = ({ value, onChange, disabled }) => {
  const { user } = useAuth();

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch user's custom companies
      const { data: userCompanies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        return [];
      }

      // Default companies that show for all users
      const defaultCompanies = [
        { id: 'default-indo', name: 'Indo', user_id: '', is_default: true, created_at: '', updated_at: '' },
        { id: 'default-ablens', name: 'ABlens', user_id: '', is_default: true, created_at: '', updated_at: '' },
        { id: 'default-essilor', name: 'Essilor', user_id: '', is_default: true, created_at: '', updated_at: '' },
        { id: 'default-glassandlens', name: 'GLASSANDLENS', user_id: '', is_default: true, created_at: '', updated_at: '' },
        { id: 'default-optifak', name: 'Optifak', user_id: '', is_default: true, created_at: '', updated_at: '' }
      ];

      return [...defaultCompanies, ...userCompanies];
    },
    enabled: !!user,
  });

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
