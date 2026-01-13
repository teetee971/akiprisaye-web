import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Camera, FileText, Barcode } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import ReceiptScanner from '../components/ReceiptScanner';
import ScanOCR from './ScanOCR';

type ScanMode = 'barcode' | 'ocr' | 'ticket';

export default function ScannerHub() {
  const [mode, setMode] = useState<ScanMode>('barcode');
  
  return (
    <>
      <Helmet>
        <title>Scanner - A KI PRI SA YÉ</title>
        <meta name="description" content="Scanner de produits : code-barres, OCR texte, et tickets de caisse" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              📷 Scanner de produits
            </h1>
            <p className="text-gray-400 text-lg">
              Scannez vos produits pour comparer les prix instantanément
            </p>
          </div>
          
          {/* Mode Selector */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('barcode')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  mode === 'barcode'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode code-barres"
                aria-pressed={mode === 'barcode'}
              >
                <Barcode className="w-6 h-6" />
                <span className="text-sm">Code-barres</span>
              </button>
              <button
                onClick={() => setMode('ocr')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  mode === 'ocr'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode OCR texte"
                aria-pressed={mode === 'ocr'}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">OCR Texte</span>
              </button>
              <button
                onClick={() => setMode('ticket')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  mode === 'ticket'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner le mode ticket de caisse"
                aria-pressed={mode === 'ticket'}
              >
                <Camera className="w-6 h-6" />
                <span className="text-sm">Ticket</span>
              </button>
            </div>
          </GlassCard>
          
          {/* Dynamic Content */}
          <div>
            {mode === 'barcode' && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Scanner un code-barres
                </h2>
                <p className="text-gray-400 mb-6">
                  Positionnez le code-barres devant votre caméra
                </p>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-gray-500 text-center py-8">
                    Le scanner de code-barres s'affichera ici
                  </p>
                  {/* BarcodeScanner will be integrated here in the actual implementation */}
                </div>
              </GlassCard>
            )}
            
            {mode === 'ocr' && (
              <div className="-mt-6">
                <ScanOCR />
              </div>
            )}
            
            {mode === 'ticket' && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Scanner un ticket de caisse
                </h2>
                <p className="text-gray-400 mb-6">
                  Prenez une photo de votre ticket pour extraire les informations
                </p>
                <ReceiptScanner />
              </GlassCard>
            )}
          </div>
          
          {/* Info Section */}
          <GlassCard className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Conseils d'utilisation</span>
            </h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Assurez-vous d'avoir un bon éclairage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Tenez votre appareil stable pendant le scan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Pour les tickets, cadrez bien l'ensemble du document</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
