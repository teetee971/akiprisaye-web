import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShoppingBasket, HandHeart, Store, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
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
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/solidarite" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/solidarite" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/solidarite" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-3 sm:p-4 pt-14 sm:pt-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero banner */}
          <div className="mb-5 sm:mb-8 animate-fade-in">
            <HeroImage
              src={PAGE_HERO_IMAGES.solidarite}
              alt="Solidarité — mains tendues, entraide citoyenne"
              gradient="from-orange-950 to-slate-900"
              height="h-32 sm:h-60"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow">
                🤝 Solidarité &amp; Entraide
              </h1>
              <p className="text-slate-200 drop-shadow text-sm sm:text-base">
                Ensemble pour un accès équitable à l'alimentation
              </p>
            </HeroImage>
          </div>
          
          {/* Section Selector */}
          <GlassCard className="mb-4 sm:mb-6 p-2 sm:p-3">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveSection('panier')}
                className={`flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'panier'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Ti Panier"
                aria-pressed={activeSection === 'panier'}
              >
                <ShoppingBasket className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm">Ti Panier</span>
              </button>
              <button
                onClick={() => setActiveSection('entraide')}
                className={`flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'entraide'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Entraide & Coup de Main"
                aria-pressed={activeSection === 'entraide'}
              >
                <HandHeart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm text-center leading-tight">Entraide</span>
              </button>
              <button
                onClick={() => setActiveSection('pret')}
                className={`flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'pret'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Prêt de Matériel"
                aria-pressed={activeSection === 'pret'}
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm text-center leading-tight">Prêt</span>
              </button>
              <button
                onClick={() => setActiveSection('economie')}
                className={`flex flex-col items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-4 rounded-xl font-semibold transition-all ${
                  activeSection === 'economie'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                }`}
                aria-label="Sélectionner la section Économie Locale"
                aria-pressed={activeSection === 'economie'}
              >
                <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm">Économie</span>
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
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <Link
                    to="/petits-commerces"
                    className="bg-slate-900/50 rounded-xl p-6 border border-orange-700/40 hover:border-orange-500/70 hover:bg-orange-900/20 transition-all group cursor-pointer"
                  >
                    <div className="text-3xl mb-3">🏪</div>
                    <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-orange-300 transition-colors">
                      Petits commerces
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Trouvez les commerces de proximité
                    </p>
                    <span className="mt-3 inline-block text-xs text-orange-400 font-semibold">
                      Accéder →
                    </span>
                  </Link>

                  <Link
                    to="/producteurs-locaux"
                    className="bg-slate-900/50 rounded-xl p-6 border border-green-700/40 hover:border-green-500/70 hover:bg-green-900/20 transition-all group cursor-pointer"
                  >
                    <div className="text-3xl mb-3">🌾</div>
                    <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-green-300 transition-colors">
                      Producteurs locaux
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Achetez directement aux producteurs
                    </p>
                    <span className="mt-3 inline-block text-xs text-green-400 font-semibold">
                      Accéder →
                    </span>
                  </Link>

                  <Link
                    to="/marches-locaux"
                    className="bg-slate-900/50 rounded-xl p-6 border border-blue-700/40 hover:border-blue-500/70 hover:bg-blue-900/20 transition-all group cursor-pointer"
                  >
                    <div className="text-3xl mb-3">📍</div>
                    <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-blue-300 transition-colors">
                      Marchés locaux
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Découvrez les marchés près de chez vous
                    </p>
                    <span className="mt-3 inline-block text-xs text-blue-400 font-semibold">
                      Accéder →
                    </span>
                  </Link>
                </div>
                
                <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl p-6">
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
              </GlassCard>
            )}
          </div>
          
          {/* Impact Section */}
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">
              Notre impact solidaire
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <GlassCard className="text-center py-3 sm:py-4">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-1">500+</div>
                <div className="text-gray-400 text-xs sm:text-sm">Familles aidées</div>
              </GlassCard>
              <GlassCard className="text-center py-3 sm:py-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">15t</div>
                <div className="text-gray-400 text-xs sm:text-sm">Denrées partagées</div>
              </GlassCard>
              <GlassCard className="text-center py-3 sm:py-4">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">30</div>
                <div className="text-gray-400 text-xs sm:text-sm">Points de collecte</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
