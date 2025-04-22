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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ProductForm, { ProductFormValues } from "@/components/ProductForm";
import ProductFilters from "@/components/ProductFilters";
import ProductStatsSummary from "@/components/ProductStatsSummary";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  category?: string | null;
  index?: string | null;
  treatment?: string | null;
  company?: string | null;
  image?: string | null;
  created_at?: string | null;
}

const DEFAULT_FILTERS = {
  category: "all_categories",
  index: "all_indexes",
  treatment: "all_treatments",
  company: "all_companies",
  sort: "arrange",
};

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
const COMPANY_OPTIONS = [
  "Indo",
  "ABlens",
  "Essilor",
  "GLASSANDLENS",
  "Optifak"
];

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
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Product } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');
  const [pageReady, setPageReady] = useState(false);
  const mountedRef = useRef(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    setPageReady(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    sessionStorage.setItem("lensly_products_filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    function handleSidebar() {
      const el = document.querySelector('.sidebar-gradient');
      if (el) {
        const expanded = !(el.classList.contains('group-data-[state=collapsed]') || el.style.width === '48px');
        setSidebarExpanded(expanded);
        setSidebarWidth(el.clientWidth || 256);
      }
    }
    window.addEventListener('resize', handleSidebar);
    handleSidebar();
    const observer = new MutationObserver(handleSidebar);
    const sidebarEl = document.querySelector('.sidebar-gradient');
    if (sidebarEl) observer.observe(sidebarEl, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => {
      window.removeEventListener('resize', handleSidebar);
      observer.disconnect();
    }
  }, []);

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
      created_at: editing.created_at ?? undefined, //added created_at
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

  const startInlineEdit = (product: Product, field: keyof Product) => {
    setEditingCell({ id: product.id, field });
    setCellEditValue(String(product[field] ?? ''));
  };

  const endInlineEdit = async (product: Product) => {
    if (!editingCell || !user) return;
    let val: string | number | null = cellEditValue;

    // Handle special cases
    if (editingCell.field === "price") {
      val = Number(cellEditValue);
    } else if (cellEditValue === "none_selected" || cellEditValue === "") {
      val = null;
    }

    // Don't update if value hasn't changed
    if (val === (product[editingCell.field] ?? null)) {
      setEditingCell(null);
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .update({ [editingCell.field]: val })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, [editingCell.field]: val } : p
      ));
      toast({ title: "Updated", description: "Product updated successfully" });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      });
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
    <div
      className="flex flex-col h-[calc(100svh-68px)]"
      style={{
        width: "100%",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        transition: "all 0.2s ease",
        minHeight: "calc(100svh - 68px)",
      }}
    >
      <div className="flex flex-row items-end justify-between gap-2 flex-wrap mb-2 w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            className="!px-5 !py-2.5 rounded-full font-semibold bg-black text-white hover:bg-neutral-800 border border-black shadow flex items-center"
            onClick={() => handleOpen(null)}
          >
            <span className="mr-2 flex items-center"><Plus size={18} /></span>
            Add Product
          </Button>
          <span>
            <ProductStatsSummary products={products} />
          </span>
        </div>
        <div className="flex-grow flex items-end justify-end">
          <ProductFilters filters={filters} onChange={handleFilterChange} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2" style={{ minHeight: 0 }}>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-9 pr-2 bg-white border border-neutral-200 rounded-lg font-inter h-9 text-sm focus:ring-2 focus:ring-black focus:border-black w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            tabIndex={0}
          />
        </div>
      </div>

      <div className="flex-grow min-h-0 flex flex-col">
        <div className="w-full h-full flex-grow bg-white rounded-xl border border-neutral-200 shadow-sm overflow-auto">
          <Table className="table-fixed min-w-[980px] w-full">
            <TableHeader>
              <TableRow className="border-b border-neutral-100 bg-[#f6f6f7] sticky top-0 z-10">
                <TableHead className="text-black text-xs font-semibold w-14">Image</TableHead>
                <TableHead className="text-black text-xs font-semibold w-[230px]">Name</TableHead>
                <TableHead className="text-black text-xs font-semibold w-20 text-right">Price</TableHead>
                <TableHead className="text-black text-xs font-semibold w-20 text-right">Stock</TableHead>
                <TableHead className="text-black text-xs font-semibold w-32">Category</TableHead>
                <TableHead className="text-black text-xs font-semibold w-16">Index</TableHead>
                <TableHead className="text-black text-xs font-semibold w-24">Treatment</TableHead>
                <TableHead className="text-black text-xs font-semibold w-28">Company</TableHead>
                <TableHead className="text-black text-xs font-semibold w-28">Created At</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right w-[84px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 animate-pulse">
                    <div className="h-6 w-1/2 bg-[#F7FAFC] rounded mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-neutral-400 font-medium">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-[#FAFAFA] transition-all group rounded-lg"
                  >
                    <TableCell>
                      <ProductImage
                        src={typeof product.image === "string" ? product.image : undefined}
                        alt={product.name}
                        removable={!!product.image}
                        onRemove={() => removeProductImage(product)}
                        className="!w-11 !h-11"
                      />
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === "name" ? (
                        <input
                          type="text"
                          className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold text-black hover:underline cursor-pointer"
                          tabIndex={0}
                          title="Edit"
                          onClick={() => startInlineEdit(product, "name")}
                        >
                          {product.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCell?.id === product.id && editingCell.field === "price" ? (
                        <input
                          type="number"
                          className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm text-right w-full focus:ring-2 focus:ring-black"
                          min={0}
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold text-black hover:underline cursor-pointer"
                          tabIndex={0}
                          title="Edit"
                          onClick={() => startInlineEdit(product, "price")}
                        >
                          {Number(product.price).toFixed(2)} DH
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingCell?.id === product.id && editingCell.field === "stock" ? (
                        <input
                          type="number"
                          className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm text-right w-full focus:ring-2 focus:ring-black"
                          min={0}
                          value={cellEditValue}
                          onChange={e => setCellEditValue(e.target.value)}
                          onBlur={() => endInlineEdit(product)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="font-semibold text-black hover:underline cursor-pointer"
                          tabIndex={0}
                          title="Edit"
                          onClick={() => startInlineEdit(product, "stock")}
                        >
                          {product.stock || 0}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === "category" ? (
                        <>
                          {cellEditValue === "Custom" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(product)}
                              autoFocus
                            />
                          ) : (
                            <Select
                              value={cellEditValue}
                              onValueChange={(value) => {
                                if (value === "Custom") {
                                  setCellEditValue("");
                                } else {
                                  setCellEditValue(value);
                                  endInlineEdit(product);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-8">
                                <SelectValue>{cellEditValue || "Select category"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Custom">Custom</SelectItem>
                                {CATEGORY_OPTIONS.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      ) : (
                        <span
                          className="border rounded-full py-0.5 px-2 text-xs font-medium text-neutral-700 bg-white border-black/10 cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            startInlineEdit(product, "category");
                            setCellEditValue(product.category || "");
                          }}
                        >
                          {product.category || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === "index" ? (
                        <>
                          {cellEditValue === "Custom" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(product)}
                              autoFocus
                            />
                          ) : (
                            <Select
                              value={cellEditValue}
                              onValueChange={(value) => {
                                if (value === "Custom") {
                                  setCellEditValue("");
                                } else {
                                  setCellEditValue(value);
                                  endInlineEdit(product);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-8">
                                <SelectValue>{cellEditValue || "Select index"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Custom">Custom</SelectItem>
                                {INDEX_OPTIONS.map(idx => (
                                  <SelectItem key={idx} value={idx}>{idx}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      ) : (
                        <span
                          className={`${product.index ? "border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-700" : "text-neutral-400"} cursor-pointer hover:bg-gray-100`}
                          onClick={() => {
                            startInlineEdit(product, "index");
                            setCellEditValue(product.index || "");
                          }}
                        >
                          {product.index || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === "treatment" ? (
                        <>
                          {cellEditValue === "Custom" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(product)}
                              autoFocus
                            />
                          ) : (
                            <Select
                              value={cellEditValue}
                              onValueChange={(value) => {
                                if (value === "Custom") {
                                  setCellEditValue("");
                                } else {
                                  setCellEditValue(value);
                                  endInlineEdit(product);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-8">
                                <SelectValue>{cellEditValue || "Select treatment"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Custom">Custom</SelectItem>
                                {TREATMENT_OPTIONS.map(treat => (
                                  <SelectItem key={treat} value={treat}>{treat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      ) : (
                        <span
                          className={`${product.treatment ? "border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-700" : "text-neutral-400"} cursor-pointer hover:bg-gray-100`}
                          onClick={() => {
                            startInlineEdit(product, "treatment");
                            setCellEditValue(product.treatment || "");
                          }}
                        >
                          {product.treatment || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === "company" ? (
                        <>
                          {cellEditValue === "Custom" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(product)}
                              autoFocus
                            />
                          ) : (
                            <Select
                              value={cellEditValue}
                              onValueChange={(value) => {
                                if (value === "Custom") {
                                  setCellEditValue("");
                                } else {
                                  setCellEditValue(value);
                                  endInlineEdit(product);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full h-8">
                                <SelectValue>{cellEditValue || "Select company"}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Custom">Custom</SelectItem>
                                {COMPANY_OPTIONS.map(comp => (
                                  <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      ) : (
                        <span
                          className={`${product.company ? "border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-700" : "text-neutral-400"} cursor-pointer hover:bg-gray-100`}
                          onClick={() => {
                            startInlineEdit(product, "company");
                            setCellEditValue(product.company || "");
                          }}
                        >
                          {product.company || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600 text-xs">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                      </span>
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