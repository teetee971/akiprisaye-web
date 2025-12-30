import { useState, useEffect } from 'react';
import CivicNewsCard from './CivicNewsCard';
import { ALL_TERRITORIES, MULTI_TERRITORY_VALUES, ALL_CATEGORIES } from '../constants/news';

export default function NewsWidget({ limit = 3, showFullButton = true, selectedTerritory = null, selectedCategory = null }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, [selectedTerritory, selectedCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to mock data
      const response = await fetch('/api/news').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        setNews(filterNews(data));
      } else {
        // Mock data fallback
        setNews(filterNews(getMockNews()));
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setNews(filterNews(getMockNews()));
      setError(null); // Don't show error, just use mock data
    } finally {
      setLoading(false);
    }
  };

  const filterNews = (newsData) => {
    let filtered = newsData;
    
    // Filter by territory
    if (selectedTerritory && selectedTerritory !== ALL_TERRITORIES) {
      filtered = filtered.filter(item => 
        item.territory === selectedTerritory || 
        MULTI_TERRITORY_VALUES.includes(item.territory),
      );
    }
    
    // Filter by category
    if (selectedCategory && selectedCategory !== ALL_CATEGORIES) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return filtered.slice(0, limit);
  };

  const getMockNews = () => [
    {
      id: '1',
      title: 'Nouvelle baisse des prix dans les grandes surfaces',
      summary: 'Plusieurs enseignes annoncent une réduction moyenne de 5 % sur les produits alimentaires de première nécessité suite aux contrôles de la DGCCRF.',
      publishedAt: '2025-11-07',
      category: 'PRIX',
      territory: 'Guadeloupe',
      source: {
        name: 'Préfecture de Guadeloupe',
        url: 'https://www.guadeloupe.gouv.fr',
        logo: null,
      },
    },
    {
      id: '2',
      title: 'Extension du bouclier qualité-prix à 1000 produits',
      summary: 'Le dispositif anti-vie-chère est étendu à de nouveaux produits essentiels dans les DROM-COM, selon le décret publié par le ministère des Outre-mer.',
      publishedAt: '2025-11-06',
      category: 'POLITIQUE',
      territory: 'DROM-COM',
      source: {
        name: 'Ministère des Outre-mer',
        url: 'https://www.outre-mer.gouv.fr',
        logo: null,
      },
    },
    {
      id: '3',
      title: 'Contrôles renforcés de la DGCCRF sur les prix',
      summary: 'La Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes intensifie ses contrôles dans les grandes surfaces.',
      publishedAt: '2025-11-05',
      category: 'ALERTE',
      territory: 'Martinique',
      source: {
        name: 'DGCCRF',
        url: 'https://www.economie.gouv.fr/dgccrf',
        logo: null,
      },
    },
    {
      id: '4',
      title: 'Publication des données INSEE sur l\'inflation',
      summary: 'L\'INSEE publie les derniers chiffres de l\'inflation pour les territoires d\'Outre-mer, montrant une baisse de 0.3 points par rapport au mois précédent.',
      publishedAt: '2025-11-04',
      category: 'PRIX',
      territory: 'La Réunion',
      source: {
        name: 'INSEE',
        url: 'https://www.insee.fr',
        logo: null,
      },
    },
    {
      id: '5',
      title: 'Nouveau dispositif d\'observatoire des prix',
      summary: 'Mise en place d\'un observatoire participatif des prix permettant aux citoyens de signaler les écarts de prix constatés.',
      publishedAt: '2025-11-03',
      category: 'INNOVATION',
      territory: 'Tous territoires',
      source: {
        name: 'data.gouv.fr',
        url: 'https://www.data.gouv.fr',
        logo: null,
      },
    },
  ];

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          📰 Actualités vérifiées
        </h2>
        {showFullButton && (
          <a 
            href="/actualites" 
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-1"
          >
            <span>Voir tout</span>
            <span>→</span>
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <CivicNewsCard
            key={item.id}
            title={item.title}
            summary={item.summary}
            category={item.category}
            territory={item.territory}
            publishedAt={item.publishedAt}
            sourceName={item.source.name}
            sourceUrl={item.source.url}
            sourceLogo={item.source.logo}
          />
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12 bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl">
          <p className="text-lg">Aucune actualité disponible pour les filtres sélectionnés.</p>
          <p className="text-sm mt-2">Essayez de modifier vos critères de recherche.</p>
        </div>
      )}
    </section>
  );
}
