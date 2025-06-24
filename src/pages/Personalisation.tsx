
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
import { Save, Settings, DollarSign, Building2, Plus, Trash2 } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { COMPANY_OPTIONS } from '@/components/products/CompanyCellEditor';

interface PersonalisationData {
  auto_additional_costs: boolean;
  sv_lens_cost: number;
  progressive_lens_cost: number;
  frames_cost: number;
}

const Personalisation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PersonalisationData>({
    auto_additional_costs: true,
    sv_lens_cost: 10.00,
    progressive_lens_cost: 20.00,
    frames_cost: 10.00
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const { companies, addCompany, removeCompany } = useCompanies();

  // Fetch user personalisation data
  const { data: userPersonalisation, isLoading } = useQuery({
    queryKey: ['user-personalisation', user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // Try to get existing user information
        const { data: existingInfo, error: fetchError } = await supabase
          .from('user_information')
          .select('auto_additional_costs, sv_lens_cost, progressive_lens_cost, frames_cost')
          .eq('user_id', user.id)
          .single();

        if (existingInfo) {
          return existingInfo;
        }

        // If no user information exists, initialize it
        if (fetchError && fetchError.code === 'PGRST116') {
          await supabase.rpc('initialize_user_information', { user_uuid: user.id });

          // Fetch the newly created/updated record
          const { data: newInfo, error: newError } = await supabase
            .from('user_information')
            .select('auto_additional_costs, sv_lens_cost, progressive_lens_cost, frames_cost')
            .eq('user_id', user.id)
            .single();

          if (newError) {
            console.error('Error fetching new user personalisation:', newError);
            return null;
          }

          return newInfo;
        }

        if (fetchError) {
          console.error('Error fetching user personalisation:', fetchError);
          return null;
        }

        return existingInfo;
      } catch (error) {
        console.error('Unexpected error:', error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Update form data when user personalisation is loaded
  useEffect(() => {
    if (userPersonalisation) {
      setFormData({
        auto_additional_costs: userPersonalisation.auto_additional_costs ?? true,
        sv_lens_cost: userPersonalisation.sv_lens_cost ?? 10.00,
        progressive_lens_cost: userPersonalisation.progressive_lens_cost ?? 20.00,
        frames_cost: userPersonalisation.frames_cost ?? 10.00
      });
    }
  }, [userPersonalisation]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PersonalisationData) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_information')
        .upsert({
          user_id: user.id,
          auto_additional_costs: data.auto_additional_costs,
          sv_lens_cost: data.sv_lens_cost,
          progressive_lens_cost: data.progressive_lens_cost,
          frames_cost: data.frames_cost,
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
      queryClient.invalidateQueries({ queryKey: ['user-information', user?.id] });
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

  const handleSwitchChange = (field: keyof PersonalisationData, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleInputChange = (field: keyof PersonalisationData, value: string) => {
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

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({
        title: t('error'),
        description: "Please enter a company name",
        variant: "destructive",
      });
      return;
    }

    // Check if company already exists
    const allCompanies = [
      ...COMPANY_OPTIONS,
      ...companies.map(c => c.name)
    ];
    
    if (allCompanies.includes(newCompanyName.trim())) {
      toast({
        title: t('error'),
        description: "Company already exists",
        variant: "destructive",
      });
      return;
    }

    const result = await addCompany(newCompanyName.trim());
    if (result.success) {
      setNewCompanyName('');
      toast({
        title: t('success'),
        description: "Company added successfully",
      });
    } else {
      toast({
        title: t('error'),
        description: result.error || "Failed to add company",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    const result = await removeCompany(companyId);
    if (result.success) {
      toast({
        title: t('success'),
        description: "Company removed successfully",
      });
    } else {
      toast({
        title: t('error'),
        description: result.error || "Failed to remove company",
        variant: "destructive",
      });
    }
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

          {/* Company Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('companyManagement')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-semibold">{t('manageCompanies')}</h3>
                </div>

                <div className="bg-blue-50/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-blue-900">{t('defaultCompanies')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {COMPANY_OPTIONS.map(company => (
                      <div key={company} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
                        {company}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50/50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-green-900">{t('customCompanies')}</h4>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter company name"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="bg-white"
                    />
                    <Button 
                      onClick={handleAddCompany}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {companies.length > 0 && (
                    <div className="space-y-2">
                      {companies.map(company => (
                        <div key={company.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <span className="font-medium">{company.name}</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCompany(company.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {companies.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No custom companies added yet</p>
                  )}
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
