import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Copy, Plus, PlusCircle, Trash, AlertCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog } from "@/components/ui/dialog";
import ProductFilters from '@/components/ProductFilters';
import ProductForm, { ProductFormValues } from '@/components/ProductForm';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface OrderItemsProps {
  items: any[];
  orderType: string;
  products: any[];
  productSearchTerms: Record<string, string>;
  filters: Record<string, string>;
  setOrderType: (value: string) => void;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  updateItem: (id: string, field: string, value: any) => void;
  removeItem: (id: string) => void;
  setProductSearchTerms: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  getFilteredProducts: (searchTerm: string) => any[];
  getEyeValues: (eye: 'RE' | 'LE') => { sph: number | null; cyl: number | null };
  calculateMarkup: (sph: number | null, cyl: number | null) => number;
  checkOutOfStockWarning?: React.MutableRefObject<(() => boolean) | null>;
  onProceedWithOutOfStock?: () => void;
  manualAdditionalCostsEnabled: boolean;
  setManualAdditionalCostsEnabled: (enabled: boolean) => void;
  manualAdditionalCostsAmount: number;
  setManualAdditionalCostsAmount: (amount: number) => void;
  refreshProducts?: () => void;
}

const ORDER_TYPE_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  Unspecified: { color: 'text-red-600', dot: 'bg-red-500', label: 'unspecified' },
  Montage: { color: 'text-emerald-700', dot: 'bg-emerald-500', label: 'montage' },
  Retoyage: { color: 'text-blue-700', dot: 'bg-blue-500', label: 'retoyage' },
  Sell: { color: 'text-indigo-700', dot: 'bg-indigo-500', label: 'sell' },
};

const STOCK_BADGE: Record<string, string> = {
  inStock: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Out Of Stock': 'bg-red-50 text-red-700 border border-red-200',
  Order: 'bg-amber-50 text-amber-700 border border-amber-200',
  Fabrication: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const OrderItems: React.FC<OrderItemsProps> = ({
  items,
  orderType,
  products,
  productSearchTerms,
  filters,
  setOrderType,
  setItems,
  updateItem,
  removeItem,
  setProductSearchTerms,
  setFilters,
  getFilteredProducts,
  getEyeValues,
  calculateMarkup,
  checkOutOfStockWarning,
  onProceedWithOutOfStock,
  manualAdditionalCostsEnabled,
  setManualAdditionalCostsEnabled,
  manualAdditionalCostsAmount,
  setManualAdditionalCostsAmount,
  refreshProducts,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showOutOfStockWarning, setShowOutOfStockWarning] = useState(false);
  const [outOfStockProducts, setOutOfStockProducts] = useState<string[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const addItem = (type: 'product' | 'custom') => {
    if (type === 'product') {
      setItems(prev => [...prev, { id: `item-${Date.now()}`, quantity: 1, price: 0, cost: 0 }]);
    } else {
      setItems(prev => [...prev, { id: `custom-${Date.now()}`, customName: '', quantity: 1, price: 0, cost: 0 }]);
    }
  };

  const handleProductSubmit = async (values: ProductFormValues) => {
    if (!user) {
      toast({ title: t('error'), description: t('mustBeLoggedIn'), variant: 'destructive' });
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .insert({ ...values, user_id: user.id, is_deleted: false, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      toast({ title: t('success'), description: t('productCreatedSuccessfully') });
      setIsProductFormOpen(false);
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      console.error(err);
      toast({ title: t('error'), description: t('failedToCreateProduct'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const checkAndShowOutOfStockWarning = () => {
    const oos = items.filter(item => {
      if (!item.productId) return false;
      return products.find(p => p.id === item.productId)?.stock_status === 'Out Of Stock';
    });
    if (oos.length > 0) {
      setOutOfStockProducts(oos.map(i => products.find(p => p.id === i.productId)?.name || 'Unknown'));
      setShowOutOfStockWarning(true);
      return true;
    }
    return false;
  };

  React.useEffect(() => {
    if (checkOutOfStockWarning) checkOutOfStockWarning.current = checkAndShowOutOfStockWarning;
  }, [items, products, checkOutOfStockWarning]);

  const outOfStockItems = items.filter(item =>
    item.productId && products.find(p => p.id === item.productId)?.stock_status === 'Out Of Stock'
  );

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .order-items-root { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        .item-card { transition: box-shadow 0.2s, border-color 0.2s; }
        .item-card:hover { box-shadow: 0 4px 24px 0 rgba(13,148,136,0.10); }
        .teal-focus:focus { outline: none; border-color: #0d9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.15); }
        .action-btn { transition: background 0.15s, color 0.15s, transform 0.1s; }
        .action-btn:active { transform: scale(0.95); }
        .badge { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; letter-spacing: 0.02em; }
        .order-type-pill { display: inline-flex; align-items: center; gap: 6px; }
        .collapse-section { overflow: hidden; transition: max-height 0.3s ease; }
        @keyframes slideIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .slide-in { animation: slideIn 0.22s ease both; }
      `}</style>

      <div className="order-items-root bg-white rounded-2xl shadow-sm border-2 border-teal-500 overflow-hidden relative">

        {/* Out of Stock Banner */}
        {outOfStockItems.length > 0 && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">{t('outOfStockWarning')}</p>
              <p className="text-xs text-red-600 mt-0.5">{t('outOfStockDesc')}</p>
              <ul className="mt-2 space-y-1">
                {outOfStockItems.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <li key={item.id} className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      {product?.name || t('unknownProduct')}
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-red-500 mt-2 italic">{t('canStillProceed')}</p>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="bg-white border-b border-teal-100 p-4 sm:p-6 space-y-4">

          {/* Action Buttons */}
          {/* Action Buttons (Desktop only) */}
          <div className="hidden sm:flex flex-row items-center gap-3">
            <button
              onClick={() => addItem('product')}
              className="action-btn flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 px-5 font-semibold text-sm shadow-sm shadow-teal-200"
            >
              <Plus className="h-4 w-4" />
              {t('addProduct')}
            </button>
            <button
              onClick={() => addItem('custom')}
              className="action-btn flex items-center justify-center gap-2 bg-white border border-teal-200 hover:border-teal-400 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-xl h-11 px-5 font-semibold text-sm"
            >
              <Plus className="h-4 w-4" />
              {t('addCustomItem')}
            </button>

            {/* Global Search (Desktop) */}
            <div className="flex-1 max-w-[300px] relative">
              <input
                placeholder={t('searchProducts') || 'Search products...'}
                value={productSearchTerms['global'] || ''}
                onChange={e => setProductSearchTerms(prev => ({ ...prev, global: e.target.value }))}
                className="teal-focus w-full h-11 rounded-xl border border-teal-100 bg-white px-4 pr-10 text-sm font-medium text-slate-700 focus:border-teal-500 shadow-sm"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-teal-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <button
              onClick={() => setIsProductFormOpen(true)}
              className="action-btn ml-auto flex items-center justify-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 rounded-xl h-11 px-5 font-semibold text-sm"
            >
              <Package className="h-4 w-4" />
              {t('newProduct')}
            </button>
          </div>

          {/* Controls Row */}
          <div className="bg-white border border-teal-100 rounded-xl p-3 sm:p-4 space-y-3">

            {/* Mobile Actions Header */}
            <div className="flex sm:hidden items-center justify-between gap-4 pb-2 border-b border-teal-50/50">
              <button
                onClick={() => addItem('product')}
                className="flex-1 flex items-center justify-center h-12 rounded-xl bg-teal-600 text-white shadow-sm active:scale-95 transition-transform"
                title={t('addProduct')}
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                onClick={() => addItem('custom')}
                className="flex-1 flex items-center justify-center h-12 rounded-xl bg-white border-2 border-teal-500 text-teal-600 active:scale-95 transition-transform"
                title={t('addCustomItem')}
              >
                <PlusCircle className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsProductFormOpen(true)}
                className="flex-1 flex items-center justify-center h-12 rounded-xl bg-blue-600 text-white shadow-sm active:scale-95 transition-transform"
                title={t('newProduct')}
              >
                <Package className="w-6 h-6" />
              </button>
            </div>

            {/* Order Type + Search + Manual Costs */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">

              {/* Order Type */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap shrink-0">
                  {t('orderType')}
                </span>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger className={`teal-focus w-full sm:w-[164px] h-9 rounded-lg border text-sm font-semibold ${orderType === 'Unspecified'
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-teal-200 bg-white text-slate-800'
                    }`}>
                    <SelectValue>
                      <span className="order-type-pill">
                        {orderType === 'Unspecified'
                          ? <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          : <span className={`w-2 h-2 rounded-full ${ORDER_TYPE_CONFIG[orderType]?.dot || 'bg-slate-400'}`} />
                        }
                        {t(ORDER_TYPE_CONFIG[orderType]?.label || orderType.toLowerCase())}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-teal-200 shadow-xl bg-white">
                    {Object.entries(ORDER_TYPE_CONFIG).map(([val, cfg]) => (
                      <SelectItem key={val} value={val} className="rounded-lg cursor-pointer text-sm">
                        <span className="order-type-pill">
                          {val === 'Unspecified'
                            ? <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            : <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          }
                          <span className={`font-semibold ${cfg.color}`}>{t(cfg.label)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filters toggle (Desktop) */}
              <div className="hidden sm:block">
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors py-2 px-3 bg-white border border-teal-100 rounded-xl hover:bg-teal-50"
                >
                  {showFilters ? <ChevronUp className="h-3.5 w-3.5 text-teal-500" /> : <ChevronDown className="h-3.5 w-3.5 text-teal-500" />}
                  <span className="uppercase tracking-wider">{showFilters ? t('hideFilters') || 'Hide Filters' : t('showfilters') || 'Show Filters'}</span>
                </button>
              </div>

              <div className="hidden sm:block w-px h-7 bg-teal-100 mx-1" />

              {/* Mobile Search only */}
              <div className="flex-1 sm:hidden min-w-[200px] relative">
                <input
                  placeholder={t('searchProducts') || 'Search products...'}
                  value={productSearchTerms['global'] || ''}
                  onChange={e => setProductSearchTerms(prev => ({ ...prev, global: e.target.value }))}
                  className="teal-focus w-full h-9 rounded-lg border border-teal-100 bg-white px-3 pr-9 text-sm font-medium text-slate-700 focus:border-teal-500"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-teal-100 mx-1" />

              {/* Manual Additional Costs */}
              <label className="flex items-center gap-3 py-2 px-3 sm:px-4 bg-white hover:bg-teal-50 border border-teal-100 hover:border-teal-300 rounded-xl cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  checked={manualAdditionalCostsEnabled}
                  onChange={e => setManualAdditionalCostsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{t('manualAdditionalCosts')}</span>
                {manualAdditionalCostsEnabled && (
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualAdditionalCostsAmount}
                        onChange={e => setManualAdditionalCostsAmount(parseFloat(e.target.value) || 0)}
                        className="teal-focus w-20 h-8 rounded-lg border border-teal-100 bg-white text-right pr-8 pl-2 text-sm font-semibold text-slate-700 focus:border-teal-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400">DH</span>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Filters toggle (Mobile) */}
            <div className="sm:hidden pt-1">
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors"
              >
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showFilters ? t('hideFilters') || 'Hide Filters' : t('showfilters') || 'Show Filters'}
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 overflow-x-auto pb-1 no-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
                <ProductFilters filters={filters} onChange={handleFilterChange} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Items List ── */}
      <div className="p-4 sm:p-6 space-y-3">
        {items.map((item, index) => {
          const linkedProduct = item.productId ? products.find(p => p.id === item.productId) : null;
          const isLens = linkedProduct?.category?.includes('Lenses');
          const isOrderFab = linkedProduct && (linkedProduct.stock_status === 'Order' || linkedProduct.stock_status === 'Fabrication');
          const isOOS = linkedProduct?.stock_status === 'Out Of Stock';

          return (
            <div
              key={item.id}
              className={`item-card slide-in bg-white border rounded-2xl overflow-hidden ${isOOS ? 'border-red-200' : 'border-teal-200'}`}
            >
              {/* Card Header Bar */}
              <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isOOS ? 'bg-red-50 border-red-100' : 'bg-teal-50/30 border-teal-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs font-semibold text-slate-400">#{String(index + 1).padStart(2, '0')}</span>
                  {item.customName !== undefined && (
                    <span className="badge bg-blue-100 text-blue-700 border border-blue-200">Custom</span>
                  )}
                  {isOOS && (
                    <span className="badge bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                      <AlertCircle className="h-2.5 w-2.5" /> Out of Stock
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const dup = { ...item, id: `item-${Date.now()}`, linkedEye: item.linkedEye === 'RE' ? 'LE' : item.linkedEye === 'LE' ? 'RE' : undefined };
                      setItems(prev => [...prev, dup]);
                    }}
                    className="action-btn h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="action-btn h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4">

                {/* Product / Custom Name */}
                {item.customName !== undefined ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('customItemName')}</label>
                    <input
                      value={item.customName || ''}
                      onChange={e => updateItem(item.id, 'customName', e.target.value)}
                      className="teal-focus w-full h-10 rounded-xl border border-teal-200 px-3 text-sm font-medium text-slate-700 bg-white focus:border-teal-500"
                      placeholder={t('enterCustomItemName') || 'Enter item name…'}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('productName')}</label>
                    <div className="flex gap-2">
                      <Select value={item.productId} onValueChange={val => updateItem(item.id, 'productId', val)}>
                        <SelectTrigger className="teal-focus flex-1 h-10 rounded-xl border-teal-100 bg-white text-sm font-medium text-slate-700 min-w-0">
                          <SelectValue placeholder={t('selectProduct')} />
                        </SelectTrigger>
                        <SelectContent className="min-w-[320px] sm:min-w-[420px] rounded-xl shadow-xl bg-white border-teal-200">
                          {getFilteredProducts(productSearchTerms['global'] || '').map(product => {
                            const stockCls = STOCK_BADGE[product.stock_status] || 'bg-slate-100 text-slate-600';
                            return (
                              <SelectItem key={product.id} value={product.id} className="rounded-lg cursor-pointer py-2.5">
                                <div className="flex items-center justify-between w-full gap-3 min-w-0">
                                  <span className="truncate font-medium text-slate-800 flex-1">{product.name}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`badge ${stockCls}`}>
                                      {product.stock_status === 'inStock'
                                        ? `${t('stock')}: ${product.stock || 0}`
                                        : product.stock_status === 'Out Of Stock' ? t('outOfStock')
                                          : product.stock_status === 'Order' ? t('order')
                                            : product.stock_status === 'Fabrication' ? t('fabrication')
                                              : product.stock_status}
                                    </span>
                                    <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                      {product.price.toFixed(2)} DH
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Qty / Price / Cost / Total grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('quantity')}</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="teal-focus w-full h-10 rounded-xl border border-teal-200 px-3 text-sm font-semibold text-slate-700 bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('unitPrice')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="teal-focus w-full h-10 rounded-xl border border-teal-200 pr-9 pl-3 text-sm font-semibold text-slate-700 bg-white text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">DH</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('unitCost')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cost}
                        onChange={e => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                        className="teal-focus w-full h-10 rounded-xl border border-teal-200 pr-9 pl-3 text-sm font-medium text-slate-400 bg-white text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 pointer-events-none">DH</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('total')}</label>
                    <div className="h-10 rounded-xl bg-teal-600 px-3 flex items-center justify-end gap-1 shadow-sm shadow-teal-200">
                      <span className="text-sm font-extrabold text-white tracking-tight">{(item.price * item.quantity).toFixed(2)}</span>
                      <span className="text-xs font-bold text-teal-100">DH</span>
                    </div>
                  </div>
                </div>

                {/* Eye Link + Paid at Delivery */}
                {(isLens || isOrderFab) && (
                  <div className="pt-3 border-t border-teal-100 flex flex-wrap items-center gap-3">

                    {isLens && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{t('linkToEye')}:</span>
                        {(['LE', 'RE'] as const).map(eye => (
                          <button
                            key={eye}
                            type="button"
                            onClick={() => {
                              if (!linkedProduct) return;
                              const isUnlinking = item.linkedEye === eye;
                              const updated: any = { ...item, linkedEye: isUnlinking ? undefined : eye, appliedMarkup: 0, price: linkedProduct.price };
                              if (!isUnlinking) {
                                const { sph, cyl } = getEyeValues(eye);
                                if (sph !== null && cyl !== null) {
                                  const markup = calculateMarkup(sph, cyl);
                                  updated.appliedMarkup = markup;
                                  updated.price = linkedProduct.price * (1 + markup / 100);
                                }
                              }
                              setItems(prev => prev.map(i => i.id === item.id ? updated : i));
                            }}
                            className={`action-btn h-8 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${item.linkedEye === eye
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200'
                              : 'bg-white text-slate-500 border-teal-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                              }`}
                          >
                            👁 {eye}
                          </button>
                        ))}
                      </div>
                    )}

                    {isOrderFab && (
                      <label className="ml-auto flex items-center gap-2 py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={item.paid_at_delivery || false}
                          onChange={e => updateItem(item.id, 'paid_at_delivery', e.target.checked)}
                          className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-amber-700">{t('paidAtDelivery')}</span>
                      </label>
                    )}

                    {item.appliedMarkup > 0 && (
                      <div className="w-full flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {t('markupApplied')}: +{item.appliedMarkup}% {t('markup')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6 rounded-2xl border-2 border-dashed border-teal-200 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-teal-500" />
            </div>
            <p className="text-base font-bold text-slate-700">{t('noItemsInOrder')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('addFirstItem')}</p>
            <button
              onClick={() => addItem('product')}
              className="action-btn mt-5 flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-5 text-sm font-semibold shadow-sm shadow-teal-200"
            >
              <Plus className="h-4 w-4" /> {t('addProduct')}
            </button>
          </div>
        )}
      </div>

      {/* ── Out of Stock Dialog ── */}
      <AlertDialog open={showOutOfStockWarning} onOpenChange={setShowOutOfStockWarning}>
        <AlertDialogContent className="rounded-2xl border-teal-200 shadow-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 font-bold">{t('outOfStockWarning')}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {t('outOfStockDesc')}
              <ul className="mt-3 space-y-1.5">
                {outOfStockProducts.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {name}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-slate-400 text-xs">{t('canStillProceed')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-teal-200 text-slate-600 hover:bg-slate-50">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowOutOfStockWarning(false); onProceedWithOutOfStock?.(); }}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {t('continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── New Product Dialog ── */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <ProductForm
          initialValues={{}}
          onSubmit={handleProductSubmit}
          onCancel={() => setIsProductFormOpen(false)}
          disabled={isSubmitting}
        />
      </Dialog>

    </div>
    </div >
  );
};

export default OrderItems;