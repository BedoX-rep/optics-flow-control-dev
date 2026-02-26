import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Save, Album, Filter, Building2, Layers, Coins, Zap } from 'lucide-react';
import ProductImage from './ProductImage';
import { useLanguage } from './LanguageProvider';
import { useCompanies } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';

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
const DetailItem = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={12} />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xs font-bold text-slate-700 truncate pl-4.5 border-l border-slate-100">
        {value}
      </span>
    </div>
  );
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

  return (
    <Card
      className={`h-[500px] w-full overflow-hidden transition-all duration-500 flex flex-col group relative ${product.isEdited
        ? 'ring-2 ring-amber-400 border-l-4 border-l-amber-400 shadow-2xl bg-white scale-[1.02]'
        : 'hover:shadow-2xl hover:scale-[1.02] bg-white border border-teal-100/50 border-l-4 border-l-teal-500 shadow-sm'
        }`}
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-full -ml-12 -mb-12 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 h-full flex flex-col relative z-10">
        {/* Header: Name + Image */}
        <div className="flex items-start gap-5 mb-6">
          <div className="relative group/img flex-shrink-0">
            <ProductImage
              src={product.image}
              alt={product.category || ''}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md transition-transform group-hover/img:scale-110"
            />
            <div className={cn(
              "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
              product.stock_status === 'inStock' ? 'bg-emerald-500' :
                product.stock_status === 'Out Of Stock' ? 'bg-rose-500' : 'bg-amber-500'
            )}></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                {product.category ? t(product.category.replace(/\s+/g, '').toLowerCase()) : t('noCategory')}
              </span>
              {product.created_at && (
                <span className="text-[9px] text-slate-400 font-bold uppercase ml-auto">
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <textarea
              value={product.name}
              onChange={(e) => onFieldChange(product.id, 'name', e.target.value)}
              disabled={product.automated_name}
              rows={2}
              className="font-poppins font-black text-lg w-full bg-transparent border-0 focus:ring-0 resize-none leading-tight py-0 disabled:opacity-80 text-slate-800 placeholder-slate-300 transition-colors focus:text-teal-700"
              placeholder="Product name..."
            />
          </div>
        </div>

        {/* Price Section - Highlighted Label */}
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between group-hover:bg-teal-50/30 transition-colors">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Sale Price</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={product.price}
                onChange={(e) => onFieldChange(product.id, 'price', Number(e.target.value))}
                className="font-poppins font-black text-2xl text-teal-600 bg-transparent border-0 p-0 w-28 focus:ring-0"
                min={0}
                step={0.01}
              />
              <span className="text-sm font-black text-teal-600/50">DH</span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-200" />

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Stock status</span>
            <div className={cn(
              "text-xs font-black px-3 py-1 rounded-lg uppercase tracking-tight",
              product.stock_status === 'inStock' ? 'bg-emerald-100 text-emerald-700' :
                product.stock_status === 'Out Of Stock' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            )}>
              {product.stock_status === 'inStock' ? `${t('inStock')} (${product.stock || 0})` : t(product.stock_status?.replace(/\s+/g, '').toLowerCase() || 'order')}
            </div>
          </div>
        </div>

        {/* All Product Values - Information Grid */}
        <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-6">
          <DetailItem label={t('index')} value={product.index || "—"} icon={Album} />
          <DetailItem label={t('treatment')} value={product.treatment ? t(product.treatment.toLowerCase()) : "—"} icon={Filter} />
          <DetailItem label={t('company')} value={product.company || "—"} icon={Building2} />
          <DetailItem label={t('gamma')} value={product.gamma || "—"} icon={Layers} />
          <DetailItem label={t('costTTC')} value={product.cost_ttc ? `${product.cost_ttc} DH` : "—"} icon={Coins} />
          <DetailItem label="Auto Name" value={product.automated_name ? "Enabled" : "Disabled"} icon={Zap} />
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(product)}
              className="h-10 w-10 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
            >
              <Edit size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {product.isEdited && (
              <Button
                onClick={() => onSave(product.id)}
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 h-10 font-bold shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
              >
                <Save size={16} className="mr-2" />
                {t('saveButton')}
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={product.automated_name}
                onCheckedChange={(checked) => onFieldChange(product.id, 'automated_name', checked)}
                className="scale-75 data-[state=checked]:bg-teal-600"
              />
              <span className="text-[10px] font-black uppercase text-slate-400 tabular-nums">Auto</span>
            </div>
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