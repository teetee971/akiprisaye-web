import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import OptimizedImage from '../components/OptimizedImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { DEFAULT_NEWS_LIMIT } from '../constants/news';
import { newsFallback } from '../data/newsFallback';

const TERRITORY_LABELS = {
  all: 'Tous territoires',
  gp: 'Guadeloupe',
  mq: 'Martinique',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
  fr: 'France',
};

const TYPE_LABELS = {
  bons_plans: 'Bons plans',
  rappels: 'Rappels',
  reglementaire: 'Réglementaire',
  indice: 'Indice',
  dossiers: 'Dossiers',
  press: 'Presse',
  partner: 'Partenaire',
  user: 'Utilisateur',
};

const IMPACT_LABELS = { fort: 'Fort', moyen: 'Moyen', info: 'Info' };
const TYPE_OPTIONS = Object.keys(TYPE_LABELS);
const IMPACT_OPTIONS = Object.keys(IMPACT_LABELS);
const AUTO_REFRESH_MS = 60 * 60 * 1000;
const PUBLIC_WEB_BASE = 'https://teetee971.github.io/akiprisaye-web';
const RUNTIME_WEB_BASE =
  typeof window !== 'undefined'
    ? new URL(import.meta.env.BASE_URL, window.location.origin).toString().replace(/\/$/, '')
    : PUBLIC_WEB_BASE;

function normalizeNewsUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl, RUNTIME_WEB_BASE);
    if (parsed.hostname === 'akiprisaye.fr' || parsed.hostname === 'www.akiprisaye.fr') {
      return `${RUNTIME_WEB_BASE}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function isInternalUrl(url) {
  try {
    const parsed = new URL(url, RUNTIME_WEB_BASE);
    return parsed.origin === new URL(RUNTIME_WEB_BASE).origin;
  } catch {
    return false;
  }
}

function getInternalPath(url) {
  try {
    const parsed = new URL(url, RUNTIME_WEB_BASE);
    const appBase = new URL(RUNTIME_WEB_BASE);
    if (parsed.origin !== appBase.origin) return null;
    const basePath = appBase.pathname.endsWith('/')
      ? appBase.pathname.slice(0, -1)
      : appBase.pathname;
    if (!parsed.pathname.startsWith(basePath)) return null;
    const relativePath = parsed.pathname.slice(basePath.length) || '/';
    return `${relativePath}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export default function Actualites() {
  const [territory, setTerritory] = useState('all');
  const [type, setType] = useState('');
  const [impact, setImpact] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [limit, setLimit] = useState(DEFAULT_NEWS_LIMIT);
  const [state, setState] = useState({ status: 'loading', items: [], mode: 'live' });
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [openEvidence, setOpenEvidence] = useState({});
  const [showFeaturedMedia, setShowFeaturedMedia] = useState(false);
  const [mediaSectionRef, mediaSectionVisible] = useIntersectionObserver({
    rootMargin: '200px',
    threshold: 0.01,
  });
  const [newsListRef, newsListVisible] = useIntersectionObserver({
    rootMargin: '250px',
    threshold: 0.01,
  });
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('fr-FR'), []);
  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
    []
  );
  const monthYearFormatter = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }),
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setShowFeaturedMedia(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading' }));
      const params = new URLSearchParams({ territory, limit: String(limit) });
      if (type) params.set('type', type);
      if (impact) params.set('impact', impact);
      params.set('refresh', String(Math.floor(Date.now() / AUTO_REFRESH_MS)));

      try {
        const response = await fetch(`/api/news?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) throw new Error(`api_${response.status}`);
        const payload = await response.json();
        if (!mounted) return;
        const items = Array.isArray(payload.items) ? payload.items : [];
        setState({ status: 'success', items, mode: payload.mode ?? 'live' });
        setLastRefreshAt(new Date().toISOString());
      } catch {
        if (!mounted) return;
        setState({ status: 'error', items: newsFallback, mode: 'fallback' });
        setLastRefreshAt(new Date().toISOString());
      }
    };

    load();

    // Hourly auto-refresh
    const refreshTimer = window.setInterval(() => {
      if (mounted) load();
    }, AUTO_REFRESH_MS);

    // Refresh when the tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mounted) load();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      controller.abort();
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [territory, type, impact, limit]);

  const displayedItems = useMemo(() => {
    const sorted = [...state.items].sort(
      (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)
    );
    const filtered = verifiedOnly ? sorted.filter((item) => item.verified) : sorted;
    // Exclude partner items from the main list (shown in their own section)
    return filtered.filter((item) => item.type !== 'partner');
  }, [state.items, verifiedOnly]);

  const staleNewsNotice = useMemo(() => {
    if (state.status === 'loading' || displayedItems.length === 0) return null;
    const current = new Date();
    const currentMonth = current.getMonth();
    const currentYear = current.getFullYear();
    const hasCurrentMonthItem = displayedItems.some((item) => {
      const published = new Date(item.published_at);
      return published.getFullYear() === currentYear && published.getMonth() === currentMonth;
    });
    if (hasCurrentMonthItem) return null;

    const latestPublished = new Date(displayedItems[0].published_at);
    return {
      currentMonthLabel: monthYearFormatter.format(current),
      latestMonthLabel: monthYearFormatter.format(latestPublished),
    };
  }, [displayedItems, monthYearFormatter, state.status]);

  const partnerItems = useMemo(() => {
    // Partner/sponsored items get their own dedicated section
    const sorted = [...state.items].sort(
      (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)
    );
    return sorted.filter((item) => item.type === 'partner' || item.isSponsored);
  }, [state.items]);

  const shouldRenderNewsList =
    newsListVisible || state.status !== 'loading' || displayedItems.length > 0;

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Actualités & Bons plans consommateurs | A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Rappels sanitaires, bons plans vérifiés, réglementaire et signaux conso avec source obligatoire."
        />
        <link rel="preload" as="image" href={PAGE_HERO_IMAGES.heroActualites} />
      </Helmet>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6 backdrop-blur animate-fade-in">
        <HeroImage
          src={PAGE_HERO_IMAGES.heroActualites}
          alt="Actualités consommateurs"
          gradient="from-slate-900 to-teal-950"
          height="h-24 sm:h-44"
          loading="eager"
          fetchPriority="high"
          width={1200}
          heightPx={480}
          sizes="100vw"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow">
            Actualités &amp; Bons plans
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm drop-shadow">
            Rappels sanitaires, bons plans vérifiés et signaux conso
          </p>
        </HeroImage>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur space-y-3">
        <Link
          to="/recherche-hub"
          className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 transition-colors"
        >
          Ouvrir la recherche globale du site
        </Link>

        <div className="grid gap-2 grid-cols-2">
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs sm:text-sm"
          >
            {Object.entries(TERRITORY_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs sm:text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            Vérifiés seulement
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setType('')}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${!type ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            Tous
          </button>
          {TYPE_OPTIONS.map((value) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${type === value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              {TYPE_LABELS[value]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setImpact('')}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${!impact ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            Tous impacts
          </button>
          {IMPACT_OPTIONS.map((value) => (
            <button
              key={value}
              onClick={() => setImpact(value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${impact === value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              {IMPACT_LABELS[value]}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-400">
          Actualisation automatique toutes les 1h
          {lastRefreshAt
            ? ` • Dernière synchro: ${dateTimeFormatter.format(new Date(lastRefreshAt))}`
            : ''}
        </p>
      </section>

      {state.status === 'loading' && (
        <p className="text-sm text-slate-400 px-1">Chargement des actualités...</p>
      )}
      {state.status === 'error' && (
        <div className="px-1">
          <p className="text-xs text-slate-400">Données hors connexion affichées.</p>
        </div>
      )}
      {staleNewsNotice && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 px-3 py-2">
          <p className="text-xs text-amber-300">
            Pas de nouvelle mise à jour pour {staleNewsNotice.currentMonthLabel}. Dernière actualité
            datée de {staleNewsNotice.latestMonthLabel}.
          </p>
        </div>
      )}
      {displayedItems.length === 0 && state.status !== 'loading' && partnerItems.length === 0 && (
        <p className="text-sm text-slate-400 px-1">Aucun résultat pour ces filtres.</p>
      )}

      {/* ── Enseignes Partenaires ─────────────────────────────────── */}
      {partnerItems.length > 0 && !type && (
        <section
          className="rounded-2xl border border-amber-500/30 bg-amber-900/10 p-3 sm:p-4 backdrop-blur"
          aria-labelledby="partner-news-heading"
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              id="partner-news-heading"
              className="text-sm font-bold text-amber-300 flex items-center gap-2"
            >
              🏪 Enseignes Partenaires
            </h2>
            <span className="text-[10px] text-amber-500 border border-amber-600/40 rounded px-1.5 py-0.5">
              Liens sponsorisés
            </span>
          </div>
          <p className="text-xs text-amber-400/70 mb-3">
            Actualités et promotions de nos enseignes partenaires. Cliquer sur un lien peut générer
            une commission pour A KI PRI SA YÉ.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x -mx-1 px-1" role="list">
            {partnerItems.map((item) => {
              const retailerUrl =
                normalizeNewsUrl(item.canonical_url) ?? normalizeNewsUrl(item.source_url);
              return (
                <a
                  key={item.id}
                  href={retailerUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  aria-label={`Offre partenaire : ${item.title}`}
                  className="flex-none w-56 snap-start rounded-xl border border-amber-500/20 bg-slate-900/80 hover:bg-amber-900/20 active:scale-95 transition-all p-3 flex flex-col gap-1.5"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="w-full h-20 object-cover rounded-lg border border-white/5"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-900/40 rounded-full px-2 py-0.5 truncate max-w-[120px]">
                      {item.source_name}
                    </span>
                    <span className="text-[10px] text-amber-600">Partenaire</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100 leading-snug line-clamp-3">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-amber-400 font-medium mt-auto">Voir l'offre →</p>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section
        ref={mediaSectionRef}
        className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur"
      >
        <h2 className="text-sm sm:text-base font-semibold text-white mb-2">Média à la une</h2>
        {mediaSectionVisible ? (
          <div className="grid gap-3 md:grid-cols-2">
            <OptimizedImage
              src={PAGE_HERO_IMAGES.articleDefault}
              alt="Illustration éditoriale des actualités consommateurs"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="w-full h-44 rounded-xl object-cover border border-white/10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {showFeaturedMedia ? (
              <video
                muted
                playsInline
                controls
                preload="metadata"
                poster={PAGE_HERO_IMAGES.heroActualites}
                className="w-full h-44 rounded-xl object-cover border border-white/10 bg-slate-900"
                aria-label="Ambiance éditoriale de veille marché"
              >
                <source
                  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                  type="video/mp4"
                />
                <track
                  kind="captions"
                  srcLang="fr"
                  label="Français"
                  src="data:text/vtt,WEBVTT"
                  default
                />
              </video>
            ) : (
              <div
                className="w-full h-44 rounded-xl border border-white/10 bg-slate-900/60"
                aria-hidden="true"
              />
            )}
          </div>
        ) : (
          <div
            className="h-44 rounded-xl border border-white/10 bg-slate-900/50"
            aria-hidden="true"
          />
        )}
      </section>

      <section ref={newsListRef} className="grid gap-3 pb-28 sm:pb-8">
        {shouldRenderNewsList ? (
          displayedItems.map((item) => {
            const evidenceOpen = Boolean(openEvidence[item.id]);
            const impactColor =
              item.impact === 'fort'
                ? 'border-l-red-500'
                : item.impact === 'moyen'
                  ? 'border-l-amber-500'
                  : 'border-l-blue-500';
            const sourceUrl = normalizeNewsUrl(item.source_url);
            const detailUrl = normalizeNewsUrl(item.canonical_url);
            const detailIsInternal = detailUrl ? isInternalUrl(detailUrl) : false;
            const sourcePath =
              sourceUrl && isInternalUrl(sourceUrl) ? getInternalPath(sourceUrl) : null;
            const detailPath = detailUrl && detailIsInternal ? getInternalPath(detailUrl) : null;

            return (
              <article
                key={item.id}
                className={`rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden border-l-4 ${impactColor}`}
              >
                {(item.imageUrl || PAGE_HERO_IMAGES.articleDefault) && (
                  <OptimizedImage
                    src={item.imageUrl ?? PAGE_HERO_IMAGES.articleDefault}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-28 sm:h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {item.videoUrl && (
                  <video
                    controls
                    preload="none"
                    className="w-full h-44 object-cover border-t border-white/10"
                    poster={item.imageUrl ?? PAGE_HERO_IMAGES.articleDefault}
                  >
                    <source src={item.videoUrl} type="video/mp4" />
                    <track
                      kind="captions"
                      srcLang="fr"
                      label="Français"
                      src="data:text/vtt,WEBVTT"
                      default
                    />
                  </video>
                )}
                <div className="p-3 sm:p-4">
                  <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded bg-slate-800 px-2 py-0.5">
                      {TERRITORY_LABELS[item.territory] ?? item.territory}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 font-medium ${item.impact === 'fort' ? 'bg-red-900/60 text-red-300' : item.impact === 'moyen' ? 'bg-amber-900/60 text-amber-300' : 'bg-blue-900/60 text-blue-300'}`}
                    >
                      {IMPACT_LABELS[item.impact] ?? item.impact}
                    </span>
                    {item.verified && (
                      <span className="rounded bg-emerald-700/70 px-2 py-0.5 text-emerald-200">
                        Vérifié
                      </span>
                    )}
                    {item.isSponsored && (
                      <span className="rounded bg-amber-700/70 px-2 py-0.5">Sponsorisé</span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold leading-snug">{item.title}</h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-300 line-clamp-3">
                    {item.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {sourcePath ? (
                      <Link
                        to={sourcePath}
                        className="underline hover:text-slate-200 truncate max-w-[180px]"
                      >
                        {item.source_name}
                      </Link>
                    ) : sourceUrl ? (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-slate-200 truncate max-w-[180px]"
                      >
                        {item.source_name}
                      </a>
                    ) : (
                      <span className="truncate max-w-[180px]">{item.source_name}</span>
                    )}
                    <span>·</span>
                    <span>{dateFormatter.format(new Date(item.published_at))}</span>
                  </div>
                  {detailUrl && (
                    <div className="mt-2">
                      {detailPath ? (
                        <Link
                          to={detailPath}
                          className="inline-flex items-center rounded-md border border-blue-400/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/20"
                        >
                          Ouvrir le détail
                        </Link>
                      ) : (
                        <a
                          href={detailUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-md border border-blue-400/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/20"
                        >
                          Ouvrir le détail
                        </a>
                      )}
                    </div>
                  )}
                  {!detailUrl && (
                    <div className="mt-2 text-xs text-slate-500">
                      Détail indisponible (source introuvable)
                    </div>
                  )}

                  {item.evidence && (
                    <div className="mt-2">
                      <button
                        className="text-xs text-blue-400 underline"
                        onClick={() =>
                          setOpenEvidence((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                      >
                        {evidenceOpen ? 'Masquer les preuves' : 'Afficher les preuves'}
                      </button>
                      {evidenceOpen && (
                        <ul className="mt-2 list-disc pl-4 text-xs text-slate-300 space-y-0.5">
                          {Object.entries(item.evidence).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key}</strong> : {String(value)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div
            className="h-64 rounded-2xl border border-white/10 bg-slate-900/50"
            aria-hidden="true"
          />
        )}
      </section>

      <button
        onClick={() => setLimit((prev) => prev + 30)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-3 text-sm font-medium transition-colors"
      >
        Charger plus d'actualités
      </button>
    </div>
  );
}
