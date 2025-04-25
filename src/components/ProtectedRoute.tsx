import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const ProtectedRoute: React.FC = () => {
  const { user, loading, subscription, subscriptionLoading } = useAuth();

  // Show loading indicator while checking auth or subscription status
  if (loading || (user && subscriptionLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated but subscription isn't active, redirect to subscriptions page
  if (
    subscription &&
    subscription.subscription_status !== 'Active' &&
    !window.location.pathname.includes('/subscriptions')
  ) {
    return <Navigate to="/subscriptions" replace />;
  }

  // Otherwise, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
