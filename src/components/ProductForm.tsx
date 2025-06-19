import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORY_OPTIONS = [
  { value: "Single Vision Lenses", abbr: "SV", labelKey: "singleVisionLenses" },
  { value: "Progressive Lenses", abbr: "PG", labelKey: "progressiveLenses" },
  { value: "Frames", abbr: "FR", labelKey: "frames" },
  { value: "Sunglasses", abbr: "SG", labelKey: "sunglasses" },
  { value: "Contact Lenses", abbr: "CL", labelKey: "contactLenses" },
  { value: "Accessories", abbr: "AC", labelKey: "accessories" }
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

  return (
    <form className="space-y-4" onSubmit={onFormSubmit}>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={autoName}
          onCheckedChange={handleAutoNameToggle}
          id="auto-name"
        />
        <Label htmlFor="auto-name" className="cursor-pointer">{t('generateNameAuto')}</Label>
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="category">{t('category')}</Label>
        <Select
          value={form.category ?? ""}
          onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
        >
          <SelectTrigger className="col-span-3" id="category">
            <SelectValue placeholder={t('selectCategory')} />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="none_selected">{t('none')}</SelectItem>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showIndexTreatment && (
        <>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="index">{t('index')}</Label>
            <Select
              value={form.index ?? ""}
              onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
            >
              <SelectTrigger className="col-span-3" id="index">
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
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="treatment">{t('treatment')}</Label>
            <Select
              value={form.treatment ?? ""}
              onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
            >
              <SelectTrigger className="col-span-3" id="treatment">
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
        </>
      )}

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="company">{t('company')}</Label>
        <Select
          value={form.company ?? ""}
          onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
        >
          <SelectTrigger className="col-span-3" id="company">
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

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="gamma">{t('gamma')}</Label>
        <Input
          id="gamma"
          className="col-span-3"
          value={form.gamma ?? ""}
          onChange={e => setForm(f => ({ ...f, gamma: e.target.value || undefined }))}
          placeholder={t('enterGamma')}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="price">{t('price')}</Label>
        <Input
          id="price"
          type="number"
          className="col-span-3"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
          min={0}
          required
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="cost_ttc">{t('costTTC')}</Label>
        <Input
          id="cost_ttc"
          type="number"
          className="col-span-3"
          value={form.cost_ttc ?? 0}
          onChange={e => setForm(f => ({ ...f, cost_ttc: Number(e.target.value) }))}
          min={0}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="stock_status">{t('stockStatus')}</Label>
        <Select
          value={form.stock_status}
          onValueChange={v => setForm(f => ({ ...f, stock_status: v as 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock', stock: v !== 'inStock' ? undefined : f.stock }))}
        >
          <SelectTrigger className="col-span-3" id="stock_status">
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
        <div className="grid grid-cols-4 items-center gap-3">
          <Label htmlFor="stock">{t('stock')}</Label>
          <Input
            id="stock"
            type="number"
            className="col-span-3"
            value={form.stock ?? 0}
            onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
            min={0}
          />
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="image">{t('image')}</Label>
        <input
          id="image"
          type="file"
          accept="image/*"
          className="col-span-3"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              setImageFile(e.target.files[0]);
            }
          }}
        />
        {form.image && typeof form.image === "string" && (
          <img src={form.image} alt="product preview" className="w-12 h-12 object-cover border ml-2" />
        )}
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="name">{t('productName')}</Label>
        <Input
          id="name"
          className="col-span-3"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          disabled={autoName}
          required
        />
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={disabled || uploading}
        >
          {t('cancel')}
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={disabled || uploading}>
          {uploading ? t('uploading') : t('saveButton')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ProductForm;