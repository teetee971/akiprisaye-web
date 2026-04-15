/**
 * AdminAudience.tsx
 *
 * Classement des territoires par activité + centres d'intérêt par territoire.
 * Les données sont temps réel (Firestore onSnapshot) et historiques (totalVisits, totalViews).
 *
 * Un export JSON structuré permet à un robot / IA interne de lire ces insights
 * et de suggérer des améliorations du logiciel.
 */

import { useMemo, useState } from 'react';
import { Globe, TrendingUp, BarChart3, Cpu, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  useVisitorStats,
  type TerritoryStats,
  type TerritoryInterestStat,
} from '../../hooks/useVisitorStats';
import { isStaticPreviewEnv } from '../../services/admin/runtimeEnv';

// ── Helpers ───────────────────────────────────────────────────────────────────

function PulseDot({ active = true }: { active?: boolean }) {
  if (!active) return <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />;
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Medal for top-3 territories ──────────────────────────────────────────────

function medal(rank: number): string {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `${rank + 1}.`;
}

// ── Generate AI-ready JSON export ─────────────────────────────────────────────

interface AiInsightPayload {
  generatedAt: string;
  totalOnlineNow: number;
  territories: Array<{
    rank: number;
    code: string;
    name: string;
    flag: string;
    onlineNow: number;
    totalVisits: number;
    topInterestsRealtime: Array<{ key: string; name: string; emoji: string; onlineNow: number }>;
    topInterestsHistorical: Array<{ key: string; name: string; emoji: string; totalViews: number }>;
  }>;
  globalTopInterests: Array<{ key: string; name: string; emoji: string; onlineNow: number; totalViews: number }>;
  aiPromptSuggestion: string;
}

function buildAiPayload(
  totalOnline: number,
  byTerritory: TerritoryStats[],
  byInterest: ReturnType<typeof useVisitorStats>['byInterest'],
  interestByTerritory: Record<string, TerritoryInterestStat[]>,
): AiInsightPayload {
  const now = new Date().toISOString();

  const territories = byTerritory.map((t, idx) => ({
    rank: idx + 1,
    code: t.code,
    name: t.name,
    flag: t.flag,
    onlineNow: t.online,
    totalVisits: t.totalVisits,
    topInterestsRealtime: t.topInterests.map((i) => ({
      key: i.key,
      name: i.name,
      emoji: i.emoji,
      onlineNow: i.online,
    })),
    topInterestsHistorical: (interestByTerritory[t.code] ?? []).slice(0, 5).map((i) => ({
      key: i.interest,
      name: i.name,
      emoji: i.emoji,
      totalViews: i.totalViews,
    })),
  }));

  const globalTopInterests = byInterest.slice(0, 10).map((i) => ({
    key: i.key,
    name: i.name,
    emoji: i.emoji,
    onlineNow: i.online,
    totalViews: i.totalViews,
  }));

  const topTerr = byTerritory[0];
  const topInterestGlobal = globalTopInterests[0];
  const aiPromptSuggestion = [
    `Tu es un assistant IA interne pour l'application "A KI PRI SA YÉ", plateforme citoyenne de comparaison des prix dans les DOM-TOM.`,
    `Voici les données d'usage en temps réel au ${now} :`,
    `- ${totalOnline} visiteur(s) en ligne actuellement.`,
    topTerr
      ? `- Territoire le plus actif : ${topTerr.flag} ${topTerr.name} (${topTerr.online} en ligne, ${topTerr.totalVisits} visites totales).`
      : '',
    topInterestGlobal
      ? `- Centre d'intérêt #1 en ce moment : ${topInterestGlobal.emoji} ${topInterestGlobal.name} (${topInterestGlobal.onlineNow} utilisateurs actifs, ${topInterestGlobal.totalViews} vues totales).`
      : '',
    ``,
    `Sur la base de ces insights, propose 3 améliorations concrètes pour l'application qui répondraient aux besoins observés dans les territoires les plus actifs et pour les fonctionnalités les plus consultées.`,
    `Formule des recommandations précises : nouvelles fonctionnalités, optimisations UX, contenus éditoriaux ou partenariats utiles.`,
  ]
    .filter(Boolean)
    .join('\n');

  return { generatedAt: now, totalOnlineNow: totalOnline, territories, globalTopInterests, aiPromptSuggestion };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminAudience() {
  const isDegradedMode = isStaticPreviewEnv();
  const { totalOnline, byTerritory, byInterest, interestByTerritory, loading } = useVisitorStats();
  const [copied, setCopied] = useState<'json' | 'prompt' | null>(null);
  const [expandedTerritory, setExpandedTerritory] = useState<string | null>(null);

  const maxVisits = Math.max(...byTerritory.map((t) => t.totalVisits), 1);
  const maxOnline = Math.max(...byTerritory.map((t) => t.online), 1);

  const aiPayload = useMemo(
    () => buildAiPayload(totalOnline, byTerritory, byInterest, interestByTerritory),
    [totalOnline, byTerritory, byInterest, interestByTerritory],
  );

  const handleCopy = async (type: 'json' | 'prompt') => {
    const text =
      type === 'json'
        ? JSON.stringify(aiPayload, null, 2)
        : aiPayload.aiPromptSuggestion;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      // clipboard unavailable
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-400" />
            Audience par territoire
          </h1>
          <p className="text-white/60 text-sm">
            Classement temps réel + historique · centres d'intérêt par territoire · export IA
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
          <PulseDot active={!isDegradedMode} />
          <span className="text-emerald-300 font-bold tabular-nums text-xl">{totalOnline}</span>
          <span className="text-white/60 text-sm">
            {totalOnline === 1 ? 'visiteur en ligne' : 'visiteurs en ligne'}
          </span>
        </div>
      </div>

      {isDegradedMode && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-400/40 text-amber-200 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Mode preview statique — les statistiques Firestore temps réel ne sont pas disponibles dans cet environnement.
        </div>
      )}

      {/* ── Territory ranking ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          Classement des territoires
        </h2>

        {byTerritory.length === 0 ? (
          <div className="text-center py-12 text-white/40 bg-white/5 rounded-2xl border border-white/10">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Aucune donnée de connexion disponible pour le moment.</p>
            <p className="text-sm mt-1">Les statistiques apparaîtront dès que des visiteurs accèdent au site.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {byTerritory.map((t, idx) => {
              const isExpanded = expandedTerritory === t.code;
              const histInterests = (interestByTerritory[t.code] ?? []).slice(0, 5);
              const hasDetail = t.topInterests.length > 0 || histInterests.length > 0;

              return (
                <div
                  key={t.code}
                  className="bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Row */}
                  <button
                    type="button"
                    className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-4 hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedTerritory(isExpanded ? null : t.code)}
                    disabled={!hasDetail}
                    aria-expanded={isExpanded}
                  >
                    {/* Medal + flag */}
                    <span className="text-2xl w-8 text-center select-none" aria-hidden="true">
                      {medal(idx)}
                    </span>
                    <span className="text-2xl select-none" aria-hidden="true">{t.flag}</span>

                    {/* Name */}
                    <div className="flex-1 min-w-[120px]">
                      <p className="font-semibold text-white text-base">{t.name}</p>
                      <p className="text-white/40 text-xs">{t.code}</p>
                    </div>

                    {/* Online now */}
                    <div className="text-center w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        <PulseDot active={t.online > 0} />
                        <span className="text-emerald-300 font-bold tabular-nums text-lg">{t.online}</span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">en ligne</p>
                      <Bar value={t.online} max={maxOnline} />
                    </div>

                    {/* Total visits */}
                    <div className="text-center w-28 hidden sm:block">
                      <p className="text-white font-semibold tabular-nums text-lg">
                        {t.totalVisits.toLocaleString('fr-FR')}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">visites totales</p>
                      <Bar value={t.totalVisits} max={maxVisits} />
                    </div>

                    {/* Top interests preview */}
                    {t.topInterests.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {t.topInterests.slice(0, 3).map((i) => (
                          <span
                            key={i.key}
                            className="text-base"
                            title={`${i.name} (${i.online} en ligne)`}
                            aria-label={`${i.name}, ${i.online} en ligne`}
                          >
                            {i.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expand chevron */}
                    {hasDetail && (
                      <span
                        className={`text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    )}
                  </button>

                  {/* Expanded detail: real-time + historical interests */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/10 grid sm:grid-cols-2 gap-6 pt-4">
                      {/* Real-time interests */}
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                          🟢 Intérêts actifs maintenant
                        </p>
                        {t.topInterests.length === 0 ? (
                          <p className="text-white/30 text-sm">Aucun visiteur actif en ce moment.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {t.topInterests.map((i, ri) => (
                              <li key={i.key} className="flex items-center gap-2 text-sm">
                                <span className="text-white/30 w-4 text-right text-xs">{ri + 1}.</span>
                                <span>{i.emoji}</span>
                                <span className="text-white/80 flex-1 truncate">{i.name}</span>
                                <span className="text-emerald-300 font-mono font-bold text-xs">{i.online}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Historical interests */}
                      <div>
                        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
                          📊 Intérêts historiques (toutes visites)
                        </p>
                        {histInterests.length === 0 ? (
                          <p className="text-white/30 text-sm">Pas encore de données historiques.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {histInterests.map((i, hi) => (
                              <li key={i.interest} className="flex items-center gap-2 text-sm">
                                <span className="text-white/30 w-4 text-right text-xs">{hi + 1}.</span>
                                <span>{i.emoji}</span>
                                <span className="text-white/80 flex-1 truncate">{i.name}</span>
                                <span className="text-blue-300 font-mono font-bold text-xs">
                                  {i.totalViews.toLocaleString('fr-FR')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Global interest ranking ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Top centres d'intérêt globaux
        </h2>
        {byInterest.length === 0 ? (
          <p className="text-white/40 text-center py-8">Aucune donnée disponible.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byInterest.slice(0, 12).map((i, idx) => (
              <div
                key={i.key}
                className="bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-white/30 text-xs w-5 text-right">{idx + 1}.</span>
                <span className="text-xl">{i.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{i.name}</p>
                  <div className="flex gap-3 mt-0.5">
                    {i.online > 0 && (
                      <span className="text-emerald-400 text-xs font-mono">{i.online} en ligne</span>
                    )}
                    {i.totalViews > 0 && (
                      <span className="text-blue-400 text-xs font-mono">
                        {i.totalViews.toLocaleString('fr-FR')} vues
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── AI Export ── */}
      <section className="bg-gradient-to-br from-slate-800/80 to-indigo-900/40 border border-indigo-500/30 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          Données pour robot / IA interne
        </h2>
        <p className="text-white/50 text-sm mb-5">
          Ces données structurées peuvent être injectées dans un modèle de langage (ChatGPT, Claude, Mistral…)
          pour générer automatiquement des recommandations d'amélioration du logiciel.
        </p>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleCopy('prompt')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {copied === 'prompt' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'prompt' ? 'Copié !' : 'Copier le prompt IA'}
          </button>
          <button
            type="button"
            onClick={() => handleCopy('json')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20"
          >
            {copied === 'json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'json' ? 'Copié !' : 'Copier JSON complet'}
          </button>
        </div>

        {/* Prompt preview */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">
            Prompt IA suggéré
          </p>
          <pre className="text-white/70 text-xs whitespace-pre-wrap leading-relaxed font-mono">
            {aiPayload.aiPromptSuggestion}
          </pre>
        </div>

        {/* JSON summary (first 20 lines) */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-white/40 hover:text-white/70 transition-colors select-none">
            ▸ Voir le JSON complet ({byTerritory.length} territoire(s), {byInterest.length} intérêt(s))
          </summary>
          <pre className="mt-3 bg-black/40 border border-white/10 rounded-xl p-4 text-white/60 text-xs overflow-x-auto max-h-96 leading-relaxed font-mono">
            {JSON.stringify(aiPayload, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
}
