import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReceiptScanner from '../components/ReceiptScanner';
import { SEOHead } from '../components/ui/SEOHead';

export default function ScanOCR() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Scanner ticket de caisse — Extraire les informations et analyser vos dépenses"
        description="Photographiez votre ticket de caisse (une ou plusieurs photos) pour extraire automatiquement les produits, les prix et le total. Comparez avec les prix observés sur votre territoire."
        canonical="https://teetee971.github.io/akiprisaye-web/scan-ocr"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Back navigation */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm"
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
            <ReceiptScanner />
          </div>
        </div>
      </div>
    </>
  );
}
