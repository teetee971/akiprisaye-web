/**
 * EspaceCreateur.tsx - Version Ultra 3.1 STABLE
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Crown, Shield, Zap, Code2, Database, Users, BarChart3,
  Settings, Lock, CheckCircle, AlertCircle, Copy, ExternalLink, Radar,
  Terminal, BookOpen, Sparkles, Globe, Key, ChevronDown, ChevronUp,
  TrendingUp, Bell, Download, FileText, Wrench, RefreshCw,
  LogOut, Star, Building2, Smartphone, BrainCircuit, Activity, Clock3, Eye, MapPinned,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { getConversionStats, getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { useVisitorStats } from '../hooks/useVisitorStats';

const pulseStyle = `@keyframes pulse-radar { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.5; } }`;

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);

  // Wait for auth to resolve before checking role — avoids redirect during bootstrap
  if (loading) {
    return (
      <div data-testid="auth-loading-spinner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#020617' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(251,191,36,0.2)', borderTopColor: '#fbbf24', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // isCreator is true for both "creator" and "admin" roles (matches RequireCreator guard)
  if (!isCreator) {
    return <Navigate to="/" replace />;
  }

  const handleRefreshClaims = useCallback(async () => {
    setRefreshing(true);
    try { await refreshClaims(); } finally { setRefreshing(false); }
  }, [refreshClaims]);

  const creatorPlan = PLAN_DEFINITIONS['CREATOR'];
  const audienceLoading = userStatsLoading || visitorStatsLoading;

  const topTerritory = byTerritory[0];
  const topInterest = byInterest[0];
  const activeTerritoriesCount = byTerritory.length;
  const activeInterestCount = byInterest.length;
  const accountPresenceRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;
  const mostDormantTerritory = useMemo(() => {
    if (!byTerritory.length) return undefined;
    return [...byTerritory]
      .sort((a, b) => (b.totalVisits - b.online * 8) - (a.totalVisits - a.online * 8))[0];
  }, [byTerritory]);
  const detectedTerritory = byTerritory.find((territory) => territory.code.toLowerCase() === myTerritory.toLowerCase());
  const topTerritoryHistoricalInterest = topTerritory ? interestByTerritory[topTerritory.code]?.[0] : undefined;

  const dashboardInsights = useMemo<DashboardInsight[]>(() => {
    const focusInsight = classifyAudienceFocus(topInterest);
    return [
      {
        title: 'Territoire moteur',
        value: topTerritory ? `${topTerritory.flag} ${topTerritory.name}` : 'En attente',
        detail: topTerritory
          ? `${topTerritory.online} visiteur(s) en ligne · ${topTerritory.totalVisits.toLocaleString('fr-FR')} visites cumulées.`
          : 'Les remontées temps réel apparaîtront dès qu’un territoire deviendra actif.',
        tone: 'emerald',
      },
      {
        title: 'Sujet chaud',
        value: topInterest ? `${topInterest.emoji} ${topInterest.name}` : 'En attente',
        detail: topInterest
          ? `${topInterest.online} actif(s) maintenant · ${topInterest.totalViews.toLocaleString('fr-FR')} vues totales.`
          : 'Aucun centre d’intérêt ne ressort encore clairement.',
        tone: 'cyan',
      },
      focusInsight,
      {
        title: 'Territoire à relancer',
        value: mostDormantTerritory ? `${mostDormantTerritory.flag} ${mostDormantTerritory.name}` : 'À qualifier',
        detail: mostDormantTerritory
          ? `${mostDormantTerritory.totalVisits.toLocaleString('fr-FR')} visites historiques pour seulement ${mostDormantTerritory.online} personne(s) en direct.`
          : 'Il faut davantage d’historique pour isoler un territoire à réactiver.',
        tone: 'amber',
      },
    ];
  }, [mostDormantTerritory, topInterest, topTerritory]);

  const creatorBriefing = useMemo(() => {
    return buildCreatorBriefing({
      topTerritory,
      topInterest,
      topTerritoryHistoricalInterest,
    });
  }, [topInterest, topTerritory, topTerritoryHistoricalInterest]);

  const topInterestMax = useMemo(
    () => Math.max(...byInterest.map((interest) => interest.totalViews), 1),
    [byInterest],
  );

  const conversionStats = useMemo(() => getConversionStats(30), []);
  const dailyStats = useMemo(() => getDailyStats(7), []);
  const revenueStats = useMemo(() => {
    const weeklyRevenue = dailyStats.reduce((sum, day) => sum + day.estimatedRevenue, 0);
    const weeklyClicks = dailyStats.reduce((sum, day) => sum + day.clicks, 0);
    const revenueTrend = dailyStats.length >= 2
      ? dailyStats[dailyStats.length - 1].estimatedRevenue - dailyStats[0].estimatedRevenue
      : 0;

    return {
      weeklyRevenue,
      weeklyClicks,
      revenueTrend,
    };
  }, [dailyStats]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <style>{pulseStyle}</style>
      <Helmet><title>Espace Créateur | Ultra V3.1</title></Helmet>

      {/* Radar Predator Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/80 border border-fuchsia-500/30 px-3 py-1.5 rounded-full backdrop-blur-md">
        <div className="relative h-3 w-3">
          <div className="absolute inset-0 bg-fuchsia-500 rounded-full animate-ping opacity-75" />
          <div className="relative h-3 w-3 bg-fuchsia-400 rounded-full" />
        </div>
        <span className="text-[10px] font-bold text-fuchsia-100 tracking-widest uppercase">Predator Active</span>
      </div>

        {/* ── IA audience dashboard ─────────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-fuchsia-400" />
                Tableau de bord IA — audience & comportement
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Dates des dernières mises à jour, comptes connectés, audience live, territoires, centres d’intérêt et lecture IA du trafic.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-200">
              <Activity className="h-3.5 w-3.5" />
              {audienceLoading ? 'Synchronisation des signaux…' : `${totalOnline} visiteur(s) live · ${onlineUsers} compte(s) authentifié(s)`}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                icon: Users,
                label: 'Comptes enregistrés',
                value: totalUsers.toLocaleString('fr-FR'),
                detail: 'Base utilisateurs Firebase',
                tone: 'text-cyan-300',
              },
              {
                icon: Activity,
                label: 'Comptes connectés',
                value: onlineUsers.toLocaleString('fr-FR'),
                detail: `${accountPresenceRate}% de la base actuellement active`,
                tone: 'text-emerald-300',
              },
              {
                icon: Eye,
                label: 'Visiteurs live site',
                value: totalOnline.toLocaleString('fr-FR'),
                detail: 'Présence web observée sur 5 min',
                tone: 'text-fuchsia-300',
              },
              {
                icon: Globe,
                label: 'Territoires actifs',
                value: activeTerritoriesCount.toLocaleString('fr-FR'),
                detail: `${activeInterestCount} centres d’intérêt actuellement détectés`,
                tone: 'text-amber-300',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
                  <Icon className={`mb-3 h-5 w-5 ${item.tone}`} />
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className={`mt-1 text-2xl font-black ${item.tone}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Clock3,
                label: 'Dernier heartbeat visiteur',
                timestamp: lastPresenceAt,
                helper: 'Collection presence',
                iconClassName: 'text-cyan-300',
              },
              {
                icon: RefreshCw,
                label: 'Dernière visite comptée',
                timestamp: lastVisitAt,
                helper: 'Compteur visit_stats',
                iconClassName: 'text-emerald-300',
              },
              {
                icon: TrendingUp,
                label: 'Dernière vue de section',
                timestamp: lastInterestViewAt,
                helper: 'Compteur page_stats',
                iconClassName: 'text-amber-300',
              },
              {
                icon: Shield,
                label: 'Dernière présence authentifiée',
                timestamp: lastAuthenticatedSeenAt,
                helper: 'Collection user_presence',
                iconClassName: 'text-violet-300',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.helper}</p>
                    </div>
                    <Icon className={`h-5 w-5 ${item.iconClassName}`} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-200">{formatDateTime(item.timestamp)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatFreshness(item.timestamp)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/20 via-slate-900/80 to-slate-950 p-5">
            <div className="flex items-start gap-3">
              <BrainCircuit className="mt-0.5 h-5 w-5 text-fuchsia-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">Briefing IA créateur</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{creatorBriefing}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-1">
                    Mon territoire détecté : <strong className="text-white">{detectedTerritory ? `${detectedTerritory.flag} ${detectedTerritory.name}` : myTerritory.toUpperCase()}</strong>
                  </span>
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-1">
                    Intérêt local détecté : <strong className="text-white">{myInterest ? `${myInterest.emoji} ${myInterest.name}` : 'Accueil / non classé'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {dashboardInsights.map((insight) => (
              <div
                key={insight.title}
                className={`rounded-2xl border p-4 ${INSIGHT_TONE_STYLES[insight.tone]}`}
              >
                <p className="text-xs uppercase tracking-[0.18em] opacity-75">{insight.title}</p>
                <p className="mt-2 text-lg font-bold">{insight.value}</p>
                <p className="mt-2 text-sm opacity-85">{insight.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-blue-300" />
                Territoires et départements les plus actifs
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Vue combinée temps réel + historique. Idéal pour voir où se concentre l’attention et quel territoire décroche.
              </p>
              <div className="mt-4 space-y-3">
                {byTerritory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                    Aucun territoire actif pour le moment.
                  </div>
                ) : byTerritory.slice(0, 6).map((territory) => {
                  const historicLeader = interestByTerritory[territory.code]?.[0];
                  return (
                    <div key={territory.code} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {territory.flag} {territory.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {territory.code} · {territory.online} en direct · {territory.totalVisits.toLocaleString('fr-FR')} visites
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                            Live {territory.online}
                          </span>
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-200">
                            Historique {territory.totalVisits.toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Top intérêts live</p>
                          <p className="mt-2 text-sm text-slate-200">
                            {territory.topInterests.length > 0
                              ? territory.topInterests.slice(0, 3).map((interest) => `${interest.emoji} ${interest.name} (${interest.online})`).join(' · ')
                              : 'Aucun focus live dominant'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Lecture IA locale</p>
                          <p className="mt-2 text-sm text-slate-200">
                            {historicLeader
                              ? `${historicLeader.emoji} ${historicLeader.name} reste le meilleur aimant historique sur ce territoire.`
                              : 'Pas encore assez d’historique pour une recommandation locale.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-fuchsia-300" />
                Radar centres d’intérêt
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Où vont les utilisateurs maintenant, et quels thèmes gardent un poids historique.
              </p>
              <div className="mt-4 space-y-3">
                {byInterest.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                    Aucun centre d’intérêt détecté pour le moment.
                  </div>
                ) : byInterest.slice(0, 8).map((interest) => {
                  const width = Math.max(10, Math.round((interest.totalViews / topInterestMax) * 100));
                  return (
                    <div key={interest.key} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{interest.emoji} {interest.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{interest.description || 'Axe comportemental détecté par navigation.'}</p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p className="font-semibold text-emerald-300">{interest.online} live</p>
                          <p>{interest.totalViews.toLocaleString('fr-FR')} vues</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col">
        {/* ── Revenue CPC dashboard ─────────────────────────────────── */}
        <section className="mb-8 order-2 md:order-1">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white sm:mb-4 sm:text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Revenus CPC — suivi créateur
          </h2>
          <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenu 30 jours</p>
                    <p className="mt-1 text-xl font-black text-emerald-300 sm:text-2xl">
                      {conversionStats.estimatedRevenue.toFixed(2)} €
                    </p>
                    <p className="mt-1 text-xs text-slate-400">estimation locale (clic × prix moyen × taux)</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CTR global</p>
                    <p className="mt-1 text-xl font-black text-cyan-300 sm:text-2xl">
                      {(conversionStats.clickThroughRate * 100).toFixed(2)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {conversionStats.totalClicks.toLocaleString('fr-FR')} clic(s) / {conversionStats.totalViews.toLocaleString('fr-FR')} vue(s)
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenu 7 jours</p>
                    <p className="mt-1 text-xl font-black text-amber-300 sm:text-2xl">
                      {revenueStats.weeklyRevenue.toFixed(2)} €
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{revenueStats.weeklyClicks.toLocaleString('fr-FR')} clic(s) sur la semaine</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tendance 7 jours</p>
                    <p className={`mt-1 text-xl font-black sm:text-2xl ${revenueStats.revenueTrend >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {revenueStats.revenueTrend >= 0 ? '+' : ''}
                      {revenueStats.revenueTrend.toFixed(2)} €
                    </p>
                    <p className="mt-1 text-xs text-slate-400">dernier jour vs premier jour (fenêtre 7j)</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 sm:p-5">
                    <h3 className="text-base font-bold text-white">Top produits convertisseurs</h3>
                    <p className="mt-1 text-xs text-slate-400">Produits avec le plus de clics et revenu estimé (30 jours)</p>
                    <div className="mt-4 space-y-3">
                      {conversionStats.topProducts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                          Pas encore de données de clic CPC sur la période.
                        </div>
                      ) : conversionStats.topProducts.slice(0, 5).map((product) => (
                        <div key={`${product.barcode}-${product.name}`} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{product.name}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {product.clicks} clic(s) · CTR {(product.ctr * 100).toFixed(2)}%
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-300">{product.estimatedRevenue.toFixed(2)} €</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 sm:p-5">
                    <h3 className="text-base font-bold text-white">Top enseignes CPC</h3>
                    <p className="mt-1 text-xs text-slate-400">Enseignes les plus cliquées avec panier moyen observé (30 jours)</p>
                    <div className="mt-4 space-y-3">
                      {conversionStats.topRetailers.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/40 p-4 text-sm text-slate-500">
                          Aucun clic enseigne enregistré sur la période.
                        </div>
                      ) : conversionStats.topRetailers.slice(0, 5).map((retailer) => (
                        <div key={retailer.retailer} className="rounded-xl border border-slate-700/40 bg-slate-950/40 p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{retailer.retailer}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {retailer.clicks} clic(s) · panier moyen {retailer.avgPrice.toFixed(2)} €
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-300">{retailer.estimatedRevenue.toFixed(2)} €</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────── */}
        <section className="mb-8 order-3">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Accès & fonctionnalités — Plan CREATOR
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CREATOR_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <Icon className={`w-4 h-4 mb-2 ${f.color}`} />
                  <p className="text-xs text-slate-400 leading-tight">{f.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${f.color}`}>{f.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Admin shortcuts ───────────────────────────────────────── */}
        <section className="mb-8 order-1 md:order-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white sm:mb-4 sm:text-lg">
            <Shield className="w-5 h-5 text-blue-400" />
            Outils d'administration
          </h2>
          <div className="mb-3 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3.5 sm:mb-4 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {(userRole === 'admin' || userRole === 'creator')
                    ? 'Votre rôle créateur/admin ouvre tous les modules ci-dessous.'
                    : 'Ces modules système nécessitent un compte créateur ou admin.'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {(userRole === 'admin' || userRole === 'creator')
                    ? 'Chaque pavé ouvre directement le bon écran d’administration.'
                    : 'Une fois le rôle créateur/admin actif, utilisez “Actualiser le rôle” puis ouvrez les modules ci-dessous.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  (userRole === 'admin' || userRole === 'creator')
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}>
                  {(userRole === 'admin' || userRole === 'creator') ? 'Accès actif' : 'Créateur/Admin requis'}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshClaims}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Actualisation…' : 'Actualiser le rôle'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {ADMIN_LINKS.map(l => {
              const Icon = l.icon;
              // NOTE: `requiresAdmin` in ADMIN_LINKS really means "internal-only"
              // (accessible to both `admin` and `creator` roles), not strictly admin-only.
              const requiresInternalAccess = l.requiresAdmin;
              const isLocked = requiresInternalAccess && userRole !== 'admin' && userRole !== 'creator';
              const cardClassName = `flex w-full items-center gap-2.5 rounded-xl border p-3 text-left transition-all group sm:gap-3 sm:p-4 ${
                isLocked
                  ? 'bg-slate-800/40 border-slate-700/40 hover:border-amber-500/40 hover:bg-amber-950/20'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-500/60'
              }`;

              const content = (
                <>
                  <div className="p-2 bg-slate-700/50 rounded-lg flex-shrink-0">
                    <Icon className={`w-4 h-4 ${l.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{l.label}</p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        isLocked
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {isLocked ? 'Admin requis' : 'Ouvrir'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">{l.description}</p>
                  </div>
                  <ExternalLink className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isLocked ? 'text-amber-300/80' : 'text-slate-500 group-hover:text-white'
                  }`} />
                </>
              );

              if (isLocked) {
                return (
                  <button
                    key={l.to}
                    type="button"
                    onClick={() => setSelectedAdminLink(l)}
                    className={cardClassName}
                    aria-pressed={selectedAdminLink?.to === l.to}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cardClassName}
                >
                  {content}
                </Link>
              );
            })}
          </div>
          {userRole !== 'admin' && userRole !== 'creator' && selectedAdminLink && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900/80 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                    Accès protégé
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {selectedAdminLink.label}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {selectedAdminLink.description}. Ce module pointe bien vers <code className="rounded bg-slate-950/70 px-1.5 py-0.5 text-xs text-amber-200">{selectedAdminLink.to}</code>, mais la route est volontairement réservée au rôle <strong>admin</strong>.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-400">
                    <li>• Rôle actuel : <span className="font-semibold text-amber-200">{userRole}</span></li>
                    <li>• Action recommandée : promouvoir le compte en <span className="font-semibold text-emerald-300">admin</span> via GitHub Actions ou script local.</li>
                    <li>• Ensuite : revenir ici puis cliquer sur <span className="font-semibold text-cyan-300">Actualiser le rôle</span>.</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={selectedAdminLink.helpHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
                  >
                    GitHub Actions
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    to="/activation-createur"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
                  >
                    Guide d’activation
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
        </div>

        {/* ── Quick navigation ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            Navigation rapide — Pages clés
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { label: '💧 Enquête Eau',           to: '/enquete-eau' },
              { label: '🎓 Conférence Eau',        to: '/conference-eau' },
              { label: '💰 Tarifs & Abonnements',  to: '/pricing' },
              { label: '🏪 Petits commerces',      to: '/petits-commerces' },
              { label: '🌾 Producteurs locaux',    to: '/producteurs-locaux' },
              { label: '📍 Marchés locaux',        to: '/marches-locaux' },
              { label: '🗺️ Feuille de route',      to: '/roadmap' },
              { label: '📊 Observatoire',          to: '/observatoire' },
              { label: '🔬 Comparateur citoyen',   to: '/comparateur' },
              { label: '📱 Éval. Magasins',        to: '/evaluation-magasins' },
              { label: '📣 Commerce social',       to: '/commerce-social' },
              { label: '⚙️ Portail Développeurs',  to: '/portail-developpeurs' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs bg-slate-800/40 border border-slate-700/40 hover:border-green-500/40 hover:bg-green-900/20 rounded-lg px-3 py-2.5 text-slate-300 hover:text-green-300 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Setup guide (collapsible) ─────────────────────────────── */}
        <section className="mb-6">
          <button
            onClick={() => setGuideOpen(o => !o)}
            className="w-full flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white">
                {isCreator ? '✅ Guide d\'activation (déjà effectué)' : '🔧 Guide d\'activation du rôle Créateur'}
              </span>
              {!isCreator && (
                <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-semibold">
                  Action requise
                </span>
              )}
            </div>
            {guideOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {guideOpen && (
            <div className="mt-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 space-y-5">
              {SETUP_STEPS.map(step => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                    {step.code && (
                      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2">
                        <code className="text-xs text-green-300 font-mono break-all">{step.code}</code>
                        <CopyButton text={step.code} />
                      </div>
                    )}
                    {step.link && (
                      step.link.href.startsWith('http')
                        ? <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                            {step.link.label} <ExternalLink className="inline w-3 h-3" />
                          </a>
                        : <Link to={step.link.href} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                            {step.link.label}
                          </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Mobile guide: Termux + GitHub Actions (collapsible) ──── */}
        <section className="mb-6">
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="w-full flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-green-400" />
              <span className="font-bold text-white">📱 Depuis Android — Termux ou GitHub Actions</span>
              <span className="text-xs bg-green-500/20 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
                Sans PC
              </span>
            </div>
            {mobileOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {mobileOpen && (
            <div className="mt-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 space-y-6">

              {/* Termux */}
              <div>
                <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Option A — Termux (terminal Android)
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Vous avez Termux ? C'est la méthode la plus directe. Le fichier{' '}
                  <code className="bg-slate-700/60 px-1 py-0.5 rounded text-green-300">serviceAccountKey.json</code>{' '}
                  téléchargé depuis Firebase Console est déjà dans <code className="bg-slate-700/60 px-1 py-0.5 rounded text-green-300">~/downloads</code>.
                </p>

                {/* Fast-path box for users already in ~/downloads */}
                <div className="mb-4 bg-green-950/40 border border-green-600/40 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-300 mb-2">
                    ⚡ Déjà dans ~/downloads ? Seulement 3 commandes :
                  </p>
                  {[
                    { cmd: 'node --version 2>/dev/null || pkg install nodejs', note: '— vérifie ou installe Node' },
                    { cmd: 'curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/copilot/add-expert-conference-on-water/scripts/set-creator-role.mjs -o set-creator-role.mjs', note: '— télécharge le script' },
                    { cmd: 'npm install firebase-admin && node set-creator-role.mjs teetee971@gmail.com', note: '— installe et active' },
                  ].map(({ cmd, note }) => (
                    <div key={cmd} className="flex items-center justify-between bg-slate-950/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 mb-1.5 last:mb-0">
                      <div className="min-w-0 flex-1">
                        <code className="text-xs text-green-300 font-mono break-all">{cmd}</code>
                        <span className="text-xs text-slate-500 ml-1">{note}</span>
                      </div>
                      <CopyButton text={cmd} />
                    </div>
                  ))}
                  <p className="text-xs text-amber-400/80 mt-2">
                    ⚠️ Si vous voyez <code className="bg-slate-700/60 px-1 rounded">Abort.</code> lors de l'installation de nodejs, relancez simplement <code className="bg-slate-700/60 px-1 rounded">pkg install nodejs</code> une seconde fois.
                  </p>
                </div>
                <div className="space-y-4">
                  {TERMUX_STEPS.map(step => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 font-bold text-sm">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                        {step.code && (
                          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2">
                            <code className="text-xs text-green-300 font-mono break-all">{step.code}</code>
                            <CopyButton text={step.code} />
                          </div>
                        )}
                        {step.link && (
                          step.link.href.startsWith('http')
                            ? <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label} <ExternalLink className="inline w-3 h-3" />
                              </a>
                            : <Link to={step.link.href} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label}
                              </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-700/40" />

              {/* GitHub Actions */}
              <div>
                <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Option B — GitHub Actions (sans aucun terminal)
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Pas de Termux ? Stockez le contenu de la clé comme{' '}
                  <strong className="text-white">secret GitHub</strong>, puis déclenchez le
                  workflow depuis l'onglet Actions — 100 % depuis votre navigateur mobile.
                </p>
                <div className="space-y-4">
                  {ACTIONS_STEPS.map(step => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                        {step.code && (
                          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/50 rounded-lg px-3 py-2">
                            <code className="text-xs text-green-300 font-mono break-all">{step.code}</code>
                            <CopyButton text={step.code} />
                          </div>
                        )}
                        {step.link && (
                          step.link.href.startsWith('http')
                            ? <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label} <ExternalLink className="inline w-3 h-3" />
                              </a>
                            : <Link to={step.link.href} className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                                {step.link.label}
                              </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </section>

        {/* ── Dev override tip (collapsible) ───────────────────────── */}
        <section className="mb-6">
          <button
            onClick={() => setEnvOpen(o => !o)}
            className="w-full flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-violet-400" />
              <span className="font-bold text-white">🛠️ Développement — Simuler n'importe quel plan</span>
            </div>
            {envOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {envOpen && (
            <div className="mt-2 bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-3">
                En développement local, vous pouvez simuler n'importe quel plan sans Firestore via une variable d'environnement dans <code className="text-xs bg-slate-700/60 px-1 py-0.5 rounded text-violet-300">frontend/.env.local</code> :
              </p>
              <div className="flex items-start justify-between bg-slate-950/80 border border-slate-700/50 rounded-xl p-4">
                <pre className="text-xs text-green-300 font-mono leading-relaxed whitespace-pre overflow-x-auto flex-1">
                  {ENV_OVERRIDE_TIP}
                </pre>
                <CopyButton text={ENV_OVERRIDE_TIP} />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                ⚠️ Ne commitez jamais le fichier <code>.env.local</code> — il est déjà dans <code>.gitignore</code>.
              </p>
            </div>
        </section>
      </div>
    </div>
  );
};

export default EspaceCreateur;
