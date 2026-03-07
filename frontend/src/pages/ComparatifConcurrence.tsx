import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ──────────────────────────────────────────────────────────────────────────── */
/* Types                                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

type FeatureValue = true | false | 'partial' | string;

interface Competitor {
  id: string;
  name: string;
  tagline: string;
  focus: string;
  flag?: string;
  highlight?: boolean;
}

interface FeatureCategory {
  category: string;
  emoji: string;
  features: Feature[];
}

interface Feature {
  label: string;
  tooltip?: string;
  values: Record<string, FeatureValue>;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Données                                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

const COMPETITORS: Competitor[] = [
  {
    id: 'akiprisaye',
    name: 'A KI PRI SA YÉ',
    tagline: 'Observatoire citoyen DOM-COM',
    focus: 'Outre-mer',
    flag: '🇬🇵',
    highlight: true,
  },
  {
    id: 'quiestlemoinscher',
    name: 'Quiestlemoinscher',
    tagline: 'Comparateur e-commerce généraliste',
    focus: 'France Hexagonale',
  },
  {
    id: 'idealo',
    name: 'Idealo',
    tagline: 'Comparateur de prix européen',
    focus: 'Europe',
  },
  {
    id: 'carrefour',
    name: 'App Carrefour / Leclerc',
    tagline: 'Applications enseignes grandes surfaces',
    focus: 'Enseignes propres',
  },
  {
    id: 'prixcarburant',
    name: 'Prix-Carburant.gouv.fr',
    tagline: 'Outil officiel carburants',
    focus: 'Carburants uniquement',
  },
];

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    category: 'Couverture territoriale',
    emoji: '🗺️',
    features: [
      {
        label: 'Guadeloupe, Martinique, Guyane, Réunion, Mayotte',
        tooltip: 'Disponibilité des données pour les 5 grands DROM',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: 'partial',
          prixcarburant: 'partial',
        },
      },
      {
        label: 'Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon…',
        tooltip: 'Collectivités d\'Outre-mer (COM)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
      {
        label: 'France Hexagonale',
        values: {
          akiprisaye: true,
          quiestlemoinscher: true,
          idealo: true,
          carrefour: true,
          prixcarburant: true,
        },
      },
      {
        label: 'Comparaison DOM vs Hexagone',
        tooltip: 'Indice d\'écart de prix entre territoires ultramarins et la métropole',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
    ],
  },
  {
    category: 'Produits & Données',
    emoji: '🛒',
    features: [
      {
        label: 'Produits alimentaires courants',
        values: {
          akiprisaye: true,
          quiestlemoinscher: 'partial',
          idealo: 'partial',
          carrefour: true,
          prixcarburant: false,
        },
      },
      {
        label: 'Carburants (SP95, Diesel, GPL)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: true,
        },
      },
      {
        label: 'Services : vols, ferries, télécoms',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
      {
        label: 'Fret, matériaux BTP, assurances',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
      {
        label: 'High-tech & électroménager',
        values: {
          akiprisaye: 'partial',
          quiestlemoinscher: true,
          idealo: true,
          carrefour: true,
          prixcarburant: false,
        },
      },
      {
        label: 'Historique des prix (évolution temporelle)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: 'partial',
          idealo: true,
          carrefour: false,
          prixcarburant: false,
        },
      },
    ],
  },
  {
    category: 'Fonctionnalités citoyennes',
    emoji: '👥',
    features: [
      {
        label: 'Scan code-barres (EAN)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: true,
          carrefour: true,
          prixcarburant: false,
        },
      },
      {
        label: 'OCR ticket de caisse',
        tooltip: 'Reconnaissance optique pour analyser un ticket de caisse photo',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
      {
        label: 'Contribution citoyenne (signalement de prix)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
      {
        label: 'Alertes prix personnalisées',
        values: {
          akiprisaye: true,
          quiestlemoinscher: true,
          idealo: true,
          carrefour: true,
          prixcarburant: false,
        },
      },
      {
        label: 'Liste de courses intelligente',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: true,
          prixcarburant: false,
        },
      },
      {
        label: 'Gamification & récompenses citoyennes',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
    ],
  },
  {
    category: 'Transparence & Indépendance',
    emoji: '🔍',
    features: [
      {
        label: 'Sans publicité ciblée',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: true,
        },
      },
      {
        label: 'Sans liens d\'affiliation commerciale',
        tooltip: 'Aucune commission perçue sur les achats dirigés',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: true,
        },
      },
      {
        label: 'Méthodologie documentée et publique',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: 'partial',
        },
      },
      {
        label: 'Sources des données vérifiables',
        values: {
          akiprisaye: true,
          quiestlemoinscher: 'partial',
          idealo: 'partial',
          carrefour: false,
          prixcarburant: true,
        },
      },
      {
        label: 'Open data / Export des données',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: true,
        },
      },
    ],
  },
  {
    category: 'Accessibilité',
    emoji: '♿',
    features: [
      {
        label: 'Accès gratuit sans inscription',
        values: {
          akiprisaye: true,
          quiestlemoinscher: true,
          idealo: true,
          carrefour: true,
          prixcarburant: true,
        },
      },
      {
        label: 'Application mobile (Android / iOS)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: true,
          idealo: true,
          carrefour: true,
          prixcarburant: true,
        },
      },
      {
        label: 'Interface web responsive',
        values: {
          akiprisaye: true,
          quiestlemoinscher: true,
          idealo: true,
          carrefour: true,
          prixcarburant: true,
        },
      },
      {
        label: 'Mode hors-ligne partiel (PWA)',
        values: {
          akiprisaye: true,
          quiestlemoinscher: false,
          idealo: false,
          carrefour: false,
          prixcarburant: false,
        },
      },
      {
        label: 'Multilingue (Créole, Anglais…)',
        values: {
          akiprisaye: 'partial',
          quiestlemoinscher: false,
          idealo: true,
          carrefour: false,
          prixcarburant: false,
        },
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────── */
/* Composant valeur de feature                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

function FeatureCell({ value, isOurs }: { value: FeatureValue; isOurs: boolean }) {
  if (value === true) {
    return (
      <td className="px-3 py-3 text-center">
        <Check
          className={`inline-block w-5 h-5 ${isOurs ? 'text-emerald-400' : 'text-emerald-500/70'}`}
          aria-label="Oui"
        />
      </td>
    );
  }
  if (value === false) {
    return (
      <td className="px-3 py-3 text-center">
        <X className="inline-block w-4 h-4 text-red-500/60" aria-label="Non" />
      </td>
    );
  }
  if (value === 'partial') {
    return (
      <td className="px-3 py-3 text-center">
        <Minus className="inline-block w-4 h-4 text-yellow-500/70" aria-label="Partiel" />
      </td>
    );
  }
  return (
    <td className="px-3 py-3 text-center text-xs text-white/60">{value}</td>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Page principale                                                              */
/* ──────────────────────────────────────────────────────────────────────────── */

export default function ComparatifConcurrence() {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURE_CATEGORIES.map((c) => [c.category, true]))
  );

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // Compute score per competitor (count of `true` values)
  const scores = COMPETITORS.map((comp) => {
    let yes = 0;
    let total = 0;
    FEATURE_CATEGORIES.forEach((cat) =>
      cat.features.forEach((f) => {
        const v = f.values[comp.id];
        if (v === true) yes++;
        if (v === 'partial') yes += 0.5;
        total++;
      })
    );
    return { id: comp.id, score: Math.round((yes / total) * 100) };
  });

  const getScore = (id: string) => scores.find((s) => s.id === id)?.score ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero */}
        <div className="mb-8 animate-fade-in">
          <HeroImage
            src={PAGE_HERO_IMAGES.comparaisonEnseignes}
            alt="Comparatif A KI PRI SA YÉ vs concurrence"
            gradient="from-indigo-950 to-slate-900"
            height="h-40 sm:h-52"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
              ⚖️ Comparatif : notre application vs la concurrence
            </h1>
            <p className="text-slate-200 text-sm drop-shadow max-w-2xl">
              Fonctionnalités, indépendance, couverture territoriale — voyez pourquoi{' '}
              <strong>A KI PRI SA YÉ</strong> est l'outil le plus adapté aux réalités de l'Outre-mer.
            </p>
          </HeroImage>
        </div>

        {/* Intro disclaimer */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-8 text-sm text-blue-200">
          <span className="font-semibold">📌 Note méthodologique : </span>
          Ce comparatif est basé sur des fonctionnalités publiquement disponibles et vérifiables
          au {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}. Les
          mentions « Partiel » (—) indiquent une fonctionnalité présente mais limitée ou non
          adaptée aux territoires d'Outre-mer.
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {COMPETITORS.map((comp) => {
            const score = getScore(comp.id);
            const isOurs = comp.id === 'akiprisaye';
            return (
              <div
                key={comp.id}
                className={`rounded-xl p-4 text-center border ${
                  isOurs
                    ? 'bg-blue-900/30 border-blue-500/50'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <p className={`text-2xl font-extrabold ${isOurs ? 'text-blue-300' : 'text-white/70'}`}>
                  {score}%
                </p>
                <p className={`text-xs mt-1 font-semibold ${isOurs ? 'text-blue-200' : 'text-white/50'}`}>
                  {comp.flag && <span className="mr-1">{comp.flag}</span>}
                  {comp.name}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">{comp.focus}</p>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" /> Oui / Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <Minus className="w-4 h-4 text-yellow-500/70" /> Partiel / Limité
          </span>
          <span className="flex items-center gap-1.5">
            <X className="w-4 h-4 text-red-500/60" /> Non disponible
          </span>
        </div>

        {/* Feature comparison table by category */}
        <div className="space-y-4">
          {FEATURE_CATEGORIES.map((cat) => {
            const isOpen = openCategories[cat.category] !== false;
            return (
              <div
                key={cat.category}
                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-slate-900 hover:bg-slate-800 transition-colors"
                  aria-expanded={isOpen}
                >
                  <h2 className="text-sm font-semibold text-white/90">
                    {cat.emoji} {cat.category}
                  </h2>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-white/40" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" aria-hidden="true" />
                  )}
                </button>

                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      {/* Column headers (only on first category for brevity — shown on all for accessibility) */}
                      <thead className="border-b border-slate-800">
                        <tr>
                          <th className="text-left px-5 py-2 text-white/50 font-medium text-xs w-56 sm:w-72">
                            Fonctionnalité
                          </th>
                          {COMPETITORS.map((comp) => (
                            <th
                              key={comp.id}
                              className={`text-center px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                                comp.highlight
                                  ? 'text-blue-300'
                                  : 'text-white/40'
                              }`}
                            >
                              {comp.flag && <span className="mr-0.5">{comp.flag}</span>}
                              {comp.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cat.features.map((feat) => (
                          <tr
                            key={feat.label}
                            className="border-t border-slate-800/60 hover:bg-slate-800/20 transition-colors"
                            title={feat.tooltip}
                          >
                            <td className="px-5 py-3 text-white/80 text-sm">
                              {feat.label}
                              {feat.tooltip && (
                                <span className="ml-1 text-white/30 text-xs cursor-help" title={feat.tooltip}>
                                  ℹ️
                                </span>
                              )}
                            </td>
                            {COMPETITORS.map((comp) => (
                              <FeatureCell
                                key={comp.id}
                                value={feat.values[comp.id]}
                                isOurs={comp.highlight === true}
                              />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unique selling points */}
        <section className="mt-10 bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-blue-300 mb-4">
            🌟 Ce qui nous rend uniques
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '🗺️',
                title: 'Spécialiste Outre-mer',
                desc: 'Le seul outil conçu dès le départ pour les réalités économiques des DOM-COM. Aucun concurrent n\'offre cette profondeur pour les territoires ultramarins.',
              },
              {
                icon: '👁️',
                title: 'Observer, pas vendre',
                desc: 'Aucune affiliation commerciale, aucune commission sur vos achats. Notre intérêt est votre information, pas votre achat.',
              },
              {
                icon: '📊',
                title: 'Données citoyennes vérifiables',
                desc: 'Méthodologie documentée, sources identifiées, observatoire participatif. Chaque prix est traçable.',
              },
              {
                icon: '📱',
                title: 'Scan + OCR ticket de caisse',
                desc: 'Scannez un EAN ou photographiez votre ticket : l\'app extrait, analyse et compare vos achats automatiquement.',
              },
              {
                icon: '📈',
                title: 'Indice DOM vs Hexagone',
                desc: 'Mesurez l\'écart de pouvoir d\'achat réel entre les territoires. Une fonctionnalité unique, appuyée sur des données INSEE et Eurostat.',
              },
              {
                icon: '🔓',
                title: 'Open data & export libre',
                desc: 'Vos données sont vôtres. Exportez tout en CSV ou JSON. Les données agrégées sont librement réutilisables.',
              },
            ].map((usp) => (
              <div key={usp.title} className="bg-slate-900/60 rounded-lg p-4 border border-slate-800">
                <p className="text-2xl mb-2">{usp.icon}</p>
                <h3 className="text-sm font-semibold text-white mb-1">{usp.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{usp.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/inscription"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            🚀 Commencer gratuitement
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white/80 text-sm transition-colors"
          >
            Voir nos offres →
          </Link>
          <Link
            to="/methodologie"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white/80 text-sm transition-colors"
          >
            Notre méthodologie →
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Comparatif établi sur la base des fonctionnalités publiquement disponibles.
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    </div>
  );
}
