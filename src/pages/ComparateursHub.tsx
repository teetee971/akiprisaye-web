/**
 * Comparateurs Hub - Unified entry point for all comparators
 * 
 * Groups all price comparison tools in one place with tabs:
 * - Comparateur classique (price comparison)
 * - Prix au kilo (price per kg)
 * - Shrinkflation detection
 * - Equivalent Métropole
 * - Historique prix
 * - Formats comparison
 * - Services (flights, boats, telecoms)
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ShoppingCart, 
  Scale, 
  TrendingDown, 
  MapPin, 
  History, 
  Package, 
  Plane,
  Ship,
  Wifi,
  Zap,
  Bell,
  Cloud
} from 'lucide-react';

interface ComparatorTab {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  color: string;
  available: boolean;
}

const COMPARATOR_TABS: ComparatorTab[] = [
  {
    id: 'classic',
    title: 'Comparateur Prix',
    description: 'Comparez les prix des produits entre les enseignes',
    icon: ShoppingCart,
    route: '/comparateur',
    color: 'blue',
    available: true,
  },
  {
    id: 'per-kg',
    title: 'Prix au Kilo',
    description: 'Comparez les prix par unité de mesure',
    icon: Scale,
    route: '/comparateur-formats',
    color: 'green',
    available: true,
  },
  {
    id: 'shrinkflation',
    title: 'Shrinkflation',
    description: 'Détectez la réduction cachée des quantités',
    icon: TrendingDown,
    route: '/faux-bons-plans',
    color: 'orange',
    available: true,
  },
  {
    id: 'metropole',
    title: 'Équivalence Métropole',
    description: 'Comparez avec les prix en Métropole',
    icon: MapPin,
    route: '/ievr',
    color: 'purple',
    available: true,
  },
  {
    id: 'history',
    title: 'Historique Prix',
    description: 'Consultez l\'évolution des prix dans le temps',
    icon: History,
    route: '/historique-prix',
    color: 'indigo',
    available: true,
  },
  {
    id: 'history-new',
    title: 'Historique Prix (Nouveau)',
    description: 'Version améliorée avec graphiques interactifs',
    icon: History,
    route: '/historique-prix-new',
    color: 'indigo',
    available: true,
  },
  {
    id: 'price-alerts',
    title: 'Alertes Prix',
    description: 'Créez des alertes pour vos produits favoris',
    icon: Bell,
    route: '/alertes-prix-new',
    color: 'yellow',
    available: true,
  },
  {
    id: 'shopping-list',
    title: 'Liste Courses Intelligente',
    description: 'Optimisez votre liste de courses et économisez',
    icon: ShoppingCart,
    route: '/liste-courses-intelligente',
    color: 'emerald',
    available: true,
  },
  {
    id: 'inflation',
    title: 'Tableau de Bord Inflation',
    description: 'Suivez l\'inflation par territoire et catégorie',
    icon: TrendingDown,
    route: '/inflation',
    color: 'red',
    available: true,
  },
  {
    id: 'formats',
    title: 'Comparaison Formats',
    description: 'Comparez différents formats d\'un même produit',
    icon: Package,
    route: '/comparateur-formats',
    color: 'teal',
    available: true,
  },
  {
    id: 'flights',
    title: 'Vols',
    description: 'Comparez les prix des billets d\'avion',
    icon: Plane,
    route: '/comparateur-vols',
    color: 'sky',
    available: true,
  },
  {
    id: 'boats',
    title: 'Bateaux & Ferries',
    description: 'Comparez les prix des traversées maritimes',
    icon: Ship,
    route: '/comparateur-bateaux',
    color: 'cyan',
    available: true,
  },
  {
    id: 'telecoms',
    title: 'Forfaits Mobile/Internet',
    description: 'Comparez les offres télécoms',
    icon: Wifi,
    route: '/recherche-prix/abonnements/mobile',
    color: 'violet',
    available: false,
  },
  {
    id: 'energy',
    title: 'Énergie (Eau, Électricité)',
    description: 'Comparez les tarifs énergétiques',
    icon: Zap,
    route: '/recherche-prix/energie/electricite',
    color: 'yellow',
    available: false,
  },
  {
    id: 'cyclones',
    title: '🌀 Préparation Cyclones',
    description: 'Kit survie, refuges, alertes - Outil de résilience',
    icon: Cloud,
    route: '/preparation-cyclones',
    color: 'red',
    available: true,
  },
];

export default function ComparateursHub() {
  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' | 'hover') => {
    const colorMap: Record<string, Record<string, string>> = {
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:border-blue-500/50' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', hover: 'hover:border-green-500/50' },
      orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', hover: 'hover:border-orange-500/50' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', hover: 'hover:border-purple-500/50' },
      indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', hover: 'hover:border-indigo-500/50' },
      teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', hover: 'hover:border-teal-500/50' },
      sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', hover: 'hover:border-sky-500/50' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/50' },
      violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', hover: 'hover:border-violet-500/50' },
      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', hover: 'hover:border-yellow-500/50' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', hover: 'hover:border-red-500/50' },
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:border-emerald-500/50' },
    };
    return colorMap[color]?.[type] || colorMap.blue[type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Helmet>
        <title>Comparateurs - A KI PRI SA YÉ</title>
        <meta name="description" content="Tous les outils de comparaison de prix et services en un seul endroit" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📊 Comparateurs
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto">
            Tous vos outils de comparaison en un seul endroit. 
            Comparez les prix, détectez les bonnes affaires, et économisez !
          </p>
        </div>

        {/* Grid of Comparators */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPARATOR_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.route}
                className={`
                  relative group
                  bg-slate-900/50 backdrop-blur-sm
                  border-2 ${getColorClasses(tab.color, 'border')} ${getColorClasses(tab.color, 'hover')}
                  rounded-xl p-6
                  transition-all duration-300
                  hover:scale-105 hover:shadow-xl
                  ${!tab.available ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={(e) => !tab.available && e.preventDefault()}
              >
                {/* Badge "Bientôt disponible" */}
                {!tab.available && (
                  <div className="absolute top-3 right-3 bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
                    Bientôt
                  </div>
                )}

                {/* Icon */}
                <div className={`${getColorClasses(tab.color, 'bg')} ${getColorClasses(tab.color, 'text')} w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>

                {/* Title */}
                <h3 className={`text-xl font-semibold mb-2 ${getColorClasses(tab.color, 'text')}`}>
                  {tab.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed">
                  {tab.description}
                </p>

                {/* Arrow indicator */}
                {tab.available && (
                  <div className={`mt-4 ${getColorClasses(tab.color, 'text')} flex items-center text-sm font-medium group-hover:translate-x-2 transition-transform`}>
                    Accéder <span className="ml-1">→</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-4 text-slate-100">
            💡 Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="font-semibold mb-2 text-blue-400">
                1. Choisissez votre comparateur
              </h3>
              <p className="text-sm text-slate-400">
                Sélectionnez l'outil adapté à votre besoin : prix classiques, 
                prix au kilo, historique, services...
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-green-400">
                2. Recherchez ou scannez
              </h3>
              <p className="text-sm text-slate-400">
                Entrez un code-barres, scannez un produit, ou recherchez par nom.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-purple-400">
                3. Comparez les résultats
              </h3>
              <p className="text-sm text-slate-400">
                Visualisez les différences de prix entre enseignes et trouvez la meilleure offre.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-orange-400">
                4. Économisez !
              </h3>
              <p className="text-sm text-slate-400">
                Utilisez les informations pour optimiser vos achats et votre budget.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">Vous cherchez autre chose ?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/scanner"
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-300 text-sm transition"
            >
              📷 Scanner un produit
            </Link>
            <Link
              to="/carte"
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-300 text-sm transition"
            >
              🗺️ Carte des magasins
            </Link>
            <Link
              to="/observatoire"
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-300 text-sm transition"
            >
              📈 Observatoire des prix
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
