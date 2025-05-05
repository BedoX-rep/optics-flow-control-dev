import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageTitle from '@/components/PageTitle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import ReceiptDetailsMiniDialog from '@/components/ReceiptDetailsMiniDialog';
import ReceiptEditDialog from '@/components/ReceiptEditDialog';
import ReceiptStatsSummary from '@/components/ReceiptStatsSummary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow, format } from 'date-fns';


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
}

const Receipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [editingCell, setEditingCell] = useState<{id: string; field: string} | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

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

      const { error } = await supabase
        .from('receipts')
        .update(updates)
        .eq('id', receipt.id);

      if (error) throw error;

      fetchReceipts();
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
      const { error } = await supabase
        .from('receipts')
        .update({ 
          balance: 0,
          advance_payment: total 
        })
        .eq('id', id);

      if (error) throw error;

      fetchReceipts();
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

  const MONTAGE_STATUSES = ['UnOrdered', 'Ordered', 'InStore', 'InCutting', 'Ready', 'Paid costs'];

  const handleMontageStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .update({ montage_status: newStatus })
        .eq('id', id);

      if (error) throw error;

      fetchReceipts();
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
      const { error } = await supabase
        .from('receipts')
        .update({ delivery_status: newStatus })
        .eq('id', id);

      if (error) throw error;

      fetchReceipts();
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      setReceipts(receipts.filter(receipt => receipt.id !== id));
      toast({
        title: "Receipt Deleted",
        description: "Receipt has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: "Failed to delete receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchReceipts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

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
            product:product_id (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      const formattedReceipts = receiptsData.map(receipt => ({
        ...receipt,
        client_name: receipt.clients?.name || 'No Client',
        client_phone: receipt.clients?.phone || 'N/A',
        balance: receipt.total - (receipt.advance_payment || 0) // Calculate balance
      }));

      setReceipts(formattedReceipts);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: "Error",
        description: "Failed to load receipts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReceipts();
    }
  }, [dateFilter]);

  const filteredReceipts = receipts.filter(receipt => {
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
    <div className="flex flex-col h-[calc(100svh-68px)]" style={{
      width: "100%",
      paddingLeft: "1rem",
      paddingRight: "1rem",
      paddingTop: "1.5rem",
      transition: "all 0.2s ease",
      minHeight: "calc(100svh - 68px)",
    }}>
      <div className="flex flex-row items-end justify-between gap-2 flex-wrap mb-6 w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/new-receipt">
            <Button className="!px-5 !py-2.5 rounded-full font-semibold bg-black text-white hover:bg-neutral-800 border border-black shadow flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
          </Link>
          <span>
            <ReceiptStatsSummary receipts={receipts} />
          </span>
        </div>
      </div>

      <Card className="mb-6 card-shadow border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input 
                type="text" 
                placeholder="Search receipts..." 
                className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg h-9 text-sm focus:ring-2 focus:ring-black focus:border-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px] border-gray-200 h-9">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select defaultValue="all" onValueChange={(value) => setPaymentFilter(value)}>
                <SelectTrigger className="w-[150px] border-gray-200 h-9">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all" onValueChange={(value) => setDeliveryFilter(value)}>
                <SelectTrigger className="w-[150px] border-gray-200 h-9">
                  <SelectValue placeholder="Delivery Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deliveries</SelectItem>
                  <SelectItem value="Completed">Delivered</SelectItem>
                  <SelectItem value="Undelivered">Undelivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-grow min-h-0 flex flex-col">
        <div className="w-full h-full flex-grow bg-white rounded-xl border border-neutral-200 shadow-sm overflow-auto">
          <Table className="min-w-[980px] w-full">
            <TableHeader>
              <TableRow className="border-b border-neutral-100 bg-[#f6f6f7] sticky top-0 z-10">
                <TableHead className="text-black text-xs font-semibold">Client Info</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right">Total</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right">Advance</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right">Balance</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right">Cost TTC</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right">Profit</TableHead>
                <TableHead className="text-black text-xs font-semibold">Payment Status</TableHead>
                <TableHead className="text-black text-xs font-semibold">Delivery Status</TableHead>
                <TableHead className="text-black text-xs font-semibold">Montage Status</TableHead>
                <TableHead className="text-black text-xs font-semibold">Created At</TableHead>
                <TableHead className="text-black text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10 animate-pulse">
                    <div className="h-6 w-1/2 bg-[#F7FAFC] rounded mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10 text-neutral-400 font-medium">
                    No receipts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-[#FAFAFA] transition-all group">
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="font-medium hover:underline cursor-pointer" onClick={() => startInlineEdit(receipt, "client_name")}>
                          {editingCell?.id === receipt.id && editingCell.field === "client_name" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(receipt)}
                              autoFocus
                            />
                          ) : receipt.client_name}
                        </span>
                        <span className="text-sm text-neutral-500 hover:underline cursor-pointer" onClick={() => startInlineEdit(receipt, "client_phone")}>
                          {editingCell?.id === receipt.id && editingCell.field === "client_phone" ? (
                            <input
                              type="text"
                              className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-full focus:ring-2 focus:ring-black"
                              value={cellEditValue}
                              onChange={e => setCellEditValue(e.target.value)}
                              onBlur={() => endInlineEdit(receipt)}
                              autoFocus
                            />
                          ) : receipt.client_phone || 'Add phone'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className="font-semibold text-black hover:underline cursor-pointer"
                        tabIndex={0}
                        title="Edit"
                        onClick={() => startInlineEdit(receipt, "total")}
                      >
                        {editingCell?.id === receipt.id && editingCell.field === "total" ? (
                          <input
                            type="number"
                            className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-32 focus:ring-2 focus:ring-black text-right"
                            value={cellEditValue}
                            onChange={e => setCellEditValue(e.target.value)}
                            onBlur={() => endInlineEdit(receipt)}
                            autoFocus
                          />
                        ) : `${receipt.total.toFixed(2)} DH`}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className="font-semibold text-black hover:underline cursor-pointer"
                        tabIndex={0}
                        title="Edit"
                        onClick={() => startInlineEdit(receipt, "advance_payment")}
                      >
                        {editingCell?.id === receipt.id && editingCell.field === "advance_payment" ? (
                          <input
                            type="number"
                            className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-32 focus:ring-2 focus:ring-black text-right"
                            value={cellEditValue}
                            onChange={e => setCellEditValue(e.target.value)}
                            onBlur={() => endInlineEdit(receipt)}
                            autoFocus
                          />
                        ) : `${receipt.advance_payment?.toFixed(2) || '0.00'} DH`}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span 
                        className={`border rounded-full py-1 px-3 text-sm font-medium ${
                          receipt.balance > 0 
                            ? 'bg-red-100 border-red-200 text-red-700' 
                            : 'bg-green-50 border-green-100 text-green-700'
                        }`}
                      >
                        {(receipt.total - (receipt.advance_payment || 0)).toFixed(2)} DH
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className="font-semibold text-black hover:underline cursor-pointer"
                        tabIndex={0}
                        title="Edit"
                        onClick={() => startInlineEdit(receipt, "cost_ttc")}
                      >
                        {editingCell?.id === receipt.id && editingCell.field === "cost_ttc" ? (
                          <input
                            type="number"
                            className="border border-neutral-300 bg-[#fafafa] px-2 py-1 rounded text-sm w-32 focus:ring-2 focus:ring-black text-right"
                            value={cellEditValue}
                            onChange={e => setCellEditValue(e.target.value)}
                            onBlur={() => endInlineEdit(receipt)}
                            autoFocus
                          />
                        ) : `${receipt.cost_ttc?.toFixed(2) || '0.00'} DH`}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="border rounded-full py-0.5 px-2 text-xs font-medium bg-gray-50 border-neutral-100 text-neutral-700">
                        {(receipt.total - (receipt.cost_ttc || 0)).toFixed(2)} DH
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        receipt.balance === 0 ? 'bg-green-100 text-green-800' :
                        receipt.advance_payment > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {receipt.balance === 0 ? 'Paid' : 
                         receipt.advance_payment > 0 ? 'Partially Paid' : 'Unpaid'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        receipt.delivery_status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {receipt.delivery_status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            const currentIndex = MONTAGE_STATUSES.indexOf(receipt.montage_status);
                            const prevIndex = (currentIndex - 1 + MONTAGE_STATUSES.length) % MONTAGE_STATUSES.length;
                            handleMontageStatusChange(receipt.id, MONTAGE_STATUSES[prevIndex]);
                          }}
                        >
                          <span className="text-gray-600">⟵</span>
                        </Button>
                        <Select
                          value={receipt.montage_status}
                          onValueChange={(value) => handleMontageStatusChange(receipt.id, value)}
                        >
                          <SelectTrigger className={`h-7 w-[120px] text-xs font-medium ${
                            receipt.montage_status === 'UnOrdered' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            receipt.montage_status === 'Ordered' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            receipt.montage_status === 'InStore' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            receipt.montage_status === 'InCutting' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            receipt.montage_status === 'Ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            receipt.montage_status === 'Paid costs' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            ''
                          }`}>
                            <SelectValue>{receipt.montage_status}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {MONTAGE_STATUSES.map((status) => (
                              <SelectItem 
                                key={status} 
                                value={status}
                                className={`text-xs ${
                                  status === 'UnOrdered' ? 'text-gray-700' :
                                  status === 'Ordered' ? 'text-blue-700' :
                                  status === 'InStore' ? 'text-orange-700' :
                                  status === 'InCutting' ? 'text-amber-700' :
                                  status === 'Ready' ? 'text-emerald-700' :
                                  ''
                                }`}
                              >
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            const currentIndex = MONTAGE_STATUSES.indexOf(receipt.montage_status);
                            const nextIndex = (currentIndex + 1) % MONTAGE_STATUSES.length;
                            handleMontageStatusChange(receipt.id, MONTAGE_STATUSES[nextIndex]);
                          }}
                        >
                          <span className="text-gray-600">⟶</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {formatDate(receipt.created_at)}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {receipt.balance > 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleMarkAsPaid(receipt.id, receipt.total)}
                            className="hover:bg-green-100"
                            title="Mark as Paid"
                          >
                            <span className="text-green-600">✓</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleMarkAsDelivered(receipt.id, receipt.delivery_status)}
                          className="hover:bg-blue-100"
                          title={`${receipt.delivery_status === 'Completed' ? 'Mark as Undelivered' : 'Mark as Delivered'}`}
                        >
                          <span className="text-blue-600">📦</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(receipt.id)}
                          className="hover:bg-red-100"
                          title="Delete Receipt"
                        >
                          <span className="text-red-600">🗑️</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedReceipt(receipt)}
                          className="hover:bg-black/10"
                        >
                          <Eye className="h-4 w-4 text-black" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingReceipt(receipt)}
                          className="hover:bg-black/10"
                        >
                          ✏️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
        onUpdate={fetchReceipts}
      />
    </div>
  );
};

export default Receipts;