import { useState } from "react";
import TerritoryMap, { type Territory } from '../TerritoryMap';

export default function TerritoryMapExample() {
  // todo: remove mock functionality
  const mockTerritories: Territory[] = [
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

  const [selectedTerritory, setSelectedTerritory] = useState<string>("martinique");

  const handleTerritorySelect = (territoryId: string) => {
    setSelectedTerritory(territoryId);
  };

  return (
    <TerritoryMap 
      territories={mockTerritories}
      selectedTerritory={selectedTerritory}
      onTerritorySelect={handleTerritorySelect}
    />
  );
}