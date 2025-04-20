
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
  category: "",
  index: "",
  treatment: "",
  company: "",
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

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.index) query = query.eq('index', filters.index);
      if (filters.treatment) query = query.eq('treatment', filters.treatment);
      if (filters.company) query = query.eq('company', filters.company);

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
      <PageTitle title="Products" subtitle="Manage your inventory" />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="bg-optics-600 hover:bg-optics-700"
          onClick={() => handleOpen(null)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
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
      <div className="bg-white rounded-lg shadow overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Index</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded border" />
                    ) : (
                      <div className="w-14 h-14 rounded border flex items-center justify-center text-gray-300">
                        <span>No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category || "-"}</TableCell>
                  <TableCell>{product.index || "-"}</TableCell>
                  <TableCell>{product.treatment || "-"}</TableCell>
                  <TableCell>{product.company || "-"}</TableCell>
                  <TableCell className="text-right">{Number(product.price).toFixed(2)} DH</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpen(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash className="h-4 w-4" />
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
  );
};

export default Products;
