
import React from 'react';
import { cn } from '@/lib/utils';

type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'inactive' | 'expired';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
}

const SubscriptionBadge = ({ status }: SubscriptionBadgeProps) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'suspended':
        return 'status-badge status-suspended';
      case 'cancelled':
        return 'status-badge status-cancelled';
      case 'inactive':
        return 'status-badge status-inactive';
      case 'expired':
        return 'status-badge status-expired';
      default:
        return 'status-badge status-inactive';
    }
  };

  return (
    <span className={cn(getStatusClasses())}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default SubscriptionBadge;
