
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadIcon, Sparkles, Package, DollarSign, Building, Layers, Eye, Palette, Truck, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORY_OPTIONS = [
  { value: "Single Vision Lenses", abbr: "SV", labelKey: "singleVisionLenses", icon: Eye },
  { value: "Progressive Lenses", abbr: "PG", labelKey: "progressiveLenses", icon: Layers },
  { value: "Frames", abbr: "FR", labelKey: "frames", icon: Package },
  { value: "Sunglasses", abbr: "SG", labelKey: "sunglasses", icon: Eye },
  { value: "Contact Lenses", abbr: "CL", labelKey: "contactLenses", icon: Eye },
  { value: "Accessories", abbr: "AC", labelKey: "accessories", icon: Package }
];

const INDEX_OPTIONS = [
  "1.56",
  "1.6",
  "1.67",
  "1.74"
];

const TREATMENT_OPTIONS = [
  { value: "White", labelKey: "white" },
  { value: "AR", labelKey: "ar" },
  { value: "Blue", labelKey: "blue" },
  { value: "Photochromic", labelKey: "photochromic" }
];

const COMPANY_OPTIONS = [
  "Indo",
  "ABlens",
  "Essilor",
  "GLASSANDLENS",
  "Optifak"
];

const GAMMA_OPTIONS = [
  "Standard",
  "Premium",
  "High-End",
  "Budget"
];

export interface ProductFormValues {
  name: string;
  price: number;
  category?: string;
  index?: string;
  treatment?: string;
  company?: string;
  gamma?: string;
  image?: string;
  automated_name?: boolean;
  created_at?: string;
  cost_ttc?: number;
  stock_status?: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock';
  stock?: number;
}

interface ProductFormProps {
  initialValues: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const getCategoryAbbr = (category: string | undefined) => {
  const found = CATEGORY_OPTIONS.find(o => o.value === category);
  return found?.abbr || "";
};

const ProductForm: React.FC<ProductFormProps> = ({ initialValues, onSubmit, onCancel, disabled }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<ProductFormValues>({
    name: "",
    price: 0,
    stock_status: 'Order',
    automated_name: true,
    ...initialValues
  });
  const [autoName, setAutoName] = useState<boolean>(initialValues.automated_name ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Auto-generate name if toggled on and any relevant field changes
  useEffect(() => {
    if (autoName) {
      let abbr = getCategoryAbbr(form.category);

      // Only include index/treatment for SV/PG
      let parts = [abbr];

      if (["Single Vision Lenses", "Progressive Lenses"].includes(form.category ?? "")) {
        if (form.index) parts.push(form.index);
        if (form.treatment) parts.push(form.treatment?.toUpperCase());
      }
      if (form.company) parts.push(form.company?.toUpperCase());
      if (form.gamma) parts.push(form.gamma?.toUpperCase());
      if (form.stock_status === 'inStock' || form.stock_status === 'Fabrication') {
        parts.push(form.stock_status === 'inStock' ? 'INSTOCK' : 'FABRICATION');
      }

      const generatedName = parts.filter(Boolean).join(" ");
      setForm(f => ({
        ...f,
        name: generatedName,
        automated_name: true
      }));
    } else {
      setForm(f => ({
        ...f,
        automated_name: false
      }));
    }
  }, [form.category, form.index, form.treatment, form.company, form.gamma, form.stock_status, autoName]);

  // Update autoName state when form.automated_name changes from external source
  useEffect(() => {
    setAutoName(form.automated_name ?? true);
  }, [form.automated_name]);

  // Determine which extra fields should show
  const showIndexTreatment = ["Single Vision Lenses", "Progressive Lenses"].includes(form.category ?? "");

  // Image handling (upload to Supabase Storage or base64 preview instead for now)
  const handleImageUpload = async () => {
    if (!imageFile) return "";
    setUploading(true);
    // Use Supabase Storage if available. For now, base64 preview:
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        setUploading(false);
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name.trim()) {
      return;
    }

    let imageUrl = form.image;
    if (imageFile) {
      imageUrl = await handleImageUpload();
    }

    // Ensure proper data types and clean up the form data
    const submissionData = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      cost_ttc: Number(form.cost_ttc) || 0,
      stock: form.stock_status === 'inStock' ? (Number(form.stock) || 0) : undefined,
      stock_status: form.stock_status,
      category: form.category || undefined,
      index: form.index || undefined,
      treatment: form.treatment || undefined,
      company: form.company || undefined,
      gamma: form.gamma || undefined,
      automated_name: autoName,
      image: imageUrl || undefined
    };

    console.log('Submitting form data:', submissionData); // Debug log
    onSubmit(submissionData);
  };

  const handleAutoNameToggle = (checked: boolean) => {
    setAutoName(checked);
    // If turning off auto-naming, keep the current name but allow editing
    if (!checked) {
      setForm(f => ({
        ...f,
        automated_name: false
      }));
    }
  };

  const selectedCategory = CATEGORY_OPTIONS.find(cat => cat.value === form.category);
  const IconComponent = selectedCategory?.icon || Package;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-2 pb-4 border-b border-teal-100">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full shadow-lg">
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              {initialValues.name ? t('editProduct') : t('newProduct')}
            </h2>
            <p className="text-sm text-gray-500">{t('fillProductDetails')}</p>
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={onFormSubmit}>
        {/* Auto Name Generation */}
        <Card className="border-teal-100 bg-gradient-to-r from-teal-50/50 to-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <div className="flex items-center space-x-2 flex-1">
                <Checkbox
                  checked={autoName}
                  onCheckedChange={handleAutoNameToggle}
                  id="auto-name"
                  className="border-teal-300 data-[state=checked]:bg-teal-600"
                />
                <Label htmlFor="auto-name" className="cursor-pointer font-medium text-teal-700">
                  {t('generateNameAuto')}
                </Label>
              </div>
              {autoName && <Badge variant="secondary" className="bg-teal-100 text-teal-700">Auto</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Main Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Package className="h-4 w-4 text-teal-600" />
                {t('category')}
              </Label>
              <Select
                value={form.category ?? ""}
                onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
              >
                <SelectTrigger className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border-gray-200 shadow-lg">
                  <SelectItem value="none_selected" className="text-gray-500">{t('none')}</SelectItem>
                  {CATEGORY_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value} className="flex items-center">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-teal-600" />
                          {t(opt.labelKey)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Index & Treatment for Lenses */}
            {showIndexTreatment && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  {t('lensSpecifications')}
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">{t('index')}</Label>
                  <Select
                    value={form.index ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder={t('selectIndex')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white">
                      <SelectItem value="none_selected">{t('none')}</SelectItem>
                      {INDEX_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">{t('treatment')}</Label>
                  <Select
                    value={form.treatment ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder={t('selectTreatment')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white">
                      <SelectItem value="none_selected">{t('none')}</SelectItem>
                      {TREATMENT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Company */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building className="h-4 w-4 text-teal-600" />
                {t('company')}
              </Label>
              <Select
                value={form.company ?? ""}
                onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
              >
                <SelectTrigger className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20">
                  <SelectValue placeholder={t('selectCompany')} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white">
                  <SelectItem value="none_selected">{t('none')}</SelectItem>
                  {COMPANY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gamma */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Palette className="h-4 w-4 text-teal-600" />
                {t('gamma')}
              </Label>
              <Input
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                value={form.gamma ?? ""}
                onChange={e => setForm(f => ({ ...f, gamma: e.target.value || undefined }))}
                placeholder={t('enterGamma')}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Pricing Section */}
            <Card className="border-green-100 bg-gradient-to-r from-green-50/50 to-emerald-50/30">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {t('pricing')}
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">{t('price')}</Label>
                  <Input
                    type="number"
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    min={0}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">{t('costTTC')}</Label>
                  <Input
                    type="number"
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    value={form.cost_ttc ?? 0}
                    onChange={e => setForm(f => ({ ...f, cost_ttc: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stock Management */}
            <Card className="border-orange-100 bg-gradient-to-r from-orange-50/50 to-yellow-50/30">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Archive className="h-4 w-4 text-orange-600" />
                  {t('stockManagement')}
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">{t('stockStatus')}</Label>
                  <Select
                    value={form.stock_status}
                    onValueChange={v => setForm(f => ({ ...f, stock_status: v as 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock', stock: v !== 'inStock' ? undefined : f.stock }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                      <SelectValue placeholder={t('selectStockStatus')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white">
                      <SelectItem value="Order">{t('order')}</SelectItem>
                      <SelectItem value="inStock">{t('inStock')}</SelectItem>
                      <SelectItem value="Fabrication">{t('fabrication')}</SelectItem>
                      <SelectItem value="Out Of Stock">{t('outOfStock')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.stock_status === 'inStock' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">{t('stock')}</Label>
                    <Input
                      type="number"
                      className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                      value={form.stock ?? 0}
                      onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                      min={0}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UploadIcon className="h-4 w-4 text-teal-600" />
                {t('image')}
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
                {form.image && typeof form.image === "string" && (
                  <img src={form.image} alt="product preview" className="w-12 h-12 object-cover rounded-lg border-2 border-teal-200" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Name */}
        <Card className="border-gray-200 bg-gradient-to-r from-gray-50/50 to-slate-50/30">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Package className="h-4 w-4 text-gray-600" />
                {t('productName')}
              </Label>
              <Input
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 font-medium"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                disabled={autoName}
                required
                placeholder={autoName ? t('autoGenerated') : t('enterProductName')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <DialogFooter className="flex gap-3 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={disabled || uploading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-600/25 transition-all duration-200" 
            disabled={disabled || uploading}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('uploading')}
              </div>
            ) : (
              t('saveButton')
            )}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

export default ProductForm;
