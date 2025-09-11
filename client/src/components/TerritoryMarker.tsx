import { Marker, Popup } from 'react-leaflet';
import { DivIcon, LatLng } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { MapPin, Store, Package, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface TerritoryMarkerProps {
  territory: TerritoryStats;
  isSelected?: boolean;
  onClick?: (territoryId: string) => void;
}

export default function TerritoryMarker({ 
  territory, 
  isSelected, 
  onClick 
}: TerritoryMarkerProps) {
  
  // Création d'un marqueur personnalisé avec couleur conditionnelle
  const createCustomIcon = (selected: boolean, productCount: number) => {
    const iconColor = selected ? '#1d4ed8' : '#0ea5e9'; // Blue-600 ou Blue-500
    const size = Math.max(20, Math.min(40, productCount * 2)); // Taille basée sur le nombre de produits
    
    const iconHtml = renderToString(
      <div 
        style={{
          backgroundColor: iconColor,
          borderRadius: '50%',
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white'
        }}
      >
        {productCount}
      </div>
    );

    return new DivIcon({
      html: iconHtml,
      className: 'custom-territory-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  const position = new LatLng(territory.lat, territory.lng);
  const customIcon = createCustomIcon(isSelected || false, territory.productCount);

  const handleMarkerClick = () => {
    onClick?.(territory.id);
  };

  // Calcul du niveau de prix (rapport à la métropole)
  const getPriceLevel = (priceIndex: number) => {
    if (priceIndex <= 1.2) return { label: 'Modéré', color: 'bg-green-500' };
    if (priceIndex <= 1.4) return { label: 'Élevé', color: 'bg-yellow-500' };
    return { label: 'Très élevé', color: 'bg-red-500' };
  };

  const priceLevel = getPriceLevel(territory.priceIndex);

  return (
    <Marker 
      position={position} 
      icon={customIcon}
      eventHandlers={{
        click: handleMarkerClick,
      }}
      data-testid={`territory-marker-${territory.id}`}
    >
      <Popup className="territory-popup" maxWidth={300}>
        <div className="p-2 space-y-3" data-testid={`territory-popup-${territory.id}`}>
          {/* En-tête du territoire */}
          <div className="border-b pb-2">
            <h3 className="font-heading font-bold text-lg text-gray-800">
              {territory.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {territory.population.toLocaleString('fr-FR')} hab.
              </Badge>
              <div 
                className={`text-xs px-2 py-1 rounded-full text-white ${priceLevel.color}`}
              >
                {priceLevel.label}
              </div>
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-500">Produits</div>
                <div className="font-semibold text-blue-600">
                  {territory.productCount}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-xs text-gray-500">Enseignes</div>
                <div className="font-semibold text-green-600">
                  {territory.storeCount}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-xs text-gray-500">Prix moyen</div>
                <div className="font-semibold text-orange-600">
                  {territory.averagePrice.toFixed(2)}€
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-xs text-gray-500">Indice prix</div>
                <div className="font-semibold text-purple-600">
                  x{territory.priceIndex}
                </div>
              </div>
            </div>
          </div>

          {/* Enseignes présentes */}
          {territory.storeNames.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Enseignes présentes :</div>
              <div className="flex flex-wrap gap-1">
                {territory.storeNames.slice(0, 4).map((storeName, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {storeName}
                  </Badge>
                ))}
                {territory.storeNames.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{territory.storeNames.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action */}
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              className="w-full text-xs"
              onClick={handleMarkerClick}
              data-testid={`territory-popup-select-${territory.id}`}
            >
              <MapPin className="h-3 w-3 mr-1" />
              Voir les détails
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}