
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
import { Plus, Receipt, Trash, Copy, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Keep existing interfaces

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

  return (
    <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Receipt className="w-5 h-5" />
            Order Items
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => addItem('product')} size="sm" className="bg-primary/90 hover:bg-primary">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
            <Button onClick={() => addItem('custom')} variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
              <Plus className="h-4 w-4 mr-2" /> Custom Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className="w-full bg-amber-50/50 border-amber-200 h-12">
              <SelectValue placeholder="Select Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unspecified">Unspecified</SelectItem>
              <SelectItem value="Montage">Montage</SelectItem>
              <SelectItem value="Retoyage">Retoyage</SelectItem>
              <SelectItem value="Sell">Sell</SelectItem>
            </SelectContent>
          </Select>

          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                      {item.customName !== undefined ? (
                        <div className="flex-1 min-w-[200px]">
                          <Label htmlFor={`custom-${item.id}`} className="text-gray-600">Custom Item Name</Label>
                          <Input
                            id={`custom-${item.id}`}
                            value={item.customName || ''}
                            onChange={(e) => updateItem(item.id, 'customName', e.target.value)}
                            className="mt-1 h-10"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-[300px]">
                          <Label htmlFor={`product-${item.id}`} className="text-gray-600">Product</Label>
                          <div className="flex gap-2 mt-1">
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(item.id, 'productId', value)}
                            >
                              <SelectTrigger id={`product-${item.id}`} className="h-10">
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                              <SelectContent>
                                {getFilteredProducts(productSearchTerms[item.id] || '').map(product => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div className="flex justify-between items-center w-full gap-4">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-sm text-primary tabular-nums">{product.price.toFixed(2)} DH</span>
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
                              className="w-48 h-10"
                            />
                          </div>
                        </div>
                      )}

                      <div className="w-24">
                        <Label htmlFor={`quantity-${item.id}`} className="text-gray-600">Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="mt-1 h-10"
                        />
                      </div>

                      <div className="w-32">
                        <Label htmlFor={`price-${item.id}`} className="text-gray-600">Price (DH)</Label>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="mt-1 h-10"
                        />
                      </div>

                      <div className="w-32">
                        <Label className="text-gray-600">Total</Label>
                        <div className="h-10 px-3 mt-1 rounded-md bg-primary/5 font-medium flex items-center justify-end text-primary">
                          {(item.price * item.quantity).toFixed(2)} DH
                        </div>
                      </div>

                      <div className="w-32">
                        <Label className="text-gray-600">Profit</Label>
                        <div className="h-10 px-3 mt-1 rounded-md bg-green-50 text-green-700 font-medium flex items-center justify-end">
                          {((item.price * item.quantity) - (item.cost * item.quantity)).toFixed(2)} DH
                        </div>
                      </div>

                      <div className="flex gap-2">
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
                          className="h-10 w-10 rounded-full hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-10 w-10 rounded-full hover:bg-red-50 text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.productId && products.find(p => p.id === item.productId)?.category?.includes('Lenses') && (
                        <div className="flex items-center gap-3 ml-auto">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={item.linkedEye === 'LE' ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-10 w-10 rounded-full transition-all duration-200 ${
                                item.linkedEye === 'LE'
                                  ? 'bg-primary text-white shadow-lg'
                                  : 'hover:bg-primary/10'
                              }`}
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
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={item.linkedEye === 'RE' ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-10 w-10 rounded-full transition-all duration-200 ${
                                item.linkedEye === 'RE'
                                  ? 'bg-primary text-white shadow-lg'
                                  : 'hover:bg-primary/10'
                              }`}
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
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.appliedMarkup > 0 && (
                            <span className="text-sm text-primary/80 bg-primary/5 px-2 py-1 rounded-full">
                              +{item.appliedMarkup}% markup
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItems;
