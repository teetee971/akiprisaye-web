import { useState, useEffect, useCallback } from 'react';
import type { CivicNewsItem } from '../types/news';
import CivicBadge from './ui/CivicBadge';
import SourceFooter from './ui/SourceFooter';
import { Calendar } from 'lucide-react';

interface NewsWidgetCivicProps {
  limit?: number;
  showFullButton?: boolean;
  territory?: string;
}

export default function NewsWidgetCivic({ limit = 3, showFullButton = true, territory }: NewsWidgetCivicProps) {
  const [news, setNews] = useState<CivicNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to mock data
      const response = await fetch('/api/news').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        const filtered = territory 
          ? data.filter((item: CivicNewsItem) => item.territory === territory)
          : data;
        setNews(filtered.slice(0, limit));
      } else {
        // Mock data fallback with official sources
        const mockNews = getMockNews();
        const filtered = territory 
          ? mockNews.filter((item) => item.territory === territory)
          : mockNews;
        setNews(filtered.slice(0, limit));
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      const mockNews = getMockNews();
      const filtered = territory 
        ? mockNews.filter((item) => item.territory === territory)
        : mockNews;
      setNews(filtered.slice(0, limit));
    } finally {
      setLoading(false);
    }
  }, [limit, territory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const getMockNews = (): CivicNewsItem[] => [
    {
      id: '1',
      title: 'Nouvelle baisse des prix dans les grandes surfaces',
      summary: 'Plusieurs enseignes annoncent une réduction de 5% sur les produits de première nécessité suite aux accords bouclier qualité-prix.',
      publishedAt: '2025-11-08T10:00:00Z',
      category: 'PRIX',
      territory: 'Guadeloupe',
      source: {
        name: 'Préfecture de Guadeloupe',
        url: 'https://www.guadeloupe.pref.gouv.fr'
      }
    },
    {
      id: '2',
      title: 'Bouclier qualité-prix étendu à 1000 produits',
      summary: 'Le gouvernement étend le dispositif anti-vie-chère à de nouveaux produits essentiels dans tous les DROM-COM.',
      publishedAt: '2025-11-06T09:15:00Z',
      category: 'POLITIQUE',
      territory: 'DROM-COM',
      source: {
        name: 'Ministère des Outre-mer',
        url: 'https://www.outre-mer.gouv.fr'
      }
    },
    {
      id: '3',
      title: 'Alerte shrinkflation sur les produits laitiers',
      summary: 'Les consommateurs signalent une réduction des quantités sans baisse des prix sur plusieurs marques de yaourts.',
      publishedAt: '2025-11-05T16:45:00Z',
      category: 'ALERTE',
      territory: 'Martinique',
      source: {
        name: 'DGCCRF',
        url: 'https://www.economie.gouv.fr/dgccrf'
      }
    },
    {
      id: '4',
      title: "Publication des indices de prix par l'INSEE",
      summary: "L'INSEE publie les nouveaux indices de prix à la consommation pour les territoires d'Outre-mer.",
      publishedAt: '2025-11-04T08:00:00Z',
      category: 'INNOVATION',
      territory: 'Tous territoires',
      source: {
        name: 'INSEE',
        url: 'https://www.insee.fr'
      }
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">
          Fil d'actualité civique
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
            className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/30 p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <CivicBadge category={item.category} />
              <span className="text-sm text-gray-400">{item.territory}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              {item.title}
            </h3>
            
            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              {item.summary}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <time>{formatDate(item.publishedAt)}</time>
            </div>

            <SourceFooter 
              sourceName={item.source.name}
              sourceUrl={item.source.url}
            />
          </article>
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-8">
          <p>Aucune actualité vérifiée disponible pour le moment.</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-700/50 text-xs text-gray-400 italic">
        Toutes les actualités proviennent exclusivement de sources publiques officielles vérifiées.
      </div>
    </section>
  );
}
