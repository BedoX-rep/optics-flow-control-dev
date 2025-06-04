
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import { useAuth } from '@/components/AuthProvider';
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

  // Fetch user information
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['user-information', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First, try to get existing user information
      const { data: existingInfo } = await supabase
        .from('user_information')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingInfo) {
        return existingInfo;
      }

      // If no user information exists, initialize from subscription data
      await supabase.rpc('initialize_user_information', { user_uuid: user.id });

      // Fetch the newly created record
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
        title: "Settings Saved",
        description: "Your optician information has been successfully updated.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['user-information', user?.id] });
    },
    onError: (error) => {
      console.error('Error saving user information:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
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

      handleInputChange('logo_url', data.publicUrl);

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload logo. Please try again.",
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
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageTitle 
          title="Optician Settings" 
          subtitle="Manage your business information and settings"
        />

        <div className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input
                    id="store_name"
                    value={formData.store_name}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                    placeholder="Enter your store name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your complete business address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_legal_status">Company Legal Status</Label>
                <Select
                  value={formData.company_legal_status}
                  onValueChange={(value) => handleInputChange('company_legal_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select legal status" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax & Legal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Business Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending || uploading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticianSettings;
