import TerritoryMap, { type Territory } from "@/components/TerritoryMap";

export default function MapPage() {
  // todo: remove mock functionality
  const territories: Territory[] = [
    {
      id: "martinique",
      name: "Martinique",
      storeCount: 15,
      averagePrice: 1.87,
      priceChange: -2.3,
      coordinates: { x: 300, y: 200 }
    },
    {
      id: "guadeloupe", 
      name: "Guadeloupe",
      storeCount: 12,
      averagePrice: 1.92,
      priceChange: 1.5,
      coordinates: { x: 250, y: 180 }
    },
    {
      id: "guyane",
      name: "Guyane",
      storeCount: 8,
      averagePrice: 2.15,
      priceChange: 0.8,
      coordinates: { x: 400, y: 250 }
    },
    {
      id: "reunion",
      name: "La Réunion", 
      storeCount: 18,
      averagePrice: 1.95,
      priceChange: -1.2,
      coordinates: { x: 600, y: 300 }
    },
    {
      id: "mayotte",
      name: "Mayotte",
      storeCount: 6, 
      averagePrice: 2.05,
      priceChange: 2.1,
      coordinates: { x: 580, y: 280 }
    }
  ];

  const handleTerritorySelect = (territoryId: string) => {
    console.log('Territory selected:', territoryId);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2" data-testid="text-map-page-title">
            Carte des territoires
          </h1>
          <p className="text-muted-foreground">
            Explorez les prix par territoire d'outre-mer
          </p>
        </div>

        <TerritoryMap
          territories={territories}
          onTerritorySelect={handleTerritorySelect}
        />
      </div>
    </div>
  );
}