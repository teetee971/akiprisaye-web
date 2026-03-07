import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShoppingBasket, HandHeart, Store, RefreshCw } from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import TiPanie from './TiPanie';
import EntraideCoupDeMain from '../components/solidarite/EntraideCoupDeMain';
import PretMateriel from '../components/solidarite/PretMateriel';

type SolidariteSection = 'panier' | 'entraide' | 'pret' | 'economie';

export default function SolidariteHub() {
  const [activeSection, setActiveSection] = useState<SolidariteSection>('panier');
  
  return (
    <>
      <Helmet>
        <title>Solidarité & Entraide - A KI PRI SA YÉ</title>
        <meta name="description" content="Initiatives solidaires pour un accès équitable à l'alimentation" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero banner */}
          <div className="mb-8 animate-fade-in">
            <HeroImage
              src={PAGE_HERO_IMAGES.solidarite}
              alt="Solidarité — mains tendues, entraide citoyenne"
              gradient="from-orange-950 to-slate-900"
              height="h-44 sm:h-60"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                🤝 Solidarité &amp; Entraide
              </h1>
              <p className="text-slate-200 drop-shadow">
                Ensemble pour un accès équitable à l'alimentation
              </p>
            </HeroImage>
          </div>
          
          {/* Section Selector */}
          <GlassCard className="mb-6 p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setActiveSection('panier')}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'panier'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Ti Panier"
                aria-pressed={activeSection === 'panier'}
              >
                <ShoppingBasket className="w-6 h-6" />
                <span className="text-sm">Ti Panier</span>
              </button>
              <button
                onClick={() => setActiveSection('entraide')}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'entraide'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Entraide & Coup de Main"
                aria-pressed={activeSection === 'entraide'}
              >
                <HandHeart className="w-6 h-6" />
                <span className="text-sm text-center leading-tight">Coup de Main</span>
              </button>
              <button
                onClick={() => setActiveSection('pret')}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'pret'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Prêt de Matériel"
                aria-pressed={activeSection === 'pret'}
              >
                <RefreshCw className="w-6 h-6" />
                <span className="text-sm text-center leading-tight">Prêt Matériel</span>
              </button>
              <button
                onClick={() => setActiveSection('economie')}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'economie'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Économie Locale"
                aria-pressed={activeSection === 'economie'}
              >
                <Store className="w-6 h-6" />
                <span className="text-sm">Économie</span>
              </button>
            </div>
          </GlassCard>
          
          {/* Dynamic Content */}
          <div>
            {activeSection === 'panier' && <TiPanie />}

            {activeSection === 'entraide' && <EntraideCoupDeMain />}

            {activeSection === 'pret' && <PretMateriel />}

            {activeSection === 'economie' && (
              <GlassCard>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <Store className="w-7 h-7 text-orange-400" />
                  Économie Locale & Circuit Court
                </h2>
                <p className="text-gray-400 mb-6">
                  Soutenez les producteurs locaux et l'économie de proximité
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🏪</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Petits commerces
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Trouvez les commerces de proximité
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">🌾</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Producteurs locaux
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Achetez directement aux producteurs
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <div className="text-3xl mb-3">📍</div>
                    <h3 className="font-semibold text-lg mb-2 text-white">
                      Marchés locaux
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Découvrez les marchés près de chez vous
                    </p>
                  </div>
                </div>
                
                <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    <span>Pourquoi privilégier le local ?</span>
                  </h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>Soutien à l'économie territoriale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>Réduction de l'empreinte carbone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>Produits plus frais et de meilleure qualité</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>Préservation du savoir-faire local</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-900/50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    Module en cours d'intégration
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
          
          {/* Impact Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Notre impact solidaire
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">500+</div>
                <div className="text-gray-400 text-sm">Familles aidées</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">15t</div>
                <div className="text-gray-400 text-sm">Denrées partagées</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">30</div>
                <div className="text-gray-400 text-sm">Points de collecte</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
