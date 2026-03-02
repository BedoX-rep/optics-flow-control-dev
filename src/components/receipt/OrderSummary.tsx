import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  taxAmount: number;
  discount: number;
  numericDiscount: number;
  totalDiscount: number;
  total: number;
  totalCost: number;
  montageCosts: number;
  profit: number;
  advancePayment: number;
  balance: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  tax,
  taxAmount,
  discount,
  numericDiscount,
  totalDiscount,
  total,
  totalCost,
  montageCosts,
  profit,
  advancePayment,
  balance
}) => {
  const { translate } = useLanguage();

  return (
    <div className="flex-1 space-y-6 lg:border-r lg:border-slate-100 lg:pr-8">
      <h3 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight flex items-center gap-2">
        <span className="w-1.5 h-6 bg-slate-900 rounded-full" />
        {translate('orderSummary')}
      </h3>

      <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 md:p-6 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full opacity-50" />

        <div className="space-y-3 relative z-10">
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-600 font-bold uppercase tracking-tight">{translate('subtotal')}</span>
            <span className="font-extrabold text-slate-900">{subtotal.toFixed(2)} DH</span>
          </div>

          {tax > 0 && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-600 font-bold uppercase tracking-tight">{translate('tax')}</span>
              <span className="font-extrabold text-slate-900">{taxAmount.toFixed(2)} DH</span>
            </div>
          )}

          {(discount > 0 || numericDiscount > 0) && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-red-600 font-bold uppercase tracking-tight">{translate('discount')}</span>
              <span className="font-extrabold text-red-600">-{totalDiscount.toFixed(2)} DH</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 mt-2">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-900 rounded-xl shadow-lg">
              <span className="font-black text-white uppercase tracking-widest text-xs">{translate('total')}</span>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-xl md:text-2xl text-white tracking-tighter">{total.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-400">DH</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3 border-t border-slate-100 mt-4 relative z-10">
          <div className="flex justify-between text-xs items-center opacity-70">
            <span className="text-slate-600 font-bold uppercase">{translate('productsCost')}</span>
            <span className="font-bold text-slate-900">{totalCost.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-xs items-center opacity-70">
            <span className="text-slate-600 font-bold uppercase">{translate('additionalCosts')}</span>
            <span className="font-bold text-slate-900">{montageCosts.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-slate-100">
            <span className="text-slate-900 font-black uppercase tracking-tight text-xs">{translate('totalCostTTC')}</span>
            <span className="font-extrabold text-red-500">{(totalCost + montageCosts).toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-900 font-black uppercase tracking-tight text-xs">{translate('profit')}</span>
            <span className="font-black text-emerald-600">{profit.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="pt-6 space-y-3 mt-6 border-t-2 border-slate-900 border-dashed relative z-10">
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-600 font-bold uppercase tracking-tight">{translate('advancePayment')}</span>
            <span className="font-extrabold text-emerald-600">{advancePayment.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="font-black text-red-900 uppercase tracking-widest text-xs">{translate('balanceDue')}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-xl text-red-600 tracking-tighter">{balance.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-red-400">DH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;