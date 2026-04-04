import React, { useState, useEffect } from 'react';
import { Camera, X, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Scan = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();
  const { addScannedProduct } = useApp();

  const handleScan = () => {
    setScanning(true);
    // Simulation du moteur OCR (Tesseract.js)
    setTimeout(() => {
      const mockResult = {
        id: Date.now(),
        name: "Lait demi-écrémé",
        price: 1.45,
        shop: "Magasin Détecté",
        territory: "Local",
        impact: 75,
        category: "Produit Laitier"
      };
      setResult(mockResult);
      setScanning(false);
    }, 2000);
  };

  const confirmScan = () => {
    addScannedProduct(result);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
      <button
        onClick={() => navigate('/')}
        aria-label="Retour à l'accueil"
        className="absolute top-10 left-8 p-3 bg-white/10 rounded-full"
      >
        <X size={20} />
      </button>

      {/* VISEUR DE CAMÉRA */}
      <div className="relative w-full aspect-square border-2 border-white/20 rounded-[3rem] overflow-hidden flex items-center justify-center bg-slate-900/40">
        <div className="absolute inset-10 border-2 border-blue-500 rounded-2xl opacity-50 animate-pulse" />
        
        {scanning && (
          <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader2 className="animate-spin text-white mb-2" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">Analyse OCR en cours...</p>
          </div>
        )}

        {!scanning && !result && <Camera size={48} className="text-white/20" />}

        {result && (
          <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
            <CheckCircle2 size={48} className="mb-4" />
            <h2 className="text-xl font-black">{result.name}</h2>
            <p className="text-3xl font-black my-2">{result.price}€</p>
            <p className="text-[10px] font-bold uppercase opacity-80">Prix extrait avec succès</p>
          </div>
        )}
      </div>

      <div className="mt-12 w-full">
        {!result ? (
          <button 
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40"
          >
            {scanning ? 'Traitement...' : 'Capturer le prix'} <Zap size={18} />
          </button>
        ) : (
          <button 
            onClick={confirmScan}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl"
          >
            Ajouter au comparateur
          </button>
        )}
      </div>
    </div>
  );
};

export default Scan;
