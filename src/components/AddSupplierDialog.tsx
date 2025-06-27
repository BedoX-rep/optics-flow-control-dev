

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Building2, User, Phone, Mail, MapPin, FileText } from "lucide-react";

interface AddSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded: (supplier: any) => void;
}

const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({
  isOpen,
  onClose,
  onSupplierAdded,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...formData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('supplierAdded'),
      });

      onSupplierAdded(data);
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: t('error'),
        description: t('failedToAddSupplier'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            {t('addNewSupplier')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
                <User className="h-4 w-4" />
                {t('businessInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                  {t('supplierName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('enterSupplierName')}
                  required
                  disabled={isSubmitting}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <Label htmlFor="contact_person" className="text-sm font-medium">
                  {t('contactPerson')}
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder={t('enterContactPerson')}
                  disabled={isSubmitting}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                <Phone className="h-4 w-4" />
                {t('contactInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {t('phoneNumber')}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('enterPhoneNumber')}
                    disabled={isSubmitting}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {t('emailAddress')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('enterEmailAddress')}
                    disabled={isSubmitting}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t('address')}
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('enterAddress')}
                  disabled={isSubmitting}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-700">
                <FileText className="h-4 w-4" />
                {t('notes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes" className="text-sm font-medium">
                {t('notes')} ({t('optional')})
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('enterNotes')}
                disabled={isSubmitting}
                className="mt-1 focus:ring-gray-500 focus:border-gray-500"
                rows={3}
              />
            </CardContent>
          </Card>

          <DialogFooter className="pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="min-w-[150px] bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? t('adding') : t('addSupplierButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierDialog;
