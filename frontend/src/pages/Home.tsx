import React, { useState } from 'react';
import { 
  Share2, Facebook, Twitter, MessageCircle, 
  Copy, Check, Send, Video 
} from 'lucide-react';

const Home = () => {
  const [copied, setCopied] = useState(false);
  const shareUrl = "https://akiprisaye-web.pages.dev";
  const shareTitle = "AkiPrisaye : Le comparateur de prix n°1 en Guadeloupe ! 🛒🇬🇵";
  const tiktokProfile = "https://www.tiktok.com/@akiprisaye"; // Remplace par ton vrai lien TikTok

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      color: 'bg-[#25D366]',
      link: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook size={24} />,
      color: 'bg-[#1877F2]',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Telegram',
      icon: <Send size={24} />,
      color: 'bg-[#0088cc]',
      link: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'TikTok',
      icon: <Video size={24} />, // Icône vidéo pour TikTok
      color: 'bg-[#000000] border border-slate-700',
      link: tiktokProfile
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-md mx-auto space-y-8 pt-12 pb-24">
        
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-block p-1 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-500 mb-2">
            <div className="bg-[#0f172a] rounded-xl px-4 py-1">
              <span className="text-xs font-bold text-blue-400">VERSION 4.6.4</span>
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            AkiPrisaye
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Économisez sur vos courses <br/>en Guadeloupe. 🏝️
          </p>
        </div>

        {/* Section Partage & Réseaux */}
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Share2 size={18} className="text-blue-500" /> Propager l'appli
            </h2>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {shareLinks.map((social) => (
              <a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-90 transition-all`}
              >
                {social.icon}
                <span className="text-[10px] font-bold uppercase">{social.name}</span>
              </a>
            ))}
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full bg-slate-900/50 hover:bg-slate-900 text-slate-300 py-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700/50 transition-all active:bg-blue-600 active:text-white"
          >
            {copied ? (
              <>
                <Check size={20} className="text-emerald-400" />
                <span className="font-bold uppercase text-xs tracking-widest">Lien copié !</span>
              </>
            ) : (
              <>
                <Copy size={20} />
                <span className="font-bold uppercase text-xs tracking-widest">Copier le lien direct</span>
              </>
            )}
          </button>
        </div>

        {/* Info supplémentaire */}
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">
            Rejoignez la communauté des chasseurs de prix. 🏷️
          </p>
        </div>

      </div>
    </div>
  );
};

export default Home;
