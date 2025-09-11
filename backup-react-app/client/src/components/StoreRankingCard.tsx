import { Crown, Medal, Trophy, TrendingUp, TrendingDown, MapPin, Package, Star, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useProducts } from "@/context/ProductsContext";
import { StoreCardAnimation, PodiumAnimation, ScoreCountAnimation } from "./RankingAnimations";
import type { StoreMetrics } from "./StoreMetrics";
import type { Store } from "@shared/schema";

interface StoreRankingCardProps {
  metrics: StoreMetrics;
  rank: number;
  store: Store;
  onStoreClick?: (storeId: string) => void;
  showDetailedMetrics?: boolean;
  compact?: boolean;
}

export default function StoreRankingCard({ 
  metrics, 
  rank, 
  store,
  onStoreClick,
  showDetailedMetrics = false,
  compact = false
}: StoreRankingCardProps) {
  const { territories } = useProducts();

  const handleStoreClick = () => {
    onStoreClick?.(store.id);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" data-testid={`icon-rank-1-${store.id}`} />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" data-testid={`icon-rank-2-${store.id}`} />;
      case 3:
        return <Trophy className="h-6 w-6 text-amber-600" data-testid={`icon-rank-3-${store.id}`} />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground" data-testid={`text-rank-${store.id}`}>
              {position}
            </span>
          </div>
        );
    }
  };

  const getRankCardStyle = (position: number) => {
    switch (position) {
      case 1:
        return "border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20";
      case 2:
        return "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20";
      case 3:
        return "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20";
      default:
        return "border-border";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get territories for this store - with safety guards
  const storeTerritoriesData = territories && store.territories 
    ? territories.filter(t => store.territories.includes(t.name))
    : [];

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

  if (compact) {
    return (
      <StoreCardAnimation index={rank - 1} delay={0}>
        <Card 
          className={`hover-elevate cursor-pointer transition-all duration-200 ${getRankCardStyle(rank)}`}
          onClick={handleStoreClick}
          data-testid={`card-store-compact-${store.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Rank Icon */}
              <div className="flex-shrink-0">
                <PodiumAnimation rank={rank}>
                  {getRankIcon(rank)}
                </PodiumAnimation>
              </div>

              {/* Store Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate" data-testid={`text-store-name-${store.id}`}>
                    {store.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {store.storeCount || 0} magasins
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1">
                  {renderStars(store.averageScore || 0)}
                  <span className="text-xs text-muted-foreground ml-1">
                    {(store.averageScore || 0).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className={`font-bold text-lg ${getScoreColor(metrics.overallScore)}`} data-testid={`text-overall-score-${store.id}`}>
                  <ScoreCountAnimation value={metrics.overallScore} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {(metrics.averagePrice || 0).toFixed(2)}€
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </StoreCardAnimation>
    );
  }

  return (
    <StoreCardAnimation index={rank - 1} delay={0.1}>
      <Card 
        className={`hover-elevate cursor-pointer transition-all duration-200 ${getRankCardStyle(rank)}`}
        onClick={handleStoreClick}
        data-testid={`card-store-detailed-${store.id}`}
      >
        <CardContent className="p-6">
          {/* Header with rank and basic info */}
          <div className="flex items-start gap-4 mb-4">
            {/* Rank and Logo */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <PodiumAnimation rank={rank}>
                {getRankIcon(rank)}
              </PodiumAnimation>
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={`Logo ${store.name}`}
                  className="w-12 h-12 object-contain rounded"
                  data-testid={`img-store-logo-${store.id}`}
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">
                    {store.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold" data-testid={`text-store-name-${store.id}`}>
                  {store.name}
                </h3>
                <Badge variant="outline">
                  #{rank}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                  {renderStars(store.averageScore || 0)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {(store.averageScore || 0).toFixed(1)} / 5
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  {store.storeCount || 0} magasins
                </div>
              </div>

              {/* Territories */}
              <div className="flex flex-wrap gap-1">
                {storeTerritoriesData.slice(0, 3).map((territory) => (
                  <Badge key={territory.id} variant="secondary" className="text-xs">
                    {territory.name}
                  </Badge>
                ))}
                {storeTerritoriesData.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{storeTerritoriesData.length - 3} autres
                  </Badge>
                )}
              </div>
            </div>

            {/* Overall Score */}
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`} data-testid={`text-overall-score-${store.id}`}>
                <ScoreCountAnimation value={metrics.overallScore} duration={1500} />
              </div>
              <div className="text-sm text-muted-foreground">
                Score global
              </div>
            </div>
          </div>

        {/* Detailed Metrics */}
        {showDetailedMetrics && (
          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Competitiveness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <TrendingDown className="h-4 w-4" />
                        Compétitivité prix
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Score basé sur le prix moyen par rapport au marché
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-sm font-semibold" data-testid={`text-price-competitiveness-${store.id}`}>
                    {(metrics.priceCompetitiveness || 0).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.priceCompetitiveness} 
                  className="h-2"
                  data-testid={`progress-price-competitiveness-${store.id}`}
                />
                <div className="text-xs text-muted-foreground">
                  Prix moyen: {(metrics.averagePrice || 0).toFixed(2)}€
                </div>
              </div>

              {/* Territorial Coverage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <MapPin className="h-4 w-4" />
                        Couverture territoriale
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Pourcentage de territoires couverts
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-sm font-semibold" data-testid={`text-territorial-coverage-${store.id}`}>
                    {(metrics.territorialCoverage || 0).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.territorialCoverage} 
                  className="h-2"
                  data-testid={`progress-territorial-coverage-${store.id}`}
                />
                <div className="text-xs text-muted-foreground">
                  {metrics.territoryCount || 0} territoires
                </div>
              </div>

              {/* Product Diversity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Package className="h-4 w-4" />
                        Diversité produits
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Nombre de catégories de produits différentes
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-sm font-semibold" data-testid={`text-product-diversity-${store.id}`}>
                    {metrics.productDiversity || 0} catégories
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {metrics.totalProducts || 0} produits
                </div>
              </div>

              {/* Price Stability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Stabilité prix
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Stabilité des prix au fil du temps
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-sm font-semibold" data-testid={`text-price-stability-${store.id}`}>
                    {metrics.priceStability.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.priceStability} 
                  className="h-2"
                  data-testid={`progress-price-stability-${store.id}`}
                />
              </div>
            </div>

            {/* Additional Store Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-semibold" data-testid={`text-availability-score-${store.id}`}>
                  {store.availabilityScore.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Disponibilité</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold" data-testid={`text-stability-score-${store.id}`}>
                  {store.stabilityScore.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Stabilité</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold" data-testid={`text-price-index-${store.id}`}>
                  {store.priceIndex.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Indice prix</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={(e) => {
              e.stopPropagation();
              handleStoreClick();
            }}
            data-testid={`button-view-store-${store.id}`}
          >
            Voir les produits
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </StoreCardAnimation>
  );
}