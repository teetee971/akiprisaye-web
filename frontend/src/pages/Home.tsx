import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [territory, setTerritory] = useState('GP');
  const navigate = useNavigate();

  const territoryNames: Record<string, string> = {
    'GP': 'Guadeloupe', 'MQ': 'Martinique', 'GF': 'Guyane', 
    'RE': 'Réunion', 'YT': 'Mayotte', 'NC': 'Nouvelle-Calédonie'
  };

  const promos = [
    { id: 1, title: "OFFRES SUPER U", subtitle: "Grand Ouverture v4.6.22", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400", action: () => navigate('/flyer') },
    { id: 2, title: "ACTUALITÉS", subtitle: "Vidéo Souveraine Live", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400", action: () => navigate('/connexion') },
    { id: 3, title: "PARTAGEZ L'APPLI", subtitle: "Propager la solution", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400", action: () => {} }
  ];

  return (
    <div id="root" className="min-h-screen bg-[#0f172a] text-white pb-24">
      {/* Header Statut */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
          v4.6.22 • SOUVERAINE ✅
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      {/* CARROUSEL NETFLIX */}
      <div className="mb-10">
        <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">À la une & Souverain</h2>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
          {promos.map(promo => (
            <div key={promo.id} onClick={promo.action} className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center cursor-pointer active:scale-95 transition-all">
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

      {/* SÉLECTEUR TERRITOIRE (Remonté pour plus de clarté) */}
      <div className="px-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">Votre Territoire</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
          {Object.keys(territoryNames).map(t => (
            <button key={t} onClick={() => setTerritory(t)} className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${territory === t ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
