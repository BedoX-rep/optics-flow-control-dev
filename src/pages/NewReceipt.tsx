import React, { useState, useEffect, useRef } from 'react';
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
import { useLanguage } from '@/components/LanguageProvider';
import { useUserInformation } from '@/hooks/useUserInformation';
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
  stock?: number | null;
  stock_status?: string | null;
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
  paid_at_delivery?: boolean;
}

interface OrderItemsProps {
  items: ReceiptItem[];
  orderType: string;
  products: Product[];
  productSearchTerms: Record<string, string>;
  filters: Record<string, string>;
  setOrderType: (value: string) => void;
  setItems: (items: ReceiptItem[]) => void;
  updateItem: (id: string, field: string, value: string | number) => void;
  removeItem: (id: string) => void;
  setProductSearchTerms: (terms: Record<string, string>) => void;
  setFilters: (filters: Record<string, string>) => void;
  getFilteredProducts: (searchTerm: string) => Product[];
  getEyeValues: (eye: 'RE' | 'LE') => { sph: number | null; cyl: number | null };
  calculateMarkup: (sph: number | null, cyl: number | null) => number;
  checkOutOfStock: () => boolean;
  setCheckOutOfStock: (checkOutOfStock: () => boolean) => void;
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
  const { translate: t } = useLanguage();

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
    const [filters, setFilters] = useState<Record<string, string>>({
    category: "all_categories",
    index: "all_indexes", 
    treatment: "all_treatments",
    company: "all_companies",
    stock_status: "all_stock_statuses"
  });
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
  const [checkOutOfStock, setCheckOutOfStock] = useState<() => boolean>(() => () => false);
  const checkOutOfStockRef = useRef<() => boolean>(() => false);
  const [manualAdditionalCostsEnabled, setManualAdditionalCostsEnabled] = useState(false);
  const [manualAdditionalCostsAmount, setManualAdditionalCostsAmount] = useState(0);
  const [personalisation, setPersonalisation] = useState({
    auto_additional_costs: true,
    sv_lens_cost: 10.00,
    progressive_lens_cost: 20.00,
    frames_cost: 10.00
  });

  const steps = [
    { id: 'client', label: t('clientSelection'), icon: User },
    { id: 'order', label: t('orderDetails'), icon: Receipt },
    { id: 'finalize', label: t('finalize'), icon: CreditCard }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentTab);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    localStorage.setItem('autoMontage', JSON.stringify(autoMontage));
  }, [autoMontage]);

  const { data: productsData } = useQuery({
    queryKey: ['all-products', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: allProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // After fetching, check if stock is 0 and update stock status if necessary
      if (allProducts) {
        allProducts.forEach(async (product) => {
          if (product.stock === 0 && product.stock_status === 'inStock') {
            await supabase
              .from('products')
              .update({ stock_status: 'Out Of Stock' })
              .eq('id', product.id)
              .eq('user_id', user.id);
          }
        });
      }

      return allProducts || [];
    },
    enabled: !!user,
    staleTime: Infinity, // Never consider this data stale
    cacheTime: Infinity, // Keep in cache indefinitely
  });

  // Function to refresh products list
  const refreshProducts = async () => {
    if (user) {
      await queryClient.invalidateQueries(['all-products', user.id]);
    }
  };

  const { data: clientsData } = useQuery({
    queryKey: ['all-clients', user?.id],
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

  // Fetch user information including personalization settings with caching
  const { data: personalisationData } = useUserInformation();

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

    if (personalisationData) {
      setPersonalisation({
        auto_additional_costs: personalisationData.auto_additional_costs ?? true,
        sv_lens_cost: personalisationData.sv_lens_cost ?? 10.00,
        progressive_lens_cost: personalisationData.progressive_lens_cost ?? 20.00,
        frames_cost: personalisationData.frames_cost ?? 10.00
      });

      // Update markup settings when personalisation data is loaded
      setMarkupSettings({
        sph: [
          { 
            min: personalisationData.markup_sph_range_1_min ?? 0, 
            max: personalisationData.markup_sph_range_1_max ?? 4, 
            markup: personalisationData.markup_sph_range_1_markup ?? 0 
          },
          { 
            min: personalisationData.markup_sph_range_2_min ?? 4, 
            max: personalisationData.markup_sph_range_2_max ?? 8, 
            markup: personalisationData.markup_sph_range_2_markup ?? 15 
          },
          { 
            min: personalisationData.markup_sph_range_3_min ?? 8, 
            max: personalisationData.markup_sph_range_3_max === 999 ? Infinity : (personalisationData.markup_sph_range_3_max ?? Infinity), 
            markup: personalisationData.markup_sph_range_3_markup ?? 30 
          },
        ],
        cyl: [
          { 
            min: personalisationData.markup_cyl_range_1_min ?? 0, 
            max: personalisationData.markup_cyl_range_1_max ?? 2, 
            markup: personalisationData.markup_cyl_range_1_markup ?? 0 
          },
          { 
            min: personalisationData.markup_cyl_range_2_min ?? 2, 
            max: personalisationData.markup_cyl_range_2_max ?? 4, 
            markup: personalisationData.markup_cyl_range_2_markup ?? 15 
          },
          { 
            min: personalisationData.markup_cyl_range_3_min ?? 4, 
            max: personalisationData.markup_cyl_range_3_max === 999 ? Infinity : (personalisationData.markup_cyl_range_3_max ?? Infinity), 
            markup: personalisationData.markup_cyl_range_3_markup ?? 30 
          },
        ],
      });
    } else {
      // Use default values if no user information found
      setPersonalisation({
        auto_additional_costs: true,
        sv_lens_cost: 10.00,
        progressive_lens_cost: 20.00,
        frames_cost: 10.00
      });
    }
  }, [productsData, clientsData, personalisationData, user, navigate]);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const getFilteredProducts = (searchTerm: string) => {
    let filteredProducts = products || [];

    // Apply filter constraints
    if (filters.category && filters.category !== "all_categories") {
      filteredProducts = filteredProducts.filter(product => product.category === filters.category);
    }
    if (filters.index && filters.index !== "all_indexes") {
      filteredProducts = filteredProducts.filter(product => product.index === filters.index);
    }
    if (filters.treatment && filters.treatment !== "all_treatments") {
      filteredProducts = filteredProducts.filter(product => product.treatment === filters.treatment);
    }
    if (filters.company && filters.company !== "all_companies") {
      filteredProducts = filteredProducts.filter(product => product.company === filters.company);
    }
    if (filters.stock_status && filters.stock_status !== "all_stock_statuses") {
      filteredProducts = filteredProducts.filter(product => product.stock_status === filters.stock_status);
    }

    // Apply search term if provided
    if (!searchTerm.trim()) {
      return filteredProducts;
    }

    const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);

    return filteredProducts.filter(product => {
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

  // Use manual additional costs if enabled
  if (manualAdditionalCostsEnabled) {
    montageCosts = manualAdditionalCostsAmount;
  } else if (personalisation.auto_additional_costs && orderType !== 'Unspecified') {
    // Use automatic additional costs based on personalization settings
    if (orderType === 'Retoyage') {
      // For Retoyage, only count Frames category
      montageCosts = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product?.category === 'Frames' ? personalisation.frames_cost * item.quantity : 0);
      }, 0);
    } else if (orderType === 'Montage') {
      // For Montage, charge based on lens types using personalization settings
      montageCosts = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        if (product?.category === 'Single Vision Lenses') {
          return sum + (personalisation.sv_lens_cost * item.quantity);
        } else if (product?.category === 'Progressive Lenses') {
          return sum + (personalisation.progressive_lens_cost * item.quantity);
        }
        return sum;
      }, 0);
    }
    // For 'Sell' type, additional costs remain 0
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
          sph: clientData.right_eye_sph !== null && clientData.right_eye_sph !== undefined ? clientData.right_eye_sph.toString() : '',
          cyl: clientData.right_eye_cyl !== null && clientData.right_eye_cyl !== undefined ? clientData.right_eye_cyl.toString() : '',
          axe: clientData.right_eye_axe !== null && clientData.right_eye_axe !== undefined ? clientData.right_eye_axe.toString() : ''
        });
        setLeftEye({
          sph: clientData.left_eye_sph !== null && clientData.left_eye_sph !== undefined ? clientData.left_eye_sph.toString() : '',
          cyl: clientData.left_eye_cyl !== null && clientData.left_eye_cyl !== undefined ? clientData.left_eye_cyl.toString() : '',
          axe: clientData.left_eye_axe !== null && clientData.left_eye_axe !== undefined ? clientData.left_eye_axe.toString() : ''
        });
        setAdd(clientData.Add !== null && clientData.Add !== undefined ? clientData.Add.toString() : '');
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
          right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : 0,
          right_eye_cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : 0,
          right_eye_axe: rightEye.axe ? parseInt(rightEye.axe) : 0,
          left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : 0,
          left_eye_cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : 0,
          left_eye_axe: leftEye.axe ? parseInt(leftEye.axe) : 0,
          Add: add ? parseFloat(add) : 0,
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
      // Invalidate and refetch the clients query
      await queryClient.invalidateQueries(['all-clients', user.id]);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
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
            {t('selectClient')}
          </CardTitle>
          <CardDescription>{t('chooseExistingClient')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder={t('searchByNameOrPhone')}
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
              {t('newClient')}
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
            {t('prescriptionDetails')}
          </CardTitle>
          <CardDescription>{t('enterUpdatePrescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-lg font-medium mb-3 text-blue-900">{t('rightEye')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rightSph">{t('sph')}</Label>
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
                  <Label htmlFor="rightCyl">{t('cyl')}</Label>
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
                  <Label htmlFor="rightAxe">{t('axe')}</Label>
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
              <h3 className="text-lg font-medium mb-3 text-purple-900">{t('leftEye')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="leftSph">{t('sph')}</Label>
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
                  <Label htmlFor="leftCyl">{t('cyl')}</Label>
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
                  <Label htmlFor="leftAxe">{t('axe')}</Label>
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
              <Label htmlFor="add">{t('add')}</Label>
              <Input
                id="add"
                type="text"
                value={add}
                onChange={(e) => setAdd(e.target.value)}
                placeholder={t('enterAddValue')}
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
          products={products || []}
          productSearchTerms={productSearchTerms}
          filters={filters}
          setOrderType={setOrderType}
          setItems={setItems}
          updateItem={updateItem}
          removeItem={removeItem}
          setProductSearchTerms={setProductSearchTerms}
          setFilters={setFilters}
          getFilteredProducts={getFilteredProducts}
          getEyeValues={getEyeValues}
          calculateMarkup={calculateMarkup}
          checkOutOfStock={() => {
            if (!items.length) return false;
            for (const item of items) {
              if (!item.productId) continue;
              const product = products.find(p => p.id === item.productId);
              if (product && product.stock_status === 'Out Of Stock') {
                return true;
              }
            }
            return false;
          }}
          setCheckOutOfStock={(checkOutOfStock: () => boolean) => {
            checkOutOfStockRef.current = checkOutOfStock;
          }}
          manualAdditionalCostsEnabled={manualAdditionalCostsEnabled}
          setManualAdditionalCostsEnabled={setManualAdditionalCostsEnabled}
          manualAdditionalCostsAmount={manualAdditionalCostsAmount}
          setManualAdditionalCostsAmount={setManualAdditionalCostsAmount}
          refreshProducts={refreshProducts}
        />

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('paymentDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
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

  const renderFinalizeTab = () => {
    const outOfStockItems = items.filter(item => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        return product?.stock_status === 'Out Of Stock';
      }
      return false;
    });

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('receiptSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {orderType === 'Unspecified' && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>{t('orderTypeRequired')}:</strong> {t('orderTypeRequiredDesc')}
              </AlertDescription>
            </Alert>
          )}
          {outOfStockItems.length > 0 && (
            <Alert className="mb-6 border-red-200 bg-red-50">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {items.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('noItems')}</AlertTitle>
                <AlertDescription>{t('pleaseAddItems')}</AlertDescription>
              </Alert>
            )}
            {selectedClient ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">{t('clientInformation')}</h3>
                <p className="text-sm">{t('name')}: <span className="font-medium">{clients.find(c => c.id === selectedClient)?.name}</span></p>
                <p className="text-sm">{t('phone')}: <span className="font-medium">{clients.find(c => c.id === selectedClient)?.phone}</span></p>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('noClient')}</AlertTitle>
                <AlertDescription>{t('pleaseSelectClient')}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('prescription')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t('rightEye')}</p>
                  <p>{t('sph')}: {rightEye.sph || 'N/A'}</p>
                  <p>{t('cyl')}: {rightEye.cyl || 'N/A'}</p>
                  <p>{t('axe')}: {rightEye.axe || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('leftEye')}</p>
                  <p>{t('sph')}: {leftEye.sph || 'N/A'}</p>
                  <p>{t('cyl')}: {leftEye.cyl || 'N/A'}</p>
                  <p>{t('axe')}: {leftEye.axe || 'N/A'}</p>
                </div>
              </div>
              <p className="mt-2">{t('add')}: {add || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('orderSummary')}</h3>
              <p className="text-sm">{t('orderType')}: <span className="font-medium">{t(orderType.toLowerCase())}</span></p>
              <p className="text-sm">{t('totalItems')}: <span className="font-medium">{items.length}</span></p>
              <p className="text-sm">{t('subtotal')}: <span className="font-medium">{subtotal.toFixed(2)} {t('dh')}</span></p>
              <p className="text-sm">{t('total')}: <span className="font-medium text-primary">{total.toFixed(2)} {t('dh')}</span></p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('paymentStatus')}</h3>
              <p className="text-sm">{t('advancePayment')}: <span className="font-medium">{advancePayment.toFixed(2)} {t('dh')}</span></p>
              <p className="text-sm">{t('balanceDue')}: <span className="font-medium">{balance.toFixed(2)} {t('dh')}</span></p>
              <p className="text-sm">{t('status')}: <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {paymentStatus === 'Paid' ? t('paid') : 
                 paymentStatus === 'Partially Paid' ? t('partiallyPaid') : 
                 t('unpaid')}
              </span></p>
            </div>
          </div>
        </div>

        </CardContent>
      </Card>
    );
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: t('authenticationRequired'),
        description: t('mustBeLoggedIn'),
        variant: "destructive",
      });
      return;
    }

    if (!selectedClient) {
      toast({
        title: t('missingInformation'),
        description: t('selectClientBeforeSaving'),
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: t('missingItems'),
        description: t('addItemsBeforeSaving'),
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'Unspecified') {
      toast({
        title: t('orderTypeRequired'),
        description: t('selectOrderTypeBeforeSaving'),
        variant: "destructive",
      });
      setCurrentTab('order'); // Navigate back to order tab
      return;
    }

    await performSave();
  };

  const performSave = async () => {

    try {
      setIsLoading(true);

      // Calculate paid_at_delivery_cost
      const paidAtDeliveryCost = items.reduce((sum, item) => {
        if (item.paid_at_delivery) {
          return sum + ((item.cost || 0) * (item.quantity || 1));
        }
        return sum;
      }, 0);

      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          client_id: selectedClient,
          right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : 0,
          right_eye_cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : 0,
          right_eye_axe: rightEye.axe ? parseInt(rightEye.axe) : 0,
          left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : 0,
          left_eye_cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : 0,
          left_eye_axe: leftEye.axe ? parseInt(leftEye.axe) : 0,
          add: add ? parseFloat(add) : 0,
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
          paid_at_delivery_cost: paidAtDeliveryCost,
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
            right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : 0,
            right_eye_cyl: rightEye.cyl ? parseFloat(rightEye.cyl) : 0,
            right_eye_axe: rightEye.axe ? parseInt(rightEye.axe) : 0,
            left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : 0,
            left_eye_cyl: leftEye.cyl ? parseFloat(leftEye.cyl) : 0,
            left_eye_axe: leftEye.axe ? parseInt(leftEye.axe) : 0,
            Add: add ? parseFloat(add) : 0,
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
        paid_at_delivery: item.paid_at_delivery || false,
        is_deleted: false
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) throw itemsError;

      // Update stock for products with stock_status 'inStock'
      for (const item of items) {
        if (item.productId) {
          const product = products.find(p => p.id === item.productId);
          if (product && product.stock_status === 'inStock' && product.stock !== null) {
            const newStock = Math.max(0, (product.stock || 0) - (item.quantity || 1));
            const newStockStatus = newStock === 0 ? 'Out Of Stock' : 'inStock';

            const { error: stockError } = await supabase
              .from('products')
              .update({ 
                stock: newStock,
                stock_status: newStockStatus
              })
              .eq('id', item.productId)
              .eq('user_id', user.id);

            if (stockError) {
              console.error('Error updating stock:', stockError);
              // Don't throw error here to avoid breaking the receipt save
            }
          }
        }
      }

      queryClient.invalidateQueries(['receipts', user.id]);
      toast({
        title: t('success'),
        description: t('receiptSavedSuccessfully'),
      });
      navigate('/receipts');
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast({
        title: t('error'),
        description: t('failedToSaveReceipt'),
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
              handleSave();
            } else {
              // Check if currently on order tab and no items added
              if (currentTab === 'order' && items.length === 0) {
                toast({
                  title: t('itemsRequired'),
                  description: t('addItemsBeforeProceeding'),
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