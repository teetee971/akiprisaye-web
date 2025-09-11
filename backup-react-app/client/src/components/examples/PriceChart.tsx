import PriceChart, { type PriceHistoryData } from '../PriceChart';

export default function PriceChartExample() {
  // todo: remove mock functionality
  const mockData: PriceHistoryData[] = [
    { date: '2024-01-01', price: 1.95, store: 'Carrefour' },
    { date: '2024-01-05', price: 1.90, store: 'Super U' },
    { date: '2024-01-10', price: 1.85, store: 'Carrefour' },
    { date: '2024-01-15', price: 1.92, store: 'Leclerc' },
    { date: '2024-01-20', price: 1.88, store: 'Super U' },
    { date: '2024-01-25', price: 1.85, store: 'Carrefour' },
    { date: '2024-01-30', price: 1.87, store: 'Leclerc' },
  ];

  return (
    <div className="max-w-2xl">
      <PriceChart 
        data={mockData} 
        productName="Lait demi-écrémé Lactel 1L"
        territory="Martinique"
      />
    </div>
  );
}