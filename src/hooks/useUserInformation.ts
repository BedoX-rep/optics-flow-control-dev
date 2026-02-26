
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Database } from '@/integrations/supabase/types';

type UserInformationRow = Database['public']['Tables']['user_information']['Row'];

export const useUserInformation = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-information', user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // First, try to get existing user information
        const { data: existingInfo, error: fetchError } = await supabase
          .from('user_information')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingInfo) {
          return existingInfo as UserInformationRow;
        }

        // If no user information exists, initialize from subscription data
        if (fetchError && fetchError.code === 'PGRST116') {
          await supabase.rpc('initialize_user_information', { user_uuid: user.id });

          // Fetch the newly created record
          const { data: newInfo, error: newError } = await supabase
            .from('user_information')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (newError) {
            console.error('Error fetching new user information:', newError);
            return null;
          }

          return newInfo as UserInformationRow;
        }

        if (fetchError) {
          console.error('Error fetching user information:', fetchError);
          return null;
        }

        return existingInfo as UserInformationRow;
      } catch (error) {
        console.error('Unexpected error:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,          // 5 minutes (matches global)
    gcTime: 30 * 60 * 1000,            // 30 minutes (gcTime is new name for cacheTime)
    refetchOnWindowFocus: false,        // DOES refetch on window focus
    refetchOnMount: true,              // DOES refetch when component mounts
    refetchOnReconnect: true           // DOES refetch on reconnect
  });
};
