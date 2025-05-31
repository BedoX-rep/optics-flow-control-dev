
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface BalanceHistoryRecord {
  id: string;
  old_balance: number;
  new_balance: number;
  change_amount: number;
  change_reason: string;
  change_date: string;
  previous_balance?: number;
}

interface PurchaseBalanceHistoryProps {
  purchaseId: string;
  userId: string;
}

const PurchaseBalanceHistory: React.FC<PurchaseBalanceHistoryProps> = ({ purchaseId, userId }) => {
  const { data: balanceHistory = [], isLoading } = useQuery({
    queryKey: ['purchase-balance-history', purchaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_balance_history')
        .select('*')
        .eq('purchase_id', purchaseId)
        .eq('user_id', userId)
        .order('change_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!purchaseId && !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Balance History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading balance history...</p>
        </CardContent>
      </Card>
    );
  }

  if (balanceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Balance History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No balance changes recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Balance History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {balanceHistory.map((record: BalanceHistoryRecord) => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {format(new Date(record.change_date), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">{record.change_reason}</p>
                <div className="text-xs text-gray-500">
                  {(record.old_balance || record.previous_balance || 0).toFixed(2)} DH → {record.new_balance.toFixed(2)} DH
                </div>
              </div>
              <div className="flex items-center gap-1">
                {record.change_amount > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className={`font-medium text-sm ${
                  record.change_amount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {record.change_amount > 0 ? '+' : ''}{record.change_amount.toFixed(2)} DH
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseBalanceHistory;
