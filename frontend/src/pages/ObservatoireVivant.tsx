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
import { PriceChart } from '../components/PriceChart';
import { filterByRange } from '../utils/priceRange';
import type { PriceObservation } from '../types/PriceObservation';
import { getRealtimePrices, type RealtimePriceState } from '../services/realtimePricesService';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
type Period = 'hour' | 'day' | 'week' | 'month';

type PricePoint = {
  timestamp: string;
  prix: number;
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
};

const TERRITORIES = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'];
const PRODUCTS = ['Riz 1kg', 'Lait UHT 1L', 'Pâtes 500g', 'Sucre 1kg'];
const TERRITORY_CODES: Record<string, PriceObservation['territory']> = {
  Guadeloupe: 'GP',
  Martinique: 'MQ',
  Guyane: 'GF',
  'La Réunion': 'RE',
  Mayotte: 'YT',
};
const PERIOD_OPTIONS: Array<{ value: Period; label: string; subtitle: string }> = [
  { value: 'hour', label: 'Heure', subtitle: 'Flux commerçants' },
  { value: 'day', label: 'Jour', subtitle: 'Agrégation 24h' },
  { value: 'week', label: 'Semaine', subtitle: 'Vue consolidée' },
  { value: 'month', label: 'Mois', subtitle: 'Tendance longue' },
];

const STATUS_STYLES: Record<
  RealtimePriceState,
  { icon: string; label: string; classes: string; accent: string }
> = {
  live: {
    icon: '🟢',
    label: 'Données temps réel',
    classes: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40',
    accent: 'text-emerald-100',
  },
  cached: {
    icon: '🟠',
    label: 'Données en cache',
    classes: 'bg-amber-500/15 text-amber-100 border-amber-500/40',
    accent: 'text-amber-100',
  },
  offline: {
    icon: '🔴',
    label: 'Données locales (fallback)',
    classes: 'bg-rose-500/15 text-rose-100 border-rose-500/40',
    accent: 'text-rose-100',
  },
};

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
  const [produit, setProduit] = useState(PRODUCTS[0]);
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<PricePoint[]>([]);
  const [meta, setMeta] = useState<Omit<ApiResponse, 'data'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openData, setOpenData] = useState<PriceObservation[]>([]);
  const [realtimeState, setRealtimeState] = useState<{
    state: RealtimePriceState;
    updatedAt: string | null;
    source: string;
  }>({
    state: 'offline',
    updatedAt: null,
    source: 'fallback-local',
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL('/api/prices', window.location.origin);
        url.searchParams.set('territoire', territoire);
        url.searchParams.set('produit', produit);
        url.searchParams.set('period', period);

        const response = await fetch(url.toString(), { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Réponse API invalide');
        }

        const json = (await response.json()) as ApiResponse;
        const points = Array.isArray(json.data) ? json.data : [];

        setData(points);
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

        if (points.length === 0) {
          setError(
            'Aucune donnée horodatée disponible pour cette sélection. Les flux se mettront à jour dès la première collecte.'
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Erreur chargement observatoire vivant', err);
        setError('Données momentanément indisponibles. Merci de réessayer ultérieurement.');
        setData([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [territoire, produit, period]);

  useEffect(() => {
    let cancelled = false;
    getRealtimePrices({ timeoutMs: 4500 })
      .then((result) => {
        if (cancelled) return;
        setRealtimeState({
          state: result.state,
          updatedAt: result.updatedAt,
          source: result.source,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setRealtimeState((prev) => ({ ...prev, state: 'offline' }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/prices.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PriceObservation[] | null) => {
        if (!cancelled && Array.isArray(json)) {
          setOpenData(json);
        }
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          console.warn('Données publiques indisponibles');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const latestUpdate = useMemo(() => formatDate(meta?.updated_at), [meta?.updated_at]);
  const realtimeUpdated = useMemo(
    () => formatDate(realtimeState.updatedAt ?? undefined),
    [realtimeState.updatedAt]
  );

  const currency = meta?.currency ?? '€';
  const latestTimestamp = useMemo(() => {
    if (data.length === 0) {
      return meta?.updated_at ?? null;
    }
    let latest: string | null = null;
    for (const point of data) {
      const parsed = new Date(point.timestamp);
      if (Number.isNaN(parsed.getTime())) continue;
      if (!latest || parsed.getTime() > new Date(latest).getTime()) {
        latest = point.timestamp;
      }
    }
    return latest ?? meta?.updated_at ?? null;
  }, [data, meta?.updated_at]);

  const filteredOpenData = useMemo(() => {
    if (!openData.length) return [];
    const territoryCode = TERRITORY_CODES[territoire];
    const normalizedProduct = produit.toLowerCase();
    return filterByRange(
      openData.filter(
        (obs) =>
          (!territoryCode || obs.territory === territoryCode) &&
          (obs.productLabel === produit || obs.productId.toLowerCase().includes(normalizedProduct))
      ),
      period
    );
  }, [openData, territoire, produit, period]);

  const chartData = useMemo(
    () => filteredOpenData.map((entry) => ({ observedAt: entry.observedAt, price: entry.price })),
    [filteredOpenData]
  );

  const sourceCategory = useMemo(() => {
    const value = (meta?.source_type ?? '').toLowerCase();
    if (value.includes('instit')) return 'institutionnelle';
    if (value.includes('terrain')) return 'terrain';
    if (value.includes('parten')) return 'partenaire';
    return meta?.source_type ?? 'non renseignée';
  }, [meta?.source_type]);

  const isInstitutionalSource = sourceCategory === 'institutionnelle';
  const lineStrokeDasharray = isInstitutionalSource ? undefined : '5 4';
  const lineDot = isInstitutionalSource
    ? false
    : { r: 3, strokeWidth: 1, stroke: '#34d399', fill: '#34d399' };

  return (
    <>
      <SEOHead
        title="Observatoire des prix en temps réel — Flux live Outre-mer"
        description="Suivez les prix en temps réel dans les supermarchés et marchés des territoires d'Outre-mer. Flux de données citoyennes actualisé."
        canonical="https://teetee971.github.io/akiprisaye-web/observatoire-vivant"
      />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
          {/* Hero banner */}
          <div className="animate-fade-in">
            <HeroImage
              src={PAGE_HERO_IMAGES.coverage}
              alt="Observatoire vivant — données temps réel"
              gradient="from-blue-950 to-slate-900"
              height="h-40 sm:h-52"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-semibold">
                Observatoire vivant
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
                Prix réels — courbes temps réel
              </h1>
              <div
                className={`mt-1 inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs ${STATUS_STYLES[realtimeState.state].classes}`}
                role="status"
                aria-live="polite"
              >
                <span>{STATUS_STYLES[realtimeState.state].icon}</span>
                <span className="font-semibold">{STATUS_STYLES[realtimeState.state].label}</span>
                <span className="opacity-75">· {realtimeUpdated}</span>
              </div>
            </HeroImage>
          </div>
          <header className="space-y-4">
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="obs-territoire" className="text-sm text-slate-400">
                  Territoire
                </label>
                <select
                  id="obs-territoire"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={territoire}
                  onChange={(e) => setTerritoire(e.target.value)}
                >
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="obs-produit" className="text-sm text-slate-400">
                  Produit
                </label>
                <select
                  id="obs-produit"
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
                <span className="text-sm text-slate-400">Période</span>
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
                <p className="text-lg font-semibold text-white">{meta?.source_name || '—'}</p>
                <p className="text-xs text-slate-400">
                  {meta?.source_type ? `Type: ${meta.source_type}` : 'Type non renseigné'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xs text-slate-400 uppercase">Période sélectionnée</p>
                <p className="text-lg font-semibold text-white">
                  {PERIOD_OPTIONS.find((p) => p.value === period)?.label}
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
                <h2 className="text-xl font-semibold text-white">Courbe dynamique ({currency})</h2>
                <p className="text-sm text-slate-400">
                  Visualisation temps réel sans rafraîchissement agressif. Fallback clair si données
                  absentes.
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

            {!loading && data.length > 0 && (
              <div className="space-y-3">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
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
                        formatter={(value) => {
                          const numericValue =
                            typeof value === 'number' ? value : Number(value ?? 0);
                          return [`${numericValue.toFixed(2)} ${currency}`, 'Prix'];
                        }}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Line
                        type="monotone"
                        dataKey="prix"
                        stroke={isInstitutionalSource ? '#60a5fa' : '#34d399'}
                        strokeWidth={2}
                        strokeDasharray={lineStrokeDasharray}
                        dot={lineDot}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="h-[2px] w-8 rounded-full bg-blue-400" aria-hidden="true" />
                    <span>● Données institutionnelles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 border-t border-dashed border-emerald-300 relative">
                      <span
                        className="absolute -top-1 left-1 h-2 w-2 rounded-full bg-emerald-300"
                        aria-hidden="true"
                      />
                      <span
                        className="absolute -bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-300"
                        aria-hidden="true"
                      />
                    </span>
                    <span>○ Données observées (terrain / partenaires)</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-200">
                  <p>Dernière observation : {formatObservationTimestamp(latestTimestamp)}</p>
                  <p>Source : {sourceCategory}</p>
                </div>
              </div>
            )}
          </section>

          {chartData.length > 0 && (
            <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Observations publiques</h3>
                  <p className="text-sm text-slate-300">
                    Données versionnables (Cloudflare Pages) filtrées sur la période sélectionnée.
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {chartData.length} relevé(s) • dernière heure/jour/semaine/mois
                </span>
              </div>
              <div className="h-72">
                <PriceChart data={chartData} />
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
                Données réelles, aucune simulation. Les caches sont rafraîchis par KV et les
                historiques sont stockés dans D1.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
