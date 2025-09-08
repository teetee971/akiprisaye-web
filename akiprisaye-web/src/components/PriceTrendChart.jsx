import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { euro } from '../utils/money';

export default function PriceTrendChart({ series }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: series.map(s => new Date(s.d).toLocaleDateString('fr-FR', { month:'short', year:'2-digit'})),
        datasets: [{
          label: 'Prix',
          data: series.map(s => s.v),
          fill: false,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => euro(ctx.parsed.y) }
          }
        },
        scales: {
          y: { ticks: { callback: (v) => euro(v) } }
        }
      }
    });
    return () => chart.destroy();
  }, [series]);
  return <canvas ref={ref} height="140"/>;
}
