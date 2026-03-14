import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserBudgetContext, generateBudgetAdvice } from '../services/aiAdvisorService';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function IaConseiller() {
  const { user } = useAuth();
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!user) {
      setAdvice('Veuillez vous connecter pour obtenir une analyse personnalisée.');
      return;
    }

    setLoading(true);
    try {
      const context = await getUserBudgetContext(user.uid);
      const response = await generateBudgetAdvice(context);
      setAdvice(response);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      setAdvice("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <HeroImage
          src={PAGE_HERO_IMAGES.iaConseiller}
          alt="Conseiller IA"
          gradient="from-slate-950 to-violet-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🤖 Conseiller IA</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Votre assistant IA pour optimiser votre budget</p>
        </HeroImage>

        {/* Analyze Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition text-lg"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Analyse en cours...
              </>
            ) : (
              '🔍 Analyser mon budget'
            )}
          </button>
        </div>

        {/* Advice Display */}
        {advice && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-400 flex items-center">
              <span className="mr-2">💡</span>
              Recommandations personnalisées
            </h2>
            <p className="text-slate-200 leading-relaxed whitespace-pre-line">
              {advice}
            </p>
          </div>
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2 text-slate-100">
              Analyse d'historique
            </h3>
            <p className="text-slate-400 text-sm">
              Basée sur vos recherches et achats passés dans l'application
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-4xl mb-3">🏪</div>
            <h3 className="font-semibold text-lg mb-2 text-slate-100">
              Prix territoriaux
            </h3>
            <p className="text-slate-400 text-sm">
              Comparaison avec les prix moyens de votre territoire DOM-COM
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold text-lg mb-2 text-slate-100">
              Économies estimées
            </h3>
            <p className="text-slate-400 text-sm">
              Suggestions pour réduire vos dépenses de 8 à 12%
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-900/20 border border-blue-700/30 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-blue-400 flex items-center">
            <span className="mr-2">ℹ️</span>
            Comment ça marche ?
          </h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Connectez-vous à votre compte pour accéder à votre historique</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>L'IA analyse vos habitudes d'achat et les prix de votre territoire</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Recevez des recommandations personnalisées pour économiser</span>
            </li>
          </ul>
        </div>

        {!user && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Vous devez être connecté pour utiliser le conseiller IA
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
