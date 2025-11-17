import { useState, useEffect } from 'react';

export default function NewsWidget({ limit = 3, showFullButton = true }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to mock data
      const response = await fetch('/api/news').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        setNews(data.slice(0, limit));
      } else {
        // Mock data fallback
        setNews(getMockNews().slice(0, limit));
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setNews(getMockNews().slice(0, limit));
      setError(null); // Don't show error, just use mock data
    } finally {
      setLoading(false);
    }
  };

  const getMockNews = () => [
    {
      id: 1,
      title: 'Nouvelle baisse des prix dans les grandes surfaces',
      summary: 'Plusieurs enseignes annoncent une réduction de 5% sur les produits de première nécessité.',
      date: '2025-11-08',
      category: 'Prix',
      territory: 'Guadeloupe',
    },
    {
      id: 2,
      title: 'Ouverture d\'un nouveau comparateur de prix',
      summary: 'A KI PRI SA YÉ lance son comparateur intelligent pour les consommateurs ultra-marins.',
      date: '2025-11-07',
      category: 'Innovation',
      territory: 'Tous territoires',
    },
    {
      id: 3,
      title: 'Bouclier qualité-prix étendu à 1000 produits',
      summary: 'Le gouvernement étend le dispositif anti-vie-chère à de nouveaux produits essentiels.',
      date: '2025-11-06',
      category: 'Politique',
      territory: 'DROM-COM',
    },
    {
      id: 4,
      title: 'Alerte sur la shrinkflation dans les produits laitiers',
      summary: 'Les consommateurs signalent une réduction des quantités sans baisse des prix.',
      date: '2025-11-05',
      category: 'Alerte',
      territory: 'Martinique',
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Prix': 'bg-green-600',
      'Innovation': 'bg-blue-600',
      'Politique': 'bg-purple-600',
      'Alerte': 'bg-red-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <section className="p-6 bg-surface backdrop-blur-md rounded-xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 bg-surface backdrop-blur-md rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-text flex items-center gap-2">
          📰 Fil d'actualité
        </h2>
        {showFullButton && (
          <a 
            href="/actualites.html" 
            className="text-accent hover:underline text-sm font-medium transition-colors"
          >
            Voir tout →
          </a>
        )}
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <article 
            key={item.id} 
            className="border-b border-white/10 pb-3 mb-3 last:border-b-0"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="text-sm text-gray-400">{item.territory}</span>
                </div>
                <a href="#" className="text-accent hover:underline font-semibold">
                  {item.title}
                </a>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2 mt-1">
                  {item.summary}
                </p>
                <time className="text-xs text-gray-400">
                  {formatDate(item.date)}
                </time>
              </div>
            </div>
          </article>
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-8">
          <p>Aucune actualité disponible pour le moment.</p>
        </div>
      )}
    </section>
  );
}
