import React, { useState } from 'react';
import { 
  Search, Share2, Facebook, MessageCircle, 
  Copy, Check, Send, Video, ArrowRight 
} from 'lucide-react';

const Home = () => {
  const [search, setSearch] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: 'AkiPrisaye',
    text: 'Regarde ce comparateur de prix en Guadeloupe ! 🛒🏝️',
    url: 'https://akiprisaye-web.pages.dev',
  };

  const handleNativeShare = async (socialName: string, fallbackLink: string) => {
    // Si le téléphone supporte le partage natif (Android/iOS)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Partage annulé ou erreur');
      }
    } else {
      // Sinon, on ouvre le lien classique (fallback)
      window.open(fallbackLink, '_blank');
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          VERSION 4.6.9 SOUVERAINE
        </div>
        <h1 className="text-5xl font-black tracking-tight italic uppercase">Aki Pri Sa Yé</h1>
      </div>

      {/* Moteur de Recherche */}
      <div className="px-6 mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Chercher un produit..."
            className="w-full bg-slate-800/50 border border-slate-700 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Barre de Partage Sociale */}
      <div className="px-6">
        <div className="bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Share2 size={14} className="text-blue-500" /> Partager sur les réseaux
          </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* WhatsApp */}
            <button onClick={() => handleNativeShare('WhatsApp', `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`)} 
                    className="bg-[#25D366] aspect-square rounded-2xl flex items-center justify-center shadow-lg"><MessageCircle size={24} /></button>
            
            {/* Facebook */}
            <button onClick={() => handleNativeShare('Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`)} 
                    className="bg-[#1877F2] aspect-square rounded-2xl flex items-center justify-center shadow-lg"><Facebook size={24} /></button>
            
            {/* Telegram */}
            <button onClick={() => handleNativeShare('Telegram', `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}`)} 
                    className="bg-[#0088cc] aspect-square rounded-2xl flex items-center justify-center shadow-lg"><Send size={24} /></button>
            
            {/* TikTok (Déclenche le menu natif pour pouvoir choisir TikTok dans la liste du tel) */}
            <button onClick={() => handleNativeShare('TikTok', 'https://www.tiktok.com/')} 
                    className="bg-black border border-slate-700 aspect-square rounded-2xl flex items-center justify-center shadow-lg"><Video size={24} /></button>
          </div>

          <button onClick={copyToClipboard} className="w-full bg-slate-900/80 p-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700/50">
            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{copied ? "Lien copié !" : "Copier le lien"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
