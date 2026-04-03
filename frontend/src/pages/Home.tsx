import React, { useState } from 'react';
import { 
  Search, Share2, Facebook, MessageCircle, 
  Copy, Check, Send, Video, ArrowRight 
} from 'lucide-react';

const Home = () => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: 'AkiPrisaye 🛒',
    text: 'Regarde ce comparateur de prix en Guadeloupe ! Économise sur tes courses. 🏝️',
    url: 'https://akiprisaye-web.pages.dev',
  };

  // FONCTION MAGIQUE : Ouvre le menu de partage du téléphone
  const handleShare = async (fallbackUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      window.open(fallbackUrl, '_blank');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20">
      <div className="pt-16 px-6 pb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
          v4.6.10 • Live Mode
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Aki Pri Sa Yé</h1>
      </div>

      <div className="px-6 mb-10">
        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-500 group-focus-within:text-blue-400" size={20} />
          <input 
            type="text"
            placeholder="Chercher un produit..."
            className="w-full bg-slate-800/40 border border-slate-700/50 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6">
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-6 rounded-[2.5rem] border border-slate-700/30 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
            <Share2 size={14} className="text-blue-500" /> Propager la solution
          </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <button onClick={() => handleShare(`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`)} 
                    className="bg-[#25D366] aspect-square rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><MessageCircle size={26} /></button>
            
            <button onClick={() => handleShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`)} 
                    className="bg-[#1877F2] aspect-square rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Facebook size={26} /></button>
            
            <button onClick={() => handleShare(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)} 
                    className="bg-[#0088cc] aspect-square rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Send size={26} /></button>
            
            <button onClick={() => handleShare('https://www.tiktok.com/')} 
                    className="bg-black border border-slate-700 aspect-square rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Video size={26} /></button>
          </div>

          <button onClick={copyToClipboard} className="w-full bg-slate-950/50 p-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700/50 active:bg-blue-600 transition-all">
            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} className="text-slate-400" />}
            <span className="text-xs font-black uppercase tracking-widest">{copied ? "Copié !" : "Copier le lien"}</span>
          </button>
        </div>
      </div>
      
      <div className="mt-10 text-center">
        <a href="/connexion" className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          Espace Admin <ArrowRight size={12} />
        </a>
      </div>
    </div>
  );
};

export default Home;
