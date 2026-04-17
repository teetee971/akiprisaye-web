/**
 * PriceCharts Component
 *
 * Interactive charts for price analysis and trends
 * Uses Recharts library for visualization
 */

import { useState } from 'react';
import { Card } from './ui/card';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CHART_COLORS, CHART_THEME, getTerritoryColor, getBreakdownColor } from '../config/colors';
import { formatCurrency } from '../utils/formatters';

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
          <CartesianGrid {...CHART_THEME.grid} />
          <XAxis dataKey="date" {...CHART_THEME.axis} />
          <YAxis
            {...CHART_THEME.axis}
            label={{ value: 'Prix (€)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip {...CHART_THEME.tooltip} />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            name="Prix"
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke={CHART_COLORS.warning}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Moyenne"
            dot={{ fill: CHART_COLORS.warning, r: 3 }}
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
          <CartesianGrid {...CHART_THEME.grid} />
          <XAxis dataKey="territory" {...CHART_THEME.axis} />
          <YAxis
            {...CHART_THEME.axis}
            label={{ value: 'Prix moyen (€)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip {...CHART_THEME.tooltip} />
          <Legend />
          <Bar
            dataKey="avgPrice"
            fill={CHART_COLORS.primary}
            name="Prix moyen"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="minPrice"
            fill={CHART_COLORS.success}
            name="Prix minimum"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="maxPrice"
            fill={CHART_COLORS.danger}
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
              <Cell key={`cell-${index}`} fill={getTerritoryColor(index)} />
            ))}
          </Pie>
          <Tooltip {...CHART_THEME.tooltip} />
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
                <Cell key={`cell-${index}`} fill={getBreakdownColor(index)} />
              ))}
            </Pie>
            <Tooltip {...CHART_THEME.tooltip} formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center space-y-3">
          {breakdownData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getBreakdownColor(index) }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                Prix total
              </span>
              <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(data.basePrice + data.margin + data.octroi + data.tva)}
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
      <div className="animate-fade-in">{charts[activeChart]}</div>
    </div>
  );
}
