import { formatEur } from '../../utils/currency';
import { formatTime } from '../../utils/format';
import type { PriceObservationRow } from '../../types/compare';

interface PriceListProps {
  prices: PriceObservationRow[];
  count: number;
}

export function PriceList({ prices, count }: PriceListProps) {
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  void count;

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((p, i) => (
        <div
          key={`${p.retailer}-${i}`}
          className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-300">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-medium text-white">{p.retailer}</div>
              <div className="text-xs text-zinc-500">{formatTime(p.observedAt)}</div>
            </div>
          </div>
          <div className="text-base font-semibold text-emerald-400">{formatEur(p.price)}</div>
        </div>
      ))}
    </div>
  );
}
