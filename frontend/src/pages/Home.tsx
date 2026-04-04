import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, ShieldCheck, Loader2, Navigation, Trash2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { products, loading, clearDB } = useApp();
  const [filter, setFilter] = useState('Tous');
  const navigate = useNavigate();

  const categories = ['Tous', 'Frais', 'Viande', 'Épicerie', 'Produit Laitier'];
  const filteredProducts = filter === 'Tous' ? products : products.filter((p: any) => p.category === filter);

  return (
    <div id="root" className="min-h-screen bg-[#020617] text-white pb-32">
      <div className="pt-16 px-8 flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter">Aki OS</h1>
        <button
          onClick={clearDB}
          aria-label="Vider la base locale"
          className="p-3 bg-red-500/10 text-red-500 rounded-full active:scale-90 transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="px-8 mt-10 space-y-8">
          {/* FILTRES SOUVERAINS */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === cat ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <section className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-[2.5rem] p-8">
            <p className="text-2xl font-black mb-4">Base de données <span className="text-emerald-400">locale active</span>.</p>
            <div className="text-[10px] font-bold text-slate-400 uppercase">{products.length} articles synchronisés</div>
          </section>

          <div className="grid gap-4">
            {filteredProducts.map((p: any) => (
              <div key={p.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center animate-in fade-in slide-in-from-right-4">
                <div>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">{p.category} • {p.shop}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-400">{p.price}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation OLED */}
      <div className="fixed bottom-10 left-10 right-10 h-16 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-around z-50 shadow-2xl">
         <button className="text-blue-400"><Zap size={22}/></button>
         <button onClick={() => navigate('/scan')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center -mt-6 border-4 border-[#020617] shadow-xl"><Navigation size={24} /></button>
         <button className="text-slate-500"><Filter size={22}/></button>
      </div>
    </div>
  );
};

export default Home;
