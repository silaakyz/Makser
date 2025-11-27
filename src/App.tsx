import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Uretim from "./pages/Uretim";
import Makine from "./pages/Makine";
import Stoklar from "./pages/Stoklar";
import Siparisler from "./pages/Siparisler";
import Finansal from "./pages/Finansal";
import Uyarilar from "./pages/Uyarilar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/uretim" element={<Uretim />} />
          <Route path="/makine" element={<Makine />} />
          <Route path="/stoklar" element={<Stoklar />} />
          <Route path="/siparisler" element={<Siparisler />} />
          <Route path="/finansal" element={<Finansal />} />
          <Route path="/uyarilar" element={<Uyarilar />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
