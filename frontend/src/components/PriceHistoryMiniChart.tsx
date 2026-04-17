// src/components/PriceHistoryMiniChart.tsx
import React from 'react';
import type { PriceObservation } from '../types/PriceObservation';

type PriceHistoryMiniChartProps = {
  observations: PriceObservation[];
  width?: number;
  height?: number;
  stroke?: string;
};

export default function PriceHistoryMiniChart({
  observations,
  width = 100,
  height = 40,
  stroke = '#60a5fa',
}: PriceHistoryMiniChartProps) {
  if (!observations || observations.length === 0) {
    return <div className="text-xs text-white/40">Aucune donnée</div>;
  }

  const getTimestamp = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  // Trier par date
  const sorted = [...observations].sort(
    (a, b) => getTimestamp(a.observedAt) - getTimestamp(b.observedAt)
  );

  const prices = sorted.map((obs) => obs.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  const step = width / Math.max(1, prices.length - 1);
  const points = prices
    .map((price, i) => {
      const x = +(i * step).toFixed(2);
      const y = +(height - ((price - min) / range) * height).toFixed(2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline fill="none" stroke={stroke} strokeWidth={2} points={points} />
    </svg>
  );
}
