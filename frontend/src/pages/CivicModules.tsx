 
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import QuickSummary from '../components/QuickSummary';
import NewsWidgetCivic from '../components/NewsWidgetCivic';
import AIPricePrediction from '../components/AIPricePrediction';
import GPSShoppingList from '../components/GPSShoppingList';
import GlobalDisclaimer from '../components/GlobalDisclaimer';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// Compute current time once at module load for demo purposes
// In production, this would come from API or be computed per-component instance
const CURRENT_UPDATE_TIME = new Date();

export default function CivicModules() {
  // Mock data for demonstrations
  const mockShoppingItems = [
    { id: '1', name: 'Lait demi-écrémé 1L', quantity: 2 },
    { id: '2', name: 'Pain de mie complet', quantity: 1 },
    { id: '3', name: 'Yaourts nature x8', quantity: 2 },
    { id: '4', name: 'Riz basmati 1kg', quantity: 1 },
    { id: '5', name: "Huile d'olive 750ml", quantity: 1 },
  ];

  const mockPrediction = {
    trend: 'hausse' as const,
    percentageMin: 2,
    percentageMax: 4,
    period: 30,
    basedOn: [
      'Historique des prix INSEE',
      'Données OPMR Guadeloupe',
      'Inflation mensuelle publiée',
      'Coûts de transport maritime'
    ]
  };

  // Mock data for quick summary
  const summaryData = {
    averageBasket: 87.95,
    territorialGap: 18,
    productsUnderSurveillance: 2847,
    lastUpdate: CURRENT_UPDATE_TIME
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <HeroImage
        src={PAGE_HERO_IMAGES.civicModules}
        alt="Modules civiques"
        gradient="from-slate-950 to-teal-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🏛️ Modules civiques</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Outils citoyens pour surveiller et signaler les abus de prix</p>
      </HeroImage>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Quick Summary at Top */}
          <QuickSummary
            averageBasket={summaryData.averageBasket}
            territorialGap={summaryData.territorialGap}
            productsUnderSurveillance={summaryData.productsUnderSurveillance}
            lastUpdate={summaryData.lastUpdate}
          />

          {/* Re-prioritized CTAs */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              Actions principales
            </h2>
            <div className="space-y-3">
              {/* Main CTA */}
              <Link 
                to="/comparateur-citoyen" 
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
              >
                📊 Comparer les prix par territoire
              </Link>
              
              {/* Priority 1 - Vital Transport Comparators */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">PRIORITÉ 1</span>
                  🥇 Transports Vitaux (Impact Maximum)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Link
                    to="/comparateur-vols"
                    className="block p-3 bg-slate-800/70 border border-blue-700/50 rounded-lg hover:bg-slate-800/90 transition-colors"
                  >
                    <h4 className="font-medium text-blue-200 mb-1 text-sm flex items-center gap-2">
                      ✈️ Comparateur Vols
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      DOM ↔ Métropole — Prix, compagnies, moments d'achat, saisons
                    </p>
                  </Link>
                  <Link
                    to="/comparateur-bateaux"
                    className="block p-3 bg-slate-800/70 border border-blue-700/50 rounded-lg hover:bg-slate-800/90 transition-colors"
                  >
                    <h4 className="font-medium text-blue-200 mb-1 text-sm flex items-center gap-2">
                      🚢 Comparateur Bateaux/Ferries
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Inter-îles — Passagers, véhicules, fréquences
                    </p>
                  </Link>
                </div>
              </div>
              
              {/* Secondary CTAs Grid */}
              <div className="grid md:grid-cols-2 gap-3">
                <Link
                  to="/solidarite"
                  className="block p-3 bg-slate-800/50 border border-orange-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <h3 className="font-medium text-orange-200 mb-1 text-sm">🤝 Entraide & Coup de Main</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Jardinage, bricolage, transport — proposez ou demandez de l'aide
                  </p>
                </Link>
                <Link
                  to="/solidarite"
                  className="block p-3 bg-slate-800/50 border border-green-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <h3 className="font-medium text-green-200 mb-1 text-sm">🌱 Prêt de Matériel</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Jardinage, cuisine, jouets — empruntez ou prêtez du matériel
                  </p>
                </Link>
                <a
                  href="#gps-shopping"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById('gps-shopping');
                    if (element) {
                      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                    }
                  }}
                  className="block p-3 bg-slate-800/50 border border-blue-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <h3 className="font-medium text-blue-200 mb-1 text-sm">🗺️ Optimiser ma liste de courses (GPS)</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Trouvez les meilleurs magasins près de chez vous
                  </p>
                </a>
                <Link
                  to="/evaluation-cosmetique"
                  className="block p-3 bg-slate-800/50 border border-green-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <h3 className="font-medium text-green-200 mb-1 text-sm">🧴 Évaluation Cosmétiques</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Analysez la composition de vos produits cosmétiques
                  </p>
                </Link>
                <Link
                  to="/contribuer-prix"
                  className="block p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <h3 className="font-medium text-gray-300 mb-1 text-sm">🤝 Contribuer aux données publiques</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Partagez vos observations de prix
                  </p>
                </Link>
              </div>

              {/* Always Visible Alert CTA */}
              <Link
                to="/signaler-abus"
                className="block p-3 bg-red-900/30 border border-red-700/50 rounded-lg hover:bg-red-900/40 transition-colors"
              >
                <h3 className="font-medium text-red-200 mb-1 text-sm">🚨 Signaler un abus</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Signalez les pratiques commerciales douteuses ou prix anormaux
                </p>
              </Link>
            </div>
          </section>

          {/* Global Disclaimer */}
          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              À propos de cette plateforme
            </h2>
            <GlobalDisclaimer />
          </section>

          {/* News Feed Module */}
          <section>
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              Fil d'actualité civique vérifié
            </h2>
            <p className="text-sm text-gray-400 mb-3 leading-relaxed">
              Affichage des actualités avec sources officielles visibles, catégories neutres et texte factuel.
            </p>
            <NewsWidgetCivic limit={3} showFullButton={true} />
          </section>

          {/* AI Trend Indicator Module */}
          <section id="ai-indicator">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              Indicateur de tendance (non décisionnel)
            </h2>
            <p className="text-sm text-gray-400 mb-3 leading-relaxed">
              Projection factuelle basée sur des données publiques, sans promesses ni conseil d'achat.
            </p>
            <AIPricePrediction 
              productName="Lait demi-écrémé 1L"
              prediction={mockPrediction}
            />
          </section>

          {/* GPS Shopping List Module */}
          <section id="gps-shopping">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              Liste de courses GPS optimisée
            </h2>
            <p className="text-sm text-gray-400 mb-3 leading-relaxed">
              Comparaison intelligente incluant distance, prix et coût de déplacement.
            </p>
            <GPSShoppingList items={mockShoppingItems} lastUpdate={summaryData.lastUpdate} />
          </section>

          {/* Pricing Information */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-100 mb-2">
              Niveaux d'accès au service
            </h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Observatoire citoyen des prix et du coût de la vie — DOM · ROM · COM
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-slate-800/30 rounded-lg p-3 border border-blue-600/50">
                <h3 className="font-semibold text-blue-300 mb-2 text-sm">🧑 Citoyen</h3>
                <p className="text-xl font-bold text-gray-100 mb-1">3,99 €<span className="text-xs">/mois</span></p>
                <p className="text-xs text-gray-400">Accès individuel</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 border border-purple-600/50">
                <h3 className="font-semibold text-purple-300 mb-2 text-sm">🧑‍💼 Professionnel</h3>
                <p className="text-xl font-bold text-gray-100 mb-1">19 €<span className="text-xs">/mois</span></p>
                <p className="text-xs text-gray-400">Droits étendus</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                <h3 className="font-semibold text-gray-200 mb-2 text-sm">🏛️ Institution</h3>
                <p className="text-base font-bold text-gray-100 mb-1">Licence<span className="text-xs block">annuelle</span></p>
                <p className="text-xs text-gray-400">Sur convention</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-xs text-blue-200 text-center">
                Paiement public activé — abonnement possible en ligne
              </p>
            </div>
          </section>

          {/* Tech Stack Info */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-100 mb-3">
              Stack technique
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Frontend</h3>
                <ul className="space-y-1 text-gray-400 leading-relaxed">
                  <li>• React + TypeScript</li>
                  <li>• Vite build system</li>
                  <li>• Tailwind CSS + Glassmorphism</li>
                  <li>• PWA compliant</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-300 mb-3">Backend & Déploiement</h3>
                <ul className="space-y-1 text-gray-400 leading-relaxed">
                  <li>• Node 20 + TypeScript</li>
                  <li>• API REST + JWT</li>
                  <li>• Cloudflare Pages</li>
                  <li>• GitHub Actions CI/CD</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
