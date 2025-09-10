import { useEffect, useState } from "react";

export default function TerritorySelect({ value, onChange, className="" }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/territories")
      .then((r) => r.json())
      .then((j) => setOptions(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-slate-300 text-sm">Territoire</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900/40 p-2 text-slate-100"
      >
        <option value="">— Territoire —</option>
        {loading && <option disabled>Chargement…</option>}
        {!loading && options.map((t) => (
          <option key={t.code} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
