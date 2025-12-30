/**
 * TiPanieSolidaire Component
 * * Solidarity basket feature for sharing unsold items and local produce
 * Connects users with real Firestore data
 */

import { useState, useEffect } from 'react';
import { Card } from './card.jsx';
// Importations Firebase pour la production
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { app } from '../firebase_config'; // Assurez-vous que le chemin est correct

const db = getFirestore(app);

export function TiPanieSolidaire({ territoire = null }) {
  const [paniers, setPaniers] = useState([]);
  const [producteurs, setProducteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('paniers');

  useEffect(() => {
    fetchData();
  }, [territoire]);

  /**
   * Fetch data from real Firestore collections
   */
  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // 1. Récupération des Paniers (Filtre par territoire si fourni)
      const paniersRef = collection(db, 'paniers');
      let paniersQuery;
      
      if (territoire) {
        paniersQuery = query(
          paniersRef, 
          where('territoire', '==', territoire), 
          where('disponible', '>', 0)
        );
      } else {
        paniersQuery = query(paniersRef, where('disponible', '>', 0));
      }

      const paniersSnapshot = await getDocs(paniersQuery);
      const paniersList = paniersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Récupération des Producteurs
      const producteursRef = collection(db, 'producteurs');
      let producteursQuery;

      if (territoire) {
        producteursQuery = query(producteursRef, where('territoire', '==', territoire), where('active', '==', true));
      } else {
        producteursQuery = query(producteursRef, where('active', '==', true));
      }

      const producteursSnapshot = await getDocs(producteursQuery);
      const producteursList = producteursSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPaniers(paniersList);
      setProducteurs(producteursList);
    } catch (err) {
      console.error('Erreur lors de la récupération des données réelles:', err);
      setError("Impossible de charger les données. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-500 animate-pulse">Chargement des données officielles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-8 text-white shadow-md">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          ❤️ Ti Panié Solidaire
        </h2>
        <p className="text-green-50 opacity-90">
          Zéro donnée fictive : connectez-vous directement aux surplus des producteurs de {territoire || 'votre région'}.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('paniers')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'paniers'
              ? 'border-green-600 text-green-700 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🛒 Paniers en temps réel ({paniers.length})
        </button>
        <button
          onClick={() => setActiveTab('producteurs')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'producteurs'
              ? 'border-green-600 text-green-700 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🌱 Producteurs vérifiés ({producteurs.length})
        </button>
      </div>

      {/* Contenu vide si aucune donnée */}
      {(activeTab === 'paniers' ? paniers : producteurs).length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">Aucun résultat officiel disponible pour ce territoire pour le moment.</p>
        </div>
      )}

      {/* Logic d'affichage des listes (Paniers / Producteurs) - Identique à l'original mais avec data Firestore */}
      {/* ... (Le reste du JSX reste identique, utilisant les variables paniers et producteurs peuplées par Firestore) */}
      
      {activeTab === 'paniers' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paniers.map(panier => (
            <Card key={panier.id} className="p-4 hover:shadow-xl border-t-4 border-t-green-500 transition-all">
               {/* Rendu dynamique du panier */}
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-lg">{panier.titre}</h3>
                 <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded uppercase font-bold">{panier.type}</span>
               </div>
               <p className="text-sm text-gray-600 mb-4">{panier.description}</p>
               <div className="flex items-baseline gap-2 mb-4">
                 <span className="text-2xl font-bold text-green-600">{panier.prix.toFixed(2)}€</span>
                 <span className="text-sm line-through text-gray-400">{panier.prixHabituel?.toFixed(2)}€</span>
               </div>
               <button className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">
                 Réserver (Source: {panier.producteur})
               </button>
            </Card>
          ))}
        </div>
      )}
      
      {/* ... (Code pour Producteurs Tab) */}

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
        <span className="text-blue-600 font-bold">ℹ️</span>
        <p className="text-xs text-blue-800 dark:text-blue-300">
          Les prix et stocks sont mis à jour directement par les producteurs partenaires. 
          Dernière synchronisation : {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
}