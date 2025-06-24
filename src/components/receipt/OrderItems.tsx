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
import { Copy, Plus, Receipt, Trash, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
import ProductFilters from '@/components/ProductFilters';
import { useLanguage } from '@/components/LanguageProvider';

interface OrderItemsProps {
  items: any[];
  orderType: string;
  products: any[];
  productSearchTerms: Record<string, string>;
  filters: Record<string, string>;
  setOrderType: (value: string) => void;
  setItems: (items: any[]) => void;
  updateItem: (id: string, field: string, value: any) => void;
  removeItem: (id: string) => void;
  setProductSearchTerms: (terms: Record<string, string>) => void;
  setFilters: (filters: Record<string, string>) => void;
  getFilteredProducts: (searchTerm: string) => any[];
  getEyeValues: (eye: 'RE' | 'LE') => { sph: number | null; cyl: number | null };
  calculateMarkup: (sph: number | null, cyl: number | null) => number;
  checkOutOfStockWarning?: React.MutableRefObject<(() => boolean) | null>;
  onProceedWithOutOfStock?: () => void;
  manualAdditionalCostsEnabled: boolean;
  setManualAdditionalCostsEnabled: (enabled: boolean) => void;
  manualAdditionalCostsAmount: number;
  setManualAdditionalCostsAmount: (amount: number) => void;
}

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
  setManualAdditionalCostsAmount
}) => {
  const { t } = useLanguage();
  const [showOutOfStockWarning, setShowOutOfStockWarning] = useState(false);
  const [outOfStockProducts, setOutOfStockProducts] = useState<string[]>([]);

  const addItem = (type: 'product' | 'custom') => {
    if (type === 'product') {
      setItems([...items, { id: `item-${Date.now()}`, quantity: 1, price: 0, cost: 0 }]);
    } else {
      setItems([...items, { id: `custom-${Date.now()}`, customName: '', quantity: 1, price: 0, cost: 0 }]);
    }
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    if (filters.category && filters.category !== "all_categories" && product.category !== filters.category) {
      return false;
    }
    if (filters.index && filters.index !== "all_indexes" && product.index !== filters.index) {
      return false;
    }
    if (filters.treatment && filters.treatment !== "all_treatments" && product.treatment !== filters.treatment) {
      return false;
    }
    if (filters.company && filters.company !== "all_companies" && product.company !== filters.company) {
      return false;
    }
    if (filters.stock_status && filters.stock_status !== "all_stock_statuses" && product.stock_status !== filters.stock_status) {
      return false;
    }
    return true;
  });

  const checkAndShowOutOfStockWarning = () => {
    const outOfStockItems = items.filter(item => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        return product?.stock_status === 'Out Of Stock';
      }
      return false;
    });

    if (outOfStockItems.length > 0) {
      const outOfStockNames = outOfStockItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.name || 'Unknown Product';
      });
      setOutOfStockProducts(outOfStockNames);
      setShowOutOfStockWarning(true);
      return true;
    }
    return false;
  };

  // Expose the check function to parent component
  React.useEffect(() => {
    if (checkOutOfStockWarning) {
      checkOutOfStockWarning.current = checkAndShowOutOfStockWarning;
    }
  }, [items, products, checkOutOfStockWarning]);

  const outOfStockItems = items.filter(item => {
    if (item.productId) {
      const product = products.find(p => p.id === item.productId);
      return product?.stock_status === 'Out Of Stock';
    }
    return false;
  });

  return (
    <Card className="border-0 shadow-lg">
      {outOfStockItems.length > 0 && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>{t('outOfStockWarning')}:</strong> {t('outOfStockDesc')}
            <ul className="mt-1 list-disc list-inside">
              {outOfStockItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <li key={item.id} className="text-sm">
                    {product?.name || t('unknownProduct')}
                  </li>
                );
              })}
            </ul>
            {t('canStillProceed')}
          </AlertDescription>
        </Alert>
      )}
      <CardHeader className="bg-gray-50/80 border-b p-4">
        <div className="flex flex-wrap items-center gap-4 justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <Button onClick={() => addItem('product')} size="default" className="bg-black hover:bg-neutral-800">
              <Plus className="h-4 w-4 mr-2" /> {t('addProduct')}
            </Button>
            <Button onClick={() => addItem('custom')} variant="outline" size="default">
              <Plus className="h-4 w-4 mr-2" /> {t('addCustomItem')}
            </Button>

            {/* Manual Additional Costs Override */}
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-blue-900 whitespace-nowrap">
                  {t('manualAdditionalCosts')}:
                </Label>
                <input
                  type="checkbox"
                  checked={manualAdditionalCostsEnabled}
                  onChange={(e) => setManualAdditionalCostsEnabled(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </div>
              {manualAdditionalCostsEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualAdditionalCostsAmount}
                    onChange={(e) => setManualAdditionalCostsAmount(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-600">DH</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('orderType')}:</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className={`w-[140px] ${
                  orderType === 'Unspecified' 
                    ? 'bg-red-50 border-red-300 text-red-700' 
                    : 'bg-white border-gray-300'
                }`}>
                  <SelectValue placeholder={t('selectOrderType')}>
                    <div className="flex items-center gap-1">
                      {orderType === 'Unspecified' && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="truncate">{t(orderType.toLowerCase())}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unspecified">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      {t('unspecified')}
                    </div>
                  </SelectItem>
                  <SelectItem value="Montage">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {t('montage')}
                    </div>
                  </SelectItem>
                  <SelectItem value="Retoyage">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {t('retoyage')}
                    </div>
                  </SelectItem>
                  <SelectItem value="Sell">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {t('sell')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProductFilters filters={filters} onChange={handleFilterChange} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border border-gray-100 shadow-sm">
              <CardContent className="p-3">
                <div className="grid grid-cols-12 gap-4 items-start">
                  {item.customName !== undefined ? (
                    <div className="col-span-5">
                      <Label htmlFor={`custom-${item.id}`} className="text-xs">{t('customItemName')}</Label>
                      <Input
                        id={`custom-${item.id}`}
                        value={item.customName || ''}
                        onChange={(e) => updateItem(item.id, 'customName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <div className="col-span-5">
                      <Label htmlFor={`product-${item.id}`} className="text-xs">{t('productName')}</Label>
                      <div className="flex gap-2 mt-1">
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateItem(item.id, 'productId', value)}
                        >
                          <SelectTrigger id={`product-${item.id}`} className="flex-1">
                            <SelectValue placeholder={t('selectProduct')} />
                          </SelectTrigger>
                          <SelectContent className="min-w-[400px]">
                            {getFilteredProducts(productSearchTerms[item.id] || '').map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex justify-between items-center w-full gap-4">
                                  <span className="truncate flex-1">{product.name}</span>
                                  <div className="flex items-center gap-3">
                                    {product.stock_status === 'inStock' ? (
                                      <span className="text-xs text-green-600 whitespace-nowrap">
                                        {t('stock')}: {product.stock || 0}
                                      </span>
                                    ) : (
                                      <span className={`text-xs whitespace-nowrap ${
                                        product.stock_status === 'Out Of Stock' ? 'text-red-600' : 
                                        product.stock_status === 'Order' ? 'text-orange-600' : 
                                        'text-blue-600'
                                      }`}>
                                        {product.stock_status === 'inStock' ? t('inStock') : 
                                         product.stock_status === 'Out Of Stock' ? t('outOfStock') :
                                         product.stock_status === 'Order' ? t('order') :
                                         product.stock_status === 'Fabrication' ? t('fabrication') :
                                         product.stock_status}
                                      </span>
                                    )}
                                    <span className="text-sm text-blue-600 whitespace-nowrap">{product.price.toFixed(2)} DH</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder={t('searchProducts')}
                          value={productSearchTerms[item.id] || ''}
                          onChange={(e) => {
                            setProductSearchTerms(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }));
                          }}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}

                  <div className="col-span-1">
                    <Label className="text-xs">{t('quantity')}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">{t('unitPrice')}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">{t('unitCost')}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.cost}
                      onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-1">
                    <Label className="text-xs">{t('total')}</Label>
                    <div className="h-10 px-3 py-2 mt-1 rounded-md bg-gray-50 font-medium text-right">
                      {(item.price * item.quantity).toFixed(2)} {t('dh')}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-end gap-1 h-full pb-[5px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const duplicatedItem = {
                          ...item,
                          id: `item-${Date.now()}`,
                          linkedEye: item.linkedEye ? (item.linkedEye === 'RE' ? 'LE' : 'RE') : undefined
                        };
                        setItems(prevItems => [...prevItems, duplicatedItem]);
                      }}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="col-span-12 mt-2">
                    <div className="flex items-center justify-between">
                      {item.productId && products.find(p => p.id === item.productId)?.category?.includes('Lenses') && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={item.linkedEye === 'LE' ? 'default' : 'ghost'}
                              size="sm"
                              className={`h-8 ${item.linkedEye === 'LE' ? 'bg-black text-white' : ''}`}
                              onClick={() => {
                                const product = products.find(p => p.id === item.productId);
                                if (!product) return;

                                const isUnlinking = item.linkedEye === 'LE';
                                const updatedItem = {
                                  ...item,
                                  linkedEye: isUnlinking ? undefined : 'LE',
                                  appliedMarkup: 0,
                                  price: product.price
                                };

                                if (!isUnlinking) {
                                  const { sph, cyl } = getEyeValues('LE');
                                  if (sph !== null && cyl !== null) {
                                    const markup = calculateMarkup(sph, cyl);
                                    updatedItem.appliedMarkup = markup;
                                    updatedItem.price = product.price * (1 + markup / 100);
                                  }
                                }

                                setItems(prevItems => 
                                  prevItems.map(i => i.id === item.id ? updatedItem : i)
                                );
                              }}
                            >
                              👁️ LE
                            </Button>
                            <Button
                              type="button"
                              variant={item.linkedEye === 'RE' ? 'default' : 'ghost'}
                              size="sm"
                              className={`h-8 ${item.linkedEye === 'RE' ? 'bg-black text-white' : ''}`}
                              onClick={() => {
                                const product = products.find(p => p.id === item.productId);
                                if (!product) return;

                                const isUnlinking = item.linkedEye === 'RE';
                                const updatedItem = {
                                  ...item,
                                  linkedEye: isUnlinking ? undefined : 'RE',
                                  appliedMarkup: 0,
                                  price: product.price
                                };

                                if (!isUnlinking) {
                                  const { sph, cyl } = getEyeValues('RE');
                                  if (sph !== null && cyl !== null) {
                                    const markup = calculateMarkup(sph, cyl);
                                    updatedItem.appliedMarkup = markup;
                                    updatedItem.price = product.price * (1 + markup / 100);
                                  }
                                }

                                setItems(prevItems => 
                                  prevItems.map(i => i.id === item.id ? updatedItem : i)
                                );
                              }}
                            >
                              👁️ RE
                            </Button>
                          </div>
                          {item.appliedMarkup > 0 && (
                            <span className="text-sm text-muted-foreground">
                              (+{item.appliedMarkup}% {t('markup')})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Paid at Delivery checkbox for Order/Fabrication items */}
                      {item.productId && (() => {
                        const product = products.find(p => p.id === item.productId);
                        return product && (product.stock_status === 'Order' || product.stock_status === 'Fabrication');
                      })() && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`paid-delivery-${item.id}`}
                            checked={item.paid_at_delivery || false}
                            onChange={(e) => updateItem(item.id, 'paid_at_delivery', e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <Label htmlFor={`paid-delivery-${item.id}`} className="text-sm">
                            {t('paidAtDelivery')}
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>{t('noItemsInOrder')}</p>
              <p className="text-sm mt-1">{t('addFirstItem')}</p>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={showOutOfStockWarning} onOpenChange={setShowOutOfStockWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('outOfStockWarning')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('outOfStockDesc')}
              <ul className="mt-2 list-disc list-inside">
                {outOfStockProducts.map((productName, index) => (
                  <li key={index} className="text-red-600">{productName}</li>
                ))}
              </ul>
              {t('canStillProceed')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOutOfStockWarning(false)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowOutOfStockWarning(false);
                onProceedWithOutOfStock?.();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrderItems;