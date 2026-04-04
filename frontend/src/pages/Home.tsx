import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, ShieldCheck, Loader2, Share2, Navigation, Bell } from 'lucide-react';

const Home = () => {
  const { products, loading } = useApp();

  // Fonction pour faire vibrer le téléphone (UX Premium)
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10); // Micro-vibration de 10ms
    }
  };

  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32 animate-in fade-in duration-1000">
      
      {/* Header Statut */}
      <div className="pt-16 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Aki Intelligence</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={triggerHaptic} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90">
            <Bell size={18} className="text-slate-400" />
          </button>
          <button onClick={triggerHaptic} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90">
            <Share2 size={18} className="text-blue-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Connexion au réseau souverain...</p>
        </div>
      ) : (
        <div className="px-8 mt-10 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          
          {/* Widget IA Prédictive */}
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-indigo-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={60} /></div>
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Aki-IA Ready</h2>
            <p className="text-2xl font-black leading-tight mb-6">Optimisation du panier <br/><span className="text-emerald-400">Terminée.</span></p>
            <button 
              onClick={triggerHaptic}
              className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-xl"
            >
              Itinéraire Optimal <Navigation size={16} />
            </button>
          </section>

          {/* Liste Dynamique */}
          <section>
             <div className="flex justify-between items-center mb-6 px-2">
               <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Flux Local</h2>
               <span className="text-[10px] font-bold text-emerald-500">Live</span>
             </div>
             <div className="grid gap-4">
               {products.map((p: any) => (
                 <div 
                  key={p.id} 
                  onClick={triggerHaptic}
                  className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group active:bg-slate-800 transition-all cursor-pointer"
                 >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-slate-100">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.shop} • {p.territory}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-white">{p.price}€</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] font-black text-emerald-500 uppercase">
                        <ShieldCheck size={10} /> {p.impact}%
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>
        </div>
      )}

      {/* Navigation OLED Float */}
      <div className="fixed bottom-10 left-10 right-10 h-16 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
         <button onClick={triggerHaptic} className="p-3 text-blue-400"><Zap size={22}/></button>
         <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-xl -mt-4 border-4 border-[#020617]">
            <Navigation size={20} />
         </div>
         <button onClick={triggerHaptic} className="p-3 text-slate-500"><Share2 size={22}/></button>
      </div>
    </div>
  );
};

export default Home;
