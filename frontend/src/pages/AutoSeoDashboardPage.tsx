/**
 * AutoSeoDashboardPage.tsx — Auto SEO Engine dashboard.
 * Route: /auto-seo-dashboard (private, noIndex)
 */

import { useState, useMemo } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import {
  SAMPLE_SIGNALS,
  generateRecommendations,
  getSummaryStats,
  type AutoSeoRecommendation,
  type AutoSeoActionType,
} from '../utils/autoSeoEngine';
import {
  MAX_HIGH_PRIORITY,
  MAX_DUPLICATIONS,
  WHITELISTED_PATCH_FILES,
} from '../utils/autoSeoGuardrails';

const ACTION_STYLES: Record<AutoSeoActionType, string> = {
  IMPROVE_TITLE: 'bg-amber-400/10 text-amber-300 border border-amber-400/20',
  IMPROVE_META: 'bg-orange-400/10 text-orange-300 border border-orange-400/20',
  BOOST_LINKING: 'bg-blue-400/10 text-blue-300 border border-blue-400/20',
  ENRICH_CONTENT: 'bg-violet-400/10 text-violet-300 border border-violet-400/20',
  DUPLICATE_PAGE: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20',
  BOOST_CTA: 'bg-rose-400/10 text-rose-300 border border-rose-400/20',
  DEPRIORITIZE: 'bg-zinc-400/10 text-zinc-300 border border-zinc-400/20',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  low: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
};

const PAGE_TYPES = ['all', 'product', 'category', 'comparison', 'inflation', 'pillar'] as const;
const PRIORITIES = ['all', 'high', 'medium', 'low'] as const;
const ACTION_TYPES: Array<'all' | AutoSeoActionType> = [
  'all',
  'IMPROVE_TITLE',
  'IMPROVE_META',
  'BOOST_LINKING',
  'ENRICH_CONTENT',
  'DUPLICATE_PAGE',
  'BOOST_CTA',
  'DEPRIORITIZE',
];

const allRecs = generateRecommendations(SAMPLE_SIGNALS);
const stats = getSummaryStats(allRecs);

function truncate(str: string, n = 40): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export default function AutoSeoDashboardPage() {
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return allRecs.filter((r) => {
      const signal = SAMPLE_SIGNALS.find((s) => s.url === r.url);
      if (pageTypeFilter !== 'all' && signal?.pageType !== pageTypeFilter) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (actionFilter !== 'all' && r.type !== actionFilter) return false;
      return true;
    });
  }, [pageTypeFilter, priorityFilter, actionFilter]);

  return (
    <>
      <SEOHead
        title="Auto SEO Engine"
        description="Tableau de bord du moteur SEO automatique."
        noIndex
      />

      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">🤖 Auto SEO Engine</h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Analyse automatique des signaux SEO · Recommandations priorisées · Revue humaine requise
            avant application
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Pages analysées" value={SAMPLE_SIGNALS.length} color="text-blue-300" />
          <StatCard label="Haute priorité" value={stats.highPriority} color="text-rose-300" />
          <StatCard label="À dupliquer" value={stats.toDuplicate} color="text-emerald-300" />
          <StatCard label="CTA à booster" value={stats.toBoostCta} color="text-amber-300" />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <FilterSelect
            id="autoseo-filter-pagetype"
            label="Type de page"
            value={pageTypeFilter}
            options={PAGE_TYPES}
            onChange={setPageTypeFilter}
          />
          <FilterSelect
            id="autoseo-filter-priority"
            label="Priorité"
            value={priorityFilter}
            options={PRIORITIES}
            onChange={setPriorityFilter}
          />
          <FilterSelect
            id="autoseo-filter-action"
            label="Action"
            value={actionFilter}
            options={ACTION_TYPES}
            onChange={setActionFilter}
          />
        </div>

        {/* Recommendations table */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <p className="text-zinc-400 text-lg mb-2">Aucune recommandation</p>
            <p className="text-zinc-600 text-sm">Essayez d'autres filtres.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Action</th>
                    <th className="text-left px-4 py-3">Priorité</th>
                    <th className="text-left px-4 py-3">URL</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Raison</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Cible suggérée</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, i) => (
                    <RecommendationRow key={`${rec.url}-${i}`} rec={rec} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-zinc-800 text-zinc-500 text-xs">
              {filtered.length} recommandation(s) affichée(s)
            </div>
          </div>
        )}

        {/* Guardrails info box */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span>🔒</span> Guardrails actifs
          </h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Maximum <span className="text-zinc-200 font-medium">{MAX_HIGH_PRIORITY}</span> actions
              haute priorité par cycle
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Maximum <span className="text-zinc-200 font-medium">{MAX_DUPLICATIONS}</span>{' '}
              duplications de pages
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-zinc-200 font-medium">
                {WHITELISTED_PATCH_FILES.length}
              </span>{' '}
              fichiers cibles autorisés (whitelist stricte)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Toutes les recommandations requièrent une raison documentée
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Revue humaine requise avant tout merge — aucun auto-commit
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 font-medium mb-1">Fichiers whitelistés :</p>
            <ul className="space-y-1">
              {WHITELISTED_PATCH_FILES.map((f) => (
                <li key={f} className="text-xs text-zinc-500 font-mono">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-zinc-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'all' ? 'Tous' : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: AutoSeoRecommendation }) {
  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ACTION_STYLES[rec.type]}`}
        >
          {rec.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_STYLES[rec.priority]}`}
        >
          {rec.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-zinc-300" title={rec.url}>
          {truncate(rec.url, 40)}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-zinc-400 text-xs max-w-xs">
        {rec.reason}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {rec.suggestedTarget ? (
          <span className="font-mono text-xs text-emerald-400" title={rec.suggestedTarget}>
            {truncate(rec.suggestedTarget, 35)}
          </span>
        ) : (
          <span className="text-zinc-700">—</span>
        )}
      </td>
    </tr>
  );
}
