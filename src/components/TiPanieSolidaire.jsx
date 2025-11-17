/**
 * TiPanieSolidaire Component
 * 
 * Solidarity basket feature for sharing unsold items and local produce
 * Connects users with local producers and solidarity initiatives
 */

import { useState, useEffect } from 'react';
import { Card } from './card.jsx';

export function TiPanieSolidaire({ territoire = null }) {
  const [paniers, setPaniers] = useState([]);
  const [producteurs, setProducteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('paniers'); // 'paniers' or 'producteurs'

  useEffect(() => {
    fetchData();
  }, [territoire]);

  /**
   * Fetch solidarity baskets and local producers
   * TODO: Connect to Firestore collections
   */
  async function fetchData() {
    setLoading(true);

    try {
      // TODO: PRODUCTION IMPLEMENTATION
      // const db = getFirestore();
      // 
      // // Fetch solidarity baskets
      // const paniersRef = collection(db, 'paniers');
      // const paniersQuery = territoire 
      //   ? query(paniersRef, where('territoire', '==', territoire), where('available', '==', true))
      //   : query(paniersRef, where('available', '==', true));
      // const paniersSnapshot = await getDocs(paniersQuery);
      // const paniersData = paniersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      //
      // // Fetch local producers
      // const producteursRef = collection(db, 'producteurs');
      // const producteursQuery = territoire
      //   ? query(producteursRef, where('territoire', '==', territoire), where('active', '==', true))
      //   : query(producteursRef, where('active', '==', true));
      // const producteursSnapshot = await getDocs(producteursQuery);
      // const producteursData = producteursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Mock data for development
      const mockPaniers = [
        {
          id: '1',
          titre: 'Panier Légumes Bio 🥬',
          description: 'Légumes de saison cultivés localement sans pesticides',
          prix: 12.50,
          prixHabituel: 18.00,
          economie: 5.50,
          territoire: 'GP',
          producteur: 'Ferme Ti Jardin',
          disponible: 5,
          type: 'bio',
          image: null,
        },
        {
          id: '2',
          titre: 'Panier Fruits Tropicaux 🍌',
          description: 'Bananes, mangues, ananas et fruits de la passion',
          prix: 10.00,
          prixHabituel: 15.00,
          economie: 5.00,
          territoire: 'GP',
          producteur: 'Coopérative Péyi',
          disponible: 8,
          type: 'local',
          image: null,
        },
        {
          id: '3',
          titre: 'Panier Anti-Gaspi 🌿',
          description: 'Invendus du jour, produits frais à consommer rapidement',
          prix: 5.00,
          prixHabituel: 12.00,
          economie: 7.00,
          territoire: 'GP',
          producteur: 'Supermarché Solidaire',
          disponible: 3,
          type: 'antigaspi',
          image: null,
        },
      ];

      const mockProducteurs = [
        {
          id: '1',
          nom: 'Ferme Ti Jardin',
          description: 'Agriculture biologique, légumes de saison',
          territoire: 'GP',
          adresse: 'Capesterre-Belle-Eau',
          telephone: '0590 XX XX XX',
          email: 'contact@tijardin.gp',
          specialites: ['Légumes bio', 'Fruits tropicaux', 'Herbes aromatiques'],
          certification: 'Agriculture Biologique',
          image: null,
        },
        {
          id: '2',
          nom: 'Coopérative Péyi',
          description: 'Regroupement de 15 producteurs locaux',
          territoire: 'GP',
          adresse: 'Pointe-à-Pitre',
          telephone: '0590 YY YY YY',
          email: 'coop@peyi.gp',
          specialites: ['Fruits', 'Légumes', 'Épices'],
          certification: 'Label Local',
          image: null,
        },
      ];

      setPaniers(mockPaniers);
      setProducteurs(mockProducteurs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          ❤️ Ti Panié Solidaire
        </h2>
        <p className="text-green-50">
          Consommez local, soutenez les producteurs, réduisez le gaspillage
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('paniers')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'paniers'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          🛒 Paniers disponibles
        </button>
        <button
          onClick={() => setActiveTab('producteurs')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'producteurs'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          🌱 Producteurs locaux
        </button>
      </div>

      {/* Paniers Tab */}
      {activeTab === 'paniers' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paniers.map(panier => (
            <Card key={panier.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{panier.titre}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    panier.type === 'bio' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : panier.type === 'antigaspi'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                  }`}>
                    {panier.type === 'bio' ? 'BIO' : panier.type === 'antigaspi' ? 'ANTI-GASPI' : 'LOCAL'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {panier.description}
                </p>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {panier.prix.toFixed(2)}€
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {panier.prixHabituel.toFixed(2)}€
                    </span>
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    💰 Économie : {panier.economie.toFixed(2)}€
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>📍 {panier.producteur}</div>
                  <div>📦 Disponible : {panier.disponible} panier{panier.disponible > 1 ? 's' : ''}</div>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors">
                  Réserver ce panier
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Producteurs Tab */}
      {activeTab === 'producteurs' && (
        <div className="grid gap-4 md:grid-cols-2">
          {producteurs.map(producteur => (
            <Card key={producteur.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{producteur.nom}</h3>
                  {producteur.certification && (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                      ✓ {producteur.certification}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {producteur.description}
                </p>

                <div className="space-y-1 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    📍 {producteur.adresse}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    📞 {producteur.telephone}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    ✉️ {producteur.email}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Spécialités :
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {producteur.specialites.map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
                  Voir les produits
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-sm text-green-800 dark:text-green-200">
          🌱 En choisissant les paniers solidaires, vous soutenez l'économie locale, 
          réduisez le gaspillage alimentaire et faites des économies. Ensemble, 
          luttons contre la vie chère !
        </p>
      </div>
    </div>
  );
}
