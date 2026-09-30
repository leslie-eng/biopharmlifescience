import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import CatalogPage from "./pages/CatalogPage.tsx";
import CatalogProductPage from "./pages/CatalogProductPage.tsx";
import TheModelPage from "./pages/TheModelPage.tsx";
import FacilityAssessmentPage from "./pages/FacilityAssessmentPage.tsx";
import AkibaCalculatorPage from "./pages/AkibaCalculatorPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import StaffAuth from "./pages/StaffAuth.tsx";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Products from "./pages/dashboard/Products";
import Orders from "./pages/dashboard/Orders";
import Clients from "./pages/dashboard/Clients";
import Finances from "./pages/dashboard/Finances";
import Reports from "./pages/dashboard/Reports";
import Pos from "./pages/dashboard/Pos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/the-model" element={<TheModelPage />} />
              <Route path="/book-assessment" element={<FacilityAssessmentPage />} />
              <Route path="/akiba-calculator" element={<AkibaCalculatorPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/products" element={<CatalogPage />} />
              <Route path="/products/:slug" element={<CatalogProductPage />} />
              <Route path="/admin" element={<StaffAuth />} />
              <Route path="/staff" element={<StaffAuth />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="products" element={<Products />} />
                <Route path="pos" element={<Pos />} />
                <Route path="orders" element={<Orders />} />
                <Route path="clients" element={<Clients />} />
                <Route path="finances" element={<Finances />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
