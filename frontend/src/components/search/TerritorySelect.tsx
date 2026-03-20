import { TERRITORIES } from '../../utils/territory';
import type { TerritoryCode } from '../../utils/territory';

interface TerritorySelectProps {
  value: string;
  onChange: (code: TerritoryCode) => void;
}

export function TerritorySelect({ value, onChange }: TerritorySelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TERRITORIES.map((t) => (
        <button
          key={t.code}
          type="button"
          onClick={() => onChange(t.code as TerritoryCode)}
          className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
            value === t.code
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
              : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20'
          }`}
        >
          {t.flag} {t.code}
        </button>
      ))}
    </div>
  );
}
