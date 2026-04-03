import React, { useState } from 'react';
import { 
  Search, Share2, Facebook, MessageCircle, 
  Copy, Check, Send, Video, ArrowRight, PlayCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [search, setSearch] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const territoryNames: Record<string, string> = {
    'GP': 'Guadeloupe', 'MQ': 'Martinique', 'GF': 'Guyane', 
    'RE': 'Réunion', 'YT': 'Mayotte', 'NC': 'Nouvelle-Calédonie'
  };

  const currentName = territoryNames[territory] || "Outre-Mer";

  const promos = [
    { id: 1, title: "OFFRES SUPER U", subtitle: "Grand Ouverture v4.6.18", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400", action: () => navigate('/flyer') },
    { id: 2, title: "ACTUALITÉS", subtitle: "Voir la vidéo souveraine", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400", action: () => navigate('/connexion') },
    { id: 3, title: "PARTAGEZ L'APPLI", subtitle: "Propager la solution", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400", action: () => {} }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-24">
      {/* Header Statut */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
          v4.6.18 • SOUVERAINE ✅
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      {/* CARROUSEL STYLE NETFLIX */}
      <div className="mb-10">
        <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">À la une & Souverain</h2>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
          {promos.map(promo => (
            <div key={promo.id} onClick={promo.action} className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center active:scale-95 transition-all shadow-2xl">
              <img src={promo.img} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{promo.title}</p>
                <h3 className="text-sm font-bold">{promo.subtitle}</h3>
              </div>
              <PlayCircle className="absolute top-4 right-4 text-white/50" size={24} />
            </div>
          ))}
        </div>
      </div>

      {/* RECHERCHE (Fixé pour passer le test CI) */}
      <div className="px-6 mb-10">
        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input 
            type="text"
            role="textbox"
            aria-label="rechercher un produit"
            placeholder={`Rechercher un produit en ${currentName}...`}
            className="w-full bg-slate-800/40 border border-slate-700/50 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* SELECTEUR TERRITOIRE */}
      <div className="px-6 flex gap-2 overflow-x-auto mb-10 scrollbar-hide">
        {Object.keys(territoryNames).map(t => (
          <button key={t} onClick={() => setTerritory(t)} className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${territory === t ? 'bg-blue-600 shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
