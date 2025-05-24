
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, DollarSign, Banknote } from 'lucide-react';

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
    <div className="flex-1 bg-white rounded-xl p-6 space-y-6 border shadow-lg">
      <div className="flex items-center gap-2 border-b pb-4">
        <DollarSign className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-xl text-gray-900">Order Summary</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50/50 rounded-lg p-4 space-y-3">
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
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between text-sm"
            >
              <span className="text-gray-600">
                Discount ({discount}% + {numericDiscount} DH)
              </span>
              <span className="font-medium text-red-600">-{totalDiscount.toFixed(2)} DH</span>
            </motion.div>
          )}
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Total Amount</span>
            <span className="font-semibold text-lg text-primary">{total.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="bg-gray-50/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Cost Breakdown</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Products Cost</span>
            <span className="font-medium">{totalCost.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montage Costs</span>
            <span className="font-medium">{montageCosts.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
            <span className="text-gray-800">Total Cost (TTC)</span>
            <span className="text-red-600">{(totalCost + montageCosts).toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center bg-green-50/50 p-2 rounded-lg">
            <span className="text-gray-800 font-medium">Profit</span>
            <span className="font-semibold text-green-600">{profit.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="bg-gray-50/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Payment Status</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Advance Payment</span>
            <span className="font-medium">{advancePayment.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
            <span className="font-medium text-gray-700">Balance Due</span>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-lg text-blue-600">{balance.toFixed(2)} DH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
