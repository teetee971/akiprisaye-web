import React, { useState } from 'react';
import { Search, PlayCircle, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AppContextValue = {
  products?: unknown[];
  loading?: boolean;
} | null;

const useApp = (): AppContextValue => null;
const Home = () => {
  const [search, setSearch] = useState('');
  const [territory, setTerritory] = useState('GP');
  const navigate = useNavigate();

  // On récupère les données avec une sécurité absolue
  const context = useApp();
  const products = context?.products || [];
  const loading = context?.loading ?? true;

  const territoryNames: Record<string, string> = {
    'GP': 'Guadeloupe', 'MQ': 'Martinique', 'GF': 'Guyane', 
    'RE': 'Réunion', 'YT': 'Mayotte', 'NC': 'Nouvelle-Calédonie'
  };

  const promos = [
    { id: 1, title: "OFFRES SUPER U", subtitle: "Grand Ouverture v4.6.20", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400", action: () => navigate('/flyer') },
    { id: 2, title: "ACTUALITÉS", subtitle: "Vidéo Souveraine OK", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400", action: () => navigate('/connexion') },
    { id: 3, title: "PARTAGEZ L'APPLI", subtitle: "Propager la solution", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400", action: () => {} }
  ];

  return (
    <div id="root" className="min-h-screen bg-[#0f172a] text-white pb-32">
      {/* Statut v4.6.20 */}
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
            <div key={promo.id} onClick={promo.action} className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center cursor-pointer active:scale-95 transition-transform">
              <img src={promo.img} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{promo.title}</p>
                <h3 className="text-sm font-bold">{promo.subtitle}</h3>
              </div>
              <PlayCircle className="absolute top-4 right-4 text-white/30" size={24} />
            </div>
          ))}
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="px-6 mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Rechercher un produit..."
            role="textbox" aria-label="rechercher un produit" className="w-full bg-slate-800/40 border border-slate-700/50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500/50 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* GISEMENT (LES 34 ARTICLES) */}
      <div className="px-6 mb-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 italic">Le Gisement Souverain</h2>
        
        <div className="grid gap-3">
          {loading ? (
            <div className="flex flex-col items-center py-10 text-slate-500 gap-3">
              <Loader2 className="animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Connexion au gisement...</p>
            </div>
          ) : Array.isArray(products) && products.length > 0 ? (
            products.slice(0, 15).map((p: any, i: number) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/30 p-4 rounded-2xl flex justify-between items-center backdrop-blur-sm">
                <div>
                  <p className="text-[9px] font-black text-blue-500/60 uppercase mb-1">{p.category || 'ÉPICERIE'}</p>
                  <h4 className="text-sm font-bold text-slate-200">{p.name}</h4>
                  <p className="text-[10px] text-slate-500">{p.store || 'SUPER U'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#10b981]">{p.price}€</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-3xl">
              <Package className="mx-auto text-slate-800 mb-2" size={32} />
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Gisement vide</p>
            </div>
          )}
        </div>
      </div>

      {/* TERRITOIRES */}
      <div className="px-6 flex gap-2 overflow-x-auto scrollbar-hide">
        {Object.keys(territoryNames).map(t => (
          <button key={t} onClick={() => setTerritory(t)} className={`px-5 py-2 rounded-xl font-bold text-xs flex-none ${territory === t ? 'bg-blue-600' : 'bg-slate-800 text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;