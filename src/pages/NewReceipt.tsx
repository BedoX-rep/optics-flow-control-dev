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
import { Plus, Trash, ChevronDown, X } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import AddClientDialog from '@/components/AddClientDialog';

interface Product {
  id: string;
  name: string;
  price: number;
  Cost: number;
  category: string;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
}

interface ReceiptItem {
  id: string;
  productId?: string;
  customName?: string;
  quantity: number;
  price: number;
  cost: number;
}

const NewReceipt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [rightEye, setRightEye] = useState({ sph: '', cyl: '', axe: '' });
  const [leftEye, setLeftEye] = useState({ sph: '', cyl: '', axe: '' });
  const [add, setAdd] = useState('');
  const [prescriptionOpen, setPrescriptionOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [numericDiscount, setNumericDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [taxIndicator, setTaxIndicator] = useState(0.4);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [balance, setBalance] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [autoMontage, setAutoMontage] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);
        setFilteredProducts(productsData || []);
        
        // Add default item if no items exist
        if (items.length === 0) {
          addItem('product');
        }

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (clientsError) throw clientsError;
        setClients(clientsData || []);
        setFilteredClients(clientsData || []);
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
  }, [navigate, toast, user]);

  useEffect(() => {
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearchTerm, products]);

  const addItem = (type: 'product' | 'custom') => {
    if (type === 'product') {
      setItems([...items, { id: `item-${Date.now()}`, quantity: 1, price: 0, cost: 0 }]);
    } else {
      setItems([...items, { id: `custom-${Date.now()}`, customName: '', quantity: 1, price: 0, cost: 0 }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items => {
      const updatedItems = items.map(item => {
        if (item.id === id) {
          if (field === 'productId') {
            const product = products.find(p => p.id === value);
            const selectedProduct = product ? {
              ...item,
              [field]: value.toString(),
              price: product.price,
              cost: product.Cost
            } : item;

            // Check if we need to add montage costs
            if (autoMontage && product && (
                product.category === 'Single Vision Lenses' ||
                product.category === 'Progressive Lenses' ||
                product.category === 'Sunglasses'
              )) {
              const hasMontage = items.some(i => i.customName === 'Montage costs');
              if (!hasMontage) {
                return [
                  ...updatedItems,
                  {
                    id: `montage-${Date.now()}`,
                    customName: 'Montage costs',
                    quantity: 1,
                    price: 0,
                    cost: 20
                  }
                ];
              }
            }
            return selectedProduct;
          }
          return { ...item, [field]: value };
        }
        return item;
      });

      return updatedItems;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

  // Calculate percentage-based discount
  const discountAmount = (subtotal * discount) / 100;

  // Calculate numeric discount (direct amount)
  const totalDiscount = discountAmount + numericDiscount;

  // Calculate purchasing amount (subtotal - discount)
  const purchasingAmount = subtotal - totalDiscount;

  // Calculate tax based on amount above purchasing amount
  const taxAmount = tax > purchasingAmount ? (tax - purchasingAmount) * taxIndicator : 0;

  // Calculate final total
  const total = purchasingAmount + taxAmount;

  // Calculate profit
  const profit = total - totalCost;

  const fetchClientPrescription = async (clientId: string) => {
    if (!user) return;

    try {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (clientData) {
        setRightEye({
            sph: clientData.right_eye_sph !== null ? clientData.right_eye_sph.toString() : '',
            cyl: clientData.right_eye_cyl !== null ? clientData.right_eye_cyl.toString() : '',
            axe: clientData.right_eye_axe !== null ? clientData.right_eye_axe.toString() : ''
          });
          setLeftEye({
            sph: clientData.left_eye_sph !== null ? clientData.left_eye_sph.toString() : '',
            cyl: clientData.left_eye_cyl !== null ? clientData.left_eye_cyl.toString() : '',
            axe: clientData.left_eye_axe !== null ? clientData.left_eye_axe.toString() : ''
          });
          setAdd(clientData.Add !== null ? clientData.Add.toString() : '');
      }
    } catch (error) {
      console.error('Error fetching client prescription:', error);
      toast({
        title: "Error",
        description: "Failed to load client prescription",
        variant: "destructive",
      });
    }
  };

  const updateClientPrescription = async () => {
    if (!selectedClient || !user) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : null,
          right_eye_cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : null,
          right_eye_axe: rightEye.axe ? parseInt(rightEye.axe) : null,
          left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : null,
          left_eye_cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : null,
          left_eye_axe: leftEye.axe ? parseInt(leftEye.axe) : null,
          Add: add ? parseFloat(add) : null,
          last_prescription_update: new Date().toISOString()
        })
        .eq('id', selectedClient);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating client prescription:', error);
      toast({
        title: "Error",
        description: "Failed to update client prescription",
        variant: "destructive",
      });
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    fetchClientPrescription(clientId);
  };

  useEffect(() => {
    if (selectedClient) {
      updateClientPrescription();
    }
  }, [rightEye, leftEye, add]);

  const updatePaymentStatus = (newBalance: number) => {
    if (newBalance <= 0) {
      setPaymentStatus('Paid');
    } else if (newBalance < total) {
      setPaymentStatus('Partially Paid');
    } else {
      setPaymentStatus('Unpaid');
    }
  };


  const handleSaveReceipt = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save receipts.",
        variant: "destructive",
      });
      return;
    }

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

      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          client_id: selectedClient,
          right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : null,
          right_eye_cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : null,
          right_eye_axe: rightEye.axe ? parseInt(rightEye.axe) : null,
          left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : null,
          left_eye_cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : null,
          left_eye_axe: leftEye.axe ? parseInt(leftEye.axe) : null,
          add: add ? parseFloat(add) : null,
          subtotal,
          tax: taxAmount,
          cost: totalCost,
          cost_ttc: totalCost,
          profit: profit,
          discount_amount: totalDiscount,
          discount_percentage: discount,
          total,
          balance,
          advance_payment: advancePayment, // Added advance_payment
          payment_status: paymentStatus, // Added payment_status
          delivery_status: 'Undelivered',
          montage_status: 'UnOrdered'
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      const receiptItems = items.map(item => ({
        user_id: user.id,
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

  useEffect(() => {
    const newBalance = total - advancePayment;
    setBalance(newBalance);
    updatePaymentStatus(newBalance);
  }, [total, advancePayment]);


  return (
    <div>
      <PageTitle title="New Receipt" subtitle="Create a new receipt for a client" />

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-2">
                <div>
                  <Input
                    id="client-search"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={selectedClient} onValueChange={handleClientSelect}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Button className="w-full" onClick={() => setIsAddClientOpen(true)}>Add New Client</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setPrescriptionOpen(!prescriptionOpen)}>
            <div className="flex justify-between items-center">
              <CardTitle>Prescription Details</CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${prescriptionOpen ? 'transform rotate-180' : ''}`} />
            </div>
          </CardHeader>
          <CardContent className={`${prescriptionOpen ? '' : 'hidden'}`}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Right Eye</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rightSph">SPH</Label>
                    <Input 
                      id="rightSph"
                      type="text"
                      inputMode="decimal"
                      value={rightEye.sph}
                      onChange={(e) => setRightEye({ ...rightEye, sph: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rightCyl">CYL</Label>
                    <Input 
                      id="rightCyl"
                      type="text"
                      inputMode="decimal"
                      value={rightEye.cyl}
                      onChange={(e) => setRightEye({ ...rightEye, cyl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rightAxe">AXE</Label>
                    <Input 
                      id="rightAxe"
                      type="text"
                      inputMode="numeric"
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
              <div className="mt-6">
                <Label htmlFor="add">ADD</Label>
                <Input
                  id="add"
                  value={add}
                  onChange={(e) => setAdd(e.target.value)}
                  placeholder="Enter ADD value"
                />
              </div>
            </div>
          </CardContent>
        </Card>
          <Card>
          <CardHeader>
            <CardTitle>Receipt Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoMontage"
                    checked={autoMontage}
                    onChange={(e) => setAutoMontage(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="autoMontage">Auto-add Montage costs</Label>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => addItem('product')} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Product
                  </Button>
                  <Button onClick={() => addItem('custom')} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Custom Item
                  </Button>
                </div>
              </div>

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
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                        <Select 
                          value={item.productId} 
                          onValueChange={(value) => updateItem(item.id, 'productId', value)}
                        >
                          <SelectTrigger id={`product-${item.id}`}>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.price.toFixed(2)} DH
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      {(item.price * item.quantity).toFixed(2)} DH
                    </div>
                  </div>

                  <div className="w-32">
                    <Label>Profit</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      {((item.price * item.quantity) - (item.cost * item.quantity)).toFixed(2)} DH
                    </div>
                  </div>

                  {item.customName === 'Montage costs' ? (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
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

        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setPaymentOpen(!paymentOpen)}>
            <div className="flex justify-between items-center">
              <CardTitle>Payment Details</CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${paymentOpen ? 'transform rotate-180' : ''}`} />
            </div>
          </CardHeader>
          <CardContent className={`${paymentOpen ? '' : 'hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tax">Tax Base Amount (DH)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    placeholder="Amount above which tax applies"
                  />
                </div>

                <div>
                  <Label htmlFor="taxIndicator">Tax Rate</Label>
                  <Input
                    id="taxIndicator"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={taxIndicator}
                    onChange={(e) => setTaxIndicator(parseFloat(e.target.value) || 0)}
                    placeholder="Tax rate (e.g. 0.4 for 40%)"
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
                  <Label htmlFor="numericDiscount">Discount Amount (DH)</Label>
                  <Input
                    id="numericDiscount"
                    type="number"
                    min="0"
                    value={numericDiscount}
                    onChange={(e) => setNumericDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="advancePayment">Advance Payment (DH)</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    min="0"
                    value={advancePayment}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setAdvancePayment(value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg">Summary</h3>

                <div className="flex justify-between py-2 border-b">
                  <span>Subtotal:</span>
                  <span>{subtotal.toFixed(2)} DH</span>
                </div>

                {(discount > 0 || numericDiscount > 0) && (
                  <div className="flex justify-between py-2 border-b">
                    <span>Discount ({discount}% + {numericDiscount} DH):</span>
                    <span>-{totalDiscount.toFixed(2)} DH</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>Tax:</span>
                    <span>{taxAmount.toFixed(2)} DH</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b text-lg font-semibold">
                  <span>Total:</span>
                  <span>{total.toFixed(2)} DH</span>
                </div>

                <div className="flex justify-between py-2 border-b text-red-500">
                  <span>Cost:</span>
                  <span>{totalCost.toFixed(2)} DH</span>
                </div>

                <div className="flex justify-between py-2 font-bold text-green-600">
                  <span>Profit:</span>
                  <span>{profit.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Advance Payment:</span>
                  <span>{advancePayment.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between py-2 border-b text-lg font-semibold">
                  <span>Balance:</span>
                  <span>{balance.toFixed(2)} DH</span>
                </div>
                
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/receipts')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveReceipt}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Receipt"}
          </Button>
        </div>
      </div>

      <AddClientDialog
          isOpen={isAddClientOpen}
          onClose={() => setIsAddClientOpen(false)}
          onClientAdded={async (client) => {
            if (!user) return;
            try {
              const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

              if (clientsError) throw clientsError;
              const updatedClients = clientsData || [];
              setClients(updatedClients);
              setSelectedClient(client.id);
              setSearchTerm(client.name);
              setIsAddClientOpen(false);
            } catch (error) {
              console.error('Error fetching clients:', error);
              toast({
                title: "Error",
                description: "Failed to refresh clients list",
                variant: "destructive",
              });
            }
          }}
        />
    </div>
  );
};

export default NewReceipt;