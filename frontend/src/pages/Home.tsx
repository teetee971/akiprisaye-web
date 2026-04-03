import React from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const Home = () => {
  const [copied, setCopied] = useState(false);
  const shareUrl = "https://akiprisaye-web.pages.dev";
  const shareTitle = "Regarde ce bon plan sur AkiPrisaye ! 🛒🇬🇵";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={20} />,
      color: 'bg-[#25D366]',
      link: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook size={20} />,
      color: 'bg-[#1877F2]',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X',
      icon: <Twitter size={20} />,
      color: 'bg-black',
      link: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      {/* Ton contenu existant ici... */}
      <div className="max-w-md mx-auto space-y-8 text-center pt-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          AkiPrisaye
        </h1>
        <p className="text-slate-400">Le comparateur de prix n°1 en Guadeloupe.</p>

        {/* Section Partage */}
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2">
            <Share2 size={16} /> Partager l'application
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {shareLinks.map((social) => (
              <a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} p-3 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
              >
                {social.icon}
              </a>
            ))}
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full mt-2 bg-slate-700 hover:bg-slate-600 p-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
            <span className="text-sm font-medium">{copied ? "Lien copié !" : "Copier le lien"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
