
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  user_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCompany = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name, is_default: false }])
        .select()
        .single();

      if (error) {
        console.error('Error adding company:', error);
        return { success: false, error: error.message };
      }

      setCompanies(prev => [...prev, data]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding company:', error);
      return { success: false, error: 'Failed to add company' };
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
        .eq('is_default', false); // Only allow deletion of non-default companies

      if (error) {
        console.error('Error deleting company:', error);
        return { success: false, error: error.message };
      }

      setCompanies(prev => prev.filter(company => company.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting company:', error);
      return { success: false, error: 'Failed to delete company' };
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return {
    companies,
    loading,
    addCompany,
    deleteCompany,
    refetch: fetchCompanies
  };
};
