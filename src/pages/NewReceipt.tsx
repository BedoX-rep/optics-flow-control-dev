
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Trash } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Client {
  id: string;
  name: string;
}

interface ReceiptItem {
  id: string;
  productId?: string;
  customName?: string;
  quantity: number;
  price: number;
}

const NewReceipt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [rightEye, setRightEye] = useState({ sph: '', cyl: '', axe: '' });
  const [leftEye, setLeftEye] = useState({ sph: '', cyl: '', axe: '' });
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check subscription status first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single();

        if (!subscription || subscription.subscription_status !== 'Active') {
          toast({
            title: "Subscription Required",
            description: "You need an active subscription to access this feature.",
            variant: "destructive",
          });
          navigate('/subscriptions');
          return;
        }

        // Fetch products and clients
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });

        if (clientsError) throw clientsError;
        setClients(clientsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [navigate, toast]);

  const addItem = (type: 'product' | 'custom') => {
    if (type === 'product') {
      setItems([...items, { id: `item-${Date.now()}`, quantity: 1, price: 0 }]);
    } else {
      setItems([...items, { id: `custom-${Date.now()}`, customName: '', quantity: 1, price: 0 }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          return { 
            ...item, 
            [field]: value.toString(),  // Ensure productId is always a string
            price: product ? product.price : 0 
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * tax) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const handleSaveReceipt = async () => {
    if (!selectedClient) {
      toast({
        title: "Missing Information",
        description: "Please select a client before saving.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the receipt.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // First insert the receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          client_id: selectedClient,
          right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : null,
          right_eye_cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : null,
          right_eye_axe: rightEye.axe ? parseInt(rightEye.axe) : null,
          left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : null,
          left_eye_cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : null,
          left_eye_axe: leftEye.axe ? parseInt(leftEye.axe) : null,
          subtotal,
          tax: taxAmount,
          discount_amount: discountAmount,
          discount_percentage: discount,
          total,
          delivery_status: 'Undelivered',
          montage_status: 'UnOrdered'
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Then insert each receipt item
      const receiptItems = items.map(item => ({
        receipt_id: receipt.id,
        product_id: item.productId || null,
        custom_item_name: item.customName || null,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Receipt saved successfully.",
      });

      navigate('/receipts');
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast({
        title: "Error",
        description: "Failed to save receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageTitle title="New Receipt" subtitle="Create a new prescription receipt" />
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="client">Select Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Button className="w-full" onClick={() => navigate('/clients')}>Add New Client</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="prescription">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prescription">
            <Card>
              <CardHeader>
                <CardTitle>Prescription Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Right Eye</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="rightSph">SPH</Label>
                        <Input 
                          id="rightSph"
                          value={rightEye.sph}
                          onChange={(e) => setRightEye({ ...rightEye, sph: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rightCyl">CYL</Label>
                        <Input 
                          id="rightCyl"
                          value={rightEye.cyl}
                          onChange={(e) => setRightEye({ ...rightEye, cyl: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rightAxe">AXE</Label>
                        <Input 
                          id="rightAxe"
                          value={rightEye.axe}
                          onChange={(e) => setRightEye({ ...rightEye, axe: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Left Eye</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="leftSph">SPH</Label>
                        <Input 
                          id="leftSph"
                          value={leftEye.sph}
                          onChange={(e) => setLeftEye({ ...leftEye, sph: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="leftCyl">CYL</Label>
                        <Input 
                          id="leftCyl"
                          value={leftEye.cyl}
                          onChange={(e) => setLeftEye({ ...leftEye, cyl: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="leftAxe">AXE</Label>
                        <Input 
                          id="leftAxe"
                          value={leftEye.axe}
                          onChange={(e) => setLeftEye({ ...leftEye, axe: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="items">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Receipt Items</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => addItem('custom')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Item
                  </Button>
                  <Button onClick={() => addItem('product')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-end gap-4 p-4 border rounded-md">
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
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateItem(item.id, 'productId', value)}
                          >
                            <SelectTrigger id={`product-${item.id}`}>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {product.price.toFixed(2)} DH
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <Label>Total</Label>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                          {(item.price * item.quantity).toFixed(2)} DH
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                      <p>No items added yet. Click the buttons above to add items.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tax">Tax (%)</Label>
                      <Input
                        id="tax"
                        type="number"
                        min="0"
                        max="100"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-lg">Summary</h3>
                    
                    <div className="flex justify-between py-2 border-b">
                      <span>Subtotal:</span>
                      <span>{subtotal.toFixed(2)} DH</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b">
                      <span>Tax ({tax}%):</span>
                      <span>{taxAmount.toFixed(2)} DH</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b">
                      <span>Discount ({discount}%):</span>
                      <span>-{discountAmount.toFixed(2)} DH</span>
                    </div>
                    
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Total:</span>
                      <span>{total.toFixed(2)} DH</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/receipts')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-optics-600 hover:bg-optics-700" 
                    onClick={handleSaveReceipt}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Receipt"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NewReceipt;
