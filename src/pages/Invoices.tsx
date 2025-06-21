
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, DollarSign, Phone, MapPin, Filter, X, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import AddInvoiceDialog from '@/components/AddInvoiceDialog';
import EditInvoiceDialog from '@/components/EditInvoiceDialog';
import InvoiceDetailsDialog from '@/components/InvoiceDetailsDialog';
import { Invoice } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

const InvoiceCard = ({ 
  invoice, 
  onView, 
  onEdit, 
  onDelete 
}: {
  invoice: Invoice;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-200 w-full">
        <CardContent className="p-4">
          {/* Header Section with Invoice Number, Client, and Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-gray-800 truncate">
                    {invoice.invoice_number}
                  </h3>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600 truncate font-medium mb-1">
                {invoice.client_name}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
                {invoice.due_date && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-orange-600">
                      {t('due')}: {format(new Date(invoice.due_date), 'MMM dd')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onView}
                className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onEdit}
                className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDelete}
                className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Main Total Amount - Prominent Display */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 mb-3 border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{t('totalAmount') || 'Total Amount'}</p>
                <p className="text-xl font-bold text-primary">{invoice.total.toFixed(2)} DH</p>
              </div>
              <DollarSign className="h-5 w-5 text-primary/60" />
            </div>
          </div>

          {/* Compact Financial Details */}
          <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-500">{t('subtotal') || 'Subtotal'}</p>
              <p className="text-sm font-semibold text-gray-800">
                {invoice.subtotal.toFixed(2)} DH
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-500">{t('tax') || 'Tax'}</p>
              <p className="text-sm font-semibold text-green-600">
                {(invoice.total - invoice.subtotal).toFixed(2)} DH
              </p>
            </div>
          </div>

          {/* Contact Information */}
          {(invoice.client_phone || invoice.client_address) && (
            <div className="space-y-1 mb-3">
              {invoice.client_phone && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Phone className="h-3 w-3" />
                  <span>{invoice.client_phone}</span>
                </div>
              )}
              {invoice.client_address && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{invoice.client_address}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          {invoice.notes && (
            <div className="bg-gray-50 rounded-lg p-2 mb-3">
              <p className="text-xs text-gray-600 truncate">{invoice.notes}</p>
            </div>
          )}

          {/* Status Footer */}
          <div className="border-t border-gray-100 pt-2 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {t('created')}: {format(new Date(invoice.created_at), 'MMM dd')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Invoices = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchInvoices = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: fetchInvoices,
    enabled: !!user,
  });

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.client_name?.toLowerCase().includes(search) ||
        invoice.invoice_number?.toLowerCase().includes(search) ||
        invoice.client_phone?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date Filter Logic
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;

      if (dateFilter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      } else if (dateFilter === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      if (startDate) {
        filtered = filtered.filter(invoice => {
          const invoiceDate = new Date(invoice.invoice_date);
          return invoiceDate >= startDate;
        });
      }
    }

    return filtered;
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }, [filteredInvoices]);

  const monthlyTotal = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }, [invoices]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteInvoice') || 'Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries(['invoices']);
      toast({
        title: t('success') || "Success",
        description: t('invoiceDeletedSuccessfully') || "Invoice deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: t('error') || "Error",
        description: t('failedToDeleteInvoice') || "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loadingInvoices') || 'Loading invoices...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addInvoice') || 'Add Invoice'}
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder={t('searchInvoices') || 'Search invoices...'} 
            className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Compact Inline Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Quick Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{filteredInvoices.length} {t('invoicesCount') || 'invoices'}</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-blue-600">{totalAmount.toFixed(2)} DH</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm">{t('thisMonth') || 'This month'}: <span className="font-semibold text-green-600">{monthlyTotal.toFixed(2)} DH</span></span>
          </div>
        </div>

        {/* Compact Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
            {[
              { value: 'all', label: t('all') || 'All' },
              { value: 'today', label: t('today') || 'Today' },
              { value: 'week', label: t('week') || 'Week' },
              { value: 'month', label: t('month') || 'Month' },
              { value: 'year', label: t('year') || 'Year' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateFilter === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateFilter(option.value)}
                className={cn(
                  "h-7 px-2 text-xs font-medium transition-all duration-200 rounded-md",
                  dateFilter === option.value
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className={cn(
              "w-[120px] h-9 border transition-all duration-200 rounded-lg bg-white/50 backdrop-blur-sm",
              statusFilter !== 'all'
                ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            )}>
              <Package className="h-4 w-4 mr-1" />
              <SelectValue>
                {statusFilter === 'all' ? t('status') || 'Status' : statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
              <SelectItem value="Draft">{t('draft') || 'Draft'}</SelectItem>
              <SelectItem value="Pending">{t('pending') || 'Pending'}</SelectItem>
              <SelectItem value="Paid">{t('paid') || 'Paid'}</SelectItem>
              <SelectItem value="Overdue">{t('overdue') || 'Overdue'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Tags */}
      {(dateFilter !== 'all' || statusFilter !== 'all') && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">{t('active') || 'Active'}:</span>
          {dateFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100/80 backdrop-blur-sm text-blue-700 rounded-md text-xs border border-blue-200">
              {dateFilter === 'today' ? t('today') : dateFilter === 'week' ? t('thisWeek') : dateFilter === 'month' ? t('thisMonth') : t('thisYear')}
              <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setDateFilter('all')} />
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100/80 backdrop-blur-sm text-green-700 rounded-md text-xs border border-green-200">
              {statusFilter}
              <X className="h-3 w-3 cursor-pointer hover:text-green-900" onClick={() => setStatusFilter('all')} />
            </span>
          )}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t('totalInvoices') || 'Total Invoices'}</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t('paidInvoices') || 'Paid Invoices'}</p>
                <p className="text-2xl font-bold">{invoices.filter(i => i.status === 'Paid').length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">{t('pendingInvoices') || 'Pending Invoices'}</p>
                <p className="text-2xl font-bold">{invoices.filter(i => i.status === 'Pending').length}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">{t('totalRevenue') || 'Total Revenue'}</p>
                <p className="text-2xl font-bold">{invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(0)} DH</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-6">
        <AnimatePresence>
          {filteredInvoices.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              {t('noInvoicesFound') || 'No invoices found'}
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onView={() => setSelectedInvoice(invoice)}
                onEdit={() => setEditingInvoice(invoice)}
                onDelete={() => handleDelete(invoice.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <AddInvoiceDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      <EditInvoiceDialog
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        invoice={editingInvoice}
      />

      <InvoiceDetailsDialog
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onEdit={setEditingInvoice}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Invoices;
