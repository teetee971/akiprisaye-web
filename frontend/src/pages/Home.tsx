import React, { useState } from 'react';
import { PlayCircle, Home as HomeIcon, BarChart3, Leaf, User, TrendingDown, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [territory, setTerritory] = useState('GP');
  const navigate = useNavigate();

  // Simulation de l'IA Prédictive
  const aiPrediction = {
    product: "Huile de tournesol",
    trend: "down",
    saving: "12%",
    message: "Attendez mardi : baisse prévue de 0.45€"
  };

  const territoryData: Record<string, {name: string, flag: string}> = {
    'GP': { name: 'Guadeloupe', flag: '🇬🇵' },
    'MQ': { name: 'Martinique', flag: '🇲🇶' },
    'GF': { name: 'Guyane', flag: '🇬🇫' },
    'RE': { name: 'Réunion', flag: '🇷🇪' }
  };

  const promos = [
    { id: 1, title: "PRODUCTEUR LOCAL", score: 98, subtitle: "Banane Cavendish GP", price: "1.20€/kg", img: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=400" },
    { id: 2, title: "OFFRE SOUVERAINE", score: 85, subtitle: "Poulet Frais Pays", price: "8.50€/kg", img: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=400" }
  ];

  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32 font-sans">
      {/* Header Statut Visionnaire */}
      <div className="pt-12 px-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 animate-pulse">
          v5.0 • IA & SOUVERAINETÉ 🚀
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Aki Pri Sa Yé
        </h1>
      </div>

      {/* PILLIER 1 : IA PRÉDICTIVE (Notification) */}
      <div className="px-6 mb-8">
        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-blue-950/20">
          <div className="bg-blue-600 p-2 rounded-xl">
            <TrendingDown size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Conseil Aki-IA</p>
            <p className="text-xs font-medium text-slate-200">{aiPrediction.message}</p>
          </div>
          <div className="text-emerald-400 font-black text-xs">-{aiPrediction.saving}</div>
        </div>
      </div>

      {/* PILLIER 2 : CARROUSEL AVEC SCORE D'IMPACT */}
      <div className="mb-10">
        <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">Recommandations Locales</h2>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
          {promos.map(promo => (
            <div key={promo.id} className="relative flex-none w-64 aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 snap-center">
              <img src={promo.img} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
              
              {/* Badge Impact Local */}
              <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-xl">
                <ShieldCheck size={10} /> {promo.score}% IMPACT
              </div>

              <div className="absolute bottom-6 left-5 right-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{promo.title}</p>
                <h3 className="text-lg font-bold leading-tight mb-2">{promo.subtitle}</h3>
                <div className="flex justify-between items-center">
                   <span className="text-emerald-400 font-black">{promo.price}</span>
                   <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all">
                     <PlayCircle size={20} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SÉLECTEUR TERRITOIRE AVEC DRAPEAUX */}
      <div className="px-6 mb-12">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {Object.entries(territoryData).map(([code, data]) => (
            <button key={code} onClick={() => setTerritory(code)} className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all border ${territory === code ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
              <span>{data.flag}</span> {code}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM NAV BAR PREMIUM */}
      <div className="fixed bottom-6 left-6 right-6 h-20 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-around px-2 shadow-2xl z-50">
        <button className="flex flex-col items-center gap-1 text-blue-400"><HomeIcon size={20}/><span className="text-[10px] font-bold">Home</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><BarChart3 size={20}/><span className="text-[10px] font-bold">Aki-IA</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><Leaf size={20}/><span className="text-[10px] font-bold">Souverain</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><User size={20}/><span className="text-[10px] font-bold">Moi</span></button>
      </div>
    </div>
  );
};

export default Home;
