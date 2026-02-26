import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, DollarSign, Phone, MapPin, Filter, X, TrendingUp, Package, Building2, Printer, Check, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import AddInvoiceDialog from '@/components/AddInvoiceDialog';
import EditInvoiceDialog from '@/components/EditInvoiceDialog';
import InvoiceDetailsDialog from '@/components/InvoiceDetailsDialog';
import PrintInvoiceDialog from '@/components/PrintInvoiceDialog';
import { Invoice } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import InvoicesHero from '@/components/invoices/InvoicesHero';
import InvoiceFilters from '@/components/invoices/InvoiceFilters';
import InvoiceCard from '@/components/invoices/InvoiceCard';


const Invoices = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
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
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return (data as unknown as Invoice[]) || [];
  };

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: fetchInvoices,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
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

    // Custom Date Range Filter
    if (dateRange.from) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate >= dateRange.from!;
      });
    }

    if (dateRange.to) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate <= dateRange.to!;
      });
    }

    // Date Filter Logic (only if custom range is not set)
    if (dateFilter !== 'all' && !dateRange.from && !dateRange.to) {
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

    // Sort by invoice date (latest first)
    filtered.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());

    return filtered;
  }, [invoices, searchTerm, statusFilter, dateFilter, dateRange]);

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

      // Optimistically update cache
      queryClient.setQueryData(['invoices', user?.id], (oldData: Invoice[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(invoice => invoice.id !== id);
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: t('success') || "Success",
        description: t('invoiceDeletedSuccessfully') || "Invoice deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
      toast({
        title: t('error') || "Error",
        description: t('failedToDeleteInvoice') || "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!confirm(t('confirmMarkAsPaid') || 'Are you sure you want to mark this invoice as paid?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'Paid',
          balance: 0,
          advance_payment: invoice.total
        })
        .eq('id', invoice.id);

      if (error) throw error;

      // Optimistically update cache
      queryClient.setQueryData(['invoices', user?.id], (oldData: Invoice[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(inv =>
          inv.id === invoice.id
            ? { ...inv, status: 'Paid', balance: 0, advance_payment: invoice.total }
            : inv
        );
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: t('success') || "Success",
        description: t('invoiceMarkedAsPaid') || "Invoice marked as paid successfully.",
      });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
      toast({
        title: t('error') || "Error",
        description: t('failedToMarkAsPaid') || "Failed to mark invoice as paid. Please try again.",
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
    <div className="w-full min-h-screen bg-[#f8fafc]">
      <InvoicesHero
        onAddInvoice={() => setIsAddDialogOpen(true)}
        invoices={invoices}
      />

      <div className="px-4 lg:px-6 relative z-10 -mt-4">
        <InvoiceFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateFilter={dateFilter}
          dateRange={dateRange}
          statusFilter={statusFilter}
          onFilterChange={(key, value) => {
            if (key === 'date') setDateFilter(value);
            if (key === 'status') setStatusFilter(value);
            if (key === 'dateRange') setDateRange(value);
          }}
        />

        {/* Invoice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredInvoices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20 bg-white/50 backdrop-blur-sm rounded-[32px] border border-dashed border-slate-200"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-50 mb-4">
                  <FileText className="h-10 w-10 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">{t('noInvoicesFound') || 'No invoices found'}</p>
              </motion.div>
            ) : (
              filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <InvoiceCard
                    invoice={invoice}
                    onView={() => setSelectedInvoice(invoice)}
                    onEdit={() => setEditingInvoice(invoice)}
                    onPrint={() => setPrintingInvoice(invoice)}
                    onDelete={() => handleDelete(invoice.id)}
                    onMarkAsPaid={() => handleMarkAsPaid(invoice)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
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

      <PrintInvoiceDialog
        isOpen={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
        invoice={printingInvoice}
      />
    </div>
  );
};

export default Invoices;