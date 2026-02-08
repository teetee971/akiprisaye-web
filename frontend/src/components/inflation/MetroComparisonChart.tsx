import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ComparisonData {
  category: string;
  domtom: number;
  metro: number;
}

interface MetroComparisonChartProps {
  data: ComparisonData[];
  title?: string;
}

export const MetroComparisonChart: React.FC<MetroComparisonChartProps> = ({
  data,
  title = 'Comparaison DOM-TOM vs Métropole',
}) => {
  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        label: 'DOM-TOM',
        data: data.map((d) => d.domtom),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Métropole',
        data: data.map((d) => d.metro),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
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
          text: 'Catégorie',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
