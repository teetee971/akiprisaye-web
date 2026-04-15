/**
 * AdminAutomationDashboard — Tableau de bord d'automatisation en temps réel
 *
 * Affiche l'état live de tous les systèmes automatiques :
 *   🤖 Scrapers       — santé des 12 sources de données
 *   ⚙️  Workflows      — dernières exécutions GitHub Actions
 *   🗳️  Modération     — file de contributions citoyennes
 *   🔔 Alertes prix   — déclenchements récents
 *   📰 Lettre hebdo   — dernière génération IA
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Bot,
  Bell,
  FileText,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  getAutomationStatus,
  type AutomationStatus,
  type ScrapingSourceStatus,
  type WorkflowRun,
} from '@/services/admin/automationStatusService';
import { isStaticPreviewEnv } from '@/services/admin/runtimeEnv';

const REFRESH_INTERVAL_MS = 30_000; // 30 secondes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtRelative(isoDate: string | null): string {
  if (!isoDate) return '—';
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function fmtDateTime(isoDate: string | null): string {
  if (!isoDate) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDate));
}

function workflowBadge(run: WorkflowRun) {
  if (run.status === 'in_progress') {
    return { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, color: 'text-blue-400', label: 'En cours' };
  }
  if (run.status === 'queued') {
    return { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-yellow-400', label: 'En attente' };
  }
  if (run.conclusion === 'success') {
    return { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-emerald-400', label: 'Succès' };
  }
  if (run.conclusion === 'failure') {
    return { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-400', label: 'Échec' };
  }
  if (run.conclusion === 'cancelled') {
    return { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-slate-400', label: 'Annulé' };
  }
  return { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-slate-400', label: run.conclusion ?? run.status };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LivePulse({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {ok && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
      />
    </span>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-white/5 text-indigo-300">{icon}</div>
      <div>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function SourceRow({ source }: { source: ScrapingSourceStatus }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <LivePulse ok={source.ok} />
        <span className="text-sm text-slate-200">{source.label}</span>
      </div>
      <span className={`text-xs font-mono ${source.ok ? 'text-emerald-400' : 'text-red-400'}`}>
        {source.ok ? `${source.count.toLocaleString('fr-FR')} entrées` : 'KO'}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAutomationDashboard() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [scrapingExpanded, setScrapingExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDegradedMode = isStaticPreviewEnv();

  const refresh = useCallback(async () => {
    if (isDegradedMode) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await getAutomationStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [isDegradedMode]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!liveEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    setCountdown(REFRESH_INTERVAL_MS / 1000);

    intervalRef.current = setInterval(() => {
      refresh();
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    }, REFRESH_INTERVAL_MS);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [liveEnabled, refresh]);

  const handleManualRefresh = () => {
    setLoading(true);
    setCountdown(REFRESH_INTERVAL_MS / 1000);
    refresh();
  };

  // ── Scraping global health ──
  const scrapingOkCount = status?.scraping.sources.filter((s: ScrapingSourceStatus) => s.ok).length ?? 0;
  const scrapingTotalCount = status?.scraping.sources.length ?? 0;
  const scrapingAllOk = scrapingOkCount === scrapingTotalCount && scrapingTotalCount > 0;
  const scrapingColor =
    status?.scraping.staleness === 'stale'
      ? 'text-red-400'
      : status?.scraping.staleness === 'fresh'
        ? 'text-emerald-400'
        : 'text-yellow-400';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            Automatisation — Tableau de bord live
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            État en temps réel de tous les systèmes automatiques du site
          </p>
        </div>

        {/* Live controls */}
        <div className="flex items-center gap-3">
          {status && (
            <span className="text-xs text-slate-500">
              Mis à jour {fmtRelative(status.fetchedAt)}
            </span>
          )}

          <button
            type="button"
            onClick={() => setLiveEnabled((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              liveEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            {liveEnabled ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {liveEnabled ? `Live · ${countdown}s` : 'Pause'}
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {isDegradedMode && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-400/40 text-amber-200 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Mode preview statique — les données temps réel (GitHub Actions, Firestore) ne sont pas disponibles dans cet environnement.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Scraping */}
        <GlassCard className="p-4 flex items-center gap-3">
          <Activity className={`w-8 h-8 ${scrapingColor}`} />
          <div>
            <p className="text-2xl font-bold text-white">
              {loading ? '…' : `${scrapingOkCount}/${scrapingTotalCount}`}
            </p>
            <p className="text-xs text-slate-400">Sources OK</p>
          </div>
        </GlassCard>

        {/* Workflows */}
        <GlassCard className="p-4 flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="text-2xl font-bold text-white">
              {loading
                ? '…'
                : status?.workflows.filter((w: WorkflowRun) => w.conclusion === 'success').length ?? 0}
              <span className="text-sm text-slate-400">
                /{status?.workflows.length ?? 0}
              </span>
            </p>
            <p className="text-xs text-slate-400">Workflows OK</p>
          </div>
        </GlassCard>

        {/* Moderation pending */}
        <GlassCard className="p-4 flex items-center gap-3">
          <ShieldCheck className={`w-8 h-8 ${(status?.moderation.pending ?? 0) > 0 ? 'text-orange-400' : 'text-emerald-400'}`} />
          <div>
            <p className="text-2xl font-bold text-white">
              {loading ? '…' : status?.moderation.pending ?? 0}
            </p>
            <p className="text-xs text-slate-400">En attente modération</p>
          </div>
        </GlassCard>

        {/* Alerts 24h */}
        <GlassCard className="p-4 flex items-center gap-3">
          <Bell className="w-8 h-8 text-purple-400" />
          <div>
            <p className="text-2xl font-bold text-white">
              {loading ? '…' : status?.alerts.triggeredLast24h ?? 0}
            </p>
            <p className="text-xs text-slate-400">Alertes / 24h</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Scraping health ── */}
        <GlassCard className="p-5">
          <SectionHeader
            icon={<Activity className="w-5 h-5" />}
            title="Scrapers — santé des sources"
            subtitle={
              status?.scraping.lastScrapedAt
                ? `Dernier scraping : ${fmtRelative(status.scraping.lastScrapedAt)} · ${fmtDateTime(status.scraping.lastScrapedAt)}`
                : 'Aucune donnée'
            }
          />

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              scrapingAllOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
            }`}>
              <LivePulse ok={scrapingAllOk} />
              {scrapingAllOk ? 'Toutes sources actives' : `${scrapingTotalCount - scrapingOkCount} source(s) KO`}
            </span>

            {status?.scraping.dryRun && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                Mode simulation
              </span>
            )}

            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              status?.scraping.staleness === 'fresh'
                ? 'bg-emerald-500/20 text-emerald-300'
                : status?.scraping.staleness === 'stale'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {status?.scraping.staleness === 'fresh'
                ? '🟢 Données fraîches'
                : status?.scraping.staleness === 'stale'
                  ? '🔴 Données obsolètes (+24h)'
                  : '🟡 Données récentes'}
            </span>

            {(status?.scraping.shocksDetected ?? 0) > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                🚨 {status!.scraping.shocksDetected} choc(s) détecté(s)
              </span>
            )}
          </div>

          {/* Source list */}
          {status?.scraping.sources.length ? (
            <>
              {(scrapingExpanded
                ? status.scraping.sources
                : status.scraping.sources.slice(0, 6)
              ).map((s: ScrapingSourceStatus) => (
                <SourceRow key={s.name} source={s} />
              ))}

              {status.scraping.sources.length > 6 && (
                <button
                  type="button"
                  onClick={() => setScrapingExpanded((v) => !v)}
                  className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {scrapingExpanded ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Réduire</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Voir toutes les {status.scraping.sources.length} sources</>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">Données de scraping non disponibles</p>
          )}

          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-slate-500">
            <span>Total : {status?.scraping.totalEntries.toLocaleString('fr-FR') ?? '—'} entrées</span>
          </div>
        </GlassCard>

        {/* ── GitHub Actions workflows ── */}
        <GlassCard className="p-5">
          <SectionHeader
            icon={<Zap className="w-5 h-5" />}
            title="Workflows GitHub Actions"
            subtitle="Dernières exécutions des jobs automatiques"
          />

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : status?.workflows.length ? (
            <div className="space-y-2">
              {status.workflows.map((run: WorkflowRun) => {
                const badge = workflowBadge(run);
                return (
                  <div
                    key={run.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={badge.color}>{badge.icon}</span>
                      <span className="text-sm text-slate-200 truncate">{run.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
                      <span className="text-xs text-slate-500">{fmtRelative(run.updatedAt)}</span>
                      <a
                        href={run.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-indigo-400 transition-colors"
                        aria-label={`Voir le workflow ${run.name} sur GitHub`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">
              Impossible de charger les workflows (dépôt privé ou API indisponible)
            </p>
          )}
        </GlassCard>

        {/* ── Modération citoyenne ── */}
        <GlassCard className="p-5">
          <SectionHeader
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Modération automatique"
            subtitle="Contributions citoyennes (prix, photos, signalements)"
          />

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'En attente', value: status?.moderation.pending ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Approuvées', value: status?.moderation.approved ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Rejetées', value: status?.moderation.rejected ?? 0, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl ${item.bg} p-3 text-center`}>
                <p className={`text-2xl font-bold ${item.color}`}>
                  {loading ? '…' : item.value}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-sm">
            <p className="text-slate-300 mb-1 font-medium">Règle de modération automatique :</p>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Score de confiance &gt; 80 → <span className="text-emerald-400">Publication automatique</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                Score 50–80 → <span className="text-yellow-400">Mise en attente</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Score &lt; 50 → <span className="text-red-400">Rejet automatique</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Vérifié {fmtRelative(status?.moderation.lastCheckedAt ?? null)}
          </p>
        </GlassCard>

        {/* ── Alertes prix + Lettre hebdo ── */}
        <div className="space-y-4">
          {/* Alertes */}
          <GlassCard className="p-5">
            <SectionHeader
              icon={<Bell className="w-5 h-5" />}
              title="Moteur d'alertes prix"
              subtitle="Notifications automatiques aux abonnés"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-purple-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {loading ? '…' : status?.alerts.triggeredLast24h ?? 0}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Alertes / 24h</p>
              </div>
              <div className="rounded-xl bg-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">
                  {loading ? '…' : status?.alerts.activeAlerts ?? 0}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Non traitées</p>
              </div>
            </div>

            {status?.alerts.lastTriggeredAt && (
              <p className="text-xs text-slate-500 mt-3">
                Dernière alerte : {fmtRelative(status.alerts.lastTriggeredAt)} ({fmtDateTime(status.alerts.lastTriggeredAt)})
              </p>
            )}
          </GlassCard>

          {/* Lettre hebdo */}
          <GlassCard className="p-5">
            <SectionHeader
              icon={<FileText className="w-5 h-5" />}
              title="Lettre hebdomadaire IA"
              subtitle="Générée automatiquement chaque lundi"
            />

            {loading ? (
              <div className="h-12 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  {status?.lettreHebdo.status === 'ok' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-300 font-medium">Publiée</span>
                      </div>
                      {status.lettreHebdo.lastWeekId && (
                        <p className="text-xs text-slate-400 mt-1">
                          Semaine : {status.lettreHebdo.lastWeekId}
                        </p>
                      )}
                      {status.lettreHebdo.lastGeneratedAt && (
                        <p className="text-xs text-slate-500">
                          {fmtRelative(status.lettreHebdo.lastGeneratedAt)}
                        </p>
                      )}
                    </>
                  ) : status?.lettreHebdo.status === 'missing' ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-orange-300">Aucune lettre trouvée</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Statut inconnu</span>
                    </div>
                  )}
                </div>

                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
                  Cron : lundi 7h UTC
                </span>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-600 pt-2">
        Données agrégées depuis scraping-health.json · GitHub Actions API (publique) · Firestore
        {liveEnabled && ` · Refresh auto toutes les ${REFRESH_INTERVAL_MS / 1000}s`}
      </div>
    </div>
  );
}
