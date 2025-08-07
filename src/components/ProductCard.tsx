import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Save, Package } from 'lucide-react';
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
    ? (((product.price - (product.cost_ttc ?? 0)) / product.price) * 100).toFixed(0)
    : null;

  return (
    <Card 
      className={`overflow-hidden transition-all duration-200 border hover:shadow-md ${
        product.isEdited 
          ? 'border-l-4 border-l-amber-400 bg-amber-50/20 border-amber-200' 
          : 'border-teal-200 hover:border-teal-300'
      }`}
    >
      <div className="p-4">
        {/* Header - Name, Price, Status */}
        <div className="flex items-center justify-between mb-3 h-12">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              {product.image ? (
                <ProductImage
                  src={product.image}
                  alt={product.category}
                  className="w-10 h-10 rounded-lg object-cover border border-teal-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-teal-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={product.name}
                onChange={(e) => onFieldChange(product.id, 'name', e.target.value)}
                disabled={product.automated_name}
                className="text-base font-semibold text-teal-900 w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:ring-opacity-30 rounded px-1 py-0.5 -mx-1 disabled:opacity-60 disabled:cursor-not-allowed truncate"
                placeholder="Product name"
              />

              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-baseline">
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => onFieldChange(product.id, 'price', Number(e.target.value))}
                    className="text-lg font-bold text-teal-700 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:ring-opacity-30 rounded px-1 py-0.5 -mx-1 w-16"
                    min={0}
                    step={0.01}
                  />
                  <span className="text-sm text-teal-600 font-medium">DH</span>
                </div>

                {profitMargin && (
                  <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                    +{profitMargin}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className={`px-2 py-1 rounded text-xs font-medium border shrink-0 ${getStockStatusStyle(product.stock_status || 'Order')}`}>
            {t(product.stock_status?.toLowerCase() || 'order')}
          </span>
        </div>

        {/* Content - Key Fields */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('category')}</label>
              <Select
                value={product.category || ""}
                onValueChange={(value) => onFieldChange(product.id, 'category', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-7 text-sm border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
                  <SelectValue placeholder="—" />
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
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('company')}</label>
              <Select
                value={product.company || ""}
                onValueChange={(value) => onFieldChange(product.id, 'company', value === "none" ? null : value)}
              >
                <SelectTrigger className="h-7 text-sm border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
                  <SelectValue placeholder="—" />
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

          {(product.category?.includes('Lenses') || product.index || product.treatment) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('index')}</label>
                <Select
                  value={product.index || ""}
                  onValueChange={(value) => onFieldChange(product.id, 'index', value === "none" ? null : value)}
                >
                  <SelectTrigger className="h-7 text-sm border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none')}</SelectItem>
                    {INDEX_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('treatment')}</label>
                <Select
                  value={product.treatment || ""}
                  onValueChange={(value) => onFieldChange(product.id, 'treatment', value === "none" ? null : value)}
                >
                  <SelectTrigger className="h-7 text-sm border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none')}</SelectItem>
                    {TREATMENT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Actions and Info */}
        <div className="flex items-center justify-between h-10 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Switch
                checked={product.automated_name}
                onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                className="scale-75"
              />
              <span className="text-xs font-medium text-gray-500">{t('auto')}</span>
            </div>

            {product.cost_ttc && product.cost_ttc > 0 && (
              <span className="text-xs text-gray-400">
                Cost: {product.cost_ttc}DH
              </span>
            )}

            {product.stock_status === 'inStock' && product.stock && (
              <span className="text-xs text-gray-400">
                Qty: {product.stock}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {product.isEdited && (
              <Button
                size="sm"
                onClick={() => onSave(product.id)}
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white h-8 px-3 text-xs"
              >
                <Save size={12} className="mr-1.5" />
                {t('saveButton')}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(product)}
              className="text-teal-600 hover:bg-teal-50 h-8 w-8 p-0"
            >
              <Edit size={14} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(product.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
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