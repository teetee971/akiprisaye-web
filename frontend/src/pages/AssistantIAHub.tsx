import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, TrendingUp, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/glass-card';
import IaConseiller from './IaConseiller';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

type IASection = 'conseiller' | 'suivi' | 'rayon';

export default function AssistantIAHub() {
  const [activeSection, setActiveSection] = useState<IASection>('conseiller');
  
  return (
    <>
      <Helmet>
        <title>Assistant IA - A KI PRI SA YÉ</title>
        <meta name="description" content="Assistant intelligent pour optimiser vos achats et votre budget" />
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/assistant-ia" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/assistant-ia" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/assistant-ia" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-14">
        <div className="max-w-6xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.assistantIA}
            alt="Assistant IA"
            gradient="from-slate-950 to-violet-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🤖 Assistant IA</h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Votre conseiller personnel pour comprendre et optimiser vos dépenses</p>
          </HeroImage>
          
          {/* Section Selector */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveSection('conseiller')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'conseiller' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section conseiller"
                aria-pressed={activeSection === 'conseiller'}
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm">Conseiller</span>
              </button>
              <button
                onClick={() => setActiveSection('suivi')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'suivi' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section suivi"
                aria-pressed={activeSection === 'suivi'}
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">Suivi</span>
              </button>
              <button
                onClick={() => setActiveSection('rayon')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'rayon' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section rayon IA"
                aria-pressed={activeSection === 'rayon'}
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="text-sm">Rayon IA</span>
              </button>
            </div>
          </GlassCard>
          
          {/* Dynamic Content */}
          <div>
            {activeSection === 'conseiller' && <IaConseiller />}
            
            {activeSection === 'suivi' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-purple-400" />
                  Suivi Intelligent
                </h2>
                <p className="text-gray-400 mb-6">
                  Suivez l'évolution de vos dépenses et recevez des alertes personnalisées
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Analyse des dépenses
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Visualisez vos habitudes d'achat et identifiez les opportunités d'économies
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🔔</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Alertes prix
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Soyez notifié quand vos produits favoris sont en promotion
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {[
                    { emoji: '📊', label: 'Mes Économies',    to: '/mes-economies' },
                    { emoji: '🔔', label: 'Alertes Prix',     to: '/alertes-prix' },
                    { emoji: '🛒', label: 'Liste Intelligente',to: '/liste-intelligente' },
                    { emoji: '📈', label: 'Tableau Inflation', to: '/tableau-inflation' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-purple-500/50 hover:bg-slate-800 transition-all text-center"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-xs font-medium text-gray-300">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}

            {activeSection === 'rayon' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <ShoppingCart className="w-7 h-7 text-purple-400" />
                  Rayon IA
                </h2>
                <p className="text-gray-400 mb-6">
                  Trouvez rapidement les meilleures offres par catégorie de produits
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    { emoji: '🥖', label: 'Épicerie',         detail: 'Produits de base et essentiels', to: '/comparateur' },
                    { emoji: '🥩', label: 'Viande & Poisson', detail: 'Produits frais et surgelés',     to: '/comparateur' },
                    { emoji: '🥬', label: 'Fruits & Légumes', detail: 'Produits de saison locaux',      to: '/comparateur' },
                    { emoji: '🧴', label: 'Hygiène & Beauté', detail: 'Cosmétiques et soins',           to: '/evaluation-cosmetique' },
                    { emoji: '🍼', label: 'Bébé & Puéri.',    detail: 'Produits pour nourrissons',      to: '/comparateur' },
                    { emoji: '🧹', label: 'Entretien',        detail: 'Produits ménagers',              to: '/comparateur' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 hover:border-purple-600/40 transition-all"
                    >
                      <div className="text-3xl mb-2">{item.emoji}</div>
                      <h3 className="font-semibold text-base mb-1 text-white">{item.label}</h3>
                      <p className="text-gray-400 text-sm">{item.detail}</p>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
          
          {/* Features Section */}
          <div className="mt-8">
            <GlassCard className="bg-purple-900/20 border-purple-700/30">
              <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <span>✨</span>
                <span>Fonctionnalités de l'IA</span>
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Analyse personnalisée de vos habitudes d'achat</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Recommandations basées sur votre historique et votre territoire</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Alertes intelligentes sur les promotions pertinentes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Optimisation automatique de votre liste de courses</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}
