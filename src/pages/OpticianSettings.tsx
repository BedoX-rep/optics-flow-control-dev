
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useUserInformation } from '@/hooks/useUserInformation';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, Building2, User, MapPin, FileText, Globe, Phone, Mail } from 'lucide-react';

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
}

const LEGAL_STATUS_OPTIONS = [
  'SARL',
  'SA',
  'SAS',
  'EURL',
  'Auto-entrepreneur',
  'Entreprise individuelle',
  'SNC',
  'SCS',
  'Autre'
];

const OpticianSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UserInformation>({
    user_id: user?.id || '',
    store_name: '',
    display_name: '',
    address: '',
    vat_number: '',
    ice: '',
    inpe: '',
    company_legal_status: '',
    logo_url: '',
    phone: '',
    email: '',
    website: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch user information using custom hook
  const { data: userInfo, isLoading } = useUserInformation();

  // Update form data when user info is loaded
  useEffect(() => {
    if (userInfo) {
      setFormData({
        id: userInfo.id,
        user_id: userInfo.user_id,
        store_name: userInfo.store_name || '',
        display_name: userInfo.display_name || '',
        address: userInfo.address || '',
        vat_number: userInfo.vat_number || '',
        ice: userInfo.ice || '',
        inpe: userInfo.inpe || '',
        company_legal_status: userInfo.company_legal_status || '',
        logo_url: userInfo.logo_url || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        website: userInfo.website || ''
      });
    }
  }, [userInfo]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: UserInformation) => {
      const { data: updatedData, error } = await supabase
        .from('user_information')
        .upsert({
          ...data,
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
        title: t('settingsSaved'),
        description: t('opticianInfoUpdated'),
      });
      setHasChanges(false);

      // Update the query cache with the new data immediately
      queryClient.setQueryData(['user-information', user?.id], updatedData);

      // Also invalidate to ensure consistency
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

  const handleInputChange = (field: keyof UserInformation, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const newLogoUrl = data.publicUrl;
      handleInputChange('logo_url', newLogoUrl);

      // Update the cache immediately with the new logo URL
      if (userInfo) {
        const updatedUserInfo = { ...userInfo, logo_url: newLogoUrl };
        queryClient.setQueryData(['user-information', user?.id], updatedUserInfo);
      }

      toast({
        title: t('logoUploaded'),
        description: t('logoUploadedSuccess'),
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: t('uploadError'),
        description: t('failedToUploadLogo'),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
    <div className="flex-1 w-full max-w-none px-4 md:px-8 pt-6 pb-20 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('opticianSettings')}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">{t('manageBusinessInfo')}</p>
        </div>
        <div className="flex justify-end hidden md:flex">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending || uploading}
            className="bg-teal-600 hover:bg-teal-700 h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 transition-all active:scale-95"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Business Information */}
          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
            <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50 pt-6 px-6 md:px-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                <div className="p-2.5 bg-blue-100/80 text-blue-600 rounded-xl shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                {t('businessInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-8 pb-8 px-6 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">{t('storeName')}</Label>
                  <Input
                    id="store_name"
                    value={formData.store_name}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                    placeholder={t('enterStoreName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">{t('displayName')}</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder={t('enterDisplayName')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('businessAddress')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('enterCompleteAddress')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_legal_status">{t('companyLegalStatus')}</Label>
                <Select
                  value={formData.company_legal_status}
                  onValueChange={(value) => handleInputChange('company_legal_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectLegalStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Legal Information */}
          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
            <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50 pt-6 px-6 md:px-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                <div className="p-2.5 bg-purple-100/80 text-purple-600 rounded-xl shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                Tax & Legal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-8 pb-8 px-6 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat_number">VAT Number</Label>
                  <Input
                    id="vat_number"
                    value={formData.vat_number}
                    onChange={(e) => handleInputChange('vat_number', e.target.value)}
                    placeholder="Enter VAT number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ice">ICE Number</Label>
                  <Input
                    id="ice"
                    value={formData.ice}
                    onChange={(e) => handleInputChange('ice', e.target.value)}
                    placeholder="Enter ICE number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inpe">INPE Number</Label>
                  <Input
                    id="inpe"
                    value={formData.inpe}
                    onChange={(e) => handleInputChange('inpe', e.target.value)}
                    placeholder="Enter INPE number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
            <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50 pt-6 px-6 md:px-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                <div className="p-2.5 bg-rose-100/80 text-rose-600 rounded-xl shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-8 pb-8 px-6 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Logo Upload */}
          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden hover:bg-white/80 transition-all duration-300">
            <CardHeader className="border-b border-slate-100/60 pb-5 bg-slate-50/50 pt-6 px-6 md:px-8">
              <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                <div className="p-2.5 bg-teal-100/80 text-teal-600 rounded-xl shadow-sm">
                  <Upload className="h-5 w-5" />
                </div>
                Business Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-8 pb-8 px-6 md:px-8">
              {formData.logo_url && (
                <div className="flex justify-center">
                  <img
                    src={formData.logo_url}
                    alt="Business Logo"
                    className="max-h-32 object-contain border rounded-lg"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo">Upload Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recommended: PNG or JPG format, max 2MB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Mobile Save Button */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending || uploading}
            size="icon"
            className="h-14 w-14 rounded-full bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-500/30 transition-all active:scale-95"
          >
            <Save className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OpticianSettings;
