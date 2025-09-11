import StoreRanking, { type StoreData } from '../StoreRanking';

export default function StoreRankingExample() {
  // todo: remove mock functionality
  const mockStores: StoreData[] = [
    {
      id: "carrefour",
      name: "Carrefour",
      territory: "Martinique",
      averagePrice: 1.75,
      priceChange: -2.5,
      rating: 4.2,
      reviewCount: 145,
      rank: 1
    },
    {
      id: "leclerc",
      name: "E.Leclerc",
      territory: "Martinique",
      averagePrice: 1.82,
      priceChange: -1.8,
      rating: 4.0,
      reviewCount: 98,
      rank: 2
    },
    {
      id: "super-u",
      name: "Super U",
      territory: "Martinique",
      averagePrice: 1.89,
      priceChange: 1.2,
      rating: 3.8,
      reviewCount: 67,
      rank: 3
    },
    {
      id: "leader-price",
      name: "Leader Price",
      territory: "Martinique",
      averagePrice: 1.95,
      priceChange: 0.5,
      rating: 3.6,
      reviewCount: 42,
      rank: 4
    }
  ];

  const handleStoreSelect = (storeId: string) => {
    console.log('Store selected:', storeId);
  };

  return (
    <div className="max-w-2xl">
      <StoreRanking 
        stores={mockStores}
        territory="Martinique"
        onStoreSelect={handleStoreSelect}
      />
    </div>
  );
}