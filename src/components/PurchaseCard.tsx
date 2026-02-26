
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, History, DollarSign, Calendar, Building2, Receipt, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from './LanguageProvider';
import { cn } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface Purchase {
  id: string;
  supplier_id?: string;
  description: string;
  amount: number;
  amount_ht?: number;
  amount_ttc?: number;
  category?: string;
  purchase_date: string;
  receipt_number?: string;
  payment_method: string;
  notes?: string;
  advance_payment?: number;
  balance?: number;
  payment_status?: string;
  payment_urgency?: string;
  recurring_type?: string;
  next_recurring_date?: string;
  purchase_type?: string;
  linking_category?: string;
  linked_receipts?: string[];
  link_date_from?: string;
  link_date_to?: string;
  created_at: string;
  suppliers?: Supplier;
  already_recurred?: boolean;
  tax_percentage?: number;
}

interface PurchaseCardProps {
  purchase: Purchase;
  suppliers: Supplier[];
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (purchase: Purchase) => void;
  onViewBalanceHistory: (purchase: Purchase) => void;
  onRecurringRenewal: (purchase: Purchase) => void;
}

const PurchaseCard = React.memo<PurchaseCardProps>(({
  purchase,
  suppliers,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onViewBalanceHistory,
  onRecurringRenewal
}) => {
  const { t } = useLanguage();

  const getTranslatedCategory = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Office Supplies': t('officeSupplies'),
      'Equipment': t('equipment'),
      'Software': t('software'),
      'Marketing': t('marketing'),
      'Travel': t('travel'),
      'Utilities': t('utilities'),
      'Rent': t('rent'),
      'Professional Services': t('professionalServices'),
      'Inventory': t('inventory'),
      'Maintenance': t('maintenance'),
      'Insurance': t('insurance'),
      'Loan': t('loan'),
      'Other': t('other')
    };
    return categoryMap[category] || category;
  };

  const supplierName = suppliers.find(s => s.id === purchase.supplier_id)?.name || t('noSupplier');
  const totalAmount = purchase.amount_ttc || purchase.amount;
  const advancePayment = purchase.advance_payment || 0;
  const balance = purchase.balance || 0;

  return (
    <Card className="h-[420px] w-full overflow-hidden transition-all duration-300 border-l-4 border-l-indigo-500 bg-white hover:border-l-indigo-600 hover:shadow-xl hover:shadow-indigo-500/10 font-inter relative group">
      <CardContent className="p-5 h-full flex flex-col">
        {/* Creation Date and Action Buttons - Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {/* Creation Date */}
          {purchase.created_at && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              {format(new Date(purchase.created_at), 'MMM dd, yyyy')}
            </span>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewBalanceHistory(purchase)}
              className="text-indigo-600 hover:text-white hover:bg-indigo-600 h-8 w-8 p-0 rounded-xl border border-indigo-100 bg-white shadow-sm transition-all duration-200"
              title={t('viewBalanceHistory')}
            >
              <History size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(purchase)}
              className="text-amber-600 hover:text-white hover:bg-amber-600 h-8 w-8 p-0 rounded-xl border border-amber-100 bg-white shadow-sm transition-all duration-200"
              title={t('editPurchase')}
            >
              <Edit size={14} />
            </Button>
            {purchase.payment_status !== 'Paid' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsPaid(purchase)}
                className="text-emerald-600 hover:text-white hover:bg-emerald-600 h-8 w-8 p-0 rounded-xl border border-emerald-100 bg-white shadow-sm transition-all duration-200"
                title={t('markAsPaid')}
              >
                <DollarSign size={14} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(purchase.id)}
              className="text-rose-600 hover:text-white hover:bg-rose-600 h-8 w-8 p-0 rounded-xl border border-rose-100 bg-white shadow-sm transition-all duration-200"
              title={t('deletePurchase')}
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
                <Receipt className="h-7 w-7 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {purchase.description}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-indigo-600 tracking-tight">
                {totalAmount.toFixed(2)}
              </span>
              <span className="text-xs font-black text-indigo-400 uppercase">DH</span>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className={cn(
            "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
            purchase.payment_status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : purchase.payment_status === 'Partially Paid'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
          )}>
            {purchase.payment_status === 'Paid' ? t('paid') :
              purchase.payment_status === 'Partially Paid' ? t('partiallyPaid') :
                t('unpaid')}
          </span>

          {purchase.payment_urgency && purchase.payment_status !== 'Paid' && (
            <span className="text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {t('due') || 'DUE'}: {format(new Date(purchase.payment_urgency), 'MMM dd')}
            </span>
          )}

          {purchase.next_recurring_date && !purchase.already_recurred && (
            <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
              {t('next')}: {format(new Date(purchase.next_recurring_date), 'MMM dd')}
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('supplier')}</label>
              <div className="h-10 px-3 text-xs bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-700 truncate shadow-inner">
                <Building2 className="h-3.5 w-3.5 mr-2 text-indigo-500 flex-shrink-0" />
                {supplierName}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('purchaseDate')}</label>
              <div className="h-10 px-3 text-xs bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-700 shadow-inner">
                <Calendar className="h-3.5 w-3.5 mr-2 text-indigo-500 flex-shrink-0" />
                {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('category')}</label>
              <div className="h-10 px-3 text-xs bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-700 truncate shadow-inner uppercase tracking-tight">
                {purchase.category ? getTranslatedCategory(purchase.category) : t('noCategory')}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('purchaseType')}</label>
              <div className="h-10 px-3 text-xs bg-slate-50 border border-slate-100 rounded-xl flex items-center font-bold text-slate-700 truncate shadow-inner uppercase tracking-tight">
                <TrendingUp className="h-3.5 w-3.5 mr-2 text-indigo-500 flex-shrink-0" />
                {purchase.purchase_type === 'Operational Expenses' ? 'Operations' : 'Capital'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">{t('advance')}</label>
              <div className="h-10 px-3 text-xs bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center font-black text-emerald-700 shadow-inner">
                {advancePayment.toFixed(2)} DH
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">{t('balance')}</label>
              <div className="h-10 px-3 text-xs bg-rose-50/50 border border-rose-100 rounded-xl flex items-center font-black text-rose-700 shadow-inner">
                {balance.toFixed(2)} DH
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        {!purchase.already_recurred && purchase.recurring_type && purchase.next_recurring_date && new Date(purchase.next_recurring_date) <= new Date() && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              size="sm"
              onClick={() => onRecurringRenewal(purchase)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              <TrendingUp size={16} className="mr-2" />
              {t('renewNow')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PurchaseCard.displayName = 'PurchaseCard';

export default PurchaseCard;
