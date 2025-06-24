import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Clients from "./pages/Clients";
import Receipts from "./pages/Receipts";
import Purchases from './pages/Purchases';
import Financial from './pages/Financial';
import Access from './pages/Access';
import OpticianSettings from './pages/OpticianSettings';
import Personalisation from './pages/Personalisation';
import Subscriptions from './pages/Subscriptions';
import NewReceipt from "./pages/NewReceipt";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Pricing from './pages/Pricing';
import HowToUse from './pages/HowToUse';
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { LanguageProvider } from "./components/LanguageProvider";
import Invoices from './pages/Invoices';

// Create a client with caching options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
      networkMode: 'offlineFirst',
      refetchInterval: false
    },
  },
});

// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  requiresActiveSubscription = true,
  requiredPermission
}: { 
  children: React.ReactNode;
  requiresActiveSubscription?: boolean;
  requiredPermission?: string;
}) => {
  const { user, subscription, isLoading, permissions, sessionRole } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  // Effect to handle instant redirects when sessionRole changes
  useEffect(() => {
    if (isLoading || !user) return;

    // Check permission requirements
    if (requiredPermission) {
      // Special case for admin session requirement
      if (requiredPermission === 'admin_session') {
        if (sessionRole !== 'Admin') {
          setShouldRedirect('/dashboard');
          return;
        }
      }
      // Check regular permissions for non-admin sessions
      else if (sessionRole !== 'Admin') {
        if (!permissions || !permissions[requiredPermission as keyof typeof permissions]) {
          setShouldRedirect('/dashboard');
          return;
        }
      }
    }

    // Check subscription requirements
    if (requiresActiveSubscription && subscription) {
      const subStatus = subscription.subscription_status.toLowerCase();
      if (subStatus !== 'active') {
        setShouldRedirect('/subscriptions');
        return;
      }
    }

    // Clear redirect if all checks pass
    setShouldRedirect(null);
  }, [sessionRole, permissions, subscription, requiredPermission, requiresActiveSubscription, isLoading, user]);

  // Show loading state while initial auth check is happening
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-24 bg-gray-200 rounded-md mb-4"></div>
          <div className="h-2 w-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Only redirect if we're sure there's no user after loading
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Handle instant redirects
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  return <>{children}</>;
};

// App Routes
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/pricing" element={<Pricing />} />
	  <Route path="/how-to-use" element={<HowToUse />} />

    <Route path="/dashboard/*" element={
      <ProtectedRoute>
        <Layout><Dashboard /></Layout>
      </ProtectedRoute>
    } />

    <Route path="/products/*" element={
              <ProtectedRoute requiredPermission="can_manage_products">
                <Layout><Products /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/clients/*" element={
              <ProtectedRoute requiredPermission="can_manage_clients">
                <Layout><Clients /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/receipts/*" element={
              <ProtectedRoute requiredPermission="can_manage_receipts">
                <Layout><Receipts /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/financial/*" element={
              <ProtectedRoute requiredPermission="can_view_financial">
                <Layout><Financial /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/purchases/*" element={
              <ProtectedRoute requiredPermission="can_manage_purchases">
                <Layout><Purchases /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/access/*" element={
              <ProtectedRoute requiredPermission="admin_session">
                <Layout><Access /></Layout>
              </ProtectedRoute>
            } />

    <Route path="/new-receipt/*" element={
      <ProtectedRoute>
        <Layout><NewReceipt /></Layout>
      </ProtectedRoute>
    } />

    <Route path="/optician-settings/*" element={
              <ProtectedRoute requiredPermission="admin_session">
                <Layout><OpticianSettings /></Layout>
              </ProtectedRoute>
            } />

    <Route path="/personalisation/*" element={
              <ProtectedRoute requiredPermission="admin_session">
                <Layout><Personalisation /></Layout>
              </ProtectedRoute>
            } />

    <Route path="/subscriptions/*" element={
      <ProtectedRoute requiresActiveSubscription={false}>
        <Layout><Subscriptions /></Layout>
      </ProtectedRoute>
    } />

    <Route path="/invoices/*" element={
              <ProtectedRoute requiredPermission="can_manage_invoices">
                <Layout><Invoices /></Layout>
              </ProtectedRoute>
            } />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;