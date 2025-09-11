import { useState } from "react";
import { MapPin, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Territory {
  id: string;
  name: string;
  storeCount: number;
  averagePrice: number;
  priceChange: number;
  coordinates: { x: number; y: number };
}

interface TerritoryMapProps {
  territories: Territory[];
  selectedTerritory?: string;
  onTerritorySelect?: (territoryId: string) => void;
}

export default function TerritoryMap({ territories, selectedTerritory, onTerritorySelect }: TerritoryMapProps) {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);

  const handleTerritoryClick = (territoryId: string) => {
    onTerritorySelect?.(territoryId);
    console.log('Territory selected:', territoryId);
  };

  const getStatusColor = (priceChange: number) => {
    if (priceChange > 0) return "text-destructive";
    if (priceChange < 0) return "text-chart-2";
    return "text-muted-foreground";
  };

  const selectedTerritoryData = territories.find(t => t.id === selectedTerritory);

  return (
    <Card data-testid="card-territory-map">
      <CardHeader>
        <CardTitle className="font-heading">Carte des Territoires d'Outre-Mer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-b from-chart-2/20 to-chart-1/20 rounded-lg p-4 min-h-[400px] border border-border">
              <svg
                width="100%"
                height="400"
                viewBox="0 0 800 400"
                className="overflow-visible"
                data-testid="svg-map"
              >
                {territories.map((territory) => (
                  <g key={territory.id}>
                    <circle
                      cx={territory.coordinates.x}
                      cy={territory.coordinates.y}
                      r={Math.max(8, territory.storeCount * 2)}
                      fill={selectedTerritory === territory.id ? "hsl(var(--primary))" : "hsl(var(--chart-2))"}
                      stroke={hoveredTerritory === territory.id ? "hsl(var(--ring))" : "hsl(var(--border))"}
                      strokeWidth={hoveredTerritory === territory.id ? 3 : 1}
                      className="cursor-pointer transition-all duration-200 hover:opacity-80"
                      onMouseEnter={() => setHoveredTerritory(territory.id)}
                      onMouseLeave={() => setHoveredTerritory(null)}
                      onClick={() => handleTerritoryClick(territory.id)}
                      data-testid={`map-territory-${territory.id}`}
                    />
                    <text
                      x={territory.coordinates.x}
                      y={territory.coordinates.y - Math.max(12, territory.storeCount * 2 + 4)}
                      textAnchor="middle"
                      className="text-xs font-medium fill-current text-foreground pointer-events-none"
                    >
                      {territory.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {territories.map((territory) => (
                <Button
                  key={territory.id}
                  variant={selectedTerritory === territory.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTerritoryClick(territory.id)}
                  data-testid={`button-territory-${territory.id}`}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {territory.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Territory Details */}
          <div className="space-y-4">
            {selectedTerritoryData ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{selectedTerritoryData.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedTerritoryData.storeCount} enseignes</span>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Prix moyen</div>
                    <div className="font-semibold text-lg">
                      {selectedTerritoryData.averagePrice.toFixed(2)}€
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Évolution</div>
                    <div className={`font-medium ${getStatusColor(selectedTerritoryData.priceChange)}`}>
                      {selectedTerritoryData.priceChange > 0 ? '+' : ''}
                      {selectedTerritoryData.priceChange.toFixed(1)}%
                    </div>
                  </div>

                  <Button className="w-full mt-4" data-testid="button-see-stores">
                    Voir les enseignes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cliquez sur un territoire pour voir les détails</p>
                </CardContent>
              </Card>
            )}

            {/* Territory List */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Tous les territoires</h3>
              {territories.map((territory) => (
                <div
                  key={territory.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                  onClick={() => handleTerritoryClick(territory.id)}
                  data-testid={`territory-item-${territory.id}`}
                >
                  <div>
                    <div className="font-medium text-sm">{territory.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {territory.storeCount} enseignes
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {territory.averagePrice.toFixed(2)}€
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}