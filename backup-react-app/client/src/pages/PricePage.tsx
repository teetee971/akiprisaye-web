import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PriceCard, { type PriceData } from "@/components/PriceCard";
import PriceChart, { type PriceHistoryData } from "@/components/PriceChart";

export default function PricePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<PriceData | null>(null);

  // todo: remove mock functionality
  const mockProducts: PriceData[] = [
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
    },
    {
      id: "4",
      productName: "Riz basmati Taureau Ailé 1kg",
      currentPrice: 4.50,
      previousPrice: 4.75,
      storeName: "Leader Price",
      territory: "Guyane",
      lastUpdated: "il y a 3h"
    }
  ];

  const mockPriceHistory: PriceHistoryData[] = [
    { date: '2024-01-01', price: 1.95, store: 'Carrefour' },
    { date: '2024-01-05', price: 1.90, store: 'Super U' },
    { date: '2024-01-10', price: 1.85, store: 'Carrefour' },
    { date: '2024-01-15', price: 1.92, store: 'Leclerc' },
    { date: '2024-01-20', price: 1.88, store: 'Super U' },
    { date: '2024-01-25', price: 1.85, store: 'Carrefour' },
    { date: '2024-01-30', price: 1.87, store: 'Leclerc' },
  ];

  const territories = ["Martinique", "Guadeloupe", "La Réunion", "Guyane", "Mayotte"];
  const categories = ["Alimentation", "Hygiène", "Entretien", "Boissons"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search triggered:', searchQuery);
  };

  const handleProductClick = (product: PriceData) => {
    setSelectedProduct(product);
    console.log('Product selected for detail:', product.productName);
  };

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerritory = selectedTerritory === "all" || product.territory === selectedTerritory;
    return matchesSearch && matchesTerritory;
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2" data-testid="text-page-title">
            Comparateur de prix
          </h1>
          <p className="text-muted-foreground">
            Trouvez les meilleurs prix pour vos produits du quotidien
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="input-product-search"
                />
              </div>
            </form>

            <div className="flex flex-wrap gap-3">
              <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
                <SelectTrigger className="w-48" data-testid="select-territory">
                  <SelectValue placeholder="Territoire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les territoires</SelectItem>
                  {territories.map((territory) => (
                    <SelectItem key={territory} value={territory}>
                      {territory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="select-category">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" data-testid="button-more-filters">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Plus de filtres
              </Button>
            </div>

            {(selectedTerritory !== "all" || selectedCategory !== "all" || searchQuery) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {searchQuery && (
                  <Badge variant="secondary" data-testid="badge-search-filter">
                    Recherche: {searchQuery}
                  </Badge>
                )}
                {selectedTerritory !== "all" && (
                  <Badge variant="secondary">
                    {selectedTerritory}
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary">
                    {selectedCategory}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTerritory("all");
                    setSelectedCategory("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Effacer les filtres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Produits ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredProducts.map((product) => (
                  <PriceCard
                    key={product.id}
                    priceData={product}
                    onClick={handleProductClick}
                  />
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit trouvé</p>
                    <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Detail */}
          <div>
            {selectedProduct ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedProduct.productName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Prix actuel</div>
                      <div className="text-2xl font-bold text-primary">
                        {selectedProduct.currentPrice.toFixed(2)}€
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Enseigne</div>
                      <div className="font-medium">{selectedProduct.storeName}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Territoire</div>
                      <Badge variant="outline">{selectedProduct.territory}</Badge>
                    </div>

                    <Button className="w-full" data-testid="button-see-stores">
                      Voir dans toutes les enseignes
                    </Button>
                  </CardContent>
                </Card>

                <PriceChart
                  data={mockPriceHistory}
                  productName={selectedProduct.productName}
                  territory={selectedProduct.territory}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Cliquez sur un produit pour voir les détails et l'évolution des prix</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}