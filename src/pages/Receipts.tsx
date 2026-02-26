import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Eye, BarChart2, Check, Package, Trash2, Edit, ChevronRight, Phone, Calendar, Wallet, StickyNote, Pencil, MoreHorizontal, X, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ReceiptsHero from '@/components/receipts/ReceiptsHero';
import ReceiptFilters from '@/components/receipts/ReceiptFilters';
import { useNavigate } from 'react-router-dom';


interface ReceiptData {
  id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  created_at: string;
  total: number;
  delivery_status: string;
  montage_status: string;
  balance: number;
  advance_payment: number;
  cost?: number;
  cost_ttc?: number;
  profit?: number;
  order_type?: string;
  call_status: string;
  time_called?: string;
  note?: string;
  user_id: string;
  montage_costs?: number;
  receipt_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    cost: number;
    profit: number;
    custom_item_name: string;
    paid_at_delivery: boolean;
    product: {
      id: string;
      name: string;
      category: string;
      company?: string;
      price?: number;
      cost_ttc?: number;
      stock_status?: string;
    } | null;
  }>;
}

const ITEMS_PER_PAGE = 20;

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
  receipt: ReceiptData;
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
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isViewingNote, setIsViewingNote] = useState(false);
  const [noteText, setNoteText] = useState(receipt.note || '');
  const MONTAGE_STATUSES = ['UnOrdered', 'Ordered', 'InStore', 'InCutting', 'Ready', 'Paid costs'];
  const currentMontageIndex = MONTAGE_STATUSES.indexOf(receipt.montage_status);

  const handleEditNote = () => {
    setNoteText(receipt.note || '');
    setIsEditingNote(true);
    setIsViewingNote(false);
  };

  const handleSaveNote = () => {
    const trimmedNote = noteText.trim();
    onNoteChange(trimmedNote);
    setIsEditingNote(false);
  };

  const handleCancelNote = () => {
    setNoteText(receipt.note || '');
    setIsEditingNote(false);
  };

  const handleViewNote = () => {
    setIsViewingNote(true);
    setIsEditingNote(false);
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

  const itemsWithoutCost = (receipt.receipt_items || []).filter(item => !item.cost || item.cost === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className={cn(
        "border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50/30 to-seafoam-50/20 hover:border-l-teal-600 hover:shadow-lg transition-all duration-200 flex flex-col"
      )}>
        {/* Header Section */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-200">
                  <div className="text-teal-700 font-poppins font-semibold text-lg">
                    {receipt.client_name?.charAt(0) || 'C'}
                  </div>
                </div>
                {itemsWithoutCost > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {itemsWithoutCost}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-poppins font-semibold text-base text-teal-800 truncate">{receipt.client_name}</h3>
                <div className="flex items-center gap-1.5 text-teal-600 mt-1">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{receipt.client_phone}</span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5 block">{getTimeDisplay(receipt.created_at)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-poppins font-semibold text-teal-700">{receipt.total.toFixed(2)} DH</div>
              <div className="text-xs text-gray-500">{t('total')}</div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={receipt.balance === 0 ? 'default' : receipt.advance_payment > 0 ? 'secondary' : 'destructive'}
              className={cn("text-xs border",
                receipt.balance === 0 ? "bg-green-100 text-green-700 border-green-200" :
                  receipt.advance_payment > 0 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                    "bg-red-100 text-red-700 border-red-200"
              )}>
              {receipt.balance === 0 ? t('paid') : receipt.advance_payment > 0 ? t('partial') : t('unpaid')}
            </Badge>
            <Badge variant={receipt.delivery_status === 'Completed' ? 'default' : 'secondary'}
              className={cn("text-xs border",
                receipt.delivery_status === 'Completed' ?
                  "bg-emerald-100 text-emerald-700 border-emerald-200" :
                  "bg-orange-100 text-orange-700 border-orange-200"
              )}>
              {receipt.delivery_status === 'Completed' ? t('completed') : t('undelivered')}
            </Badge>
            {receipt.order_type && (
              <Badge className="text-xs border bg-purple-100 text-purple-700 border-purple-200">
                {t(receipt.order_type.toLowerCase())}
              </Badge>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-50 border border-teal-200">
              <div className={cn("w-2 h-2 rounded-full",
                receipt.call_status === 'Called' ? "bg-green-500" :
                  receipt.call_status === 'Unresponsive' ? "bg-red-500" :
                    "bg-gray-400"
              )} />
              <span className="text-xs font-medium text-teal-700">
                {receipt.call_status === 'Called' ? t('called') :
                  receipt.call_status === 'Unresponsive' ? t('unresponsive') : t('notCalled')}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={cn(
          "px-4 py-2",
          (isEditingNote || isViewingNote) ? "flex-none" : "flex-1"
        )}>
          {/* Action Buttons Row */}
          <div className="flex justify-between items-center gap-2 mb-4">
            {/* Left side - Call, Paid, Delivery buttons */}
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCallStatusChange(
                  receipt.call_status === 'Not Called' ? 'Called' :
                    receipt.call_status === 'Called' ? 'Unresponsive' : 'Not Called'
                )}
                className={cn(
                  "h-8 w-8 p-0 rounded-full shadow-sm transition-all duration-200",
                  receipt.call_status === 'Called' ? "bg-green-500 hover:bg-green-600 text-white" :
                    receipt.call_status === 'Unresponsive' ? "bg-red-500 hover:bg-red-600 text-white" :
                      "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
                title={receipt.call_status === 'Called' ? t('markUnresponsive') :
                  receipt.call_status === 'Unresponsive' ? t('markNotCalled') : t('markCalled')}
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>

              {receipt.balance > 0 && (
                <Button
                  size="sm"
                  onClick={onPaid}
                  className="h-8 w-8 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                  title={t('markPaid')}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                size="sm"
                onClick={onDelivered}
                className={cn(
                  "h-8 w-8 p-0 rounded-full shadow-sm text-white",
                  receipt.delivery_status === 'Completed'
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-orange-500 hover:bg-orange-600"
                )}
                title={receipt.delivery_status === 'Completed' ? t('markUndelivered') : t('markDelivered')}
              >
                <Package className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Right side - View, Edit, Delete, Note buttons */}
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={onView}
                className="h-8 w-8 p-0 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                title={t('view')}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                title={t('edit')}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>

              {/* Pencil icon for adding/editing notes */}
              <Button
                size="sm"
                onClick={handleEditNote}
                className="h-8 w-8 p-0 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                title={receipt.note ? t('editNote') : t('addNote')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              {/* View note button - only shown when there's a note and not editing */}
              {receipt.note && !isEditingNote && (
                <Button
                  size="sm"
                  onClick={handleViewNote}
                  className="h-8 w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm"
                  title={t('viewNote')}
                >
                  <StickyNote className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-sm"
                title={t('delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">{t('advance')}</p>
              <p className="font-inter font-semibold text-teal-600">{receipt.advance_payment?.toFixed(2) || '0.00'} DH</p>
            </div>
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">{t('balance')}</p>
              <p className="font-inter font-semibold text-red-600">{receipt.balance.toFixed(2)} DH</p>
            </div>
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">{t('cost')}</p>
              <div className="space-y-0.5">
                <p className="font-inter font-semibold text-orange-600">{((receipt.cost_ttc || 0) + (receipt.montage_costs || 0)).toFixed(2)} DH</p>
                {(receipt.montage_costs || 0) > 0 && (
                  <p className="text-xs text-gray-500">
                    {t('products')}: {(receipt.cost_ttc || 0).toFixed(2)} DH + ADC: {(receipt.montage_costs || 0).toFixed(2)} DH
                  </p>
                )}
              </div>
            </div>
            <div className="bg-teal-50/30 border border-teal-200 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-poppins font-medium mb-1">{t('profit')}</p>
              <p className="font-inter font-semibold text-emerald-600">{(receipt.total - (receipt.cost_ttc || 0) - (receipt.montage_costs || 0)).toFixed(2)} DH</p>
            </div>
          </div>

          {/* Montage Progress */}
          <div className="mb-4">
            <p className="text-xs text-teal-700 font-poppins font-medium mb-3">{t('montageLabel')}</p>
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-1">
                {MONTAGE_STATUSES.map((status, index) => {
                  const isCurrent = currentMontageIndex === index;
                  const isPassed = currentMontageIndex > index;

                  // Get the current step's color theme
                  const getCurrentStepColorTheme = () => {
                    switch (currentMontageIndex) {
                      case 0: return { main: 'bg-gray-500', light: 'bg-gray-400', border: 'border-gray-500' }; // UnOrdered
                      case 1: return { main: 'bg-blue-500', light: 'bg-blue-400', border: 'border-blue-500' }; // Ordered
                      case 2: return { main: 'bg-orange-500', light: 'bg-orange-400', border: 'border-orange-500' }; // InStore
                      case 3: return { main: 'bg-yellow-500', light: 'bg-yellow-400', border: 'border-yellow-500' }; // InCutting
                      case 4: return { main: 'bg-purple-500', light: 'bg-purple-400', border: 'border-purple-500' }; // Ready
                      case 5: return { main: 'bg-green-500', light: 'bg-green-400', border: 'border-green-500' }; // Paid costs
                      default: return { main: 'bg-teal-500', light: 'bg-teal-400', border: 'border-teal-500' };
                    }
                  };

                  const colorTheme = getCurrentStepColorTheme();

                  // All bars use the current step's color theme
                  const getStepColor = () => {
                    if (isCurrent) {
                      return colorTheme.main;
                    } else if (isPassed) {
                      return colorTheme.light;
                    } else {
                      // Future steps use light gray
                      return 'bg-gray-200';
                    }
                  };

                  // Border color matches the current step's color when current
                  const getBorderColor = () => {
                    if (isCurrent) {
                      return colorTheme.border;
                    }
                    return 'border-gray-300';
                  };

                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "relative h-2 rounded-full cursor-pointer transition-all",
                        getStepColor()
                      )}
                      onClick={() => onMontageChange(status)}
                    >
                      {isCurrent && (
                        <motion.div
                          initial={false}
                          layoutId={`progressCircle-${receipt.id}`}
                          transition={{ type: "spring", duration: 0.5 }}
                          className={cn(
                            "absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2",
                            getBorderColor()
                          )}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <div className="grid grid-cols-6 gap-1 text-xs">
                {MONTAGE_STATUSES.map((status, index) => {
                  const isCurrent = currentMontageIndex === index;

                  return (
                    <div key={status} className="text-center">
                      <span className={cn(
                        "text-xs font-medium leading-tight block",
                        isCurrent ? "text-teal-700 font-semibold" : "text-gray-600"
                      )}>
                        {getMontageStatusTranslation(status).slice(0, 8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Note Section */}
          {(isEditingNote || isViewingNote) && (
            <div className="mt-4">
              {/* Edit Note */}
              {isEditingNote && (
                <div className="p-3 bg-teal-50/30 border border-teal-200 rounded-lg">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t('enterNote')}
                    className="mb-3 text-sm border-teal-200 bg-white focus:border-teal-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNote} className="text-xs bg-teal-600 hover:bg-teal-700">
                      {t('save')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelNote}
                      className="text-xs border-teal-200 text-teal-700 hover:bg-teal-50">
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* View Note */}
              {isViewingNote && receipt.note && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="max-h-24 overflow-y-auto mb-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{receipt.note}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsViewingNote(false)}
                    className="text-xs border-teal-200 text-teal-700 hover:bg-teal-50">
                    {t('close')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Section */}
        {!(isEditingNote || isViewingNote) && (
          <div className="p-4 pt-0 flex-shrink-0">
          </div>
        )}
      </Card>
    </motion.div>
  );
};

const Receipts = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, dateFilter]);

  const isReceiptInDateRange = (receipt: ReceiptData) => {
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
  const [montageFilter, setMontageFilter] = useState('all');

  useEffect(() => {
    setPage(0);
  }, [paymentFilter, deliveryFilter, montageFilter]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptData | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<ReceiptData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

  const startInlineEdit = (receipt: ReceiptData, field: string) => {
    setEditingCell({ id: receipt.id, field });
    setCellEditValue(String(receipt[field as keyof ReceiptData] || ''));
  };

  const endInlineEdit = async (receipt: ReceiptData) => {
    if (!editingCell) return;

    try {
      const value = cellEditValue.trim();
      if (value === String(receipt[editingCell.field as keyof ReceiptData])) {
        setEditingCell(null);
        return;
      }

      const updates: any = {
        [editingCell.field]: editingCell.field.includes('phone') ? value :
          isNaN(Number(value)) ? value : Number(value)
      };

      await queryClient.cancelQueries({ queryKey: ['receipts', user?.id] });

      const previousReceipts = queryClient.getQueryData(['receipts', user?.id]);

      queryClient.setQueryData(['receipts', user?.id], (old: ReceiptData[] | undefined) => {
        return old?.map((r: ReceiptData) =>
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
      queryClient.setQueryData(['receipts', user?.id], (old: ReceiptData[] | undefined) => {
        if (!old) return old;
        return old.map((r: ReceiptData) => r.id === id ? { ...r, ...updates } : r);
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
      queryClient.setQueryData(['receipts', user?.id], (old: ReceiptData[] | undefined) => {
        if (!old) return old;
        return old.map((r: ReceiptData) => r.id === id ? {
          ...r,
          call_status: newStatus,
          time_called: newStatus === 'Not Called' ? undefined : new Date().toISOString()
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
      queryClient.setQueryData(['receipts', user?.id], (old: any) => {
        if (!old) return old;
        return old.map((r: any) => r.id === id ? { ...r, note } : r);
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
      queryClient.setQueryData(['receipts', user?.id], (old: any) => {
        if (!old) return old;
        return old.map((r: any) => r.id === id ? { ...r, montage_status: newStatus } : r);
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
      queryClient.setQueryData(['receipts', user?.id], (old: any) => {
        if (!old) return old;
        return old.map((r: any) => r.id === id ? { ...r, delivery_status: newStatus } : r);
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

  const openDeleteDialog = (receipt: ReceiptData) => {
    setReceiptToDelete(receipt);
    setIsDeleteDialogOpen(true);
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

      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast({
        title: "Receipt Deleted",
        description: "Receipt has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setReceiptToDelete(null);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: "Failed to update receipt. Please try again.",
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
            id,
            name,
            category,
            company,
            price,
            cost_ttc,
            stock_status
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
      balance: receipt.total - (receipt.advance_payment || 0),
      advance_payment: receipt.advance_payment || 0,
      call_status: receipt.call_status || 'Not Called',
      user_id: receipt.user_id || '',
    })) as ReceiptData[];
  };

  const { data: receipts = [], isLoading } = useQuery<ReceiptData[]>({
    queryKey: ['receipts', user?.id],
    queryFn: fetchReceipts,
    enabled: !!user,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1
  });

  const filteredReceipts = useMemo(() => {
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

      const matchesMontage =
        montageFilter === 'all' ? true :
          receipt.montage_status === montageFilter;

      const matchesDate = isReceiptInDateRange(receipt);

      return matchesSearch && matchesPayment && matchesDelivery && matchesMontage && matchesDate;
    });
  }, [receipts, searchTerm, paymentFilter, deliveryFilter, montageFilter, dateFilter]);

  const paginatedReceipts = useMemo(() => {
    const startIndex = page * ITEMS_PER_PAGE;
    return filteredReceipts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReceipts, page]);

  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);

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
    <div className="w-full min-h-screen bg-slate-50/50 pb-20 overflow-x-hidden animate-in fade-in duration-700">
      <ReceiptsHero
        onNewReceipt={() => navigate('/new-receipt')}
        onViewStats={() => setIsStatsOpen(true)}
        receipts={receipts}
      />

      <div className="w-full px-6 lg:px-10 relative z-20">
        <div className="mb-10 p-3 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center flex-1 min-w-[300px] px-5 py-3 bg-slate-50/50 shadow-inner rounded-2xl border border-slate-100/50 group focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
              <Search className="h-5 w-5 text-teal-600 mr-3 transition-transform group-focus-within:scale-110" />
              <input
                type="text"
                placeholder={t('searchReceipts')}
                className="bg-transparent border-none text-sm font-black text-slate-700 focus:ring-0 w-full outline-none placeholder:text-slate-400/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="hidden lg:block h-10 w-px bg-slate-200/60" />

            <div className="flex items-center gap-3">
              <ReceiptFilters
                dateFilter={dateFilter}
                paymentFilter={paymentFilter}
                deliveryFilter={deliveryFilter}
                montageFilter={montageFilter}
                onFilterChange={(key, value) => {
                  if (key === 'date') setDateFilter(value);
                  if (key === 'payment') setPaymentFilter(value);
                  if (key === 'delivery') setDeliveryFilter(value);
                  if (key === 'montage') setMontageFilter(value);
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 lg:pb-10">
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
              <div className="col-span-full text-center py-20 bg-white/50 backdrop-blur-sm rounded-[32px] border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{t('noReceiptsFound')}</h3>
                <p className="text-slate-500 font-medium">{t('noReceiptsFoundDesc') || 'Try adjusting your filters or search term'}</p>
              </div>
            ) : (
              paginatedReceipts.map((receipt) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-8 mb-12">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
                className="flex items-center gap-1 bg-white hover:bg-teal-50 text-teal-700 border-teal-100 h-10 px-4 rounded-xl shadow-sm transition-all"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                {t('previous')}
              </Button>

              <div className="flex items-center gap-1.5 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className={cn(
                        "w-10 h-10 rounded-xl font-bold transition-all",
                        page === pageNum
                          ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                          : "bg-white text-slate-600 border-slate-100 hover:bg-teal-50 hover:text-teal-700"
                      )}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}

                {totalPages > 5 && (page < totalPages - 3) && <span className="text-slate-400 mx-1">...</span>}
                {totalPages > 5 && (page < totalPages - 3) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages - 1)}
                    className="w-10 h-10 rounded-xl font-bold bg-white text-slate-600 border-slate-100 hover:bg-teal-50 hover:text-teal-700"
                  >
                    {totalPages}
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="flex items-center gap-1 bg-white hover:bg-teal-50 text-teal-700 border-teal-100 h-10 px-4 rounded-xl shadow-sm transition-all"
              >
                {t('next')}
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>

            <div className="text-sm font-medium text-slate-500 bg-slate-100/50 px-4 py-1.5 rounded-full">
              {t('showing')} <span className="text-teal-700 font-bold">{page * ITEMS_PER_PAGE + 1}</span> {t('to')} <span className="text-teal-700 font-bold">{Math.min((page + 1) * ITEMS_PER_PAGE, filteredReceipts.length)}</span> {t('of')} <span className="text-teal-700 font-bold">{filteredReceipts.length}</span> {t('receipts')}
            </div>
          </div>
        )}

        <ReceiptDetailsMiniDialog
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receipt={selectedReceipt}
          onEdit={setEditingReceipt}
          onDelete={openDeleteDialog}
        />

        <ReceiptEditDialog
          isOpen={!!editingReceipt}
          onClose={() => setEditingReceipt(null)}
          receipt={editingReceipt as any}
        />

        <ReceiptStatistics
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          receipts={receipts}
        />

        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setReceiptToDelete(null);
          }}
          onConfirm={handleDelete}
          title={t('deleteReceipt') || 'Delete Receipt'}
          message={t('deleteReceiptConfirmation') || `Are you sure you want to delete the receipt for ${receiptToDelete?.client_name}? This action cannot be undone.`}
          itemName={`Receipt for ${receiptToDelete?.client_name}`}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
};

export default Receipts;