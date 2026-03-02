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
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 space-y-6">
      <h3 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight flex items-center gap-2">
        <span className="w-1.5 h-6 bg-[#0d9488] rounded-full" />
        {t('paymentDetails')}
      </h3>

      <div className="p-6 md:p-8 bg-white border-2 border-[#0d9488] shadow-sm rounded-2xl relative">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount" className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{t('percentageDiscount')}</Label>
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
                  className="h-11 rounded-xl border-teal-100 bg-white font-bold text-slate-900 focus:border-teal-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400 pointer-events-none">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numericDiscount" className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{t('fixedDiscount')} (DH)</Label>
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
                  className="h-11 rounded-xl border-teal-100 bg-white font-bold text-slate-900 focus:border-teal-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400 pointer-events-none">DH</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax" className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{t('taxBase')} (DH)</Label>
              <div className="relative">
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="h-11 rounded-xl border-teal-100 bg-white font-bold text-slate-900 focus:border-teal-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400 pointer-events-none">DH</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxIndicator" className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{t('taxIndicator')}</Label>
              <div className="relative">
                <Input
                  id="taxIndicator"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={taxIndicator}
                  onChange={(e) => setTaxIndicator(parseFloat(e.target.value) || 0)}
                  className="h-11 rounded-xl border-teal-100 bg-white font-bold text-slate-900 focus:border-teal-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400 pointer-events-none">×</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advancePayment" className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{t('advancePayment')}</Label>
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
                  }}
                  className="h-12 rounded-xl border-teal-100 bg-white font-black text-xl text-slate-900 focus:border-teal-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-400 pointer-events-none">DH</span>
              </div>
              <div className="shrink-0">
                <span className={`inline-flex items-center justify-center px-6 h-12 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg ${paymentStatus === 'Paid' ? 'bg-[#14b8a6] text-white shadow-teal-500/20' :
                  paymentStatus === 'Partially Paid' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                    'bg-red-500 text-white shadow-red-500/20'
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
    </div>
  );
};

export default PaymentOptions;