
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadIcon, Sparkles, Package, DollarSign, Building, Layers, Eye, Palette, Truck, Archive, Tag, Hash, Wrench } from "lucide-react";
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
    <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <DialogHeader className="space-y-4 pb-6 border-b border-teal-100">
        <div className="flex items-center justify-center gap-4">
          <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-xl shadow-teal-600/25">
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-teal-700 to-blue-600 bg-clip-text text-transparent">
              {initialValues.name ? t('editProduct') : t('addProduct')}
            </DialogTitle>
            <p className="text-gray-500 text-sm mt-1">
              {t('fillProductDetails') || 'Fill in the product details below'}
            </p>
          </div>
        </div>
      </DialogHeader>

      <form className="space-y-8 p-6" onSubmit={onFormSubmit}>
        {/* Auto Name Generation Banner */}
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 shadow-lg shadow-teal-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-teal-100 rounded-full">
                  <Sparkles className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={autoName}
                      onCheckedChange={handleAutoNameToggle}
                      id="auto-name"
                      className="border-teal-400 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <Label htmlFor="auto-name" className="cursor-pointer font-semibold text-teal-800 text-lg">
                      {t('generateNameAuto')}
                    </Label>
                  </div>
                  <p className="text-sm text-teal-600 mt-1">
                    {t('autoGenerateProductName') || 'Automatically generate product name based on specifications'}
                  </p>
                </div>
              </div>
              {autoName && (
                <Badge variant="secondary" className="bg-teal-100 text-teal-700 px-4 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('auto')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Product Classification */}
          <div className="space-y-6">
            <Card className="border-blue-200 shadow-lg shadow-blue-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <Tag className="h-5 w-5" />
                  {t('productClassification') || 'Product Classification'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Category */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Package className="h-4 w-4 text-blue-600" />
                    {t('category')}
                  </Label>
                  <Select
                    value={form.category ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 h-12">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border-gray-200 shadow-xl">
                      <SelectItem value="none_selected" className="text-gray-500">{t('none')}</SelectItem>
                      {CATEGORY_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="flex items-center py-3">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-blue-600" />
                              {t(opt.labelKey)}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Building className="h-4 w-4 text-blue-600" />
                    {t('company')}
                  </Label>
                  <Select
                    value={form.company ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 h-12">
                      <SelectValue placeholder={t('selectCompany')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white shadow-xl">
                      <SelectItem value="none_selected">{t('none')}</SelectItem>
                      {COMPANY_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt} className="py-3">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gamma */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Palette className="h-4 w-4 text-blue-600" />
                    {t('gamma')}
                  </Label>
                  <Input
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 h-12"
                    value={form.gamma ?? ""}
                    onChange={e => setForm(f => ({ ...f, gamma: e.target.value || undefined }))}
                    placeholder={t('enterGamma')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lens Specifications - Only for lenses */}
            {showIndexTreatment && (
              <Card className="border-purple-200 shadow-lg shadow-purple-100/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-purple-700">
                    <Eye className="h-5 w-5" />
                    {t('lensSpecifications') || 'Lens Specifications'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Hash className="h-4 w-4 text-purple-600" />
                      {t('index')}
                    </Label>
                    <Select
                      value={form.index ?? ""}
                      onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 h-12">
                        <SelectValue placeholder={t('selectIndex')} />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white shadow-xl">
                        <SelectItem value="none_selected">{t('none')}</SelectItem>
                        {INDEX_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt} className="py-3">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Wrench className="h-4 w-4 text-purple-600" />
                      {t('treatment')}
                    </Label>
                    <Select
                      value={form.treatment ?? ""}
                      onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 h-12">
                        <SelectValue placeholder={t('selectTreatment')} />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white shadow-xl">
                        <SelectItem value="none_selected">{t('none')}</SelectItem>
                        {TREATMENT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="py-3">{t(opt.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Pricing & Financial */}
          <div className="space-y-6">
            <Card className="border-green-200 shadow-lg shadow-green-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-green-700">
                  <DollarSign className="h-5 w-5" />
                  {t('pricingFinancial') || 'Pricing & Financial'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    {t('price')} (DH)
                  </Label>
                  <Input
                    type="number"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500/20 h-12 text-lg font-semibold"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    min={0}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    {t('costTTC')} (DH)
                  </Label>
                  <Input
                    type="number"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500/20 h-12 text-lg font-semibold"
                    value={form.cost_ttc ?? 0}
                    onChange={e => setForm(f => ({ ...f, cost_ttc: Number(e.target.value) }))}
                    min={0}
                    placeholder="0.00"
                  />
                </div>

                {/* Profit Margin Display */}
                {form.price > 0 && (form.cost_ttc ?? 0) > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">{t('profitMargin') || 'Profit Margin'}:</span>
                      <span className="text-lg font-bold text-green-800">
                        {(((form.price - (form.cost_ttc ?? 0)) / form.price) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-green-700">{t('profit')}:</span>
                      <span className="text-lg font-bold text-green-800">
                        {(form.price - (form.cost_ttc ?? 0)).toFixed(2)} DH
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Management */}
            <Card className="border-orange-200 shadow-lg shadow-orange-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-orange-700">
                  <Archive className="h-5 w-5" />
                  {t('stockManagement') || 'Stock Management'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Truck className="h-4 w-4 text-orange-600" />
                    {t('stockStatus')}
                  </Label>
                  <Select
                    value={form.stock_status}
                    onValueChange={v => setForm(f => ({ ...f, stock_status: v as 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock', stock: v !== 'inStock' ? undefined : f.stock }))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 h-12">
                      <SelectValue placeholder={t('selectStockStatus')} />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white shadow-xl">
                      <SelectItem value="Order" className="py-3">{t('order')}</SelectItem>
                      <SelectItem value="inStock" className="py-3">{t('inStock')}</SelectItem>
                      <SelectItem value="Fabrication" className="py-3">{t('fabrication')}</SelectItem>
                      <SelectItem value="Out Of Stock" className="py-3">{t('outOfStock')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.stock_status === 'inStock' && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Hash className="h-4 w-4 text-orange-600" />
                      {t('stock')} {t('quantity') || 'Quantity'}
                    </Label>
                    <Input
                      type="number"
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 h-12 text-lg font-semibold"
                      value={form.stock ?? 0}
                      onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                      min={0}
                      placeholder="0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Details & Image */}
          <div className="space-y-6">
            {/* Product Name */}
            <Card className="border-gray-300 shadow-lg shadow-gray-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-700">
                  <Package className="h-5 w-5" />
                  {t('productDetails') || 'Product Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Tag className="h-4 w-4 text-gray-600" />
                    {t('productName')}
                  </Label>
                  <Input
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 h-12 text-lg font-semibold"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    disabled={autoName}
                    required
                    placeholder={autoName ? t('autoGenerated') || 'Auto-generated' : t('enterProductName') || 'Enter product name'}
                  />
                  {autoName && (
                    <p className="text-xs text-teal-600 mt-2">
                      {t('nameAutoGenerated') || 'Name is automatically generated based on specifications'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card className="border-indigo-200 shadow-lg shadow-indigo-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-indigo-700">
                  <UploadIcon className="h-5 w-5" />
                  {t('productImage') || 'Product Image'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">
                    {t('image')}
                  </Label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    {form.image && typeof form.image === "string" && (
                      <div className="flex justify-center">
                        <img 
                          src={form.image} 
                          alt="product preview" 
                          className="w-32 h-32 object-cover rounded-xl border-4 border-indigo-200 shadow-lg" 
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      {t('imageUploadHint') || 'Recommended: PNG or JPG format, max 2MB'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={disabled || uploading}
            className="px-8 py-3 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            className="px-8 py-3 h-12 bg-gradient-to-r from-teal-600 via-teal-700 to-blue-600 hover:from-teal-700 hover:via-teal-800 hover:to-blue-700 text-white shadow-xl shadow-teal-600/25 transition-all duration-300 font-semibold" 
            disabled={disabled || uploading}
          >
            {uploading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('uploading')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('saveButton')}
              </div>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default ProductForm;
