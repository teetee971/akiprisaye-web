/**
 * NewsTeaser — compact news strip for the home page.
 *
 * Displays the 3 most recent headlines from /data/actualites.json
 * with a "Toutes les actualités →" CTA.  Refreshes every hour so
 * the home page always shows fresh news without a full page reload.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 h
const ARTICLES_TO_SHOW = 3;

const CATEGORY_COLORS: Record<string, string> = {
  économie:       'bg-blue-500/20 text-blue-300',
  logistique:     'bg-amber-500/20 text-amber-300',
  politique:      'bg-purple-500/20 text-purple-300',
  solidarité:     'bg-emerald-500/20 text-emerald-300',
  réglementation: 'bg-indigo-500/20 text-indigo-300',
  distribution:   'bg-sky-500/20 text-sky-300',
  sécurité:       'bg-red-500/20 text-red-300',
  'bon plan':     'bg-green-500/20 text-green-300',
  énergie:        'bg-yellow-500/20 text-yellow-300',
  agriculture:    'bg-lime-500/20 text-lime-300',
  étude:          'bg-slate-500/20 text-slate-300',
};

const IMPACT_COLORS: Record<string, string> = {
  fort:  'text-red-400',
  moyen: 'text-amber-400',
  info:  'text-blue-400',
};

interface NewsArticle {
  id: string;
  title: string;
  icon: string;
  date: string;
  category: string;
  territory?: string;
  impact?: string;
  verified?: boolean;
  isSponsored?: boolean;
}

interface ActualitesData {
  articles: NewsArticle[];
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function NewsTeaser() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchArticles = () => {
    fetch(`${import.meta.env.BASE_URL}data/actualites.json?v=${Date.now()}`)
      .then((r) => (r.ok ? (r.json() as Promise<ActualitesData>) : Promise.reject()))
      .then((data) => {
        const sorted = [...(data.articles ?? [])]
          .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
          .slice(0, ARTICLES_TO_SHOW);
        setArticles(sorted);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchArticles();

    // Hourly refresh
    intervalRef.current = setInterval(fetchArticles, REFRESH_INTERVAL_MS);

    // Refresh when the user comes back to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchArticles();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="px-6 mb-6" aria-busy="true" aria-label="Chargement des actualités">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Actualités</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-none w-56 h-20 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!articles.length) return null;

  return (
    <section className="px-6 mb-6" aria-labelledby="news-teaser-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 id="news-teaser-heading" className="text-xs font-bold uppercase tracking-widest text-slate-400">
          📰 Actualités
        </h2>
        <Link
          to="/actualites"
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          aria-label="Voir toutes les actualités"
        >
          Tout voir →
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <ul className="flex gap-3 overflow-x-auto pb-2 snap-x -mx-1 px-1 list-none p-0 m-0">
        {articles.map((article) => (
          <li key={article.id} className="flex-none">
            <Link
              to="/actualites"
              className={`w-52 snap-start rounded-xl border active:scale-95 transition-all p-3 flex flex-col gap-1.5 text-left ${
                article.isSponsored
                  ? 'border-amber-500/30 bg-amber-900/15 hover:bg-amber-900/25'
                  : 'border-white/8 bg-slate-800/60 hover:bg-slate-700/70'
              }`}
              aria-label={`Actualité : ${article.title}`}
            >
              {/* Category pill + impact dot */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {article.isSponsored ? (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                    🏪 Partenaire
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[article.category] ?? 'bg-slate-500/20 text-slate-300'}`}
                  >
                    {article.icon} {article.category}
                  </span>
                )}
                {article.impact && article.impact !== 'info' && (
                  <span className={`text-[10px] font-bold ${IMPACT_COLORS[article.impact] ?? ''}`}>
                    {article.impact === 'fort' ? '🔴' : '🟡'}
                  </span>
                )}
                {article.verified && !article.isSponsored && (
                  <span className="text-[10px] text-emerald-400" title="Source vérifiée">✓</span>
                )}
              </div>

              {/* Headline */}
              <p className="text-xs font-semibold text-slate-100 leading-snug line-clamp-3">
                {article.title}
              </p>

              {/* Date */}
              <p className="text-[10px] text-slate-500 mt-auto">
                {formatShortDate(article.date)}
              </p>
            </Link>
          </li>
        ))}

        {/* "Voir toutes" CTA card */}
        <li className="flex-none">
          <Link
            to="/actualites"
            className="w-36 snap-start rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all p-3 flex flex-col items-center justify-center gap-2 text-center"
            aria-label="Voir toutes les actualités"
          >
            <span className="text-2xl" role="img" aria-hidden="true">📰</span>
            <span className="text-xs font-bold text-blue-300">Toutes les actus</span>
            <span className="text-[10px] text-blue-400">→</span>
          </Link>
        </li>
      </ul>

      {/* Freshness indicator */}
      {lastUpdated && (
        <p className="text-[10px] text-slate-600 mt-1 text-right">
          Mis à jour {formatShortDate(lastUpdated.toISOString())}
        </p>
      )}
    </section>
  );
}
