import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Eye, BarChart2, Check, Package, Trash2, Edit, ChevronRight, Phone, Calendar, Wallet, X, StickyNote, Pencil } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import ReceiptDetailsMiniDialog from '@/components/ReceiptDetailsMiniDialog';
import ReceiptEditDialog from '@/components/ReceiptEditDialog';
import ReceiptStatsSummary from '@/components/ReceiptStatsSummary';
import ReceiptStatistics from '@/components/ReceiptStatistics';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Textarea } from '@/components/ui/textarea';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';


interface Receipt {
  id: string;
  client_id: string | null;
  client_name?: string;
  client_phone?: string;
  created_at: string;
  total: number;
  delivery_status: string;
  montage_status: string;
  balance: number;
  advance_payment?: number;
  cost?: number;
  cost_ttc?: number;
  profit?: number;
  order_type?: string;
  call_status: string;
  time_called?: string;
  note?: string;
}

const ReceiptCard = ({ 
  receipt, 
  onPaid, 
  onDelivered, 
  onDelete, 
  onView, 
  onEdit, 
  onMontageChange,
  onCallStatusChange,
  onNoteChange 
}: {
  receipt: Receipt;
  onPaid: () => void;
  onDelivered: () => void;
  onDelete: () => void;
  onView: () => void;
  onEdit: () => void;
  onMontageChange: (status: string) => void;
  onCallStatusChange: (status: string) => void;
  onNoteChange: (note: string) => void;
}) => {
  const { t } = useLanguage();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isViewingNote, setIsViewingNote] = useState(false);
  const [noteText, setNoteText] = useState(receipt.note || '');
  const MONTAGE_STATUSES = ['UnOrdered', 'Ordered', 'InStore', 'InCutting', 'Ready', 'Paid costs'];
  const currentMontageIndex = MONTAGE_STATUSES.indexOf(receipt.montage_status);

  const handleSaveNote = () => {
    onNoteChange(noteText);
    setIsAddingNote(false);
  };

  const handleCancelNote = () => {
    setNoteText(receipt.note || '');
    setIsAddingNote(false);
  };

  const getTimeDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} ${t('minutesAgoShort')}`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ${t('hoursAgoShort')}`;
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  const getMontageStatusTranslation = (status: string) => {
    switch (status) {
      case 'UnOrdered':
        return t('unOrdered');
      case 'Ordered':
        return t('ordered');
      case 'InStore':
        return t('inStore');
      case 'InCutting':
        return t('inCutting');
      case 'Ready':
        return t('ready');
      case 'Paid costs':
        return t('paidCosts');
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-[#f2f4f8] w-full relative">
        {(() => {
          const itemsWithoutCost = (receipt.receipt_items || []).filter(item => !item.cost || item.cost === 0).length;
          return itemsWithoutCost > 0 ? (
            <div className="absolute top-0 right-0 z-10 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg" style={{ top: '4px', right: '4px' }}>
              {itemsWithoutCost}
            </div>
          ) : null;
        })()}
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold truncate">{receipt.client_name}</h3>
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{receipt.client_phone}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5 block">{getTimeDisplay(receipt.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <Badge variant={receipt.balance === 0 ? 'default' : receipt.advance_payment > 0 ? 'secondary' : 'destructive'} className="text-xs">
                      {receipt.balance === 0 ? t('paid') : receipt.advance_payment > 0 ? t('partial') : t('unpaid')}
                    </Badge>
                    <Badge variant={receipt.delivery_status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                      {receipt.delivery_status === 'Completed' ? t('completed') : t('undelivered')}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full",
                        receipt.call_status === 'Called' ? "bg-green-500" :
                        receipt.call_status === 'Unresponsive' ? "bg-red-500" :
                        "bg-gray-400"
                      )} />
                      <span className="text-xs font-medium">
                        {receipt.call_status === 'Called' ? t('called') : 
                         receipt.call_status === 'Unresponsive' ? t('unresponsive') : t('notCalled')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCallStatusChange(
                      receipt.call_status === 'Not Called' ? 'Called' :
                      receipt.call_status === 'Called' ? 'Unresponsive' : 'Not Called'
                    )}
                    className={cn("h-8 w-8", 
                      receipt.call_status === 'Called' ? "hover:bg-green-100" :
                      receipt.call_status === 'Unresponsive' ? "hover:bg-red-100" :
                      "hover:bg-gray-100"
                    )}
                  >
                    <Phone className={cn("h-4 w-4",
                      receipt.call_status === 'Called' ? "text-green-600" :
                      receipt.call_status === 'Unresponsive' ? "text-red-600" :
                      "text-gray-600"
                    )} />
                  </Button>
                  {receipt.balance > 0 && (
                    <Button variant="ghost" size="icon" onClick={onPaid} className="h-8 w-8 hover:bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={onDelivered} className="h-8 w-8 hover:bg-blue-100">
                    <Package className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onView} className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 hover:bg-red-100">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                {/* Note buttons positioned below edit and delete buttons */}
                <div className="flex gap-1 justify-end">
                  {/* Spacers to align with the edit and delete buttons above */}
                  <div className="w-8"></div> {/* Phone button spacer */}
                  {receipt.balance > 0 && <div className="w-8"></div>} {/* Paid button spacer (conditional) */}
                  <div className="w-8"></div> {/* Delivered button spacer */}
                  <div className="w-8"></div> {/* View button spacer */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsViewingNote(true)}
                    className={cn("h-8 w-8", receipt.note ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "invisible")}
                    title={t('viewNote')}
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAddingNote(true)}
                    className="h-8 w-8"
                    title={t('addNote')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('total')}</p>
                    <p className="font-medium text-blue-600">{receipt.total.toFixed(2)} DH</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('advance')}</p>
                    <p className="font-medium text-gray-600">{receipt.advance_payment?.toFixed(2) || '0.00'} DH</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">{t('balance')}</p>
                <p className="font-medium text-red-600">{receipt.balance.toFixed(2)} DH</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('cost')}</p>
                    <p className="font-medium text-orange-600">{receipt.cost_ttc?.toFixed(2) || '0.00'} DH</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('profit')}</p>
                    <p className="font-medium text-emerald-600">{(receipt.total - (receipt.cost_ttc || 0)).toFixed(2)} DH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="mb-2">
              {/* Add Note Dialog */}
              {isAddingNote && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t('enterNote')}
                    className="mb-2 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNote} className="text-xs">
                      {t('save')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelNote} className="text-xs">
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* View Note Dialog */}
              {isViewingNote && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700 mb-2">{receipt.note}</p>
                  <Button variant="outline" size="sm" onClick={() => setIsViewingNote(false)} className="text-xs">
                    {t('close')}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-6 gap-1 w-full relative">
              {MONTAGE_STATUSES.map((status, index) => {
                const isCompleted = currentMontageIndex >= index;
                const isCurrent = currentMontageIndex === index;
                return (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.02 }}
                    className={`relative h-2 rounded-full cursor-pointer transition-all ${
                      receipt.montage_status === 'UnOrdered' ? 'bg-gray-500' :
                      receipt.montage_status === 'Ordered' ? 'bg-blue-500' :
                      receipt.montage_status === 'InStore' ? 'bg-orange-500' :
                      receipt.montage_status === 'InCutting' ? 'bg-purple-500' :
                      receipt.montage_status === 'Ready' ? 'bg-pink-500' :
                      receipt.montage_status === 'Paid costs' ? 'bg-teal-500' : 'bg-gray-200'
                    }`}
                    onClick={() => onMontageChange(status)}
                  >
                    <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                      isCurrent ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {getMontageStatusTranslation(status)}
                    </div>
                    {isCurrent && (
                      <motion.div
                        initial={false}
                        layoutId="progressCircle"
                        transition={{ type: "spring", duration: 0.5 }}
                        className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 ${
                          status === 'UnOrdered' ? 'border-gray-500'
                          : status === 'Ordered' ? 'border-blue-500'
                          : status === 'InStore' ? 'border-orange-500'
                          : status === 'InCutting' ? 'border-red-500'
                          : status === 'Ready' ? 'border-purple-500'
                          : status === 'Paid costs' ? 'border-green-500'
                          : 'border-gray-500'
                        }`}
                        layoutId="currentStep"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Receipts = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const isReceiptInDateRange = (receipt: Receipt) => {
    const receiptDate = new Date(receipt.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const receiptDay = new Date(receiptDate);
    receiptDay.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return receiptDay.getTime() === today.getTime();
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return receiptDate >= weekStart;
      }
      case 'month': {
        return receiptDate.getMonth() === today.getMonth() && 
               receiptDate.getFullYear() === today.getFullYear();
      }
      case 'year':
        return receiptDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  };
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{id: string; field: string} | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startInlineEdit = (receipt: Receipt, field: string) => {
    setEditingCell({ id: receipt.id, field });
    setCellEditValue(String(receipt[field as keyof Receipt] || ''));
  };

  const endInlineEdit = async (receipt: Receipt) => {
    if (!editingCell) return;

    try {
      const value = cellEditValue.trim();
      if (value === String(receipt[editingCell.field as keyof Receipt])) {
        setEditingCell(null);
        return;
      }

      const updates: any = {
        [editingCell.field]: editingCell.field.includes('phone') ? value : 
                             isNaN(Number(value)) ? value : Number(value)
      };

      await queryClient.cancelQueries(['receipts']);

      const previousReceipts = queryClient.getQueryData(['receipts']);

      queryClient.setQueryData(['receipts'], (old: any) => {
        return old?.map((r: Receipt) => 
          r.id === receipt.id ? { ...r, [editingCell.field]: updates[editingCell.field] } : r
        );
      });

      const { error } = await supabase
        .from('receipts')
        .update(updates)
        .eq('id', receipt.id);

      if (error) {
        queryClient.setQueryData(['receipts'], previousReceipts);
        throw error;
      }

      toast({
        title: "Success",
        description: "Receipt updated successfully.",
      });
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to update receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditingCell(null);
    }
  };
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMarkAsPaid = async (id: string, total: number) => {
    try {
      const updates = { balance: 0, advance_payment: total };
      queryClient.setQueryData(['receipts', user?.id, searchTerm, paymentFilter, deliveryFilter, dateFilter], (old: any) => {
        if (!old) return old;
        return old.map((r: Receipt) => r.id === id ? { ...r, ...updates } : r);
      });
      const { error } = await supabase
        .from('receipts')
        .update({ 
          balance: 0,
          advance_payment: total 
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Receipt Updated",
        description: "Receipt has been marked as paid.",
      });
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to update receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCallStatusChange = async (id: string, newStatus: string) => {
    try {
      queryClient.setQueryData(['receipts', user?.id, searchTerm, paymentFilter, deliveryFilter, dateFilter], (old: any) => {
        if (!old) return old;
        return old.map((r: Receipt) => r.id === id ? { 
          ...r, 
          call_status: newStatus,
          time_called: newStatus === 'Not Called' ? null : new Date().toISOString()
        } : r);
      });

      const { error } = await supabase
        .from('receipts')
        .update({ 
          call_status: newStatus,
          time_called: newStatus === 'Not Called' ? null : new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Call Status Updated",
        description: `Call status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating call status:', error);
      toast({
        title: "Error",
        description: "Failed to update call status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNoteChange = async (id: string, note: string) => {
    try {
      queryClient.setQueryData(['receipts', user?.id, searchTerm, paymentFilter, deliveryFilter, dateFilter], (old: any) => {
        if (!old) return old;
        return old.map((r: Receipt) => r.id === id ? { ...r, note } : r);
      });

      const { error } = await supabase
        .from('receipts')
        .update({ note })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Note Updated",
        description: "Receipt note has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMontageStatusChange = async (id: string, newStatus: string) => {
    try {
      queryClient.setQueryData(['receipts', user?.id, searchTerm, paymentFilter, deliveryFilter, dateFilter], (old: any) => {
        if (!old) return old;
        return old.map((r: Receipt) => r.id === id ? { ...r, montage_status: newStatus } : r);
      });
      const { error } = await supabase
        .from('receipts')
        .update({ montage_status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Receipt Updated",
        description: `Montage status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating montage status:', error);
      toast({
        title: "Error",
        description: "Failed to update montage status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsDelivered = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Undelivered' : 'Completed';
      queryClient.setQueryData(['receipts', user?.id, searchTerm, paymentFilter, deliveryFilter, dateFilter], (old: any) => {
        if (!old) return old;
        return old.map((r: Receipt) => r.id === id ? { ...r, delivery_status: newStatus } : r);
      });
      const { error } = await supabase
        .from('receipts')
        .update({ delivery_status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Receipt Updated",
        description: `Receipt has been marked as ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to update receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (receipt: Receipt) => {
    setReceiptToDelete(receipt);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!receiptToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('receipts')
        .update({ is_deleted: true })
        .eq('id', receiptToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries(['receipts']);
      toast({
        title: "Receipt Deleted",
        description: "Receipt has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: "Failed to delete receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchReceipts = async () => {
    if (!user) return [];

    const { data: receiptsData, error: receiptsError } = await supabase
      .from('receipts')
      .select(`
        *,
        clients (
          name,
          phone
        ),
        receipt_items (
          id,
          quantity,
          price,
          cost,
          profit,
          custom_item_name,
          paid_at_delivery,
          product:product_id (
            name,
            category
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (receiptsError) throw receiptsError;

    return receiptsData.map(receipt => ({
      ...receipt,
      client_name: receipt.clients?.name || 'No Client',
      client_phone: receipt.clients?.phone || 'N/A',
      balance: receipt.total - (receipt.advance_payment || 0)
    }));
  };

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts', user?.id, searchTerm, paymentFilter, deliveryFilter, dateFilter],
    queryFn: fetchReceipts,
    enabled: !!user,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1
  });

  const filteredReceipts = React.useMemo(() => {
    return receipts.filter(receipt => {
      const matchesSearch = 
        (receipt.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         receipt.client_phone?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPayment = 
        paymentFilter === 'all' ? true :
        paymentFilter === 'paid' ? receipt.balance === 0 :
        paymentFilter === 'partial' ? (receipt.balance > 0 && receipt.advance_payment > 0) :
        receipt.balance === receipt.total;

      const matchesDelivery = 
        deliveryFilter === 'all' ? true :
        receipt.delivery_status === deliveryFilter;

      const matchesDate = isReceiptInDateRange(receipt);

      return matchesSearch && matchesPayment && matchesDelivery && matchesDate;
    });
  }, [receipts, searchTerm, paymentFilter, deliveryFilter, dateFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return format(date, 'yy/MM/dd HH:mm');
    }
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Link to="/new-receipt">
            <Button className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              {t('newReceipt')}
            </Button>
          </Link>
          <ReceiptStatsSummary receipts={receipts} />
        </div>
        <Button
          variant="outline"
          size="lg"
          className="rounded-xl border-2 bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-400 hover:border-emerald-500 transition-all duration-200 shadow-lg hover:shadow-emerald-500/20"
          onClick={() => setIsStatsOpen(true)}
        >
          <BarChart2 className="h-5 w-5 mr-2" />
          {t('statistics')}
        </Button>
      </div>

      <div className="mb-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder={t('searchReceipts')} 
              className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <Select
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value)}
            >
              <SelectTrigger className={cn(
                "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
                dateFilter !== 'all'
                  ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                  : "bg-white/10 hover:bg-white/20"
              )}>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('date')}>
                  {dateFilter === 'all' ? t('date') :
                   dateFilter === 'today' ? t('today') :
                   dateFilter === 'week' ? t('thisWeek') :
                   dateFilter === 'month' ? t('thisMonth') : t('thisYear')}
                </SelectValue>
                {dateFilter !== 'all' && (
                  <X
                    className="h-3 w-3 ml-auto hover:text-blue-900 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFilter('all');
                    }}
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDates')}</SelectItem>
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="week">{t('thisWeek')}</SelectItem>
                <SelectItem value="month">{t('thisMonth')}</SelectItem>
                <SelectItem value="year">{t('thisYear')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select
              value={paymentFilter}
              onValueChange={(value) => setPaymentFilter(value)}
            >
              <SelectTrigger className={cn(
                "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
                paymentFilter === 'paid' ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" :
                paymentFilter === 'partial' ? "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200" :
                paymentFilter === 'unpaid' ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" :
                "bg-white/10 hover:bg-white/20"
              )}>
                <Wallet className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('payment')}>
                  {paymentFilter === 'all' ? t('payment') :
                   paymentFilter === 'paid' ? t('paid') :
                   paymentFilter === 'partial' ? t('partial') : t('unpaid')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-600">{t('allPayments')}</SelectItem>
                <SelectItem value="paid" className="text-green-600">{t('paid')}</SelectItem>
                <SelectItem value="partial" className="text-yellow-600">{t('partial')}</SelectItem>
                <SelectItem value="unpaid" className="text-red-600">{t('unpaid')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Delivery Filter */}
            <Select
              value={deliveryFilter}
              onValueChange={(value) => setDeliveryFilter(value)}
            >
              <SelectTrigger className={cn(
                "w-[140px] border-2 shadow-md rounded-xl gap-2 transition-all duration-200",
                deliveryFilter === 'Completed' ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" :
                deliveryFilter === 'Undelivered' ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200" :
                "bg-white/10 hover:bg-white/20"
              )}>
                <Package className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('deliveryLabel')}>
                  {deliveryFilter === 'all' ? t('deliveryLabel') :
                   deliveryFilter === 'Completed' ? t('delivered') : t('undelivered')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-600">{t('allDeliveries')}</SelectItem>
                <SelectItem value="Completed" className="text-green-600">{t('delivered')}</SelectItem>
                <SelectItem value="Undelivered" className="text-orange-600">{t('undelivered')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-6">
          <AnimatePresence>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </Card>
              ))
            ) : filteredReceipts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500">
                {t('noReceiptsFound')}
              </div>
            ) : (
              filteredReceipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onPaid={() => handleMarkAsPaid(receipt.id, receipt.total)}
                  onDelivered={() => handleMarkAsDelivered(receipt.id, receipt.delivery_status)}
                  onDelete={() => openDeleteDialog(receipt)}
                  onView={() => setSelectedReceipt(receipt)}
                  onEdit={() => setEditingReceipt(receipt)}
                  onMontageChange={(status) => handleMontageStatusChange(receipt.id, status)}
                  onCallStatusChange={(status) => handleCallStatusChange(receipt.id, status)}
                  onNoteChange={(note) => handleNoteChange(receipt.id, note)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

      <ReceiptDetailsMiniDialog
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
        onEdit={setEditingReceipt}
        onDelete={handleDelete}
      />

      <ReceiptEditDialog
        isOpen={!!editingReceipt}
        onClose={() => setEditingReceipt(null)}
        receipt={editingReceipt}
      />

      <ReceiptStatistics
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        receipts={receipts}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('deleteReceipt') || 'Delete Receipt'}
        description={t('deleteReceiptConfirmation') || 'Are you sure you want to delete this receipt? This action cannot be undone.'}
        itemName={receiptToDelete?.client_name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Receipts;