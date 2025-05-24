
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

interface PaymentSummaryProps {
  subtotal: number;
  total: number;
  profit: number;
  taxAmount: number;
  totalDiscount: number;
  totalCost: number;
  montageCosts: number;
  discount: number;
  setDiscount: (value: number) => void;
  numericDiscount: number;
  setNumericDiscount: (value: number) => void;
  tax: number;
  setTax: (value: number) => void;
  taxIndicator: number;
  setTaxIndicator: (value: number) => void;
  advancePayment: number;
  setAdvancePayment: (value: number) => void;
  balance: number;
  setBalance: (value: number) => void;
  paymentStatus: string;
  updatePaymentStatus: (balance: number) => void;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  subtotal,
  total,
  profit,
  taxAmount,
  totalDiscount,
  totalCost,
  montageCosts,
  discount,
  setDiscount,
  numericDiscount,
  setNumericDiscount,
  tax,
  setTax,
  taxIndicator,
  setTaxIndicator,
  advancePayment,
  setAdvancePayment,
  balance,
  setBalance,
  paymentStatus,
  updatePaymentStatus,
}) => {
  return (
    <div className="sticky top-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Base Calculations */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)} DH</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{taxAmount.toFixed(2)} DH</span>
                </div>
              )}
              {montageCosts > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montage Costs</span>
                  <span className="font-medium">{montageCosts.toFixed(2)} DH</span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Total Discount</span>
                  <span>-{totalDiscount.toFixed(2)} DH</span>
                </div>
              )}
            </div>

            {/* Final Calculations */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-semibold text-primary">{total.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cost (TTC)</span>
                <span className="font-medium text-red-600">{totalCost.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit</span>
                <span className="font-semibold text-green-600">{profit.toFixed(2)} DH</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSummary;
