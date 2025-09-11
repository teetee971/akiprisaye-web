import PriceCard, { type PriceData } from '../PriceCard';

export default function PriceCardExample() {
  // todo: remove mock functionality
  const mockPriceData: PriceData = {
    id: "1",
    productName: "Lait demi-écrémé Lactel 1L",
    currentPrice: 1.85,
    previousPrice: 1.90,
    storeName: "Carrefour",
    territory: "Martinique",
    lastUpdated: "il y a 2h"
  };

  const handleClick = (data: PriceData) => {
    console.log('Clicked on:', data.productName);
  };

  return (
    <div className="max-w-sm">
      <PriceCard priceData={mockPriceData} onClick={handleClick} />
    </div>
  );
}