
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PurchaseBalanceHistoryProps {
  purchaseId: string;
  userId: string;
}

interface BalanceHistoryItem {
  id: string;
  purchase_id: string;
  user_id: string;
  old_balance: number;
  new_balance: number;
  change_amount: number;
  change_reason: string | null;
  change_date: string;
}

const PurchaseBalanceHistory: React.FC<PurchaseBalanceHistoryProps> = ({ purchaseId, userId }) => {
  const { data: balanceHistory = [], isLoading, error } = useQuery<BalanceHistoryItem[]>({
    queryKey: ['purchase-balance-history', purchaseId, userId],
    queryFn: async () => {
      if (!purchaseId || !userId) return [];

      const { data, error } = await supabase
        .from('purchase_balance_history')
        .select('*')
        .eq('purchase_id', purchaseId)
        .eq('user_id', userId)
        .order('change_date', { ascending: false });

      if (error) {
        console.error('Error fetching purchase balance history:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!purchaseId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Balance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Balance History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Error loading balance history</p>
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' HH:mm");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Balance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {balanceHistory.map((item) => (
            <div key={item.id} className="border-l-2 border-blue-200 pl-3 pb-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-gray-500">
                  {formatDate(item.change_date)}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  item.change_amount < 0 ? "text-green-600" : "text-red-600"
                )}>
                  {item.change_amount > 0 ? "+" : ""}{item.change_amount.toFixed(2)} DH
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Balance: </span>
                <span className="line-through text-gray-400">
                  {item.old_balance.toFixed(2)} DH
                </span>
                <span className="mx-2">→</span>
                <span className="font-medium">
                  {item.new_balance.toFixed(2)} DH
                </span>
              </div>
              {item.change_reason && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  {item.change_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseBalanceHistory;
