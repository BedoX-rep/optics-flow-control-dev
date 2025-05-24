
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Percent, DollarSign, Calculator, CreditCard } from 'lucide-react';

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
    <div className="flex-1 bg-white rounded-xl p-6 space-y-6 border shadow-lg">
      <div className="flex items-center gap-2 border-b pb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-xl text-gray-900">Payment Options</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 bg-gray-50/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Discounts</span>
          </div>
          
          <div>
            <Label htmlFor="discount" className="text-gray-600">Percentage Discount</Label>
            <div className="relative mt-1">
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

          <div>
            <Label htmlFor="numericDiscount" className="text-gray-600">Fixed Discount</Label>
            <div className="relative mt-1">
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
        </div>

        <div className="space-y-4 bg-gray-50/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Tax Settings</span>
          </div>

          <div>
            <Label htmlFor="tax" className="text-gray-600">Tax Base Amount</Label>
            <div className="relative mt-1">
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

          <div>
            <Label htmlFor="taxIndicator" className="text-gray-600">Tax Rate</Label>
            <div className="relative mt-1">
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
        </div>
      </div>

      <div className="bg-primary/5 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Payment Details</span>
        </div>

        <div>
          <Label htmlFor="advancePayment" className="text-gray-600">Advance Payment</Label>
          <div className="relative mt-1">
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

        <div className="flex items-center justify-end">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
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
