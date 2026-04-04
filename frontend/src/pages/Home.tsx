import React, { useState } from 'react';
import { PlayCircle, Home as HomeIcon, BarChart2, BookOpen, User, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [territory, setTerritory] = useState('GP');
  const navigate = useNavigate();

  const promos = [
    { id: 1, title: "PRODUCTION LOCALE", score: 95, subtitle: "Tomates de Martinique", img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400", action: () => {} },
    { id: 2, title: "ACTUALITÉS", score: 100, subtitle: "Indice de Souveraineté v5.0", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400", action: () => navigate('/connexion') }
  ];

  return (
    <div id="root" className="min-h-screen bg-[#0f172a] text-white pb-32">
      {/* Header Statut */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
          v5.0 • VISIONNAIRE 🚀
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      {/* CARROUSEL AVEC INDICE IMPACT */}
      <div className="mb-10">
        <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">Impact Territorial</h2>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
          {promos.map(promo => (
            <div key={promo.id} className="relative flex-none w-72 aspect-video rounded-3xl overflow-hidden border border-slate-700/50 snap-center">
              <img src={promo.img} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
              <div className="absolute top-4 left-4 bg-emerald-500 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                <Leaf size={10} /> {promo.score} IMPACT
              </div>
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{promo.title}</p>
                <h3 className="text-sm font-bold">{promo.subtitle}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Basse Premium */}
      <div className="fixed bottom-6 left-6 right-6 h-20 bg-slate-900/90 backdrop-blur-2xl border border-white/5 rounded-3xl flex items-center justify-around px-2 shadow-2xl z-50">
        <button className="flex flex-col items-center gap-1 text-blue-500"><HomeIcon size={20}/><span className="text-[10px] font-bold">Home</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><BarChart2 size={20}/><span className="text-[10px] font-bold">IA Prix</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><Leaf size={20}/><span className="text-[10px] font-bold">Impact</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-500"><User size={20}/><span className="text-[10px] font-bold">Moi</span></button>
      </div>
    </div>
  );
};

export default Home;
