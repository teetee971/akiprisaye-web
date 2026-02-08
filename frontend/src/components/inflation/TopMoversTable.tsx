import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProductMover {
  productName: string;
  category: string;
  previousPrice: number;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  territory: string;
}

interface TopMoversTableProps {
  increases: ProductMover[];
  decreases: ProductMover[];
}

export const TopMoversTable: React.FC<TopMoversTableProps> = ({
  increases,
  decreases,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const renderTable = (
    title: string,
    data: ProductMover[],
    type: 'increase' | 'decrease'
  ) => {
    const Icon = type === 'increase' ? TrendingUp : TrendingDown;
    const colorClass = type === 'increase' ? 'text-red-600' : 'text-green-600';
    const bgClass = type === 'increase' ? 'bg-red-50' : 'bg-green-50';

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon className={colorClass} size={20} />
          {title}
        </h3>
        
        {data.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            Aucune donnée disponible
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={bgClass}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Territoire
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Prix précédent
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Prix actuel
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Variation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.territory}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatPrice(item.previousPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatPrice(item.currentPrice)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold text-right ${colorClass}`}>
                      {type === 'increase' ? '+' : ''}{item.percentChange.toFixed(1)}%
                      <span className="text-xs text-gray-500 ml-2">
                        ({type === 'increase' ? '+' : ''}{formatPrice(item.priceChange)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Top des mouvements de prix
      </h2>
      
      {renderTable('Plus fortes hausses', increases, 'increase')}
      {renderTable('Plus fortes baisses', decreases, 'decrease')}
    </div>
  );
};
