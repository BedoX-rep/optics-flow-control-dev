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
import { useCompanies } from '@/hooks/useCompanies';
import { Save, Settings, DollarSign, Building2, Plus, Trash2, Edit } from 'lucide-react';

interface PersonalisationData {
  auto_additional_costs: boolean;
  sv_lens_cost: number;
  progressive_lens_cost: number;
  frames_cost: number;
  markup_sph_range_1_min: number;
  markup_sph_range_1_max: number;
  markup_sph_range_1_markup: number;
  markup_sph_range_2_min: number;
  markup_sph_range_2_max: number;
  markup_sph_range_2_markup: number;
  markup_sph_range_3_min: number;
  markup_sph_range_3_max: number;
  markup_sph_range_3_markup: number;
  markup_cyl_range_1_min: number;
  markup_cyl_range_1_max: number;
  markup_cyl_range_1_markup: number;
  markup_cyl_range_2_min: number;
  markup_cyl_range_2_max: number;
  markup_cyl_range_2_markup: number;
  markup_cyl_range_3_min: number;
  markup_cyl_range_3_max: number;
  markup_cyl_range_3_markup: number;
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
    frames_cost: 10.00,
    markup_sph_range_1_min: 0,
    markup_sph_range_1_max: 4,
    markup_sph_range_1_markup: 0,
    markup_sph_range_2_min: 4,
    markup_sph_range_2_max: 8,
    markup_sph_range_2_markup: 15,
    markup_sph_range_3_min: 8,
    markup_sph_range_3_max: 999,
    markup_sph_range_3_markup: 30,
    markup_cyl_range_1_min: 0,
    markup_cyl_range_1_max: 2,
    markup_cyl_range_1_markup: 0,
    markup_cyl_range_2_min: 2,
    markup_cyl_range_2_max: 4,
    markup_cyl_range_2_markup: 15,
    markup_cyl_range_3_min: 4,
    markup_cyl_range_3_max: 999,
    markup_cyl_range_3_markup: 30
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string } | null>(null);

  const { allCompanies, customCompanies, createCompany, updateCompany, deleteCompany } = useCompanies();

  // Fetch user personalisation data
  const { data: personalisationInfo, isLoading } = useQuery({
    queryKey: ['user-information', user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        // Try to get existing user information
        const { data: existingInfo, error: fetchError } = await supabase
          .from('user_information')
          .select(`
            auto_additional_costs, sv_lens_cost, progressive_lens_cost, frames_cost,
            markup_sph_range_1_min, markup_sph_range_1_max, markup_sph_range_1_markup,
            markup_sph_range_2_min, markup_sph_range_2_max, markup_sph_range_2_markup,
            markup_sph_range_3_min, markup_sph_range_3_max, markup_sph_range_3_markup,
            markup_cyl_range_1_min, markup_cyl_range_1_max, markup_cyl_range_1_markup,
            markup_cyl_range_2_min, markup_cyl_range_2_max, markup_cyl_range_2_markup,
            markup_cyl_range_3_min, markup_cyl_range_3_max, markup_cyl_range_3_markup
          `)
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
            .select(`
              auto_additional_costs, sv_lens_cost, progressive_lens_cost, frames_cost,
              markup_sph_range_1_min, markup_sph_range_1_max, markup_sph_range_1_markup,
              markup_sph_range_2_min, markup_sph_range_2_max, markup_sph_range_2_markup,
              markup_sph_range_3_min, markup_sph_range_3_max, markup_sph_range_3_markup,
              markup_cyl_range_1_min, markup_cyl_range_1_max, markup_cyl_range_1_markup,
              markup_cyl_range_2_min, markup_cyl_range_2_max, markup_cyl_range_2_markup,
              markup_cyl_range_3_min, markup_cyl_range_3_max, markup_cyl_range_3_markup
            `)
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
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (previously cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Update form data when user personalisation is loaded
  useEffect(() => {
    if (personalisationInfo) {
      setFormData({
        auto_additional_costs: personalisationInfo.auto_additional_costs ?? true,
        sv_lens_cost: personalisationInfo.sv_lens_cost ?? 10.00,
        progressive_lens_cost: personalisationInfo.progressive_lens_cost ?? 20.00,
        frames_cost: personalisationInfo.frames_cost ?? 10.00,
        markup_sph_range_1_min: personalisationInfo.markup_sph_range_1_min ?? 0,
        markup_sph_range_1_max: personalisationInfo.markup_sph_range_1_max ?? 4,
        markup_sph_range_1_markup: personalisationInfo.markup_sph_range_1_markup ?? 0,
        markup_sph_range_2_min: personalisationInfo.markup_sph_range_2_min ?? 4,
        markup_sph_range_2_max: personalisationInfo.markup_sph_range_2_max ?? 8,
        markup_sph_range_2_markup: personalisationInfo.markup_sph_range_2_markup ?? 15,
        markup_sph_range_3_min: personalisationInfo.markup_sph_range_3_min ?? 8,
        markup_sph_range_3_max: personalisationInfo.markup_sph_range_3_max ?? 999,
        markup_sph_range_3_markup: personalisationInfo.markup_sph_range_3_markup ?? 30,
        markup_cyl_range_1_min: personalisationInfo.markup_cyl_range_1_min ?? 0,
        markup_cyl_range_1_max: personalisationInfo.markup_cyl_range_1_max ?? 2,
        markup_cyl_range_1_markup: personalisationInfo.markup_cyl_range_1_markup ?? 0,
        markup_cyl_range_2_min: personalisationInfo.markup_cyl_range_2_min ?? 2,
        markup_cyl_range_2_max: personalisationInfo.markup_cyl_range_2_max ?? 4,
        markup_cyl_range_2_markup: personalisationInfo.markup_cyl_range_2_markup ?? 15,
        markup_cyl_range_3_min: personalisationInfo.markup_cyl_range_3_min ?? 4,
        markup_cyl_range_3_max: personalisationInfo.markup_cyl_range_3_max ?? 999,
        markup_cyl_range_3_markup: personalisationInfo.markup_cyl_range_3_markup ?? 30
      });
    }
  }, [personalisationInfo]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PersonalisationData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: updatedData, error } = await supabase
        .from('user_information')
        .upsert({
          user_id: user.id,
          auto_additional_costs: data.auto_additional_costs,
          sv_lens_cost: data.sv_lens_cost,
          progressive_lens_cost: data.progressive_lens_cost,
          frames_cost: data.frames_cost,
          markup_sph_range_1_min: data.markup_sph_range_1_min,
          markup_sph_range_1_max: data.markup_sph_range_1_max,
          markup_sph_range_1_markup: data.markup_sph_range_1_markup,
          markup_sph_range_2_min: data.markup_sph_range_2_min,
          markup_sph_range_2_max: data.markup_sph_range_2_max,
          markup_sph_range_2_markup: data.markup_sph_range_2_markup,
          markup_sph_range_3_min: data.markup_sph_range_3_min,
          markup_sph_range_3_max: data.markup_sph_range_3_max,
          markup_sph_range_3_markup: data.markup_sph_range_3_markup,
          markup_cyl_range_1_min: data.markup_cyl_range_1_min,
          markup_cyl_range_1_max: data.markup_cyl_range_1_max,
          markup_cyl_range_1_markup: data.markup_cyl_range_1_markup,
          markup_cyl_range_2_min: data.markup_cyl_range_2_min,
          markup_cyl_range_2_max: data.markup_cyl_range_2_max,
          markup_cyl_range_2_markup: data.markup_cyl_range_2_markup,
          markup_cyl_range_3_min: data.markup_cyl_range_3_min,
          markup_cyl_range_3_max: data.markup_cyl_range_3_max,
          markup_cyl_range_3_markup: data.markup_cyl_range_3_markup,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: (updatedData) => {
      toast({
        title: t('settingsUpdated'),
        description: t('settingsSaved'),
      });
      setHasChanges(false);
      
      // Update the query cache with the new data immediately
      queryClient.setQueryData(['user-information', user?.id], updatedData);
      
      // Also invalidate to ensure consistency across all pages
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

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      await createCompany.mutateAsync(newCompanyName.trim());
      setNewCompanyName('');
      toast({
        title: t('success'),
        description: t('companyCreated'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message.includes('duplicate') ? t('companyAlreadyExists') : t('failedToCreateCompany'),
        variant: "destructive",
      });
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany || !editingCompany.name.trim()) return;

    try {
      await updateCompany.mutateAsync({
        id: editingCompany.id,
        name: editingCompany.name.trim()
      });
      setEditingCompany(null);
      toast({
        title: t('success'),
        description: t('companyUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message.includes('duplicate') ? t('companyAlreadyExists') : t('failedToUpdateCompany'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteCompany.mutateAsync(id);
      toast({
        title: t('success'),
        description: t('companyDeleted'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToDeleteCompany'),
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
          {/* Companies Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('companiesManagement')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-semibold">{t('customCompanies')}</h3>
                </div>

                {/* Add new company */}
                <div className="flex gap-2">
                  <Input
                    placeholder={t('enterCompanyName')}
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCompany()}
                  />
                  <Button
                    onClick={handleCreateCompany}
                    disabled={!newCompanyName.trim() || createCompany.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Custom companies list */}
                <div className="space-y-2">
                  {customCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      {editingCompany?.id === company.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingCompany.name}
                            onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleUpdateCompany()}
                            className="bg-white"
                          />
                          <Button
                            size="sm"
                            onClick={handleUpdateCompany}
                            disabled={updateCompany.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCompany(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{company.name}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCompany({ id: company.id, name: company.name })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCompany(company.id)}
                              disabled={deleteCompany.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {customCompanies.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      {t('noCustomCompanies')}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50/50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{t('defaultCompanies')}</h4>
                <div className="flex flex-wrap gap-2">
                  {["Indo", "ABlens", "Essilor", "GLASSANDLENS", "Optifak"].map((company) => (
                    <span key={company} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {company}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {t('theseCompaniesAlwaysAvailable')}
                </p>
              </div>
            </CardContent>
          </Card>

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

          {/* Eyes Linking Markup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('eyesLinkingMarkupSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50/50 rounded-lg p-4 space-y-6">
                <h4 className="font-medium text-blue-900">{t('markupRangesConfiguration')}</h4>

                {/* SPH Ranges */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-700">{t('sphSphereRanges')}</h5>

                  {/* Range 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-white rounded-lg border">
                    <div>
                      <Label className="text-sm font-medium">{t('range1')}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('min')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_1_min}
                        onChange={(e) => handleInputChange('markup_sph_range_1_min', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('max')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_1_max}
                        onChange={(e) => handleInputChange('markup_sph_range_1_max', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('markupPercent')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_1_markup}
                        onChange={(e) => handleInputChange('markup_sph_range_1_markup', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Range 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-white rounded-lg border">
                    <div>
                      <Label className="text-sm font-medium">{t('range2')}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('min')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_2_min}
                        onChange={(e) => handleInputChange('markup_sph_range_2_min', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('max')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_2_max}
                        onChange={(e) => handleInputChange('markup_sph_range_2_max', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('markupPercent')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_2_markup}
                        onChange={(e) => handleInputChange('markup_sph_range_2_markup', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Range 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-white rounded-lg border">
                    <div>
                      <Label className="text-sm font-medium">{t('range3')}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('min')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_3_min}
                        onChange={(e) => handleInputChange('markup_sph_range_3_min', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('max')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_3_max}
                        onChange={(e) => handleInputChange('markup_sph_range_3_max', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('markupPercent')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_sph_range_3_markup}
                        onChange={(e) => handleInputChange('markup_sph_range_3_markup', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* CYL Ranges */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-700">{t('cylCylinderRanges')}</h5>

                  {/* Range 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-white rounded-lg border">
                    <div>
                      <Label className="text-sm font-medium">{t('range1')}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('min')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_1_min}
                        onChange={(e) => handleInputChange('markup_cyl_range_1_min', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('max')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_1_max}
                        onChange={(e) => handleInputChange('markup_cyl_range_1_max', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('markupPercent')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_1_markup}
                        onChange={(e) => handleInputChange('markup_cyl_range_1_markup', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Range 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-white rounded-lg border">
                    <div>
                      <Label className="text-sm font-medium">{t('range2')}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('min')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_2_min}
                        onChange={(e) => handleInputChange('markup_cyl_range_2_min', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('max')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_2_max}
                        onChange={(e) => handleInputChange('markup_cyl_range_2_max', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('markupPercent')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_2_markup}
                        onChange={(e) => handleInputChange('markup_cyl_range_2_markup', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Range 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bgwhite rounded-lg border">
                    <div>
                      <Label className="text-sm font-medium">{t('range3')}</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('min')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_3_min}
                        onChange={(e) => handleInputChange('markup_cyl_range_3_min', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('max')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_3_max}
                        onChange={(e) => handleInputChange('markup_cyl_range_3_max', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('markupPercent')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.markup_cyl_range_3_markup}
                        onChange={(e) => handleInputChange('markup_cyl_range_3_markup', e.target.value)}
                        className="bg-white"
                      />
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