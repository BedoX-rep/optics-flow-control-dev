
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Products from "@/pages/Products";
import Clients from "@/pages/Clients";
import Receipts from "@/pages/Receipts";
import Dashboard from "@/pages/Dashboard";
import Subscriptions from "@/pages/Subscriptions";
import NewReceipt from "@/pages/NewReceipt";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Welcome 🚀",
      description: "Ready to create something amazing?",
    });
  }, [toast]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route element={<Layout><Outlet /></Layout>}>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/new-receipt" element={<NewReceipt />} />
            </Route>
            <Route path="/subscriptions" element={<Subscriptions />} />
          </Route>
          
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
