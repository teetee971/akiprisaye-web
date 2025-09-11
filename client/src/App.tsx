import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Home from "@/pages/Home";
import PricePage from "@/pages/PricePage";
import MapPage from "@/pages/MapPage";
import RankingPage from "@/pages/RankingPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/prix" component={PricePage} />
      <Route path="/carte" component={MapPage} />
      <Route path="/palmares" component={RankingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const handleSearch = (query: string) => {
    console.log('Global search:', query);
    // todo: implement global search functionality
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex min-h-screen bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Navigation onSearch={handleSearch} />
          </div>

          {/* Main Content */}
          <div className="flex-1 md:ml-0">
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Navigation onSearch={handleSearch} />
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-end p-4 border-b border-border">
              <ThemeToggle />
            </div>

            {/* Page Content */}
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;