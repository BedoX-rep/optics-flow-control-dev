
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

interface Product {
  id: string;
  name: string;
  price: number;
}

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<null | Product>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
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
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price > 0) {
      try {
        setIsSubmitting(true);
        
        if (editingProduct) {
          // Update existing product
          const { error } = await supabase
            .from('products')
            .update({ 
              name: newProduct.name,
              price: newProduct.price
            })
            .eq('id', editingProduct.id);
            
          if (error) throw error;
          
          toast({
            title: "Success",
            description: "Product updated successfully",
          });
        } else {
          // Add new product
          const { error } = await supabase
            .from('products')
            .insert({ 
              name: newProduct.name,
              price: newProduct.price
            });
            
          if (error) throw error;
          
          toast({
            title: "Success",
            description: "Product added successfully",
          });
        }
        
        setNewProduct({ name: '', price: 0 });
        setEditingProduct(null);
        setIsOpen(false);
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
    } else {
      toast({
        title: "Validation Error",
        description: "Please enter a name and a price greater than 0.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ name: product.name, price: product.price });
    setIsOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
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

  return (
    <div>
      <PageTitle title="Products" subtitle="Manage your inventory" />
      
      <div className="flex justify-between items-center mb-6">
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
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-optics-600 hover:bg-optics-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  className="col-span-3"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setEditingProduct(null);
                  setNewProduct({ name: '', price: 0 });
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                className="bg-optics-600 hover:bg-optics-700"
                onClick={handleAddProduct}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (editingProduct ? 'Update' : 'Add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.price.toFixed(2)} DH</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditProduct(product)}
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
