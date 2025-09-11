import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProductsProvider } from "@/context/ProductsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import ProductsPage from "@/pages/ProductsPage";
import ComparePage from "@/pages/ComparePage";
import MapPage from "@/pages/MapPage";
import RankingPage from "@/pages/RankingPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/produits" element={<ProductsPage />} />
      <Route path="/comparateur" element={<ComparePage />} />
      <Route path="/carte" element={<MapPage />} />
      <Route path="/palmares" element={<RankingPage />} />
      <Route path="/apropos" element={<AboutPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ProductsProvider>
          <TooltipProvider>
            <div className="flex flex-col min-h-screen bg-background">
              {/* Header */}
              <Header />

              {/* Main Content */}
              <main className="flex-1">
                <Router />
              </main>

              {/* Footer */}
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </ProductsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;