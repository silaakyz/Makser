// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Uretim from "./pages/Uretim";
import Makine from "./pages/Makine";
import Stoklar from "./pages/Stoklar";
import Siparisler from "./pages/Siparisler";
import Finansal from "./pages/Finansal";
import Uyarilar from "./pages/Uyarilar";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Debug from "./pages/Debug";

// Yeni üretim modülü import
import ProductionModule from "./modules/Production/ProductionModule";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth page - public */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/debug" element={<Debug />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            <Route
              path="/uretim"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'uretim_personeli']}>
                  <Uretim />
                </ProtectedRoute>
              }
            />

            <Route
              path="/yeni-uretim"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'uretim_personeli']}>
                  <ProductionModule />
                </ProtectedRoute>
              }
            />

            <Route
              path="/makine"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'teknisyen', 'servis_personeli']}>
                  <Makine />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stoklar"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'muhasebe', 'uretim_sefi']}>
                  <Stoklar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/siparisler"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'muhasebe', 'saha_montaj']}>
                  <Siparisler />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finansal"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'muhasebe']}>
                  <Finansal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/uyarilar"
              element={
                <ProtectedRoute allowedRoles={['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'teknisyen']}>
                  <Uyarilar />
                </ProtectedRoute>
              }
            />



            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
