// src/components/ui/PriceTrendChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { LimitNote } from './LimitNote';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * PriceTrendChart - Price prediction visualization component
 * Shows historical data and future predictions with clear distinction
 * 
 * @param {Object} props
 * @param {Array<{date: string, price: number}>} props.historicalData - Historical price data
 * @param {Array<{date: string, price: number, confidence?: {min: number, max: number}}>} props.predictions - Predicted prices
 * @param {string} props.productName - Name of the product
 * @param {string} props.unit - Price unit (e.g., "€/kg")
 * @param {string} props.source - Data source (INSEE, OPMR, etc.)
 * @param {string} props.lastUpdate - Last update date
 */
export function PriceTrendChart({ 
  historicalData = [],
  predictions = [],
  productName = "Produit",
  unit = "€",
  source = "INSEE",
  lastUpdate = new Date().toLocaleDateString('fr-FR')
}) {
  
  // Combine historical and prediction data for chart
  const allDates = [
    ...historicalData.map(d => d.date),
    ...predictions.map(p => p.date)
  ];

  const chartData = {
    labels: allDates,
    datasets: [
      // Historical data line
      {
        label: 'Prix observé',
        data: [
          ...historicalData.map(d => d.price),
          ...Array(predictions.length).fill(null)
        ],
        borderColor: 'rgb(74, 163, 255)',
        backgroundColor: 'rgba(74, 163, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
      // Prediction line (dashed)
      {
        label: 'Estimation future',
        data: [
          ...Array(historicalData.length - 1).fill(null),
          historicalData[historicalData.length - 1]?.price || null,
          ...predictions.map(p => p.price)
        ],
        borderColor: 'rgb(110, 231, 183)',
        backgroundColor: 'rgba(110, 231, 183, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
      // Confidence interval (if provided)
      ...(predictions.some(p => p.confidence) ? [{
        label: 'Marge d\'erreur (±15%)',
        data: predictions.map(p => p.confidence?.max || null),
        borderColor: 'rgba(110, 231, 183, 0.3)',
        backgroundColor: 'rgba(110, 231, 183, 0.1)',
        borderWidth: 0,
        pointRadius: 0,
        fill: '+1',
        tension: 0.3,
      }] : [])
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgb(229, 231, 235)',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(11, 18, 32, 0.9)',
        titleColor: 'rgb(229, 231, 235)',
        bodyColor: 'rgb(156, 163, 175)',
        borderColor: 'rgba(74, 163, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' ' + unit;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
          callback: function(value) {
            return value.toFixed(2) + ' ' + unit;
          },
        },
      },
    },
  };

  // Calculate trend
  const trend = predictions.length > 0 && historicalData.length > 0 
    ? ((predictions[predictions.length - 1].price - historicalData[historicalData.length - 1].price) / historicalData[historicalData.length - 1].price) * 100
    : 0;

  return (
    <div className="w-full">
      {/* Warning about predictions */}
      <div className="mb-4 p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-500 mb-1">
              ⚠️ ESTIMATION INDICATIVE
            </p>
            <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">
              Estimation basée sur données publiques ({source}) — pas une certitude.
              Méthode : Moyenne mobile + tendance historique.
              Marge d'erreur : ±15%. Les prix réels peuvent varier.
            </p>
          </div>
        </div>
      </div>

      {/* Product name and trend indicator */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[color:var(--text-main)] mb-2">
          {productName}
        </h3>
        {trend !== 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[color:var(--text-muted)]">
              Tendance sur 3 mois :
            </span>
            <span className={`text-sm font-semibold ${
              trend > 0 ? 'text-red-500' : 'text-green-500'
            }`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
              {trend > 0 ? ' (hausse)' : ' (baisse)'}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="glass rounded-xl p-4" style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Methodology note */}
      <div className="mt-4">
        <LimitNote 
          text={`Données historiques : ${historicalData.length} points sur ${Math.ceil(historicalData.length / 30)} mois. Prédictions calculées par moyenne mobile simple. AUCUNE IA opaque. Dernière mise à jour : ${lastUpdate}`}
        />
      </div>
    </div>
  );
}

export default PriceTrendChart;
