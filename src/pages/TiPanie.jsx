import React, { useState, useEffect } from 'react';
import { getBaskets } from '../services/tiPanieService';
import BasketCard from '../ui/BasketCard';
import BasketFilters from '../ui/BasketFilters';

export default function TiPanie() {
  const [baskets, setBaskets] = useState([]);
  const [filters, setFilters] = useState({
    territory: 'all',
    store: '',
    timeSlot: '',
    stockOnly: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBaskets();
  }, [filters]);

  const loadBaskets = async () => {
    setLoading(true);
    try {
      const data = await getBaskets(filters);
      setBaskets(data);
    } catch (error) {
      console.error('Error loading baskets:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = baskets.reduce((sum, b) => sum + (b.originalPrice - b.price), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-blue-400">
            🧺 Ti-Panié Solidaire
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto">
            Luttez contre le gaspillage et économisez ! 
            Découvrez les paniers anti-gaspi des enseignes locales DOM-COM.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{baskets.length}</div>
            <div className="text-slate-400 text-sm">Paniers disponibles</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {totalSavings.toFixed(2)}€
            </div>
            <div className="text-slate-400 text-sm">Économies totales</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">
              {baskets.filter(b => b.stock).length}
            </div>
            <div className="text-slate-400 text-sm">En stock maintenant</div>
          </div>
        </div>

        {/* Filters */}
        <BasketFilters filters={filters} onFilterChange={setFilters} />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-400">Chargement des paniers...</p>
          </div>
        )}

        {/* Baskets Grid */}
        {!loading && baskets.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baskets.map((basket) => (
              <BasketCard key={basket.id} basket={basket} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && baskets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧺</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-300">
              Aucun panier trouvé
            </h3>
            <p className="text-slate-400">
              Essayez de modifier vos filtres pour voir plus de résultats
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-900/20 border border-blue-700/30 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-blue-400 flex items-center">
            <span className="mr-2">ℹ️</span>
            Comment ça marche ?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold mb-1 text-slate-200">Choisissez votre panier</h4>
              <p className="text-slate-400 text-sm">
                Parcourez les paniers anti-gaspi disponibles près de chez vous
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold mb-1 text-slate-200">Vérifiez le créneau</h4>
              <p className="text-slate-400 text-sm">
                Consultez l'horaire de retrait qui vous convient
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold mb-1 text-slate-200">Récupérez en magasin</h4>
              <p className="text-slate-400 text-sm">
                Rendez-vous au magasin pendant le créneau indiqué
              </p>
            </div>
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="mt-8 bg-green-900/20 border border-green-700/30 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-green-400 flex items-center">
            <span className="mr-2">🌱</span>
            Impact écologique
          </h3>
          <p className="text-slate-300 text-sm">
            En choisissant Ti-Panié Solidaire, vous contribuez à réduire le gaspillage alimentaire 
            et soutenez les circuits courts locaux. Ensemble, luttons contre la vie chère tout en 
            préservant notre environnement ! 💚
          </p>
        </div>
      </div>
    </div>
  );
}
