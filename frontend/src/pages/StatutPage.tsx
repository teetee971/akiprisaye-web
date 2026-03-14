/**
 * StatutPage — Horloges des territoires ultramarins + Statut du déploiement en direct
 *
 * Sections :
 *   1. 🕐 Horloges — heure locale en direct pour chaque territoire DOM-TOM
 *   2. 🚀 Déploiement — statut CI/CD GitHub Actions en temps réel (badges + build info)
 */

import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Clock, GitBranch, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { TERRITORIES } from '../constants/territories';

// ── Build-time metadata ───────────────────────────────────────────────────────

const BUILD_SHA: string  = import.meta.env.VITE_BUILD_SHA  ?? 'dev';
const BUILD_DATE: string = import.meta.env.VITE_BUILD_DATE ?? '';
const BUILD_ENV: string  = import.meta.env.VITE_BUILD_ENV  ?? 'development';

// ── Deployment workflows ──────────────────────────────────────────────────────

const WORKFLOWS = [
  {
    key: 'pages',
    name: 'GitHub Pages',
    emoji: '🌐',
    url: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/deploy-pages.yml',
    badge: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/deploy-pages.yml/badge.svg',
    site: 'https://teetee971.github.io/akiprisaye-web/',
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare Pages',
    emoji: '🔶',
    url: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/deploy-cloudflare-pages.yml',
    badge: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/deploy-cloudflare-pages.yml/badge.svg',
    site: 'https://akiprisaye-web.pages.dev/',
  },
  {
    key: 'ci',
    name: 'Intégration continue (CI)',
    emoji: '⚙️',
    url: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/ci.yml',
    badge: 'https://github.com/teetee971/akiprisaye-web/actions/workflows/ci.yml/badge.svg',
    site: null,
  },
];

// ── Territory display order ───────────────────────────────────────────────────

// DROM first, then COM, then France métro — exclude TAAF (no population clock interest)
const DISPLAY_ORDER: string[] = [
  'gp', 'mq', 'gf', 're', 'yt',       // DROM (Antilles → Océan Indien)
  'pf', 'nc', 'wf', 'mf', 'bl', 'pm', // COM (Pacifique → Atlantique)
  'fr',                                  // France métropolitaine (référence)
];

// ── Time helpers ──────────────────────────────────────────────────────────────

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString('fr-FR', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date, tz: string): string {
  return date.toLocaleDateString('fr-FR', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getUtcOffset(date: Date, tz: string): string {
  // Use Intl to derive the numeric UTC offset
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: tz,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date);
  const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  return offset;
}

function getHour(date: Date, tz: string): number {
  const h = parseInt(
    date.toLocaleTimeString('fr-FR', { timeZone: tz, hour: '2-digit', hour12: false }),
    10,
  );
  return isNaN(h) ? 12 : h;
}

function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 20;
}

// ── Territory Clock Card ──────────────────────────────────────────────────────

function TerritoryClockCard({
  code,
  now,
  isMe,
}: {
  code: string;
  now: Date;
  isMe: boolean;
}) {
  const territory = TERRITORIES[code as keyof typeof TERRITORIES];
  if (!territory) return null;

  const tz = territory.timezone;
  const timeStr = formatTime(now, tz);
  const dateStr = formatDate(now, tz);
  const offset  = getUtcOffset(now, tz);
  const hour    = getHour(now, tz);
  const day     = isDaytime(hour);

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-2xl border p-4 transition-all
        ${isMe
          ? 'border-blue-500/60 bg-blue-900/10 ring-1 ring-blue-500/30'
          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
        }
        ${day ? '' : 'opacity-90'}`}
    >
      {/* Day/Night indicator */}
      <span className="absolute top-3 right-3 text-lg" aria-hidden="true">
        {day ? '☀️' : '🌙'}
      </span>

      {/* Flag + name */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{territory.flag}</span>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{territory.name}</p>
          <p className="text-slate-500 text-xs">{offset}</p>
        </div>
      </div>

      {/* Time — large display */}
      <p
        className={`font-mono font-bold tabular-nums tracking-tight leading-none
          ${day ? 'text-white' : 'text-slate-300'}
          ${isMe ? 'text-2xl' : 'text-xl'}`}
        aria-label={`Heure en ${territory.name}`}
      >
        {timeStr}
      </p>

      {/* Date */}
      <p className="text-xs text-slate-500 capitalize">{dateStr}</p>

      {isMe && (
        <span className="self-start text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-600/40">
          Votre territoire
        </span>
      )}
    </div>
  );
}

// ── Deployment card ───────────────────────────────────────────────────────────

function DeploymentCard({
  workflow,
}: {
  workflow: typeof WORKFLOWS[number];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{workflow.emoji}</span>
          <p className="text-white font-semibold text-sm">{workflow.name}</p>
        </div>
        <a
          href={workflow.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={`Voir le workflow ${workflow.name} sur GitHub`}
        >
          <ExternalLink size={12} />
          GitHub
        </a>
      </div>

      {/* Live badge — always up to date from GitHub */}
      <a href={workflow.url} target="_blank" rel="noreferrer" className="self-start">
        <img
          src={workflow.badge}
          alt={`Statut ${workflow.name}`}
          className="h-5 rounded"
          loading="lazy"
        />
      </a>

      {workflow.site && (
        <a
          href={workflow.site}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink size={11} />
          {workflow.site}
        </a>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatutPage() {
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Detect user's territory from timezone
  const myTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; }
  }, []);

  const myCode = useMemo(() => {
    const entry = Object.values(TERRITORIES).find((t) => t.timezone === myTz);
    return entry?.code ?? null;
  }, [myTz]);

  const buildInfo = BUILD_DATE
    ? `${BUILD_ENV} · ${BUILD_DATE} · ${BUILD_SHA}`
    : `${BUILD_ENV} · ${BUILD_SHA}`;

  const isProduction = BUILD_ENV === 'production';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Horloges & Statut déploiement — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Horloges en direct des territoires ultramarins français et statut du déploiement de la plateforme A KI PRI SA YÉ."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/statut" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/statut" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/statut" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-6">

        {/* ── Hero ── */}
        <HeroImage
          src={PAGE_HERO_IMAGES.statut}
          alt="Horloges des territoires & statut déploiement"
          gradient="from-slate-950 to-cyan-950"
          height="h-40 sm:h-52"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-semibold">
            Plateforme en direct
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
            🕐 Horloges & Déploiement
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Heure locale de chaque territoire + statut CI/CD en temps réel
          </p>
        </HeroImage>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1 — Territory Clocks
        ══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="section-clocks">
          <div className="flex items-center justify-between mb-6">
            <h2 id="section-clocks" className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-cyan-400" />
              Horloges des territoires ultramarins
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '1s' }} />
              <span className="font-mono tabular-nums">
                {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
              </span>
            </div>
          </div>

          {/* DROM group */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-px bg-slate-700 inline-block" />
              Départements et Régions d'Outre-Mer (DROM)
              <span className="flex-1 h-px bg-slate-700 inline-block" />
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {['gp', 'mq', 'gf', 're', 'yt'].map((code) => (
                <TerritoryClockCard
                  key={code}
                  code={code}
                  now={now}
                  isMe={myCode === code}
                />
              ))}
            </div>
          </div>

          {/* COM group */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-px bg-slate-700 inline-block" />
              Collectivités d'Outre-Mer (COM)
              <span className="flex-1 h-px bg-slate-700 inline-block" />
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {['pf', 'nc', 'wf', 'mf', 'bl', 'pm'].map((code) => (
                <TerritoryClockCard
                  key={code}
                  code={code}
                  now={now}
                  isMe={myCode === code}
                />
              ))}
            </div>
          </div>

          {/* France métro */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-px bg-slate-700 inline-block" />
              Référence métropolitaine
              <span className="flex-1 h-px bg-slate-700 inline-block" />
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <TerritoryClockCard
                code="fr"
                now={now}
                isMe={myCode === 'fr'}
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — Deployment Status
        ══════════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="section-deploy">
          <h2 id="section-deploy" className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <GitBranch size={20} className="text-emerald-400" />
            Statut du déploiement en direct
          </h2>

          {/* Workflow badges grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {WORKFLOWS.map((wf) => (
              <DeploymentCard key={wf.key} workflow={wf} />
            ))}
          </div>

          {/* Build info card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h3 className="text-slate-300 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Version actuellement en ligne
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Commit SHA</p>
                <a
                  href={`https://github.com/teetee971/akiprisaye-web/commit/${BUILD_SHA}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  {BUILD_SHA.slice(0, 8)}
                  <ExternalLink size={10} />
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date build</p>
                <p className="text-white font-medium">{BUILD_DATE || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Environnement</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold border
                  ${isProduction
                    ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40'
                    : 'bg-amber-900/30 text-amber-300 border-amber-700/40'
                  }`}>
                  {BUILD_ENV}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dépôt</p>
                <a
                  href="https://github.com/teetee971/akiprisaye-web"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-xs"
                >
                  teetee971/akiprisaye-web
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
              {buildInfo}
            </p>
          </div>

          {/* Timeline legend */}
          <div className="mt-4 rounded-xl bg-slate-900/50 border border-slate-800 px-5 py-4 text-xs text-slate-500 space-y-1">
            <p className="text-slate-400 font-medium mb-2">Légende des badges de déploiement</p>
            <div className="grid sm:grid-cols-3 gap-2">
              <span className="flex items-center gap-2">
                <span className="inline-block w-12 h-4 rounded bg-emerald-700/60 text-center text-white text-[10px] leading-4">passing</span>
                Déploiement réussi
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-12 h-4 rounded bg-red-700/60 text-center text-white text-[10px] leading-4">failing</span>
                Déploiement en erreur
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-14 h-4 rounded bg-slate-600/60 text-center text-white text-[10px] leading-4">no status</span>
                Pas encore exécuté
              </span>
            </div>
            <p className="pt-1">
              Les badges sont chargés en direct depuis GitHub — ils reflètent l'état réel du dernier workflow exécuté sur la branche <code className="bg-slate-800 px-1 rounded">main</code>.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
