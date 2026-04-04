import React, { useState } from 'react';
import { ShieldCheck, Cpu, Users, Wallet, Repeat, ArrowUpRight, Radar } from 'lucide-react';

const Home = () => {
  return (
    <div id="root" className="min-h-screen bg-[#050505] text-white pb-40 font-sans selection:bg-emerald-500/30">
      {/* Header 2031 Legacy */}
      <div className="pt-16 px-8 flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Aki OS</h1>
          <p className="text-[10px] font-black text-emerald-500 tracking-[0.5em] uppercase mt-2">Sovereign Legacy v10.0</p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse" />
          <Cpu size={32} className="relative text-emerald-400" />
        </div>
      </div>

      {/* MODULE 1 : AUTOPILOTE BANCAIRE */}
      <div className="px-8 mb-10">
        <div className="bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-950/20">
          <div className="flex justify-between items-center mb-6">
            <Wallet className="text-emerald-500" size={24} />
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">LIVE FEED</span>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Économie Passive (24h)</p>
          <div className="text-5xl font-black mb-4">+12.80€</div>
          <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase">
             <span className="text-emerald-500">8 Matchs Auto</span> • <span>3 Erreurs de prix bloquées</span>
          </div>
        </div>
      </div>

      {/* MODULE 2 : RADAR P2P (COMMUNAUTÉ) */}
      <div className="px-8 mb-10">
        <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
          <Radar className="absolute -right-4 -top-4 text-white/5" size={120} />
          <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
             <Users size={20} className="text-blue-500" /> Radar Voisinage
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
              <div className="text-xs">
                <p className="font-bold">Mme. Clotilde (971)</p>
                <p className="text-slate-500 text-[10px]">Besoin : Farine x3 (Super U)</p>
              </div>
              <div className="text-emerald-400 font-black text-xs">+2.50€</div>
            </div>
            <button className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
              Accepter la mission
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER STATS SOUVERAINETÉ */}
      <div className="px-8 grid grid-cols-2 gap-4">
        <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl">
          <Repeat className="text-blue-400 mb-2" size={20} />
          <p className="text-2xl font-black">74%</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase">Autosuffisance</p>
        </div>
        <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl">
          <ShieldCheck className="text-emerald-400 mb-2" size={20} />
          <p className="text-2xl font-black">9.8</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase">Score Résilience</p>
        </div>
      </div>

      {/* NAVIGATION DU FUTUR (TOTAL BLACK OLED) */}
      <div className="fixed bottom-10 left-10 right-10 h-24 bg-black border border-white/10 rounded-[3rem] flex items-center justify-around px-6 shadow-[0_0_50px_rgba(0,0,0,1)] z-50">
        <button className="p-4 text-emerald-500 bg-emerald-500/10 rounded-full"><Cpu size={28}/></button>
        <button className="p-4 text-slate-700 hover:text-white transition-colors"><Wallet size={28}/></button>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center -mt-20 shadow-2xl shadow-white/10">
          <div className="w-8 h-8 bg-black rounded-full animate-pulse" />
        </div>
        <button className="p-4 text-slate-700 hover:text-white transition-colors"><Users size={28}/></button>
        <button className="p-4 text-slate-700 hover:text-white transition-colors"><ArrowUpRight size={28}/></button>
      </div>
    </div>
  );
};

export default Home;
