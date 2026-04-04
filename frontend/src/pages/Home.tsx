import React, { useState } from 'react';
import { Camera, Home as HomeIcon, Zap, Leaf, User, BrainCircuit, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32">
      {/* Vision 2029 Header */}
      <div className="pt-12 px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <BrainCircuit size={12} /> PROTOCOLE v6.0 • 2029 VISION
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      {/* ACTION PRINCIPALE : SCANNER AR */}
      <div className="px-6 mb-10">
        <button className="w-full aspect-[16/7] rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 p-[1px] shadow-2xl shadow-blue-900/40 group overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600')] opacity-20 group-hover:scale-110 transition-transform duration-700" />
          <div className="h-full w-full bg-[#020617]/40 backdrop-blur-md rounded-[23px] flex flex-col items-center justify-center gap-2 relative z-10">
            <Camera size={32} className="text-white animate-bounce" />
            <span className="text-sm font-black tracking-widest uppercase">Scanner le Rayon (AR)</span>
            <span className="text-[10px] text-blue-300 font-medium">Analyse IA en temps réel</span>
          </div>
        </button>
      </div>

      {/* SMART ADVICE : IA PRÉDICTIVE */}
      <div className="px-6 mb-10">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={40} /></div>
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Optimisation de ton Panier</h2>
          <p className="text-lg font-bold leading-tight mb-4">Économise <span className="text-emerald-400">54,20€</span> sur tes courses ce samedi.</p>
          <button className="flex items-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all">
            Voir le plan de route <Navigation size={14} />
          </button>
        </div>
      </div>

      {/* NAVIGATION 2029 (OLED OPTIMIZED) */}
      <div className="fixed bottom-8 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[40px] flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <button className="p-3 text-blue-500 bg-blue-500/10 rounded-2xl"><HomeIcon size={22}/></button>
        <button className="p-3 text-slate-500 hover:text-white transition-colors"><Zap size={22}/></button>
        <button className="p-4 -mt-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-600/40 border-4 border-[#020617]"><Camera size={26} className="text-white"/></button>
        <button className="p-3 text-slate-500 hover:text-white transition-colors"><Leaf size={22}/></button>
        <button className="p-3 text-slate-500 hover:text-white transition-colors"><User size={22}/></button>
      </div>
    </div>
  );
};

export default Home;
