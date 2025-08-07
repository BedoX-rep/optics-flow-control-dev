import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Save } from 'lucide-react';
import ProductImage from './ProductImage';
import { useLanguage } from './LanguageProvider';
import { useCompanies } from '@/hooks/useCompanies';

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
  created_at?: string | null;
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
const ProductCard = React.memo<ProductCardProps>(({ 
  product, 
  onFieldChange, 
  onSave, 
  onEdit, 
  onDelete, 
  isSubmitting 
}) => {
  const { t } = useLanguage();
  const { allCompanies } = useCompanies();
  return (
    <Card 
      className={`h-[420px] w-full overflow-hidden transition-all duration-300 border-l-4 font-inter ${
        product.isEdited 
          ? 'border-l-amber-400 shadow-lg bg-gradient-to-br from-amber-50/40 to-amber-100/20 hover:shadow-xl' 
          : 'border-l-teal-500 bg-gradient-to-br from-teal-50/30 to-seafoam-50/20 hover:border-l-teal-600 hover:shadow-lg hover:from-teal-50/50 hover:to-seafoam-50/30'
      }`}
    >
      <div className="p-5 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            <ProductImage
              src={product.image}
              alt={product.category}
              className="w-14 h-14 rounded-xl object-cover border-2 border-teal-100 shadow-sm"
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={product.name}
              onChange={(e) => onFieldChange(product.id, 'name', e.target.value)}
              disabled={product.automated_name}
              className="font-poppins font-semibold text-base w-full bg-transparent border-b-2 border-transparent hover:border-teal-200 focus:border-teal-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed mb-2 text-gray-800 placeholder-gray-400"
              placeholder="Product name..."
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={product.price}
                  onChange={(e) => onFieldChange(product.id, 'price', Number(e.target.value))}
                  className="font-poppins font-bold text-teal-700 bg-teal-50/50 border border-teal-200 rounded-lg px-2 py-1 hover:border-teal-400 focus:border-teal-500 focus:outline-none w-20 text-sm"
                  min={0}
                  step={0.01}
                />
                <span className="text-sm text-teal-600 font-medium">DH</span>
              </div>
              {product.created_at && (
                <span className="text-xs text-gray-500 font-inter bg-gray-100/80 px-2 py-1 rounded-full">
                  {new Date(product.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields Section */}
        <div className="flex-1 space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('category')}</label>
              <Select
                value={product.category || ""}
                onValueChange={(value) => onFieldChange(product.id, 'category', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-8 text-xs border-teal-200 bg-teal-50/30 hover:border-teal-400 focus:border-teal-500 font-inter">
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
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('index')}</label>
              <Select
                value={product.index || ""}
                onValueChange={(value) => onFieldChange(product.id, 'index', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-8 text-xs border-teal-200 bg-teal-50/30 hover:border-teal-400 focus:border-teal-500 font-inter">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('treatment')}</label>
              <Select
                value={product.treatment || ""}
                onValueChange={(value) => onFieldChange(product.id, 'treatment', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-8 text-xs border-teal-200 bg-teal-50/30 hover:border-teal-400 focus:border-teal-500 font-inter">
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
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('company')}</label>
              <Select
                value={product.company || ""}
                onValueChange={(value) => onFieldChange(product.id, 'company', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-8 text-xs border-teal-200 bg-teal-50/30 hover:border-teal-400 focus:border-teal-500 font-inter">
                  <SelectValue placeholder={t('company')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('none')}</SelectItem>
                  {allCompanies.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('gamma')}</label>
              <input
                type="text"
                value={product.gamma || ""}
                onChange={(e) => onFieldChange(product.id, 'gamma', e.target.value || null)}
                className="h-8 px-3 text-xs border border-teal-200 bg-teal-50/30 rounded-lg hover:border-teal-400 focus:border-teal-500 focus:outline-none w-full font-inter placeholder-teal-400"
                placeholder={t('gamma')}
              />
            </div>

            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('costTTC')} (DH)</label>
              <input
                type="number"
                value={product.cost_ttc || 0}
                onChange={(e) => onFieldChange(product.id, 'cost_ttc', Number(e.target.value))}
                className="h-8 px-3 text-xs border border-teal-200 bg-teal-50/30 rounded-lg hover:border-teal-400 focus:border-teal-500 focus:outline-none w-full font-inter placeholder-teal-400"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('stockStatus')}</label>
              <Select
                value={product.stock_status || 'Order'}
                onValueChange={(value: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock') => 
                  onFieldChange(product.id, 'stock_status', value)
                }
              >
                <SelectTrigger className="h-8 text-xs border-teal-200 bg-teal-50/30 hover:border-teal-400 focus:border-teal-500 font-inter">
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

            {product.stock_status === 'inStock' && (
              <div>
                <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('stock')} {t('quantity') || 'Qty'}</label>
                <input
                  type="number"
                  value={product.stock || 0}
                  onChange={(e) => onFieldChange(product.id, 'stock', Number(e.target.value))}
                  className="h-8 px-3 text-xs border border-teal-200 bg-teal-50/30 rounded-lg hover:border-teal-400 focus:border-teal-500 focus:outline-none w-full font-inter placeholder-teal-400"
                  placeholder="0"
                  min={0}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t-2 border-teal-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={product.automated_name}
                onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                className="data-[state=checked]:bg-teal-600"
              />
              <span className="text-xs text-teal-600 font-inter font-medium">{t('auto')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(product.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3 text-xs font-inter rounded-lg"
            >
              <Trash2 size={14} />
            </Button>
          </div>
          
          <div className="flex gap-2">
            {product.isEdited && (
              <Button
                size="sm"
                onClick={() => onSave(product.id)}
                disabled={isSubmitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white h-9 px-3 text-xs font-poppins font-medium rounded-lg shadow-sm"
              >
                <Save size={14} className="mr-2" />
                {t('saveButton')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className={`${product.isEdited ? 'flex-1' : 'w-full'} border-teal-200 text-teal-700 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-300 h-9 px-3 text-xs font-poppins font-medium rounded-lg`}
            >
              <Edit size={14} className="mr-2" />
              {t('edit')}
            </Button>
          </div>
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