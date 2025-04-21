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

  useEffect(() => {
    const storageKey = "lensly_products_filters";
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      setFilters(JSON.parse(saved));
    }
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
    <div>
      <div className="flex flex-col gap-0">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-poppins font-semibold text-black leading-snug flex items-baseline gap-3 mb-0">
              Products
              <span className="bg-[#F6AD55]/20 text-[#F6AD55] text-xs font-semibold px-2 py-0.5 rounded-full tracking-wide">Manage Inventory</span>
            </h1>
            <p className="mt-1 text-gray-500 text-sm font-inter">All your products and inventory in one place.</p>
          </div>
          <div className="flex items-center gap-5">
            <ProductStatsSummary products={products} />
            <Button
              className="bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-150 ml-2 px-4 py-2 rounded-full gap-2 flex items-center"
              onClick={() => handleOpen(null)}
            >
              <Plus size={18} className="inline-block mr-1 -ml-1" />
              Add Product
            </Button>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 flex-wrap">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-8 pr-2 bg-white border rounded-full font-inter h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-grow flex justify-end">
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
        <div className="min-w-full bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAFAFA] border-b">
                <TableHead className="text-[#0B6E63] text-xs font-bold w-8">#</TableHead>
                <TableHead className="text-[#0B6E63] text-xs font-bold w-14">Image</TableHead>
                <TableHead className="text-[#0B6E63] text-xs font-bold min-w-[180px]">Name</TableHead>
                <TableHead className="text-[#0B6E63] text-xs font-bold text-right w-28">Price</TableHead>
                <TableHead className="text-[#999] text-xs font-bold w-36">Category</TableHead>
                <TableHead className="text-[#999] text-xs font-bold w-16">Index</TableHead>
                <TableHead className="text-[#999] text-xs font-bold w-32">Treatment</TableHead>
                <TableHead className="text-[#999] text-xs font-bold w-32">Company</TableHead>
                <TableHead className="text-[#0B6E63] text-xs font-bold text-right w-24">Actions</TableHead>
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
                    className="hover:bg-[#F8F9FB] transition-all group"
                  >
                    <TableCell className="font-semibold text-slate-700">{index + 1}</TableCell>
                    <TableCell>
                      <ProductImage
                        src={typeof product.image === "string" ? product.image : undefined}
                        alt={product.name}
                        removable={!!product.image}
                        onRemove={() => removeProductImage(product)}
                      />
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === "name" ? (
                        <input
                          type="text"
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          className="border rounded px-2 py-1 text-sm w-full"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-medium text-slate-900 cursor-pointer transition hover:underline"
                          onDoubleClick={() => startInlineEdit(product, "name")}
                          title="Double click to edit"
                        >
                          {product.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCell?.id === product.id && editingCell.field === "price" ? (
                        <input
                          type="number"
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          className="border rounded px-2 py-1 text-sm text-right w-20"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold text-[#0B6E63] cursor-pointer transition hover:underline"
                          onDoubleClick={() => startInlineEdit(product, "price")}
                          title="Double click to edit"
                        >
                          {Number(product.price).toFixed(2)} DH
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-bold text-black bg-[#F9FAFB] border-gray-200">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.index ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-[#F1F1F1] border-gray-200 text-gray-700">{product.index}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.treatment ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-[#FCF3E9] border-gray-100 text-[#f6ad55]">
                          {product.treatment}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.company ? (
                        <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-[#ECFFFC] border-gray-100 text-[#38b2ac]">
                          {product.company}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-gray-100"
                          onClick={() => handleOpen(product)}
                          aria-label="Edit"
                        >
                          <Edit size={16} className="text-[#0B6E63]" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-red-100"
                          onClick={() => handleDeleteProduct(product.id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={16} className="text-[#e53e3e]" />
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
