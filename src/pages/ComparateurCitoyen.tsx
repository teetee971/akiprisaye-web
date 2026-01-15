import { useState, useEffect } from 'react';
import ComparateurTable from '../components/comparateur/ComparateurTable';
import ComparateurFilters from '../components/comparateur/ComparateurFilters';

// Type pour les données de l'observatoire
type ObservatoireData = {
  commune: string;
  enseigne: string;
  categorie: string;
  produit: string;
  ean: string;
  unite: string;
  prix: number;
};

type ObservatoireSnapshot = {
  territoire: string;
  date_snapshot: string;
  source: string;
  qualite: string;
  donnees: ObservatoireData[];
};

export default function ComparateurCitoyen() {
  const [data, setData] = useState<ObservatoireData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [snapshot, setSnapshot] = useState<ObservatoireSnapshot | null>(null);

  // Charger le snapshot le plus récent
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Charger le snapshot le plus récent (2026-02)
        const response = await fetch('/data/observatoire/guadeloupe_2026-02.json');
        
        if (!response.ok) {
          throw new Error('Impossible de charger les données');
        }
        
        const jsonData: ObservatoireSnapshot = await response.json();
        setSnapshot(jsonData);
        setData(jsonData.donnees || []);
        
        // Sélectionner le premier produit par défaut
        if (jsonData.donnees && jsonData.donnees.length > 0) {
          setSelectedProduct(jsonData.donnees[0].ean);
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        setError('Impossible de charger les données de l\'observatoire');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Obtenir la liste des produits uniques
  const getUniqueProducts = () => {
    const products = new Map<string, { ean: string; produit: string; unite: string }>();
    data.forEach((item) => {
      if (!products.has(item.ean)) {
        products.set(item.ean, {
          ean: item.ean,
          produit: item.produit,
          unite: item.unite,
        });
      }
    });
    return Array.from(products.values());
  };

  // Obtenir la liste des communes uniques
  const getUniqueCommunes = () => {
    const communes = new Set<string>();
    data.forEach((item) => {
      communes.add(item.commune);
    });
    return Array.from(communes).sort();
  };

  // Filtrer les données selon le produit et la commune sélectionnés
  const getFilteredData = () => {
    let filtered = data;

    if (selectedProduct) {
      filtered = filtered.filter((item) => item.ean === selectedProduct);
    }

    if (selectedCommune) {
      filtered = filtered.filter((item) => item.commune === selectedCommune);
    }

    // Trier par prix croissant
    return filtered.sort((a, b) => a.prix - b.prix);
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-md border-b border-blue-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Comparateur Citoyen
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Observatoire des prix - Données vérifiées
                </p>
              </div>
            </div>
            <a
              href="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>Accueil</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 rounded-xl p-6 mb-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              ℹ️
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">
                Comment utiliser le comparateur
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Sélectionnez un produit pour comparer les prix entre les différentes enseignes.
                Les prix les plus bas sont marqués en vert 🟢, les plus élevés en rouge 🔴.
              </p>
              {snapshot && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Données du {new Date(snapshot.date_snapshot).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })} • Source : {snapshot.source}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="inline-flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-semibold">Chargement des données...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Filters and Table */}
        {!loading && !error && data.length > 0 && (
          <>
            <ComparateurFilters
              products={getUniqueProducts()}
              communes={getUniqueCommunes()}
              selectedProduct={selectedProduct}
              selectedCommune={selectedCommune}
              onProductChange={setSelectedProduct}
              onCommuneChange={setSelectedCommune}
            />
            
            <ComparateurTable
              data={filteredData}
              selectedProduct={selectedProduct}
            />
          </>
        )}

        {/* No Data State */}
        {!loading && !error && data.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Aucune donnée disponible
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Les données de l'observatoire seront bientôt disponibles.
            </p>
          </div>
        )}

        {/* Transparency Notice */}
        <div className="mt-8 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-l-4 border-yellow-500 rounded-xl p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              ⚠️
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                Transparence sur les données
              </h3>
              <p className="text-sm text-yellow-900 dark:text-yellow-300 mb-2">
                Les prix affichés proviennent de relevés citoyens vérifiés dans le cadre de l'Observatoire des prix.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Pour en savoir plus sur notre méthodologie, consultez notre{' '}
                <a href="/methodologie" className="font-semibold underline hover:text-yellow-600 dark:hover:text-yellow-300">
                  page méthodologie
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            © 2025 A KI PRI SA YÉ - Service public de transparence des prix
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-2">
            Tous droits réservés • <a href="/mentions-legales" className="hover:text-blue-600 dark:hover:text-blue-400">Mentions légales</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
