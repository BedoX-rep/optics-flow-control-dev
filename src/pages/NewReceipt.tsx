import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
import { Plus, Trash, ChevronDown, X, Copy, FileText, Settings } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import AddClientDialog from '@/components/AddClientDialog';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_ttc: number; // Changed from Cost to cost_ttc
  category: string;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  right_eye_sph?: number;
  right_eye_cyl?: number;
  right_eye_axe?: number;
  left_eye_sph?: number;
  left_eye_cyl?: number;
  Add?: number;
}

interface ReceiptItem {
  id: string;
  productId?: string;
  customName?: string;
  quantity: number;
  price: number;
  cost: number;
  linkedEye?: 'RE' | 'LE';
  appliedMarkup?: number;
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
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
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
  const [productSearchTerms, setProductSearchTerms] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [balance, setBalance] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [autoMontage, setAutoMontage] = useState(() => {
    const saved = localStorage.getItem('autoMontage');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isMarkupSettingsOpen, setIsMarkupSettingsOpen] = useState(false);
  const [markupSettings, setMarkupSettings] = useState({
    sph: [
      { min: 0, max: 4, markup: 0 },
      { min: 4, max: 8, markup: 15 },
      { min: 8, max: Infinity, markup: 30 },
    ],
    cyl: [
      { min: 0, max: 2, markup: 0 },
      { min: 2, max: 4, markup: 15 },
      { min: 4, max: Infinity, markup: 30 },
    ],
  });


  useEffect(() => {
    localStorage.setItem('autoMontage', JSON.stringify(autoMontage));
  }, [autoMontage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) {
          navigate('/auth');
          return;
        }

        const [productsResult, clientsResult] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false }),
          supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('name', { ascending: true })
        ]);

        if (productsResult.error) throw productsResult.error;
        if (clientsResult.error) throw clientsResult.error;

        // Map database products to match our interface
        const mappedProducts = (productsResult.data || []).map(product => ({
          ...product
        }));

        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
        setClients(clientsResult.data || []);
        setFilteredClients(clientsResult.data || []);

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
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

  const getFilteredProducts = (searchTerm: string) => {
    const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
    return products.filter(product => {
      const productName = product.name.toLowerCase();
      return searchWords.every(word => productName.includes(word));
    });
  };

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
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== id) return item;

        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (!product) return item;

          const updatedItem = {
            ...item,
            productId: value.toString(),
            price: product.price || 0,
            cost: product.cost_ttc || 0, // Use cost_ttc instead of Cost
            appliedMarkup: 0
          };

          // Handle montage costs when a lens product is selected
          if (autoMontage && (product.category === 'Single Vision Lenses' || product.category === 'Progressive Lenses')) {
            setTimeout(() => {
              setItems(prevItems => {
                let countSingleVision = prevItems.reduce((count, item) => {
                  const prod = products.find(p => p.id === item.productId);
                  return count + ((prod?.category === 'Single Vision Lenses' ? item.quantity : 0) || 0);
                }, 0);

                let countProgressive = prevItems.reduce((count, item) => {
                  const prod = products.find(p => p.id === item.productId);
                  return count + ((prod?.category === 'Progressive Lenses' ? item.quantity : 0) || 0);
                }, 0);

                const totalLensQuantity = countSingleVision + countProgressive;
                const wholePairs = Math.floor(totalLensQuantity / 2);
                const hasExtraLens = totalLensQuantity % 2 === 1;

                const montageItem = prevItems.find(i => i.customName === 'Montage costs');
                const baseCostSV = 20;
                const baseCostPG = 40;

                let totalMontageCost = 0;
                if (wholePairs > 0) {
                  totalMontageCost += wholePairs * (countProgressive > 0 ? baseCostPG : baseCostSV);
                }
                if (hasExtraLens) {
                  totalMontageCost += (countProgressive > 0 ? baseCostPG : baseCostSV) / 2;
                }

                if (totalLensQuantity > 0) {
                  if (montageItem) {
                    return prevItems.map(item =>
                      item.id === montageItem.id
                        ? { ...item, price: totalMontageCost, cost: totalMontageCost }
                        : item
                    );
                  } else {
                    return [...prevItems, {
                      id: `montage-${Date.now()}`,
                      customName: 'Montage costs',
                      quantity: 1,
                      price: totalMontageCost,
                      cost: totalMontageCost,
                    }];
                  }
                }
                return prevItems;
              });
            }, 0);
          }

          // Only calculate markup for lenses if eye is linked
          if ((product.category === 'Single Vision Lenses' || product.category === 'Progressive Lenses') && item.linkedEye) {
            const { sph, cyl } = getEyeValues(item.linkedEye);
            const markup = calculateMarkup(sph, cyl);
            if (markup > 0) {
              updatedItem.appliedMarkup = markup;
              updatedItem.price = product.price * (1 + markup / 100);
            }
          }

          return updatedItem;
        }

        return { ...item, [field]: value };
      });
    });
  };

  const getEyeValues = (eye: 'RE' | 'LE'): { sph: number | null; cyl: number | null } => {
    if (eye === 'RE') {
      return {
        sph: rightEye.sph ? parseFloat(rightEye.sph) : null,
        cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : null,
      };
    } else {
      return {
        sph: leftEye.sph ? parseFloat(leftEye.sph) : null,
        cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : null,
      };
    }
  };

  const calculateMarkup = (sph: number | null, cyl: number | null): number => {
    const sphMarkup = sph !== null ? getMarkup(sph, markupSettings.sph) : 0;
    const cylMarkup = cyl !== null ? getMarkup(cyl, markupSettings.cyl) : 0;
    return Math.max(sphMarkup, cylMarkup);
  };

  const getMarkup = (value: number, ranges: { min: number; max: number; markup: number }[]): number => {
    if (value === null || isNaN(value)) return 0;
    const absValue = Math.abs(value);
    for (const range of ranges) {
      if (absValue >= range.min && absValue < range.max) {
        return range.markup;
      }
    }
    return 0;
  };


  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  const totalCost = items.reduce((sum, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0);

  // Calculate percentage-based discount
  // Calculate tax first
  const taxAmount = tax > subtotal ? (tax - subtotal) * taxIndicator : 0;
  const afterTax = subtotal + taxAmount;

  // Calculate percentage discount
  const percentageDiscountAmount = (afterTax * discount) / 100;
  const afterPercentageDiscount = afterTax - percentageDiscountAmount;

  // Apply fixed discount
  const totalDiscount = percentageDiscountAmount + numericDiscount;

  // Calculate final total
  const total = afterPercentageDiscount - numericDiscount;

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

  // useEffect(() => { //Removed this useEffect as per the user request
  //   if (selectedClient) {
  //     updateClientPrescription();
  //   }
  // }, [rightEye, leftEye, add]);

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
          tax_base: tax > subtotal ? tax : subtotal,
          tax: taxAmount,
          cost: totalCost,
          cost_ttc: totalCost,
          profit: profit,
          discount_amount: totalDiscount,
          discount_percentage: discount,
          total,
          balance,
          advance_payment: advancePayment,
          payment_status: paymentStatus,
          delivery_status: 'Undelivered',
          montage_status: 'UnOrdered'
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Update client prescription after receipt is saved
      if (selectedClient) {
        const { error: prescriptionError } = await supabase
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

        if (prescriptionError) throw prescriptionError;
      }

      // Insert receipt items with current prices and totals
      const receiptItems = items.map(item => ({
        user_id: user.id,
        receipt_id: receipt.id,
        product_id: item.productId || null,
        custom_item_name: item.customName || null,
        quantity: item.quantity || 1,
        price: item.price || 0,
        cost: item.cost || 0,
        profit: ((item.price || 0) - (item.cost || 0)) * (item.quantity || 1),
        linked_eye: item.linkedEye || null,
        applied_markup: item.appliedMarkup || 0
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) {
        console.error('Error saving receipt items:', itemsError);
        throw itemsError;
      }

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
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="client-search"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex-1">
                <Select value={selectedClient} onValueChange={handleClientSelect}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex justify-between items-center w-full gap-4">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-sm text-green-600/75 tabular-nums">{client.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
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
          <CardContent className={`${prescriptionOpen ? '' : 'hidden'} p-3`}>
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
                      onChange={(e) => {
                        setRightEye({ ...rightEye, sph: e.target.value });
                        // Update items linked to right eye
                        setItems(prevItems => prevItems.map(item => {
                          if (item.linkedEye === 'RE' && item.productId) {
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const markup = calculateMarkup(
                                e.target.value ? parseFloat(e.target.value) : null,
                                rightEye.cyl ? parseFloat(rightEye.cyl) : null
                              );
                              return {
                                ...item,
                                appliedMarkup: markup,
                                price: product.price * (1 + markup / 100)
                              };
                            }
                          }
                          return item;
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rightCyl">CYL</Label>
                    <Input
                      id="rightCyl"
                      type="text"
                      inputMode="decimal"
                      value={rightEye.cyl}
                      onChange={(e) => {
                        setRightEye({ ...rightEye, cyl: e.target.value });
                        // Update items linked to right eye
                        setItems(prevItems => prevItems.map(item => {
                          if (item.linkedEye === 'RE' && item.productId) {
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const markup = calculateMarkup(
                                rightEye.sph ? parseFloat(rightEye.sph) : null,
                                e.target.value ? parseFloat(e.target.value) : null
                              );
                              return {
                                ...item,
                                appliedMarkup: markup,
                                price: product.price * (1 + markup / 100)
                              };
                            }
                          }
                          return item;
                        }));
                      }}
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
                      onChange={(e) => {
                        setLeftEye({ ...leftEye, sph: e.target.value });
                        // Update items linked to left eye
                        setItems(prevItems => prevItems.map(item => {
                          if (item.linkedEye === 'LE' && item.productId) {
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const markup = calculateMarkup(
                                e.target.value ? parseFloat(e.target.value) : null,
                                leftEye.cyl ? parseFloat(leftEye.cyl) : null
                              );
                              return {
                                ...item,
                                appliedMarkup: markup,
                                price: product.price * (1 + markup / 100)
                              };
                            }
                          }
                          return item;
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leftCyl">CYL</Label>
                    <Input
                      id="leftCyl"
                      value={leftEye.cyl}
                      onChange={(e) => {
                        setLeftEye({ ...leftEye, cyl: e.target.value });
                        // Update items linked to left eye
                        setItems(prevItems => prevItems.map(item => {
                          if (item.linkedEye === 'LE' && item.productId) {
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const markup = calculateMarkup(
                                leftEye.sph ? parseFloat(leftEye.sph) : null,
                                e.target.value ? parseFloat(e.target.value) : null
                              );
                              return {
                                ...item,
                                appliedMarkup: markup,
                                price: product.price * (1 + markup / 100)
                              };
                            }
                          }
                          return item;
                        }));
                      }}
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
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Button onClick={() => addItem('product')} size="default" className="bg-black hover:bg-neutral-800">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
                <Button onClick={() => addItem('custom')} variant="outline" size="default">
                  <Plus className="h-4 w-4 mr-2" /> Add Custom Item
                </Button>
              </div>
              <Button 
                onClick={() => setIsMarkupSettingsOpen(true)} 
                variant="ghost" 
                size="sm" 
                className="text-neutral-600 hover:text-neutral-900"
              >
                Markup Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center mb-4 bg-primary/5 p-3 rounded-lg">
                <Switch
                  id="autoMontage"
                  checked={autoMontage}
                  onCheckedChange={(checked) => setAutoMontage(checked)}
                />
                <Label htmlFor="autoMontage" className="ml-2 text-sm text-muted-foreground">
                  Auto-add Montage costs
                </Label>
              </div>

              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm mb-3 hover:border-primary/20 transition-colors">
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

                  <div className="flex gap-1">
                    {item.customName === 'Montage costs' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const duplicatedItem = {...item, id: `item-${Date.now()}`};
                            if (item.linkedEye) {
                              duplicatedItem.linkedEye = item.linkedEye === 'RE' ? 'LE' : 'RE';
                              if (duplicatedItem.productId) {
                                const product = products.find(p => p.id === duplicatedItem.productId);
                                if (product) {
                                  const { sph, cyl } = getEyeValues(duplicatedItem.linkedEye);
                                  const markup = calculateMarkup(sph, cyl);
                                  duplicatedItem.appliedMarkup = markup;
                                  duplicatedItem.price = product.price * (1 + markup / 100);
                                }
                              }
                            }
                            setItems([...items, duplicatedItem]);
                          }}
                          className="hover:bg-blue-100"
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
                      </>
                    )}
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
                            const updatedItem = { ...item, linkedEye: 'LE' };
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const { sph, cyl } = getEyeValues('LE');
                              const markup = calculateMarkup(sph, cyl);
                              updatedItem.appliedMarkup = markup;
                              updatedItem.price = product.price * (1 + markup / 100);
                            }
                            setItems(items.map(i => i.id === item.id ? updatedItem : i));
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
                            const updatedItem = { ...item, linkedEye: 'RE' };
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const { sph, cyl } = getEyeValues('RE');
                              const markup = calculateMarkup(sph, cyl);
                              updatedItem.appliedMarkup = markup;
                              updatedItem.price = product.price * (1 + markup / 100);
                            }
                            setItems(items.map(i => i.id === item.id ? updatedItem : i));
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
          <CardContent className="p-4">
            <div className="flex gap-8">
              <div className="flex-1 bg-gray-50/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-xl text-gray-900">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                  </div>

                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">{taxAmount.toFixed(2)} DH</span>
                    </div>
                  )}

                  {(discount > 0 || numericDiscount > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount ({discount}% + {numericDiscount} DH)</span>
                      <span className="font-medium text-red-600">-{totalDiscount.toFixed(2)} DH</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-semibold text-lg text-blue-900">{total.toFixed(2)} DH</span>
                    </div>
                  </div>

                  <div className="py-3 space-y-2 border-t border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost</span>
                      <span className="font-medium text-red-600">{totalCost.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Profit</span>
                      <span className="font-semibold text-green-600">{profit.toFixed(2)} DH</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2"><div className="flex justify-between text-sm">
                      <span className="text-gray-600">Advance Payment</span>
                      <span className="font-medium">{advancePayment.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Balance Due</span>
                      <span className="font-semibold text-lg">{balance.toFixed(2)} DH</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-4 border rounded-lg">
                <h3 className="font-semibold text-xl text-gray-900">Payment Options</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount">Percentage Discount</Label>
                      <div className="relative">
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={discount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDiscount(value === '' ? 0 : parseFloat(value));
                          }}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="numericDiscount">Fixed Discount</Label>
                      <div className="relative">
                        <Input
                          id="numericDiscount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={numericDiscount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNumericDiscount(value === '' ? 0 : parseFloat(value));
                          }}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500">DH</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tax">Tax Base Amount</Label>
                      <div className="relative">
                        <Input
                          id="tax"
                          type="number"
                          min="0"
                          value={tax}
                          onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500">DH</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="taxIndicator">Tax Rate</Label>
                      <div className="relative">
                        <Input
                          id="taxIndicator"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={taxIndicator}
                          onChange={(e) => setTaxIndicator(parseFloat(e.target.value) || 0)}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500">×</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label htmlFor="advancePayment">Advance Payment</Label>
                    <div className="relative">
                      <Input
                        id="advancePayment"
                        type="number"
                        min="0"
                        value={advancePayment}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setAdvancePayment(value);
                        }}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">DH</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                    }`}>
                      {paymentStatus}
                    </div>
                  </div>
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
      <MarkupSettingsDialog
        isOpen={isMarkupSettingsOpen}
        onClose={() => setIsMarkupSettingsOpen(false)}
        settings={markupSettings}
        onSave={setMarkupSettings}
      />
    </div>
  );
};

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MarkupSettingsDialog = ({ isOpen, onClose, settings, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onSave: (settings: any) => void;
}) => {
  const [localSettings, setLocalSettings] = useState({
    sph: settings.sph || [],
    cyl: settings.cyl || []
  });

  const updateRange = (type: 'sph' | 'cyl', index: number, field: string, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: prev[type].map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      )
    }));
  };

  const removeRange = (type: 'sph' | 'cyl', index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addRange = (type: 'sph' | 'cyl') => {
    const newRange = type === 'sph' ?
      { min: 0, max: 4, markup: 0 } :
      { min: 0, max: 2, markup: 0 };

    setLocalSettings(prev => ({
      ...prev,
      [type]: [...prev[type], newRange]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Markup Settings</DialogTitle>
        <div className="space-y-4">
          <h3>SPH Ranges</h3>
          {localSettings.sph.map((range, index) => (
            <div key={index} className="grid grid-cols-4 gap-2">
              <Input
                type="number"
                value={range.min}
                onChange={(e) => updateRange('sph', index, 'min', parseFloat(e.target.value))}
              />
              <Input
                type="number"
                value={range.max === Infinity ? 999 : range.max}
                onChange={(e) => updateRange('sph', index, 'max', parseFloat(e.target.value))}
              />
              <Input
                type="number"
                value={range.markup}
                onChange={(e) => updateRange('sph', index, 'markup', parseFloat(e.target.value))}
              />
              <Button
                onClick={() => removeRange('sph', index)}
                variant="ghost"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button onClick={() => addRange('sph')} variant="outline">Add SPH Range</Button>

          <h3>CYL Ranges</h3>
          {localSettings.cyl.map((range, index) => (
            <div key={index} className="grid grid-cols-4 gap-2">
              <Input
                type="number"
                value={range.min}
                onChange={(e) => updateRange('cyl', index, 'min', parseFloat(e.target.value))}
              />
              <Input
                type="number"
                value={range.max === Infinity ? 999 : range.max}
                onChange={(e) => updateRange('cyl', index, 'max', parseFloat(e.target.value))}
              />
              <Input
                type="number"
                value={range.markup}
                onChange={(e) => updateRange('cyl', index, 'markup', parseFloat(e.target.value))}
              />
              <Button
                onClick={() => removeRange('cyl', index)}
                variant="ghost"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button onClick={() => addRange('cyl')} variant="outline">Add CYL Range</Button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => {
            onSave(localSettings);
            onClose();
          }}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewReceipt;
