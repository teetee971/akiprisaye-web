/**
 * ARScannerPage — Scanner de magasin en réalité augmentée
 * Route : /ar-scanner
 *
 * Encapsule le composant ARShelfScanner avec une page complète :
 * hero, explications, déclencheur, et note sur l'état d'avancement.
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Camera, Zap, Eye, ShoppingCart, AlertTriangle } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { ARShelfScanner } from '../components/ARShelfScanner';

export default function ARScannerPage() {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Scanner AR de rayon — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Scannez les rayons de votre magasin en réalité augmentée et comparez les prix en temps réel — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/ar-scanner" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.arScanner}
            alt="Scanner AR de rayon"
            gradient="from-slate-950 to-emerald-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-5 h-5 text-emerald-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                Réalité augmentée
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              📷 Scanner AR de rayon
            </h1>
            <p className="text-emerald-100 text-sm mt-1 drop-shadow">
              Pointez votre caméra sur les rayons pour comparer les prix instantanément
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          {/* Avertissement prototype */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Fonctionnalité en cours de développement</p>
              <p className="text-sm text-amber-700 mt-0.5">
                La détection des produits est actuellement simulée. L'intégration avec TensorFlow.js
                ou l'API Google Vision est prévue en V3.
              </p>
            </div>
          </div>

          {/* Points clés */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Camera, title: 'Caméra en direct', desc: 'Flux vidéo temps réel depuis votre appareil photo' },
              { icon: Eye, title: 'Détection produits', desc: 'Bounding boxes sur les produits détectés dans le rayon' },
              { icon: ShoppingCart, title: 'Comparaison prix', desc: 'Meilleur prix du réseau affiché en overlay' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <Icon className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>

          {/* Bouton de lancement */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-600 text-sm mb-4">
              Autorisez l'accès à votre caméra pour démarrer le scanner AR.
              Les images ne sont jamais stockées ni transmises.
            </p>
            <button
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4" />
              Démarrer le scanner AR
            </button>
          </div>

          {/* Roadmap */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="font-semibold text-slate-800 text-sm mb-3">🗺️ Ce qui est prévu en V3</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">▸</span>
                Intégration TensorFlow.js pour la reconnaissance réelle de produits
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">▸</span>
                Connexion à la base de données produits pour les prix en temps réel
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">▸</span>
                Mode offline avec modèle embarqué léger (WASM)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">▸</span>
                Ajout au panier directement depuis l'overlay AR
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scanner AR (overlay fullscreen) */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50">
          <ARShelfScanner />
          <button
            onClick={() => setScannerOpen(false)}
            className="absolute top-4 left-4 z-10 bg-black/60 text-white px-4 py-2 rounded-lg text-sm"
          >
            ✕ Fermer
          </button>
        </div>
      )}
    </>
  );
}
