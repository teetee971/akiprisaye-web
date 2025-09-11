import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Product, Store, Territory } from '@shared/schema';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ComparisonTableProps {
  products: Product[];
  stores: Store[];
  territories: Territory[];
  onRemoveProduct: (productId: string) => void;
  className?: string;
}

export default function ComparisonTable({ 
  products, 
  stores, 
  territories, 
  onRemoveProduct, 
  className 
}: ComparisonTableProps) {
  
  if (products.length === 0) {
    return (
      <Card className={className} data-testid="card-comparison-table-empty">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <div className="text-lg font-medium mb-2">Aucun produit à comparer</div>
            <p className="text-sm">Ajoutez des produits à votre liste de comparaison pour voir le tableau.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcul du prix minimum pour highlighting
  const minPrice = Math.min(...products.map(p => p.price));
  
  // Fonction utilitaire pour obtenir les informations du magasin et territoire
  const getStoreInfo = (storeId: string) => stores.find(s => s.id === storeId);
  const getTerritoryInfo = (territoryId: string) => territories.find(t => t.id === territoryId);

  // Calcul des tendances de prix
  const getPriceTrend = (product: Product) => {
    if (!product.priceHistory || product.priceHistory.length < 2) {
      return { trend: 'stable', change: 0, changePercent: 0 };
    }

    const currentPrice = product.price;
    const previousPrice = product.priceHistory[product.priceHistory.length - 2]?.price || currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice ? ((change / previousPrice) * 100) : 0;

    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change,
      changePercent
    };
  };

  return (
    <Card className={className} data-testid="card-comparison-table">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tableau de comparaison</span>
          <Badge variant="outline" className="text-xs" data-testid="badge-comparison-count">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Version desktop - Table classique */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>Tendance</TableHead>
                <TableHead>Enseigne</TableHead>
                <TableHead>Territoire</TableHead>
                <TableHead>Mise à jour</TableHead>
                <TableHead className="w-16">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const store = getStoreInfo(product.store);
                const territory = getTerritoryInfo(product.territory);
                const priceTrend = getPriceTrend(product);
                const isBestPrice = product.price === minPrice;
                
                return (
                  <TableRow 
                    key={product.id} 
                    className={isBestPrice ? "bg-green-50 dark:bg-green-950/20" : ""} 
                    data-testid={`row-product-${product.id}`}
                  >
                    <TableCell>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                        data-testid={`img-product-${product.id}`}
                      />
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-sm line-clamp-2" data-testid={`text-name-${product.id}`}>
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.brand} • {product.category}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className={`font-bold text-lg ${isBestPrice ? 'text-green-600' : 'text-foreground'}`}>
                        <span data-testid={`text-price-${product.id}`}>
                          {product.price.toFixed(2)}€
                        </span>
                        {isBestPrice && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                            Meilleur prix
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {priceTrend.trend !== 'stable' ? (
                        <div className={`flex items-center gap-1 text-xs ${
                          priceTrend.trend === 'up' ? 'text-red-600' : 'text-green-600'
                        }`} data-testid={`trend-${product.id}`}>
                          {priceTrend.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(priceTrend.changePercent).toFixed(1)}%
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Minus className="h-3 w-3" />
                          Stable
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-store-${product.id}`}>
                        {store?.name || 'Inconnu'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary" data-testid={`badge-territory-${product.id}`}>
                        {territory?.name || 'Inconnu'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(product.updatedAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveProduct(product.id)}
                        className="h-8 w-8"
                        data-testid={`button-remove-${product.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Version mobile - Cards scrollables */}
        <div className="md:hidden space-y-4 p-4">
          {products.map((product) => {
            const store = getStoreInfo(product.store);
            const territory = getTerritoryInfo(product.territory);
            const priceTrend = getPriceTrend(product);
            const isBestPrice = product.price === minPrice;
            
            return (
              <Card 
                key={product.id} 
                className={`relative ${isBestPrice ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                data-testid={`card-mobile-product-${product.id}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 z-10"
                  onClick={() => onRemoveProduct(product.id)}
                  data-testid={`button-mobile-remove-${product.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      data-testid={`img-mobile-product-${product.id}`}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm mb-1 line-clamp-2" data-testid={`text-mobile-name-${product.id}`}>
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {product.brand} • {product.category}
                      </div>
                      
                      {/* Prix et tendance */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`font-bold text-lg ${isBestPrice ? 'text-green-600' : 'text-foreground'}`}>
                          <span data-testid={`text-mobile-price-${product.id}`}>
                            {product.price.toFixed(2)}€
                          </span>
                          {isBestPrice && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                              Meilleur
                            </Badge>
                          )}
                        </div>
                        
                        {priceTrend.trend !== 'stable' ? (
                          <div className={`flex items-center gap-1 text-xs ${
                            priceTrend.trend === 'up' ? 'text-red-600' : 'text-green-600'
                          }`} data-testid={`mobile-trend-${product.id}`}>
                            {priceTrend.trend === 'up' ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(priceTrend.changePercent).toFixed(1)}%
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Minus className="h-3 w-3" />
                            Stable
                          </div>
                        )}
                      </div>
                      
                      {/* Badges enseigne et territoire */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs" data-testid={`badge-mobile-store-${product.id}`}>
                          {store?.name || 'Inconnu'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-mobile-territory-${product.id}`}>
                          {territory?.name || 'Inconnu'}
                        </Badge>
                      </div>
                      
                      {/* Date de mise à jour */}
                      <div className="text-xs text-muted-foreground">
                        Mis à jour le {format(new Date(product.updatedAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Résumé en bas */}
        <div className="border-t p-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600" data-testid="text-summary-min-price">
                {minPrice.toFixed(2)}€
              </div>
              <div className="text-xs text-muted-foreground">Prix minimum</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600" data-testid="text-summary-max-price">
                {Math.max(...products.map(p => p.price)).toFixed(2)}€
              </div>
              <div className="text-xs text-muted-foreground">Prix maximum</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary" data-testid="text-summary-avg-price">
                {(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}€
              </div>
              <div className="text-xs text-muted-foreground">Prix moyen</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600" data-testid="text-summary-price-range">
                {(Math.max(...products.map(p => p.price)) - minPrice).toFixed(2)}€
              </div>
              <div className="text-xs text-muted-foreground">Écart de prix</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}