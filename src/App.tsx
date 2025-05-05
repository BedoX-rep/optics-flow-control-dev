
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
import NewReceipt from "./pages/NewReceipt";
import Subscriptions from "./pages/Subscriptions";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { LanguageProvider } from "./components/LanguageProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ 
  children, 
  requiresActiveSubscription = true 
}: { 
  children: React.ReactNode;
  requiresActiveSubscription?: boolean;
}) => {
  const { user, subscription, isLoading } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isLoading && requiresActiveSubscription && subscription) {
    const subStatus = subscription.subscription_status.toLowerCase();
    if (subStatus !== 'active') {
      return <Navigate to="/subscriptions" replace />;
    }
  }

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

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/pricing" element={<Pricing />} />
    
    <Route element={<Layout />}>
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      } />
      <Route path="/receipts" element={
        <ProtectedRoute>
          <Receipts />
        </ProtectedRoute>
      } />
      <Route path="/new-receipt" element={
        <ProtectedRoute>
          <NewReceipt />
        </ProtectedRoute>
      } />
      <Route path="/subscriptions" element={
        <ProtectedRoute requiresActiveSubscription={false}>
          <Subscriptions />
        </ProtectedRoute>
      } />
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
