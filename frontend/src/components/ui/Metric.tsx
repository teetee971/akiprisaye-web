interface MetricProps {
  label: string;
  eyebrow?: string;
  value: string;
  helper?: string;
  accent?: boolean;
}

export function Metric({ label, eyebrow, value, helper, accent = false }: MetricProps) {
  return (
    <div className="flex flex-col gap-1">
      {eyebrow && (
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</div>
      )}
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`text-2xl font-semibold ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
      {helper && <div className="text-xs text-zinc-500">{helper}</div>}
    </div>
  );
}
