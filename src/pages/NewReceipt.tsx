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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface Product {
  id: string;
  name: string;
  price: number;
  cost_ttc: number;
  category: string;
  index?: string;
  treatment?: string;
  company?: string;
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
  setItems: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;
  updateItem: (id: string, field: string, value: string | number) => void;
  removeItem: (id: string) => void;
  setProductSearchTerms: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  getFilteredProducts: (searchTerm: string) => Product[];
  getEyeValues: (eye: 'RE' | 'LE') => { sph: number | null; cyl: number | null };
  calculateMarkup: (sph: number | null, cyl: number | null) => number;
  manualAdditionalCostsEnabled: boolean;
  setManualAdditionalCostsEnabled: (enabled: boolean) => void;
  manualAdditionalCostsAmount: number;
  setManualAdditionalCostsAmount: (amount: number) => void;
  refreshProducts?: () => void;
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
  const [personalisation, setPersonalisation] = useState({
    auto_additional_costs: true,
    sv_lens_cost: 10.00,
    progressive_lens_cost: 20.00,
    frames_cost: 10.00
  });

  const [manualAdditionalCostsEnabled, setManualAdditionalCostsEnabled] = useState(false);
  const [manualAdditionalCostsAmount, setManualAdditionalCostsAmount] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const paginate = (direction: number) => {
    const nextIndex = currentStepIndex + direction;
    if (nextIndex >= 0 && nextIndex < steps.length) {
      if (currentTab === 'order' && direction === 1 && items.length === 0) {
        toast({
          title: t('itemsRequired'),
          description: t('addItemsBeforeProceeding'),
          variant: "destructive",
        });
        return;
      }
      if (currentTab === 'client' && direction === 1) {
        updateClientPrescription();
      }
      setCurrentTab(steps[nextIndex].id);
    }
  };


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
    gcTime: Infinity, // Keep in cache indefinitely
  });

  // Function to refresh products list
  const refreshProducts = async () => {
    if (user) {
      await queryClient.invalidateQueries({ queryKey: ['all-products', user.id] });
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
      setProducts(productsData as Product[]);
      setFilteredProducts(productsData as Product[]);
    }

    if (clientsData) {
      setClients(clientsData);
      setFilteredClients(clientsData);
    }

    if (personalisationData) {
      const pData = personalisationData as any;
      setPersonalisation({
        auto_additional_costs: pData.auto_additional_costs ?? true,
        sv_lens_cost: pData.sv_lens_cost ?? 10.00,
        progressive_lens_cost: pData.progressive_lens_cost ?? 20.00,
        frames_cost: pData.frames_cost ?? 10.00
      });

      // Update markup settings when personalisation data is loaded
      setMarkupSettings({
        sph: [
          {
            min: pData.markup_sph_range_1_min ?? 0,
            max: pData.markup_sph_range_1_max ?? 4,
            markup: pData.markup_sph_range_1_markup ?? 0
          },
          {
            min: pData.markup_sph_range_2_min ?? 4,
            max: pData.markup_sph_range_2_max ?? 8,
            markup: pData.markup_sph_range_2_markup ?? 15
          },
          {
            min: pData.markup_sph_range_3_min ?? 8,
            max: pData.markup_sph_range_3_max === 999 ? Infinity : (pData.markup_sph_range_3_max ?? Infinity),
            markup: pData.markup_sph_range_3_markup ?? 30
          },
        ],
        cyl: [
          {
            min: pData.markup_cyl_range_1_min ?? 0,
            max: pData.markup_cyl_range_1_max ?? 2,
            markup: pData.markup_cyl_range_1_markup ?? 0
          },
          {
            min: pData.markup_cyl_range_2_min ?? 2,
            max: pData.markup_cyl_range_2_max ?? 4,
            markup: pData.markup_cyl_range_2_markup ?? 15
          },
          {
            min: pData.markup_cyl_range_3_min ?? 4,
            max: pData.markup_cyl_range_3_max === 999 ? Infinity : (pData.markup_cyl_range_3_max ?? Infinity),
            markup: pData.markup_cyl_range_3_markup ?? 30
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
      await queryClient.invalidateQueries({ queryKey: ['all-clients', user.id] });

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
    <div className="w-full mb-8">
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentTab === step.id;
          const isCompleted = index < currentStepIndex;
          const hasError = (step.id === 'client' && !selectedClient) ||
            (step.id === 'order' && items.length === 0);
          const showError = hasError && index < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  if (currentStepIndex === 1 && step.id === 'finalize') {
                    updateClientPrescription();
                  }
                  setCurrentTab(step.id);
                }}
                className={`group flex-1 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isActive
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/25 scale-[1.02]'
                  : showError
                    ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-300 hover:shadow-md'
                    : isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:shadow-md'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-teal-200 hover:shadow-md hover:bg-teal-50/30'
                  }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-white/20 backdrop-blur-sm' :
                  showError ? 'bg-red-100' :
                    isCompleted ? 'bg-emerald-100' :
                      'bg-slate-100 group-hover:bg-teal-100'
                  }`}>
                  {showError ? <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> :
                    isCompleted ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> :
                      <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white/70' : showError ? 'text-red-400' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                    {t('step')} {index + 1}
                  </span>
                  <span className={`text-sm sm:text-base font-bold truncate ${isActive ? 'text-white' : ''
                    }`}>
                    {step.label}
                  </span>
                </div>
                {showError && (
                  <div className="ml-auto w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">!</span>
                  </div>
                )}
                {isCompleted && !showError && (
                  <div className="ml-auto w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
              {index < steps.length - 1 && (
                <div className="hidden sm:flex items-center">
                  <ChevronRight className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-4">
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>
    </div>
  );

  const renderClientTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Client Selection Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('selectClient')}</h3>
              <p className="text-xs sm:text-sm text-slate-500">{t('chooseExistingClient')}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
            <div className="flex-1">
              <Input
                placeholder={t('searchByNameOrPhone')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 sm:h-12 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400/20 text-base"
              />
            </div>
            <Button
              onClick={() => setIsAddClientOpen(true)}
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-all hover:scale-105 active:scale-95 text-sm sm:text-base shrink-0"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('newClient')}
            </Button>
          </div>

          <div className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {filteredClients.slice(0, 8).map(client => (
              <button
                key={client.id}
                className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 cursor-pointer ${selectedClient === client.id
                  ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10'
                  : 'border-transparent bg-slate-50 hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-sm'
                  }`}
                onClick={() => handleClientSelect(client.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedClient === client.id ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-slate-900 truncate">{client.name}</h4>
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedClient === client.id && (
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescription Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('prescriptionDetails')}</h3>
              <p className="text-xs sm:text-sm text-slate-500">{t('enterUpdatePrescription')}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Right Eye */}
          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-blue-50/70 border border-blue-100">
            <h4 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-blue-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-200/60 flex items-center justify-center"><span className="text-xs">👁️</span></div>
              {t('rightEye')}
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <Label htmlFor="rightSph" className="text-xs font-semibold text-blue-800">{t('sph')}</Label>
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
                          return { ...item, appliedMarkup: markup, price: product.price * (1 + markup / 100) };
                        }
                      }
                      return item;
                    }));
                  }}
                  className="bg-white h-10 sm:h-11 rounded-lg text-base"
                />
              </div>
              <div>
                <Label htmlFor="rightCyl" className="text-xs font-semibold text-blue-800">{t('cyl')}</Label>
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
                          return { ...item, appliedMarkup: markup, price: product.price * (1 + markup / 100) };
                        }
                      }
                      return item;
                    }));
                  }}
                  className="bg-white h-10 sm:h-11 rounded-lg text-base"
                />
              </div>
              <div>
                <Label htmlFor="rightAxe" className="text-xs font-semibold text-blue-800">{t('axe')}</Label>
                <Input
                  id="rightAxe"
                  type="text"
                  inputMode="numeric"
                  value={rightEye.axe}
                  onChange={(e) => setRightEye({ ...rightEye, axe: e.target.value })}
                  className="bg-white h-10 sm:h-11 rounded-lg text-base"
                />
              </div>
            </div>
          </div>

          {/* Left Eye */}
          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-purple-50/70 border border-purple-100">
            <h4 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-purple-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-200/60 flex items-center justify-center"><span className="text-xs">👁️</span></div>
              {t('leftEye')}
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <Label htmlFor="leftSph" className="text-xs font-semibold text-purple-800">{t('sph')}</Label>
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
                          return { ...item, appliedMarkup: markup, price: product.price * (1 + markup / 100) };
                        }
                      }
                      return item;
                    }));
                  }}
                  className="bg-white h-10 sm:h-11 rounded-lg text-base"
                />
              </div>
              <div>
                <Label htmlFor="leftCyl" className="text-xs font-semibold text-purple-800">{t('cyl')}</Label>
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
                          return { ...item, appliedMarkup: markup, price: product.price * (1 + markup / 100) };
                        }
                      }
                      return item;
                    }));
                  }}
                  className="bg-white h-10 sm:h-11 rounded-lg text-base"
                />
              </div>
              <div>
                <Label htmlFor="leftAxe" className="text-xs font-semibold text-purple-800">{t('axe')}</Label>
                <Input
                  id="leftAxe"
                  type="text"
                  inputMode="numeric"
                  value={leftEye.axe}
                  onChange={(e) => setLeftEye({ ...leftEye, axe: e.target.value })}
                  className="bg-white h-10 sm:h-11 rounded-lg text-base"
                />
              </div>
            </div>
          </div>

          {/* Add */}
          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-emerald-50/70 border border-emerald-100">
            <Label htmlFor="add" className="text-xs font-semibold text-emerald-800">{t('add')}</Label>
            <Input
              id="add"
              type="text"
              value={add}
              onChange={(e) => setAdd(e.target.value)}
              placeholder={t('enterAddValue')}
              className="bg-white h-10 sm:h-11 rounded-lg text-base mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrderTab = () => {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
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

          manualAdditionalCostsEnabled={manualAdditionalCostsEnabled}
          setManualAdditionalCostsEnabled={setManualAdditionalCostsEnabled}
          manualAdditionalCostsAmount={manualAdditionalCostsAmount}
          setManualAdditionalCostsAmount={setManualAdditionalCostsAmount}
          refreshProducts={refreshProducts}
        />

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('paymentDetails')}</h3>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
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
          </div>
        </div>

        {isMobile && (
          <div className="flex justify-center mt-10">
            <Button
              onClick={() => paginate(1)}
              className="w-16 h-16 rounded-full bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-600/20 border-2 border-white flex items-center justify-center transition-all scale-100 active:scale-95"
            >
              <ArrowRight className="h-8 w-8 text-white" />
            </Button>
          </div>
        )}
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
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{t('receiptSummary')}</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {orderType === 'Unspecified' && (
            <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>{t('orderTypeRequired')}:</strong> {t('orderTypeRequiredDesc')}
              </AlertDescription>
            </Alert>
          )}
          {outOfStockItems.length > 0 && (
            <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50 rounded-xl">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              {items.length === 0 && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('noItems')}</AlertTitle>
                  <AlertDescription>{t('pleaseAddItems')}</AlertDescription>
                </Alert>
              )}
              {selectedClient ? (
                <div className="bg-teal-50/70 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-teal-100">
                  <h4 className="font-bold text-sm sm:text-base text-teal-900 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> {t('clientInformation')}
                  </h4>
                  <p className="text-sm text-slate-700">{t('name')}: <span className="font-semibold">{clients.find(c => c.id === selectedClient)?.name}</span></p>
                  <p className="text-sm text-slate-700">{t('phone')}: <span className="font-semibold">{clients.find(c => c.id === selectedClient)?.phone}</span></p>
                </div>
              ) : (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('noClient')}</AlertTitle>
                  <AlertDescription>{t('pleaseSelectClient')}</AlertDescription>
                </Alert>
              )}

              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100">
                <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> {t('prescription')}
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">{t('rightEye')}</p>
                    <p className="text-slate-700">{t('sph')}: <span className="font-medium">{rightEye.sph || 'N/A'}</span></p>
                    <p className="text-slate-700">{t('cyl')}: <span className="font-medium">{rightEye.cyl || 'N/A'}</span></p>
                    <p className="text-slate-700">{t('axe')}: <span className="font-medium">{rightEye.axe || 'N/A'}</span></p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">{t('leftEye')}</p>
                    <p className="text-slate-700">{t('sph')}: <span className="font-medium">{leftEye.sph || 'N/A'}</span></p>
                    <p className="text-slate-700">{t('cyl')}: <span className="font-medium">{leftEye.cyl || 'N/A'}</span></p>
                    <p className="text-slate-700">{t('axe')}: <span className="font-medium">{leftEye.axe || 'N/A'}</span></p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700">{t('add')}: <span className="font-medium">{add || 'N/A'}</span></p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100">
                <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-2 flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> {t('orderSummary')}
                </h4>
                <div className="space-y-1.5 text-sm">
                  <p className="text-slate-700">{t('orderType')}: <span className="font-semibold">{t(orderType.toLowerCase())}</span></p>
                  <p className="text-slate-700">{t('totalItems')}: <span className="font-semibold">{items.length}</span></p>
                  <p className="text-slate-700">{t('subtotal')}: <span className="font-semibold">{subtotal.toFixed(2)} {t('dh')}</span></p>
                  <p className="text-slate-900 font-bold text-base sm:text-lg">{t('total')}: <span className="text-teal-700">{total.toFixed(2)} {t('dh')}</span></p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100">
                <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> {t('paymentStatus')}
                </h4>
                <div className="space-y-1.5 text-sm">
                  <p className="text-slate-700">{t('advancePayment')}: <span className="font-semibold">{advancePayment.toFixed(2)} {t('dh')}</span></p>
                  <p className="text-slate-700">{t('balanceDue')}: <span className="font-semibold">{balance.toFixed(2)} {t('dh')}</span></p>
                  <div className="pt-1">
                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                      paymentStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {paymentStatus === 'Paid' ? t('paid') :
                        paymentStatus === 'Partially Paid' ? t('partiallyPaid') :
                          t('unpaid')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

    setIsConfirmSaveOpen(true);
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

      queryClient.invalidateQueries({ queryKey: ['receipts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['receipts', user.id, 'light'] });
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
    <div className="w-full min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden animate-in fade-in duration-700">
      {/* Hero Banner */}
      <div className="w-full px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 relative z-10">
        <div className="w-full bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 text-white rounded-[24px] sm:rounded-[32px] py-6 sm:py-8 px-5 sm:px-8 md:px-10 shadow-xl relative overflow-hidden mb-6 sm:mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mb-40 blur-3xl" />
          <div className="w-full relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                  <Receipt className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none text-white uppercase mb-1">
                    {t('newReceipt')}
                  </h1>
                  <p className="text-white/70 font-medium tracking-wide text-xs sm:text-sm uppercase">
                    {t('step')} {currentStepIndex + 1} {t('of')} {steps.length} — {steps[currentStepIndex]?.label}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => navigate('/receipts')}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-6 sm:px-8 h-10 sm:h-12 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl w-fit"
                >
                  <ArrowLeft className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" /> {t('backToReceipts') || 'Back'}
                </Button>

                {currentTab === 'finalize' && (
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white border-2 border-emerald-400/50 rounded-2xl px-6 sm:px-8 h-10 sm:h-12 font-black transition-all hover:scale-110 active:scale-95 shadow-xl shadow-emerald-500/30 w-fit"
                  >
                    {isLoading ? (
                      <>{t('saving') || 'Saving...'}</>
                    ) : (
                      <><Check className="mr-2 h-5 w-5" /> {t('saveReceipt') || 'Save Receipt'}</>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-10 relative z-20">
        {renderStepIndicator()}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentTab === 'client' && renderClientTab()}
            {currentTab === 'order' && renderOrderTab()}
            {currentTab === 'finalize' && renderFinalizeTab()}
          </motion.div>
        </AnimatePresence>

      </div>

      <AlertDialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <AlertDialogContent className="max-w-sm bg-gradient-to-br from-teal-50 to-white border-2 border-teal-300 shadow-xl rounded-xl overflow-hidden p-0">
          <div className="text-center pb-4 pt-8">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-4 shadow-md border-2 border-teal-300">
              <Check className="h-6 w-6 text-teal-700" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-teal-800 text-center uppercase tracking-tight">
              {t('confirmSaveReceipt')}
            </AlertDialogTitle>
          </div>

          <div className="text-center px-6 py-2">
            <AlertDialogDescription className="text-teal-700 text-sm leading-relaxed">
              {t('areYouSureSaveReceipt')}
            </AlertDialogDescription>
          </div>

          <div className="flex gap-3 p-4 mt-4 bg-gradient-to-r from-teal-100 to-teal-50 border-t border-teal-200">
            <AlertDialogCancel
              className="flex-1 border-2 border-teal-400 text-teal-700 hover:bg-teal-200 hover:border-teal-500 font-medium py-2 h-auto rounded-lg transition-all duration-200"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performSave}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-none shadow-md hover:shadow-lg transition-all duration-200 font-medium py-2 h-auto rounded-lg"
            >
              {t('save')}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>


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