import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StoreRanking, { type StoreData } from "@/components/StoreRanking";

export default function RankingPage() {
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");

  // todo: remove mock functionality
  const mockStores: StoreData[] = [
    {
      id: "carrefour-martinique",
      name: "Carrefour",
      territory: "Martinique", 
      averagePrice: 1.75,
      priceChange: -2.5,
      rating: 4.2,
      reviewCount: 145,
      rank: 1
    },
    {
      id: "leclerc-martinique",
      name: "E.Leclerc",
      territory: "Martinique",
      averagePrice: 1.82,
      priceChange: -1.8,
      rating: 4.0,
      reviewCount: 98,
      rank: 2
    },
    {
      id: "super-u-martinique",
      name: "Super U",
      territory: "Martinique",
      averagePrice: 1.89,
      priceChange: 1.2,
      rating: 3.8,
      reviewCount: 67,
      rank: 3
    },
    {
      id: "leader-price-martinique",
      name: "Leader Price", 
      territory: "Martinique",
      averagePrice: 1.95,
      priceChange: 0.5,
      rating: 3.6,
      reviewCount: 42,
      rank: 4
    },
    {
      id: "carrefour-guadeloupe",
      name: "Carrefour",
      territory: "Guadeloupe",
      averagePrice: 1.78,
      priceChange: -1.8,
      rating: 4.1,
      reviewCount: 123,
      rank: 1
    },
    {
      id: "super-u-guadeloupe",
      name: "Super U",
      territory: "Guadeloupe",
      averagePrice: 1.85,
      priceChange: 0.9,
      rating: 3.9,
      reviewCount: 89,
      rank: 2
    }
  ];

  const territories = ["Martinique", "Guadeloupe", "La Réunion", "Guyane", "Mayotte"];

  const handleStoreSelect = (storeId: string) => {
    console.log('Store selected:', storeId);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2" data-testid="text-ranking-page-title">
            Palmarès des enseignes
          </h1>
          <p className="text-muted-foreground">
            Découvrez les enseignes les mieux notées et les plus compétitives
          </p>
        </div>

        <div className="mb-6">
          <Select 
            value={selectedTerritory === "all" ? "all" : selectedTerritory} 
            onValueChange={setSelectedTerritory}
          >
            <SelectTrigger className="w-64" data-testid="select-territory-ranking">
              <SelectValue placeholder="Choisir un territoire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les territoires</SelectItem>
              {territories.map((territory) => (
                <SelectItem key={territory} value={territory}>
                  {territory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <StoreRanking
          stores={mockStores}
          territory={selectedTerritory === "all" ? undefined : selectedTerritory}
          onStoreSelect={handleStoreSelect}
        />
      </div>
    </div>
  );
}