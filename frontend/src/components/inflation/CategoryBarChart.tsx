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

interface CategoryData {
  category: string;
  inflationRate: number;
}

interface CategoryBarChartProps {
  data: CategoryData[];
  territory?: string;
  title?: string;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  territory = 'Tous les territoires',
  title = 'Inflation par catégorie',
}) => {
  const getBarColor = (rate: number) => {
    if (rate < 2) return 'rgba(34, 197, 94, 0.8)';
    if (rate < 5) return 'rgba(234, 179, 8, 0.8)';
    if (rate < 8) return 'rgba(249, 115, 22, 0.8)';
    return 'rgba(239, 68, 68, 0.8)';
  };

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        label: 'Taux d\'inflation (%)',
        data: data.map((d) => d.inflationRate),
        backgroundColor: data.map((d) => getBarColor(d.inflationRate)),
        borderColor: data.map((d) => getBarColor(d.inflationRate).replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${title} - ${territory}`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Inflation: ${context.parsed.y.toFixed(2)}%`;
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
