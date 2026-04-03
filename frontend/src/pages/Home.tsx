import React, { useState } from 'react';
import { 
  Search, MapPin, Share2, Facebook, MessageCircle, 
  Copy, Check, Send, Video, ArrowRight 
} from 'lucide-react';

const Home = () => {
  const [search, setSearch] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareTitle = "AkiPrisaye : Compare les prix en Guadeloupe ! 🛒";

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        window.prompt('Copiez ce lien :', shareUrl);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      window.prompt('Copiez ce lien :', shareUrl);
    }
  };

  const shareLinks = [
    { name: 'WhatsApp', icon: <MessageCircle size={22} />, color: 'bg-[#25D366]', link: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}` },
    { name: 'Facebook', icon: <Facebook size={22} />, color: 'bg-[#1877F2]', link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'Telegram', icon: <Send size={22} />, color: 'bg-[#0088cc]', link: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}` },
    { name: 'TikTok', icon: <Video size={22} />, color: 'bg-black border border-slate-700', link: `https://www.tiktok.com/@akiprisaye` }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20">
      {/* Hero Section */}
      <div className="pt-16 px-6 pb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          VERSION 4.6.5 SOUVERAINE
        </div>
        <h1 className="text-5xl font-black tracking-tight italic">AKI PRI SA YÉ</h1>
        <p className="text-slate-400 max-w-xs mx-auto">Ton allié contre la vie chère en Guadeloupe. Scanne, compare, économise.</p>
      </div>

      {/* Moteur de Recherche Restauré */}
      <div className="px-6 space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Chercher un produit (ex: Lait, Riz...)"
            className="w-full bg-slate-800/50 border border-slate-700 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['GP', 'MQ', 'GF', 'RE'].map(t => (
            <button 
              key={t}
              onClick={() => setTerritory(t)}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${territory === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de Partage Sociale */}
      <div className="mt-10 px-6">
        <div className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
            <Share2 size={14} className="text-blue-500" /> Propager le projet
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {shareLinks.map((s) => (
              <a
                key={s.name}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Partager via ${s.name} (ouvre dans un nouvel onglet)`}
                title={`Partager via ${s.name}`}
                className={`${s.color} aspect-square rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all`}
              >
                {s.icon}
              </a>
            ))}
          </div>
          <button onClick={copyToClipboard} className="w-full bg-slate-900/80 p-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700/50 active:bg-blue-600 transition-all">
            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{copied ? "Copié !" : "Copier le lien"}</span>
          </button>
        </div>
      </div>

      {/* Accès Créateur Rapide */}
      <div className="mt-8 px-6 text-center">
        <button onClick={() => window.location.href='/connexion'} className="text-slate-500 text-xs font-medium hover:text-blue-400 flex items-center justify-center gap-2 mx-auto">
          Espace Créateur <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Home;
