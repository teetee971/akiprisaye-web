/**
 * MonitoringIAPage — Tableau de bord de surveillance IA temps réel
 *
 * Affiche en temps réel l'état de toute l'infrastructure :
 *   - Derniers résultats de surveillance (Firestore monitoring/_latest)
 *   - Sessions de scraping (Firestore scraping_sessions)
 *   - Chocs de prix détectés (Firestore price_shocks)
 *   - Score de santé global
 *   - Rapport IA en langage naturel
 *
 * Données chargées depuis Firestore toutes les 60 secondes (auto-refresh).
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Database,
  Globe, RefreshCw, Shield, Zap, TrendingUp, Cpu, Radio,
  FileText, ExternalLink,
} from 'lucide-react';
import { SEOHead } from '../components/ui/SEOHead';
import { db as firebaseDb } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  status: 'ok' | 'warn' | 'error';
  label: string;
  detail: string;
  score: number;
}

interface MonitoringReport {
  timestamp: string;
  globalScore: number;
  statusEmoji: string;
  checks: CheckResult[];
  aiAnalysis?: {
    status_global: string;
    rapport: string;
    action_prioritaire?: string;
    impact_utilisateur?: string;
  };
  summary: { ok: number; warn: number; error: number; total: number };
}

interface ScrapingSession {
  date: string;
  timestamp: string;
  counts: { fuel: number; food: number; bqp: number; services: number };
  shocksCount: number;
  status: string;
}

interface PriceShock {
  territory: string;
  type?: string;
  fuel?: string;
  pct?: number;
  pctVsPrevious?: number;
  direction: string;
  oldPrice?: number;
  newPrice?: number;
  severity?: string;
}

// ─── Score gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444';
  const label = score >= 90 ? 'Opérationnel' : score >= 70 ? 'Dégradé' : 'Critique';
  const emoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-lg">{emoji}</span>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Check row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: CheckResult }) {
  const icons = {
    ok: <CheckCircle size={16} className="text-green-400 shrink-0" />,
    warn: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />,
    error: <AlertTriangle size={16} className="text-red-400 shrink-0" />,
  };
  const bg = { ok: 'bg-green-900/10', warn: 'bg-yellow-900/10', error: 'bg-red-900/10' };

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${bg[check.status]}`}>
      {icons[check.status]}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white font-medium">{check.label}</span>
        <span className="text-xs text-gray-400 ml-2">{check.detail}</span>
      </div>
      <span className="text-xs font-mono text-gray-500 shrink-0">{check.score}/100</span>
    </div>
  );
}

// ─── Scraping card ────────────────────────────────────────────────────────────

function ScrapingCard({ session }: { session: ScrapingSession }) {
  const total = Object.values(session.counts).reduce((s, v) => s + v, 0);
  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          <span className="font-semibold text-white text-sm">{session.date}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'success' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
          {session.status === 'success' ? '✅ Succès' : '❌ Échec'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-300">⛽ Carburants: <span className="text-white font-medium">{session.counts.fuel}</span></div>
        <div className="text-gray-300">🥦 Alim.: <span className="text-white font-medium">{session.counts.food}</span></div>
        <div className="text-gray-300">📋 BQP: <span className="text-white font-medium">{session.counts.bqp}</span></div>
        <div className="text-gray-300">📡 Services: <span className="text-white font-medium">{session.counts.services}</span></div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
        <span className="text-gray-400">{total} entrées collectées</span>
        {session.shocksCount > 0 && (
          <span className="text-red-400 font-medium">🚨 {session.shocksCount} choc(s)</span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MonitoringIAPage() {
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [sessions, setSessions] = useState<ScrapingSession[]>([]);
  const [shocks, setShocks] = useState<PriceShock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const db = firebaseDb;
      if (!db) { setLoading(false); return; }

      const { collection, doc, getDoc, getDocs, query, orderBy, limit } = await import('firebase/firestore');

      // Load latest monitoring report
      const latestSnap = await getDoc(doc(db, 'monitoring', '_latest'));
      if (latestSnap.exists()) {
        setReport(latestSnap.data() as MonitoringReport);
      }

      // Load recent scraping sessions
      const sessionsSnap = await getDocs(
        query(collection(db, 'scraping_sessions'), orderBy('date', 'desc'), limit(5))
      );
      setSessions(sessionsSnap.docs.map((d) => d.data() as ScrapingSession));

      // Load recent price shocks
      const shocksSnap = await getDocs(
        query(collection(db, 'price_shocks_analysis'), orderBy('date', 'desc'), limit(1))
      );
      if (!shocksSnap.empty) {
        const data = shocksSnap.docs[0].data();
        setShocks((data.shocks ?? []).slice(0, 10));
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Erreur chargement monitoring:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(loadData, 60_000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadData]);

  // Group checks by category
  const categorized = report ? {
    '🌐 Disponibilité': report.checks.filter((c) => c.label.includes('Site') || c.label.includes('Pages')),
    '🚀 CI/CD': report.checks.filter((c) => c.label.includes('CI')),
    '🔥 Firestore': report.checks.filter((c) => c.label.includes('Lettre') || c.label.includes('Firestore') || c.label.includes('Prix') || c.label.includes('snapshot')),
    '📰 RSS': report.checks.filter((c) => c.label.includes('RSS') || c.label.includes('Flux')),
    '📦 Données': report.checks.filter((c) => c.label.includes('fuel') || c.label.includes('json') || c.label.includes('statique')),
    '🔒 Sécurité': report.checks.filter((c) => c.label.includes('Scanning') || c.label.includes('CodeQL')),
  } : {};

  return (
    <>
      <SEOHead
        title="Monitoring IA — Surveillance Globale | A KI PRI SA YÉ"
        description="Tableau de bord de l'IA de surveillance autonome du logiciel A KI PRI SA YÉ."
        canonicalPath="/monitoring-ia"
      />

      <div className="min-h-screen bg-slate-900 text-white pb-16">
        {/* Header */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/40 px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={20} className="text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium uppercase tracking-wider">IA de Surveillance</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">🤖 Monitoring Global</h1>
                <p className="text-gray-400 text-sm max-w-lg">
                  Surveillance autonome 24h/24 de l'intégralité du logiciel.
                  Mise à jour automatique toutes les heures par IA.
                </p>
              </div>
              {report && <ScoreGauge score={report.globalScore} />}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Actualiser
              </button>
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${autoRefresh ? 'bg-blue-900/40 text-blue-300 border border-blue-500/30' : 'bg-slate-700 text-gray-400'}`}
              >
                <Radio size={14} /> {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>
              {lastRefresh && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> {lastRefresh.toLocaleTimeString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">
          {loading && !report && (
            <div className="text-center py-16 text-gray-400">
              <Cpu size={40} className="mx-auto mb-3 animate-pulse text-blue-500" />
              <p>Chargement des données de surveillance…</p>
            </div>
          )}

          {!loading && !report && (
            <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
              <h2 className="text-lg font-bold text-white mb-2">Surveillance IA non encore initialisée</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
                Le premier rapport sera généré lors du prochain cycle (toutes les heures via GitHub Actions).
              </p>
              <a
                href="https://github.com/teetee971/akiprisaye-web/actions"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
              >
                <ExternalLink size={14} /> Voir les workflows GitHub Actions
              </a>
            </div>
          )}

          {report && (
            <>
              {/* AI Analysis */}
              {report.aiAnalysis && (
                <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-blue-400" />
                    <h2 className="font-bold text-white">Analyse IA — {report.aiAnalysis.status_global?.toUpperCase()}</h2>
                    <span className="text-xs text-gray-400 ml-auto">{report.timestamp?.slice(0, 16).replace('T', ' ')} UTC</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{report.aiAnalysis.rapport}</p>
                  {report.aiAnalysis.action_prioritaire && (
                    <div className="bg-slate-800/60 rounded-lg px-4 py-2 text-sm">
                      <span className="text-blue-400 font-medium">Action prioritaire : </span>
                      <span className="text-gray-300">{report.aiAnalysis.action_prioritaire}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Summary badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'OK', count: report.summary.ok, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/30' },
                  { label: 'Avertissements', count: report.summary.warn, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-500/30' },
                  { label: 'Erreurs', count: report.summary.error, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20 border-red-500/30' },
                ].map(({ label, count, icon: Icon, color, bg }) => (
                  <div key={label} className={`border rounded-xl p-4 text-center ${bg}`}>
                    <Icon size={20} className={`${color} mx-auto mb-1`} />
                    <div className={`text-2xl font-black ${color}`}>{count}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              {/* Checks by category */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(categorized).filter(([, checks]) => checks.length > 0).map(([cat, checks]) => (
                  <div key={cat} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Activity size={14} className="text-blue-400" /> {cat}
                    </h3>
                    <div className="space-y-1.5">
                      {checks.map((c, i) => <CheckRow key={i} check={c} />)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Scraping sessions */}
          {sessions.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Database size={18} className="text-blue-400" /> Sessions de scraping récentes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((s) => <ScrapingCard key={s.date} session={s} />)}
              </div>
            </div>
          )}

          {/* Price shocks */}
          {shocks.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-red-400" /> Derniers chocs de prix détectés
              </h2>
              <div className="space-y-2">
                {shocks.map((s, i) => {
                  const sev = s.severity ?? (Math.abs(s.pct ?? s.pctVsPrevious ?? 0) >= 20 ? 'grave' : 'modere');
                  const pct = s.pct ?? s.pctVsPrevious ?? 0;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/40 rounded-lg px-4 py-2.5">
                      <span className="text-lg">{sev === 'grave' ? '🔴' : sev === 'eleve' ? '🟠' : '🟡'}</span>
                      <span className="text-white font-medium text-sm flex-1">{s.territory} {s.fuel ?? s.type}</span>
                      <span className={`text-sm font-bold ${s.direction === 'hausse' ? 'text-red-400' : 'text-green-400'}`}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                      {s.oldPrice && s.newPrice && (
                        <span className="text-xs text-gray-400">{s.oldPrice}€ → {s.newPrice}€</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <Link to="../chocs-prix" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <TrendingUp size={14} /> Voir tous les chocs de prix
                </Link>
              </div>
            </div>
          )}

          {/* Automation overview */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-green-400" /> Automatisations actives
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🤖', name: 'Scraping multi-sources', freq: 'Quotidien 6h UTC', desc: 'Carburants, alim., BQP, services' },
                { icon: '⛽', name: 'Prix carburants officiels', freq: 'Quotidien 6h30 UTC', desc: 'prix-carburants.gouv.fr' },
                { icon: '🔍', name: 'Détection chocs de prix', freq: 'Quotidien 8h UTC', desc: 'Analyse z-score + GitHub Issues' },
                { icon: '☀️', name: 'Briefing journalier IA', freq: 'Quotidien 7h UTC', desc: 'RSS + GPT-4o-mini → Firestore' },
                { icon: '📰', name: 'Lettre hebdo IA', freq: 'Lundi 7h UTC', desc: 'Analyse + éditoriale GPT-4o-mini' },
                { icon: '📊', name: 'Snapshot observatoire', freq: 'Lundi 8h UTC', desc: 'Agrégation hebdo + analyse IA' },
                { icon: '🤖', name: 'Surveillance IA globale', freq: 'Toutes les heures', desc: 'Site, CI, Firestore, RSS, sécurité' },
                { icon: '🔒', name: 'Analyse sécurité CodeQL', freq: 'Hebdomadaire', desc: 'Vulnérabilités code automatiques' },
              ].map((a) => (
                <div key={a.name} className="flex items-start gap-3 bg-slate-900/40 rounded-lg p-3">
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-blue-400">{a.freq}</p>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a
                href="https://github.com/teetee971/akiprisaye-web/actions"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={14} /> Voir les workflows sur GitHub Actions
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="../statut" className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
              <Globe size={14} /> Statut plateforme
            </Link>
            <Link to="../chocs-prix" className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
              <TrendingUp size={14} /> Chocs de prix
            </Link>
            <Link to="../lettre-jour" className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
              <FileText size={14} /> Lettre du Jour
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
