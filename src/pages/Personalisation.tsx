
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { Save, Settings, DollarSign } from 'lucide-react';

interface UserInformation {
  id?: string;
  user_id: string;
  store_name?: string;
  display_name?: string;
  address?: string;
  vat_number?: string;
  ice?: string;
  inpe?: string;
  company_legal_status?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  auto_additional_costs: boolean;
  sv_lens_cost: number;
  progressive_lens_cost: number;
  frames_cost: number;
}

const Personalisation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { translate: t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UserInformation>({
    user_id: user?.id || '',
    auto_additional_costs: true,
    sv_lens_cost: 10.00,
    progressive_lens_cost: 20.00,
    frames_cost: 10.00
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user information
  const { data: userInformation, isLoading } = useQuery({
    queryKey: ['user-information', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to get existing user information
      const { data: existingInfo } = await supabase
        .from('user_information')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingInfo) {
        return existingInfo;
      }

      // If no user information exists, initialize it
      await supabase.rpc('initialize_user_personalisation', { user_uuid: user.id });

      // Fetch the newly created/updated record
      const { data: newInfo, error } = await supabase
        .from('user_information')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user information:', error);
        return null;
      }

      return newInfo;
    },
    enabled: !!user,
  });

  // Update form data when user information is loaded
  useEffect(() => {
    if (userInformation) {
      setFormData({
        ...userInformation,
        auto_additional_costs: userInformation.auto_additional_costs ?? true,
        sv_lens_cost: userInformation.sv_lens_cost ?? 10.00,
        progressive_lens_cost: userInformation.progressive_lens_cost ?? 20.00,
        frames_cost: userInformation.frames_cost ?? 10.00
      });
    }
  }, [userInformation]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: UserInformation) => {
      const { error } = await supabase
        .from('user_information')
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
      queryClient.invalidateQueries({ queryKey: ['user-information', user?.id] });
    },
    onError: (error) => {
      console.error('Error saving user information:', error);
      toast({
        title: t('error'),
        description: t('failedToSaveInfo'),
        variant: "destructive",
      });
    }
  });

  const handleSwitchChange = (field: keyof UserInformation, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleInputChange = (field: keyof UserInformation, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
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
            <CardContent className="space-y-6">
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

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-semibold">{t('additionalCostsSettings')}</h3>
                </div>

                <div className="bg-blue-50/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-blue-900">{t('currentSettings')}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sv_lens_cost" className="text-sm font-medium">
                        {t('singleVisionLensCost')}
                      </Label>
                      <p className="text-xs text-gray-600">{t('svLensCostDesc')}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          id="sv_lens_cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.sv_lens_cost}
                          onChange={(e) => handleInputChange('sv_lens_cost', e.target.value)}
                          className="bg-white"
                        />
                        <span className="text-sm text-gray-500">DH</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="progressive_lens_cost" className="text-sm font-medium">
                        {t('progressiveLensCost')}
                      </Label>
                      <p className="text-xs text-gray-600">{t('progressiveCostDesc')}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          id="progressive_lens_cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.progressive_lens_cost}
                          onChange={(e) => handleInputChange('progressive_lens_cost', e.target.value)}
                          className="bg-white"
                        />
                        <span className="text-sm text-gray-500">DH</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frames_cost" className="text-sm font-medium">
                        {t('framesCost')}
                      </Label>
                      <p className="text-xs text-gray-600">{t('framesCostDesc')}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          id="frames_cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.frames_cost}
                          onChange={(e) => handleInputChange('frames_cost', e.target.value)}
                          className="bg-white"
                        />
                        <span className="text-sm text-gray-500">DH</span>
                      </div>
                    </div>
                  </div>
                </div>
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
