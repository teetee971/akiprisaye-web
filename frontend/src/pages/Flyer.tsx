import React from 'react';
import {
  BarChart3,
  QrCode,
  Smartphone,
  Sparkles,
  MapPin,
  Target,
  Ticket,
  CornerDownLeft,
  ScanBarcode,
} from 'lucide-react';

const Flyer = () => {
  const currentUrl = 'https://akiprisaye-web.pages.dev';
  const appTitle = 'Aki Pri Sa Yé';

  // URL pour générer un QR Code gratuitement via une API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=000000`;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 pb-20 flex flex-col items-center">
      {/* HEADER DU FLYER */}
      <div className="w-full max-w-sm text-center pt-10 pb-12 border-b border-slate-700/50 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
          <Ticket size={12} /> FLYER OFFICIEL v4.6.14
        </div>
        <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          AKI PRI SA YÉ
        </h1>
        <p className="text-slate-400 text-sm italic font-medium max-w-xs mx-auto">
          Le comparateur de prix souverain et indépendant des Outre-Mer.
        </p>
      </div>

      {/* BLOC PRINCIPAL AVEC QR CODE ET CODE-BARRES */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-[3rem] p-10 shadow-2xl space-y-10 relative overflow-hidden">
        {/* Décoration de fond */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="text-center relative">
          <h2 className="text-xl font-bold mb-3 flex items-center justify-center gap-3">
            <ScanBarcode size={24} className="text-blue-400" /> SCANNEZ POUR COMPARER
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">
            Ne payez plus le prix fort
          </p>
        </div>

        {/* ZONE DE SCAN */}
        <div className="bg-white p-6 rounded-3xl shadow-inner flex flex-col items-center justify-center gap-6 relative z-10">
          {/* QR CODE - GÉNERÉ DYNAMIQUEMENT */}
          <div className="aspect-square w-36 border-4 border-slate-100 p-2 rounded-2xl">
            <img
              src={qrCodeUrl}
              alt="QR Code vers AkiPrisaye"
              className="w-full h-full"
              width={128}
              height={128}
            />
          </div>

          <div className="flex items-center gap-3 w-full border-t border-slate-100 pt-5">
            <QrCode size={30} className="text-slate-900" />
            <div className="w-full">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                Scanner le QR Code
              </p>
              <p className="text-slate-900 font-bold text-xs truncate">{currentUrl}</p>
            </div>
          </div>

          {/* FAUX CODE-BARRES POUR LE LOOK (car un code-barres ne contient que des chiffres) */}
          <div className="w-full h-12 border-t border-slate-100 pt-5 flex items-center gap-3">
            <ScanBarcode size={30} className="text-slate-900" />
            <div className="w-full">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                Code-barres AkiPrisaye
              </p>
              <img
                src="https://barcodeapi.org/api/128/971971971001"
                alt="Faux code-barres"
                className="h-6 w-full"
                width={200}
                height={24}
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* POINTS FORTS */}
        <div className="space-y-6 pt-5">
          {[
            { icon: <Target />, text: 'Comparez les prix en temps réel' },
            { icon: <Sparkles />, text: 'Simple, rapide et gratuit' },
            { icon: <Smartphone />, text: 'Disponible partout sur mobile' },
            { icon: <MapPin />, text: 'Adapté à tous les Outre-Mer' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 text-slate-300">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/50 text-blue-400">
                {React.cloneElement(item.icon, { size: 20 })}
              </div>
              <p className="font-semibold text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOUTON DE RETOUR */}
      <div className="mt-12 w-full max-w-sm text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-blue-400"
        >
          <CornerDownLeft size={14} /> Revenir à l'application
        </a>
      </div>
    </div>
  );
};

export default Flyer;
