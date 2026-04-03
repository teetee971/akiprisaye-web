import React, { useState } from 'react';
import { 
  Search, Share2, Facebook, MessageCircle, 
  Copy, Check, Send, Video, ArrowRight 
} from 'lucide-react';

const Home = () => {
  const [search, setSearch] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [copied, setCopied] = useState(false);

  // Mapping complet et respectueux des territoires
  const territoryNames: Record<string, string> = {
    'GP': 'Guadeloupe',
    'MQ': 'Martinique',
    'GF': 'Guyane',
    'RE': 'La Réunion',
    'YT': 'Mayotte',
    'NC': 'Nouvelle-Calédonie',
    'PF': 'Polynésie',
    'SM': 'Saint-Martin'
  };

  const currentName = territoryNames[territory] || "Outre-Mer";

  // Le message s'adapte en temps réel !
  const getShareData = () => ({
    title: 'AkiPrisaye 🛒',
    text: `Regarde ce comparateur de prix en ${currentName} ! Économise sur tes courses. 🏝️`,
    url: 'https://akiprisaye-web.pages.dev',
  });

  const handleShare = async (fallbackUrl: string) => {
    const data = getShareData();
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      window.open(fallbackUrl, '_blank');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareData().url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20">
      {/* Header avec version */}
      <div className="pt-16 px-6 pb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          v4.6.13 • INTER-ILES 🌍
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
        <p className="text-slate-400 text-sm italic">Le comparateur souverain des territoires ultra-marins.</p>
      </div>

      {/* Sélecteur de Territoire */}
      <div className="px-6 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {Object.keys(territoryNames).map(t => (
            <button 
              key={t}
              onClick={() => setTerritory(t)}
              className={`px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${territory === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder={`Chercher un prix en ${currentName}...`}
            className="w-full bg-slate-800/40 border border-slate-700/50 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bloc de Partage Dynamique */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-6 rounded-[2.5rem] border border-slate-700/30 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2 italic">
            <Share2 size={14} className="text-blue-500" /> Propager la solution en {currentName}
          </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <button onClick={() => handleShare(`https://wa.me/?text=${encodeURIComponent(getShareData().text + " " + getShareData().url)}`)} 
                    className="bg-[#25D366] aspect-square rounded-2xl flex items-center justify-center shadow-lg"><MessageCircle size={26} /></button>
            <button onClick={() => handleShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareData().url)}`)} 
                    className="bg-[#1877F2] aspect-square rounded-2xl flex items-center justify-center shadow-lg"><Facebook size={26} /></button>
            <button onClick={() => handleShare(`https://t.me/share/url?url=${encodeURIComponent(getShareData().url)}&text=${encodeURIComponent(getShareData().text)}`)} 
                    className="bg-[#0088cc] aspect-square rounded-2xl flex items-center justify-center shadow-lg"><Send size={26} /></button>
            <button onClick={() => handleShare('https://www.tiktok.com/')} 
                    className="bg-black border border-slate-700 aspect-square rounded-2xl flex items-center justify-center shadow-lg"><Video size={26} /></button>
          </div>

          <button onClick={copyToClipboard} className="w-full bg-slate-950/50 p-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700/50 active:bg-blue-600 transition-all">
            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} className="text-slate-400" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{copied ? "Copié !" : "Copier le lien"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
