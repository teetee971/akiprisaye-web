/**
 * Solidarité Hub - Unified entry point for solidarity features
 * 
 * Groups all community and solidarity functionalities:
 * - Ti-Panié Solidaire (anti-waste baskets)
 * - Community sharing
 * - Local initiatives
 * - Civic modules
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, ShoppingBasket, Users, Handshake, Leaf, Building2, Cloud } from 'lucide-react';

interface SolidarityFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  color: string;
  badge?: string;
}

const SOLIDARITY_FEATURES: SolidarityFeature[] = [
  {
    id: 'ti-panie',
    title: 'Ti-Panié Solidaire',
    description: 'Paniers anti-gaspi à prix réduits pour lutter contre le gaspillage alimentaire',
    icon: ShoppingBasket,
    route: '/ti-panie',
    color: 'green',
    badge: 'Populaire',
  },
  {
    id: 'lutte-vie-chere',
    title: 'Lutte contre la Vie Chère',
    description: 'Actions et ressources pour des prix justes dans les territoires d\'Outre-mer',
    icon: Heart,
    route: '/lutte-vie-chere',
    color: 'red',
    badge: 'Nouveau',
  },
  {
    id: 'civic-modules',
    title: 'Modules Citoyens',
    description: 'Outils et ressources pour une consommation responsable et solidaire',
    icon: Users,
    route: '/civic-modules',
    color: 'blue',
  },
  {
    id: 'contribuer',
    title: 'Contribuer aux Prix',
    description: 'Participez à la transparence en partageant les prix que vous constatez',
    icon: Handshake,
    route: '/contribuer-prix',
    color: 'purple',
  },
  {
    id: 'initiatives',
    title: 'Initiatives Locales',
    description: 'Découvrez et soutenez les initiatives locales de solidarité',
    icon: Heart,
    route: '/contribuer',
    color: 'red',
  },
  {
    id: 'cyclones',
    title: '🌀 Préparation Cyclones',
    description: 'Kit survie, refuges, réseau solidaire pour la résilience face aux cyclones',
    icon: Cloud,
    route: '/preparation-cyclones',
    color: 'orange',
    badge: 'Vital',
  },
];

const IMPACT_STATS = [
  {
    icon: '🧺',
    value: '500+',
    label: 'Paniers sauvés',
    description: 'Du gaspillage chaque mois',
  },
  {
    icon: '💰',
    value: '15 000€',
    label: 'Économies totales',
    description: 'Réalisées par la communauté',
  },
  {
    icon: '🌱',
    value: '2 tonnes',
    label: 'CO₂ évité',
    description: 'Grâce à la réduction du gaspillage',
  },
  {
    icon: '👥',
    value: '1 200+',
    label: 'Utilisateurs actifs',
    description: 'Engagés dans la solidarité',
  },
];

const VALUES = [
  {
    icon: '🤝',
    title: 'Entraide',
    description: 'Construire une communauté solidaire et bienveillante',
  },
  {
    icon: '♻️',
    title: 'Anti-gaspillage',
    description: 'Réduire le gaspillage alimentaire ensemble',
  },
  {
    icon: '💚',
    title: 'Accessibilité',
    description: 'Rendre les produits accessibles à tous',
  },
  {
    icon: '🌍',
    title: 'Durabilité',
    description: 'Promouvoir une consommation responsable',
  },
];

export default function SolidariteHub() {
  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' | 'hover') => {
    const colorMap: Record<string, Record<string, string>> = {
      green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', hover: 'hover:border-green-500/50' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:border-blue-500/50' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', hover: 'hover:border-purple-500/50' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', hover: 'hover:border-red-500/50' },
    };
    return colorMap[color]?.[type] || colorMap.green[type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Helmet>
        <title>Solidarité - A KI PRI SA YÉ</title>
        <meta name="description" content="Actions solidaires et anti-gaspillage pour une consommation responsable" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            🤝 Solidarité
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto">
            Ensemble contre le gaspillage et pour une consommation plus juste. 
            Rejoignez notre communauté solidaire !
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {SOLIDARITY_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.id}
                to={feature.route}
                className={`
                  relative group
                  bg-slate-900/50 backdrop-blur-sm
                  border-2 ${getColorClasses(feature.color, 'border')} ${getColorClasses(feature.color, 'hover')}
                  rounded-xl p-8
                  transition-all duration-300
                  hover:scale-105 hover:shadow-2xl
                `}
              >
                {/* Badge */}
                {feature.badge && (
                  <div className={`absolute top-4 right-4 ${getColorClasses(feature.color, 'bg')} ${getColorClasses(feature.color, 'text')} text-xs px-3 py-1 rounded-full font-medium`}>
                    {feature.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`${getColorClasses(feature.color, 'bg')} ${getColorClasses(feature.color, 'text')} w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={32} />
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-semibold mb-3 ${getColorClasses(feature.color, 'text')}`}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* CTA */}
                <div className={`${getColorClasses(feature.color, 'text')} flex items-center font-medium group-hover:translate-x-2 transition-transform`}>
                  Découvrir <span className="ml-2">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Impact Stats */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-8 text-slate-100 text-center">
            📊 Notre impact collectif
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {IMPACT_STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-bold text-green-400 mb-1">{stat.value}</div>
                <div className="font-semibold text-slate-200 mb-1">{stat.label}</div>
                <p className="text-xs text-slate-400">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {VALUES.map((value, index) => (
            <div
              key={index}
              className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center"
            >
              <div className="text-4xl mb-3">{value.icon}</div>
              <h4 className="font-semibold text-slate-100 mb-2">{value.title}</h4>
              <p className="text-sm text-slate-400">{value.description}</p>
            </div>
          ))}
        </div>

        {/* How to participate */}
        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <Leaf size={24} className="text-green-400" />
            Comment participer ?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Découvrez les paniers disponibles</h3>
                  <p className="text-sm text-slate-400">
                    Consultez les Ti-Panié Solidaire près de chez vous
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Réservez votre panier</h3>
                  <p className="text-sm text-slate-400">
                    Sélectionnez et réservez directement depuis l'application
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Récupérez en magasin</h3>
                  <p className="text-sm text-slate-400">
                    Allez chercher votre panier au magasin partenaire
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Partagez votre expérience</h3>
                  <p className="text-sm text-slate-400">
                    Aidez la communauté en partageant votre avis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border-2 border-green-500/40 rounded-xl p-8 text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-100">
            Ensemble, faisons la différence ! 💪
          </h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Rejoignez notre communauté solidaire et contribuez à un monde plus juste et durable. 
            Chaque geste compte !
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/ti-panie"
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition shadow-lg"
            >
              🧺 Découvrir les paniers
            </Link>
            <Link
              to="/contribuer-prix"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-lg"
            >
              ✍️ Contribuer aux prix
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <p className="text-slate-400 mb-4">Explorer d'autres fonctionnalités</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/comparateurs"
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-300 text-sm transition"
            >
              📊 Comparateur de prix
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
