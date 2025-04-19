
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
}

const StatCard = ({ title, value, change = 0, icon }: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            
            {change !== 0 && (
              <div className="flex items-center mt-2">
                {change > 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(change)}% {change > 0 ? 'growth' : 'loss'}
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="p-2 rounded-full bg-optics-100 text-optics-600">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
