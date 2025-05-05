
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Minus } from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import { ProductSortable } from '@/components/products/sortProducts';

interface ProductCardProps {
  product: ProductSortable;
  onEdit: (product: ProductSortable) => void;
  onDelete: (id: string) => void;
  onStockUpdate: (product: ProductSortable, field: string, value: string | null) => void;
  onShowDetails: (product: ProductSortable) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onStockUpdate,
  onShowDetails,
}) => {
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-teal-100"
      onClick={() => onShowDetails(product)}
    >
      <div className="aspect-square relative overflow-hidden bg-gray-50 flex items-center justify-center">
        <ProductImage
          src={typeof product.image === "string" ? product.image : undefined}
          alt={product.name}
          className="w-full h-full object-contain p-4"
        />
        
        <div className="absolute top-2 right-2 flex gap-1">
          {product.category && (
            <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full border border-gray-100 text-gray-800">
              {product.category}
            </span>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 h-12" title={product.name}>
          {product.name}
        </h3>
        
        <div className="flex justify-between items-end mt-3">
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-gray-900">
              {Number(product.price).toFixed(2)} DH
            </span>
            {product.cost_ttc !== undefined && (
              <span className="text-xs text-gray-500">
                Cost: {Number(product.cost_ttc).toFixed(2)} DH
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                const newStock = Math.max(0, (product.stock || 0) - 1);
                onStockUpdate(product, "stock", String(newStock));
              }}
            >
              <Minus className="h-4 w-4 text-gray-600" />
            </Button>
            
            <span className={`text-sm font-medium ${(product.stock || 0) === 0 ? 'text-red-600' : 'text-gray-700'} mx-2`}>
              {(product.stock || 0) === 0 ? "Out of stock" : product.stock}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                const newStock = (product.stock || 0) + 1;
                onStockUpdate(product, "stock", String(newStock));
              }}
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex space-x-1">
            {product.index && (
              <span className="px-2 py-1 bg-gray-50 text-xs rounded-full text-gray-700">
                {product.index}
              </span>
            )}
            {product.treatment && (
              <span className="px-2 py-1 bg-gray-50 text-xs rounded-full text-gray-700">
                {product.treatment}
              </span>
            )}
          </div>
          
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
