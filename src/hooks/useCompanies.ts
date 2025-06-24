
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const HARDCODED_COMPANIES = [
  "Indo",
  "ABlens", 
  "Essilor",
  "GLASSANDLENS",
  "Optifak"
];

export interface Company {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useCompanies = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's custom companies
  const { data: customCompanies = [], isLoading } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
        
      if (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
      
      return data as Company[];
    },
    enabled: !!user,
  });

  // Combine hardcoded and custom companies
  const allCompanies = [
    ...HARDCODED_COMPANIES,
    ...customCompanies.map(c => c.name)
  ];

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('companies')
        .insert({ name, user_id: user.id })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', user?.id] });
    }
  });

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', user?.id] });
    }
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', user?.id] });
    }
  });

  return {
    allCompanies,
    customCompanies,
    isLoading,
    createCompany,
    updateCompany,
    deleteCompany
  };
};
