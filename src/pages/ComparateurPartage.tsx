import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useShare, ComparisonData } from '../features/comparateur/hooks/useShare';
import { GlassCard } from '../components/ui/glass-card';

export default function PartagePage() {
  const [searchParams] = useSearchParams();
  const { decodeShareUrl } = useShare();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const encoded = searchParams.get('data');
    if (encoded) {
      const data = decodeShareUrl(encoded);
      if (data) {
        setComparisonData(data);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
    setLoading(false);
  }, [searchParams, decodeShareUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-white text-lg">Chargement de la comparaison...</p>
        </div>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <>
        <Helmet>
          <title>Lien invalide - A KI PRI SA YÉ</title>
        </Helmet>
        
        <div className="min-h-screen bg-slate-950 p-4 pt-24">
          <div className="max-w-2xl mx-auto">
            <GlassCard className="p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Lien invalide ou expiré
              </h1>
              <p className="text-gray-400 mb-6">
                Le lien de partage que vous essayez d'ouvrir n'est pas valide ou a expiré.
              </p>
              <a 
                href="/comparateur"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Retour au comparateur
              </a>
            </GlassCard>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Comparaison Partagée - A KI PRI SA YÉ</title>
        <meta name="description" content="Consultez cette comparaison de prix partagée" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              🔗 Comparaison Partagée
            </h1>
            <p className="text-gray-400 text-lg">
              Consultez les résultats de cette comparaison
            </p>
          </div>
          
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Données de comparaison
            </h2>
            
            {comparisonData.timestamp && (
              <p className="text-gray-400 mb-4">
                Partagé le: {new Date(comparisonData.timestamp).toLocaleDateString('fr-FR')}
              </p>
            )}
            
            <div className="bg-slate-900/50 rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-gray-300">
                {JSON.stringify(comparisonData, null, 2)}
              </pre>
            </div>
            
            <div className="mt-6">
              <a 
                href="/comparateur"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Créer ma propre comparaison
              </a>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
