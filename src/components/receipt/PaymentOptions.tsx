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
  return (
    <div className="flex-1 p-6 space-y-4 border rounded-lg">
      <h3 className="font-semibold text-xl text-gray-900">Payment Options</h3>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="discount">Percentage Discount</Label>
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
              className="pr-8"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="numericDiscount">Fixed Discount</Label>
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
              className="pr-12"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">DH</span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="tax">Tax Base Amount</Label>
          <div className="relative">
            <Input
              id="tax"
              type="number"
              min="0"
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              className="pr-12"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">DH</span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="taxIndicator">Tax Rate</Label>
          <div className="relative">
            <Input
              id="taxIndicator"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={taxIndicator}
              onChange={(e) => setTaxIndicator(parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">×</span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="advancePayment">Advance Payment</Label>
          <div className="relative">
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
              className="pr-12"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">DH</span>
          </div>
        </div>

        <div className="flex items-end pb-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {paymentStatus}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;