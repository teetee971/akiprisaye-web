import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Mock historical data
const mockHistoricalData = {
  'lait-uht-1l': {
    name: 'Lait UHT 1L',
    data: [
      { date: '2024-01', price_dom: 1.35, price_metro: 1.10 },
      { date: '2024-02', price_dom: 1.38, price_metro: 1.12 },
      { date: '2024-03', price_dom: 1.42, price_metro: 1.15 },
      { date: '2024-04', price_dom: 1.45, price_metro: 1.12 },
      { date: '2024-05', price_dom: 1.48, price_metro: 1.14 },
      { date: '2024-06', price_dom: 1.45, price_metro: 1.12 },
      { date: '2024-07', price_dom: 1.50, price_metro: 1.16 },
      { date: '2024-08', price_dom: 1.47, price_metro: 1.13 },
      { date: '2024-09', price_dom: 1.45, price_metro: 1.12 },
    ]
  },
  'baguette': {
    name: 'Baguette',
    data: [
      { date: '2024-01', price_dom: 1.10, price_metro: 0.85 },
      { date: '2024-02', price_dom: 1.15, price_metro: 0.87 },
      { date: '2024-03', price_dom: 1.18, price_metro: 0.90 },
      { date: '2024-04', price_dom: 1.20, price_metro: 0.90 },
      { date: '2024-05', price_dom: 1.22, price_metro: 0.92 },
      { date: '2024-06', price_dom: 1.20, price_metro: 0.90 },
      { date: '2024-07', price_dom: 1.25, price_metro: 0.93 },
      { date: '2024-08', price_dom: 1.23, price_metro: 0.91 },
      { date: '2024-09', price_dom: 1.20, price_metro: 0.90 },
    ]
  },
  'pates-500g': {
    name: 'Pâtes 500g',
    data: [
      { date: '2024-01', price_dom: 1.25, price_metro: 0.95 },
      { date: '2024-02', price_dom: 1.28, price_metro: 0.96 },
      { date: '2024-03', price_dom: 1.32, price_metro: 0.98 },
      { date: '2024-04', price_dom: 1.36, price_metro: 0.98 },
      { date: '2024-05', price_dom: 1.38, price_metro: 1.00 },
      { date: '2024-06', price_dom: 1.36, price_metro: 0.98 },
      { date: '2024-07', price_dom: 1.40, price_metro: 1.02 },
      { date: '2024-08', price_dom: 1.38, price_metro: 1.00 },
      { date: '2024-09', price_dom: 1.36, price_metro: 0.98 },
    ]
  }
};

export default function HistoricalPriceComparison() {
  const [selectedProduct, setSelectedProduct] = useState('lait-uht-1l');
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('6m');
  const [showDifference, setShowDifference] = useState(true);
  const [territory, setTerritory] = useState('guadeloupe');

  const products = Object.keys(mockHistoricalData);
  
  // Calculate data based on time range
  const filteredData = useMemo(() => {
    const productData = mockHistoricalData[selectedProduct];
    if (!productData) return { name: '', data: [] };
    
    let months = 6;
    if (timeRange === '3m') months = 3;
    if (timeRange === '12m') months = 12;
    
    const filteredDataPoints = productData.data.slice(-months);
    
    return {
      ...productData,
      data: filteredDataPoints
    };
  }, [selectedProduct, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = filteredData.data.map(item => {
      const date = new Date(item.date + '-01');
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    });

    const domPrices = filteredData.data.map(item => item.price_dom);
    const metroPrices = filteredData.data.map(item => item.price_metro);
    const differences = filteredData.data.map(item => 
      ((item.price_dom - item.price_metro) / item.price_metro * 100).toFixed(1)
    );

    const datasets = [
      {
        label: `Prix DOM (${territory})`,
        data: domPrices,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Prix Métropole',
        data: metroPrices,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
      }
    ];

    if (showDifference && chartType === 'line') {
      datasets.push({
        label: 'Différence (%)',
        data: differences,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        yAxisID: 'y1',
        type: 'line'
      });
    }

    return {
      labels,
      datasets
    };
  }, [filteredData, showDifference, chartType, territory]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Évolution du prix: ${filteredData.name}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            if (label.includes('Différence')) {
              return `${label}: +${value}%`;
            }
            return `${label}: ${value}€`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Prix (€)'
        },
        beginAtZero: false
      },
      ...(showDifference && chartType === 'line' && {
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Différence (%)'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      })
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.data.length === 0) return null;
    
    const latestData = filteredData.data[filteredData.data.length - 1];
    const oldestData = filteredData.data[0];
    
    const currentDifference = ((latestData.price_dom - latestData.price_metro) / latestData.price_metro * 100);
    const priceEvolutionDOM = ((latestData.price_dom - oldestData.price_dom) / oldestData.price_dom * 100);
    const priceEvolutionMetro = ((latestData.price_metro - oldestData.price_metro) / oldestData.price_metro * 100);
    
    const avgDomPrice = filteredData.data.reduce((sum, item) => sum + item.price_dom, 0) / filteredData.data.length;
    const avgMetroPrice = filteredData.data.reduce((sum, item) => sum + item.price_metro, 0) / filteredData.data.length;
    
    return {
      currentDifference: currentDifference.toFixed(1),
      priceEvolutionDOM: priceEvolutionDOM.toFixed(1),
      priceEvolutionMetro: priceEvolutionMetro.toFixed(1),
      avgDomPrice: avgDomPrice.toFixed(2),
      avgMetroPrice: avgMetroPrice.toFixed(2),
      currentDomPrice: latestData.price_dom.toFixed(2),
      currentMetroPrice: latestData.price_metro.toFixed(2)
    };
  }, [filteredData]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          📈
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Comparatif Historique des Prix</h2>
          <p className="text-sm text-gray-600">Analysez l'évolution des prix dans le temps</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Produit
          </label>
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {products.map(productId => (
              <option key={productId} value={productId}>
                {mockHistoricalData[productId].name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Territoire
          </label>
          <select 
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="guadeloupe">🇬🇵 Guadeloupe</option>
            <option value="martinique">🇲🇶 Martinique</option>
            <option value="guyane">🇬🇫 Guyane</option>
            <option value="reunion">🇷🇪 Réunion</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Période
          </label>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="3m">3 derniers mois</option>
            <option value="6m">6 derniers mois</option>
            <option value="12m">12 derniers mois</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de graphique
          </label>
          <select 
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="line">Courbe</option>
            <option value="bar">Barres</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDifference}
              onChange={(e) => setShowDifference(e.target.checked)}
              className="rounded"
            />
            Afficher l'écart (%)
          </label>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.currentDomPrice}€</div>
            <div className="text-sm text-red-800">Prix actuel DOM</div>
            <div className={`text-xs ${
              parseFloat(stats.priceEvolutionDOM) > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {parseFloat(stats.priceEvolutionDOM) > 0 ? '+' : ''}{stats.priceEvolutionDOM}% sur la période
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.currentMetroPrice}€</div>
            <div className="text-sm text-blue-800">Prix actuel Métropole</div>
            <div className={`text-xs ${
              parseFloat(stats.priceEvolutionMetro) > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {parseFloat(stats.priceEvolutionMetro) > 0 ? '+' : ''}{stats.priceEvolutionMetro}% sur la période
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">+{stats.currentDifference}%</div>
            <div className="text-sm text-yellow-800">Écart actuel</div>
            <div className="text-xs text-yellow-600">
              Soit +{(parseFloat(stats.currentDomPrice) - parseFloat(stats.currentMetroPrice)).toFixed(2)}€
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {((parseFloat(stats.avgDomPrice) - parseFloat(stats.avgMetroPrice)) / parseFloat(stats.avgMetroPrice) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-800">Écart moyen</div>
            <div className="text-xs text-purple-600">Sur {timeRange}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-lg border" style={{ height: '400px' }}>
        <div className="h-full p-4">
          {chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Trend Analysis */}
      {stats && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">🔍 Analyse des tendances</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Évolution DOM vs Métropole</h4>
              <ul className="space-y-1 text-gray-600">
                <li>
                  • Prix DOM: {parseFloat(stats.priceEvolutionDOM) > 0 ? '📈' : '📉'} 
                  {stats.priceEvolutionDOM}% sur {timeRange}
                </li>
                <li>
                  • Prix Métropole: {parseFloat(stats.priceEvolutionMetro) > 0 ? '📈' : '📉'} 
                  {stats.priceEvolutionMetro}% sur {timeRange}
                </li>
                <li>
                  • Écart actuel: {parseFloat(stats.currentDifference) > 20 ? '🚨' : parseFloat(stats.currentDifference) > 10 ? '⚠️' : '✅'} 
                  +{stats.currentDifference}%
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Recommandations</h4>
              <ul className="space-y-1 text-gray-600">
                {parseFloat(stats.currentDifference) > 20 && (
                  <li>• 🚨 Écart important: chercher des alternatives</li>
                )}
                {parseFloat(stats.priceEvolutionDOM) > 5 && (
                  <li>• 📈 Hausse significative: surveiller le produit</li>
                )}
                {parseFloat(stats.priceEvolutionDOM) < -2 && (
                  <li>• 💰 Prix en baisse: bon moment pour acheter</li>
                )}
                <li>• 🔄 Mettre à jour les alertes de prix</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}