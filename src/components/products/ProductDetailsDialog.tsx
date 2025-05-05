
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Edit } from 'lucide-react';
import { ProductSortable } from '@/components/products/sortProducts';
import ProductImage from '@/components/ProductImage';

interface ProductDetailsDialogProps {
  product: ProductSortable | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: ProductSortable) => void;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!product) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              {product.name}
            </DialogTitle>
            <DialogClose className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <DialogDescription className="text-base text-gray-600 mt-1">
            Product details and specifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="bg-gray-50 rounded-lg flex items-center justify-center p-6 aspect-square">
            <ProductImage
              src={typeof product.image === "string" ? product.image : undefined}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Product Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-semibold text-gray-900">{Number(product.price).toFixed(2)} DH</span>
                </div>
                
                {product.cost_ttc !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cost TTC:</span>
                    <span className="text-gray-900">{Number(product.cost_ttc).toFixed(2)} DH</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock:</span>
                  <span className={`${(product.stock || 0) === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                    {(product.stock || 0) === 0 ? "Out of stock" : product.stock}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">{formatDate(product.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Specifications</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Category</span>
                  <span className="font-medium text-gray-800">{product.category || 'N/A'}</span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Index</span>
                  <span className="font-medium text-gray-800">{product.index || 'N/A'}</span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Treatment</span>
                  <span className="font-medium text-gray-800">{product.treatment || 'N/A'}</span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500 block">Company</span>
                  <span className="font-medium text-gray-800">{product.company || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => {
                  onEdit(product);
                  onClose();
                }}
                className="w-full bg-teal-500 hover:bg-teal-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
