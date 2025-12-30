/**
 * PriceCharts Component
 * 
 * Interactive charts for price analysis and trends
 * Uses Recharts library for visualization
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from './card.jsx';

const COLORS = {
  primary: '#0f62fe',
  success: '#24a148',
  warning: '#f1c21b',
  danger: '#da1e28',
  info: '#4589ff',
};

const TERRITORY_COLORS = [
  '#0066cc', '#cc0000', '#008844', '#ff6600', '#9933cc',
  '#006699', '#ffcc00', '#ff3399', '#663399', '#00cccc',
  '#cc6600', '#3366cc',
];

/**
 * Price trend chart over time
 */
export function PriceTrendChart({ data = [], productName = 'Produit' }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucune donnée disponible pour le graphique de tendance
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        📈 Évolution du prix - {productName}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Prix (€)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={COLORS.primary} 
            strokeWidth={2}
            name="Prix"
            dot={{ fill: COLORS.primary, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="avgPrice" 
            stroke={COLORS.warning} 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Moyenne"
            dot={{ fill: COLORS.warning, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Territory comparison bar chart
 */
export function TerritoryComparisonChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucune donnée disponible pour la comparaison territoriale
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        🗺️ Comparaison par territoire
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="territory" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Prix moyen (€)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar 
            dataKey="avgPrice" 
            fill={COLORS.primary}
            name="Prix moyen"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="minPrice" 
            fill={COLORS.success}
            name="Prix minimum"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="maxPrice" 
            fill={COLORS.danger}
            name="Prix maximum"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Category distribution pie chart
 */
export function CategoryDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucune donnée disponible pour la distribution par catégorie
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        🥧 Répartition par catégorie
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TERRITORY_COLORS[index % TERRITORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Price breakdown chart (margin, octroi, TVA)
 */
export function PriceBreakdownChart({ data = null }) {
  if (!data) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucune donnée disponible pour la décomposition du prix
        </p>
      </Card>
    );
  }

  const breakdownData = [
    { name: 'Prix de base', value: data.basePrice || 0 },
    { name: 'Marge', value: data.margin || 0 },
    { name: 'Octroi de mer', value: data.octroi || 0 },
    { name: 'TVA', value: data.tva || 0 },
  ];

  const BREAKDOWN_COLORS = ['#4589ff', '#24a148', '#f1c21b', '#da1e28'];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        💰 Décomposition du prix
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={breakdownData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {breakdownData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BREAKDOWN_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value) => `${value.toFixed(2)}€`}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="flex flex-col justify-center space-y-3">
          {breakdownData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: BREAKDOWN_COLORS[index] }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {item.value.toFixed(2)}€
              </span>
            </div>
          ))}
          <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                Prix total
              </span>
              <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                {(data.basePrice + data.margin + data.octroi + data.tva).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Main dashboard component with multiple charts
 */
export function PriceDashboard({ 
  trendData = [], 
  territoryData = [], 
  categoryData = [],
  breakdownData = null,
}) {
  const [activeChart, setActiveChart] = useState('trend');

  const charts = {
    trend: <PriceTrendChart data={trendData} />,
    territory: <TerritoryComparisonChart data={territoryData} />,
    category: <CategoryDistributionChart data={categoryData} />,
    breakdown: <PriceBreakdownChart data={breakdownData} />,
  };

  return (
    <div className="space-y-6">
      {/* Chart selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveChart('trend')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeChart === 'trend'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          📈 Tendance
        </button>
        <button
          onClick={() => setActiveChart('territory')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeChart === 'territory'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          🗺️ Territoires
        </button>
        <button
          onClick={() => setActiveChart('category')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeChart === 'category'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          🥧 Catégories
        </button>
        <button
          onClick={() => setActiveChart('breakdown')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeChart === 'breakdown'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          💰 Décomposition
        </button>
      </div>

      {/* Active chart */}
      <div className="animate-fade-in">
        {charts[activeChart]}
      </div>
    </div>
  );
}
