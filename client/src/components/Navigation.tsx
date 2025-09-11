import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, Trophy, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationProps {
  onSearch?: (query: string) => void;
}

export default function Navigation({ onSearch }: NavigationProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    console.log('Search triggered:', searchQuery);
  };

  const navigationItems = [
    { path: "/", label: "Accueil", icon: Home },
    { path: "/prix", label: "Prix", icon: Search },
    { path: "/carte", label: "Carte", icon: MapPin },
    { path: "/palmares", label: "Palmarès", icon: Trophy },
  ];

  const NavContent = () => (
    <nav className="flex flex-col space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
              data-testid={`nav-${item.label.toLowerCase()}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:flex-col md:w-64 md:min-h-screen md:border-r md:border-border md:bg-card">
        <div className="p-4">
          <h1 className="text-lg font-heading font-semibold text-primary mb-6">
            A KI PRI SA YÉ
          </h1>
          
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-search"
              />
            </div>
          </form>

          <NavContent />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <h1 className="text-lg font-heading font-semibold text-primary">
            A KI PRI SA YÉ
          </h1>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-heading font-semibold text-primary">Menu</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    data-testid="button-close-menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="input-search-mobile"
                    />
                  </div>
                </form>

                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Mobile Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
          <div className="flex justify-around py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-col h-12 px-3"
                    data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}