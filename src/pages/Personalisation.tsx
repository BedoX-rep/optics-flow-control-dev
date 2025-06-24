
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { Save, Settings } from 'lucide-react';

interface UserPersonalisation {
  id?: string;
  user_id: string;
  auto_additional_costs: boolean;
}

const Personalisation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { translate: t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UserPersonalisation>({
    user_id: user?.id || '',
    auto_additional_costs: true
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user personalisation
  const { data: userPersonalisation, isLoading } = useQuery({
    queryKey: ['user-personalisation', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First, try to get existing user personalisation
      const { data: existingPersonalisation } = await supabase
        .from('user_personalisation')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingPersonalisation) {
        return existingPersonalisation;
      }

      // If no user personalisation exists, initialize it
      await supabase.rpc('initialize_user_personalisation', { user_uuid: user.id });

      // Fetch the newly created record
      const { data: newPersonalisation, error } = await supabase
        .from('user_personalisation')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user personalisation:', error);
        return null;
      }

      return newPersonalisation;
    },
    enabled: !!user,
  });

  // Update form data when user personalisation is loaded
  useEffect(() => {
    if (userPersonalisation) {
      setFormData({
        id: userPersonalisation.id,
        user_id: userPersonalisation.user_id,
        auto_additional_costs: userPersonalisation.auto_additional_costs
      });
    }
  }, [userPersonalisation]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: UserPersonalisation) => {
      const { error } = await supabase
        .from('user_personalisation')
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('settingsUpdated'),
        description: t('settingsSaved'),
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['user-personalisation', user?.id] });
    },
    onError: (error) => {
      console.error('Error saving user personalisation:', error);
      toast({
        title: t('error'),
        description: t('failedToSaveInfo'),
        variant: "destructive",
      });
    }
  });

  const handleSwitchChange = (field: keyof UserPersonalisation, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">{t('loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageTitle 
          title={t('personalisation')} 
          subtitle={t('managePersonalPreferences')}
        />

        <div className="space-y-6">
          {/* Additional Costs Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('additionalCosts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto_additional_costs" className="text-base font-medium">
                    {t('autoAdditionalCosts')}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t('autoAdditionalCostsDesc')}
                  </p>
                </div>
                <Switch
                  id="auto_additional_costs"
                  checked={formData.auto_additional_costs}
                  onCheckedChange={(value) => handleSwitchChange('auto_additional_costs', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personalisation;
