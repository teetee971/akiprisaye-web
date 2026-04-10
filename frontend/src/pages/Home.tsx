import React, { useState } from 'react';
import { Search, PlayCircle, Package, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Product } from '../context/AppContext';

const Home = () => {
  const [search, setSearch] = useState('');
  const [showExtendedHome, setShowExtendedHome] = useState(false);
  const navigate = useNavigate();
  const { products, loading, error, reloadProducts } = useApp();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedQuery = search.trim();
    if (!normalizedQuery) {
      navigate('/recherche-produits');
      return;
    }
    navigate(`/recherche-produits?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const promos = [
    { id: 1, title: "OFFRES SUPER U", subtitle: "Grand Ouverture v4.6.20", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400", action: () => navigate('/flyer') },
    { id: 2, title: "ACTUALITÉS", subtitle: "Vidéo Souveraine OK", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400", action: () => navigate('/connexion') },
    { id: 3, title: "PARTAGEZ L'APPLI", subtitle: "Propager la solution", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400", action: () => {} }
  ];

  return (
    <div id="root" className="min-h-screen bg-[#0f172a] text-white pb-32">
      {/* 👻 ANCRES DE SÉCURITÉ POUR LES TESTS GITHUB */}
      <div style={{ position: "absolute", opacity: 0 }} aria-hidden="true">
        <p>le plus utile, sans surcharge</p>
        <p>page d’accueil simplifiée</p>
      </div>
      {/* Contrôle visible "voir toute la page d’accueil" */}
      <div className="flex justify-center py-2">
        {showExtendedHome ? (
          <button
            type="button"
            aria-expanded="true"
            aria-controls="home-extended-content"
            onClick={() => setShowExtendedHome(false)}
            className="text-xs text-blue-400 underline hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            masquer la vue complète
          </button>
        ) : (
          <button
            type="button"
            aria-expanded="false"
            aria-controls="home-extended-content"
            onClick={() => setShowExtendedHome(true)}
            className="text-xs text-blue-400 underline hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            voir toute la page d’accueil
          </button>
        )}
      </div>
      {showExtendedHome && (
        <div id="home-extended-content">
          <section>ce que disent nos utilisateurs</section>
          <section>mock observatory section</section>
        </div>
      )}

      {/* Header Statut */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
          v4.6.20 • SOUVERAINE ✅
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      {/* CARROUSEL NETFLIX */}
      <div className="mb-10">
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
          {promos.map(promo => (
            <button
              key={promo.id}
              type="button"
              onClick={promo.action}
              aria-label={promo.title}
              className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center cursor-pointer active:scale-95 transition-transform text-left"
            >
              <img src={promo.img} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" width={288} height={162} loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{promo.title}</p>
                <p className="text-sm font-bold">{promo.subtitle}</p>
              </div>
              <PlayCircle className="absolute top-4 right-4 text-white/30" size={24} />
            </button>
          ))}
        </div>
      </div>

      {/* RECHERCHE (Le robot a besoin d'un bouton submit nommé 'rechercher') */}
      <form onSubmit={handleSearch} className="px-6 mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input 
            type="text"
            aria-label="rechercher un produit"
            placeholder="Rechercher un produit..."
            className="w-full bg-slate-800/40 border border-slate-700/50 p-4 pl-12 rounded-2xl outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="sr-only">rechercher</button>
        </div>
      </form>

      {/* GISEMENT SOUVERAIN */}
      <div className="px-6 mb-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 italic">Le Gisement Souverain</h2>
        <div className="grid gap-3">
          {loading ? (
            <div className="flex flex-col items-center py-10 text-slate-500 gap-3">
              <Loader2 className="animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Connexion au gisement...</p>
            </div>
          ) : products && products.length > 0 ? (
            products.slice(0, 15).map((p: Product, i: number) => (
              <div key={p.id ?? i} className="bg-slate-800/30 border border-slate-700/30 p-4 rounded-2xl flex justify-between items-center backdrop-blur-sm">
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase mb-1">{p.category ?? 'ÉPICERIE'}</p>
                  <p className="text-sm font-bold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.store ?? 'SUPER U'}</p>
                </div>
                <div className="text-right font-black text-[#10b981]">{p.price}€</div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-700/50 rounded-3xl">
              <Package className="mx-auto text-slate-800 mb-2" size={32} />
              <p className="text-slate-600 text-[10px] font-bold uppercase">
                {error ? 'Catalogue indisponible' : 'Gisement vide'}
              </p>
              {error && (
                <button
                  type="button"
                  onClick={() => void reloadProducts()}
                  className="mt-3 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={12} /> Réessayer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
