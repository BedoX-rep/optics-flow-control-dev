
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_OPTIONS = [
  { value: "Single Vision Lenses", abbr: "SV" },
  { value: "Progressive Lenses", abbr: "PG" },
  { value: "Frames", abbr: "FR" },
  { value: "Sunglasses", abbr: "SG" },
  { value: "Contact Lenses", abbr: "CL" },
  { value: "Accessories", abbr: "AC" }
];

const INDEX_OPTIONS = [
  "1.56",
  "1.6",
  "1.67",
  "1.74"
];

const TREATMENT_OPTIONS = [
  "White",
  "AR",
  "Blue",
  "Photochromic"
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
  cost_ttc?: number;
  stock?: number;
  stock_status: 'Order' | 'inStock' | 'Fabrication';
  category?: string;
  index?: string;
  treatment?: string;
  company?: string;
  gamma?: string;
  automated_name?: boolean;
  image?: string;
  created_at?: string;
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
    let imageUrl = form.image;
    if (imageFile) {
      imageUrl = await handleImageUpload();
    }
    onSubmit({ ...form, image: imageUrl, automated_name: autoName });
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
        <Label htmlFor="auto-name" className="cursor-pointer">Generate Name Automatically</Label>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="category">Category</Label>
        <Select
          value={form.category ?? ""}
          onValueChange={v => setForm(f => ({ ...f, category: v === "none_selected" ? undefined : v }))}
        >
          <SelectTrigger className="col-span-3" id="category">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="none_selected">None</SelectItem>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showIndexTreatment && (
        <>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="index">Index</Label>
            <Select
              value={form.index ?? ""}
              onValueChange={v => setForm(f => ({ ...f, index: v === "none_selected" ? undefined : v }))}
            >
              <SelectTrigger className="col-span-3" id="index">
                <SelectValue placeholder="Select Index" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                <SelectItem value="none_selected">None</SelectItem>
                {INDEX_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="treatment">Treatment</Label>
            <Select
              value={form.treatment ?? ""}
              onValueChange={v => setForm(f => ({ ...f, treatment: v === "none_selected" ? undefined : v }))}
            >
              <SelectTrigger className="col-span-3" id="treatment">
                <SelectValue placeholder="Select Treatment" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                <SelectItem value="none_selected">None</SelectItem>
                {TREATMENT_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="company">Company</Label>
        <Select
          value={form.company ?? ""}
          onValueChange={v => setForm(f => ({ ...f, company: v === "none_selected" ? undefined : v }))}
        >
          <SelectTrigger className="col-span-3" id="company">
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="none_selected">None</SelectItem>
            {COMPANY_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="gamma">Gamma</Label>
        <Select
          value={form.gamma ?? ""}
          onValueChange={v => setForm(f => ({ ...f, gamma: v === "none_selected" ? undefined : v }))}
        >
          <SelectTrigger className="col-span-3" id="gamma">
            <SelectValue placeholder="Select Gamma" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="none_selected">None</SelectItem>
            {GAMMA_OPTIONS.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-3">
        <Label htmlFor="price">Price</Label>
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
        <Label htmlFor="cost_ttc">Cost TTC</Label>
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
        <Label htmlFor="stock_status">Stock Status</Label>
        <Select
          value={form.stock_status}
          onValueChange={v => setForm(f => ({ ...f, stock_status: v as 'Order' | 'inStock' | 'Fabrication', stock: v !== 'inStock' ? undefined : f.stock }))}
        >
          <SelectTrigger className="col-span-3" id="stock_status">
            <SelectValue placeholder="Select Stock Status" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="Order">Order</SelectItem>
            <SelectItem value="inStock">In Stock</SelectItem>
            <SelectItem value="Fabrication">Fabrication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.stock_status === 'inStock' && (
        <div className="grid grid-cols-4 items-center gap-3">
          <Label htmlFor="stock">Stock</Label>
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
        <Label htmlFor="image">Image</Label>
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
        <Label htmlFor="name">Product Name</Label>
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
          Cancel
        </Button>
        <Button type="submit" className="bg-optics-600 hover:bg-optics-700" disabled={disabled || uploading}>
          {uploading ? "Uploading..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ProductForm;
