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
      <h3 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight">{translate('orderSummary')}</h3>
      <div className="space-y-4">
        <div className="flex justify-between text-sm items-center">
          <span className="text-slate-600 font-medium">{translate('subtotal')}</span>
          <span className="font-bold text-slate-900">{subtotal.toFixed(2)} DH</span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-600 font-medium">{translate('tax')}</span>
            <span className="font-bold text-slate-900">{taxAmount.toFixed(2)} DH</span>
          </div>
        )}

        {(discount > 0 || numericDiscount > 0) && (
          <div className="flex flex-col md:flex-row md:justify-between text-sm gap-1 md:gap-0 mt-1">
            <span className="text-slate-600 font-medium">{translate('discount')} ({discount}% + {numericDiscount} DH)</span>
            <span className="font-bold text-red-600">-{totalDiscount.toFixed(2)} DH</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-900">{translate('total')}</span>
            <span className="font-black text-lg md:text-xl text-blue-900">{total.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="pt-4 space-y-3 border-t border-slate-100 mt-2">
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-600 font-medium">{translate('productsCost')}</span>
            <span className="font-bold text-slate-900">{totalCost.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-600 font-medium">{translate('additionalCosts')}</span>
            <span className="font-bold text-slate-900">{montageCosts.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm items-center pt-1">
            <span className="text-slate-900 font-bold">{translate('totalCostTTC')}</span>
            <span className="font-bold text-red-500">{(totalCost + montageCosts).toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-900 font-bold">{translate('profit')}</span>
            <span className="font-black text-emerald-500">{profit.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="pt-6 space-y-4 mt-6">
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-600 font-medium">{translate('advancePayment')}</span>
            <span className="font-bold text-slate-900">{advancePayment.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-900">{translate('balanceDue')}</span>
            <span className="font-black text-lg md:text-xl text-slate-900">{balance.toFixed(2)} DH</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;