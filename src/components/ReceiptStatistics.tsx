import React, { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface Receipt {
  montage_costs: number;
  montage_status: string;
  cost_ttc: number;
  total: number;
  balance: number;
  advance_payment: number;
  delivery_status: string;
  created_at: string;
  receipt_items: Array<{
    product?: {
      category?: string;
    };
    cost: number;
    price: number;
    quantity: number;
  }>;
}

interface ReceiptStatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: Receipt[];
}

const ReceiptStatistics: React.FC<ReceiptStatisticsProps> = ({ isOpen, onClose, receipts }) => {
  const defaultStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd'T'HH:mm");
  const defaultEndDate = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Filter receipts by date range
  const filteredReceipts = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.created_at);
    return receiptDate >= new Date(startDate) && receiptDate <= new Date(endDate);
  });

  // Calculate metrics based on filtered receipts
  let totalMontageCosts = 0;
  let unpaidMontageCosts = 0;
  let totalProductsCost = 0;

  for (const receipt of filteredReceipts) {
    const montageCost = receipt.montage_costs || 0;
    const productCost = receipt.products_cost || 0;

    // Only count montage costs for receipts in InCutting or Ready phases
    if (receipt.montage_status === 'InCutting' || receipt.montage_status === 'Ready') {
      totalMontageCosts += montageCost;
      unpaidMontageCosts += montageCost;
    }

    // Also count montage costs for receipts in Paid costs phase (these are already paid)
    if (receipt.montage_status === 'Paid costs') {
      totalMontageCosts += montageCost;
      // Don't add to unpaidMontageCosts since these are paid
    }

    totalProductsCost += productCost;
  }

  const lensTypeCosts = filteredReceipts.reduce((acc, receipt) => {
    if (Array.isArray(receipt.receipt_items)) {
      receipt.receipt_items.forEach(item => {
        const quantity = Number(item.quantity) || 1;
        const cost = Number(item.cost) || 0;
        const price = Number(item.price) || 0;
        const totalItemRevenue = price * quantity;
        const totalItemCost = cost * quantity;
        const category = item.product?.category || 'Unknown';

        switch(category) {
          case 'Single Vision Lenses':
            acc.singleVision += totalItemRevenue;
            acc.singleVisionCost += totalItemCost;
            acc.singleVisionCount += quantity;
            break;
          case 'Progressive Lenses':
            acc.progressive += totalItemRevenue;
            acc.progressiveCost += totalItemCost;
            acc.progressiveCount += quantity;
            break;
          case 'Frames':
            acc.frames += totalItemRevenue;
            acc.framesCost += totalItemCost;
            acc.framesCount += quantity;
            break;
          case 'Sunglasses':
            acc.sunglasses += totalItemRevenue;
            acc.sunglassesCost += totalItemCost;
            acc.sunglassesCount += quantity;
            break;
          case 'Accessories':
            acc.accessories += totalItemRevenue;
            acc.accessoriesCost += totalItemCost;
            acc.accessoriesCount += quantity;
            break;
        }
      });
    }
    return acc;
  }, { 
    singleVision: 0, progressive: 0, frames: 0, sunglasses: 0, accessories: 0,
    singleVisionCost: 0, progressiveCost: 0, framesCost: 0, sunglassesCost: 0, accessoriesCost: 0,
    singleVisionCount: 0, progressiveCount: 0, framesCount: 0, sunglassesCount: 0, accessoriesCount: 0 
  });

  const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
  const totalCosts = filteredReceipts.reduce((sum, receipt) => sum + (receipt.cost_ttc || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const averageProfit = filteredReceipts.length > 0 ? totalProfit / filteredReceipts.length : 0;
  const averageTicket = filteredReceipts.length > 0 ? totalRevenue / filteredReceipts.length : 0;

  const outstandingBalance = filteredReceipts.reduce((sum, receipt) => 
    sum + (receipt.balance || 0), 0
  );
  const collectionRate = totalRevenue > 0 
    ? ((totalRevenue - outstandingBalance) / totalRevenue * 100)
    : 0;

  const deliveredCount = filteredReceipts.filter(r => r.delivery_status === 'Completed').length;
  const deliveryRate = filteredReceipts.length > 0 
    ? (deliveredCount / filteredReceipts.length * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-6">Business Analytics</DialogTitle>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">Financial Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-blue-900">{totalRevenue.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Total Products Cost</span>
                  <span className="font-semibold text-red-600">{totalProductsCost.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Total Montage Costs</span>
                  <span className="font-semibold text-red-600">{totalMontageCosts.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Total Costs</span>
                  <span className="font-semibold text-red-600">{totalCosts.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Total Profit</span>
                  <span className="font-semibold text-green-600">{totalProfit.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-green-900">Average Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Average Ticket</span>
                  <span className="font-semibold text-green-900">{averageTicket.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Average Profit</span>
                  <span className="font-semibold text-green-600">{averageProfit.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Collection Rate</span>
                  <span className="font-semibold">{collectionRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-purple-900">Operational Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold">{filteredReceipts.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Delivery Rate</span>
                  <span className="font-semibold">{deliveryRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Outstanding Balance</span>
                  <span className="font-semibold text-amber-600">{outstandingBalance.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-gray-600">Unpaid Montage Costs</span>
                  <span className="font-semibold text-amber-600">{unpaidMontageCosts.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-amber-900">Product Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { title: 'Single Vision', data: { revenue: lensTypeCosts.singleVision, cost: lensTypeCosts.singleVisionCost, count: lensTypeCosts.singleVisionCount } },
                  { title: 'Progressive', data: { revenue: lensTypeCosts.progressive, cost: lensTypeCosts.progressiveCost, count: lensTypeCosts.progressiveCount } },
                  { title: 'Frames', data: { revenue: lensTypeCosts.frames, cost: lensTypeCosts.framesCost, count: lensTypeCosts.framesCount } },
                  { title: 'Sunglasses', data: { revenue: lensTypeCosts.sunglasses, cost: lensTypeCosts.sunglassesCost, count: lensTypeCosts.sunglassesCount } },
                  { title: 'Accessories', data: { revenue: lensTypeCosts.accessories, cost: lensTypeCosts.accessoriesCost, count: lensTypeCosts.accessoriesCount } }
                ].map(({ title, data }) => (
                  <div key={title} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-amber-900">{title}</h4>
                      <span className="text-sm font-medium bg-amber-100 px-2 py-1 rounded">
                        {data.count} units
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue</span>
                        <span className="font-medium">{data.revenue.toFixed(2)} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost</span>
                        <span className="font-medium text-red-600">{data.cost.toFixed(2)} DH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit</span>
                        <span className="font-medium text-green-600">{(data.revenue - data.cost).toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptStatistics;