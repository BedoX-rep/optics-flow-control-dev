
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, History, DollarSign, Calendar, Building2, Receipt, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from './LanguageProvider';

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
    <Card className="h-[420px] w-full overflow-hidden transition-all duration-300 border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50/30 to-seafoam-50/20 hover:border-l-teal-600 hover:shadow-lg hover:from-teal-50/50 hover:to-seafoam-50/30 font-inter">
      <CardContent className="p-5 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-teal-100 border-2 border-teal-200 shadow-sm flex items-center justify-center">
              <Receipt className="h-6 w-6 text-teal-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-poppins font-semibold text-base text-gray-800 mb-2 line-clamp-2">
              {purchase.description}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-poppins font-bold text-teal-700 text-lg">
                  {totalAmount.toFixed(2)}
                </span>
                <span className="text-sm text-teal-600 font-medium">DH</span>
              </div>
            </div>
            
            {/* Status and Special Indicators */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                purchase.payment_status === 'Paid' 
                  ? 'bg-green-100 text-green-800'
                  : purchase.payment_status === 'Partially Paid'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {purchase.payment_status === 'Paid' ? t('paid') : 
                 purchase.payment_status === 'Partially Paid' ? t('partiallyPaid') : 
                 t('unpaid')}
              </span>

              {purchase.payment_urgency && (
                <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium">
                  Due: {format(new Date(purchase.payment_urgency), 'MMM dd')}
                </span>
              )}

              {purchase.next_recurring_date && !purchase.already_recurred && (
                <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs font-medium">
                  {t('next')}: {format(new Date(purchase.next_recurring_date), 'MMM dd')}
                </span>
              )}
            </div>
            
            {purchase.created_at && (
              <div className="text-right">
                <span className="text-xs text-gray-500 font-inter bg-gray-100/80 px-2 py-1 rounded-full">
                  {format(new Date(purchase.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('supplier')}</label>
              <div className="h-8 px-3 text-xs bg-teal-50/30 border border-teal-200 rounded-lg flex items-center font-inter text-gray-700 truncate">
                <Building2 className="h-3 w-3 mr-2 text-teal-600 flex-shrink-0" />
                {supplierName}
              </div>
            </div>

            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('purchaseDate')}</label>
              <div className="h-8 px-3 text-xs bg-teal-50/30 border border-teal-200 rounded-lg flex items-center font-inter text-gray-700">
                <Calendar className="h-3 w-3 mr-2 text-teal-600 flex-shrink-0" />
                {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('category')}</label>
              <div className="h-8 px-3 text-xs bg-teal-50/30 border border-teal-200 rounded-lg flex items-center font-inter text-gray-700 truncate">
                {purchase.category ? getTranslatedCategory(purchase.category) : t('noCategory')}
              </div>
            </div>

            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('purchaseType')}</label>
              <div className="h-8 px-3 text-xs bg-teal-50/30 border border-teal-200 rounded-lg flex items-center font-inter text-gray-700 truncate">
                <TrendingUp className="h-3 w-3 mr-2 text-teal-600 flex-shrink-0" />
                {purchase.purchase_type === 'Operational Expenses' ? 'Ops' : 'Cap'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('advance')}</label>
              <div className="h-8 px-3 text-xs bg-green-50/50 border border-green-200 rounded-lg flex items-center font-inter text-green-700 font-medium">
                {advancePayment.toFixed(2)} DH
              </div>
            </div>

            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('balance')}</label>
              <div className="h-8 px-3 text-xs bg-red-50/50 border border-red-200 rounded-lg flex items-center font-inter text-red-700 font-medium">
                {balance.toFixed(2)} DH
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('paymentMethod')}</label>
              <div className="h-8 px-3 text-xs bg-teal-50/30 border border-teal-200 rounded-lg flex items-center font-inter text-gray-700">
                {purchase.payment_method}
              </div>
            </div>
          </div>

          
        </div>

        {/* Footer Section */}
        <div className="border-t-2 border-teal-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewBalanceHistory(purchase)}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 px-2 text-xs font-inter rounded-lg"
              >
                <History size={14} className="mr-1" />
                {t('history')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(purchase)}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 px-2 text-xs font-inter rounded-lg"
              >
                <Edit size={14} />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {purchase.payment_status !== 'Paid' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsPaid(purchase)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-2 text-xs font-inter rounded-lg"
                >
                  <DollarSign size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(purchase.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs font-inter rounded-lg"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          {!purchase.already_recurred && purchase.recurring_type && purchase.next_recurring_date && new Date(purchase.next_recurring_date) <= new Date() && (
            <Button
              size="sm"
              onClick={() => onRecurringRenewal(purchase)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-3 text-xs font-poppins font-medium rounded-lg shadow-sm"
            >
              <TrendingUp size={14} className="mr-2" />
              {t('renewNow')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

PurchaseCard.displayName = 'PurchaseCard';

export default PurchaseCard;
