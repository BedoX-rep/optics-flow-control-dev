
import React from "react";

interface Receipt {
  delivery_status?: string;
  montage_status?: string;
  payment_status?: string;
  balance: number;
  total: number;
}

interface ReceiptStatsSummaryProps {
  receipts: Receipt[];
}

const ReceiptStatsSummary: React.FC<ReceiptStatsSummaryProps> = ({ receipts }) => {
  const total = receipts.length;
  const totalAmount = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalBalance = receipts.reduce((sum, r) => sum + (r.balance || 0), 0);
  
  const stats = [
    {
      label: "Pending",
      count: receipts.filter(r => r.delivery_status !== 'Completed').length
    },
    {
      label: "Unpaid",
      count: receipts.filter(r => r.balance > 0).length
    },
    {
      label: "Completed",
      count: receipts.filter(r => 
        r.delivery_status === 'Completed' && 
        r.montage_status === 'Completed' && 
        r.balance === 0
      ).length
    }
  ];

  return (
    <div className="flex flex-col items-start gap-0.5 min-w-[130px]">
      <div className="flex items-baseline gap-1">
        <span className="text-[1.35rem] leading-none font-bold text-black">{total}</span>
        <span className="text-gray-400 text-xs font-medium font-inter">receipts</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {stats.map(({ label, count }) => (
          <span
            key={label}
            className="border border-black/15 px-1.5 py-0.5 rounded-full bg-white font-medium text-xs text-black/70"
          >
            {label}: {count}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ReceiptStatsSummary;
