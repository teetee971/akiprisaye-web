import React, { useEffect, useState } from "react";

export default function TerritorySelect({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // charge depuis l'API de prod, sinon fallback local
  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      const tryUrls = [
        "/api/territories",        // réécrit vers .json via _redirects
        "/api/territories.json"    // fallback direct
      ];

      for (const url of tryUrls) {
        try {
          const r = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const j = await r.json();
          const arr = (j?.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, "fr"));
          if (!cancel && arr.length) {
            setOptions(arr);
            setLoading(false);
            return;
          }
        } catch (_) {
          // essaie l'url suivante
        }
      }

      // dernier filet: JSON local inclus dans le bundle (optionnel)
      try {
        const j = await import("../../public/api/territories.json");
        const arr = (j?.default?.data ?? j?.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, "fr"));
        if (!cancel && arr.length) {
          setOptions(arr);
        }
      } catch (_) {
        // pas grave, on reste vide
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => { cancel = true; };
  }, []);

  return (
    <label className="block">
      <span className="sr-only">Territoire</span>
      <select
        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Choisir un territoire"
        disabled={loading}
      >
        <option value="">{loading ? "Chargement…" : "— Territoire —"}</option>
        {options.map(t => (
          <option key={t.code} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
