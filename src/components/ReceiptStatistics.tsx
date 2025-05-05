
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
  receipt_items: Array<{
    product?: {
      category?: string;
    };
    cost: number;
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

  // Calculate costs for different lens types
  const lensTypeCosts = receipts.reduce((acc, receipt) => {
    receipt.receipt_items?.forEach(item => {
      if (item.product?.category === 'Single Vision Lenses') {
        acc.singleVision += item.cost || 0;
      } else if (item.product?.category === 'Progressive Lenses') {
        acc.progressive += item.cost || 0;
      }
    });
    return acc;
  }, { singleVision: 0, progressive: 0 });

  // Calculate total costs
  const totalCosts = receipts.reduce((sum, receipt) => 
    sum + (receipt.cost_ttc || 0), 0
  );

  // Calculate total revenue
  const totalRevenue = receipts.reduce((sum, receipt) => 
    sum + (receipt.total || 0), 0
  );

  // Calculate total profit
  const totalProfit = totalRevenue - totalCosts;

  // Calculate outstanding balance
  const outstandingBalance = receipts.reduce((sum, receipt) => 
    sum + (receipt.balance || 0), 0
  );

  // Calculate collection rate
  const collectionRate = totalRevenue > 0 
    ? ((totalRevenue - outstandingBalance) / totalRevenue * 100).toFixed(1) 
    : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Receipt Statistics</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
              <h3 className="text-lg font-semibold mb-4">Lens Costs</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Single Vision Lenses:</span>
                  <span className="font-medium">{lensTypeCosts.singleVision.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Progressive Lenses:</span>
                  <span className="font-medium">{lensTypeCosts.progressive.toFixed(2)} DH</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Lens Costs:</span>
                  <span className="font-medium">{(lensTypeCosts.singleVision + lensTypeCosts.progressive).toFixed(2)} DH</span>
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
              <h3 className="text-lg font-semibold mb-4">Collection Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Outstanding Balance:</span>
                  <span className="font-medium text-amber-600">{outstandingBalance.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Rate:</span>
                  <span className="font-medium">{collectionRate}%</span>
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
