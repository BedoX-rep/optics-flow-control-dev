
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Plus, Search, Grid2X2, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductFilters from "@/components/ProductFilters";
import ProductStatsSummary from "@/components/ProductStatsSummary";
import { supabase } from "@/integrations/supabase/client";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { sortProducts, ProductSortable } from "@/components/products/sortProducts";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailsDialog from '@/components/products/ProductDetailsDialog';

interface Product extends ProductSortable {
  // All properties are already defined in ProductSortable
}

const DEFAULT_FILTERS = {
  category: "all_categories",
  index: "all_indexes",
  treatment: "all_treatments",
  company: "all_companies",
  sort: "arrange",
};

const Products = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<null | Product>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<ProductFormValues>>({ name: '', price: 0, cost_ttc: 0 });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDetails, setShowDetails] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("lensly_products_filters", JSON.stringify(filters));
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

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

      if (filters.sort === "latest") {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query
          .order('category', { ascending: true })
          .order('index', { ascending: true })
          .order('treatment', { ascending: true })
          .order('company', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      if (mountedRef.current) setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [filters, user]);

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
    } : { name: '', price: 0, cost_ttc: 0 });
    setIsOpen(true);
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
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...form, user_id: user.id });
        if (error) throw error;
        toast({ title: "Success", description: "Product added successfully" });
      }
      setIsOpen(false);
      setEditingProduct(null);
      setFormInitial({ name: '', price: 0, cost_ttc: 0 });
      fetchProducts();
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
        setProducts(products.filter(product => product.id !== id));
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

  const handleStockUpdate = async (product: Product, field: string, newValue: string | null) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .update({ [field]: newValue })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, [field]: newValue } : p)
      );
      toast({ title: "Updated", description: "Stock updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = sortProducts(
    products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    filters.sort
  );

  const handleShowDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  return (
    <div
      className="flex flex-col h-[calc(100svh-68px)]"
      style={{
        width: "100%",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "1.5rem",
        transition: "all 0.2s ease",
        minHeight: "calc(100svh - 68px)",
      }}
    >
      <div className="flex flex-row items-end justify-between gap-2 flex-wrap mb-6 w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
          <ProductStatsSummary products={products} />
        </div>
        <div className="flex-grow flex items-end justify-end">
          <ProductFilters filters={filters} onChange={handleFilterChange} />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-9 pr-2 bg-white border border-neutral-200 rounded-lg font-inter h-10 text-sm focus:ring-2 focus:ring-black focus:border-black w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            tabIndex={0}
          />
        </div>

        <div className="flex items-center gap-2 border rounded-lg bg-white p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-teal-500 hover:bg-teal-600' : ''}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-teal-500 hover:bg-teal-600' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 overflow-auto bg-gray-50 rounded-xl">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-32 bg-gray-200 rounded-md mx-auto"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-md mx-auto"></div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 p-10">
            <div className="text-lg font-medium mb-2">No products found</div>
            <p className="text-sm max-w-md text-center mb-4">
              {searchTerm ? 
                "Try adjusting your search or filters to find what you're looking for." : 
                "Get started by adding your first product."}
            </p>
            <Button onClick={() => handleOpen(null)} className="bg-teal-500 hover:bg-teal-600">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleOpen}
                onDelete={handleDeleteProduct}
                onStockUpdate={handleStockUpdate}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 font-medium text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                <div>Image</div>
                <div>Name</div>
                <div className="text-right">Price</div>
                <div className="text-center">Stock</div>
                <div className="text-right">Actions</div>
              </div>
              
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleShowDetails(product)}
                >
                  <div className="w-12 h-12 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                    <ProductImage
                      src={typeof product.image === "string" ? product.image : undefined}
                      alt={product.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {product.category}
                        </span>
                      )}
                      {product.index && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {product.index}
                        </span>
                      )}
                      {product.treatment && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {product.treatment}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{Number(product.price).toFixed(2)} DH</div>
                    {product.cost_ttc !== undefined && (
                      <div className="text-xs text-gray-500">Cost: {Number(product.cost_ttc).toFixed(2)} DH</div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStock = Math.max(0, (product.stock || 0) - 1);
                        handleStockUpdate(product, "stock", String(newStock));
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className={`text-sm font-medium ${(product.stock || 0) === 0 ? 'text-red-600' : 'text-gray-700'} mx-2 w-12 text-center`}>
                      {(product.stock || 0) === 0 ? "Out" : product.stock}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStock = (product.stock || 0) + 1;
                        handleStockUpdate(product, "stock", String(newStock));
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-end space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen(product);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-red-500 border-red-200 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FloatingActionButton 
        onClick={() => handleOpen(null)}
        className="bg-teal-500 hover:bg-teal-600 shadow-teal-200/50"
      />

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

      <ProductDetailsDialog
        product={selectedProduct}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onEdit={handleOpen}
      />
    </div>
  );
};

export default Products;
