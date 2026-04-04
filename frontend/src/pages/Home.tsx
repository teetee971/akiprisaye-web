import React, { useState } from 'react';
import { Bot, LineChart, Globe, Zap, ArrowRight, ShoppingBag, MessageSquareQuote } from 'lucide-react';

const Home = () => {
  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32 font-sans selection:bg-blue-500/30">
      {/* Header Visionnaire v8 */}
      <div className="pt-12 px-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">Aki Intelligence</h1>
            <p className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase">Sovereign OS v8.0</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-2xl">
            <Bot size={24} className="text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* COMPAGNON IA LOCAL (No-Fake) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-[2rem] p-6 mb-8 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all" />
          <MessageSquareQuote className="text-blue-500 mb-4" size={28} />
          <h2 className="text-xl font-bold mb-2">Dis-moi "Aki..."</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Pose tes questions sur ton budget. L'IA analyse les prix du territoire en temps réel sans connexion.
          </p>
          <div className="flex gap-2">
            <button className="flex-1 bg-white text-black text-[10px] font-black py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-transform">
              Parler à Aki
            </button>
            <button className="px-4 bg-slate-800 rounded-xl">
              <Zap size={16} />
            </button>
          </div>
        </div>

        {/* MODULE TRANSPARENCE TAXES */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-slate-900/40 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observatoire</p>
                <p className="text-sm font-bold text-slate-200">Octroi de Mer : -1.2% ce mois</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-600" />
          </div>
        </div>

        {/* DASHBOARD DE CONSOMMATION */}
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 px-2">Analyse Souveraine</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/40 border border-white/5 p-5 rounded-[2rem]">
            <LineChart size={18} className="text-purple-400 mb-4" />
            <p className="text-2xl font-black tabular-nums">482€</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Budget Moyen / GP</p>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-5 rounded-[2rem]">
            <ShoppingBag size={18} className="text-orange-400 mb-4" />
            <p className="text-2xl font-black tabular-nums">14%</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Part Production Locale</p>
          </div>
        </div>
      </div>

      {/* NAV BAR ULTRA-MINIMALISTE (OLED) */}
      <div className="fixed bottom-8 left-8 right-8 h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-around px-2 shadow-2xl">
         <button className="p-3 text-blue-400"><Bot size={22}/></button>
         <button className="p-3 text-slate-500"><Zap size={22}/></button>
         <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40 -mt-10 border-4 border-[#020617]">
            <Zap size={20} className="text-white" />
         </div>
         <button className="p-3 text-slate-500"><Globe size={22}/></button>
         <button className="p-3 text-slate-500"><LineChart size={22}/></button>
      </div>
    </div>
  );
};

export default Home;
