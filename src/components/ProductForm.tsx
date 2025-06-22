import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, DollarSign, Building, Eye, Hash, Wrench, Tag, UploadIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORY_OPTIONS = [
  { value: "Single Vision Lenses", abbr: "SV", labelKey: "singleVisionLenses", icon: Eye },
  { value: "Progressive Lenses", abbr: "PG", labelKey: "progressiveLenses", icon: Eye },
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

  // Image handling
  const handleImageUpload = async () => {
    if (!imageFile) return "";
    setUploading(true);
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

    onSubmit(submissionData);
  };

  const handleAutoNameToggle = (checked: boolean) => {
    setAutoName(checked);
    if (!checked) {
      setForm(f => ({
        ...f,
        automated_name: false
      }));
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
      <DialogHeader className="pb-4">
        <DialogTitle className="text-2xl font-semibold text-gray-800">
          {initialValues.name ? t('editProduct') : t('addProduct')}
        </DialogTitle>
      </DialogHeader>

      <form className="space-y-6" onSubmit={onFormSubmit}>
        {/* Auto Name Generation */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={autoName}
            onCheckedChange={handleAutoNameToggle}
            id="auto-name"
          />
          <Label htmlFor="auto-name" className="cursor-pointer font-medium">
            {t('generateNameAuto')}
          </Label>
        </div>

        {/* Main Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('productName')}</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                disabled={autoName}
                required
                placeholder={autoName ? t('autoGenerated') : t('enterProductName')}
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('category')}</Label>
              <Select
                value={form.category ?? ""}
                onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
              >
                <SelectTrigger className="mt-1">
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
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('company')}</Label>
              <Select
                value={form.company ?? ""}
                onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
              >
                <SelectTrigger className="mt-1">
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
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('gamma')}</Label>
              <Input
                value={form.gamma ?? ""}
                onChange={e => setForm(f => ({ ...f, gamma: e.target.value || undefined }))}
                placeholder={t('enterGamma')}
                className="mt-1"
              />
            </div>

            {/* Lens Specifications - Only for lenses */}
            {showIndexTreatment && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t('index')}</Label>
                  <Select
                    value={form.index ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label className="text-sm font-medium text-gray-700">{t('treatment')}</Label>
                  <Select
                    value={form.treatment ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="mt-1">
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
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Price */}
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('price')} (DH)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                min={0}
                required
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            {/* Cost TTC */}
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('costTTC')} (DH)</Label>
              <Input
                type="number"
                value={form.cost_ttc ?? 0}
                onChange={e => setForm(f => ({ ...f, cost_ttc: Number(e.target.value) }))}
                min={0}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            {/* Stock Status */}
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('stockStatus')}</Label>
              <Select
                value={form.stock_status}
                onValueChange={v => setForm(f => ({ ...f, stock_status: v as 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock', stock: v !== 'inStock' ? undefined : f.stock }))}
              >
                <SelectTrigger className="mt-1">
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

            {/* Stock Quantity - Only for inStock */}
            {form.stock_status === 'inStock' && (
              <div>
                <Label className="text-sm font-medium text-gray-700">{t('stock')} {t('quantity')}</Label>
                <Input
                  type="number"
                  value={form.stock ?? 0}
                  onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            )}

            {/* Image Upload */}
            <div>
              <Label className="text-sm font-medium text-gray-700">{t('image')}</Label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
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
                  className="mt-2 w-20 h-20 object-cover rounded border" 
                />
              )}
            </div>

            {/* Profit Margin Display */}
            {form.price > 0 && (form.cost_ttc ?? 0) > 0 && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-green-700">{t('profitMargin')}:</span>
                  <span className="font-bold text-green-800">
                    {(((form.price - (form.cost_ttc ?? 0)) / form.price) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="font-medium text-green-700">{t('profit')}:</span>
                  <span className="font-bold text-green-800">
                    {(form.price - (form.cost_ttc ?? 0)).toFixed(2)} DH
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={disabled || uploading}
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={disabled || uploading}
            className="bg-teal-600 hover:bg-teal-700"
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
        </div>
      </form>
    </DialogContent>
  );
};

export default ProductForm;