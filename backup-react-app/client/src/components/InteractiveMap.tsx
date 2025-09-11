import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { useState, useMemo } from 'react';
import { LatLngBounds } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TerritoryMarker from '@/components/TerritoryMarker';
import { useProducts } from '@/context/ProductsContext';
import type { Territory } from '@shared/schema';

// Import des styles Leaflet
import 'leaflet/dist/leaflet.css';

interface TerritoryStats {
  id: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  priceIndex: number;
  storeCount: number;
  productCount: number;
  averagePrice: number;
  storeNames: string[];
}

interface InteractiveMapProps {
  className?: string;
  selectedTerritory?: string;
  onTerritorySelect?: (territoryId: string) => void;
}

export default function InteractiveMap({ 
  className, 
  selectedTerritory, 
  onTerritorySelect 
}: InteractiveMapProps) {
  const { territories, products, stores } = useProducts();
  const [mapCenter] = useState<[number, number]>([-10.0, 55.0]); // Centre approximatif DOM-TOM
  const [mapZoom] = useState(3);

  // Calcul des statistiques par territoire
  const territoryStats = useMemo((): TerritoryStats[] => {
    return territories.map(territory => {
      // Produits de ce territoire
      const territoryProducts = products.filter(p => p.territory === territory.id);
      
      // Enseignes uniques de ce territoire
      const territoryStoreIds = Array.from(new Set(territoryProducts.map(p => p.store)));
      const territoryStoreNames = territoryStoreIds.map(storeId => {
        const store = stores.find(s => s.id === storeId);
        return store?.name || storeId;
      });

      // Prix moyen des produits de ce territoire
      const averagePrice = territoryProducts.length > 0 
        ? territoryProducts.reduce((sum, p) => sum + p.price, 0) / territoryProducts.length
        : 0;

      return {
        id: territory.id,
        name: territory.name,
        lat: territory.lat,
        lng: territory.lng,
        population: territory.population,
        priceIndex: territory.priceIndex,
        storeCount: territoryStoreIds.length,
        productCount: territoryProducts.length,
        averagePrice,
        storeNames: territoryStoreNames,
      };
    });
  }, [territories, products, stores]);

  // Calcul des limites de la carte pour afficher tous les territoires
  const mapBounds = useMemo(() => {
    if (territoryStats.length === 0) return undefined;
    
    const latitudes = territoryStats.map(t => t.lat);
    const longitudes = territoryStats.map(t => t.lng);
    
    const southWest: [number, number] = [Math.min(...latitudes) - 5, Math.min(...longitudes) - 5];
    const northEast: [number, number] = [Math.max(...latitudes) + 5, Math.max(...longitudes) + 5];
    
    return new LatLngBounds(southWest, northEast);
  }, [territoryStats]);

  const handleTerritoryClick = (territoryId: string) => {
    onTerritorySelect?.(territoryId);
  };

  const selectedTerritoryData = territoryStats.find(t => t.id === selectedTerritory);

  return (
    <div className={`grid lg:grid-cols-4 gap-6 ${className}`}>
      {/* Carte interactive */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              Carte des Territoires d'Outre-Mer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[500px] w-full rounded-lg overflow-hidden border border-border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                bounds={mapBounds}
                className="w-full h-full"
                zoomControl={false}
                data-testid="leaflet-map-container"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | A KI PRI SA YÉ'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="topright" />
                
                {territoryStats.map((territory) => (
                  <TerritoryMarker
                    key={territory.id}
                    territory={territory}
                    isSelected={selectedTerritory === territory.id}
                    onClick={handleTerritoryClick}
                  />
                ))}
              </MapContainer>
              
              {/* Overlay tropical */}
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🗺️</div>
                  <div>
                    <div className="text-sm font-medium">Territoires d'Outre-Mer</div>
                    <div className="text-xs text-muted-foreground">
                      {territoryStats.length} territoires • {territoryStats.reduce((sum, t) => sum + t.productCount, 0)} produits
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Légende de la carte */}
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Territoires disponibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {territoryStats.map((territory) => (
                  <Badge
                    key={territory.id}
                    variant={selectedTerritory === territory.id ? "default" : "outline"}
                    className="cursor-pointer hover-elevate transition-all duration-200"
                    onClick={() => handleTerritoryClick(territory.id)}
                    data-testid={`map-legend-${territory.id}`}
                  >
                    🏝️ {territory.name} ({territory.productCount})
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Les nombres indiquent les produits disponibles par territoire
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panneau des statistiques */}
      <div className="space-y-4">
        {selectedTerritoryData ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading">
                {selectedTerritoryData.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Produits</div>
                  <div className="font-semibold text-xl text-chart-2">
                    {selectedTerritoryData.productCount}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Enseignes</div>
                  <div className="font-semibold text-xl text-chart-1">
                    {selectedTerritoryData.storeCount}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Prix moyen</div>
                <div className="font-semibold text-2xl">
                  {selectedTerritoryData.averagePrice.toFixed(2)}€
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Population</div>
                <div className="font-medium">
                  {selectedTerritoryData.population.toLocaleString('fr-FR')} hab.
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Indice prix</div>
                <div className="font-medium">
                  x{selectedTerritoryData.priceIndex}
                </div>
              </div>

              {selectedTerritoryData.storeNames.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Enseignes présentes</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTerritoryData.storeNames.map((storeName, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {storeName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm">
                Cliquez sur un territoire pour voir les détails
              </p>
            </CardContent>
          </Card>
        )}

        {/* Résumé global */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">Résumé global</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Total produits</div>
              <div className="font-semibold text-lg">
                {territoryStats.reduce((sum, t) => sum + t.productCount, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total enseignes</div>
              <div className="font-semibold text-lg">
                {territoryStats.reduce((sum, t) => sum + t.storeCount, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Territoires</div>
              <div className="font-semibold text-lg">
                {territoryStats.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}