
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  // Calculate total montage costs
  const totalMontageCosts = receipts.reduce((sum, receipt) => 
    sum + (receipt.montage_costs || 0), 0
  );

  // Calculate unpaid montage costs
  const unpaidMontageCosts = receipts
    .filter(receipt => receipt.montage_status !== 'Paid costs')
    .reduce((sum, receipt) => sum + (receipt.montage_costs || 0), 0);

  // Calculate costs for different lens types with proper category checking
  const lensTypeCosts = receipts.reduce((acc, receipt) => {
    receipt.receipt_items?.forEach(item => {
      const quantity = item.quantity || 1;
      const cost = item.cost || 0;
      const totalItemCost = cost * quantity;

      if (item.product?.category === 'Single Vision Lenses') {
        acc.singleVision += totalItemCost;
        acc.singleVisionCount += quantity;
      } else if (item.product?.category === 'Progressive Lenses') {
        acc.progressive += totalItemCost;
        acc.progressiveCount += quantity;
      } else if (item.product?.category === 'Frames') {
        acc.frames += totalItemCost;
        acc.framesCount += quantity;
      } else if (item.product?.category === 'Sunglasses') {
        acc.sunglasses += totalItemCost;
        acc.sunglassesCount += quantity;
      } else if (item.product?.category === 'Accessories') {
        acc.accessories += totalItemCost;
        acc.accessoriesCount += quantity;
      }
    });
    return acc;
  }, { 
    singleVision: 0, progressive: 0, frames: 0, sunglasses: 0, accessories: 0,
    singleVisionCount: 0, progressiveCount: 0, framesCount: 0, sunglassesCount: 0, accessoriesCount: 0 
  });

  // Calculate financial metrics
  const totalRevenue = receipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
  const totalCosts = receipts.reduce((sum, receipt) => sum + (receipt.cost_ttc || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const averageProfit = receipts.length > 0 ? totalProfit / receipts.length : 0;
  const averageTicket = receipts.length > 0 ? totalRevenue / receipts.length : 0;

  // Calculate collection metrics
  const outstandingBalance = receipts.reduce((sum, receipt) => 
    sum + (receipt.balance || 0), 0
  );
  const collectionRate = totalRevenue > 0 
    ? ((totalRevenue - outstandingBalance) / totalRevenue * 100)
    : 0;

  // Calculate delivery metrics
  const deliveredCount = receipts.filter(r => r.delivery_status === 'Completed').length;
  const deliveryRate = receipts.length > 0 
    ? (deliveredCount / receipts.length * 100)
    : 0;

  // Time-based metrics
  const today = new Date();
  const thisMonth = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.created_at);
    return receiptDate.getMonth() === today.getMonth() && 
           receiptDate.getFullYear() === today.getFullYear();
  });
  const monthlyRevenue = thisMonth.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
  const monthlyProfit = thisMonth.reduce((sum, receipt) => 
    sum + ((receipt.total || 0) - (receipt.cost_ttc || 0)), 0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Receipt Statistics</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Montage Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Montage Costs:</span>
                  <span className="font-medium">{totalMontageCosts.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unpaid Montage Costs:</span>
                  <span className="font-medium text-amber-600">{unpaidMontageCosts.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Product Categories</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Single Vision ({lensTypeCosts.singleVisionCount}):</span>
                  <span className="font-medium">{lensTypeCosts.singleVision.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Progressive ({lensTypeCosts.progressiveCount}):</span>
                  <span className="font-medium">{lensTypeCosts.progressive.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frames ({lensTypeCosts.framesCount}):</span>
                  <span className="font-medium">{lensTypeCosts.frames.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunglasses ({lensTypeCosts.sunglassesCount}):</span>
                  <span className="font-medium">{lensTypeCosts.sunglasses.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accessories ({lensTypeCosts.accessoriesCount}):</span>
                  <span className="font-medium">{lensTypeCosts.accessories.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium">{totalRevenue.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Costs:</span>
                  <span className="font-medium text-red-600">{totalCosts.toFixed(2)} DH</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Profit:</span>
                  <span className="font-medium text-green-600">{totalProfit.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Average Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Ticket:</span>
                  <span className="font-medium">{averageTicket.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Profit:</span>
                  <span className="font-medium text-green-600">{averageProfit.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className="font-medium">
                    {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Revenue:</span>
                  <span className="font-medium">{monthlyRevenue.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Profit:</span>
                  <span className="font-medium text-green-600">{monthlyProfit.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Orders:</span>
                  <span className="font-medium">{thisMonth.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Operational Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Rate:</span>
                  <span className="font-medium">{collectionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outstanding Balance:</span>
                  <span className="font-medium text-amber-600">{outstandingBalance.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Rate:</span>
                  <span className="font-medium">{deliveryRate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptStatistics;
