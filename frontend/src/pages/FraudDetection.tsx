/**
 * FraudDetection — Admin dashboard : détection d'anomalies ML + alertes fraude
 * Route : /admin/fraude
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Download, RefreshCw } from 'lucide-react';

interface PriceReport {
  id: string;
  productName: string;
  store: string;
  price: number;
  territory: string;
  reportedAt: string;
}

interface AnomalyResult extends PriceReport {
  mean: number;
  stddev: number;
  zScore: number;
  deviation: number;
  mlScore: number;
  status: 'critique' | 'suspect' | 'normal';
}

interface AlertRecord {
  id: string;
  productName: string;
  store: string;
  territory: string;
  mlScore: number;
  resolvedAt?: string;
}

async function buildReportsFromCatalogue(): Promise<PriceReport[]> {
  const { getCatalogue } = await import('../services/realDataService');
  const catalogue = await getCatalogue();

  // Group by category to find median price per category
  const byCategory: Record<string, number[]> = {};
  for (const p of catalogue) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p.price);
  }
  const catMedian: Record<string, number> = {};
  for (const [c, prices] of Object.entries(byCategory)) {
    const sorted = [...prices].sort((a, b) => a - b);
    catMedian[c] = sorted[Math.floor(sorted.length / 2)];
  }

  return catalogue.map((p, i) => ({
    id: String(i + 1),
    productName: p.name,
    store: p.store,
    price: p.price,
    territory: 'Guadeloupe',
    reportedAt: p.observations?.[0]?.date ?? '2025-04-01',
    _median: catMedian[p.category] ?? p.price,
  }));
}

const TERRITORIES = ['Tous', 'Martinique', 'Guadeloupe', 'Réunion', 'Guyane'];

function computeAnomalies(reports: PriceReport[]): AnomalyResult[] {
  const groups = new Map<string, PriceReport[]>();
  for (const r of reports) {
    const key = `${r.productName}|${r.territory}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const results: AnomalyResult[] = [];

  for (const [, group] of groups) {
    const prices = group.map((r) => r.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
    const stddev = Math.sqrt(variance);

    for (const report of group) {
      const zScore = stddev > 0 ? Math.abs(report.price - mean) / stddev : 0;
      const deviation = ((report.price - mean) / mean) * 100;
      // ML score: sigmoid-like mapping of z-score to 0–100
      const mlScore = Math.min(100, Math.round((zScore / 3) * 100));
      const status: AnomalyResult['status'] =
        mlScore > 80 ? 'critique' : mlScore > 50 ? 'suspect' : 'normal';

      results.push({ ...report, mean, stddev, zScore, deviation, mlScore, status });
    }
  }

  return results.sort((a, b) => b.mlScore - a.mlScore);
}

const STORAGE_KEY = 'akiprisaye_fraud_resolved';

function getResolved(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveResolved(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function FraudDetection() {
  const [territory, setTerritory] = useState('Tous');
  const [minScore, setMinScore] = useState(0);
  const [resolved, setResolved] = useState<Set<string>>(getResolved);

  const [reports, setReports] = useState<PriceReport[]>([]);

  useEffect(() => {
    let cancelled = false;
    buildReportsFromCatalogue().then((data) => {
      if (!cancelled) setReports(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allAnomalies = useMemo(() => computeAnomalies(reports), [reports]);

  const filtered = useMemo(
    () =>
      allAnomalies.filter(
        (a) => (territory === 'Tous' || a.territory === territory) && a.mlScore >= minScore
      ),
    [allAnomalies, territory, minScore]
  );

  const stats = useMemo(() => {
    const thisWeek = allAnomalies.filter((a) => a.mlScore > 0).length;
    const critical = allAnomalies.filter((a) => a.mlScore > 80).length;
    const resolvedCount = [...resolved].length;
    const pending = critical - resolvedCount;
    return { thisWeek, critical, resolvedCount, pending: Math.max(0, pending) };
  }, [allAnomalies, resolved]);

  const top5 = useMemo(
    () => allAnomalies.filter((a) => a.mlScore > 80).slice(0, 5),
    [allAnomalies]
  );

  const handleResolve = useCallback((id: string) => {
    setResolved((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveResolved(next);
      return next;
    });
  }, []);

  const exportCSV = useCallback(() => {
    const headers = 'Produit,Enseigne,Territoire,Prix,Écart(%),Score ML,Statut\n';
    const rows = allAnomalies
      .map(
        (a) =>
          `"${a.productName}","${a.store}","${a.territory}",${a.price.toFixed(2)},${a.deviation.toFixed(1)},${a.mlScore},${a.status}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alertes_fraude.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [allAnomalies]);

  const scoreBadge = (score: number) => {
    if (score > 80) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (score > 50)
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="text-red-500 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Détection de Fraude</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Anomalie auto-détection — scoring ML statistique (z-score ≥ 2σ)
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Alertes cette semaine',
            value: stats.thisWeek,
            icon: AlertTriangle,
            color: 'text-blue-500',
          },
          {
            label: 'Alertes critiques',
            value: stats.critical,
            icon: AlertTriangle,
            color: 'text-red-500',
          },
          {
            label: 'Résolues',
            value: stats.resolvedCount,
            icon: CheckCircle,
            color: 'text-green-500',
          },
          { label: 'En attente', value: stats.pending, icon: Clock, color: 'text-orange-500' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top 5 critical alerts */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-500 w-5 h-5" />
          Top 5 alertes critiques
        </h2>
        <div className="space-y-3">
          {top5.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{a.productName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {a.store} · {a.territory} · {a.price.toFixed(2)} €
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    {a.deviation > 0 ? '+' : ''}
                    {a.deviation.toFixed(1)}%
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${scoreBadge(a.mlScore)}`}
                >
                  {a.mlScore}
                </span>
                {resolved.has(a.id) ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Résolu
                  </span>
                ) : (
                  <button
                    onClick={() => handleResolve(a.id)}
                    className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Marquer résolu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ML Scoring table */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="text-blue-500 w-5 h-5" />
            Panel ML Scoring
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {TERRITORIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={0}>Tous niveaux</option>
              <option value={50}>Suspects (≥50)</option>
              <option value={80}>Critiques (≥80)</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['Produit', 'Enseigne', 'Prix', 'Écart (%)', 'Score ML', 'Statut'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">
                    {a.productName}
                  </td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{a.store}</td>
                  <td className="py-2 px-3 text-gray-900 dark:text-white">
                    {a.price.toFixed(2)} €
                  </td>
                  <td
                    className={`py-2 px-3 font-medium ${a.deviation > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                  >
                    {a.deviation > 0 ? '+' : ''}
                    {a.deviation.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-xs ${scoreBadge(a.mlScore)}`}
                    >
                      {a.mlScore}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${scoreBadge(a.mlScore)}`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune anomalie détectée pour ces critères
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
