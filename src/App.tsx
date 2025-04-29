
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
import { AuthProvider, useAuth } from "./components/AuthProvider";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  requiresActiveSubscription = true 
}: { 
  children: React.ReactNode;
  requiresActiveSubscription?: boolean;
}) => {
  const { user, subscription, isLoading } = useAuth();
  
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
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  const subStatus = subscription?.subscription_status.toLowerCase();
  
  // Only redirect non-active subscriptions to subscription page
  if (requiresActiveSubscription && (!subscription || subStatus !== 'active')) {
    return <Navigate to="/subscriptions" replace />;
  }
  
  return <>{children}</>;
};

// App Routes
const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    
    <Route path="/" element={
      <ProtectedRoute>
        <Layout><Dashboard /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/products" element={
      <ProtectedRoute>
        <Layout><Products /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/clients" element={
      <ProtectedRoute>
        <Layout><Clients /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/receipts" element={
      <ProtectedRoute>
        <Layout><Receipts /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/new-receipt" element={
      <ProtectedRoute>
        <Layout><NewReceipt /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="/subscriptions" element={
      <ProtectedRoute requiresActiveSubscription={false}>
        <Layout><Subscriptions /></Layout>
      </ProtectedRoute>
    } />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
