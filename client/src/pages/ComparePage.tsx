import { X, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/context/ProductsContext";
import { Link } from "react-router-dom";

export default function ComparePage() {
  const { 
    compareProducts, 
    stores, 
    territories, 
    toggleCompare, 
    clearCompareList 
  } = useProducts();

  if (compareProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-heading font-semibold mb-2">Aucun produit en comparaison</h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez des produits à comparer depuis le catalogue pour voir leurs différences de prix
          </p>
          <Link to="/produits">
            <Button data-testid="button-go-to-products">
              Parcourir les produits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
        
        {compareProducts.length > 0 && (
          <Button 
            variant="outline" 
            onClick={clearCompareList}
            data-testid="button-clear-comparison"
          >
            <X className="h-4 w-4 mr-2" />
            Vider la comparaison
          </Button>
        )}
      </div>

      {/* Comparison Table */}
      <div className="grid gap-6">
        {/* Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {compareProducts.map((product) => {
            const store = stores.find(s => s.id === product.store);
            const territory = territories.find(t => t.id === product.territory);
            
            // Calculate price trend
            const currentPrice = product.price;
            const previousPrice = product.priceHistory[product.priceHistory.length - 2]?.price || currentPrice;
            const priceDifference = currentPrice - previousPrice;
            const priceChangePercent = previousPrice ? ((priceDifference / previousPrice) * 100) : 0;

            return (
              <Card key={product.id} className="relative" data-testid={`card-compare-product-${product.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 z-10"
                  onClick={() => toggleCompare(product.id)}
                  data-testid={`button-remove-${product.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <CardContent className="p-4">
                  <div className="text-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-md mx-auto mb-3"
                      data-testid={`img-compare-product-${product.id}`}
                    />
                    
                    <h3 className="font-medium text-sm mb-1 line-clamp-2" data-testid={`text-compare-name-${product.id}`}>
                      {product.name}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      {product.brand}
                    </p>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-primary mb-1" data-testid={`text-compare-price-${product.id}`}>
                        {currentPrice.toFixed(2)} €
                      </div>
                      
                      {priceDifference !== 0 && (
                        <div className={`flex items-center justify-center gap-1 text-xs ${
                          priceDifference > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {priceDifference > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(priceChangePercent).toFixed(1)}%
                        </div>
                      )}
                    </div>

                    {/* Store and Territory */}
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-store-${product.id}`}>
                        {store?.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs block" data-testid={`badge-territory-${product.id}`}>
                        {territory?.name}
                      </Badge>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Catégorie: {product.category}</div>
                        <div>Mis à jour: {new Date(product.updatedAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Price Comparison Summary */}
        {compareProducts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la comparaison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {Math.min(...compareProducts.map(p => p.price)).toFixed(2)} €
                  </div>
                  <div className="text-sm text-muted-foreground">Prix le plus bas</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {Math.max(...compareProducts.map(p => p.price)).toFixed(2)} €
                  </div>
                  <div className="text-sm text-muted-foreground">Prix le plus haut</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {(compareProducts.reduce((sum, p) => sum + p.price, 0) / compareProducts.length).toFixed(2)} €
                  </div>
                  <div className="text-sm text-muted-foreground">Prix moyen</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Vous pouvez comparer jusqu'à 4 produits simultanément. 
                Ajoutez plus de produits depuis le{' '}
                <Link to="/produits" className="text-primary hover:underline">
                  catalogue des produits
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}