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
import { Plus, Edit, Trash2, Search, Package, ChevronDown } from 'lucide-react';
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
}

const DEFAULT_FILTERS = {
  category: "all_categories",
  index: "all_indexes",
  treatment: "all_treatments",
  company: "all_companies",
  sort: "arrange",
};

const ITEMS_PER_PAGE = 30;

const Products = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<null | Product>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [formInitial, setFormInitial] = useState<Partial<ProductFormValues>>({ name: '', price: 0, cost_ttc: 0 });
  const [pageReady, setPageReady] = useState(false);
  const mountedRef = useRef(true);
  const [page, setPage] = useState(0);

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
      .eq('is_deleted', false)
      .range(page * ITEMS_PER_PAGE, (page * ITEMS_PER_PAGE) + (page === 0 ? ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE + 39));

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
    queryKey: ['products', user?.id, filters, page],
    queryFn: fetchProducts,
    enabled: !!user,
    keepPreviousData: true,
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (data.products) {
      if (page === 0) {
        setAllProducts(data.products);
      } else {
        setAllProducts(prev => [...prev, ...data.products]);
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
      image: editing.image ?? undefined,
      created_at: editing.created_at ?? undefined,
      cost_ttc: editing.cost_ttc ?? 0,
      stock_status: editing.stock_status ?? 'Order',
      stock: editing.stock ?? 0,
    } : { name: '', price: 0, cost_ttc: 0, stock_status: 'Order', stock: 0 });
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
      setFormInitial({ name: '', price: 0, cost_ttc: 0, stock_status: 'Order', stock: 0 });
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

  const handleStockStatusChange = async (product: Product, newStatus: 'Order' | 'inStock' | 'Fabrication') => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .update({ stock_status: newStatus })
        .eq('id', product.id)
        .eq('user_id', user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Stock status updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockChange = async (product: Product, newStock: number) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id)
        .eq('user_id', user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Stock updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = sortProducts(
    (allProducts || []).filter(product =>
      product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="default"
              onClick={() => handleOpen(null)}
              className="bg-black hover:bg-neutral-800 text-white px-6"
            >
              <Plus size={18} className="mr-2" />
              New Product
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-9 pr-2 bg-white border border-neutral-200 rounded-lg h-9 text-sm focus:ring-2 focus:ring-black focus:border-black w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ProductFilters filters={filters} onChange={handleFilterChange} />
        </div>
      </div>

      <ProductStatsSummary products={products} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-neutral-200 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                  <div className="h-3 w-32 bg-neutral-200 rounded" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <span className="font-medium text-black">{product.price.toFixed(2)} DH</span>
                      {product.category && (
                        <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-xs">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-neutral-500">Index</p>
                    <p className="font-medium">{product.index || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-neutral-500">Treatment</p>
                    <p className="font-medium">{product.treatment || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-neutral-500">Company</p>
                    <p className="font-medium">{product.company || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-neutral-500">Cost TTC</p>
                    <p className="font-medium">{product.cost_ttc?.toFixed(2) || '0.00'} DH</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Stock Status:</span>
                    <Select
                      value={product.stock_status || 'Order'}
                      onValueChange={(value: 'Order' | 'inStock' | 'Fabrication') => 
                        handleStockStatusChange(product, value)
                      }
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Order">Order</SelectItem>
                        <SelectItem value="inStock">In Stock</SelectItem>
                        <SelectItem value="Fabrication">Fabrication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {product.stock_status === 'inStock' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">Stock:</span>
                      <Input
                        type="number"
                        value={product.stock || 0}
                        onChange={(e) => handleStockChange(product, Number(e.target.value))}
                        className="h-8 w-24"
                        min={0}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpen(product)}
                    className="text-neutral-700 hover:text-black"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} className="mr-1" />
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