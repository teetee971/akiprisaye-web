import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PriceData {
  id: string;
  productName: string;
  currentPrice: number;
  previousPrice: number;
  storeName: string;
  territory: string;
  imageUrl?: string;
  lastUpdated: string;
}

interface PriceCardProps {
  priceData: PriceData;
  onClick?: (priceData: PriceData) => void;
}

export default function PriceCard({ priceData, onClick }: PriceCardProps) {
  const priceDiff = priceData.currentPrice - priceData.previousPrice;
  const priceChangePercent = ((priceDiff / priceData.previousPrice) * 100).toFixed(1);
  
  const getTrendIcon = () => {
    if (priceDiff > 0) return <TrendingUp className="h-3 w-3" />;
    if (priceDiff < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (priceDiff > 0) return "text-destructive";
    if (priceDiff < 0) return "text-chart-2";
    return "text-muted-foreground";
  };

  const handleClick = () => {
    onClick?.(priceData);
    console.log('Price card clicked:', priceData.productName);
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer"
      onClick={handleClick}
      data-testid={`card-product-${priceData.id}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Product Image */}
          {priceData.imageUrl ? (
            <img
              src={priceData.imageUrl}
              alt={priceData.productName}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              data-testid={`img-product-${priceData.id}`}
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">IMG</span>
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 mb-1" data-testid={`text-product-name-${priceData.id}`}>
              {priceData.productName}
            </h3>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {priceData.territory}
              </Badge>
              <span className="text-xs text-muted-foreground">{priceData.storeName}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg" data-testid={`text-price-${priceData.id}`}>
                  {priceData.currentPrice.toFixed(2)}€
                </span>
                
                {priceDiff !== 0 && (
                  <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span className="text-xs font-medium">
                      {Math.abs(parseFloat(priceChangePercent))}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              Mis à jour {priceData.lastUpdated}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}