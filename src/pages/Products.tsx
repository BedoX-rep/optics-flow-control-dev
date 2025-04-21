import React, { useState, useEffect, useRef } from 'react';
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
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductFilters from "@/components/ProductFilters";
import ProductStatsSummary from "@/components/ProductStatsSummary";
import ProductImage from "@/components/ProductImage";

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
  const [formInitial, setFormInitial] = useState<Partial<ProductFormValues>>({ name: '', price: 0 });
  const [editingCell, setEditingCell] = useState<{ id: string; field: "name" | "price" } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');
  const [pageReady, setPageReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setPageReady(true);
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

  const startInlineEdit = (product: Product, field: "name" | "price") => {
    setEditingCell({ id: product.id, field });
    setCellEditValue(field === "price" ? String(product.price) : product.name);
  };

  const endInlineEdit = async (product: Product) => {
    if (!editingCell) return;
    const val = editingCell.field === "price" ? Number(cellEditValue) : cellEditValue.trim();
    if (val === product[editingCell.field]) {
      setEditingCell(null);
      return;
    }
    try {
      setIsSubmitting(true);
      const updates = { ...product, [editingCell.field]: val };
      delete updates.id;
      const { error } = await supabase
        .from('products')
        .update({ [editingCell.field]: val })
        .eq('id', product.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Updated", description: `Product ${editingCell.field} updated.` });
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, [editingCell.field]: val } : p
      ));
    } catch {
      toast({ title: "Error", description: "Could not update." });
    } finally {
      setEditingCell(null);
      setIsSubmitting(false);
    }
  };

  const removeProductImage = async (product: Product) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .update({ image: null })
        .eq('id', product.id)
        .eq('user_id', user.id);
      if (error) throw error;
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, image: null } : p
      ));
      toast({ title: "Image Removed" });
    } catch {
      toast({ title: "Error", description: "Could not remove image." });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!editingCell) return;
      if (e.key === "Escape") setEditingCell(null);
      if (e.key === "Enter") {
        const prod = products.find(p => p.id === editingCell.id);
        if (prod) endInlineEdit(prod);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editingCell, cellEditValue, products]);

  return (
    <div className="pt-8 pb-4 px-0 md:px-3 max-w-6xl mx-auto">
      <div className="flex flex-col gap-0 mb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <h1 className="text-2xl font-poppins font-semibold text-black mb-0 leading-tight tracking-tight">Products</h1>
            <p className="mt-0.5 text-neutral-500 text-sm font-inter">Manage your inventory efficiently and elegantly.</p>
          </div>
          <div className="flex items-end gap-4">
            <ProductStatsSummary products={products} />
            <Button
              className="ml-2 px-5 py-2 rounded-full font-medium bg-black text-white hover:bg-neutral-900 transition duration-150 shadow-none border border-black/5"
              onClick={() => handleOpen(null)}
            >
              <span className="mr-1.5 -ml-0.5"><Plus size={18}/></span>
              Add Product
            </Button>
          </div>
        </div>
        <div className="flex w-full items-center flex-wrap gap-0">
          <div className="relative w-full md:w-64 mr-2 mb-2 md:mb-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-9 pr-2 bg-white border border-neutral-200 rounded-lg font-inter h-9 text-sm focus:ring-2 focus:ring-black focus:border-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 flex justify-end">
            <ProductFilters filters={filters} onChange={handleFilterChange} />
          </div>
        </div>
      </div>
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
        <div className="min-w-full bg-white rounded-2xl border border-neutral-200 shadow-[0_6px_24px_rgba(0,0,0,0.04)]">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-neutral-100">
                <TableHead className="text-black text-xs font-semibold w-8">#</TableHead>
                <TableHead className="text-black text-xs font-semibold w-14">Image</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[180px]">Name</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right w-24">Price</TableHead>
                <TableHead className="text-neutral-500 text-xs font-medium w-36">Category</TableHead>
                <TableHead className="text-neutral-400 text-xs font-medium w-16">Index</TableHead>
                <TableHead className="text-neutral-400 text-xs font-medium w-32">Treatment</TableHead>
                <TableHead className="text-neutral-400 text-xs font-medium w-32">Company</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right w-20">Actions</TableHead>
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
                  <TableCell colSpan={9} className="text-center py-10 text-neutral-400 font-medium">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-[#FAFAFA] transition-all group rounded-lg"
                  >
                    <TableCell className="font-medium text-neutral-800">{index + 1}</TableCell>
                    <TableCell>
                      <ProductImage
                        src={typeof product.image === "string" ? product.image : undefined}
                        alt={product.name}
                        removable={!!product.image}
                        onRemove={() => removeProductImage(product)}
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      {editingCell?.id === product.id && editingCell.field === "name" ? (
                        <input
                          type="text"
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          className="border border-neutral-200 bg-[#F7F7F7] rounded-lg px-2 py-1 text-sm w-full focus:ring-2 focus:ring-black"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold text-black cursor-pointer transition hover:underline"
                          onDoubleClick={() => startInlineEdit(product, "name")}
                          title="Double click to edit"
                        >
                          {product.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-middle text-right">
                      {editingCell?.id === product.id && editingCell.field === "price" ? (
                        <input
                          type="number"
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          className="border border-neutral-200 bg-[#F7F7F7] rounded-lg px-2 py-1 text-sm text-right w-full focus:ring-2 focus:ring-black"
                          min={0}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold text-black cursor-pointer transition hover:underline"
                          onDoubleClick={() => startInlineEdit(product, "price")}
                          title="Double click to edit"
                        >
                          {Number(product.price).toFixed(2)} DH
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-semibold text-black bg-white border-black/10">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-neutral-300 text-xs font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.index ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-gray-700">{product.index}</span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.treatment ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-700">{product.treatment}</span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.company ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-600">{product.company}</span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-black/10"
                          onClick={() => handleOpen(product)}
                          aria-label="Edit"
                        >
                          <Edit size={16} className="text-black" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-[#222]/10"
                          onClick={() => handleDeleteProduct(product.id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={16} className="text-red-600" />
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
