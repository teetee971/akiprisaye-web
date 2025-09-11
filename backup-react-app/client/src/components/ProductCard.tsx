import { ShoppingCart, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/context/ProductsContext";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ 
  product, 
  variant = 'default', 
  showActions = true,
  onClick 
}: ProductCardProps) {
  const { 
    stores, 
    territories, 
    compareList, 
    userList, 
    toggleCompare, 
    addToList, 
    removeFromList 
  } = useProducts();

  const store = stores.find(s => s.id === product.store);
  const territory = territories.find(t => t.id === product.territory);

  // Calculate price trend
  const currentPrice = product.price;
  const previousPrice = product.priceHistory[product.priceHistory.length - 2]?.price || currentPrice;
  const priceDifference = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? ((priceDifference / previousPrice) * 100) : 0;

  const isInCompare = compareList.includes(product.id);
  const isInUserList = userList.includes(product.id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleCompare(product.id);
    console.log('Compare toggle result:', result);
  };

  const handleUserListToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInUserList) {
      removeFromList(product.id);
    } else {
      addToList(product.id);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  if (variant === 'compact') {
    return (
      <Card 
        className="hover-elevate cursor-pointer transition-all duration-200" 
        onClick={handleCardClick}
        data-testid={`product-card-${product.id}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-md"
              data-testid={`product-image-${product.id}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate" data-testid={`product-name-${product.id}`}>
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {product.brand}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-primary" data-testid={`product-price-${product.id}`}>
                  {currentPrice.toFixed(2)} €
                </span>
                <div className="flex items-center gap-1">
                  {showActions && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCompareToggle}
                        data-testid={`button-compare-${product.id}`}
                      >
                        {isInCompare ? (
                          <Minus className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleUserListToggle}
                        data-testid={`button-list-${product.id}`}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all duration-200" 
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          {/* Product Image */}
          <div className="relative mb-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-32 object-cover rounded-md"
              data-testid={`product-image-${product.id}`}
            />
            {/* Price trend indicator */}
            {priceDifference !== 0 && (
              <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                priceDifference > 0 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}>
                {priceDifference > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(priceChangePercent).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium text-sm line-clamp-2 leading-5 mb-1" data-testid={`product-name-${product.id}`}>
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {product.brand}
              </p>
            </div>

            {/* Category Badge */}
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>

            {/* Price */}
            <div className="space-y-1">
              <div className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
                {currentPrice.toFixed(2)} €
              </div>
              {priceDifference !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Ancien prix: {previousPrice.toFixed(2)} €
                </div>
              )}
            </div>

            {/* Store and Territory */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Enseigne:</span>
                <span className="font-medium">{store?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Territoire:</span>
                <span className="font-medium">{territory?.name}</span>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground">
              Mis à jour: {new Date(product.updatedAt).toLocaleDateString('fr-FR')}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <Button
                variant={isInCompare ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={handleCompareToggle}
                disabled={!isInCompare && compareList.length >= 4}
                data-testid={`button-compare-${product.id}`}
              >
                {isInCompare ? (
                  <>
                    <Minus className="h-3 w-3 mr-2" />
                    Retirer
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-2" />
                    Comparer
                  </>
                )}
              </Button>
              
              <Button
                variant={isInUserList ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={handleUserListToggle}
                data-testid={`button-list-${product.id}`}
              >
                {isInUserList ? (
                  <>
                    <Minus className="h-3 w-3 mr-2" />
                    Retirer
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-3 w-3 mr-2" />
                    Ma liste
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}