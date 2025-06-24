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
import { Save, Settings, DollarSign, Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { DEFAULT_COMPANIES } from '../components/products/CompanyCellEditor';

interface PersonalisationData {
  auto_additional_costs: boolean;
  sv_lens_cost: number;
  progressive_lens_cost: number;
  frames_cost: number;
}

interface Company {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');

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

  // Fetch companies
  const { data: companies = [], refetch: refetchCompanies } = useQuery({
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

      return [...DEFAULT_COMPANIES, ...userCompanies];
    },
    enabled: !!user,
  });

  // Add company mutation
  const addCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('companies')
        .insert({
          name: name.trim(),
          user_id: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: 'Company added successfully',
      });
      setNewCompanyName('');
      refetchCompanies();
    },
    onError: (error: any) => {
      console.error('Error adding company:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to add company',
        variant: "destructive",
      });
    }
  });

  // Edit company mutation
  const editCompanyMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('companies')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: 'Company updated successfully',
      });
      setEditingCompany(null);
      setEditCompanyName('');
      refetchCompanies();
    },
    onError: (error: any) => {
      console.error('Error updating company:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to update company',
        variant: "destructive",
      });
    }
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: 'Company deleted successfully',
      });
      refetchCompanies();
    },
    onError: (error: any) => {
      console.error('Error deleting company:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to delete company',
        variant: "destructive",
      });
    }
  });

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

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      addCompanyMutation.mutate(newCompanyName);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
  };

  const handleUpdateCompany = () => {
    if (editingCompany && editCompanyName.trim()) {
      editCompanyMutation.mutate({ id: editingCompany.id, name: editCompanyName });
    }
  };

  const handleDeleteCompany = (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteCompanyMutation.mutate(id);
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
                {t('companies') || 'Companies'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-semibold">{t('addNewCompany') || 'Add New Company'}</h3>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder={t('companyName') || 'Company name'}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddCompany}
                    disabled={!newCompanyName.trim() || addCompanyMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add') || 'Add'}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('allCompanies') || 'All Companies'}</h3>

                <div className="grid gap-3">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-gray-600" />
                        {editingCompany?.id === company.id ? (
                          <Input
                            value={editCompanyName}
                            onChange={(e) => setEditCompanyName(e.target.value)}
                            className="bg-white"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{company.name}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {editingCompany?.id === company.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleUpdateCompany}
                              disabled={!editCompanyName.trim() || editCompanyMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCompany(null);
                                setEditCompanyName('');
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCompany(company)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCompany(company.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={deleteCompanyMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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