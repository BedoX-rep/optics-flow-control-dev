import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Plus, Trash, ChevronDown, X, Copy, FileText, Settings, ChevronRight, AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import AddClientDialog from '@/components/AddClientDialog';
import MarkupSettingsDialog from '@/components/MarkupSettingsDialog';

interface Product {
  id: string;
  name: string;
  price: number;
  cost_ttc: number;
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
  order_type?: 'Montage' | 'Retoyage' | 'Sell' | 'Unspecified';
}

const NewReceipt = () => {
  const queryClient = useQueryClient();
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
  const [orderType, setOrderType] = useState('Unspecified'); // Added order type state
  const [formData, setFormData] = useState({}); // Added formData state
  const [currentStep, setCurrentStep] = useState('details');
  const [clientSkipped, setClientSkipped] = useState(false);

  const steps = [
    { id: 'details', label: 'Client & Prescription' },
    { id: 'order', label: 'Items & Payment' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    localStorage.setItem('autoMontage', JSON.stringify(autoMontage));
  }, [autoMontage]);

  const { data: productsData } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (productsData) {
      setProducts(productsData);
      setFilteredProducts(productsData);
    }

    if (clientsData) {
      setClients(clientsData);
      setFilteredClients(clientsData);
    }
  }, [productsData, clientsData, user, navigate]);

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
            cost: product.cost_ttc || 0,
            appliedMarkup: 0
          };


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

  let montageCosts = 0;
  if (autoMontage && orderType !== 'Unspecified') {
    if (orderType === 'Retoyage') {
      // For Retoyage, only count Frames category and charge 10 DH per quantity
      montageCosts = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product?.category === 'Frames' ? 10 * item.quantity : 0);
      }, 0);
    } else if (orderType === 'Montage') {
      // For Montage, charge based on lens types
      montageCosts = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        if (product?.category === 'Single Vision Lenses') {
          return sum + (10 * item.quantity); // 10 DH per Single Vision lens
        } else if (product?.category === 'Progressive Lenses') {
          return sum + (20 * item.quantity); // 20 DH per Progressive lens
        }
        return sum;
      }, 0);
    }
    // For 'Sell' type, montage costs remain 0
  }

  // Calculate tax first
  const taxAmount = tax > subtotal ? (tax - subtotal) * taxIndicator : 0;
  const afterTax = subtotal + taxAmount;

  // Calculate percentage discount based on after-tax amount
  const percentageDiscountAmount = (afterTax * discount) / 100;

  // Calculate total discount (percentage + fixed)
  const totalDiscount = percentageDiscountAmount + numericDiscount;

  // Calculate final total
  const total = afterTax - totalDiscount;

  // Calculate profit
  const profit = total - totalCost - montageCosts;

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
          sph: clientData.right_eye_sph !== null ? clientData.right_eye_sph.toString() : '0',
          cyl: clientData.right_eye_cyl !== null ? clientData.right_eye_cyl.toString() : '0',
          axe: clientData.right_eye_axe !== null ? clientData.right_eye_axe.toString() : '0'
        });
        setLeftEye({
          sph: clientData.left_eye_sph !== null ? clientData.left_eye_sph.toString() : '0',
          cyl: clientData.left_eye_cyl !== null ? clientData.left_eye_cyl.toString() : '0',
          axe: clientData.left_eye_axe !== null ? clientData.left_eye_axe.toString() : '0'
        });
        setAdd(clientData.Add !== null ? clientData.Add.toString() : '0');
        setPrescriptionOpen(true);
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

  const updatePaymentStatus = (newBalance: number) => {
    if (newBalance <= 0) {
      setPaymentStatus('Paid');
    } else if (newBalance < total) {
      setPaymentStatus('Partially Paid');
    } else {
      setPaymentStatus('Unpaid');
    }
  };

  const handleClientAdded = async (client: Client) => {
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
      setFilteredClients(updatedClients);
      setSelectedClient(client.id);
      setSearchTerm(client.name);
      setIsAddClientOpen(false);
      setCurrentStep('prescription');

      await fetchClientPrescription(client.id);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to refresh clients list",
        variant: "destructive",
      });
    }
  };

  const renderStepIndicator = () => (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <Button
            key={step.id}
            variant={currentStep === step.id ? "default" : "ghost"}
            className={`relative ${currentStep === step.id ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setCurrentStep(step.id as any)}
            disabled={index > currentStepIndex + 1}
          >
            <span className="font-medium">{step.label}</span>
          </Button>
        ))}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );

  const renderClientStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Select Client</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12"
              />
            </div>
            <Button
              onClick={() => setIsAddClientOpen(true)}
              className="h-12 px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Client
            </Button>
          </div>

          <div className="grid gap-4 max-h-[400px] overflow-y-auto">
            {filteredClients.slice(0, 8).map(client => (
              <div
                key={client.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${selectedClient === client.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-gray-50 hover:border-primary/20'}`}
                onClick={() => handleClientSelect(client.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  </div>
                  {selectedClient === client.id && (
                    <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderPrescriptionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Prescription Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
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
    </motion.div>
  );

  const renderItemsStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button onClick={() => addItem('product')} size="default" className="bg-black hover:bg-neutral-800">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
              <Button onClick={() => addItem('custom')} variant="outline" size="default">
                <Plus className="h-4 w-4 mr-2" /> Add Custom Item
              </Button>
              <Select value={orderType} onValueChange={(value) => {
                setOrderType(value);
                // Reset montage costs when changing order type
                let newMontageCosts = 0;

                if (autoMontage && value !== 'Unspecified') {
                  if (value === 'Retoyage') {
                    // For Retoyage, only count Frames category
                    newMontageCosts = items.reduce((sum, item) => {
                      const product = products.find(p => p.id === item.productId);
                      return sum + (product?.category === 'Frames' ? 10 * item.quantity : 0);
                    }, 0);
                  } else if (value === 'Montage') {
                    // For Montage, calculate based on lens types
                    newMontageCosts = items.reduce((sum, item) => {
                      const product = products.find(p => p.id === item.productId);
                      if (product?.category === 'Single Vision Lenses') {
                        return sum + (10 * item.quantity);
                      } else if (product?.category === 'Progressive Lenses') {
                        return sum + (20 * item.quantity);
                      }
                      return sum;
                    }, 0);
                  }
                  // For 'Sell' type, montage costs remain 0
                }
                setFormData(prev => ({ ...prev, montage_costs: newMontageCosts }));
              }}>
                <SelectTrigger className="w-[180px] bg-amber-100 border-amber-300 hover:bg-amber-200 ring-2 ring-amber-500/20 shadow-lg shadow-amber-100/50 font-medium text-amber-900">
                  <SelectValue placeholder="Order Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unspecified">Unspecified</SelectItem>
                  <SelectItem value="Montage">Montage</SelectItem>
                  <SelectItem value="Retoyage">Retoyage</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setIsMarkupSettingsOpen(true)}
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-neutral-900"
            >
              <Settings className="h-4 w-4 mr-2" /> Markup Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">


            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-green-50/50 border border-gray-100 rounded-lg shadow-sm mb-3 hover:border-primary/20 transition-colors">
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
                      if (duplicatedItem.linkedEye && duplicatedItem.productId) {
                        const product = products.find(p => p.id === duplicatedItem.productId);
                        if (product) {
                          const { sph, cyl } = getEyeValues(duplicatedItem.linkedEye);
                          const markup = calculateMarkup(sph, cyl);
                          duplicatedItem.appliedMarkup = markup;
                          duplicatedItem.price = product.price * (1 + markup / 100);
                        }
                      }
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
                          if (item.linkedEye === 'LE') {
                            updatedItem.linkedEye = undefined;
                            updatedItem.appliedMarkup = 0;
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              updatedItem.price = product.price;
                            }
                          } else {
                            updatedItem.linkedEye = 'LE';
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const { sph, cyl } = getEyeValues('LE');
                              const markup = calculateMarkup(sph, cyl);
                              updatedItem.appliedMarkup = markup;
                              updatedItem.price = product.price * (1 + markup / 100);
                            }
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
                          const updatedItem = { ...item };
                          if (item.linkedEye === 'RE') {
                            updatedItem.linkedEye = undefined;
                            updatedItem.appliedMarkup = 0;
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              updatedItem.price = product.price;
                            }
                          } else {
                            updatedItem.linkedEye = 'RE';
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                              const { sph, cyl } = getEyeValues('RE');
                              const markup = calculateMarkup(sph, cyl);
                              updatedItem.appliedMarkup = markup;
                              updatedItem.price = product.price * (1 + markup / 100);
                            }
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
    </motion.div>
  );

  const renderPaymentStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
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

                <div className="py-3 space-y-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Products Cost</span>
                    <span className="font-medium">{totalCost.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Montage Costs</span>
                    <span className="font-medium">{montageCosts.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-800">Total Cost (TTC)</span>
                    <span className="text-red-600">{(totalCost + montageCosts).toFixed(2)} DH</span>
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
    </motion.div>
  );

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="w-full max-w-4xl mx-auto mb-4">
        <div className="flex justify-end mb-4">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const prevIndex = Math.max(0, currentStepIndex - 1);
                setCurrentStep(steps[prevIndex].id as any);
              }}
              className="mr-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}

          <Button
            size="lg"
            className="bg-black hover:bg-neutral-800 text-white px-8 py-6 text-lg font-medium shadow-lg transition-all hover:shadow-xl"
            onClick={() => {
              if (currentStepIndex === steps.length - 1) {
                handleSaveReceipt();
              } else {
                const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1);
                setCurrentStep(steps[nextIndex].id as any);
              }
            }}
          >
            {currentStepIndex === steps.length - 1 ? (
              'Save Receipt'
            ) : (
              <>
                Next Step
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {renderStepIndicator()}

      <AnimatePresence mode="wait">
        {currentStep === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            {renderClientStep()}
            {renderPrescriptionStep()}
          </motion.div>
        )}
        {currentStep === 'order' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            {renderItemsStep()}
            {renderPaymentStep()}
          </motion.div>
        )}
      </AnimatePresence>

      <AddClientDialog
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onClientAdded={handleClientAdded}
      />

      <MarkupSettingsDialog
        isOpen={isMarkupSettingsOpen}
        onClose={() => setIsMarkupSettingsOpen(false)}
        settings={markupSettings}
        onSave={setMarkupSettings}
        autoMontage={autoMontage}
        onAutoMontageChange={setAutoMontage}
      />
    </div>
  );
};

export default NewReceipt;