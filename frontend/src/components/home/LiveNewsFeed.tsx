/**
 * LiveNewsFeed — displays recent news from actualites.json.
 * Uses only real data — no mocks.
 */

import { useEffect, useState } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  icon: string;
  date: string;
  content: string;
  link: string;
  category: string;
  territory: string;
  imageUrl?: string;
  source_name?: string;
  source_url?: string;
}

interface ActualitesData {
  articles: NewsArticle[];
  lastUpdated: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  économie: '#3b82f6',
  logistique: '#f59e0b',
  politique: '#8b5cf6',
  solidarité: '#10b981',
  réglementation: '#6366f1',
  distribution: '#0ea5e9',
  sécurité: '#ef4444',
  'bon plan': '#22c55e',
  énergie: '#f59e0b',
  agriculture: '#84cc16',
  étude: '#64748b',
  default: '#6b7280',
};

const TERRITORY_LABELS: Record<string, string> = {
  all: 'Tous territoires',
  guadeloupe: '🇬🇵 Guadeloupe',
  martinique: '🇲🇶 Martinique',
  guyane: '🇬🇫 Guyane',
  GF: '🇬🇫 Guyane',
  reunion: '🇷🇪 La Réunion',
  mayotte: '🇾🇹 Mayotte',
};

function readingTime(content: string): number {
  return Math.max(1, Math.round(content.split(' ').length / 200));
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function LiveNewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${import.meta.env.BASE_URL}data/actualites.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then((data: ActualitesData) => {
        setArticles(data.articles.slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();

    const timer = setInterval(load, 60 * 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="news-feed-skeleton" aria-busy="true" aria-label="Chargement des actualités">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="news-card-skeleton" />
        ))}
      </div>
    );
  }

  if (!articles.length) return null;

  return (
    <section className="news-feed-section section-reveal" aria-labelledby="news-feed-heading">
      {/* Section banner image */}
      <div className="section-context-banner">
        <img
          src={`${import.meta.env.BASE_URL}media/images/hero-actualites.webp`}
          alt="Journaux et presse économique — actualités outre-mer"
          className="section-context-banner-img"
          loading="lazy"
          width="900"
          height="160"
        />
        <div className="section-context-banner-overlay" aria-hidden="true" />
        <div className="section-context-banner-caption">
          <span className="section-context-banner-title" aria-hidden="true">
            📰 Actualités économiques
          </span>
          <span className="section-context-banner-badge">INSEE · Gouvernement · Associations</span>
        </div>
      </div>

      <div className="news-feed-header">
        <h2 id="news-feed-heading" className="section-title slide-up">
          📰 Actualités économiques
        </h2>
        <p className="news-feed-sub slide-up">
          Données vérifiées — INSEE, gouvernement, associations locales, observatoire citoyen A KI
          PRI SA YÉ
        </p>
      </div>
      <div className="news-feed-grid">
        {articles.map((article) => {
          const color = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.default;
          const sourceHref = article.source_url || article.link;
          return (
            <article key={article.id} className="news-card fade-in">
              {/* Image with gradient overlay */}
              <div className="news-card-image-wrap">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    loading="lazy"
                    width="400"
                    height="160"
                    className="news-card-image"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="news-card-image-overlay" aria-hidden="true" />
                <div className="news-card-image-badges">
                  <span
                    className="news-card-category"
                    style={{ '--category-color': color } as React.CSSProperties}
                  >
                    {article.category}
                  </span>
                  {(article as NewsArticle & { verified?: boolean }).verified && (
                    <span className="news-card-verified" title="Source vérifiée">
                      ✓ vérifié
                    </span>
                  )}
                </div>
              </div>

              <div className="news-card-body">
                <div className="news-card-top">
                  <span className="news-card-icon" role="img" aria-label={article.category}>
                    {article.icon}
                  </span>
                  {article.territory &&
                    article.territory !== 'all' &&
                    TERRITORY_LABELS[article.territory] && (
                      <span className="news-card-territory">
                        {TERRITORY_LABELS[article.territory]}
                      </span>
                    )}
                </div>
                <h3 className="news-card-title">{article.title}</h3>
                <div className="news-card-meta">
                  <p className="news-card-date">{formatDate(article.date)}</p>
                  <span className="news-card-reading-time">
                    ⏱ {readingTime(article.content)} min
                  </span>
                </div>
                <p className="news-card-content">{article.content}</p>
                <div className="news-card-footer">
                  {sourceHref && (
                    <a
                      href={sourceHref}
                      className="news-card-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Lire l'article : ${article.title}`}
                    >
                      {article.source_name
                        ? `Source : ${article.source_name} →`
                        : 'Lire la source →'}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
