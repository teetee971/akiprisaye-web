import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: 'kg' | 'L' | 'g' | 'ml' | 'piece';
  store: string;
}

interface UnitPriceComparatorProps {
  products: Product[];
}

export function UnitPriceComparator({ products }: UnitPriceComparatorProps) {
  const [sortBy, setSortBy] = useState<'price' | 'unitPrice'>('unitPrice');

  const calculateUnitPrice = (product: Product): number => {
    let baseQuantity = product.quantity;
    
    // Normalize to kg or L
    if (product.unit === 'g') baseQuantity = baseQuantity / 1000;
    if (product.unit === 'ml') baseQuantity = baseQuantity / 1000;
    if (product.unit === 'piece') return product.price; // For pieces, return price as-is
    
    return product.price / baseQuantity;
  };

  const getUnitLabel = (unit: string): string => {
    if (unit === 'g') return 'kg';
    if (unit === 'ml') return 'L';
    return unit;
  };

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    return calculateUnitPrice(a) - calculateUnitPrice(b);
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Prix au Kilo/Litre
        </h3>
        <button
          onClick={() => setSortBy(prev => prev === 'price' ? 'unitPrice' : 'price')}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          aria-label={`Trier par ${sortBy === 'price' ? 'prix unitaire' : 'prix total'}`}
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === 'price' ? 'Prix total' : 'Prix unitaire'}
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map((product, index) => {
          const unitPrice = calculateUnitPrice(product);
          const unitLabel = getUnitLabel(product.unit);
          
          return (
            <div 
              key={product.id} 
              className={`
                flex justify-between items-center p-4 rounded-lg
                ${index === 0 ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : 'bg-slate-50 dark:bg-slate-700'}
              `}
            >
              <div className="flex-1">
                <strong className="block text-slate-900 dark:text-white">
                  {product.name}
                </strong>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {product.quantity}{product.unit} - {product.store}
                </span>
                {index === 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    Meilleur rapport qualité/prix
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {unitPrice.toFixed(2)}€
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  par {unitLabel}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  ({product.price.toFixed(2)}€ total)
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {products.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          Aucun produit à comparer pour le moment
        </p>
      )}
    </div>
  );
}
