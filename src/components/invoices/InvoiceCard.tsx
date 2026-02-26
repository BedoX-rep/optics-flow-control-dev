import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, FileText, Calendar, DollarSign, Phone, Building2, Printer, Check, Package, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useLanguage } from '../LanguageProvider';
import { cn } from '@/lib/utils';
import { Invoice } from '@/integrations/supabase/types';

interface InvoiceCardProps {
    invoice: Invoice;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPrint: () => void;
    onMarkAsPaid: () => void;
}

const InvoiceCard = React.memo<InvoiceCardProps>(({
    invoice,
    onView,
    onEdit,
    onDelete,
    onPrint,
    onMarkAsPaid
}) => {
    const { t } = useLanguage();

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'overdue':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'draft':
                return 'bg-slate-50 text-slate-700 border-slate-100';
            default:
                return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return t('paid') || 'Paid';
            case 'pending':
                return t('pending') || 'Pending';
            case 'overdue':
                return t('overdue') || 'Overdue';
            case 'draft':
                return t('draft') || 'Draft';
            default:
                return status;
        }
    };

    return (
        <Card className="h-[400px] w-full overflow-hidden transition-all duration-300 border-l-4 border-l-indigo-500 bg-white hover:border-l-indigo-600 hover:shadow-xl hover:shadow-indigo-500/10 font-inter relative group">
            <CardContent className="p-5 h-full flex flex-col">
                {/* Creation Date and Action Buttons - Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {/* Creation Date */}
                    {invoice.created_at && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                        </span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onView}
                            className="text-indigo-600 hover:text-white hover:bg-indigo-600 h-8 w-8 p-0 rounded-xl border border-indigo-100 bg-white shadow-sm transition-all duration-200"
                            title={t('viewDetails')}
                        >
                            <Eye size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEdit}
                            className="text-amber-600 hover:text-white hover:bg-amber-600 h-8 w-8 p-0 rounded-xl border border-amber-100 bg-white shadow-sm transition-all duration-200"
                            title={t('edit')}
                        >
                            <Edit size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onPrint}
                            className="text-emerald-600 hover:text-white hover:bg-emerald-600 h-8 w-8 p-0 rounded-xl border border-emerald-100 bg-white shadow-sm transition-all duration-200"
                            title={t('print')}
                        >
                            <Printer size={14} />
                        </Button>
                        {invoice.status !== 'Paid' && invoice.balance > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onMarkAsPaid}
                                className="text-blue-600 hover:text-white hover:bg-blue-600 h-8 w-8 p-0 rounded-xl border border-blue-100 bg-white shadow-sm transition-all duration-200"
                                title={t('markAsPaid')}
                            >
                                <Check size={14} />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="text-rose-600 hover:text-white hover:bg-rose-600 h-8 w-8 p-0 rounded-xl border border-rose-100 bg-white shadow-sm transition-all duration-200"
                            title={t('delete')}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>

                {/* Header Section */}
                <div className="flex items-start gap-4 mb-6 pr-24">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-[1px] shadow-lg shadow-indigo-200">
                            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                                <FileText className="h-7 w-7 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {invoice.client_name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-indigo-600 tracking-tight">
                                {invoice.total.toFixed(2)}
                            </span>
                            <span className="text-xs font-black text-indigo-400 uppercase">DH</span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{invoice.invoice_number}</p>
                    </div>
                </div>

                {/* Status Information */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        getStatusColor(invoice.status)
                    )}>
                        {getStatusText(invoice.status)}
                    </span>

                    {invoice.due_date && invoice.status !== 'Paid' && (
                        <span className="text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {t('due') || 'DUE'}: {format(new Date(invoice.due_date), 'MMM dd')}
                        </span>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('invoiceDate') || 'Invoice Date'}</label>
                            <div className="h-10 px-3 text-xs bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-700 shadow-inner">
                                <Calendar className="h-3.5 w-3.5 mr-2 text-indigo-500 flex-shrink-0" />
                                {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('items') || 'Items'}</label>
                            <div className="h-10 px-3 text-xs bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-700 shadow-inner">
                                <Package className="h-3.5 w-3.5 mr-2 text-indigo-500 flex-shrink-0" />
                                {invoice.invoice_items?.length || 0} {t('items') || 'items'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {(invoice.client_phone || invoice.client_assurance) && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('clientDetails') || 'Client Details'}</label>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 px-3 space-y-1 shadow-inner">
                                    {invoice.client_phone && (
                                        <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                                            <Phone className="h-3 w-3 text-blue-500" />
                                            <span>{invoice.client_phone}</span>
                                        </div>
                                    )}
                                    {invoice.client_assurance && (
                                        <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                                            <Building2 className="h-3 w-3 text-emerald-500" />
                                            <span>{invoice.client_assurance}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">{t('assuranceTotal') || 'Assurance'}</label>
                            <div className="h-10 px-3 text-xs bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center font-black text-emerald-700 shadow-inner">
                                {invoice.tax_amount?.toFixed(2) || '0.00'} DH
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">{t('balanceDue') || 'Balance'}</label>
                            <div className="h-10 px-3 text-xs bg-rose-50/50 border border-rose-100 rounded-xl flex items-center font-black text-rose-700 shadow-inner">
                                {(invoice.balance || 0).toFixed(2)} DH
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                {invoice.notes && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('notes')}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-1 italic">"{invoice.notes}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

InvoiceCard.displayName = 'InvoiceCard';

export default InvoiceCard;
