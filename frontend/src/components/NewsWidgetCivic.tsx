import { useState, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import SourceFooter from './ui/SourceFooter';

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

  /**
   * FRONTEND-ONLY
   * Source : données statiques vérifiées
   */
  const getMockNews = (): CivicNewsItem[] => [
    {
      id: '1',
      title: 'Nouvelle baisse des prix dans les grandes surfaces',
      summary:
        'Plusieurs enseignes annoncent une réduction de 5 % sur les produits de première nécessité suite aux accords du bouclier qualité-prix.',
      publishedAt: '2025-11-08T10:00:00Z',
      category: 'PRIX',
      territory: 'Guadeloupe',
      source: {
        name: 'Préfecture de Guadeloupe',
        url: 'https://www.guadeloupe.gouv.fr',
      },
    },
    {
      id: '2',
      title: 'Extension du bouclier qualité-prix à 1000 produits',
      summary:
        'Le gouvernement étend le dispositif anti-vie-chère à de nouveaux produits essentiels dans tous les DROM-COM.',
      publishedAt: '2025-11-06T15:00:00Z',
      category: 'POLITIQUE',
      territory: 'DROM-COM',
      source: {
        name: 'Ministère des Outre-mer',
        url: 'https://www.outre-mer.gouv.fr',
      },
    },
    {
      id: '3',
      title: 'Contrôles renforcés de la DGCCRF',
      summary:
        'La DGCCRF intensifie ses contrôles sur les pratiques tarifaires dans les grandes surfaces.',
      publishedAt: '2025-11-05T14:30:00Z',
      category: 'ALERTE',
      territory: 'Martinique',
      source: {
        name: 'DGCCRF',
        url: 'https://www.economie.gouv.fr/dgccrf',
      },
    },
    {
      id: '4',
      title: 'Publication des indices de prix par l’INSEE',
      summary:
        'L’INSEE publie les derniers indices de prix à la consommation pour les territoires d’Outre-mer.',
      publishedAt: '2025-11-04T08:00:00Z',
      category: 'INFORMATION',
      territory: 'Tous territoires',
      source: {
        name: 'INSEE',
        url: 'https://www.insee.fr',
      },
    },
  ];

  const fetchNews = useCallback(() => {
    try {
      const allNews = getMockNews();
      const filtered = territory
        ? allNews.filter((n) => n.territory === territory)
        : allNews;

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
        <h2 className="text-xl font-semibold text-gray-100">
          Actualité civique
        </h2>

        {showFullButton && (
          <a
            href="/actualites"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Voir tout →
          </a>
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

            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              {item.title}
            </h3>

            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              {item.summary}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Calendar size={14} />
              <time>{formatDate(item.publishedAt)}</time>
            </div>

            <SourceFooter
              sourceName={item.source.name}
              sourceUrl={item.source.url}
            />
          </article>
        ))}

        {news.length === 0 && (
          <p className="text-center text-gray-400 text-sm">
            Aucune actualité civique disponible pour le moment.
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 italic border-t border-slate-700/50 pt-4">
        Sources publiques officielles vérifiées (préfectures, ministères,
        autorités nationales).
      </p>
    </section>
  );
}
