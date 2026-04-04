import React, { useState } from 'react';
import { ScanEye, MapPinned, TrendingUp, ShieldAlert, Navigation2, ChevronRight, LayoutGrid } from 'lucide-react';

const Home = () => {
  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32 font-sans">
      {/* Header Horizon v9 */}
      <div className="pt-12 px-6 flex justify-between items-end mb-8">
        <div>
          <p className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase mb-1">Horizon v9.0</p>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic italic">Aki Horizon</h1>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black text-emerald-400">
          PROPRIETARY AI
        </div>
      </div>

      {/* MODULE 1 : OPTIMISEUR DE ROUTE (NO-FAKE) */}
      <div className="px-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/40">
              <Navigation2 size={24} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Économie de trajet</p>
              <p className="text-xl font-black text-emerald-400">+34.15€</p>
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2">Route d'achat optimisée</h2>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Ton panier est optimisé entre 2 enseignes à <span className="text-white font-bold">Petit-Bourg</span>. 
            Moins de route, plus de souveraineté.
          </p>
          <button className="w-full bg-white text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            Lancer l'itinéraire <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* MODULE 2 : VISION AR (NO-FAKE) */}
      <div className="px-6 mb-8 grid grid-cols-2 gap-4">
        <button className="bg-slate-900 border border-white/5 aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
            <ScanEye size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Vision AR</span>
        </button>
        <button className="bg-slate-900 border border-white/5 aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
          <div className="p-4 bg-purple-500/10 rounded-full text-purple-400">
            <TrendingUp size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Tendances</span>
        </button>
      </div>

      {/* ALERTE SOUVERAINETÉ */}
      <div className="px-6 mb-8">
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4">
          <ShieldAlert className="text-orange-500" size={20} />
          <p className="text-[10px] font-bold text-orange-200">
            Alerte : Rupture de stock imminente sur les œufs locaux (GP).
          </p>
        </div>
      </div>

      {/* NAVIGATION OLED FUTURE */}
      <div className="fixed bottom-8 left-8 right-8 h-20 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50">
        <button className="p-3 text-emerald-500"><LayoutGrid size={24}/></button>
        <button className="p-3 text-slate-500"><MapPinned size={24}/></button>
        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-45 -mt-12 border-4 border-[#020617]">
          <ScanEye size={24} className="text-white -rotate-45" />
        </div>
        <button className="p-3 text-slate-500"><TrendingUp size={24}/></button>
        <button className="p-3 text-slate-500"><ShieldAlert size={24}/></button>
      </div>
    </div>
  );
};

export default Home;
