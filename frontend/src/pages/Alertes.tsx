/**
 * Alertes — Alertes sanitaires DOM-COM
 * Route : /alertes
 * Module 5 — Alertes consommateurs
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bell, Download, ShieldAlert } from 'lucide-react';
import AlertProductImage from '../components/alerts/AlertProductImage';
import { useStoreSelection } from '../context/StoreSelectionContext';
import { getAlerts } from '../services/alertsService';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import type {
  SanitaryAlert,
  SanitaryAlertsMetadata,
  TerritoryCode,
  AlertSeverity,
} from '../types/alerts';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert an array of alert objects to a RFC-4180 CSV string. */
function alertsToCSV(alerts: SanitaryAlert[]): string {
  const headers: (keyof SanitaryAlert)[] = [
    'id',
    'title',
    'severity',
    'status',
    'category',
    'brand',
    'ean',
    'lot',
    'publishedAt',
    'reason',
  ];
  const escape = (val: unknown): string => {
    if (val == null) return '';
    const s = String(val).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  const rows = alerts.map((a) => headers.map((h) => escape(a[h])).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}

/** Trigger a CSV file download in the browser. */
function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Constants ─────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

const severityOptions: SelectOption[] = [
  { value: '', label: 'Toutes sévérités' },
  { value: 'critical', label: 'Critique' },
  { value: 'important', label: 'Importante' },
  { value: 'info', label: 'Information' },
];

const categoryOptions: SelectOption[] = [
  { value: '', label: 'Toutes catégories' },
  { value: 'bébé', label: 'Bébé' },
  { value: 'épicerie', label: 'Épicerie' },
  { value: 'viande/poisson', label: 'Viande / poisson' },
  { value: 'hygiène', label: 'Hygiène' },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function Alertes() {
  const { selection } = useStoreSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const territory = selection?.territory ?? 'gp';

  const [onlyActive, setOnlyActive] = useState(searchParams.get('active') === '1');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [severity, setSeverity] = useState(searchParams.get('severity') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [alerts, setAlerts] = useState<SanitaryAlert[]>([]);
  const [metadata, setMetadata] = useState<SanitaryAlertsMetadata | null>(null);

  const syncQueryString = useCallback(
    (next: { onlyActive: boolean; category: string; severity: string; q: string }) => {
      const params = new URLSearchParams();
      if (next.onlyActive) params.set('active', '1');
      if (next.category) params.set('category', next.category);
      if (next.severity) params.set('severity', next.severity);
      if (next.q) params.set('q', next.q);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleExportCSV = useCallback(() => {
    const csv = alertsToCSV(alerts);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `alertes-sanitaires-${territory}-${date}.csv`);
  }, [alerts, territory]);

  useEffect(() => {
    let mounted = true;
    getAlerts({
      territory: territory as TerritoryCode,
      onlyActive,
      category: category || undefined,
      severity: (severity as AlertSeverity) || undefined,
      q: q || undefined,
    }).then((result) => {
      if (!mounted) return;
      setAlerts(result.alerts);
      setMetadata(result.metadata);
    });

    return () => {
      mounted = false;
    };
  }, [territory, onlyActive, category, severity, q]);

  return (
    <>
      <Helmet>
        <title>Alertes sanitaires DOM-COM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Alertes sanitaires et rappels de produits dans les DOM-COM. Filtrez par territoire, catégorie et sévérité."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/alertes" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero */}
        <HeroImage
          src={PAGE_HERO_IMAGES.alerts}
          alt="Alertes sanitaires — surveillance des produits"
          gradient="from-slate-950 to-red-900"
          height="h-36 sm:h-48"
          className="mb-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-300 drop-shadow" />
            <span className="text-xs font-semibold uppercase tracking-widest text-red-300">
              Surveillance consommateurs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
            🔔 Alertes sanitaires
          </h1>
          <p className="text-red-100 text-sm mt-1 drop-shadow">
            Territoire : <strong className="uppercase">{territory}</strong>
            {metadata?.source === 'fallback' ? ' · fallback local' : ' · RappelConso'}
            {metadata?.fetchedAt
              ? ` · ${new Date(metadata.fetchedAt).toLocaleString('fr-FR')}`
              : ''}
          </p>
        </HeroImage>

        {/* Filtres */}
        <section aria-label="Filtres des alertes" className="grid md:grid-cols-4 gap-3 mb-6">
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 dark:bg-slate-900 px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => {
                const nextValue = e.target.checked;
                setOnlyActive(nextValue);
                syncQueryString({ onlyActive: nextValue, category, severity, q });
              }}
            />
            <span className="text-sm text-slate-200">Actives uniquement</span>
          </label>

          <select
            aria-label="Filtrer par catégorie"
            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 dark:bg-slate-900"
            value={category}
            onChange={(e) => {
              const nextValue = e.target.value;
              setCategory(nextValue);
              syncQueryString({ onlyActive, category: nextValue, severity, q });
            }}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrer par sévérité"
            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 dark:bg-slate-900"
            value={severity}
            onChange={(e) => {
              const nextValue = e.target.value;
              setSeverity(nextValue);
              syncQueryString({ onlyActive, category, severity: nextValue, q });
            }}
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Rechercher (titre, marque, lot, EAN...)"
            value={q}
            aria-label="Rechercher dans les alertes"
            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 dark:bg-slate-900"
            onChange={(e) => {
              const nextValue = e.target.value;
              setQ(nextValue);
              syncQueryString({ onlyActive, category, severity, q: nextValue });
            }}
          />
        </section>

        {/* Export CSV */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExportCSV}
            disabled={alerts.length === 0}
            aria-label="Télécharger le rapport CSV des alertes"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Télécharger rapport CSV ({alerts.length})
          </button>
        </div>

        {/* Liste */}
        <section aria-label="Liste des alertes sanitaires" className="space-y-3">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="rounded-xl border border-slate-700 bg-slate-900 dark:bg-slate-900 p-4"
              aria-label={alert.title}
            >
              <p className="text-xs uppercase text-slate-400 mb-1">
                {alert.severity} · {alert.status}
              </p>
              <div className="flex gap-3 items-start">
                <AlertProductImage
                  ean={alert.ean}
                  category={alert.category}
                  alt={alert.productName ?? alert.title}
                  size={56}
                />
                <div>
                  <h2 className="font-semibold text-lg text-slate-100">{alert.title}</h2>
                  <p className="text-sm text-slate-300 mt-2">{alert.reason}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {alert.publishedAt
                  ? `Publié le ${new Date(alert.publishedAt).toLocaleDateString('fr-FR')} · `
                  : ''}
                {alert.category ? `${alert.category} · ` : ''}
                {alert.brand ? `${alert.brand} · ` : ''}
                {alert.ean ? `EAN ${alert.ean} · ` : ''}
                {alert.lot ? `Lot ${alert.lot}` : ''}
              </p>
              <Link
                className="inline-flex items-center gap-1 mt-3 text-blue-300 hover:text-blue-200 underline text-sm"
                to={`/alertes/${alert.id}`}
              >
                <Bell className="w-3.5 h-3.5" />
                Voir détails
              </Link>
            </article>
          ))}

          {alerts.length === 0 && (
            <p className="text-slate-400 py-8 text-center">
              Aucune alerte sanitaire ne correspond à vos filtres.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
