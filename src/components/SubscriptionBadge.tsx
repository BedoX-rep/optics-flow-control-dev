
import React from 'react';
import { cn } from '@/lib/utils';

type SubscriptionStatus = 'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
}

const SubscriptionBadge = ({ status }: SubscriptionBadgeProps) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'Active':
        return 'status-badge status-active';
      case 'Suspended':
        return 'status-badge status-suspended';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      case 'inActive':
        return 'status-badge status-inactive';
      case 'Expired':
        return 'status-badge status-expired';
      default:
        return 'status-badge status-inactive';
    }
  };

  return (
    <span className={cn(getStatusClasses())}>
      {status}
    </span>
  );
};

export default SubscriptionBadge;
