
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { COMPANY_OPTIONS } from "@/components/products/CompanyCellEditor";
import { useCompanies } from "@/hooks/useCompanies";

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses", 
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories"
];

const INDEX_OPTIONS = ["1.56", "1.6", "1.67", "1.74"];
const TREATMENT_OPTIONS = ["White", "AR", "Blue", "Photochromic"];
const GAMMA_OPTIONS = ["Standard", "Premium", "High-End", "Budget"];

export interface ProductFormValues {
  name: string;
  price: number;
  cost_ttc?: number;
  category?: string;
  index?: string;
  treatment?: string;
  company?: string;
  gamma?: string;
  automated_name?: boolean;
  image?: string;
  created_at?: string;
  stock_status?: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock';
  stock?: number;
}

interface ProductFormProps {
  initialValues: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function ProductForm({ initialValues, onSubmit, onCancel, disabled }: ProductFormProps) {
  const { companies, addCompany } = useCompanies();
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showAddCompany, setShowAddCompany] = useState(false);

  const [formData, setFormData] = useState<ProductFormValues>({
    name: '',
    price: 0,
    cost_ttc: 0,
    category: '',
    index: '',
    treatment: '',
    company: '',
    gamma: '',
    automated_name: true,
    image: '',
    stock_status: 'Order',
    stock: 0,
  });

  // Combine default companies with user's custom companies
  const allCompanies = [
    ...COMPANY_OPTIONS,
    ...companies.filter(c => !COMPANY_OPTIONS.includes(c.name)).map(c => c.name)
  ];

  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({
        ...prev,
        ...initialValues,
        name: initialValues.name || '',
        price: initialValues.price || 0,
        cost_ttc: initialValues.cost_ttc || 0,
        category: initialValues.category || '',
        index: initialValues.index || '',
        treatment: initialValues.treatment || '',
        company: initialValues.company || '',
        gamma: initialValues.gamma || '',
        automated_name: initialValues.automated_name !== undefined ? initialValues.automated_name : true,
        image: initialValues.image || '',
        stock_status: initialValues.stock_status || 'Order',
        stock: initialValues.stock || 0,
      }));
    }
  }, [initialValues]);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      return;
    }

    const result = await addCompany(newCompanyName.trim());
    if (result.success) {
      setFormData(prev => ({ ...prev, company: newCompanyName.trim() }));
      setNewCompanyName("");
      setShowAddCompany(false);
    }
  };

  const generateAutomaticName = (data: ProductFormValues) => {
    const getCategoryAbbr = (category: string | undefined) => {
      switch (category) {
        case 'Single Vision Lenses': return 'SV';
        case 'Progressive Lenses': return 'PG';
        case 'Frames': return 'FR';
        case 'Sunglasses': return 'SG';
        case 'Contact Lenses': return 'CL';
        case 'Accessories': return 'AC';
        default: return '';
      }
    };

    let abbr = getCategoryAbbr(data.category);
    let parts = [abbr];

    if (["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(data.category ?? "")) {
      if (data.index) parts.push(data.index);
      if (data.treatment) parts.push(data.treatment.toUpperCase());
    }
    if (data.company) parts.push(data.company.toUpperCase());
    if (data.gamma) parts.push(data.gamma.toUpperCase());
    if (data.stock_status === 'inStock' || data.stock_status === 'Fabrication') {
      parts.push(data.stock_status === 'inStock' ? 'INSTOCK' : 'FABRICATION');
    }

    return parts.filter(Boolean).join(" ");
  };

  const handleFieldChange = (field: keyof ProductFormValues, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Handle automated name generation
      if (field === 'automated_name' && value === true) {
        updated.name = generateAutomaticName(updated);
      } else if (updated.automated_name && (
        field === 'category' || field === 'index' || field === 'treatment' || 
        field === 'company' || field === 'gamma' || field === 'stock_status'
      )) {
        updated.name = generateAutomaticName(updated);
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            disabled={formData.automated_name}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="automated_name"
            checked={formData.automated_name}
            onCheckedChange={(checked) => handleFieldChange('automated_name', checked)}
          />
          <Label htmlFor="automated_name">Auto-generate name</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleFieldChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="index">Index</Label>
          <Select value={formData.index} onValueChange={(value) => handleFieldChange('index', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select index" />
            </SelectTrigger>
            <SelectContent>
              {INDEX_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="treatment">Treatment</Label>
          <Select value={formData.treatment} onValueChange={(value) => handleFieldChange('treatment', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select treatment" />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="gamma">Gamma</Label>
          <Select value={formData.gamma} onValueChange={(value) => handleFieldChange('gamma', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gamma" />
            </SelectTrigger>
            <SelectContent>
              {GAMMA_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="company">Company</Label>
        <div className="space-y-2">
          <Select value={formData.company} onValueChange={(value) => handleFieldChange('company', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {allCompanies.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAddCompany(!showAddCompany)}
            className="w-full"
          >
            {showAddCompany ? "Cancel" : "Add New Company"}
          </Button>
          {showAddCompany && (
            <div className="flex gap-2">
              <Input
                placeholder="Company name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <Button type="button" onClick={handleAddCompany} size="sm">
                Add
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Selling Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div>
          <Label htmlFor="cost_ttc">Cost Price</Label>
          <Input
            id="cost_ttc"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_ttc}
            onChange={(e) => handleFieldChange('cost_ttc', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => handleFieldChange('stock', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="stock_status">Stock Status</Label>
        <Select value={formData.stock_status} onValueChange={(value) => handleFieldChange('stock_status', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Select stock status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Order">Order</SelectItem>
            <SelectItem value="inStock">In Stock</SelectItem>
            <SelectItem value="Fabrication">Fabrication</SelectItem>
            <SelectItem value="Out Of Stock">Out Of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
