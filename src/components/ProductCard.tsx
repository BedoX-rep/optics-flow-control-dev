import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Save } from 'lucide-react';
import ProductImage from './ProductImage';
import { useLanguage } from './LanguageProvider';

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
  { value: "Single Vision Lenses", labelKey: "singleVisionLenses" },
  { value: "Progressive Lenses", labelKey: "progressiveLenses" },
  { value: "Frames", labelKey: "frames" },
  { value: "Sunglasses", labelKey: "sunglasses" },
  { value: "Contact Lenses", labelKey: "contactLenses" },
  { value: "Accessories", labelKey: "accessories" },
  { value: "Service", labelKey: "service" },
  { value: "Other", labelKey: "other" }
];

const INDEX_OPTIONS = ["1.50", "1.56", "1.59", "1.6", "1.67", "1.74"];
const TREATMENT_OPTIONS = [
  { value: "White", labelKey: "white" },
  { value: "AR", labelKey: "ar" },
  { value: "Blue", labelKey: "blue" },
  { value: "Photochromic", labelKey: "photochromic" },
  { value: "Polarized", labelKey: "polarized" },
  { value: "UV protection", labelKey: "uvProtection" },
  { value: "Tint", labelKey: "tint" }
];
const COMPANY_OPTIONS = ["Indo", "ABlens", "Essilor", "GLASSANDLENS", "Optifak"];

const ProductCard = React.memo<ProductCardProps>(({ 
  product, 
  onFieldChange, 
  onSave, 
  onEdit, 
  onDelete, 
  isSubmitting 
}) => {
  const { t } = useLanguage();
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
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  {CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
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
                  <SelectValue placeholder={t('index')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
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
                  <SelectValue placeholder={t('treatment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  {TREATMENT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
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
                  <SelectValue placeholder={t('company')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  {COMPANY_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 font-medium block mb-1">{t('gamma')}</label>
              <input
                type="text"
                value={product.gamma || ""}
                onChange={(e) => onFieldChange(product.id, 'gamma', e.target.value || null)}
                className="h-7 px-2 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none w-full"
                placeholder={t('gamma')}
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 font-medium block mb-1">{t('costTTC')} (DH)</label>
              <input
                type="number"
                value={product.cost_ttc || 0}
                onChange={(e) => onFieldChange(product.id, 'cost_ttc', Number(e.target.value))}
                className="h-7 px-2 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none w-full"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 font-medium block mb-1">{t('stockStatus')}</label>
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
                  <SelectItem value="Order">{t('order')}</SelectItem>
                  <SelectItem value="inStock">{t('inStock')}</SelectItem>
                  <SelectItem value="Fabrication">{t('fabrication')}</SelectItem>
                  <SelectItem value="Out Of Stock">{t('outOfStock')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {product.stock_status === 'inStock' ? (
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">{t('stock')} {t('quantity') || 'Qty'}</label>
                <input
                  type="number"
                  value={product.stock || 0}
                  onChange={(e) => onFieldChange(product.id, 'stock', Number(e.target.value))}
                  className="h-7 px-2 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none w-full"
                  placeholder="0"
                  min={0}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-1">{t('generateNameAuto')}</label>
                <div className="flex items-center h-7">
                  <Switch
                    checked={product.automated_name}
                    onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                    className="scale-75"
                  />
                  <span className="text-xs text-gray-500 ml-1">{t('auto')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Auto Toggle - Always visible at bottom */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600 font-medium">{t('generateNameAuto')}</label>
              <div className="flex items-center">
                <Switch
                  checked={product.automated_name}
                  onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                  className="scale-75"
                />
                <span className="text-xs text-gray-500 ml-1">{product.automated_name ? t('on') || 'ON' : t('off') || 'OFF'}</span>
              </div>
            </div>
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
                {t('saveButton')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="text-gray-600 hover:text-blue-600 h-7 px-2 text-xs"
            >
              <Edit size={12} className="mr-1" />
              {t('edit')}
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
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.cost_ttc === nextProps.product.cost_ttc &&
    prevProps.product.stock_status === nextProps.product.stock_status &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.automated_name === nextProps.product.automated_name &&
    prevProps.product.category === nextProps.product.category &&
    prevProps.product.index === nextProps.product.index &&
    prevProps.product.treatment === nextProps.product.treatment &&
    prevProps.product.company === nextProps.product.company &&
    prevProps.product.gamma === nextProps.product.gamma &&
    prevProps.product.image === nextProps.product.image &&
    prevProps.product.isEdited === nextProps.product.isEdited &&
    prevProps.isSubmitting === nextProps.isSubmitting
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;