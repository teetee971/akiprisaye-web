import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigationItems = [
    { path: "/", label: "Accueil" },
    { path: "/produits", label: "Produits" },
    { path: "/comparateur", label: "Comparateur" },
    { path: "/carte", label: "Carte" },
    { path: "/palmares", label: "Palmarès" },
    { path: "/apropos", label: "À propos" }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Header search:', searchQuery);
    // TODO: Implement global search functionality
  };

  const NavContent = () => (
    <nav className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-1">
      {navigationItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full md:w-auto justify-start md:justify-center"
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl font-heading font-bold text-primary" data-testid="text-logo">
              A KI PRI SA YÉ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-center">
            <NavContent />
          </div>

          {/* Desktop Search and Theme Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-header-search"
              />
            </form>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="p-6">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-heading font-semibold text-primary">
                      Menu
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsOpen(false)}
                      data-testid="button-close-mobile-menu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-mobile-search"
                      />
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}