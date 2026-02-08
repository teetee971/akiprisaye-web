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
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoricalData {
  date: string;
  rate: number;
}

interface InflationLineChartProps {
  data: HistoricalData[];
  territory?: string;
  title?: string;
}

export const InflationLineChart: React.FC<InflationLineChartProps> = ({
  data,
  territory = 'Tous les territoires',
  title = 'Évolution de l\'inflation',
}) => {
  const chartData = {
    labels: data.map((d) => new Date(d.date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      year: 'numeric' 
    })),
    datasets: [
      {
        label: territory,
        data: data.map((d) => d.rate),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: 'Taux d\'inflation (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Période',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
