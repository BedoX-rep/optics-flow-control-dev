
import React from 'react';

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
  return (
    <div className="flex-1 bg-gray-50/50 rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-xl text-gray-900">Order Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{subtotal.toFixed(2)} DH</span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{taxAmount.toFixed(2)} DH</span>
          </div>
        )}

        {(discount > 0 || numericDiscount > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount ({discount}% + {numericDiscount} DH)</span>
            <span className="font-medium text-red-600">-{totalDiscount.toFixed(2)} DH</span>
          </div>
        )}

        <div className="pt-3 border-t">
          <div className="flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-semibold text-lg text-blue-900">{total.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="py-3 space-y-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Products Cost</span>
            <span className="font-medium">{totalCost.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montage Costs</span>
            <span className="font-medium">{montageCosts.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-800">Total Cost (TTC)</span>
            <span className="text-red-600">{(totalCost + montageCosts).toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Profit</span>
            <span className="font-semibold text-green-600">{profit.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Advance Payment</span>
            <span className="font-medium">{advancePayment.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Balance Due</span>
            <span className="font-semibold text-lg">{balance.toFixed(2)} DH</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
