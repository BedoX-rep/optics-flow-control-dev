
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Save } from 'lucide-react';
import ProductImage from './ProductImage';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_ttc?: number;
  stock_status?: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock';
  stock?: number;
  automated_name?: boolean;
  category?: string | null;
  index?: string | null;
  treatment?: string | null;
  company?: string | null;
  gamma?: string | null;
  image?: string | null;
  isEdited?: boolean;
}

interface ProductCardProps {
  product: Product;
  onFieldChange: (productId: string, field: keyof Product, value: any) => void;
  onSave: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  isSubmitting: boolean;
}

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
const COMPANY_OPTIONS = ["Indo", "ABlens", "Essilor", "GLASSANDLENS", "Optifak"];

const ProductCard = React.memo<ProductCardProps>(({ 
  product, 
  onFieldChange, 
  onSave, 
  onEdit, 
  onDelete, 
  isSubmitting 
}) => {
  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 ${
        product.isEdited 
          ? 'border-l-amber-400 shadow-md bg-amber-50/30' 
          : 'border-l-blue-400 hover:border-l-blue-500'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <ProductImage
            src={product.image}
            alt={product.category}
            className="w-12 h-12 rounded-lg object-cover border border-gray-100"
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={product.name}
              onChange={(e) => onFieldChange(product.id, 'name', e.target.value)}
              disabled={product.automated_name}
              className="font-semibold text-sm w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed mb-1"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={product.price}
                onChange={(e) => onFieldChange(product.id, 'price', Number(e.target.value))}
                className="font-medium text-blue-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-16 text-sm"
                min={0}
                step={0.01}
              />
              <span className="text-xs text-gray-500">DH</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Select
                value={product.category || ""}
                onValueChange={(value) => onFieldChange(product.id, 'category', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-7 text-xs border-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={product.index || ""}
                onValueChange={(value) => onFieldChange(product.id, 'index', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-7 text-xs border-gray-200">
                  <SelectValue placeholder="Index" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {INDEX_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Select
                value={product.treatment || ""}
                onValueChange={(value) => onFieldChange(product.id, 'treatment', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-7 text-xs border-gray-200">
                  <SelectValue placeholder="Treatment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {TREATMENT_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={product.company || ""}
                onValueChange={(value) => onFieldChange(product.id, 'company', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-7 text-xs border-gray-200">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {COMPANY_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={product.gamma || ""}
              onChange={(e) => onFieldChange(product.id, 'gamma', e.target.value || null)}
              className="h-7 px-2 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
              placeholder="Gamma"
            />

            <input
              type="number"
              value={product.cost_ttc || 0}
              onChange={(e) => onFieldChange(product.id, 'cost_ttc', Number(e.target.value))}
              className="h-7 px-2 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
              placeholder="Cost TTC"
              min={0}
              step={0.01}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={product.stock_status || 'Order'}
              onValueChange={(value: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock') => 
                onFieldChange(product.id, 'stock_status', value)
              }
            >
              <SelectTrigger className="h-7 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Order">Order</SelectItem>
                <SelectItem value="inStock">In Stock</SelectItem>
                <SelectItem value="Fabrication">Fabrication</SelectItem>
                <SelectItem value="Out Of Stock">Out Of Stock</SelectItem>
              </SelectContent>
            </Select>

            {product.stock_status === 'inStock' ? (
              <input
                type="number"
                value={product.stock || 0}
                onChange={(e) => onFieldChange(product.id, 'stock', Number(e.target.value))}
                className="h-7 px-2 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                placeholder="Stock"
                min={0}
              />
            ) : (
              <div className="flex items-center justify-center">
                <Switch
                  checked={product.automated_name}
                  onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                  className="scale-75"
                />
                <span className="text-xs text-gray-500 ml-1">Auto</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex gap-1">
            {product.isEdited && (
              <Button
                size="sm"
                onClick={() => onSave(product.id)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
              >
                <Save size={12} className="mr-1" />
                Save
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="text-gray-600 hover:text-blue-600 h-7 px-2 text-xs"
            >
              <Edit size={12} className="mr-1" />
              Edit
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
