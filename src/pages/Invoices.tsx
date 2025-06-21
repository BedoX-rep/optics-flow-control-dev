
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, DollarSign, Phone, MapPin } from 'lucide-react';
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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold truncate">{invoice.invoice_number}</h3>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invoice.client_name}</span>
                    {invoice.client_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{invoice.client_phone}</span>
                      </div>
                    )}
                  </div>
                  {invoice.client_address && (
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{invoice.client_address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1 flex-shrink-0">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">{t('invoiceDate') || 'Invoice Date'}:</span>
                  <span>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
                </div>
                {invoice.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-500">{t('dueDate') || 'Due Date'}:</span>
                    <span>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">{t('subtotal') || 'Subtotal'}:</span>
                  <span className="font-medium">{invoice.subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">{t('total') || 'Total'}:</span>
                  <span className="font-bold text-blue-600">{invoice.total.toFixed(2)} DH</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
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
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client_phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries(['invoices']);
      toast({
        title: "Success",
        description: "Invoice deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container px-2 sm:px-4 md:px-6 max-w-[1600px] mx-auto py-4 sm:py-6 min-w-[320px]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('invoices') || 'Invoices'}</h1>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="rounded-xl font-medium bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('addInvoice') || 'Add Invoice'}
        </Button>
      </div>

      <div className="mb-6 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder={t('searchInvoices') || 'Search invoices...'} 
              className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[140px] border-2 shadow-md rounded-xl">
              <SelectValue placeholder={t('status') || 'Status'} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
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
          ) : filteredInvoices.length === 0 ? (
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
