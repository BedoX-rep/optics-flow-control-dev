import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import PageTitle from "@/components/PageTitle";
import { SearchInput } from "@/components/SearchInput";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Plus, UserPlus, XCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import AddClientDialog from "@/components/AddClientDialog";
import { useAuth } from "@/components/AuthProvider";

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ReceiptItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

const formSchema = z.object({
  total: z.number(),
  advance_payment: z.number(),
  balance: z.number(),
  payment_status: z.string(),
})

export default function NewReceipt() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [balance, setBalance] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isClientSelected, setIsClientSelected] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total: 0,
      advance_payment: 0,
      balance: 0,
      payment_status: 'pending',
    },
  })

  // Fetch clients
  const fetchClients = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error: any) {
      toast.error('Error fetching clients: ' + error.message);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Error fetching products: ' + error.message);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, [user]);

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  // Update total, advance payment, and balance
  useEffect(() => {
    const newTotal = receiptItems.reduce((acc, item) => acc + item.total, 0);
    setTotal(newTotal);
    setBalance(newTotal - advancePayment - discountAmount);
    form.setValue('total', newTotal);
    form.setValue('balance', newTotal - advancePayment - discountAmount);
  }, [receiptItems, advancePayment, discountAmount, form]);

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsClientSelected(true);
  };

  // Handle adding a new client
  const handleAddClient = async (name: string, phone: string) => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('clients')
        .insert({ name, phone, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Update clients list and select the new client
      const newClient = { id: data.id, name: data.name, phone: data.phone };
      setClients([...clients, newClient]);
      setFilteredClients([...clients, newClient]);
      setSelectedClient(newClient);
      setIsClientSelected(true);
      toast.success('Client added successfully!');
      setIsClientDialogOpen(false);
    } catch (error: any) {
      toast.error('Error adding client: ' + error.message);
    }
  };

  const handleClientAdded = useCallback(async (client: any) => {
    try {
      if (!user) return;
  
      const { data, error } = await supabase
        .from('clients')
        .insert({ name: client.name, phone: client.phone, user_id: user.id })
        .select()
        .single();
  
      if (error) throw error;
  
      // Update clients list and select the new client
      const newClient = { id: data.id, name: data.name, phone: data.phone };
      setClients([...clients, newClient]);
      setFilteredClients([...clients, newClient]);
      setSelectedClient(newClient);
      setIsClientSelected(true);
      toast.success('Client added successfully!');
      setIsClientDialogOpen(false);
    } catch (error: any) {
      toast.error('Error adding client: ' + error.message);
    }
  }, [clients, user, supabase, setClients, setFilteredClients, setSelectedClient, setIsClientDialogOpen, toast]);

  // Handle adding a product to the receipt
  const handleAddProduct = (product: Product) => {
    // Check if the product is already in the receipt
    const existingItem = receiptItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // If the product exists, increase the quantity
      const updatedItems = receiptItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
      setReceiptItems(updatedItems);
    } else {
      // If the product doesn't exist, add it to the receipt
      const newItem: ReceiptItem = {
        id: crypto.randomUUID(),
        product_id: product.id,
        quantity: 1,
        price: product.price,
        total: product.price,
        product: product,
      };
      setReceiptItems([...receiptItems, newItem]);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 0) return;
    
    const updatedItems = receiptItems.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price }
        : item
    );
    setReceiptItems(updatedItems);
  };

  // Handle removing a product from the receipt
  const handleRemoveProduct = (id: string) => {
    const updatedItems = receiptItems.filter(item => item.id !== id);
    setReceiptItems(updatedItems);
  };

  // Handle advance payment change
  const handleAdvancePaymentChange = (value: number) => {
    setAdvancePayment(value);
    setBalance(total - value - discountAmount);
  };

  // Handle payment status change
  const handlePaymentStatusChange = (status: string) => {
    setPaymentStatus(status);
  };

  const handleDiscount = () => {
    setIsDiscountDialogOpen(true);
  };

  const applyDiscount = (amount: number) => {
    if (amount < 0) return;
    setDiscountAmount(amount);
    setBalance(total - advancePayment - amount);
    setIsDiscountDialogOpen(false);
  };

  const handleConfirmation = () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (receiptItems.length === 0) {
      toast.error('Please add products to the receipt');
      return;
    }
    setIsConfirmationDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!user) return;
      
      // Insert receipt
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          client_id: selectedClient?.id,
          total,
          advance_payment: advancePayment,
          balance,
          payment_status: paymentStatus,
          user_id: user.id,
          discount_amount: discountAmount,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;
      
      setReceiptId(receiptData.id);

      // Insert receipt items
      const receiptItemsToInsert = receiptItems.map(item => ({
        receipt_id: receiptData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const { error: receiptItemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItemsToInsert);

      if (receiptItemsError) throw receiptItemsError;

      setIsConfirmationDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error: any) {
      console.error("Error creating receipt:", error);
      setErrorMessage(error.message);
      setIsConfirmationDialogOpen(false);
      setIsErrorDialogOpen(true);
    }
  };

  const handleSuccess = () => {
    setIsSuccessDialogOpen(false);
    navigate('/receipts');
  };

  const handleError = () => {
    setIsErrorDialogOpen(false);
  };

  const handleReset = () => {
    setSelectedClient(null);
    setReceiptItems([]);
    setTotal(0);
    setAdvancePayment(0);
    setBalance(0);
    setPaymentStatus('pending');
    setSearchTerm('');
    setDiscountAmount(0);
    setIsClientSelected(false);
  };

  return (
    <div className="container px-4 sm:px-6 max-w-7xl mx-auto py-8 space-y-8">
      <PageTitle title="New Receipt" />

      {/* Client Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Select Client</h2>
          <Button size="sm" onClick={() => setIsClientDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search clients..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredClients.map(client => (
            <Button
              key={client.id}
              variant="outline"
              className="justify-start"
              onClick={() => handleClientSelect(client)}
            >
              {client.name} ({client.phone})
            </Button>
          ))}
        </div>
        {selectedClient && (
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500 h-5 w-5" />
            <p className="text-sm text-gray-500">
              Selected Client: {selectedClient.name} ({selectedClient.phone})
            </p>
          </div>
        )}
      </div>

      {/* Product Selection and Receipt Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Products</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <Button
              key={product.id}
              variant="secondary"
              onClick={() => handleAddProduct(product)}
            >
              {product.name} - ${product.price}
            </Button>
          ))}
        </div>

        {receiptItems.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableCaption>A list of products in the receipt.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>${item.price}</TableCell>
                    <TableCell className="text-right">${item.total}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(item.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Totals and Payment */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Totals and Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total">Total</Label>
            <Input id="total" value={`$${total}`} readOnly />
          </div>
          <div>
            <Label htmlFor="advance_payment">Advance Payment</Label>
            <Input
              id="advance_payment"
              type="number"
              value={advancePayment}
              onChange={(e) => handleAdvancePaymentChange(parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="discount">Discount</Label>
            <div className="flex items-center">
              <Input
                id="discount"
                type="number"
                value={discountAmount}
                readOnly
                className="mr-2"
              />
              <Button size="sm" onClick={handleDiscount}>
                Apply Discount
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="balance">Balance</Label>
            <Input id="balance" value={`$${balance}`} readOnly />
          </div>
          <div>
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit and Reset */}
      <div className="flex justify-between">
        <Button variant="destructive" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleConfirmation} disabled={!isClientSelected}>
          Create Receipt
        </Button>
      </div>

      {/* Add Client Dialog */}
      
<AddClientDialog 
  isOpen={isClientDialogOpen} 
  onClose={() => setIsClientDialogOpen(false)} 
  onAddClient={handleAddClient}
  onClientAdded={handleClientAdded} 
/>

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Enter the discount amount.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">
                Discount
              </Label>
              <Input
                id="discount"
                defaultValue={""}
                className="col-span-3"
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    applyDiscount(value);
                  }
                }}
              />
            </div>
          </div>
          {/*<DialogFooter>
            <Button type="submit">Apply Discount</Button>
          </DialogFooter>*/}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription>Are you sure you want to create this receipt?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsConfirmationDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>Receipt created successfully!</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSuccess}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>Failed to create receipt. {errorMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={handleError}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
