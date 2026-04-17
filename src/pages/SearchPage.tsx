import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard';

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [userDistance, setUserDistance] = useState(5); // Distance simulée par défaut (km)

  // Simulation d'un catalogue (normalement fetché depuis ton JSON)
  const catalogue = [
    { id: 1, name: "Huile de Tournesol 1L", brand: "Carrefour", price: 2.10 },
    { id: 2, name: "Riz Long Grain 1kg", brand: "Cigalou", price: 1.45 },
    { id: 3, name: "Sucre de Canne", brand: "Marie-Galante", price: 2.75 },
  ];

  const filteredProducts = useMemo(() => {
    return catalogue.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.brand.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <header className="mb-8 pt-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">VOTRE PANIER</h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Arbitrage en temps réel</p>
      </header>

      {/* Barre de recherche épurée */}
      <div className="mb-8">
        <input 
          type="text"
          placeholder="Chercher un article..."
          className="w-full p-5 rounded-3xl border-none shadow-xl shadow-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-medium"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Ajustement de la distance (pour tester l'arbitrage) */}
      <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase">Ma distance du magasin : {userDistance} km</label>
        <input 
          type="range" min="1" max="50" value={userDistance}
          onChange={(e) => setUserDistance(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
        />
      </div>

      {/* Liste des résultats */}
      <div className="space-y-4">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            userDistance={userDistance} 
          />
        ))}
      </div>
      
      {query && filteredProducts.length === 0 && (
        <div className="text-center py-10 opacity-40">
          <p className="font-bold">Aucun résultat pour "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
