import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Invoice, InvoiceItem } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, AlertTriangle, DollarSign, Calculator, Search, Save } from 'lucide-react';

interface AddInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddInvoiceDialog: React.FC<AddInvoiceDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    client_name: '',
    client_phone: '',
    client_assurance: '',
    assurance_total: 0,
    advance_payment: 0,
    balance: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Draft',
    notes: ''
  });

  const [prescriptionData, setPrescriptionData] = useState({
    right_eye_sph: '',
    right_eye_cyl: '',
    right_eye_axe: '',
    left_eye_sph: '',
    left_eye_cyl: '',
    left_eye_axe: '',
    add_value: ''
  });

  const [invoiceItems, setInvoiceItems] = useState<Partial<InvoiceItem>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAssuranceAlert, setShowAssuranceAlert] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Category options for items
  const CATEGORY_OPTIONS = [
    'Single Vision Lenses',
    'Progressive Lenses', 
    'Frames',
    'Sunglasses',
    'Contact Lenses',
    'Accessories'
  ];

  // Fetch clients for selection
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients-for-invoice', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && isOpen,
  });

  // Fetch receipts with full details for data copying
  const { data: allReceipts = [] } = useQuery({
    queryKey: ['receipts-for-invoice', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          client_id,
          total,
          tax,
          created_at,
          clients!receipts_client_id_fkey (
            name,
            phone,
            assurance,
            right_eye_sph,
            right_eye_cyl,
            right_eye_axe,
            left_eye_sph,
            left_eye_cyl,
            left_eye_axe,
            Add
          ),
          receipt_items (
            id,
            quantity,
            price,
            custom_item_name,
            product:product_id (
              name,
              category
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching receipts:', error);
        throw error;
      }

      return data?.map(receipt => ({
        ...receipt,
        client_name: receipt.clients?.name || 'No Client',
        client_phone: receipt.clients?.phone || 'N/A',
        client_assurance: receipt.clients?.assurance || ''
      })) || [];
    },
    enabled: !!user && isOpen,
  });

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return allClients;

    const searchLower = clientSearchTerm.toLowerCase();
    return allClients.filter(client => 
      client.name?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
  }, [allClients, clientSearchTerm]);

  // Filter receipts based on client search term
  const receipts = useMemo(() => {
    if (!clientSearchTerm.trim()) return allReceipts;

    const searchLower = clientSearchTerm.toLowerCase();
    return allReceipts.filter(receipt => 
      receipt.client_name?.toLowerCase().includes(searchLower) ||
      receipt.client_phone?.toLowerCase().includes(searchLower)
    );
  }, [allReceipts, clientSearchTerm]);

  // Generate invoice number
  useEffect(() => {
    if (isOpen && !invoiceData.invoice_number) {
      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      setInvoiceData(prev => ({ ...prev, invoice_number: invoiceNumber }));
    }
  }, [isOpen, invoiceData.invoice_number]);

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    if (clientId === "no-client") {
      setInvoiceData(prev => ({
        ...prev,
        client_name: '',
        client_phone: '',
        client_assurance: ''
      }));
      setPrescriptionData({
        right_eye_sph: '',
        right_eye_cyl: '',
        right_eye_axe: '',
        left_eye_sph: '',
        left_eye_cyl: '',
        left_eye_axe: '',
        add_value: ''
      });
      return;
    }

    const selectedClient = allClients.find(c => c.id === clientId);
    if (selectedClient) {
      setInvoiceData(prev => ({
        ...prev,
        client_name: selectedClient.name || '',
        client_phone: selectedClient.phone || '',
        client_assurance: selectedClient.assurance || ''
      }));

      // Populate prescription data from selected client
      setPrescriptionData({
        right_eye_sph: selectedClient.right_eye_sph?.toString() || '',
        right_eye_cyl: selectedClient.right_eye_cyl?.toString() || '',
        right_eye_axe: selectedClient.right_eye_axe?.toString() || '',
        left_eye_sph: selectedClient.left_eye_sph?.toString() || '',
        left_eye_cyl: selectedClient.left_eye_cyl?.toString() || '',
        left_eye_axe: selectedClient.left_eye_axe?.toString() || '',
        add_value: selectedClient.Add?.toString() || ''
      });
    }
  };

  // Handle receipt selection for data copying
  const handleReceiptSelect = (receiptId: string) => {
    setSelectedReceiptId(receiptId);

    if (receiptId === "no-receipt") {
      setInvoiceItems([]);
      setInvoiceData(prev => ({
        ...prev,
        client_name: '',
        client_phone: '',
        client_assurance: '',
        assurance_total: 0
      }));
      setPrescriptionData({
        right_eye_sph: '',
        right_eye_cyl: '',
        right_eye_axe: '',
        left_eye_sph: '',
        left_eye_cyl: '',
        left_eye_axe: '',
        add_value: ''
      });
      return;
    }

    const selectedReceipt = receipts.find(r => r.id === receiptId);

    if (selectedReceipt) {
      const itemsTotal = selectedReceipt.receipt_items?.reduce((sum, item) => 
        sum + ((item.quantity || 1) * (item.price || 0)), 0) || 0;

      // Set assurance total from receipt tax, or use items total if tax is 0
      const assuranceTotal = (selectedReceipt.tax && selectedReceipt.tax > 0) 
        ? selectedReceipt.tax 
        : itemsTotal;

      setInvoiceData(prev => ({
        ...prev,
        client_name: selectedReceipt.client_name || '',
        client_phone: selectedReceipt.client_phone || '',
        client_assurance: selectedReceipt.client_assurance || '',
        assurance_total: assuranceTotal
      }));

      // Populate prescription data from the client linked to the receipt
      if (selectedReceipt.clients) {
        setPrescriptionData({
          right_eye_sph: selectedReceipt.clients.right_eye_sph?.toString() || '',
          right_eye_cyl: selectedReceipt.clients.right_eye_cyl?.toString() || '',
          right_eye_axe: selectedReceipt.clients.right_eye_axe?.toString() || '',
          left_eye_sph: selectedReceipt.clients.left_eye_sph?.toString() || '',
          left_eye_cyl: selectedReceipt.clients.left_eye_cyl?.toString() || '',
          left_eye_axe: selectedReceipt.clients.left_eye_axe?.toString() || '',
          add_value: selectedReceipt.clients.Add?.toString() || ''
        });
      }

      // Convert receipt items to invoice items with manual price and quantity
      const items = selectedReceipt.receipt_items?.map(item => ({
        product_name: item.product?.name || item.custom_item_name || 'Unknown Product',
        description: '',
        quantity: item.quantity || 1,
        unit_price: item.price || 0,
        total_price: (item.quantity || 1) * (item.price || 0),
        item_category: item.product?.category || 'Single Vision Lenses'
      })) || [];

      setInvoiceItems(items);
      // Reset original prices when receipt selection changes
      setOriginalPrices({});
    }
  };

  // Add new item
  const addItem = () => {
    setInvoiceItems(prev => [...prev, {
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      item_category: 'Single Vision Lenses'
    }]);
    // Reset original prices when items change
    setOriginalPrices({});
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Recalculate total price for quantity and unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = field === 'quantity' ? value : updated[index].quantity || 0;
        const unitPrice = field === 'unit_price' ? value : updated[index].unit_price || 0;
        updated[index].total_price = quantity * unitPrice;
      }

      return updated;
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
    // Reset original prices when items change
    setOriginalPrices({});
  };

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const total = subtotal;

  // Calculate purchase type from unique categories
  const getPurchaseType = () => {
    const uniqueCategories = [...new Set(invoiceItems.map(item => item.item_category).filter(Boolean))];
    return uniqueCategories.join(' + ');
  };

  // Check if assurance total matches items total
  const isAssuranceMismatch = Math.abs(invoiceData.assurance_total - subtotal) > 0.01;

  // Update balance when advance payment or total changes
  useEffect(() => {
    const newBalance = total - invoiceData.advance_payment;
    setInvoiceData(prev => ({ ...prev, balance: newBalance }));
  }, [total, invoiceData.advance_payment]);

  // Show alert when there's a mismatch
  useEffect(() => {
    setShowAssuranceAlert(isAssuranceMismatch && subtotal > 0);
  }, [isAssuranceMismatch, subtotal]);

  // Store original prices for consistent calculations across multiple runs
  const [originalPrices, setOriginalPrices] = useState<{ [key: number]: number }>({});

  // Time-limited smart auto-adjust item prices to match assurance total without decimals
  const adjustItemPrices = () => {
    if (invoiceItems.length === 0 || invoiceData.assurance_total <= 0) return;

    // Store original prices if not already stored or if items have changed
    let baselinePrices = { ...originalPrices };
    let needsNewBaseline = Object.keys(baselinePrices).length === 0 || 
                          Object.keys(baselinePrices).length !== invoiceItems.length;

    if (needsNewBaseline) {
      baselinePrices = {};
      invoiceItems.forEach((item, index) => {
        baselinePrices[index] = item.unit_price || 0;
      });
      setOriginalPrices(baselinePrices);
    }

    // Calculate difference from original baseline prices
    const baselineTotal = Object.keys(baselinePrices).reduce((sum, index) => {
      const itemIndex = parseInt(index);
      const quantity = invoiceItems[itemIndex]?.quantity || 1;
      return sum + (baselinePrices[itemIndex] * quantity);
    }, 0);

    const targetTotal = invoiceData.assurance_total;
    const difference = Math.round(targetTotal - baselineTotal);

    if (Math.abs(difference) < 1) return; // Already matches or difference is less than 1

    const startTime = Date.now();
    const TIME_LIMIT = 2000; // 2 seconds in milliseconds

    // Helper function to calculate total from items
    const calculateTotal = (items: Partial<InvoiceItem>[]) => {
      return items.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.quantity || 1)), 0);
    };

    // Helper function to check if prices end in 0
    const hasNiceEndings = (items: Partial<InvoiceItem>[]) => {
      return items.filter(item => (item.unit_price || 0) % 10 === 0).length;
    };

    // Helper function to check if prices end in double 0s (100, 200, etc.)
    const hasDoubleZeroEndings = (items: Partial<InvoiceItem>[]) => {
      return items.filter(item => (item.unit_price || 0) % 100 === 0 && (item.unit_price || 0) > 0).length;
    };

    // Helper function to check if we've exceeded time limit
    const isTimeUp = () => Date.now() - startTime > TIME_LIMIT;

    // Helper function to evaluate solution quality
    const evaluateSolution = (items: Partial<InvoiceItem>[] | null) => {
      if (!items) return { isValid: false, score: -1, niceEndings: 0, doubleZeroEndings: 0, exactMatch: false };

      const total = calculateTotal(items);
      const exactMatch = Math.abs(total - targetTotal) < 0.01;
      const niceEndings = hasNiceEndings(items);
      const doubleZeroEndings = hasDoubleZeroEndings(items);
      const hasDecimals = items.some(item => (item.unit_price || 0) % 1 !== 0);

      return {
        isValid: exactMatch && !hasDecimals,
        exactMatch,
        niceEndings,
        doubleZeroEndings,
        score: exactMatch ? (doubleZeroEndings * 50 + niceEndings * 10 + (hasDecimals ? 0 : 5)) : 0,
        items
      };
    };

    // Strategy 1: Try to adjust items to end in multiples of 100, then 10
    const tryNiceDistribution = (originalItems: Partial<InvoiceItem>[], diff: number): Partial<InvoiceItem>[] | null => {
      if (isTimeUp()) return null;

      // Start from original baseline prices, not current prices
      const testItems = originalItems.map((item, index) => ({
        ...item,
        unit_price: baselinePrices[index] || 0,
        total_price: (baselinePrices[index] || 0) * (item.quantity || 1)
      }));

      let remainingDiff = diff;

      if (diff > 0) {
        // Increase prices - try to round up to nearest 100 first, then 10
        for (let i = 0; i < testItems.length && remainingDiff > 0 && !isTimeUp(); i++) {
          const originalPrice = baselinePrices[i] || 0;
          const currentPrice = originalPrice;
          const quantity = testItems[i].quantity || 1;

          // Try rounding to nearest 100 first
          const nextHundred = Math.ceil(currentPrice / 100) * 100;
          const hundredIncrease = Math.max(1, nextHundred - currentPrice);

          if (hundredIncrease * quantity <= remainingDiff) {
            testItems[i].unit_price = currentPrice + hundredIncrease;
            testItems[i].total_price = testItems[i].unit_price * quantity;
            remainingDiff -= hundredIncrease * quantity;
          } else {
            // Fall back to rounding to nearest 10
            const nextTen = Math.ceil(currentPrice / 10) * 10;
            const tenIncrease = Math.max(1, nextTen - currentPrice);

            if (tenIncrease * quantity <= remainingDiff) {
              testItems[i].unit_price = currentPrice + tenIncrease;
              testItems[i].total_price = testItems[i].unit_price * quantity;
              remainingDiff -= tenIncrease * quantity;
            }
          }
        }

        // Distribute any remaining difference
        let itemIndex = 0;
        while (remainingDiff > 0 && itemIndex < testItems.length && !isTimeUp()) {
          const item = testItems[itemIndex];
          const quantity = item.quantity || 1;
          const maxIncrease = Math.floor(remainingDiff / quantity);

          if (maxIncrease > 0) {
            const currentPrice = item.unit_price || 0;
            item.unit_price = currentPrice + maxIncrease;
            item.total_price = item.unit_price * quantity;
            remainingDiff -= maxIncrease * quantity;
          }
          itemIndex++;
        }
      } else {
        // Decrease prices - try to round down to nearest 100 first, then 10
        remainingDiff = Math.abs(remainingDiff);

        for (let i = 0; i < testItems.length && remainingDiff > 0 && !isTimeUp(); i++) {
          const currentPrice = testItems[i].unit_price || 0;
          const quantity = testItems[i].quantity || 1;

          // Try rounding down to nearest 100 first
          const prevHundred = Math.floor(currentPrice / 100) * 100;
          const hundredDecrease = Math.min(currentPrice, currentPrice - prevHundred);

          if (hundredDecrease > 0 && hundredDecrease * quantity <= remainingDiff) {
            testItems[i].unit_price = Math.max(0, currentPrice - hundredDecrease);
            testItems[i].total_price = testItems[i].unit_price * quantity;
            remainingDiff -= hundredDecrease * quantity;
          } else {
            // Fall back to rounding down to nearest 10
            const prevTen = Math.floor(currentPrice / 10) * 10;
            const tenDecrease = Math.min(currentPrice, currentPrice - prevTen);

            if (tenDecrease > 0 && tenDecrease * quantity <= remainingDiff) {
              testItems[i].unit_price = Math.max(0, currentPrice - tenDecrease);
              testItems[i].total_price = testItems[i].unit_price * quantity;
              remainingDiff -= tenDecrease * quantity;
            }
          }
        }

        // Distribute any remaining difference
        let itemIndex = 0;
        while (remainingDiff > 0 && itemIndex < testItems.length && !isTimeUp()) {
          const item = testItems[itemIndex];
          const currentPrice = item.unit_price || 0;
          const quantity = item.quantity || 1;
          const maxDecrease = Math.min(currentPrice, Math.floor(remainingDiff / quantity));

          if (maxDecrease > 0) {
            item.unit_price = currentPrice - maxDecrease;
            item.total_price = item.unit_price * quantity;
            remainingDiff -= maxDecrease * quantity;
          }
          itemIndex++;
        }
      }

      return testItems;
    };

    // Strategy 2: Equal distribution across all items
    const tryEqualDistribution = (originalItems: Partial<InvoiceItem>[], diff: number): Partial<InvoiceItem>[] | null => {
      if (isTimeUp()) return null;

      // Start from original baseline prices
      const testItems = originalItems.map((item, index) => ({
        ...item,
        unit_price: baselinePrices[index] || 0,
        total_price: (baselinePrices[index] || 0) * (item.quantity || 1)
      }));

      let remainingDiff = diff;

      if (diff > 0) {
        const baseIncrease = Math.floor(remainingDiff / testItems.length);
        let extraAmount = remainingDiff - (baseIncrease * testItems.length);

        // Distribute base increase to all items
        testItems.forEach((item, index) => {
          if (isTimeUp()) return;
          const currentPrice = item.unit_price || 0;
          const quantity = item.quantity || 1;
          testItems[index].unit_price = currentPrice + baseIncrease;
          testItems[index].total_price = testItems[index].unit_price * quantity;
        });

        // Distribute remaining amount
        let itemIndex = 0;
        while (extraAmount > 0 && itemIndex < testItems.length && !isTimeUp()) {
          const item = testItems[itemIndex];
          const quantity = item.quantity || 1;
          item.unit_price = (item.unit_price || 0) + 1;
          item.total_price = item.unit_price * quantity;
          extraAmount -= 1;
          itemIndex++;
        }
      } else {
        remainingDiff = Math.abs(remainingDiff);
        const baseDecrease = Math.floor(remainingDiff / testItems.length);
        let extraAmount = remainingDiff - (baseDecrease * testItems.length);

        // Distribute base decrease to all items
        testItems.forEach((item, index) => {
          if (isTimeUp()) return;
          const currentPrice = item.unit_price || 0;
          const quantity = item.quantity || 1;
          testItems[index].unit_price = Math.max(0, currentPrice - baseDecrease);
          testItems[index].total_price = testItems[index].unit_price * quantity;
        });

        // Distribute remaining reduction
        let itemIndex = 0;
        while (extraAmount > 0 && itemIndex < testItems.length && !isTimeUp()) {
          const item = testItems[itemIndex];
          const currentPrice = item.unit_price || 0;
          const quantity = item.quantity || 1;

          if (currentPrice > 0) {
            item.unit_price = currentPrice - 1;
            item.total_price = item.unit_price * quantity;
            extraAmount -= 1;
          }
          itemIndex++;
        }
      }

      return testItems;
    };

    // Strategy 3: Weighted distribution based on original prices
    const tryWeightedDistribution = (originalItems: Partial<InvoiceItem>[], diff: number): Partial<InvoiceItem>[] | null => {
      if (isTimeUp()) return null;

      // Start from original baseline prices
      const testItems = originalItems.map((item, index) => ({
        ...item,
        unit_price: baselinePrices[index] || 0,
        total_price: (baselinePrices[index] || 0) * (item.quantity || 1)
      }));

      const totalCurrentValue = calculateTotal(testItems);

      if (totalCurrentValue === 0) return null;

      let remainingDiff = diff;

      if (diff > 0) {
        // Distribute based on proportion of current value
        for (let i = 0; i < testItems.length && remainingDiff > 0 && !isTimeUp(); i++) {
          const item = testItems[i];
          const currentItemTotal = (item.unit_price || 0) * (item.quantity || 1);
          const proportion = currentItemTotal / totalCurrentValue;
          const allocation = Math.round(remainingDiff * proportion);
          const quantity = item.quantity || 1;
          const priceIncrease = Math.floor(allocation / quantity);

          if (priceIncrease > 0) {
            item.unit_price = (item.unit_price || 0) + priceIncrease;
            item.total_price = item.unit_price * quantity;
            remainingDiff -= priceIncrease * quantity;
          }
        }

        // Distribute any remaining difference
        let itemIndex = 0;
        while (remainingDiff > 0 && itemIndex < testItems.length && !isTimeUp()) {
          const item = testItems[itemIndex];
          const quantity = item.quantity || 1;
          item.unit_price = (item.unit_price || 0) + 1;
          item.total_price = item.unit_price * quantity;
          remainingDiff -= 1;
          itemIndex++;
        }
      } else {
        remainingDiff = Math.abs(remainingDiff);

        // Similar logic for reduction
        for (let i = 0; i < testItems.length && remainingDiff > 0 && !isTimeUp(); i++) {
          const item = testItems[i];
          const currentItemTotal = (item.unit_price || 0) * (item.quantity || 1);
          const proportion = currentItemTotal / totalCurrentValue;
          const allocation = Math.round(remainingDiff * proportion);
          const quantity = item.quantity || 1;
          const priceDecrease = Math.min(item.unit_price || 0, Math.floor(allocation / quantity));

          if (priceDecrease > 0) {
            item.unit_price = (item.unit_price || 0) - priceDecrease;
            item.total_price = item.unit_price * quantity;
            remainingDiff -= priceDecrease * quantity;
          }
        }

        // Distribute any remaining reduction
        let itemIndex = 0;
        while (remainingDiff > 0 && itemIndex < testItems.length && !isTimeUp()) {
          const item = testItems[itemIndex];
          const currentPrice = item.unit_price || 0;

          if (currentPrice > 0) {
            item.unit_price = currentPrice - 1;
            item.total_price = item.unit_price * (item.quantity || 1);
            remainingDiff -= 1;
          }
          itemIndex++;
        }
      }

      return testItems;
    };

    // Strategy 4: Random variations for edge cases
    const tryRandomVariations = (originalItems: Partial<InvoiceItem>[], diff: number, attempts: number = 50): Partial<InvoiceItem>[] | null => {
      if (isTimeUp()) return null;

      for (let attempt = 0; attempt < attempts && !isTimeUp(); attempt++) {
        // Start from original baseline prices
        const testItems = originalItems.map((item, index) => ({
          ...item,
          unit_price: baselinePrices[index] || 0,
          total_price: (baselinePrices[index] || 0) * (item.quantity || 1)
        }));

        let remainingDiff = diff;

        // Randomly distribute the difference
        while (Math.abs(remainingDiff) > 0 && !isTimeUp()) {
          const randomIndex = Math.floor(Math.random() * testItems.length);
          const item = testItems[randomIndex];
          const quantity = item.quantity || 1;
          const currentPrice = item.unit_price || 0;

          if (remainingDiff > 0) {
            const increase = Math.min(remainingDiff, Math.floor(Math.random() * 5) + 1);
            item.unit_price = currentPrice + increase;
            item.total_price = item.unit_price * quantity;
            remainingDiff -= increase;
          } else if (remainingDiff < 0 && currentPrice > 0) {
            const decrease = Math.min(Math.abs(remainingDiff), Math.min(currentPrice, Math.floor(Math.random() * 3) + 1));
            item.unit_price = currentPrice - decrease;
            item.total_price = item.unit_price * quantity;
            remainingDiff += decrease;
          } else {
            break;
          }
        }

        const evaluation = evaluateSolution(testItems);
        if (evaluation.isValid) {
          return testItems;
        }
      }

      return null;
    };

    // Collect all possible solutions with their evaluations
    const solutions = [];

    // Try all strategies with time limits
    if (!isTimeUp()) {
      const niceResult = tryNiceDistribution([...invoiceItems], difference);
      const niceEvaluation = evaluateSolution(niceResult);
      if (niceEvaluation.items) solutions.push(niceEvaluation);
    }

    if (!isTimeUp()) {
      const equalResult = tryEqualDistribution([...invoiceItems], difference);
      const equalEvaluation = evaluateSolution(equalResult);
      if (equalEvaluation.items) solutions.push(equalEvaluation);
    }

    if (!isTimeUp()) {
      const weightedResult = tryWeightedDistribution([...invoiceItems], difference);
      const weightedEvaluation = evaluateSolution(weightedResult);
      if (weightedEvaluation.items) solutions.push(weightedEvaluation);
    }

    if (!isTimeUp()) {
      const randomResult = tryRandomVariations([...invoiceItems], difference);
      const randomEvaluation = evaluateSolution(randomResult);
      if (randomEvaluation.items) solutions.push(randomEvaluation);
    }

    // Find the best solution based on priority:
    // 1. Must have exact assurance total match
    // 2. Higher score (more items ending in 0, no decimals)
    const validSolutions = solutions.filter(s => s.isValid && s.exactMatch);
    const bestSolution = validSolutions.length > 0 
      ? validSolutions.reduce((best, current) => current.score > best.score ? current : best)
      : solutions.find(s => s.exactMatch); // Fallback to any exact match even if has decimals

    const executionTime = Date.now() - startTime;

    if (bestSolution && bestSolution.items) {
      setInvoiceItems(bestSolution.items);
      const finalTotal = calculateTotal(bestSolution.items);

      toast({
        title: "Prices Adjusted Successfully",
        description: `Prices adjusted in ${executionTime}ms to match assurance total (${finalTotal.toFixed(0)} DH)${bestSolution.doubleZeroEndings > 0 ? ` with ${bestSolution.doubleZeroEndings} items ending in 00` : ''}${bestSolution.niceEndings > 0 ? ` and ${bestSolution.niceEndings} items ending in 0` : ''}.`,
      });
    } else if (solutions.length > 0) {
      // Use the best available solution even if not perfect
      const fallbackSolution = solutions.reduce((best, current) => current.score > best.score ? current : best);
      if (fallbackSolution.items) {
        setInvoiceItems(fallbackSolution.items);
        const finalTotal = calculateTotal(fallbackSolution.items);

        toast({
          title: "Partial Adjustment",
          description: `Best available solution found in ${executionTime}ms (${finalTotal.toFixed(2)} DH). May need manual adjustment.`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Adjustment Failed",
        description: `No valid solution found within ${executionTime}ms time limit. Please adjust manually.`,
        variant: "destructive",
      });
    }
  };

  // Auto-calculate status based on balance
  const getInvoiceStatus = () => {
    if (invoiceData.balance <= 0 && total > 0) return 'Paid';
    if (invoiceData.advance_payment > 0 && invoiceData.balance > 0) return 'Pending';
    if (invoiceData.advance_payment === 0 && total > 0) return 'Draft';
    return 'Draft';
  };

  const handleSave = async () => {
    if (!user) return;

    if (!invoiceData.client_name.trim()) {
      toast({
        title: "Error",
        description: "Client name is required.",
        variant: "destructive",
      });
      return;
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "At least one item is required.",
        variant: "destructive",
      });
      return;
    }

    // Check if assurance total matches items total
    if (isAssuranceMismatch) {
      toast({
        title: "Error",
        description: "Assurance total must equal the total amount of items. Please adjust the prices or assurance total.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const finalStatus = getInvoiceStatus();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceData.invoice_number,
          client_name: invoiceData.client_name,
          client_phone: invoiceData.client_phone,
          client_assurance: invoiceData.client_assurance,
          subtotal,
          tax_percentage: 0,
          tax_amount: invoiceData.assurance_total,
          total,
          advance_payment: invoiceData.advance_payment,
          balance: invoiceData.balance,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date || null,
          status: finalStatus,
          notes: invoiceData.notes,
          purchase_type: getPurchaseType(),
          right_eye_sph: prescriptionData.right_eye_sph ? parseFloat(prescriptionData.right_eye_sph) : null,
          right_eye_cyl: prescriptionData.right_eye_cyl ? parseFloat(prescriptionData.right_eye_cyl) : null,
          right_eye_axe: prescriptionData.right_eye_axe ? parseInt(prescriptionData.right_eye_axe) : null,
          left_eye_sph: prescriptionData.left_eye_sph ? parseFloat(prescriptionData.left_eye_sph) : null,
          left_eye_cyl: prescriptionData.left_eye_cyl ? parseFloat(prescriptionData.left_eye_cyl) : null,
          left_eye_axe: prescriptionData.left_eye_axe ? parseInt(prescriptionData.left_eye_axe) : null,
          add_value: prescriptionData.add_value ? parseFloat(prescriptionData.add_value) : null
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        user_id: user.id,
        product_name: item.product_name || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        item_category: item.item_category || 'Single Vision Lenses'
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice created successfully.",
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReceiptId('');
    setClientSearchTerm('');
    setInvoiceData({
      invoice_number: '',
      client_name: '',
      client_phone: '',
      client_assurance: '',
      assurance_total: 0,
      advance_payment: 0,
      balance: 0,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'Draft',
      notes: ''
    });
    setPrescriptionData({
      right_eye_sph: '',
      right_eye_cyl: '',
      right_eye_axe: '',
      left_eye_sph: '',
      left_eye_cyl: '',
      left_eye_axe: '',
      add_value: ''
    });
    setInvoiceItems([]);
    setShowAssuranceAlert(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">{t('addInvoice') || 'Add Invoice'}</DialogTitle>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || isAssuranceMismatch}
            className={`w-12 h-12 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
              isAssuranceMismatch ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
            size="sm"
          >
            <Save className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Assurance Mismatch Alert */}
        {showAssuranceAlert && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Assurance Total Mismatch:</strong> The assurance total ({invoiceData.assurance_total.toFixed(2)} DH) 
                  doesn't match the items total ({subtotal.toFixed(2)} DH). 
                  You cannot save the invoice until these amounts match.
                </div>
                <Button 
                  onClick={adjustItemPrices}
                  size="sm"
                  className="ml-4 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Auto-Adjust Prices
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('invoiceAndClientDetails') || 'Détails Facture & Client'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>{t('selectClient') || 'Select Client'}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('searchClients') || 'Search clients...'}
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-9 mb-2"
                  />
                </div>
                <Select onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectClient') || 'Select Client'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-client">{t('noClient') || 'No Client'}</SelectItem>
                    {filteredClients.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        {clientSearchTerm ? 'No clients match your search' : 'No clients available'}
                      </SelectItem>
                    ) : (
                      filteredClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone || 'No phone'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Receipt Selection */}
              <div className="space-y-2">
                <Label>{t('copyFromReceipt') || 'Copy from Receipt'} ({t('optional') || 'Optional'})</Label>
                <Select value={selectedReceiptId} onValueChange={handleReceiptSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectReceipt') || 'Select Receipt'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-receipt">{t('noReceipt') || 'No Receipt'}</SelectItem>
                    {receipts.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        {clientSearchTerm ? 'No receipts match your search' : 'No receipts available'}
                      </SelectItem>
                    ) : (
                      receipts.map(receipt => (
                        <SelectItem key={receipt.id} value={receipt.id}>
                          {receipt.client_name} - {receipt.total?.toFixed(2) || '0.00'} DH - {new Date(receipt.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('invoiceNumber') || 'Invoice Number'}</Label>
                  <Input
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                    placeholder={t('invoiceNumber') || 'Invoice Number'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('status') || 'Status'} (Auto-calculated)</Label>
                  <Input
                    value={getInvoiceStatus()}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('clientName') || 'Client Name'} *</Label>
                  <Input
                    value={invoiceData.client_name}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder={t('clientName') || 'Client Name'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('clientPhone') || 'Client Phone'}</Label>
                  <Input
                    value={invoiceData.client_phone}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder={t('clientPhone') || 'Client Phone'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('clientAssurance') || 'Client Assurance'}</Label>
                <Input
                  value={invoiceData.client_assurance}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, client_assurance: e.target.value }))}
                  placeholder={t('clientAssurance') || 'Client Assurance'}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('invoiceDate') || 'Invoice Date'}</Label>
                  <Input
                    type="date"
                    value={invoiceData.invoice_date}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('dueDate') || 'Due Date'}</Label>
                  <Input
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>{t('notes') || 'Notes'}</Label>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('notes') || 'Notes'}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescription */}
          <Card>
            <CardHeader>
              <CardTitle>{t('prescription') || 'Prescription'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">{t('rightEye') || 'Right Eye'}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SPH</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={prescriptionData.right_eye_sph}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_sph: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CYL</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={prescriptionData.right_eye_cyl}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_cyl: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AXE</Label>
                      <Input
                        type="number"
                        value={prescriptionData.right_eye_axe}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, right_eye_axe: e.target.value }))}
                        placeholder="0"
                        min="0"
                        max="180"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">{t('leftEye') || 'Left Eye'}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SPH</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={prescriptionData.left_eye_sph}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_sph: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CYL</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={prescriptionData.left_eye_cyl}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_cyl: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AXE</Label>
                      <Input
                        type="number"
                        value={prescriptionData.left_eye_axe}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, left_eye_axe: e.target.value }))}
                        placeholder="0"
                        min="0"
                        max="180"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 w-1/3">
                <Label>{t('add') || 'ADD'}</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={prescriptionData.add_value}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, add_value: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('items') || 'Items'}</CardTitle>
              <Button onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('addItem') || 'Add Item'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoiceItems.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3">
                          <Label className="text-sm">{t('productName') || 'Product Name'}</Label>
                          <Input
                            value={item.product_name || ''}
                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                            placeholder={t('productName') || 'Product Name'}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">{t('category') || 'Category'}</Label>
                          <Select
                            value={item.item_category || 'Single Vision Lenses'}
                            onValueChange={(value) => updateItem(index, 'item_category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map(category => (
                                <SelectItem key={category} value={category}>
                                  {t(category.toLowerCase().replace(/\s+/g, '')) || category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">{t('description') || 'Description'}</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder={t('description') || 'Description'}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">{t('quantity') || 'Quantity'}</Label>
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">{t('unitPrice') || 'Unit Price'}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price || ''}
                            onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                            min="0"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            onClick={() => removeItem(index)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-sm font-medium bg-blue-50 px-3 py-1 rounded">
                          {t('total') || 'Total'}: {(item.total_price || 0).toFixed(2)} DH
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {invoiceItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('noItemsAdded') || 'No items added yet'}</p>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('subtotal') || 'Subtotal'}:</span>
                    <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">{t('total') || 'Total'}:</span>
                    <span className="font-bold text-blue-600">{total.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Assurance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('paymentAndAssuranceDetails') || 'Détails Paiement & Assurance'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-blue-600">
                    Assurance Total *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={invoiceData.assurance_total}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, assurance_total: Number(e.target.value) }))}
                    min="0"
                    className={isAssuranceMismatch ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}
                  />
                  <p className="text-sm text-gray-600">
                    Must equal items total: {subtotal.toFixed(2)} DH
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t('advancePayment') || 'Advance Payment'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={invoiceData.advance_payment}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, advance_payment: Number(e.target.value) }))}
                    min="0"
                    max={total}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('balance') || 'Balance'} (Auto-calculated)</Label>
                  <Input
                    value={invoiceData.balance.toFixed(2)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3">{t('paymentSummary') || 'Résumé de Paiement'}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('itemsTotal') || 'Total Articles'}:</span>
                    <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('assuranceTotal') || 'Total Assurance'}:</span>
                    <span className={`font-medium ${isAssuranceMismatch ? 'text-red-600' : 'text-green-600'}`}>
                      {invoiceData.assurance_total.toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('advancePayment') || 'Paiement d\'Avance'}:</span>
                    <span className="font-medium">{invoiceData.advance_payment.toFixed(2)} DH</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg">
                    <span className="font-bold">{t('balanceDue') || 'Solde Dû'}:</span>
                    <span className="font-bold text-blue-600">{invoiceData.balance.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;