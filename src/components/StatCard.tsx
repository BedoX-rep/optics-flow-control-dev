
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard = ({ title, value, change, icon, className }: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden card-shadow border border-gray-100 hover-scale", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {icon && (
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
          
          {typeof change === 'number' && (
            <div className="flex items-center mt-1.5">
              {change > 0 ? (
                <div className="flex items-center text-emerald-600 text-sm">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>{change.toFixed(1)}%</span>
                </div>
              ) : change < 0 ? (
                <div className="flex items-center text-red-600 text-sm">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">0.0%</div>
              )}
              <span className="text-gray-400 text-xs ml-1.5">vs. last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

