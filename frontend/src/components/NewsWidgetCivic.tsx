import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import SourceFooter from './ui/SourceFooter';
import { getActualites, type ActualitesArticle } from '../services/realDataService';

export interface CivicNewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: string;
  territory: string;
  source: {
    name: string;
    url: string;
  };
}

interface NewsWidgetCivicProps {
  limit?: number;
  showFullButton?: boolean;
  territory?: string;
}

export default function NewsWidgetCivic({
  limit = 3,
  showFullButton = true,
  territory,
}: NewsWidgetCivicProps) {
  const [news, setNews] = useState<CivicNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const mapArticleToCivicItem = (
    a: import('../services/realDataService').ActualitesArticle
  ): CivicNewsItem => ({
    id: a.id,
    title: a.title,
    summary: a.content.slice(0, 200) + (a.content.length > 200 ? '…' : ''),
    publishedAt: a.date.includes('T') ? a.date : a.date + 'T00:00:00Z',
    category: a.category.toUpperCase(),
    territory: a.territory === 'all' ? 'Tous territoires' : a.territory,
    source: {
      name: a.source_name,
      url: a.source_url ?? '#',
    },
  });

  const fetchNews = useCallback(async () => {
    try {
      const { getActualites } = await import('../services/realDataService');
      const articles = await getActualites();
      const mapped = articles.map(mapArticleToCivicItem);
      const sorted = [...mapped].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      const filtered =
        territory && territory !== 'Tous territoires'
          ? sorted.filter(
              (n) =>
                n.territory === territory ||
                n.territory === 'Tous territoires' ||
                n.territory === 'all'
            )
          : sorted;
      setNews(filtered.slice(0, limit));
    } finally {
      setLoading(false);
    }
  }, [limit, territory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-1/2" />
          <div className="h-4 bg-slate-700 rounded w-5/6" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-100">Actualité civique</h2>

        {showFullButton && (
          <Link
            to="/actualites"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Voir tout →
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {news.map((item) => (
          <article
            key={item.id}
            className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-4"
          >
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
              <span className="uppercase font-medium">{item.category}</span>
              <span>•</span>
              <span>{item.territory}</span>
            </div>

            <h3 className="text-lg font-semibold text-gray-100 mb-2">{item.title}</h3>

            <p className="text-sm text-gray-300 mb-3 leading-relaxed">{item.summary}</p>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Calendar size={14} />
              <time>{formatDate(item.publishedAt)}</time>
            </div>

            <SourceFooter sourceName={item.source.name} sourceUrl={item.source.url} />
          </article>
        ))}

        {news.length === 0 && (
          <p className="text-center text-gray-400 text-sm">
            Aucune actualité civique disponible pour le moment.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 italic border-t border-slate-700/50 pt-4">
        Sources publiques officielles vérifiées (préfectures, ministères, autorités nationales).
      </p>
    </section>
  );
}
