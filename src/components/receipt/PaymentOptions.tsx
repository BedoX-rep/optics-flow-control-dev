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
    <div className="flex-1 p-6 md:p-8 bg-white border border-slate-100 shadow-sm rounded-2xl md:rounded-3xl">
      <h3 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight mb-6">{t('paymentDetails')}</h3>

      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="discount" className="text-xs font-semibold text-slate-700">{t('percentageDiscount')} (%)</Label>
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
                className="pr-8 h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-100 bg-slate-50/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numericDiscount" className="text-xs font-semibold text-slate-700">{t('fixedDiscount')} (DH)</Label>
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
                className="pr-10 h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-100 bg-slate-50/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tax" className="text-xs font-semibold text-slate-700">{t('taxBase')} (DH)</Label>
            <div className="relative">
              <Input
                id="tax"
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="pr-10 h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-100 bg-slate-50/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxIndicator" className="text-xs font-semibold text-slate-700">{t('taxIndicator')}</Label>
            <div className="relative">
              <Input
                id="taxIndicator"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={taxIndicator}
                onChange={(e) => setTaxIndicator(parseFloat(e.target.value) || 0)}
                className="pr-8 h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-100 bg-slate-50/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">×</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="advancePayment" className="text-xs font-semibold text-slate-700">{t('advancePayment')}</Label>
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
                className="pr-10 h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-100 bg-slate-50/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
            </div>
            <div className="shrink-0 flex items-center h-11">
              <span className={`inline-flex flex-col justify-center px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap h-full ${paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                  paymentStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
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