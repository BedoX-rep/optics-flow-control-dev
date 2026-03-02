
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Database } from '@/integrations/supabase/types';

type UserInformationRow = Database['public']['Tables']['user_information']['Row'];

export const useUserInformation = () => {
  const { user, userRole, storeId } = useAuth();

  return useQuery({
    queryKey: ['user-information', user?.id, userRole, storeId],
    queryFn: async () => {
      if (!user) return null;

      try {
        let targetUserId = user.id;

        // If the user is an employee, we want to fetch the store owner's information
        if (userRole === 'employee' && storeId) {
          const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', storeId)
            .maybeSingle();

          if (storeData?.owner_id) {
            targetUserId = storeData.owner_id;
          }
        }

        // Try to get user information for the target user (self or owner)
        const { data: existingInfo, error: fetchError } = await supabase
          .from('user_information')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (existingInfo) {
          return existingInfo as UserInformationRow;
        }

        // Only initialize user information if the user is an owner and data is missing
        if (!existingInfo && userRole === 'owner' && (!fetchError || fetchError.code === 'PGRST116')) {
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

        return null;
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
