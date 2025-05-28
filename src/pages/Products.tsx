import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Plus, Edit, Trash2, Search, Package, ChevronDown, Save, SaveAll, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductFilters from "@/components/ProductFilters";
import ProductStatsSummary from "@/components/ProductStatsSummary";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import { ImportProductsDialog } from "@/components/ImportProductsDialog";
import { supabase } from "@/integrations/supabase/client";
import { sortProducts, ProductSortable } from "@/components/products/sortProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

interface Product extends ProductSortable {
  cost_ttc?: number;
  stock_status?: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock';
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
  stock_status: "all_stock_statuses",
  sort: "arrange",
};

const ITEMS_PER_PAGE = 20;

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
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    setPageReady(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("lensly_products_filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    setPage(0); // Reset to first page when search changes
  }, [debouncedSearchTerm]);

  const fetchProducts = async () => {
    if (!user) return { products: [], totalCount: 0 };

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    // Apply search filter if exists
    if (debouncedSearchTerm) {
      const searchWords = debouncedSearchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
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
    if (filters.stock_status && filters.stock_status !== "all_stock_statuses") {
      query = query.eq('stock_status', filters.stock_status);
    }

    // Add pagination
    query = query
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
      .order('created_at', { ascending: false });

    const { data: productsData, error, count } = await query;
    if (error) throw error;

        // After fetching, check if stock is 0 and update stock status if necessary
    if (productsData) {
      productsData.forEach(async (product) => {
        if (product.stock === 0 && product.stock_status === 'inStock') {
          await supabase
            .from('products')
            .update({ stock_status: 'Out Of Stock' })
            .eq('id', product.id)
            .eq('user_id', user.id);
        }
      });
    }

    return { 
      products: productsData || [], 
      totalCount: count || 0
    };
  };

  const fetchAllProducts = async () => {
    if (!user) return [];

    const { data: allProducts, error } = await supabase
      .from('products')
      .select('category')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (error) throw error;
    return allProducts || [];
  };

  const { data = { products: [], totalCount: 0 }, isLoading } = useQuery({
    queryKey: ['products', user?.id, filters, page, debouncedSearchTerm],
    queryFn: fetchProducts,
    enabled: !!user,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products', user?.id],
    queryFn: fetchAllProducts,
    enabled: !!user,
  });

  useEffect(() => {
    if (data.products) {
      setEditableProducts(data.products.map(p => ({ ...p, isEdited: false })));
    }
  }, [data.products]);

  const totalPages = Math.ceil(data.totalCount / ITEMS_PER_PAGE);

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
        await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
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

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
    setPage(0); // Reset to first page when filters change
  }, []);

  const handleFormSubmit = useCallback(async (form: ProductFormValues) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        const updates: any = { ...form };
        delete updates.id;
        delete updates.created_at;
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', editingProduct.id)
          .eq('user_id', user.id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        // Prepare the product data for insertion
        const productData = {
          name: form.name || '',
          price: Number(form.price) || 0,
          cost_ttc: Number(form.cost_ttc) || 0,
          stock: form.stock_status === 'inStock' ? (Number(form.stock) || 0) : null,
          stock_status: form.stock_status || 'Order',
          category: form.category || null,
          index: form.index || null,
          treatment: form.treatment || null,
          company: form.company || null,
          gamma: form.gamma || null,
          automated_name: Boolean(form.automated_name),
          image: form.image || null,
          user_id: user.id,
          is_deleted: false
        };

        console.log('Inserting product:', productData); // Debug log

        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

         // After saving, check if stock is 0 and update stock status if necessary
        if (data && data.length > 0) {
          const newProduct = data[0];
          if (newProduct.stock === 0 && newProduct.stock_status === 'inStock') {
            await supabase
              .from('products')
              .update({ stock_status: 'Out Of Stock' })
              .eq('id', newProduct.id)
              .eq('user_id', user.id);

            await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
          }
        }

        console.log('Product inserted successfully:', data); // Debug log
        await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
        toast({ title: "Success", description: "Product added successfully" });
      }
      setIsOpen(false);
      setEditingProduct(null);
      setFormInitial({ name: '', price: 0, cost_ttc: 0, stock_status: 'Order', stock: 0, automated_name: true });
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error?.message || "Failed to save product. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, editingProduct, queryClient, toast]);

  const handleFieldChange = useCallback((productId: string, field: keyof Product, value: any) => {
    setEditableProducts(prev => 
      prev.map(product => {
        if (product.id !== productId) return product;

        const originalProduct = data.products.find(p => p.id === productId);
        let updated = { ...product, [field]: value };

        // Allow manual stock status changes without automatic override

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
      })
    );
  }, [data.products]);

  const handleSaveProduct = useCallback(async (productId: string) => {
    if (!user) return;
    const editedProduct = editableProducts.find(p => p.id === productId);
    if (!editedProduct) return;

    try {
      setIsSubmitting(true);
      const updates: any = { ...editedProduct };
      delete updates.id;
      delete updates.isEdited;

      // Check if stock is 0 and stock_status is inStock, then change to Out Of Stock
      if (updates.stock_status === 'inStock' && updates.stock === 0) {
        updates.stock_status = 'Out Of Stock';
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
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
  }, [user, editableProducts, queryClient, toast]);

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

        // Check if stock is 0 and stock_status is inStock, then change to Out Of Stock
        if (updates.stock_status === 'inStock' && updates.stock === 0) {
          updates.stock_status = 'Out Of Stock';
        }

        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
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

  const handleImportProducts = useCallback(async (importedProducts: any[]) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const productsToInsert = importedProducts.map(product => ({
        ...product,
        user_id: user.id,
        is_deleted: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
      setIsImportDialogOpen(false);

      toast({
        title: "Success",
        description: `${importedProducts.length} product(s) imported successfully`,
      });
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: "Error",
        description: "Failed to import products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, queryClient, toast]);

  const filteredProducts = useMemo(() => sortProducts(editableProducts || []), [editableProducts]);
  const hasEditedProducts = useMemo(() => editableProducts.some(p => p.isEdited), [editableProducts]);

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
          <ProductStatsSummary products={allProducts || []} />
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
          <Button
            onClick={() => setIsImportDialogOpen(true)}
            variant="outline"
            className="rounded-xl font-medium border-primary/20 text-primary hover:bg-primary/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Page reset will happen automatically when debouncedSearchTerm changes
              }}
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onFieldChange={handleFieldChange}
                onSave={handleSaveProduct}
                onEdit={handleOpen}
                onDelete={handleDeleteProduct}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className="w-10 h-8"
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          )}

          {data.totalCount > 0 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Showing {page * ITEMS_PER_PAGE + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, data.totalCount)} of {data.totalCount} products
            </div>
          )}
        </>
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

      <ImportProductsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportProducts}
      />
    </div>
  );
};

export default Products;