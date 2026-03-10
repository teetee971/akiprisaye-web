import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ComparateurTable from '../components/comparateur/ComparateurTable';
import ComparateurFilters from '../components/comparateur/ComparateurFilters';
import ErrorState from '../components/comparateur/ErrorState';
import DataInfo from '../components/comparateur/DataInfo';

import { SEOHead } from '../components/ui/SEOHead';
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

// Liste de fichiers à essayer dans l'ordre (du plus récent au plus ancien)
const _BASE = import.meta.env.BASE_URL;
const DATA_FILES = [
  `${_BASE}data/observatoire/guadeloupe_2026-03.json`,
  `${_BASE}data/observatoire/guadeloupe_2026-02.json`,
  `${_BASE}data/observatoire/guadeloupe_2026-01.json`,
  `${_BASE}data/observatoire/hexagone_2026-03.json`,
  `${_BASE}data/observatoire/hexagone_2026-02.json`,
  `${_BASE}data/observatoire/hexagone_2026-01.json`,
];

export default function ComparateurCitoyen() {
  const [data, setData] = useState<ObservatoireData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [snapshot, setSnapshot] = useState<ObservatoireSnapshot | null>(null);

  // Charger le snapshot le plus récent avec système de fallback
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo('');

      let lastError: Error | null = null;
      let successfulFile: string | null = null;

      // Essayer chaque fichier dans l'ordre
      for (const file of DATA_FILES) {
        try {
          const response = await fetch(file);
          
          if (!response.ok) {
            // Messages d'erreur spécifiques selon le statut HTTP
            if (response.status === 404) {
              lastError = new Error(`Fichier ${file} introuvable (404).`);
            } else if (response.status === 500) {
              lastError = new Error(`Erreur serveur (500) lors du chargement de ${file}.`);
            } else if (response.status >= 400 && response.status < 500) {
              lastError = new Error(`Erreur client ${response.status}: ${response.statusText}`);
            } else if (response.status >= 500) {
              lastError = new Error(`Erreur serveur ${response.status}: ${response.statusText}`);
            } else {
              lastError = new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            continue; // Essayer le fichier suivant
          }
          
          const jsonData: ObservatoireSnapshot = await response.json();
          
          // Valider la structure des données
          if (!jsonData.donnees || !Array.isArray(jsonData.donnees)) {
            lastError = new Error(`Structure de données invalide dans ${file}`);
            continue;
          }

          // Succès ! Utiliser ces données
          setSnapshot(jsonData);
          setData(jsonData.donnees);
          successfulFile = file;
          
          // Sélectionner le premier produit par défaut
          if (jsonData.donnees.length > 0) {
            setSelectedProduct(jsonData.donnees[0].ean);
          }

          // Données chargées avec succès, sortir de la boucle
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          continue; // Essayer le fichier suivant
        }
      }

      // Si aucun fichier n'a été chargé avec succès
      if (!successfulFile) {
        const errorMessage = 'Impossible de charger les données de l\'observatoire. Tous les fichiers de données sont indisponibles.';
        const debugDetails = `Fichiers tentés: ${DATA_FILES.join(', ')}\nDernière erreur: ${lastError?.message || 'Inconnue'}`;
        
        setError(errorMessage);
        setDebugInfo(debugDetails);
        console.error('Erreur chargement données:', lastError);
      }
    } catch (err) {
      const errorMessage = 'Une erreur inattendue s\'est produite lors du chargement des données.';
      const debugDetails = err instanceof Error ? err.message : String(err);
      
      console.error('Erreur chargement données:', err);
      setError(errorMessage);
      setDebugInfo(debugDetails);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    <>
      <SEOHead
        title="Comparateur citoyen — Comparez les prix dans vos magasins"
        description="Utilisez les données citoyennes pour comparer les prix réels dans les grandes surfaces des DOM-TOM."
        canonical="https://teetee971.github.io/akiprisaye-web/comparateur-citoyen"
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-md border-b border-blue-100 dark:border-slate-700">
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
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>Accueil</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Info Banner */}
        {snapshot && !loading && !error && (
          <DataInfo
            territoire={snapshot.territoire}
            dateSnapshot={snapshot.date_snapshot}
            source={snapshot.source}
            qualite={snapshot.qualite}
          />
        )}

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 rounded-xl p-6 mt-6 mb-6 shadow-md">
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
        {error && !loading && (
          <ErrorState 
            error={error} 
            onRetry={loadData}
            debugInfo={debugInfo}
          />
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
                <Link to="/methodologie" className="font-semibold underline hover:text-yellow-600 dark:hover:text-yellow-300">
                  page méthodologie
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            © 2025 A KI PRI SA YÉ - Service public de transparence des prix
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-2">
            Tous droits réservés • <Link to="/mentions-legales" className="hover:text-blue-600 dark:hover:text-blue-400">Mentions légales</Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
