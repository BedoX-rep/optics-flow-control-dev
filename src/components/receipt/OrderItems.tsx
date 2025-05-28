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
import { Copy, Plus, Receipt, Trash } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductFilters from '@/components/ProductFilters';

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
  calculateMarkup
}) => {
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

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gray-50/80 border-b p-4">
        <div className="flex flex-wrap items-center gap-4 justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <Button onClick={() => addItem('product')} size="default" className="bg-black hover:bg-neutral-800">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
            <Button onClick={() => addItem('custom')} variant="outline" size="default">
              <Plus className="h-4 w-4 mr-2" /> Add Custom
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-500" />
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className={`w-[160px] ${
                orderType === 'Unspecified' 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                <SelectValue placeholder="Order Type">
                  {orderType === 'Unspecified' ? 'Please select an order type' : orderType}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unspecified" className="relative">
                  Unspecified
                  {orderType === 'Unspecified' && (
                    <span className="block text-xs text-red-600 mt-0.5">
                      Please select an order type
                    </span>
                  )}
                </SelectItem>
                <SelectItem value="Montage">Montage</SelectItem>
                <SelectItem value="Retoyage">Retoyage</SelectItem>
                <SelectItem value="Sell">Sell</SelectItem>
              </SelectContent>
            </Select>
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
                      <Label htmlFor={`custom-${item.id}`} className="text-xs">Custom Item</Label>
                      <Input
                        id={`custom-${item.id}`}
                        value={item.customName || ''}
                        onChange={(e) => updateItem(item.id, 'customName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <div className="col-span-5">
                      <Label htmlFor={`product-${item.id}`} className="text-xs">Product</Label>
                      <div className="flex gap-2 mt-1">
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateItem(item.id, 'productId', value)}
                        >
                          <SelectTrigger id={`product-${item.id}`} className="flex-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="min-w-[300px]">
                            {getFilteredProducts(productSearchTerms[item.id] || '').map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex justify-between items-center w-full gap-4">
                                  <span className="truncate flex-1">{product.name}</span>
                                  <span className="text-sm text-blue-600 whitespace-nowrap">{product.price.toFixed(2)} DH</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Search"
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
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Price (DH)</Label>
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
                    <Label className="text-xs">Cost (DH)</Label>
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
                    <Label className="text-xs">Total</Label>
                    <div className="h-10 px-3 py-2 mt-1 rounded-md bg-gray-50 font-medium text-right">
                      {(item.price * item.quantity).toFixed(2)} DH
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

                  {item.productId && products.find(p => p.id === item.productId)?.category?.includes('Lenses') && (
                    <div className="col-span-12 flex items-center gap-2 mt-2">
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
                          (+{item.appliedMarkup}% markup)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No items added yet. Click the buttons above to add items.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItems;