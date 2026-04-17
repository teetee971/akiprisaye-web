import React from 'react';

type Point = { date: string; median: number | null };

function normalize(points: number[], width: number, height: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1e-9, max - min);

  return points.map((v, i) => {
    const x = (i / Math.max(1, points.length - 1)) * width;
    const y = height - ((v - min) / span) * height;
    return { x, y };
  });
}

export function PriceSparkline({
  series,
  width = 220,
  height = 48,
}: {
  series: Point[];
  width?: number;
  height?: number;
}) {
  const values = series.map((s) => s.median).filter((v): v is number => typeof v === 'number');
  if (values.length < 2) return <div className="text-sm opacity-70">Pas assez de données</div>;

  const coords = normalize(values, width, height);
  const d = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const last = values[values.length - 1];
  const first = values[0];
  const delta = last - first;

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-90">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <div className="text-xs">
        <div className="opacity-70">30j</div>
        <div className={delta >= 0 ? 'text-red-300' : 'text-green-300'}>
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(2)}€
        </div>
      </div>
    </div>
  );
}

export default PriceSparkline;
