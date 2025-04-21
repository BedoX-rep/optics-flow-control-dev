import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash, Search } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductFilters from "@/components/ProductFilters";
import ProductStatsSummary from "@/components/ProductStatsSummary";

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  index?: string | null;
  treatment?: string | null;
  company?: string | null;
  image?: string | null;
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

  const [formInitial, setFormInitial] = useState<Partial<ProductFormValues>>({
    name: '', price: 0
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

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
      setProducts(data || []);
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
    fetchProducts();
  }, [user, filters]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    } : { name: '', price: 0 });
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
      setFormInitial({ name: '', price: 0 });
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
          .delete()
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

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-6 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-poppins font-semibold text-[#0B6E63] leading-snug">Products</h1>
            <span className="bg-[#f6ad55]/20 text-[#f6ad55] text-xs font-semibold px-2 py-0.5 rounded-full ml-2 tracking-wide">Manage Inventory</span>
          </div>
          <p className="mt-1 text-gray-500 max-w-lg">
            All your products and inventory in one place.
          </p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3">
          <ProductStatsSummary products={products} />
          <Button
            className="bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] text-white font-medium shadow-lg hover:scale-105 transition-transform duration-150 ml-2"
            onClick={() => handleOpen(null)}
          >
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-[#f6ad55]/90 p-1 flex items-center justify-center mr-1">
                <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </span>
              Add Product
            </span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div className="relative w-64">
          <svg className="absolute left-2 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ProductFilters filters={filters} onChange={handleFilterChange} />
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
      <div className="overflow-x-auto mt-4">
        <div className="min-w-full bg-white rounded-[10px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7FAFC]">
                <TableHead className="text-[#38B2AC] font-semibold">#</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold">Image</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold">Name</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold">Category</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold">Index</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold">Treatment</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold">Company</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold text-right">Price</TableHead>
                <TableHead className="text-[#38B2AC] font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 animate-pulse">
                    <div className="h-6 w-1/2 bg-[#F7FAFC] rounded mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-gray-400">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-[#E6F6F4]/60 transition-all"
                  >
                    <TableCell className="font-bold text-[#0B6E63]">{index + 1}</TableCell>
                    <TableCell>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm hover:scale-105 transition-all bg-white"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-300 bg-gray-50 font-poppins text-xs">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{product.name}</TableCell>
                    <TableCell>
                      <span className="bg-[#E6F6F4] text-[#0B6E63] px-2 py-0.5 rounded-full text-xs font-bold">
                        {product.category || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.index ? (
                        <span className="bg-[#F1F1F1] text-slate-600 px-2 py-0.5 rounded-full text-xs">{product.index}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {product.treatment ? (
                        <span className="bg-[#F6AD55]/20 text-[#F6AD55] px-2 py-0.5 rounded-full text-xs">{product.treatment}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {product.company ? (
                        <span className="bg-[#E4FFFC]/80 text-[#38B2AC] px-2 py-0.5 rounded-full text-xs">
                          {product.company}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#0B6E63]">{Number(product.price).toFixed(2)} DH</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-[#E4FFFC]"
                          onClick={() => handleOpen(product)}
                          aria-label="Edit"
                        >
                          <svg width="18" height="18" stroke="#0B6E63" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M16.475 3.977a2.5 2.5 0 1 1 3.535 3.535l-11.064 11.06a2 2 0 0 1-.707.443l-3.429 1.143a1 1 0 0 1-1.265-1.265l1.143-3.43a2 2 0 0 1 .443-.706l11.06-11.06Z"/>
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                          aria-label="Delete"
                        >
                          <svg width="18" height="18" stroke="#e53e3e" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Products;
