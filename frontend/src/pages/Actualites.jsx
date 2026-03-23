import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import OptimizedImage from '../components/OptimizedImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { newsFallback } from '../data/newsFallback';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

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

export default function Actualites() {
  const [territory, setTerritory] = useState('all');
  const [type, setType] = useState('');
  const [impact, setImpact] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [limit, setLimit] = useState(12);
  const [state, setState] = useState({ status: 'loading', items: [], mode: 'mock' });
  const [openEvidence, setOpenEvidence] = useState({});
  const [showFeaturedMedia, setShowFeaturedMedia] = useState(false);
  const [mediaSectionRef, mediaSectionVisible] = useIntersectionObserver({ rootMargin: '200px', threshold: 0.01 });
  const [newsListRef, newsListVisible] = useIntersectionObserver({ rootMargin: '250px', threshold: 0.01 });
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('fr-FR'),
    [],
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

      try {
        const response = await fetch(`/api/news?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`api_${response.status}`);
        const payload = await response.json();
        if (!mounted) return;
        const items = Array.isArray(payload.items) ? payload.items : [];
        setState({ status: 'success', items, mode: payload.mode ?? 'mock' });
      } catch {
        if (!mounted) return;
        setState({ status: 'error', items: newsFallback, mode: 'degraded' });
      }
    };

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [territory, type, impact, limit]);

  const displayedItems = useMemo(() => {
    const sorted = [...state.items].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
    return verifiedOnly ? sorted.filter((item) => item.verified) : sorted;
  }, [state.items, verifiedOnly]);

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Actualités & Bons plans consommateurs | A KI PRI SA YÉ</title>
        <meta name="description" content="Rappels sanitaires, bons plans vérifiés, réglementaire et signaux conso avec source obligatoire." />
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
          <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow">Actualités &amp; Bons plans</h1>
          <p className="text-slate-200 text-xs sm:text-sm drop-shadow">Rappels sanitaires, bons plans vérifiés et signaux conso</p>
        </HeroImage>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur space-y-3">
        <a
          href="/recherche-hub"
          className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 transition-colors"
        >
          Ouvrir la recherche globale du site
        </a>

        <div className="grid gap-2 grid-cols-2">
          <select value={territory} onChange={(e) => setTerritory(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs sm:text-sm">
            {Object.entries(TERRITORY_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs sm:text-sm cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Vérifiés seulement
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setType('')} className={`rounded-full px-2.5 py-1 text-xs font-medium ${!type ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Tous</button>
          {TYPE_OPTIONS.map((value) => (
            <button key={value} onClick={() => setType(value)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${type === value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              {TYPE_LABELS[value]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setImpact('')} className={`rounded-full px-2.5 py-1 text-xs font-medium ${!impact ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Tous impacts</button>
          {IMPACT_OPTIONS.map((value) => (
            <button key={value} onClick={() => setImpact(value)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${impact === value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              {IMPACT_LABELS[value]}
            </button>
          ))}
        </div>
      </section>

      {state.status === 'loading' && <p className="text-sm text-slate-400 px-1">Chargement des actualités...</p>}
      {state.status === 'error' && <p className="text-sm text-amber-300 px-1">API indisponible : fallback embarqué affiché.</p>}
      {displayedItems.length === 0 && state.status !== 'loading' && <p className="text-sm text-slate-400 px-1">Aucun résultat pour ces filtres.</p>}

      <section ref={mediaSectionRef} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur">
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
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
                <track kind="captions" srcLang="fr" label="Français" src="data:text/vtt,WEBVTT" default />
              </video>
            ) : (
              <div
                className="w-full h-44 rounded-xl border border-white/10 bg-slate-900/60"
                aria-hidden="true"
              />
            )}
          </div>
        ) : (
          <div className="h-44 rounded-xl border border-white/10 bg-slate-900/50" aria-hidden="true" />
        )}
      </section>

      <section ref={newsListRef} className="grid gap-3">
        {newsListVisible ? displayedItems.map((item) => {
          const evidenceOpen = Boolean(openEvidence[item.id]);
          const impactColor = item.impact === 'fort' ? 'border-l-red-500' : item.impact === 'moyen' ? 'border-l-amber-500' : 'border-l-blue-500';
          return (
            <article key={item.id} className={`rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden border-l-4 ${impactColor}`}>
              {(item.imageUrl || PAGE_HERO_IMAGES.articleDefault) && (
                <OptimizedImage
                  src={item.imageUrl ?? PAGE_HERO_IMAGES.articleDefault}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-28 sm:h-40 object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {item.videoUrl && (
                <video controls preload="none" className="w-full h-44 object-cover border-t border-white/10" poster={item.imageUrl ?? PAGE_HERO_IMAGES.articleDefault}>
                  <source src={item.videoUrl} type="video/mp4" />
                  <track kind="captions" srcLang="fr" label="Français" src="data:text/vtt,WEBVTT" default />
                </video>
              )}
              <div className="p-3 sm:p-4">
                <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded bg-slate-800 px-2 py-0.5">{TERRITORY_LABELS[item.territory] ?? item.territory}</span>
                  <span className={`rounded px-2 py-0.5 font-medium ${item.impact === 'fort' ? 'bg-red-900/60 text-red-300' : item.impact === 'moyen' ? 'bg-amber-900/60 text-amber-300' : 'bg-blue-900/60 text-blue-300'}`}>
                    {IMPACT_LABELS[item.impact] ?? item.impact}
                  </span>
                  {item.verified && <span className="rounded bg-emerald-700/70 px-2 py-0.5 text-emerald-200">Vérifié</span>}
                  {item.isSponsored && <span className="rounded bg-amber-700/70 px-2 py-0.5">Sponsorisé</span>}
                </div>
                <h2 className="text-sm sm:text-base font-semibold leading-snug">{item.title}</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 line-clamp-3">{item.summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <a href={item.source_url} target="_blank" rel="noreferrer" className="underline hover:text-slate-200 truncate max-w-[140px]">{item.source_name}</a>
                  <span>·</span>
                  <span>{dateFormatter.format(new Date(item.published_at))}</span>
                  {item.canonical_url && <a href={item.canonical_url} target="_blank" rel="noreferrer" className="underline hover:text-slate-200">Détail →</a>}
                </div>

                {item.evidence && (
                  <div className="mt-2">
                    <button className="text-xs text-blue-400 underline" onClick={() => setOpenEvidence((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}>
                      {evidenceOpen ? 'Masquer les preuves' : 'Afficher les preuves'}
                    </button>
                    {evidenceOpen && (
                      <ul className="mt-2 list-disc pl-4 text-xs text-slate-300 space-y-0.5">
                        {Object.entries(item.evidence).map(([key, value]) => <li key={key}><strong>{key}</strong> : {String(value)}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        }) : (
          <div className="h-64 rounded-2xl border border-white/10 bg-slate-900/50" aria-hidden="true" />
        )}
      </section>

      <button onClick={() => setLimit((prev) => prev + 30)} className="w-full rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-3 text-sm font-medium transition-colors">
        Charger plus d'actualités
      </button>
    </div>
  );
}
