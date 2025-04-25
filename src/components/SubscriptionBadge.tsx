
import React from 'react';
import { cn } from '@/lib/utils';

// Define subscription status with correct casing to match what the app uses
type SubscriptionStatus = 'active' | 'Active' | 'suspended' | 'Suspended' | 'cancelled' | 'Cancelled' | 'inactive' | 'inActive' | 'expired' | 'Expired';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
}

const SubscriptionBadge = ({ status }: SubscriptionBadgeProps) => {
  // Normalize status to lowercase for consistent class mapping
  const normalizedStatus = status.toLowerCase() as Lowercase<typeof status>;
  
  const getStatusClasses = () => {
    switch (normalizedStatus) {
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
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
};

export default SubscriptionBadge;
