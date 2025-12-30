import React from 'react';
import NewsWidgetCivic from '../components/NewsWidgetCivic';
import AIPricePrediction from '../components/AIPricePrediction';
import GPSShoppingList from '../components/GPSShoppingList';
import GlobalDisclaimer from '../components/GlobalDisclaimer';

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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Modules Civiques A KI PRI SA YÉ
          </h1>
          <p className="text-gray-300">
            Plateforme citoyenne basée exclusivement sur des données publiques vérifiées
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Global Disclaimer at Top */}
          <section>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              À propos de cette plateforme
            </h2>
            <GlobalDisclaimer />
          </section>

          {/* News Feed Module */}
          <section>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              1️⃣ Fil d'actualité civique vérifié
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Affichage des actualités avec sources officielles visibles, catégories neutres et texte factuel.
            </p>
            <NewsWidgetCivic limit={3} showFullButton={true} />
          </section>

          {/* Price Comparator Info */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              2️⃣ Comparateur de prix intelligent
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Le comparateur existant permet de rechercher par produit, comparer par territoire, visualiser l'historique 
              et détecter l'inflation et la shrinkflation. Toutes les données proviennent de sources officielles (OPMR, DGCCRF).
            </p>
            <a 
              href="/comparateur" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Accéder au comparateur →
            </a>
          </section>

          {/* AI Price Prediction Module */}
          <section>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              3️⃣ Prédiction de prix IA (transparente)
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Projection factuelle basée sur des données publiques, sans promesses ni conseil d'achat.
            </p>
            <AIPricePrediction 
              productName="Lait demi-écrémé 1L"
              prediction={mockPrediction}
            />
          </section>

          {/* GPS Shopping List Module */}
          <section>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              4️⃣ Liste de courses GPS optimisée
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Comparaison intelligente incluant distance, prix et coût de déplacement.
            </p>
            <GPSShoppingList items={mockShoppingItems} />
          </section>

          {/* Pricing Information */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              7️⃣ Tarification éthique
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                <h3 className="font-semibold text-gray-200 mb-2">Gratuit</h3>
                <p className="text-2xl font-bold text-gray-100 mb-2">0 €</p>
                <p className="text-xs text-gray-400">Découverte de base</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 border border-emerald-600/50">
                <h3 className="font-semibold text-emerald-300 mb-2">Citoyen Premium</h3>
                <p className="text-2xl font-bold text-gray-100 mb-2">3,99 €<span className="text-sm">/mois</span></p>
                <p className="text-xs text-gray-400">Pour particuliers</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                <h3 className="font-semibold text-gray-200 mb-2">Pro</h3>
                <p className="text-2xl font-bold text-gray-100 mb-2">19 €<span className="text-sm">/mois</span></p>
                <p className="text-xs text-gray-400">Commerçants / associations</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-xs text-blue-200">
                ✓ Annulation en 1 clic • Pas de dark pattern • Aucune revente de données
              </p>
            </div>
          </section>

          {/* Tech Stack Info */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              8️⃣ Stack technique
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Frontend</h3>
                <ul className="space-y-1 text-gray-400">
                  <li>• React + TypeScript</li>
                  <li>• Vite build system</li>
                  <li>• Tailwind CSS + Glassmorphism</li>
                  <li>• PWA compliant</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-300 mb-2">Backend & Déploiement</h3>
                <ul className="space-y-1 text-gray-400">
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
