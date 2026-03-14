/**
 * GuideIntelligentTerritoires — Guide IA par territoire DOM-COM
 * Route : /guide-territoire
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Lightbulb, TrendingUp, ShoppingBag, ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Données territoire ────────────────────────────────────────────────────────

interface TerritoryGuide {
  code: string;
  name: string;
  flag: string;
  headline: string;
  context: string;
  tips: string[];
  watchedCategories: string[];
  route: string;
}

const TERRITORY_GUIDES: TerritoryGuide[] = [
  {
    code: 'GP',
    name: 'Guadeloupe',
    flag: '🇬🇵',
    headline: 'Marché alimentaire sous tension : +12 % vs métropole',
    context:
      "La Guadeloupe est fortement dépendante des importations (80 % des produits alimentaires). "
      + "L'octroi de mer et les coûts de fret maritime pèsent sur les prix des produits transformés.",
    tips: [
      'Privilégiez les marchés locaux pour les fruits et légumes tropicaux',
      'Comparez systématiquement les enseignes avant vos courses en grande surface',
      'Les promotions de fin de mois sont souvent plus avantageuses aux Antilles',
      "Certains produits importés de Métropole coûtent plus cher — vérifiez l'origine",
    ],
    watchedCategories: ['Produits laitiers', 'Viandes importées', 'Électroménager', 'Carburant'],
    route: '/territoire/gp',
  },
  {
    code: 'MQ',
    name: 'Martinique',
    flag: '🇲🇶',
    headline: 'Forte concurrence entre enseignes : opportunités à saisir',
    context:
      'La Martinique bénéficie d\'une densité commerciale élevée. La présence de grandes enseignes '
      + 'crée une concurrence qui peut être exploitée avec un comparateur de prix.',
    tips: [
      'Comparez les prix entre les différentes enseignes présentes en Martinique',
      'Les marchés de Saint-Pierre et Fort-de-France offrent des prix compétitifs pour le frais',
      'Les produits de la mer locaux sont souvent moins chers que les viandes importées',
      'Consultez les alertes de prix pour suivre les variations saisonnières',
    ],
    watchedCategories: ['Boissons', 'Hygiène-Beauté', 'Produits surgelés', 'Carburant'],
    route: '/territoire/mq',
  },
  {
    code: 'GF',
    name: 'Guyane',
    flag: '🇬🇫',
    headline: 'Marché structurellement plus cher : vigilance renforcée',
    context:
      'La Guyane présente les écarts de prix les plus élevés des DOM, en raison de l\'éloignement '
      + 'géographique et des coûts logistiques depuis la Métropole ou les Antilles.',
    tips: [
      'Planifiez vos achats importants lors des promotions saisonnières',
      'Certains produits brésiliens transfrontaliers peuvent être une alternative moins chère',
      'Les coopératives locales offrent parfois de meilleurs prix pour les produits de base',
      'Utilisez la liste intelligente pour optimiser vos trajets entre magasins',
    ],
    watchedCategories: ['Épicerie sèche', 'Produits ménagers', 'Électronique', 'Carburant'],
    route: '/territoire/gf',
  },
  {
    code: 'RE',
    name: 'La Réunion',
    flag: '🇷🇪',
    headline: 'Production locale dynamique : profitez des circuits courts',
    context:
      'La Réunion développe activement sa production locale (fruits, légumes, produits laitiers). '
      + 'Les circuits courts permettent de trouver des produits frais à des prix compétitifs.',
    tips: [
      'Les marchés forains sont excellents pour les fruits et légumes réunionnais',
      'Les produits locaux labellisés "Péi" sont souvent de meilleure qualité/prix',
      'Comparez les prix des grandes surfaces implantées à La Réunion',
      'Les épices et produits créoles locaux sont généralement moins chers que les importés',
    ],
    watchedCategories: ['Fruits & Légumes', 'Produits laitiers', 'Épices', 'Rhum et spiritueux'],
    route: '/territoire/re',
  },
  {
    code: 'YT',
    name: 'Mayotte',
    flag: '🇾🇹',
    headline: 'Développement commercial récent : surveiller les prix de près',
    context:
      "Mayotte est le DOM le plus récent et son tissu commercial est en développement. "
      + "Les prix peuvent varier significativement entre les différentes zones de l'île.",
    tips: [
      "Comparez les prix entre Mamoudzou et les communes plus éloignées",
      'Les produits des Comores voisines peuvent parfois offrir une alternative moins chère',
      'Profitez des périodes de livraison maritime pour certains achats importants',
      'Les marchés traditionnels restent compétitifs pour les produits frais locaux',
    ],
    watchedCategories: ['Riz et féculents', 'Poisson frais', 'Produits de base', 'Matériaux'],
    route: '/territoire/yt',
  },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function GuideIntelligentTerritoires() {
  const [selected, setSelected] = useState<TerritoryGuide | null>(null);

  return (
    <>
      <Helmet>
        <title>Guide intelligent des territoires — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Conseils locaux et analyse des prix par territoire DOM-COM (Guadeloupe, Martinique, Guyane, Réunion, Mayotte) — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/guide-territoire" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.guideTerritoire}
            alt="Guide intelligent des territoires DOM-COM"
            gradient="from-slate-950 to-teal-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-teal-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-300">
                Guide territoire
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              🗺️ Guide des territoires
            </h1>
            <p className="text-teal-100 text-sm mt-1 drop-shadow">
              Conseils locaux personnalisés pour chaque DOM-COM
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          {!selected ? (
            <>
              {/* Info banner */}
              <div className="flex gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
                <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-teal-800">
                  Sélectionnez votre territoire pour obtenir des conseils d'achat personnalisés,
                  les catégories de produits à surveiller et les spécificités locales.
                </p>
              </div>

              {/* Grille territoires */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TERRITORY_GUIDES.map((guide) => (
                  <button
                    key={guide.code}
                    onClick={() => setSelected(guide)}
                    className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-teal-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{guide.flag}</span>
                      <div>
                        <p className="font-bold text-gray-900">{guide.name}</p>
                        <p className="text-xs text-gray-500">{guide.code}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{guide.headline}</p>
                    <div className="flex items-center gap-1 mt-3 text-teal-600 text-xs font-medium">
                      Voir le guide <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Détail du territoire sélectionné */
            <div className="space-y-5">
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                ← Retour aux territoires
              </button>

              {/* En-tête territoire */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{selected.flag}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                    <p className="text-sm text-teal-700 font-medium">{selected.headline}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{selected.context}</p>
              </div>

              {/* Conseils pratiques */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Conseils pratiques</h3>
                </div>
                <ul className="space-y-2">
                  {selected.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-gray-700">
                      <ChevronRight className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Catégories à surveiller */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Catégories à surveiller</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.watchedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={selected.route}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  Explorer {selected.name}
                </Link>
                <Link
                  to="/comparateur-territoires"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Comparer les territoires
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
