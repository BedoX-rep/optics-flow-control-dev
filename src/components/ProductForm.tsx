import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadIcon, Sparkles, Package, DollarSign, Building, Layers, Eye, Palette, Truck, Archive, Tag, Hash, Wrench, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";
import { useCompanies } from "@/hooks/useCompanies";

const CATEGORY_OPTIONS = [
  { value: "Single Vision Lenses", abbr: "SV", labelKey: "singleVisionLenses", icon: Eye },
  { value: "Progressive Lenses", abbr: "PG", labelKey: "progressiveLenses", icon: Layers },
  { value: "Frames", abbr: "FR", labelKey: "frames", icon: Package },
  { value: "Sunglasses", abbr: "SG", labelKey: "sunglasses", icon: Eye },
  { value: "Contact Lenses", abbr: "CL", labelKey: "contactLenses", icon: Eye },
  { value: "Accessories", abbr: "AC", labelKey: "accessories", icon: Package },
  { value: "Service", abbr: "SV", labelKey: "service", icon: Wrench },
  { value: "Other", abbr: "OT", labelKey: "other", icon: Package }
];

const INDEX_OPTIONS = [
  "1.50",
  "1.56",
  "1.59",
  "1.6",
  "1.67",
  "1.74"
];

const TREATMENT_OPTIONS = [
  { value: "White", labelKey: "white" },
  { value: "AR", labelKey: "ar" },
  { value: "Blue", labelKey: "blue" },
  { value: "Photochromic", labelKey: "photochromic" },
  { value: "Polarized", labelKey: "polarized" },
  { value: "UV protection", labelKey: "uvProtection" },
  { value: "Tint", labelKey: "tint" }
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
  const { allCompanies } = useCompanies();
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
      let parts = [abbr];

      if (["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(form.category ?? "")) {
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
      setForm(f => ({ ...f, automated_name: false }));
    }
  }, [form.category, form.index, form.treatment, form.company, form.gamma, form.stock_status, autoName]);

  useEffect(() => {
    setAutoName(form.automated_name ?? true);
  }, [form.automated_name]);

  const showIndexTreatment = ["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(form.category ?? "");

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
    if (!form.name.trim()) return;

    let imageUrl = form.image;
    if (imageFile) imageUrl = await handleImageUpload();

    onSubmit({
      ...form,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      cost_ttc: Number(form.cost_ttc) || 0,
      stock: form.stock_status === 'inStock' ? (Number(form.stock) || 0) : undefined,
      automated_name: autoName,
      image: imageUrl || undefined
    });
  };

  return (
    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-[#E2E2DE] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 max-h-[96vh] flex flex-col custom-scrollbar overflow-y-auto">
      {/* Background Watermark Icons */}
      <div className="absolute top-40 right-10 opacity-[0.03] pointer-events-none rotate-12">
        <Package size={240} strokeWidth={1} />
      </div>
      <div className="absolute bottom-40 left-10 opacity-[0.02] pointer-events-none -rotate-12">
        <Layers size={200} strokeWidth={1} />
      </div>

      <form onSubmit={onFormSubmit} className="flex flex-col flex-1 relative z-10">
        {/* Top Header Section */}
        <div className="p-10 pb-12 bg-gradient-to-b from-[#063D31] to-[#042F26] text-white relative rounded-b-[3rem] shadow-xl">
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-8 top-8 text-teal-200/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6 md:flex-row md:justify-between">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                  <Package className="h-6 w-6 text-teal-100" />
                </div>
                <DialogTitle className="text-3xl font-black tracking-[0.15em] uppercase leading-none">
                  {initialValues.name ? t('editProduct') : t('addProduct')}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {initialValues.name ? 'Update existing product information' : 'Create a new product record'}
                </DialogDescription>
              </div>
              <p className="text-teal-50/60 text-sm font-medium tracking-[0.1em] uppercase">
                {t('productConfigurationSuite') || 'Product Configuration Suite'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                <Switch
                  checked={autoName}
                  onCheckedChange={setAutoName}
                  className="data-[state=checked]:bg-[#063D31]"
                />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">{t('autoNaming') || 'Auto-Naming'}</span>
              </div>

              <Button
                type="submit"
                disabled={disabled || uploading || !form.name?.trim()}
                className={cn(
                  "px-10 h-14 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all duration-500 active:scale-95 flex items-center gap-3 border-none",
                  (disabled || uploading || !form.name?.trim())
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white text-[#063D31] hover:bg-teal-50 hover:shadow-white/20 hover:translate-y-[-2px]"
                )}
              >
                {uploading ? (
                  <div className="h-5 w-5 border-3 border-[#063D31] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {t('save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Core Attributes */}
          <div className="space-y-8">
            <FormSection title="Classification" icon={Tag}>
              <div className="grid grid-cols-1 gap-6">
                <FormGroup label={t('category')}>
                  <Select
                    value={form.category ?? ""}
                    onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
                  >
                    <SelectTrigger className="premium-input">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      <SelectItem value="none_selected">{t('none')}</SelectItem>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label={t('company')}>
                    <Select
                      value={form.company ?? ""}
                      onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
                    >
                      <SelectTrigger className="premium-input">
                        <SelectValue placeholder={t('selectCompany')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="none_selected">{t('none')}</SelectItem>
                        {allCompanies.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormGroup>

                  <FormGroup label={t('gamma')}>
                    <Input
                      value={form.gamma ?? ""}
                      onChange={e => setForm(f => ({ ...f, gamma: e.target.value || undefined }))}
                      className="premium-input"
                      placeholder={t('enterGamma')}
                    />
                  </FormGroup>
                </div>
              </div>
            </FormSection>

            {showIndexTreatment && (
              <FormSection title="Technical Specs" icon={Wrench} variant="indigo">
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label={t('index')}>
                    <Select
                      value={form.index ?? ""}
                      onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
                    >
                      <SelectTrigger className="premium-input">
                        <SelectValue placeholder={t('index')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="none_selected">{t('none')}</SelectItem>
                        {INDEX_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormGroup>

                  <FormGroup label={t('treatment')}>
                    <Select
                      value={form.treatment ?? ""}
                      onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
                    >
                      <SelectTrigger className="premium-input">
                        <SelectValue placeholder={t('treatment')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="none_selected">{t('none')}</SelectItem>
                        {TREATMENT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormGroup>
                </div>
              </FormSection>
            )}
          </div>

          {/* Right Column - Commercial & Media */}
          <div className="space-y-8">
            <FormSection title="Financials" icon={DollarSign} variant="amber">
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label={`${t('price')} (DH)`}>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                      className="premium-input border-teal-100 focus:border-teal-500 font-black text-teal-700 bg-teal-50/30"
                    />
                  </div>
                </FormGroup>

                <FormGroup label={`${t('costTTC')} (DH)`}>
                  <Input
                    type="number"
                    value={form.cost_ttc ?? 0}
                    onChange={e => setForm(f => ({ ...f, cost_ttc: Number(e.target.value) }))}
                    className="premium-input border-rose-100 focus:border-rose-500 font-black text-rose-600 bg-rose-50/30"
                  />
                </FormGroup>

                {form.price > 0 && (form.cost_ttc ?? 0) > 0 && (
                  <div className="col-span-2 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Margin</p>
                      <p className="text-2xl font-black text-white tracking-tight">
                        {(((form.price - (form.cost_ttc ?? 0)) / form.price) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="Inventory & Media" icon={Archive}>
              <div className="space-y-6">
                <FormGroup label={t('productName')}>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    disabled={autoName}
                    className="premium-input font-bold"
                  />
                </FormGroup>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <FormGroup label={t('stockStatus')}>
                    <Select
                      value={form.stock_status}
                      onValueChange={v => setForm(f => ({ ...f, stock_status: v as any, stock: v !== 'inStock' ? undefined : f.stock }))}
                    >
                      <SelectTrigger className="premium-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Order">{t('order')}</SelectItem>
                        <SelectItem value="inStock">{t('inStock')}</SelectItem>
                        <SelectItem value="Fabrication">{t('fabrication')}</SelectItem>
                        <SelectItem value="Out Of Stock">{t('outOfStock')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormGroup>

                  <div className="relative group/media h-24 w-full rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center transition-all hover:shadow-md cursor-pointer overflow-hidden border-dashed">
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <UploadIcon className="h-5 w-5 text-slate-400 group-hover/media:text-teal-600 transition-colors" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Media</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => e.target.files?.[0] && setImageFile(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-input {
          @apply bg-black/[0.04] border-none rounded-[1.2rem] h-14 shadow-none transition-all focus:ring-2 focus:ring-[#063D31]/10 focus:bg-white text-lg font-bold text-slate-800 placeholder:text-[#AAA] !important;
        }
      `}} />
    </DialogContent>
  );
};

const FormSection = ({ title, icon: Icon, children, variant = 'teal' }: any) => {
  const themes: any = {
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="group space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110 shadow-sm", themes[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-black text-[#5C5C59] uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="bg-white/40 p-8 rounded-[2rem] border border-white/60 shadow-sm backdrop-blur-md hover:shadow-xl hover:shadow-black/5 transition-all duration-500">
        {children}
      </div>
    </div>
  );
};

const FormGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <Label className="text-[11px] font-black uppercase text-[#8E8E8A] tracking-[0.15em] pl-1 font-sans">{label}</Label>
    {children}
  </div>
);

export default ProductForm;