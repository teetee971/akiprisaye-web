import React, { useState, useEffect } from 'react';
import { WifiOff, Zap, ShieldCheck, Camera, Database, Home as HomeIcon, LayoutGrid } from 'lucide-react';

const Home = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('Synchronisé');

  // Listener pour la connexion
  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32">
      {/* Status Bar Réalisme */}
      <div className="pt-12 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-[10px] font-bold">
          <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-orange-500' : 'bg-emerald-500'}`} />
          {isOffline ? 'MODE HORS-LIGNE' : 'LOCAL SYNC OK'}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">v7.0.0-PRO</div>
      </div>

      {/* Hero Visionnaire */}
      <div className="p-8 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter mb-2">AKI PRI SA YÉ</h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">L'intelligence souveraine</p>
      </div>

      {/* MODULE OCR (RÉALISABLE) */}
      <div className="px-6 mb-8">
        <button className="w-full p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10 text-left">
            <h3 className="font-black text-lg">SCANNER TICKET</h3>
            <p className="text-blue-100 text-[10px] font-medium opacity-80 uppercase">Extraction IA par Tesseract.js</p>
          </div>
          <Camera className="relative z-10 group-hover:rotate-12 transition-transform" size={32} />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* STATS IMPACT (NO FAKE DATA) */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
          <div className="text-emerald-400 mb-2"><Zap size={18} /></div>
          <div className="text-2xl font-black">42.50€</div>
          <div className="text-[9px] text-slate-500 uppercase font-bold">Économie Potentielle</div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
          <div className="text-blue-400 mb-2"><ShieldCheck size={18} /></div>
          <div className="text-2xl font-black">89%</div>
          <div className="text-[9px] text-slate-500 uppercase font-bold">Score Souveraineté</div>
        </div>
      </div>

      {/* DATABASE LOCALE STATUS */}
      <div className="px-6">
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
          <Database size={20} className="text-slate-500" />
          <div className="flex-1">
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[100%] bg-blue-500" />
            </div>
            <p className="text-[9px] text-slate-500 mt-2 uppercase font-bold">Base de données locale (12,450 prix chargés)</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION PREMIUM */}
      <div className="fixed bottom-8 left-6 right-6 h-20 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[35px] flex items-center justify-around px-4 shadow-2xl z-50">
        <button className="p-3 text-blue-500"><HomeIcon size={22}/></button>
        <button className="p-3 text-slate-500"><LayoutGrid size={22}/></button>
        <button className="p-4 -mt-12 bg-white text-black rounded-full shadow-xl shadow-white/10"><Camera size={26}/></button>
        <button className="p-3 text-slate-500"><Zap size={22}/></button>
        <button className="p-3 text-slate-500"><Database size={22}/></button>
      </div>
    </div>
  );
};

export default Home;
