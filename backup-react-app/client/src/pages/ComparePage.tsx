import { X, Plus, BarChart3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/context/ProductsContext";
import { Link } from "react-router-dom";
import PriceChart from "@/components/PriceChart";
import ComparisonTable from "@/components/ComparisonTable";

export default function ComparePage() {
  const { 
    compareProducts, 
    stores, 
    territories, 
    toggleCompare, 
    clearCompareList 
  } = useProducts();

  // Fonction pour retirer un produit de la comparaison
  const handleRemoveProduct = (productId: string) => {
    toggleCompare(productId);
  };

  // État vide : aucun produit en comparaison
  if (compareProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="relative mb-6">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <Plus className="h-8 w-8 text-primary bg-background rounded-full border-2 border-background" />
            </div>
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2" data-testid="text-empty-title">
            Aucun produit en comparaison
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Ajoutez au moins 2 produits à comparer depuis le catalogue pour visualiser 
            l'évolution des prix et leurs différences
          </p>
          
          <div className="space-y-4">
            <Link to="/produits">
              <Button data-testid="button-go-to-products" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Parcourir les produits
              </Button>
            </Link>
            
            <div className="text-xs text-muted-foreground">
              Vous pouvez comparer jusqu'à 4 produits simultanément
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État avec moins de 2 produits : encourager l'ajout
  if (compareProducts.length === 1) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2" data-testid="text-page-title">
              Comparaison de produits
            </h1>
            <p className="text-muted-foreground">
              1 produit sélectionné • Ajoutez au moins un autre pour comparer
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={clearCompareList}
            data-testid="button-clear-comparison"
          >
            <X className="h-4 w-4 mr-2" />
            Vider la comparaison
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Produit actuel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5" />
                Produit sélectionné
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonTable
                products={compareProducts}
                stores={stores}
                territories={territories}
                onRemoveProduct={handleRemoveProduct}
              />
            </CardContent>
          </Card>

          {/* Encourager l'ajout */}
          <Card className="border-dashed border-2 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center">
                <Plus className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Ajoutez un autre produit</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Comparez les prix et visualisez l'évolution avec au moins 2 produits
                </p>
                <Link to="/produits">
                  <Button data-testid="button-add-more-products">
                    Parcourir les produits
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // État complet : 2-4 produits en comparaison
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2" data-testid="text-page-title">
            Comparaison de produits
          </h1>
          <p className="text-muted-foreground">
            Comparez {compareProducts.length} produit{compareProducts.length !== 1 ? 's' : ''} pour trouver la meilleure offre
          </p>
        </div>
        
        <div className="flex gap-2">
          {compareProducts.length < 4 && (
            <Link to="/produits">
              <Button variant="secondary" data-testid="button-add-more">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </Link>
          )}
          
          <Button 
            variant="outline" 
            onClick={clearCompareList}
            data-testid="button-clear-comparison"
          >
            <X className="h-4 w-4 mr-2" />
            Vider la comparaison
          </Button>
        </div>
      </div>

      {/* Tabs pour organiser les vues */}
      <Tabs defaultValue="chart" className="space-y-6" data-testid="tabs-comparison">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="chart" className="flex items-center gap-2" data-testid="tab-chart">
            <BarChart3 className="h-4 w-4" />
            Graphique
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2" data-testid="tab-table">
            <Table2 className="h-4 w-4" />
            Tableau
          </TabsTrigger>
        </TabsList>

        {/* Vue Graphique */}
        <TabsContent value="chart" className="space-y-6">
          <PriceChart 
            products={compareProducts}
            data-testid="price-chart-comparison"
          />

          {/* Résumé des prix */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la comparaison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1" data-testid="text-summary-min">
                    {Math.min(...compareProducts.map(p => p.price)).toFixed(2)}€
                  </div>
                  <div className="text-sm text-muted-foreground">Prix le plus bas</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1" data-testid="text-summary-max">
                    {Math.max(...compareProducts.map(p => p.price)).toFixed(2)}€
                  </div>
                  <div className="text-sm text-muted-foreground">Prix le plus haut</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1" data-testid="text-summary-avg">
                    {(compareProducts.reduce((sum, p) => sum + p.price, 0) / compareProducts.length).toFixed(2)}€
                  </div>
                  <div className="text-sm text-muted-foreground">Prix moyen</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1" data-testid="text-summary-range">
                    {(Math.max(...compareProducts.map(p => p.price)) - Math.min(...compareProducts.map(p => p.price))).toFixed(2)}€
                  </div>
                  <div className="text-sm text-muted-foreground">Écart de prix</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vue Tableau */}
        <TabsContent value="table" className="space-y-6">
          <ComparisonTable
            products={compareProducts}
            stores={stores}
            territories={territories}
            onRemoveProduct={handleRemoveProduct}
          />
        </TabsContent>
      </Tabs>

      {/* Help Text et suggestions */}
      <Card className="bg-muted/50 mt-8">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="font-semibold mb-2">Conseils de comparaison</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Utilisez l'onglet "Graphique" pour voir l'évolution des prix</li>
                <li>• L'onglet "Tableau" offre une vue détaillée et mobile-friendly</li>
                <li>• Le meilleur prix est toujours mis en évidence en vert</li>
                <li>• Vous pouvez comparer jusqu'à 4 produits simultanément</li>
              </ul>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Trouvez plus de produits à comparer
              </p>
              <Link to="/produits">
                <Button variant="outline" data-testid="button-browse-more">
                  Parcourir le catalogue
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}