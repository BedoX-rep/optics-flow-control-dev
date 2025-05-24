import React from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Plus, Receipt, Trash } from 'lucide-react';

interface OrderItemsProps {
  items: any[];
  orderType: string;
  products: any[];
  productSearchTerms: Record<string, string>;
  setOrderType: (value: string) => void;
  setItems: (items: any[]) => void;
  updateItem: (id: string, field: string, value: any) => void;
  removeItem: (id: string) => void;
  setProductSearchTerms: (terms: Record<string, string>) => void;
  getFilteredProducts: (searchTerm: string) => any[];
  getEyeValues: (eye: 'RE' | 'LE') => { sph: number | null; cyl: number | null };
  calculateMarkup: (sph: number, cyl: number) => number;
}

const OrderItems: React.FC<OrderItemsProps> = ({
  items,
  orderType,
  products,
  productSearchTerms,
  setOrderType,
  setItems,
  updateItem,
  removeItem,
  setProductSearchTerms,
  getFilteredProducts,
  getEyeValues
}) => {
  const addItem = (type: 'product' | 'custom') => {
    if (type === 'product') {
      setItems([...items, { id: `item-${Date.now()}`, quantity: 1, price: 0, cost: 0 }]);
    } else {
      setItems([...items, { id: `custom-${Date.now()}`, customName: '', quantity: 1, price: 0, cost: 0 }]);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Order Items
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => addItem('product')} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
            <Button onClick={() => addItem('custom')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Custom Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className="w-full bg-amber-50 border-amber-200">
              <SelectValue placeholder="Select Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unspecified">Unspecified</SelectItem>
              <SelectItem value="Montage">Montage</SelectItem>
              <SelectItem value="Retoyage">Retoyage</SelectItem>
              <SelectItem value="Sell">Sell</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-gray-100 rounded-lg shadow-sm mb-3 hover:border-primary/20 transition-colors">
                    {item.customName !== undefined ? (
                      <div className="flex-1">
                        <Label htmlFor={`custom-${item.id}`}>Custom Item Name</Label>
                        <Input
                          id={`custom-${item.id}`}
                          value={item.customName || ''}
                          onChange={(e) => updateItem(item.id, 'customName', e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <Label htmlFor={`product-${item.id}`}>Product</Label>
                        <div className="flex gap-2">
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(item.id, 'productId', value)}
                          >
                            <SelectTrigger id={`product-${item.id}`}>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilteredProducts(productSearchTerms[item.id] || '').map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex justify-between items-center w-full gap-4">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-sm text-blue-900 tabular-nums">{product.price.toFixed(2)} DH</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="text"
                            placeholder="Search products..."
                            value={productSearchTerms[item.id] || ''}
                            onChange={(e) => {
                              setProductSearchTerms(prev => ({
                                ...prev,
                                [item.id]: e.target.value
                              }));
                            }}
                            className="w-48"
                          />
                        </div>
                      </div>
                    )}

                    <div className="w-20">
                      <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="w-32">
                      <Label htmlFor={`price-${item.id}`}>Price (DH)</Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="w-32">
                      <Label htmlFor={`cost-${item.id}`}>Cost (DH)</Label>
                      <Input
                        id={`cost-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cost}
                        onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="w-32">
                      <Label>Total</Label>
                      <div className="h-10 px-3 py-2 rounded-md bg-gray-100/80 font-medium flex items-center justify-end text-sm">
                        {(item.price * item.quantity).toFixed(2)} DH
                      </div>
                    </div>

                    <div className="w-32">
                      <Label>Profit</Label>
                      <div className="h-10 px-3 py-2 rounded-md bg-green-100/80 text-green-800 font-medium flex items-center justify-end text-sm">
                        {((item.price * item.quantity) - (item.cost * item.quantity)).toFixed(2)} DH
                      </div>
                    </div>

                    <div className="flex gap-1">
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
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    {item.productId && products.find(p => p.id === item.productId)?.category?.includes('Lenses') && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-2 items-center">
                          <Button
                            type="button"
                            variant={item.linkedEye === 'LE' ? 'default' : 'ghost'}
                            size="icon"
                            className={`h-8 w-8 rounded-full ${item.linkedEye === 'LE' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                            onClick={() => {
                            const updatedItem = { ...item };
                            const product = products.find(p => p.id === item.productId);
                            
                            if (item.linkedEye === 'LE') {
                              updatedItem.linkedEye = undefined;
                              updatedItem.appliedMarkup = 0;
                              if (product) {
                                updatedItem.price = product.price;
                              }
                            } else {
                              updatedItem.linkedEye = 'LE';
                              if (product) {
                                const { sph, cyl } = getEyeValues('LE');
                                const markup = sph !== null && cyl !== null ? calculateMarkup(Math.abs(sph), Math.abs(cyl)) : 0;
                                updatedItem.appliedMarkup = markup;
                                updatedItem.price = product.price * (1 + markup / 100);
                              }
                            }
                            setItems(prevItems => prevItems.map(i => i.id === item.id ? updatedItem : i));
                          }}
                          >
                            👁️
                          </Button>
                          <Button
                            type="button"
                            variant={item.linkedEye === 'RE' ? 'default' : 'ghost'}
                            size="icon"
                            className={`h-8 w-8 rounded-full ${item.linkedEye === 'RE' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
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
                                  const markup = calculateMarkup(Math.abs(sph), Math.abs(cyl));
                                  updatedItem.appliedMarkup = markup;
                                  updatedItem.price = product.price * (1 + markup / 100);
                                }
                              }

                              setItems(prevItems => 
                                prevItems.map(i => i.id === item.id ? updatedItem : i)
                              );
                            }}
                          >
                            👁️
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItems;