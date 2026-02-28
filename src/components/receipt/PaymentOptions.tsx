import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/LanguageProvider';

interface PaymentOptionsProps {
  discount: number;
  numericDiscount: number;
  tax: number;
  taxIndicator: number;
  advancePayment: number;
  total: number;
  paymentStatus: string;
  setDiscount: (value: number) => void;
  setNumericDiscount: (value: number) => void;
  setTax: (value: number) => void;
  setTaxIndicator: (value: number) => void;
  setAdvancePayment: (value: number) => void;
  setBalance: (value: number) => void;
  updatePaymentStatus: (balance: number) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  discount,
  numericDiscount,
  tax,
  taxIndicator,
  advancePayment,
  total,
  paymentStatus,
  setDiscount,
  setNumericDiscount,
  setTax,
  setTaxIndicator,
  setAdvancePayment,
  setBalance,
  updatePaymentStatus
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 p-6 md:p-8 bg-white border-2 border-teal-500 shadow-sm rounded-2xl relative">
      <h3 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
        {t('paymentDetails')}
      </h3>
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="discount" className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('percentageDiscount')}</Label>
            <div className="relative">
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiscount(value === '' ? 0 : parseFloat(value));
                }}
                className="teal-focus pr-8 h-10 rounded-xl border-teal-200 bg-white font-medium text-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numericDiscount" className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('fixedDiscount')}</Label>
            <div className="relative">
              <Input
                id="numericDiscount"
                type="number"
                step="0.01"
                min="0"
                value={numericDiscount}
                onChange={(e) => {
                  const value = e.target.value;
                  setNumericDiscount(value === '' ? 0 : parseFloat(value));
                }}
                className="teal-focus pr-10 h-10 rounded-xl border-teal-200 bg-white font-medium text-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tax" className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('taxBase')}</Label>
            <div className="relative">
              <Input
                id="tax"
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="teal-focus pr-10 h-10 rounded-xl border-teal-200 bg-white font-medium text-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxIndicator" className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('taxIndicator')}</Label>
            <div className="relative">
              <Input
                id="taxIndicator"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={taxIndicator}
                onChange={(e) => setTaxIndicator(parseFloat(e.target.value) || 0)}
                className="teal-focus pr-8 h-10 rounded-xl border-teal-200 bg-white font-medium text-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">×</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="advancePayment" className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('advancePayment')}</Label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                id="advancePayment"
                type="number"
                min="0"
                value={advancePayment}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setAdvancePayment(value);
                  setBalance(total - value);
                  updatePaymentStatus(total - value);
                }}
                className="teal-focus pr-10 h-10 rounded-xl border-teal-200 bg-white font-bold text-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
            </div>
            <div className="shrink-0 flex items-center h-10">
              <span className={`inline-flex items-center px-4 h-full rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border ${paymentStatus === 'Paid' ? 'bg-emerald-500 text-white border-emerald-600' :
                paymentStatus === 'Partially Paid' ? 'bg-amber-500 text-white border-amber-600' :
                  'bg-red-500 text-white border-red-600'
                }`}>
                {paymentStatus === 'Paid' ? t('paid') :
                  paymentStatus === 'Partially Paid' ? t('partiallyPaid') :
                    t('unpaid')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;