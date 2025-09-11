import { useState } from "react";
import { Search, TrendingUp, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PriceCard, { type PriceData } from "@/components/PriceCard";
import heroImage from "@assets/generated_images/Tropical_islands_price_comparison_hero_c34340d8.png";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  // todo: remove mock functionality
  const featuredProducts: PriceData[] = [
    {
      id: "1",
      productName: "Lait demi-écrémé Lactel 1L",
      currentPrice: 1.85,
      previousPrice: 1.90,
      storeName: "Carrefour",
      territory: "Martinique",
      lastUpdated: "il y a 2h"
    },
    {
      id: "2",
      productName: "Pain de mie Harrys",
      currentPrice: 2.45,
      previousPrice: 2.35,
      storeName: "Super U",
      territory: "Guadeloupe", 
      lastUpdated: "il y a 4h"
    },
    {
      id: "3",
      productName: "Yaourt nature Danone x8",
      currentPrice: 3.20,
      previousPrice: 3.15,
      storeName: "E.Leclerc",
      territory: "La Réunion",
      lastUpdated: "il y a 1h"
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search triggered:', searchQuery);
  };

  const handleProductClick = (product: PriceData) => {
    console.log('Product clicked:', product.productName);
  };

  const stats = [
    { label: "Produits suivis", value: "2,500+", icon: Search },
    { label: "Prix comparés", value: "45,000+", icon: TrendingUp },
    { label: "Territoires", value: "5", icon: MapPin },
    { label: "Enseignes", value: "85+", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div 
          className="h-[50vh] bg-cover bg-center relative"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${heroImage})`
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4" data-testid="text-hero-title">
                A KI PRI SA YÉ
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Comparez les prix, trouvez les meilleures offres et économisez dans les Territoires d'Outre-Mer
              </p>
              
              <form onSubmit={handleSearch} className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-input bg-background/95 backdrop-blur text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="input-hero-search"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    data-testid="button-hero-search"
                  >
                    Chercher
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Section */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} data-testid={`card-stat-${index}`}>
                  <CardContent className="p-4 text-center">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-semibold">Produits en vedette</h2>
            <Button variant="outline" data-testid="button-see-all-products">
              Voir tous les produits
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProducts.map((product) => (
              <PriceCard
                key={product.id}
                priceData={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-semibold mb-6">Découvrir</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate cursor-pointer" data-testid="card-action-compare">
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-heading font-medium mb-2">Comparer les prix</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Trouvez le meilleur prix pour vos produits du quotidien
                </p>
                <Button>Commencer</Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer" data-testid="card-action-map">
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-heading font-medium mb-2">Explorer la carte</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Découvrez les prix par territoire d'outre-mer
                </p>
                <Button>Voir la carte</Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer" data-testid="card-action-ranking">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-heading font-medium mb-2">Palmarès</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Découvrez les enseignes les mieux notées
                </p>
                <Button>Voir le classement</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Mobile bottom padding to account for bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}