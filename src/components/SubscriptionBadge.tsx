
import React from 'react';
import { cn } from '@/lib/utils';

type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'inactive' | 'expired' | 'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
}

const SubscriptionBadge = ({ status }: SubscriptionBadgeProps) => {
  const normalizedStatus = typeof status === 'string' ? status : 'inactive';

  const getStatusClasses = () => {
    const statusLower = normalizedStatus.toLowerCase();
    
    switch (statusLower) {
      case 'active':
        return 'status-badge status-active';
      case 'suspended':
        return 'status-badge status-suspended';
      case 'cancelled':
        return 'status-badge status-cancelled';
      case 'inactive':
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
      {normalizedStatus}
    </span>
  );
};

export default SubscriptionBadge;
