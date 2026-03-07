 
import React, { useEffect, useRef } from 'react';
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
import { Line } from 'react-chartjs-2';
import { MonthlySavings } from '../../services/savingsService';

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

interface SavingsChartProps {
  monthlySavings: MonthlySavings[];
  className?: string;
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function SavingsChart({ monthlySavings, className = '' }: SavingsChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Format month labels
  const labels = monthlySavings.map(m => {
    const [year, month] = m.month.split('-');
    return `${MONTH_NAMES[parseInt(month) - 1]}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Économies (€)',
        data: monthlySavings.map(m => m.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            return `Économies: ${context.parsed.y.toFixed(2)}€`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}€`
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📊 Évolution des économies (6 derniers mois)
      </h3>
      <div className="h-64">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
