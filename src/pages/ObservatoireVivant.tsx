import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Period = 'hour' | 'day' | 'week' | 'month';

type PricePoint = {
  timestamp: string;
  prix: number;
};

type PriceAnomaly = {
  timestamp: string;
  prix: number;
  type: string;
  severity: string;
  message: string;
  territoire?: string;
};

type PriceKpi = {
  min: number;
  max: number;
  median: number;
  trend: number;
  sample: number;
  windowStart: string;
  windowEnd: string;
};

type PriceSeries = {
  territoire: string;
  produit: string;
  period: Period;
  data: PricePoint[];
  updated_at?: string;
  source_type?: string | null;
  source_name?: string | null;
  currency?: string | null;
  anomalies?: PriceAnomaly[];
  kpis?: PriceKpi;
};

type ApiResponse = {
  territoire: string;
  produit: string;
  period: Period;
  source_type?: string | null;
  source_name?: string | null;
  currency?: string | null;
  data: PricePoint[];
  updated_at?: string;
  cache?: string;
  message?: string;
  anomalies?: PriceAnomaly[];
  kpis?: PriceKpi;
  series?: PriceSeries[];
};

const TERRITORIES = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'];
const PRODUCTS = ['Riz 1kg', 'Lait UHT 1L', 'Pâtes 500g', 'Sucre 1kg'];
const PERIOD_OPTIONS: Array<{ value: Period; label: string; subtitle: string }> = [
  { value: 'hour', label: 'Heure', subtitle: 'Flux commerçants' },
  { value: 'day', label: 'Jour', subtitle: 'Agrégation 24h' },
  { value: 'week', label: 'Semaine', subtitle: 'Vue consolidée' },
  { value: 'month', label: 'Mois', subtitle: 'Tendance longue' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
};

const formatTick = (timestamp: string) => {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const formatObservationTimestamp = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${date} – ${time}`;
};

export default function ObservatoireVivant() {
  const [territoire, setTerritoire] = useState(TERRITORIES[0]);
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([TERRITORIES[0]]);
  const [produit, setProduit] = useState(PRODUCTS[0]);
  const [period, setPeriod] = useState<Period>('day');
  const [series, setSeries] = useState<PriceSeries[]>([]);
  const [meta, setMeta] = useState<Omit<ApiResponse, 'data' | 'series'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const territoriesToLoad =
      comparisonMode && selectedTerritories.length > 0 ? selectedTerritories : [territoire];

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL('/api/prices', window.location.origin);
        url.searchParams.set('produit', produit);
        url.searchParams.set('period', period);
        if (territoriesToLoad.length > 1) {
          url.searchParams.set('territoires', territoriesToLoad.join(','));
        } else {
          url.searchParams.set('territoire', territoriesToLoad[0]);
        }

        const response = await fetch(url.toString(), { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Réponse API invalide');
        }

        const json = (await response.json()) as ApiResponse;
        const incomingSeries: PriceSeries[] =
          json.series && json.series.length
            ? json.series
            : [
                {
                  territoire: json.territoire,
                  produit: json.produit,
                  period: json.period,
                  data: json.data ?? [],
                  source_type: json.source_type ?? undefined,
                  source_name: json.source_name ?? undefined,
                  currency: json.currency ?? undefined,
                  updated_at: json.updated_at,
                  anomalies: json.anomalies,
                  kpis: json.kpis,
                },
              ];

        setSeries(incomingSeries);
        setMeta({
          territoire: json.territoire,
          produit: json.produit,
          period: json.period,
          source_type: json.source_type ?? null,
          source_name: json.source_name ?? null,
          currency: json.currency ?? '€',
          updated_at: json.updated_at,
          cache: json.cache,
          message: json.message,
        });

        if (incomingSeries.every((s) => (s.data?.length ?? 0) === 0)) {
          setError(
            "Aucune donnée horodatée disponible pour cette sélection. Les flux se mettront à jour dès la première collecte."
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Erreur chargement observatoire vivant', err);
        setError("Données momentanément indisponibles. Merci de réessayer ultérieurement.");
        setSeries([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [territoire, produit, period, comparisonMode, selectedTerritories]);

  const latestUpdate = useMemo(() => {
    const latest = series
      .map((s) => (s.updated_at ? new Date(s.updated_at).getTime() : 0))
      .sort((a, b) => b - a)
      .at(0);
    return latest ? formatDate(new Date(latest).toISOString()) : formatDate(meta?.updated_at);
  }, [series, meta?.updated_at]);

  const currency = series[0]?.currency ?? meta?.currency ?? '€';
  const latestTimestamp = useMemo(() => {
    let latest: string | null = null;
    series.forEach((serie) => {
      serie.data.forEach((point) => {
        const parsed = new Date(point.timestamp);
        if (Number.isNaN(parsed.getTime())) return;
        if (!latest || parsed.getTime() > new Date(latest).getTime()) {
          latest = point.timestamp;
        }
      });
    });
    return latest ?? meta?.updated_at ?? null;
  }, [series, meta?.updated_at]);

  const sourceCategory = useMemo(() => {
    const value = (series[0]?.source_type ?? meta?.source_type ?? '').toLowerCase();
    if (value.includes('instit')) return 'institutionnelle';
    if (value.includes('terrain')) return 'terrain';
    if (value.includes('parten')) return 'partenaire';
    return series[0]?.source_type ?? meta?.source_type ?? 'non renseignée';
  }, [series, meta?.source_type]);

  const comparisonData = useMemo(() => {
    const timeline = new Map<string, Record<string, unknown>>();
    series.forEach((serie) => {
      serie.data.forEach((point) => {
        const existing = timeline.get(point.timestamp) ?? { timestamp: point.timestamp };
        (existing as Record<string, unknown>)[serie.territoire] = point.prix;
        timeline.set(point.timestamp, existing);
      });
    });
    return Array.from(timeline.values()).sort(
      (a, b) => new Date(a.timestamp as string).getTime() - new Date(b.timestamp as string).getTime()
    );
  }, [series]);

  const anomalies = useMemo(
    () =>
      series.flatMap((serie) =>
        (serie.anomalies ?? []).map((a) => ({
          ...a,
          territoire: serie.territoire,
        }))
      ),
    [series]
  );

  const lineStrokeDasharray = sourceCategory === 'institutionnelle' ? undefined : '5 4';
  const lineDot =
    sourceCategory === 'institutionnelle' ? false : { r: 3, strokeWidth: 1, stroke: '#34d399', fill: '#34d399' };

  const handleToggleTerritory = (value: string) => {
    setSelectedTerritories((current) => {
      if (current.includes(value)) {
        const next = current.filter((t) => t !== value);
        // Always keep at least one territoire actif pour éviter un état vide
        return next.length ? next : [value];
      }
      return [...current, value];
    });
  };

  const colorPalette = ['#60a5fa', '#34d399', '#f59e0b', '#a855f7', '#f87171'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300">
                Observatoire vivant
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Prix réels — courbes temps réel
              </h1>
              <p className="text-slate-300 max-w-2xl">
                Suivez les prix horodatés par territoire, produit et période. Données Cloudflare-first,
                mises en cache KV, historiquées dans D1, sans impact sur les pages existantes.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/40">
              <span className="text-lg">✅</span>
              <span className="text-sm font-semibold">
                Données réelles • sources vérifiées • horodatées
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/15 text-amber-100 border border-amber-500/40">
              <span className="text-lg">ℹ️</span>
              <span className="text-sm font-semibold">
                Données mises à jour automatiquement – certaines sources peuvent être différées.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-400">
            <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800">
              D1: historique sécurisé
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800">
              KV: cache agrégé (perf/coûts)
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800">
              Cloudflare Workers temps réel
            </span>
          </div>
        </header>

        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase">Mode</p>
              <div className="inline-flex rounded-lg overflow-hidden border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setComparisonMode(false);
                    setSelectedTerritories([territoire]);
                  }}
                  className={`px-3 py-2 text-sm font-semibold ${
                    !comparisonMode ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-200'
                  }`}
                >
                  Vue simple
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode(true)}
                  className={`px-3 py-2 text-sm font-semibold ${
                    comparisonMode ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-200'
                  }`}
                >
                  Comparaison multi-territoires
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Source et fraîcheur affichées — pas de promesse flux caisse sans partenaire connecté.
              </p>
            </div>
            <div className="rounded-full bg-slate-800/70 border border-slate-700 px-3 py-2 text-xs text-slate-200">
              Dernière mise à jour : <span className="font-semibold text-white">{latestUpdate}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Territoire(s)</label>
              {comparisonMode ? (
                <div className="grid grid-cols-2 gap-2">
                  {TERRITORIES.map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        selectedTerritories.includes(t)
                          ? 'border-blue-500/60 bg-blue-500/10 text-blue-100'
                          : 'border-slate-800 bg-slate-950 text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTerritories.includes(t)}
                        onChange={() => handleToggleTerritory(t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={territoire}
                  onChange={(e) => {
                    setTerritoire(e.target.value);
                    setSelectedTerritories([e.target.value]);
                  }}
                >
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Produit</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={produit}
                onChange={(e) => setProduit(e.target.value)}
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Période</label>
              <div className="grid grid-cols-2 gap-2">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                      period === option.value
                        ? 'border-blue-500 bg-blue-500/10 text-blue-100'
                        : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="text-xs text-slate-400">{option.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400 uppercase">Dernière mise à jour</p>
              <p className="text-lg font-semibold text-white">{latestUpdate}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400 uppercase">Source</p>
              <p className="text-lg font-semibold text-white">
                {meta?.source_name || series[0]?.source_name || '—'}
              </p>
              <p className="text-xs text-slate-400">
                {meta?.source_type || series[0]?.source_type ? `Type: ${meta?.source_type ?? series[0]?.source_type}` : 'Type non renseigné'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-xs text-slate-400 uppercase">Vue active</p>
              <p className="text-lg font-semibold text-white">
                {comparisonMode ? `${selectedTerritories.length} territoires` : 'Monoterritoire'}
              </p>
              {meta?.cache && <p className="text-xs text-emerald-300">Cache: {meta.cache}</p>}
            </div>
          </div>
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
            <span className="font-semibold">Granularité : heure / jour / semaine / mois</span>
            <span className="text-slate-300">
              Les données horaires reflètent les dernières observations disponibles.
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Courbe dynamique ({currency})
              </h2>
              <p className="text-sm text-slate-400">
                Visualisation temps réel sans rafraîchissement agressif. Fallback clair si données absentes.
              </p>
            </div>
            <Link
              to="/observatoire"
              className="text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-blue-200 transition-colors"
            >
              Voir l’observatoire statique
            </Link>
          </div>

          {loading && (
            <div className="text-slate-300 text-sm">Chargement des courbes en cours…</div>
          )}

          {error && !loading && (
            <div
              role="alert"
              className="bg-amber-900/30 border border-amber-500 text-amber-100 px-4 py-3 rounded-xl text-sm"
            >
              {error}
            </div>
          )}

          {!loading && series.some((s) => s.data.length > 0) && (
            <div className="space-y-3">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatTick}
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${value.toFixed(2)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number, name) => [`${value.toFixed(2)} ${currency}`, name]}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    {series.map((serie, idx) => (
                      <Line
                        key={serie.territoire}
                        type="monotone"
                        dataKey={serie.territoire}
                        stroke={colorPalette[idx % colorPalette.length]}
                        strokeWidth={2}
                        strokeDasharray={lineStrokeDasharray}
                        dot={comparisonMode ? { r: 3 } : lineDot}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                {series.map((serie, idx) => (
                  <div key={serie.territoire} className="flex items-center gap-2">
                    <span
                      className="h-[2px] w-8 rounded-full"
                      style={{ backgroundColor: colorPalette[idx % colorPalette.length] }}
                      aria-hidden="true"
                    />
                    <span>{serie.territoire}</span>
                  </div>
                ))}
              </div>
              {anomalies.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 space-y-2">
                  <p className="font-semibold text-amber-200">Anomalies détectées</p>
                  <div className="flex flex-wrap gap-2">
                    {anomalies.slice(0, 8).map((anomaly, idx) => (
                      <span
                        key={`${anomaly.timestamp}-${idx}`}
                        className="rounded-lg border border-amber-500/40 px-2 py-1"
                      >
                        {anomaly.territoire ? `${anomaly.territoire} · ` : ''}
                        {formatObservationTimestamp(anomaly.timestamp)} — {anomaly.message}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-200 space-y-2">
                <p>Dernière observation : {formatObservationTimestamp(latestTimestamp)}</p>
                <p>Source : {sourceCategory}</p>
              </div>
            </div>
          )}
        </section>

        {series.some((s) => s.kpis) && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-lg font-semibold text-white">KPIs comparés</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-200">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Territoire</th>
                    <th className="px-3 py-2">Min</th>
                    <th className="px-3 py-2">Médiane</th>
                    <th className="px-3 py-2">Max</th>
                    <th className="px-3 py-2">Tendance</th>
                    <th className="px-3 py-2">Échantillon</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((serie) => (
                    <tr key={serie.territoire} className="border-t border-slate-800">
                      <td className="px-3 py-2 font-semibold">{serie.territoire}</td>
                      <td className="px-3 py-2">{serie.kpis ? `${serie.kpis.min.toFixed(2)} ${currency}` : '—'}</td>
                      <td className="px-3 py-2">
                        {serie.kpis ? `${serie.kpis.median.toFixed(2)} ${currency}` : '—'}
                      </td>
                      <td className="px-3 py-2">{serie.kpis ? `${serie.kpis.max.toFixed(2)} ${currency}` : '—'}</td>
                      <td className="px-3 py-2">
                        {serie.kpis ? `${serie.kpis.trend.toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-3 py-2">{serie.kpis?.sample ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold text-white">Transparence & mentions</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              Source : {meta?.source_name ?? '—'} ({meta?.source_type ?? 'non renseigné'})
            </li>
            <li>Horodatage : {latestUpdate}</li>
            <li className="text-amber-200">
              Les prix commerciaux sont indicatifs et dépendent des sources partenaires.
            </li>
            <li>
              Données horodatées, avec source affichée. En l’absence de flux connectés, un cache open-data
              est servi (KV) et les historiques sont stockés dans D1 quand elle est activée.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
