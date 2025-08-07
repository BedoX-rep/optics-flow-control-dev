
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Save, Package, MoreVertical } from 'lucide-react';
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

const getStockStatusStyle = (status: string) => {
  switch (status) {
    case 'inStock':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Order':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'Fabrication':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Out Of Stock':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

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

  const profitMargin = product.price > 0 && (product.cost_ttc ?? 0) > 0 
    ? (((product.price - (product.cost_ttc ?? 0)) / product.price) * 100).toFixed(1)
    : null;

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 border-2 hover:shadow-lg ${
        product.isEdited 
          ? 'border-l-4 border-l-amber-400 bg-amber-50/30 border-amber-200' 
          : 'border-teal-200 hover:border-teal-300 hover:shadow-teal-100/50'
      }`}
    >
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <ProductImage
              src={product.image}
              alt={product.category}
              className="w-16 h-16 rounded-xl object-cover border-2 border-teal-100 shadow-sm"
            />
            {!product.image && (
              <div className="w-16 h-16 rounded-xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-teal-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => onFieldChange(product.id, 'name', e.target.value)}
                  disabled={product.automated_name}
                  className="text-lg font-semibold text-teal-900 w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 rounded px-2 py-1 -mx-2 -my-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Product name"
                />
                
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => onFieldChange(product.id, 'price', Number(e.target.value))}
                      className="text-xl font-bold text-teal-700 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 rounded px-2 py-1 -mx-2 -my-1 w-20"
                      min={0}
                      step={0.01}
                    />
                    <span className="text-sm text-teal-600 font-medium">DH</span>
                  </div>
                  
                  {profitMargin && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                      {profitMargin}% margin
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-teal-600 h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-teal-100 mb-6"></div>

        {/* Fields Grid */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('category')}</label>
              <Select
                value={product.category || ""}
                onValueChange={(value) => onFieldChange(product.id, 'category', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-9 border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('index')}</label>
              <Select
                value={product.index || ""}
                onValueChange={(value) => onFieldChange(product.id, 'index', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-9 border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('treatment')}</label>
              <Select
                value={product.treatment || ""}
                onValueChange={(value) => onFieldChange(product.id, 'treatment', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-9 border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company')}</label>
              <Select
                value={product.company || ""}
                onValueChange={(value) => onFieldChange(product.id, 'company', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-9 border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('gamma')}</label>
              <input
                type="text"
                value={product.gamma || ""}
                onChange={(e) => onFieldChange(product.id, 'gamma', e.target.value || null)}
                className="h-9 px-3 text-sm border border-teal-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 focus:outline-none w-full"
                placeholder={t('gamma')}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('costTTC')} (DH)</label>
              <input
                type="number"
                value={product.cost_ttc || 0}
                onChange={(e) => onFieldChange(product.id, 'cost_ttc', Number(e.target.value))}
                className="h-9 px-3 text-sm border border-teal-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 focus:outline-none w-full"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('stockStatus')}</label>
              <Select
                value={product.stock_status || 'Order'}
                onValueChange={(value: 'Order' | 'inStock' | 'Fabrication' | 'Out Of Stock') => 
                  onFieldChange(product.id, 'stock_status', value)
                }
              >
                <SelectTrigger className="h-9 border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('stock')} {t('quantity') || 'Qty'}</label>
                <input
                  type="number"
                  value={product.stock || 0}
                  onChange={(e) => onFieldChange(product.id, 'stock', Number(e.target.value))}
                  className="h-9 px-3 text-sm border border-teal-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 focus:outline-none w-full"
                  placeholder="0"
                  min={0}
                />
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-teal-100 mb-6"></div>

        {/* Footer Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusStyle(product.stock_status || 'Order')}`}>
              {t(product.stock_status?.toLowerCase() || 'order')}
            </span>

            {/* Auto Switch */}
            <div className="flex items-center gap-2">
              <Switch
                checked={product.automated_name}
                onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                className="scale-90"
              />
              <span className="text-xs font-medium text-gray-500">{t('auto')}</span>
            </div>

            {/* Created Date */}
            {product.created_at && (
              <span className="text-xs text-gray-400">
                {new Date(product.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {product.isEdited && (
              <Button
                size="sm"
                onClick={() => onSave(product.id)}
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4 text-sm font-medium"
              >
                <Save size={14} className="mr-2" />
                {t('saveButton')}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300 h-9 px-4 text-sm"
            >
              <Edit size={14} className="mr-2" />
              {t('edit')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(product.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 px-3"
            >
              <Trash2 size={14} />
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
