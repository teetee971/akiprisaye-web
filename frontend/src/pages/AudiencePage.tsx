/**
 * AudiencePage — Podium des territoires et centres d'intérêt en temps réel
 *
 * Affiche :
 *   • Nombre de visiteurs en ligne maintenant (mise à jour Firestore temps réel)
 *   • Podium 🥇🥈🥉 des 3 premiers territoires
 *   • Classement complet de tous les territoires
 *   • Podium 🥇🥈🥉 des 3 centres d'intérêt les plus consultés
 *   • Classement complet des centres d'intérêt
 *
 * Détection territoire : fuseau horaire IANA → code territoire
 * Détection intérêt   : pathname → catégorie sémantique
 */

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, Globe, RefreshCw, MapPin, TrendingUp, BarChart3 } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { useVisitorStats, type TerritoryStats, type InterestStats } from '../hooks/useVisitorStats';

// ── Medal styles ──────────────────────────────────────────────────────────────

const MEDAL = [
  { emoji: '🥇', ring: 'ring-yellow-400/60', bg: 'bg-yellow-400/10', text: 'text-yellow-300', label: '1er',  size: 'text-5xl' },
  { emoji: '🥈', ring: 'ring-slate-400/60',  bg: 'bg-slate-400/10',  text: 'text-slate-300',  label: '2ème', size: 'text-4xl' },
  { emoji: '🥉', ring: 'ring-amber-700/60',  bg: 'bg-amber-700/10',  text: 'text-amber-400',  label: '3ème', size: 'text-4xl' },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function PulseDot({ size = 'w-2.5 h-2.5' }: { size?: string }) {
  return (
    <span className="relative flex shrink-0" aria-hidden="true">
      <span className={`animate-ping absolute inline-flex ${size} rounded-full bg-emerald-400 opacity-75`} />
      <span className={`relative inline-flex rounded-full ${size} bg-emerald-500`} />
    </span>
  );
}

// ── Territory podium card ─────────────────────────────────────────────────────

function TerritoryPodiumCard({
  rank,
  territory,
  isMe,
}: {
  rank: number;
  territory: TerritoryStats;
  isMe: boolean;
}) {
  const medal = MEDAL[rank] ?? MEDAL[2];
  const isFirst = rank === 0;

  return (
    <div
      className={`flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border ${medal.bg} ${medal.ring} ring-1
        ${isFirst ? 'scale-105 shadow-lg shadow-yellow-900/20' : ''}
        ${isMe ? 'ring-2 ring-blue-500/60' : ''} transition-all`}
    >
      <span className={medal.size}>{medal.emoji}</span>
      <span className="text-3xl">{territory.flag}</span>
      <div className="text-center">
        <p className={`font-bold ${medal.text} text-sm`}>{medal.label}</p>
        <p className="text-white font-semibold text-sm mt-0.5">{territory.name}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {territory.online > 0 && <PulseDot size="w-2 h-2" />}
        <span className="text-emerald-300 font-bold tabular-nums">{territory.online}</span>
        <span className="text-slate-500 text-xs">en ligne</span>
      </div>
      {territory.totalVisits > 0 && (
        <p className="text-xs text-slate-500 tabular-nums">
          {territory.totalVisits.toLocaleString('fr-FR')} visites
        </p>
      )}
      {isMe && (
        <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-600/40">
          Vous êtes ici
        </span>
      )}
    </div>
  );
}

// ── Interest podium card ──────────────────────────────────────────────────────

function InterestPodiumCard({
  rank,
  interest,
  isMe,
}: {
  rank: number;
  interest: InterestStats;
  isMe: boolean;
}) {
  const medal = MEDAL[rank] ?? MEDAL[2];
  const isFirst = rank === 0;

  return (
    <div
      className={`flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border ${medal.bg} ${medal.ring} ring-1
        ${isFirst ? 'scale-105 shadow-lg shadow-yellow-900/20' : ''}
        ${isMe ? 'ring-2 ring-purple-500/60' : ''} transition-all`}
    >
      <span className={medal.size}>{medal.emoji}</span>
      <span className="text-3xl">{interest.emoji}</span>
      <div className="text-center">
        <p className={`font-bold ${medal.text} text-sm`}>{medal.label}</p>
        <p className="text-white font-semibold text-sm mt-0.5 leading-tight">{interest.name}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {interest.online > 0 && <PulseDot size="w-2 h-2" />}
        <span className="text-emerald-300 font-bold tabular-nums">{interest.online}</span>
        <span className="text-slate-500 text-xs">en ligne</span>
      </div>
      {interest.totalViews > 0 && (
        <p className="text-xs text-slate-500 tabular-nums">
          {interest.totalViews.toLocaleString('fr-FR')} vues
        </p>
      )}
      {isMe && (
        <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-600/40">
          Votre section
        </span>
      )}
    </div>
  );
}

// ── Territory rank row ────────────────────────────────────────────────────────

function TerritoryRankRow({
  rank,
  territory,
  isMe,
  maxOnline,
}: {
  rank: number;
  territory: TerritoryStats;
  isMe: boolean;
  maxOnline: number;
}) {
  const pct = maxOnline > 0 ? Math.round((territory.online / maxOnline) * 100) : 0;
  const medal = rank < 3 ? MEDAL[rank].emoji : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
        ${isMe ? 'bg-blue-900/20 border border-blue-700/40' : 'hover:bg-slate-800/60'}`}
    >
      <span className="w-7 text-center shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-slate-500 text-sm font-mono">{rank + 1}</span>
        )}
      </span>
      <span className="text-xl shrink-0">{territory.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-sm font-medium truncate">
          {territory.name}
          {isMe && <span className="ml-1.5 text-xs text-blue-400">(vous)</span>}
        </p>
        {maxOnline > 0 && (
          <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500/70 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {territory.online > 0 ? (
          <>
            <PulseDot size="w-2 h-2" />
            <span className="text-emerald-300 font-bold text-sm tabular-nums">{territory.online}</span>
          </>
        ) : (
          <span className="text-slate-600 text-sm">—</span>
        )}
      </div>
      <div className="w-20 text-right shrink-0">
        <span className="text-slate-400 text-xs tabular-nums">
          {territory.totalVisits > 0 ? territory.totalVisits.toLocaleString('fr-FR') : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Interest rank row ─────────────────────────────────────────────────────────

function InterestRankRow({
  rank,
  interest,
  isMe,
  maxOnline,
}: {
  rank: number;
  interest: InterestStats;
  isMe: boolean;
  maxOnline: number;
}) {
  const pct = maxOnline > 0 ? Math.round((interest.online / maxOnline) * 100) : 0;
  const medal = rank < 3 ? MEDAL[rank].emoji : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
        ${isMe ? 'bg-purple-900/20 border border-purple-700/40' : 'hover:bg-slate-800/60'}`}
    >
      <span className="w-7 text-center shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-slate-500 text-sm font-mono">{rank + 1}</span>
        )}
      </span>
      <span className="text-xl shrink-0">{interest.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-sm font-medium truncate">
          {interest.name}
          {isMe && <span className="ml-1.5 text-xs text-purple-400">(vous)</span>}
        </p>
        {interest.description && (
          <p className="text-xs text-slate-500 truncate">{interest.description}</p>
        )}
        {maxOnline > 0 && (
          <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500/70 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {interest.online > 0 ? (
          <>
            <PulseDot size="w-2 h-2" />
            <span className="text-emerald-300 font-bold text-sm tabular-nums">{interest.online}</span>
          </>
        ) : (
          <span className="text-slate-600 text-sm">—</span>
        )}
      </div>
      <div className="w-20 text-right shrink-0">
        <span className="text-slate-400 text-xs tabular-nums">
          {interest.totalViews > 0 ? interest.totalViews.toLocaleString('fr-FR') : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AudiencePage() {
  const { totalOnline, byTerritory, byInterest, loading, myTerritory, myInterest } = useVisitorStats();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading) setLastUpdated(new Date());
  }, [totalOnline, byTerritory.length, byInterest.length, loading]);

  const territoryPodium = byTerritory.slice(0, 3);
  const territoryRest   = byTerritory.slice(3);
  const maxTerritoryOnline = byTerritory[0]?.online ?? 0;

  const interestPodium = byInterest.slice(0, 3);
  const interestRest   = byInterest.slice(3);
  const maxInterestOnline = byInterest[0]?.online ?? 0;

  const timeStr = lastUpdated.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const hasTerritoriesData = !loading && byTerritory.length > 0;
  const hasInterestData    = !loading && byInterest.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Audience en direct — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Podium des territoires ultramarins et des centres d'intérêt en temps réel sur A KI PRI SA YÉ. Rapport audience citoyenne."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/audience" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/audience" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/audience" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ── Hero ── */}
        <HeroImage
          src={PAGE_HERO_IMAGES.audience}
          alt="Audience en direct — territoires ultramarins"
          gradient="from-slate-950 to-indigo-950"
          height="h-40 sm:h-52"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300 font-semibold">
            Rapport audience
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
            🗺️ Audience en direct
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Territoires connectés & centres d'intérêt en temps réel
          </p>
        </HeroImage>

        {/* ── Live summary bar ── */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <PulseDot />
            {loading ? (
              <span className="text-slate-400 text-sm animate-pulse">Connexion en cours…</span>
            ) : (
              <>
                <span className="text-emerald-300 font-bold text-2xl tabular-nums">{totalOnline}</span>
                <span className="text-slate-400 text-sm">
                  {totalOnline === 1 ? 'visiteur en ligne' : 'visiteurs en ligne'} maintenant
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
            <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '3s' }} />
            <span>Mis à jour à {timeStr}</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1 — Podium des territoires
        ══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="section-territories">
          <h2 id="section-territories" className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Globe size={18} className="text-indigo-400" />
            Podium des territoires connectés
          </h2>

          {/* Podium */}
          {hasTerritoriesData && territoryPodium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end mb-6">
              {territoryPodium[1] ? (
                <TerritoryPodiumCard rank={1} territory={territoryPodium[1]} isMe={territoryPodium[1].code === myTerritory} />
              ) : <div />}
              <TerritoryPodiumCard rank={0} territory={territoryPodium[0]} isMe={territoryPodium[0].code === myTerritory} />
              {territoryPodium[2] ? (
                <TerritoryPodiumCard rank={2} territory={territoryPodium[2]} isMe={territoryPodium[2].code === myTerritory} />
              ) : <div />}
            </div>
          )}

          {/* Full ranking */}
          {hasTerritoriesData && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">Classement complet</p>
                <div className="flex gap-4 text-xs text-slate-600 pr-1">
                  <span className="w-16 text-center">En ligne</span>
                  <span className="w-20 text-right">Visites</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/50 overflow-hidden">
                {byTerritory.map((t, i) => (
                  <TerritoryRankRow
                    key={t.code}
                    rank={i}
                    territory={t}
                    isMe={t.code === myTerritory}
                    maxOnline={maxTerritoryOnline}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && byTerritory.length === 0 && (
            <EmptyState icon={<Globe size={36} />} message="Aucun territoire actif pour le moment." />
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — Podium des centres d'intérêt
        ══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="section-interests">
          <h2 id="section-interests" className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-400" />
            Podium des centres d'intérêt
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Quelles sections consultent les visiteurs en ce moment ?
          </p>

          {/* Podium */}
          {hasInterestData && interestPodium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end mb-6">
              {interestPodium[1] ? (
                <InterestPodiumCard rank={1} interest={interestPodium[1]} isMe={interestPodium[1].key === myInterest?.key} />
              ) : <div />}
              <InterestPodiumCard rank={0} interest={interestPodium[0]} isMe={interestPodium[0].key === myInterest?.key} />
              {interestPodium[2] ? (
                <InterestPodiumCard rank={2} interest={interestPodium[2]} isMe={interestPodium[2].key === myInterest?.key} />
              ) : <div />}
            </div>
          )}

          {/* Full ranking */}
          {hasInterestData && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">Classement complet</p>
                <div className="flex gap-4 text-xs text-slate-600 pr-1">
                  <span className="w-16 text-center">En ligne</span>
                  <span className="w-20 text-right">Vues</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/50 overflow-hidden">
                {byInterest.map((interest, i) => (
                  <InterestRankRow
                    key={interest.key}
                    rank={i}
                    interest={interest}
                    isMe={interest.key === myInterest?.key}
                    maxOnline={maxInterestOnline}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && byInterest.length === 0 && (
            <EmptyState icon={<BarChart3 size={36} />} message="Les intérêts apparaîtront dès que des visiteurs naviguent." />
          )}
        </section>

        {/* ── Loading state ── */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center gap-4 text-slate-400">
              <RefreshCw size={28} className="animate-spin text-indigo-400" />
              <p className="text-sm">Connexion aux données en temps réel…</p>
            </div>
          </div>
        )}

        {/* ── Info / methodology note ── */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-sm text-slate-400 space-y-3">
          <h3 className="text-slate-300 font-semibold flex items-center gap-2">
            <MapPin size={15} className="text-indigo-400" />
            Comment fonctionnent ces données ?
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-slate-300 font-medium text-xs uppercase tracking-wider">🗺️ Territoire</p>
              <p>
                Détecté via le <strong className="text-slate-300">fuseau horaire</strong> du navigateur
                (API <code className="font-mono text-xs bg-slate-800 px-1 rounded">Intl.DateTimeFormat</code>).
                Aucune géolocalisation ni cookie tiers.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 font-medium text-xs uppercase tracking-wider">📊 Centres d'intérêt</p>
              <p>
                Basé sur la <strong className="text-slate-300">section visitée</strong> (URL).
                Données anonymes — aucun identifiant personnel collecté.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 font-medium text-xs uppercase tracking-wider">🟢 En ligne</p>
              <p>
                Visiteurs actifs dans les <strong className="text-slate-300">5 dernières minutes</strong>.
                Mise à jour automatique toutes les 30 secondes.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 font-medium text-xs uppercase tracking-wider">📈 Total vues</p>
              <p>
                Compteur cumulatif de sessions uniques par section depuis l'activation du suivi.
              </p>
            </div>
          </div>
          {myTerritory !== 'other' && myTerritory !== '_other' && (
            <p className="text-indigo-300 border-t border-slate-800 pt-3">
              Votre territoire détecté : <strong>{myTerritory.toUpperCase()}</strong>
              {myInterest && (
                <> · Section actuelle : <strong>{myInterest.emoji} {myInterest.name}</strong></>
              )}
            </p>
          )}
          <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
            Ces statistiques sont visibles publiquement dans un esprit de transparence citoyenne.{' '}
            <Link to="/transparence" className="hover:text-slate-400 underline">En savoir plus →</Link>
          </p>
        </section>

      </div>
    </div>
  );
}

// ── Empty state helper ────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12 text-slate-600">
      <div className="flex justify-center mb-3 opacity-30">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

