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
  économie:   '#3b82f6',
  logistique: '#f59e0b',
  politique:  '#8b5cf6',
  solidarité: '#10b981',
  default:    '#6b7280',
};

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(dateStr),
    );
  } catch {
    return dateStr;
  }
}

export default function LiveNewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/actualites.json`)
      .then((r) => r.json())
      .then((data: ActualitesData) => {
        setArticles(data.articles.slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
          src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=900&q=75"
          alt="Journaux et presse économique — actualités outre-mer"
          className="section-context-banner-img"
          loading="lazy"
          width="900"
          height="160"
        />
        <div className="section-context-banner-overlay" aria-hidden="true" />
        <div className="section-context-banner-caption">
          <span className="section-context-banner-title" aria-hidden="true">📰 Actualités économiques</span>
          <span className="section-context-banner-badge">INSEE · Gouvernement · Associations</span>
        </div>
      </div>

      <div className="news-feed-header">
        <h2 id="news-feed-heading" className="section-title slide-up">
          📰 Actualités économiques
        </h2>
        <p className="news-feed-sub slide-up">
          Données issues de l'INSEE, du gouvernement et des associations locales.
        </p>
      </div>
      <div className="news-feed-grid">
        {articles.map((article) => {
          const color = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.default;
          const sourceHref = article.source_url || article.link;
          return (
            <article key={article.id} className="news-card fade-in">
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  loading="lazy"
                  width="400"
                  height="140"
                  className="news-card-image"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="news-card-body">
              <div className="news-card-top">
                <span className="news-card-icon" role="img" aria-label={article.category}>
                  {article.icon}
                </span>
                <span
                  className="news-card-category"
                  style={{ '--category-color': color } as React.CSSProperties}
                >
                  {article.category}
                </span>
              </div>
              <h3 className="news-card-title">{article.title}</h3>
              <p className="news-card-date">{formatDate(article.date)}</p>
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
                    {article.source_name ? `Source : ${article.source_name} →` : 'Lire la source →'}
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
