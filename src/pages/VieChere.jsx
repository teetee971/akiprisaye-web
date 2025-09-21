import React from 'react';
import { useState, useEffect } from 'react';

const TERRITORIES = [
  { code: "guadeloupe", name: "Guadeloupe", flag: "🇬🇵" },
  { code: "martinique", name: "Martinique", flag: "🇲🇶" },
  { code: "guyane", name: "Guyane", flag: "🇬🇫" },
  { code: "reunion", name: "Réunion", flag: "🇷🇪" },
  { code: "mayotte", name: "Mayotte", flag: "🇾🇹" },
  { code: "saint-martin", name: "Saint-Martin", flag: "🇲🇫" },
  { code: "saint-barthelemy", name: "Saint-Barthélemy", flag: "🇧🇱" },
  { code: "polynesie-francaise", name: "Polynésie française", flag: "🇵🇫" },
  { code: "nouvelle-caledonie", name: "Nouvelle-Calédonie", flag: "🇳🇨" },
  { code: "wallis-et-futuna", name: "Wallis-et-Futuna", flag: "🇼🇫" },
];

export default function VieChere(){
  const [selectedTerritory, setSelectedTerritory] = useState("guadeloupe");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError] = useState(null);

  const fetchNews = async (territory = selectedTerritory) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/news?territory=${encodeURIComponent(territory)}`);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setNews(data.items || []);
      setLastFetch(data.fetchedAt || new Date().toISOString());
    } catch (err) {
      console.error("Erreur lors du chargement des actualités:", err);
      setError("Erreur lors du chargement des actualités");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedTerritory]);

  const handleTerritoryChange = (e) => {
    setSelectedTerritory(e.target.value);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const selectedTerritoryInfo = TERRITORIES.find(t => t.code === selectedTerritory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Actualités Vie Chère</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Suivez les dernières actualités concernant le coût de la vie et la consommation dans les territoires d'outre-mer.
        </p>
      </div>

      {/* Territory Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="territory-select" className="font-medium text-sm">
            Territoire :
          </label>
          <select
            id="territory-select"
            value={selectedTerritory}
            onChange={handleTerritoryChange}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {TERRITORIES.map(territory => (
              <option key={territory.code} value={territory.code}>
                {territory.flag} {territory.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchNews()}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? "Chargement..." : "Actualiser"}
        </button>

        {lastFetch && (
          <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
            Dernière mise à jour : {formatDate(lastFetch)}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-2 text-slate-600 dark:text-slate-400">Chargement des actualités...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* News Articles */}
      {!loading && !error && (
        <div className="space-y-4">
          {news.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Aucune actualité trouvée pour {selectedTerritoryInfo?.flag} {selectedTerritoryInfo?.name}.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {news.slice(0, 20).map((article, index) => (
                <article
                  key={`${article.link}-${index}`}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full">
                      {selectedTerritoryInfo?.flag} {selectedTerritory}
                    </span>
                    {article.source && (
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                        {article.source}
                      </span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400 ml-auto">
                      {formatDate(article.date)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {article.title}
                    </a>
                  </h3>

                  {article.summary && (
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-3">
                      {article.summary}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
