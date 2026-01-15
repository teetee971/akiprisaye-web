import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { GlassCard } from '../components/ui/glass-card';
import { 
  ExportButton, 
  FavoriteButton, 
  SearchHistory, 
  ShareComparisonButton,
  ThemeToggle,
  useSearchHistory,
  useFavorites
} from '../features/comparateur';

export default function PremiumFeaturesDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const { addToHistory } = useSearchHistory();
  const { favorites } = useFavorites();

  // Sample data for demo
  const sampleData = [
    { id: '1', product: 'Lait UHT 1L', price: '1.50€', store: 'Leader Price' },
    { id: '2', product: 'Lait UHT 1L', price: '1.65€', store: 'Carrefour' },
    { id: '3', product: 'Lait UHT 1L', price: '1.45€', store: 'Leclerc' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addToHistory(searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <>
      <Helmet>
        <title>Fonctionnalités Premium - A KI PRI SA YÉ</title>
        <meta name="description" content="Découvrez toutes les fonctionnalités premium du comparateur" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                ✨ Fonctionnalités Premium
              </h1>
              <p className="text-gray-400 text-lg">
                Export, Favoris, Historique & Partage
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Export Feature */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                📥 Export de données
              </h2>
              <p className="text-gray-400 mb-4">
                Exportez vos comparaisons en CSV, PDF ou JSON
              </p>
              
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400">
                      <th className="pb-2">Produit</th>
                      <th className="pb-2">Prix</th>
                      <th className="pb-2">Magasin</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-200">
                    {sampleData.map(item => (
                      <tr key={item.id}>
                        <td className="py-1">{item.product}</td>
                        <td className="py-1">{item.price}</td>
                        <td className="py-1">{item.store}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <ExportButton 
                data={sampleData} 
                filename="comparaison-lait"
                formats={['csv', 'pdf', 'json']}
              />
            </GlassCard>

            {/* Favorites Feature */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                ⭐ Gestion des favoris
              </h2>
              <p className="text-gray-400 mb-4">
                Sauvegardez vos produits préférés (actuellement: {favorites.length})
              </p>
              
              <div className="space-y-3">
                {sampleData.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3"
                  >
                    <div>
                      <div className="text-white font-medium">{item.product}</div>
                      <div className="text-gray-400 text-sm">{item.store} - {item.price}</div>
                    </div>
                    <FavoriteButton productId={item.id} size="medium" />
                  </div>
                ))}
              </div>
              
              <a 
                href="/comparateur/favoris"
                className="mt-4 block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Voir tous mes favoris
              </a>
            </GlassCard>

            {/* Search History Feature */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                🔍 Historique de recherche
              </h2>
              <p className="text-gray-400 mb-4">
                Vos 10 dernières recherches (avec limite automatique)
              </p>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Rechercher un produit..."
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
              
              <SearchHistory />
            </GlassCard>

            {/* Share Feature */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                🔗 Partage de comparaisons
              </h2>
              <p className="text-gray-400 mb-4">
                Générez un lien pour partager vos comparaisons
              </p>
              
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <div className="text-white mb-2">Comparaison: Lait UHT 1L</div>
                <div className="text-gray-400 text-sm">3 magasins • Meilleur prix: 1.45€</div>
              </div>
              
              <ShareComparisonButton
                comparisonData={{
                  products: sampleData,
                  timestamp: Date.now(),
                  query: 'Lait UHT 1L'
                }}
                productName="Lait UHT 1L"
              />
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="text-blue-400 text-sm">
                  💡 Le lien encodé contient toute la comparaison et fonctionne sur tous les appareils
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Feature Summary */}
          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              📋 Récapitulatif des fonctionnalités
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-2">✅ Implémenté</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Export CSV, PDF, JSON</li>
                  <li>• Gestion des favoris (localStorage)</li>
                  <li>• Historique de recherche (10 items max)</li>
                  <li>• Partage via URL encodée</li>
                  <li>• Thème clair/sombre</li>
                  <li>• Notifications toast</li>
                  <li>• Pages dédiées (/favoris, /partage)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">🔧 Caractéristiques</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Persistence localStorage avec gestion d'erreurs</li>
                  <li>• Support du partage natif mobile</li>
                  <li>• Copie automatique dans le presse-papier</li>
                  <li>• TypeScript strict pour la sécurité</li>
                  <li>• Composants réutilisables et modulaires</li>
                  <li>• Compatible avec le design existant</li>
                  <li>• Aucune dépendance externe lourde</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
