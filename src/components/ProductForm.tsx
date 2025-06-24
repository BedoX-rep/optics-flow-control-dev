import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COMPANY_OPTIONS } from "@/components/products/CompanyCellEditor";
import { useCompanies } from "@/hooks/useCompanies";

const CATEGORY_OPTIONS = [
  'Single Vision',
  'Progressive', 
  'Frames',
  'Sunglasses',
  'Contact Lens',
  'Accessories'
];

const TREATMENT_OPTIONS = [
  'None',
  'Anti-Reflection',
  'Blue Light',
  'Photochromic',
  'Polarized',
  'Mirror'
];

interface Product {
  id?: string;
  name: string;
  category: string;
  company: string;
  treatment: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  description?: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess?: () => void;
}

function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const { companies, addCompany } = useCompanies();
  const [loading, setLoading] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showAddCompany, setShowAddCompany] = useState(false);

  const [formData, setFormData] = useState<Product>({
    name: '',
    category: '',
    company: '',
    treatment: 'None',
    cost_price: 0,
    selling_price: 0,
    quantity: 1,
    description: ''
  });

  // Combine default companies with user's custom companies
  const allCompanies = [
    ...COMPANY_OPTIONS,
    ...companies.filter(c => !COMPANY_OPTIONS.includes(c.name)).map(c => c.name)
  ];

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        category: '',
        company: '',
        treatment: 'None',
        cost_price: 0,
        selling_price: 0,
        quantity: 1,
        description: ''
      });
    }
  }, [product, open]);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    const result = await addCompany(newCompanyName.trim());
    if (result.success) {
      setFormData({ ...formData, company: newCompanyName.trim() });
      setNewCompanyName("");
      setShowAddCompany(false);
      toast.success("Company added successfully");
    } else {
      toast.error(result.error || "Failed to add company");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        company: formData.company,
        treatment: formData.treatment,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        quantity: formData.quantity,
        description: formData.description || null,
      };

      if (product?.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success("Product added successfully");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company *</Label>
              <div className="space-y-2">
                <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
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

            <div>
              <Label htmlFor="treatment">Treatment</Label>
              <Select value={formData.treatment} onValueChange={(value) => setFormData({ ...formData, treatment: value })}>
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional product description..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProductForm;