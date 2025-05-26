
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Package, ChevronDown, Save, SaveAll } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductFilters from "@/components/ProductFilters";
import ProductStatsSummary from "@/components/ProductStatsSummary";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/integrations/supabase/client";
import { sortProducts, ProductSortable } from "@/components/products/sortProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product extends ProductSortable {
  cost_ttc?: number;
  stock_status?: 'Order' | 'inStock' | 'Fabrication';
  stock?: number;
  automated_name?: boolean;
  gamma?: string;
}

interface EditableProduct extends Product {
  isEdited?: boolean;
}

const DEFAULT_FILTERS = {
  category: "all_categories",
  index: "all_indexes",
  treatment: "all_treatments",
  company: "all_companies",
  sort: "arrange",
};

const ITEMS_PER_PAGE = 30;

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
const COMPANY_OPTIONS = ["Indo", "ABlens", "Essilor", "GLASSANDLENS", "Optifak"];
const GAMMA_OPTIONS = ["Standard", "Premium", "High-End", "Budget"];

const Products = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<null | Product>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [formInitial, setFormInitial] = useState<Partial<ProductFormValues>>({ name: '', price: 0, cost_ttc: 0, automated_name: true });
  const [pageReady, setPageReady] = useState(false);
  const mountedRef = useRef(true);
  const [page, setPage] = useState(0);
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  useEffect(() => {
    setPageReady(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("lensly_products_filters", JSON.stringify(filters));
  }, [filters]);

  const fetchProducts = async () => {
    if (!user) return { products: [], hasMore: false };

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    // Apply search filter if exists
    if (searchTerm) {
      const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
      searchWords.forEach(word => {
        query = query.ilike('name', `%${word}%`);
      });
    }

    if (filters.category && filters.category !== "all_categories") {
      query = query.eq('category', filters.category);
    }
    if (filters.index && filters.index !== "all_indexes") {
      query = query.eq('index', filters.index);
    }
    if (filters.treatment && filters.treatment !== "all_treatments") {
      query = query.eq('treatment', filters.treatment);
    }
    if (filters.company && filters.company !== "all_companies") {
      query = query.eq('company', filters.company);
    }

    const { data: productsData, error, count } = await query;
    if (error) throw error;
    return { 
      products: productsData || [], 
      hasMore: count ? count > ((page + 1) * ITEMS_PER_PAGE) : false 
    };
  };

  const { data = { products: [], hasMore: false }, isLoading } = useQuery({
    queryKey: ['products', user?.id, filters, page, searchTerm],
    queryFn: fetchProducts,
    enabled: !!user,
    keepPreviousData: true,
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (data.products) {
      if (page === 0) {
        setAllProducts(data.products);
        setEditableProducts(data.products.map(p => ({ ...p, isEdited: false })));
      } else {
        setAllProducts(prev => [...prev, ...data.products]);
        setEditableProducts(prev => [...prev, ...data.products.map(p => ({ ...p, isEdited: false }))]);
      }
    }
  }, [data.products, page]);

  const { hasMore } = data;

  const handleOpen = (editing: Product | null = null) => {
    setEditingProduct(editing);
    setFormInitial(editing ? {
      name: editing.name,
      price: editing.price,
      category: editing.category ?? undefined,
      index: editing.index ?? undefined,
      treatment: editing.treatment ?? undefined,
      company: editing.company ?? undefined,
      gamma: editing.gamma ?? undefined,
      automated_name: editing.automated_name ?? true,
      image: editing.image ?? undefined,
      created_at: editing.created_at ?? undefined,
      cost_ttc: editing.cost_ttc ?? 0,
      stock_status: editing.stock_status ?? 'Order',
      stock: editing.stock ?? 0,
    } : { name: '', price: 0, cost_ttc: 0, stock_status: 'Order', stock: 0, automated_name: true });
    setIsOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_deleted: true })
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Failed to delete product. It might be used in receipts.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  const handleFormSubmit = async (form: ProductFormValues) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        const updates: any = { ...form };
        delete updates.id;
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', editingProduct.id)
          .eq('user_id', user.id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...form, user_id: user.id });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({ title: "Success", description: "Product added successfully" });
      }
      setIsOpen(false);
      setEditingProduct(null);
      setFormInitial({ name: '', price: 0, cost_ttc: 0, stock_status: 'Order', stock: 0, automated_name: true });
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (productId: string, field: keyof Product, value: any) => {
    setEditableProducts(prev => 
      prev.map(product => {
        if (product.id === productId) {
          const originalProduct = allProducts.find(p => p.id === productId);
          let updated = { ...product, [field]: value };
          
          // Handle automated name generation
          if (field === 'automated_name' && value === true) {
            // Generate name automatically when toggle is turned on
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
            
            let abbr = getCategoryAbbr(updated.category);
            let parts = [abbr];

            if (["Single Vision Lenses", "Progressive Lenses"].includes(updated.category ?? "")) {
              if (updated.index) parts.push(updated.index);
              if (updated.treatment) parts.push(updated.treatment?.toUpperCase());
            }
            if (updated.company) parts.push(updated.company?.toUpperCase());
            if (updated.gamma) parts.push(updated.gamma?.toUpperCase());
            if (updated.stock_status === 'inStock' || updated.stock_status === 'Fabrication') {
              parts.push(updated.stock_status === 'inStock' ? 'INSTOCK' : 'FABRICATION');
            }

            const generatedName = parts.filter(Boolean).join(" ");
            updated = { ...updated, name: generatedName };
          } else if (updated.automated_name && (
            field === 'category' || field === 'index' || field === 'treatment' || 
            field === 'company' || field === 'gamma' || field === 'stock_status'
          )) {
            // Regenerate name when automated_name is true and relevant fields change
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
            
            let abbr = getCategoryAbbr(updated.category);
            let parts = [abbr];

            if (["Single Vision Lenses", "Progressive Lenses"].includes(updated.category ?? "")) {
              if (updated.index) parts.push(updated.index);
              if (updated.treatment) parts.push(updated.treatment?.toUpperCase());
            }
            if (updated.company) parts.push(updated.company?.toUpperCase());
            if (updated.gamma) parts.push(updated.gamma?.toUpperCase());
            if (updated.stock_status === 'inStock' || updated.stock_status === 'Fabrication') {
              parts.push(updated.stock_status === 'inStock' ? 'INSTOCK' : 'FABRICATION');
            }

            const generatedName = parts.filter(Boolean).join(" ");
            updated = { ...updated, name: generatedName };
          }
          
          const isEdited = JSON.stringify(updated) !== JSON.stringify({ ...originalProduct, isEdited: false });
          return { ...updated, isEdited };
        }
        return product;
      })
    );
  };

  const handleSaveProduct = async (productId: string) => {
    if (!user) return;
    const editedProduct = editableProducts.find(p => p.id === productId);
    if (!editedProduct) return;

    try {
      setIsSubmitting(true);
      const updates: any = { ...editedProduct };
      delete updates.id;
      delete updates.isEdited;
      
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Product updated successfully" });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;
    const editedProducts = editableProducts.filter(p => p.isEdited);
    if (editedProducts.length === 0) {
      toast({ title: "Info", description: "No changes to save" });
      return;
    }

    try {
      setIsSavingAll(true);
      
      for (const product of editedProducts) {
        const updates: any = { ...product };
        delete updates.id;
        delete updates.isEdited;
        
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ 
        title: "Success", 
        description: `${editedProducts.length} product(s) updated successfully` 
      });
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: "Error",
        description: "Failed to update some products",
        variant: "destructive"
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const filteredProducts = sortProducts(editableProducts || []);
  const hasEditedProducts = editableProducts.some(p => p.isEdited);

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => handleOpen(null)}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
          <ProductStatsSummary products={data.products || []} />
          {hasEditedProducts && (
            <Button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all duration-200"
            >
              <SaveAll className="h-4 w-4 mr-2" />
              Save All
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search products..." 
              className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <ProductFilters filters={filters} onChange={handleFilterChange} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-neutral-200 rounded-xl" />
                <div className="space-y-3 flex-1">
                  <div className="h-5 w-32 bg-neutral-200 rounded" />
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <Package size={24} className="text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
          <p className="text-gray-500 max-w-md mb-4">
            {searchTerm
              ? `No products match your search "${searchTerm}"`
              : "You haven't added any products yet. Get started by adding your first product."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 ${
                product.isEdited 
                  ? 'border-l-amber-400 shadow-md bg-amber-50/30' 
                  : 'border-l-blue-400 hover:border-l-blue-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <ProductImage
                    src={product.image}
                    alt={product.category}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleFieldChange(product.id, 'name', e.target.value)}
                        disabled={product.automated_name}
                        className="font-semibold text-lg w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Price:</span>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => handleFieldChange(product.id, 'price', Number(e.target.value))}
                          className="font-medium text-blue-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-20"
                          min={0}
                          step={0.01}
                        />
                        <span className="text-sm text-gray-500">DH</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Category</label>
                      <Select
                        value={product.category || ""}
                        onValueChange={(value) => handleFieldChange(product.id, 'category', value === "none" ? null : value)}
                      >
                        <SelectTrigger className="h-8 mt-1 border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {CATEGORY_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Index</label>
                      <Select
                        value={product.index || ""}
                        onValueChange={(value) => handleFieldChange(product.id, 'index', value === "none" ? null : value)}
                      >
                        <SelectTrigger className="h-8 mt-1 border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {INDEX_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Company</label>
                      <Select
                        value={product.company || ""}
                        onValueChange={(value) => handleFieldChange(product.id, 'company', value === "none" ? null : value)}
                      >
                        <SelectTrigger className="h-8 mt-1 border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {COMPANY_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Treatment</label>
                      <Select
                        value={product.treatment || ""}
                        onValueChange={(value) => handleFieldChange(product.id, 'treatment', value === "none" ? null : value)}
                      >
                        <SelectTrigger className="h-8 mt-1 border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {TREATMENT_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Gamma</label>
                      <Select
                        value={product.gamma || ""}
                        onValueChange={(value) => handleFieldChange(product.id, 'gamma', value === "none" ? null : value)}
                      >
                        <SelectTrigger className="h-8 mt-1 border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {GAMMA_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Cost TTC</label>
                      <input
                        type="number"
                        value={product.cost_ttc || 0}
                        onChange={(e) => handleFieldChange(product.id, 'cost_ttc', Number(e.target.value))}
                        className="w-full h-8 mt-1 px-3 text-sm border border-gray-200 rounded hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Stock Status</label>
                    <Select
                      value={product.stock_status || 'Order'}
                      onValueChange={(value: 'Order' | 'inStock' | 'Fabrication') => 
                        handleFieldChange(product.id, 'stock_status', value)
                      }
                    >
                      <SelectTrigger className="h-8 mt-1 border-gray-200 hover:border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Order">Order</SelectItem>
                        <SelectItem value="inStock">In Stock</SelectItem>
                        <SelectItem value="Fabrication">Fabrication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col justify-between">
                    {product.stock_status === 'inStock' ? (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Stock</label>
                        <input
                          type="number"
                          value={product.stock || 0}
                          onChange={(e) => handleFieldChange(product.id, 'stock', Number(e.target.value))}
                          className="w-full h-8 mt-1 px-3 text-sm border border-gray-200 rounded hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                          min={0}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end h-full">
                        <div className="flex items-center justify-between pt-4">
                          <label htmlFor={`auto-name-${product.id}`} className="text-xs text-gray-600 font-medium">
                            Auto Name
                          </label>
                          <Switch
                            id={`auto-name-${product.id}`}
                            checked={product.automated_name}
                            onCheckedChange={(checked) => handleFieldChange(product.id, 'automated_name', checked)}
                            className="scale-75"
                          />
                        </div>
                      </div>
                    )}
                    
                    {product.stock_status === 'inStock' && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                        <label htmlFor={`auto-name-${product.id}`} className="text-xs text-gray-600 font-medium">
                          Auto Name
                        </label>
                        <Switch
                          id={`auto-name-${product.id}`}
                          checked={product.automated_name}
                          onCheckedChange={(checked) => handleFieldChange(product.id, 'automated_name', checked)}
                          className="scale-75"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {product.isEdited && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveProduct(product.id)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save size={14} className="mr-1" />
                        Save
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(product)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {hasMore && (
            <div className="col-span-full flex justify-center p-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => !isLoading && setPage(prev => prev + 1)}
                className="w-full max-w-xs gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load More Products
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={v => {if (!v) setIsOpen(false)}}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            initialValues={formInitial}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsOpen(false)}
            disabled={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
