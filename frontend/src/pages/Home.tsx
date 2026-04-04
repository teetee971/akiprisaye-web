import React, { useState } from 'react';
import { PlayCircle, Home as HomeIcon, BarChart2, BookOpen, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [territory, setTerritory] = useState('GP');
  const navigate = useNavigate();

  const territoryData: Record<string, {name: string, flag: string}> = {
    'GP': { name: 'Guadeloupe', flag: '🇬🇵' },
    'MQ': { name: 'Martinique', flag: '🇲🇶' },
    'GF': { name: 'Guyane', flag: '🇬🇫' },
    'RE': { name: 'Réunion', flag: '🇷🇪' },
    'YT': { name: 'Mayotte', flag: '🇾🇹' }
  };

  const promos = [
    { id: 1, title: "OFFRES SUPER U", subtitle: `Exclusivité ${territory}`, img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400", action: () => navigate('/flyer') },
    { id: 2, title: "ACTUALITÉS", subtitle: "Le JT Souverain", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400", action: () => navigate('/connexion') }
  ];

  return (
    <div id="root" className="min-h-screen bg-[#0f172a] text-white pb-32">
      {/* Header Statut */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
          v4.6.23 • PREMIUM ✅
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      {/* CARROUSEL */}
      <div className="mb-10">
        <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">À la une</h2>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
          {promos.map(promo => (
            <div key={promo.id} onClick={promo.action} className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center active:scale-95 transition-all">
              <img src={promo.img} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{promo.title}</p>
                <h3 className="text-sm font-bold">{promo.subtitle}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TERRITOIRES AVEC DRAPEAUX */}
      <div className="px-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">Zone de comparaison</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
          {Object.entries(territoryData).map(([code, data]) => (
            <button key={code} onClick={() => setTerritory(code)} className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${territory === code ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'}`}>
              <span className="text-lg">{data.flag}</span>
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM NAV BAR (Fixe) */}
      <div className="fixed bottom-6 left-6 right-6 h-20 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-around px-2 shadow-2xl z-50">
        <button className="flex flex-col items-center gap-1 text-blue-500"><HomeIcon size={20}/><span className="text-[10px] font-bold">Home</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><BarChart2 size={20}/><span className="text-[10px] font-bold">Prix</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500" onClick={() => navigate('/flyer')}><BookOpen size={20}/><span className="text-[10px] font-bold">Flyers</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500" onClick={() => navigate('/connexion')}><User size={20}/><span className="text-[10px] font-bold">Profil</span></button>
      </div>
    </div>
  );
};

export default Home;
