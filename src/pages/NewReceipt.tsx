import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Plus, Trash, ChevronDown, X, Copy, FileText, Settings, ChevronRight, AlertCircle, ArrowLeft, ArrowRight, Check, User, Phone, Eye, Receipt, CreditCard } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import AddClientDialog from '@/components/AddClientDialog';
import MarkupSettingsDialog from '@/components/MarkupSettingsDialog';
import OrderItems from '@/components/receipt/OrderItems';
import OrderSummary from '@/components/receipt/OrderSummary';
import PaymentOptions from '@/components/receipt/PaymentOptions';

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

interface OrderItemsProps {
  items: ReceiptItem[];
  orderType: string;
  products: Product[];
  productSearchTerms: Record<string, string>;
  setOrderType: (value: string) => void;
  setItems: (items: ReceiptItem[]) => void;
  updateItem: (id: string, field: string, value: string | number) => void;
  removeItem: (id: string) => void;
  setProductSearchTerms: (terms: Record<string, string>) => void;
  getFilteredProducts: (searchTerm: string) => Product[];
  getEyeValues: (eye: 'RE' | 'LE') => { sph: number | null; cyl: number | null };
  calculateMarkup: (sph: number | null, cyl: number | null) => number;
}

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  taxAmount: number;
  discount: number;
  numericDiscount: number;
  totalDiscount: number;
  total: number;
  totalCost: number;
  montageCosts: number;
  profit: number;
  advancePayment: number;
  balance: number;
}

interface PaymentOptionsProps {
  discount: number;
  numericDiscount: number;
  tax: number;
  taxIndicator: number;
  advancePayment: number;
  total: number;
  paymentStatus: string;
  setDiscount: (discount: number) => void;
  setNumericDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setTaxIndicator: (indicator: number) => void;
  setAdvancePayment: (payment: number) => void;
  setBalance: (balance: number) => void;
  updatePaymentStatus: (balance: number) => void;
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
  const [currentTab, setCurrentTab] = useState('client');

  const steps = [
    { id: 'client', label: 'Client Selection', icon: User },
    { id: 'order', label: 'Order Details', icon: Receipt },
    { id: 'finalize', label: 'Finalize', icon: CreditCard }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentTab);
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
    const eyeData = eye === 'RE' ? rightEye : leftEye;
    const parseValue = (value: string): number | null => {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : null;
    };

    return {
      sph: parseValue(eyeData.sph),
      cyl: parseValue(eyeData.cyl)
    };
  };

  const calculateMarkup = (sph: number | null, cyl: number | null): number => {
    if (sph === null && cyl === null) return 0;

    const sphMarkup = sph !== null ? getMarkup(Math.abs(sph), markupSettings.sph) : 0;
    const cylMarkup = cyl !== null ? getMarkup(Math.abs(cyl), markupSettings.cyl) : 0;

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
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentTab === step.id;
          const isCompleted = index < currentStepIndex;
          
          // Add validation checks
          const hasError = (step.id === 'client' && !selectedClient) || 
                          (step.id === 'order' && items.length === 0);
          const showError = hasError && index < currentStepIndex;

          return (
            <div key={step.id} className="flex-1 relative">
              <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'after:content-[""] after:absolute after:w-full after:h-[2px] after:bg-gray-200 after:top-5 after:left-1/2 after:-z-10' : ''}`}>
                <div className="relative">
                  <button
                    onClick={() => {
                      if (currentStepIndex === 1 && step.id === 'finalize') {
                        updateClientPrescription();
                      }
                      setCurrentTab(step.id);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isActive ? 'bg-primary text-white scale-110' :
                      showError ? 'bg-red-500 text-white hover:bg-red-600' :
                      isCompleted ? 'bg-green-500 text-white hover:bg-green-600' :
                      'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {showError ? <AlertCircle className="w-5 h-5" /> :
                     isCompleted ? <Check className="w-5 h-5" /> : 
                     <StepIcon className="w-5 h-5" />}
                  </button>
                  {showError && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${isActive ? 'text-primary' : showError ? 'text-red-500' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );

  const renderClientTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Client
          </CardTitle>
          <CardDescription>Choose an existing client or create a new one</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-3 mb-6">
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

      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Prescription Details
          </CardTitle>
          <CardDescription>Enter or update client's prescription</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-lg font-medium mb-3 text-blue-900">Right Eye</h3>
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
                    className="bg-white"
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
                    className="bg-white"
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
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
              <h3 className="text-lg font-medium mb-3 text-purple-900">Left Eye</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="leftSph">SPH</Label>
                  <Input
                    id="leftSph"
                    type="text"
                    inputMode="decimal"
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
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="leftCyl">CYL</Label>
                  <Input
                    id="leftCyl"
                    type="text"
                    inputMode="decimal"
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
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="leftAxe">AXE</Label>
                  <Input
                    id="leftAxe"
                    type="text"
                    inputMode="numeric"
                    value={leftEye.axe}
                    onChange={(e) => setLeftEye({ ...leftEye, axe: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
              <Label htmlFor="add">ADD</Label>
              <Input
                id="add"
                type="text"
                value={add}
                onChange={(e) => setAdd(e.target.value)}
                placeholder="Enter ADD value"
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrderTab = () => {
    return (
      <div className="space-y-6">
        <OrderItems
          items={items}
          orderType={orderType}
          products={products}
          productSearchTerms={productSearchTerms}
          setOrderType={setOrderType}
          setItems={setItems}
          updateItem={updateItem}
          removeItem={removeItem}
          setProductSearchTerms={setProductSearchTerms}
          getFilteredProducts={getFilteredProducts}
          getEyeValues={getEyeValues}
          calculateMarkup={calculateMarkup}
        />

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-8">
              <OrderSummary
                subtotal={subtotal}
                tax={tax}
                taxAmount={taxAmount}
                discount={discount}
                numericDiscount={numericDiscount}
                totalDiscount={totalDiscount}
                total={total}
                totalCost={totalCost}
                montageCosts={montageCosts}
                profit={profit}
                advancePayment={advancePayment}
                balance={balance}
              />
              <PaymentOptions
                discount={discount}
                numericDiscount={numericDiscount}
                tax={tax}
                taxIndicator={taxIndicator}
                advancePayment={advancePayment}
                total={total}
                paymentStatus={paymentStatus}
                setDiscount={setDiscount}
                setNumericDiscount={setNumericDiscount}
                setTax={setTax}
                setTaxIndicator={setTaxIndicator}
                setAdvancePayment={setAdvancePayment}
                setBalance={setBalance}
                updatePaymentStatus={updatePaymentStatus}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFinalizeTab = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Receipt Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {items.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Items Added</AlertTitle>
                <AlertDescription>Please add at least one item to the receipt.</AlertDescription>
              </Alert>
            )}
            {selectedClient ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Client Information</h3>
                <p className="text-sm">Name: <span className="font-medium">{clients.find(c => c.id === selectedClient)?.name}</span></p>
                <p className="text-sm">Phone: <span className="font-medium">{clients.find(c => c.id === selectedClient)?.phone}</span></p>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Client Selected</AlertTitle>
                <AlertDescription>Please select a client to continue.</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Prescription</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Right Eye</p>
                  <p>SPH: {rightEye.sph || 'N/A'}</p>
                  <p>CYL: {rightEye.cyl || 'N/A'}</p>                  <p>AXE: {rightEye.axe || 'N/A'}</p>
</div>
                <div>
                  <p className="text-gray-500">Left Eye</p>
                  <p>SPH: {leftEye.sph || 'N/A'}</p>
                  <p>CYL: {leftEye.cyl || 'N/A'}</p>
                  <p>AXE: {leftEye.axe || 'N/A'}</p>
                </div>
              </div>
              <p className="mt-2">ADD: {add || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <p className="text-sm">Order Type: <span className="font-medium">{orderType}</span></p>
              <p className="text-sm">Total Items: <span className="font-medium">{items.length}</span></p>
              <p className="text-sm">Subtotal: <span className="font-medium">{subtotal.toFixed(2)} DH</span></p>
              <p className="text-sm">Total: <span className="font-medium text-primary">{total.toFixed(2)} DH</span></p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Payment Status</h3>
              <p className="text-sm">Advance Payment: <span className="font-medium">{advancePayment.toFixed(2)} DH</span></p>
              <p className="text-sm">Balance Due: <span className="font-medium">{balance.toFixed(2)} DH</span></p>
              <p className="text-sm">Status: <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{paymentStatus}</span></p>
            </div>
          </div>
        </div>
        {!selectedClient && (
          <CardContent className="p-6">
            <div className="flex gap-3 mb-6">
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
        )}
      </CardContent>
    </Card>
  );

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
          tax_base: tax > subtotal + montageCosts ? tax : subtotal + montageCosts,
          tax: taxAmount,
          cost: totalCost + montageCosts,
          cost_ttc: totalCost + montageCosts,
          profit: profit,
          total_discount: totalDiscount,
          discount_amount: numericDiscount,
          discount_percentage: discount,
          total,
          balance: total - advancePayment,
          advance_payment: advancePayment,
          payment_status: paymentStatus,
          delivery_status: 'Undelivered',
          montage_status: 'UnOrdered',
          montage_costs: montageCosts,
          products_cost: totalCost,
          order_type: orderType,
          call_status: 'Not Called',
          created_at: new Date().toISOString(),
          is_deleted: false
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

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
        applied_markup: item.appliedMarkup || 0,
        is_deleted: false
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) throw itemsError;

      queryClient.invalidateQueries(['receipts', user.id]);
      toast({
        title: "Success",
        description: "Receipt saved successfully",
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
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {renderStepIndicator()}

      <div className="fixed top-1/2 left-[calc(var(--sidebar-width,_256px)_+_2rem)] right-8 -translate-y-1/2 flex justify-between items-center pointer-events-none z-50">
        <Button
          variant="outline"
          onClick={() => {
            const prevIndex = Math.max(0, currentStepIndex - 1);
            setCurrentTab(steps[prevIndex].id);
          }}
          disabled={currentStepIndex === 0}
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all pointer-events-auto"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <Button
          className="bg-primary rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all pointer-events-auto"
          onClick={() => {
            if (currentStepIndex === steps.length - 1) {
              handleSaveReceipt();
            } else {
              const currentStep = steps[currentStepIndex];
              if (currentStep.id === 'client' && !selectedClient) {
                toast({
                  title: "Client Required",
                  description: "Please select a client before proceeding.",
                  variant: "destructive",
                });
                return;
              }
              if (currentStep.id === 'order' && items.length === 0) {
                toast({
                  title: "Items Required",
                  description: "Please add at least one item before proceeding.",
                  variant: "destructive",
                });
                return;
              }
              const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1);
              setCurrentTab(steps[nextIndex].id);
            }
          }}
        >
          {currentStepIndex === steps.length - 1 ? (
            <Check className="h-6 w-6" />
          ) : (
            <ArrowRight className="h-6 w-6" />
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {currentTab === 'client' && renderClientTab()}
          {currentTab === 'order' && renderOrderTab()}
          {currentTab === 'finalize' && renderFinalizeTab()}
        </motion.div>
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