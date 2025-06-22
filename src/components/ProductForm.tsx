
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
    <DialogContent className="max-w-6xl max-h-[95vh] bg-white">
      <DialogHeader className="space-y-2 pb-4 border-b">
        <DialogTitle className="text-2xl font-semibold text-gray-900">
          {initialValues.name ? t('editProduct') : t('addProduct')}
        </DialogTitle>
      </DialogHeader>

      <form className="space-y-4 p-4" onSubmit={onFormSubmit}>
        {/* Auto Name Generation */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={autoName}
            onCheckedChange={handleAutoNameToggle}
            id="auto-name"
            className="border-gray-400"
          />
          <Label htmlFor="auto-name" className="cursor-pointer font-medium text-gray-700">
            {t('generateNameAuto')}
          </Label>
          {autoName && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {t('auto')}
            </Badge>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Product Classification */}
          <div className="space-y-3">
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                  <Tag className="h-4 w-4" />
                  {t('productClassification') || 'Product Classification'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Category */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('category')}
                  </Label>
                  <Select
                    value={form.category ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selected">{t('none')}</SelectItem>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('company')}
                  </Label>
                  <Select
                    value={form.company ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('selectCompany')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selected">{t('none')}</SelectItem>
                      {COMPANY_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gamma */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('gamma')}
                  </Label>
                  <Input
                    className="h-9"
                    value={form.gamma ?? ""}
                    onChange={e => setForm(f => ({ ...f, gamma: e.target.value || undefined }))}
                    placeholder={t('enterGamma')}
                  />
                </div>

                {/* Lens Specifications - Only for lenses */}
                {showIndexTreatment && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium text-gray-800">{t('lensSpecifications') || 'Lens Specifications'}</span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('index')}
                        </Label>
                        <Select
                          value={form.index ?? ""}
                          onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('selectIndex')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_selected">{t('none')}</SelectItem>
                            {INDEX_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('treatment')}
                        </Label>
                        <Select
                          value={form.treatment ?? ""}
                          onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('selectTreatment')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_selected">{t('none')}</SelectItem>
                            {TREATMENT_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons moved here */}
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={disabled || uploading}
                className="w-full"
              >
                {uploading ? t('uploading') : t('saveButton')}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={onCancel}
                disabled={disabled || uploading}
                className="w-full"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>

          {/* Middle Column - Pricing & Financial */}
          <div className="space-y-3">
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                  <DollarSign className="h-4 w-4" />
                  {t('pricingFinancial') || 'Pricing & Financial'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('price')} (DH)
                  </Label>
                  <Input
                    className="h-9"
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    min={0}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('costTTC')} (DH)
                  </Label>
                  <Input
                    className="h-9"
                    type="number"
                    value={form.cost_ttc ?? 0}
                    onChange={e => setForm(f => ({ ...f, cost_ttc: Number(e.target.value) }))}
                    min={0}
                    placeholder="0.00"
                  />
                </div>

                {/* Profit Margin Display */}
                {form.price > 0 && (form.cost_ttc ?? 0) > 0 && (
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="flex justify-between text-sm">
                      <span>{t('profitMargin') || 'Profit Margin'}:</span>
                      <span className="font-semibold">
                        {(((form.price - (form.cost_ttc ?? 0)) / form.price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-3">
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                  <Package className="h-4 w-4" />
                  {t('productDetails') || 'Product Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('productName')}
                  </Label>
                  <Input
                    className="h-9"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    disabled={autoName}
                    required
                    placeholder={autoName ? t('autoGenerated') || 'Auto-generated' : t('enterProductName') || 'Enter product name'}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('stockStatus')}
                  </Label>
                  <Select
                    value={form.stock_status}
                    onValueChange={v => setForm(f => ({ ...f, stock_status: v as 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock', stock: v !== 'inStock' ? undefined : f.stock }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('selectStockStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Order">{t('order')}</SelectItem>
                      <SelectItem value="inStock">{t('inStock')}</SelectItem>
                      <SelectItem value="Fabrication">{t('fabrication')}</SelectItem>
                      <SelectItem value="Out Of Stock">{t('outOfStock')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.stock_status === 'inStock' && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('stock')} {t('quantity') || 'Quantity'}
                    </Label>
                    <Input
                      className="h-9"
                      type="number"
                      value={form.stock ?? 0}
                      onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                      min={0}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('image')}
                  </Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  {form.image && typeof form.image === "string" && (
                    <img 
                      src={form.image} 
                      alt="product preview" 
                      className="w-16 h-16 object-cover rounded border mt-2" 
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DialogContent>
  );
};

export default ProductForm;
