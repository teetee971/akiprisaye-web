import { Star, TrendingUp, TrendingDown, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface StoreData {
  id: string;
  name: string;
  territory: string;
  averagePrice: number;
  priceChange: number;
  rating: number;
  reviewCount: number;
  rank: number;
  logo?: string;
}

interface StoreRankingProps {
  stores: StoreData[];
  territory?: string;
  onStoreSelect?: (storeId: string) => void;
}

export default function StoreRanking({ stores, territory, onStoreSelect }: StoreRankingProps) {
  const handleStoreClick = (storeId: string) => {
    onStoreSelect?.(storeId);
    console.log('Store selected:', storeId);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = (priceChange: number) => {
    if (priceChange > 0) return <TrendingUp className="h-3 w-3 text-destructive" />;
    if (priceChange < 0) return <TrendingDown className="h-3 w-3 text-chart-2" />;
    return null;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  const filteredStores = territory 
    ? stores.filter(store => store.territory === territory)
    : stores;

  return (
    <Card data-testid="card-store-ranking">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Palmarès des enseignes
          {territory && <Badge variant="outline">{territory}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="hover-elevate cursor-pointer"
              onClick={() => handleStoreClick(store.id)}
              data-testid={`card-store-${store.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {getRankIcon(store.rank)}
                  </div>

                  {/* Store Logo */}
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={`Logo ${store.name}`}
                      className="w-8 h-8 object-contain flex-shrink-0"
                      data-testid={`img-store-logo-${store.id}`}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">
                        {store.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm" data-testid={`text-store-name-${store.id}`}>
                        {store.name}
                      </h3>
                      {!territory && (
                        <Badge variant="outline" className="text-xs">
                          {store.territory}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(store.rating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {store.rating.toFixed(1)} ({store.reviewCount} avis)
                      </span>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold" data-testid={`text-store-price-${store.id}`}>
                      {store.averagePrice.toFixed(2)}€
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      {getTrendIcon(store.priceChange)}
                      <span className={`text-xs ${
                        store.priceChange > 0 
                          ? "text-destructive" 
                          : store.priceChange < 0 
                            ? "text-chart-2" 
                            : "text-muted-foreground"
                      }`}>
                        {store.priceChange > 0 ? '+' : ''}
                        {store.priceChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredStores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Medal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune enseigne trouvée{territory && ` pour ${territory}`}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <Button variant="outline" className="w-full" data-testid="button-see-all-stores">
              Voir toutes les enseignes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}