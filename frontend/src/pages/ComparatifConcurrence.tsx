import { useMemo, useState } from 'react';
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
        tooltip: "Collectivités d'Outre-mer (COM)",
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
        tooltip: "Indice d'écart de prix entre territoires ultramarins et la métropole",
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
        label: "Sans liens d'affiliation commerciale",
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
/* Ce que fait la concurrence que nous ne faisons pas (encore)                  */
/* ──────────────────────────────────────────────────────────────────────────── */

interface GapItem {
  icon: string;
  feature: string;
  who: string; // which competitor(s) already do it
  status: 'roadmap' | 'considered' | 'out-of-scope';
  statusLabel: string;
  statusColor: string;
  desc: string;
}

const COMPETITOR_GAPS: GapItem[] = [
  {
    icon: '💻',
    feature: 'Comparaison high-tech & électroménager',
    who: 'Idealo, Quiestlemoinscher',
    status: 'roadmap',
    statusLabel: '🗓️ Sur la roadmap',
    statusColor: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
    desc: "Idealo et Quiestlemoinscher couvrent smartphones, TV, électroménager avec des dizaines de milliers de références. Nous couvrons aujourd'hui principalement l'alimentaire et les services.",
  },
  {
    icon: '🌍',
    feature: 'Interface multilingue complète (14+ langues)',
    who: 'Idealo',
    status: 'roadmap',
    statusLabel: '🗓️ Sur la roadmap',
    statusColor: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
    desc: "Idealo est disponible en 14 langues dont l'espagnol et le portugais. Notre support multilingue est en cours (créole, anglais) mais pas encore complet.",
  },
  {
    icon: '🤖',
    feature: 'Flux de prix automatisés (scraping temps réel)',
    who: 'Idealo, Quiestlemoinscher',
    status: 'considered',
    statusLabel: '🔍 Étudié',
    statusColor: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30',
    desc: 'Ces plateformes collectent des prix en temps réel via des partenariats API marchands ou du scraping. Nous privilégions la contribution citoyenne et des snapshots périodiques vérifiés.',
  },
  {
    icon: '🎁',
    feature: 'Cashback & bons de réduction numériques',
    who: 'App Carrefour / Leclerc',
    status: 'out-of-scope',
    statusLabel: '❌ Hors périmètre',
    statusColor: 'text-slate-400 bg-slate-800/40 border-slate-700/30',
    desc: "Les apps enseignes proposent des coupons et cashback directement liés à leur réseau. Incompatible avec notre principe d'indépendance : nous n'avons pas de relation commerciale avec les distributeurs.",
  },
  {
    icon: '🔊',
    feature: 'Recherche vocale',
    who: 'Idealo (assistant vocal)',
    status: 'considered',
    statusLabel: '🔍 Étudié',
    statusColor: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30',
    desc: 'Idealo propose une recherche produit par commande vocale sur mobile. Fonctionnalité intéressante pour accessibilité, à étudier dans une prochaine version.',
  },
  {
    icon: '🔗',
    feature: 'Widget / Intégration pour sites tiers',
    who: 'Idealo',
    status: 'roadmap',
    statusLabel: '🗓️ Sur la roadmap',
    statusColor: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
    desc: 'Idealo propose un widget embarquable sur des sites e-commerce pour afficher la comparaison de prix. Nous envisageons un module similaire pour les associations et collectivités partenaires.',
  },
  {
    icon: '🛍️',
    feature: 'Programme de fidélité numérique intégré',
    who: 'App Carrefour / Leclerc',
    status: 'out-of-scope',
    statusLabel: '❌ Hors périmètre',
    statusColor: 'text-slate-400 bg-slate-800/40 border-slate-700/30',
    desc: 'Les apps enseignes incluent la carte de fidélité avec points et avantages. Hors périmètre pour nous : nous ne sommes pas une app enseigne mais un observatoire indépendant.',
  },
  {
    icon: '⭐',
    feature: 'Avis & notes produits consommateurs',
    who: 'Idealo, Quiestlemoinscher',
    status: 'roadmap',
    statusLabel: '🗓️ Sur la roadmap',
    statusColor: 'text-blue-400 bg-blue-900/30 border-blue-700/40',
    desc: 'Idealo et Quiestlemoinscher affichent des avis vérifiés sur les produits. Nous réfléchissons à une fonctionnalité similaire adaptée aux produits DOM avec validation citoyenne.',
  },
];

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
  return <td className="px-3 py-3 text-center text-xs text-white/60">{value}</td>;
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

  // Compute score per competitor (count of `true` + 0.5 for `partial`)
  const scores = useMemo(
    () =>
      COMPETITORS.map((comp) => {
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
        return { ...comp, score: Math.round((yes / total) * 100) };
      }),
    []
  );

  // Ranking sorted by score descending
  const ranked = useMemo(() => [...scores].sort((a, b) => b.score - a.score), [scores]);

  const MEDAL = ['🥇', '🥈', '🥉'];
  const PODIUM_BG = [
    'bg-yellow-500/20 border-yellow-500/50',
    'bg-slate-500/20 border-slate-400/40',
    'bg-amber-700/20 border-amber-600/40',
  ];
  const PODIUM_TEXT = ['text-yellow-300', 'text-slate-300', 'text-amber-400'];
  const PODIUM_SCORE = ['text-yellow-400', 'text-slate-400', 'text-amber-500'];

  // Podium display: 2nd | 1st | 3rd (classic Olympic layout)
  const podiumOrder = ranked.length >= 3 ? [ranked[1], ranked[0], ranked[2]] : ranked;
  const podiumBarHeight = (pos: number) => {
    if (pos === 1) return 'h-28 sm:h-36';
    if (pos === 0) return 'h-20 sm:h-24';
    return 'h-14 sm:h-16';
  };
  const podiumRank = (comp: (typeof ranked)[0]) => ranked.findIndex((r) => r.id === comp.id);

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
              <strong>A KI PRI SA YÉ</strong> est l'outil le plus adapté aux réalités de
              l'Outre-mer.
            </p>
          </HeroImage>
        </div>

        {/* ── PODIUM ─────────────────────────────────────────────────────────── */}
        <section className="mb-10" aria-label="Podium des comparateurs">
          <h2 className="text-lg font-bold text-white/90 mb-6 text-center">
            🏆 Podium des comparateurs
          </h2>

          {/* Olympic podium */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 mb-6">
            {podiumOrder.map((comp) => {
              const rank = podiumRank(comp); // 0-indexed
              const medal = MEDAL[rank] ?? '';
              const bg = PODIUM_BG[rank] ?? 'bg-slate-800/30 border-slate-700/30';
              const tc = PODIUM_TEXT[rank] ?? 'text-white/60';
              const sc = PODIUM_SCORE[rank] ?? 'text-white/40';
              const isFirst = rank === 0;
              return (
                <div key={comp.id} className="flex flex-col items-center gap-2 min-w-0">
                  {/* Competitor card above bar */}
                  <div
                    className={`rounded-xl border p-3 sm:p-4 text-center w-32 sm:w-40 ${bg} ${isFirst ? 'shadow-lg shadow-yellow-500/10' : ''}`}
                  >
                    <p className="text-2xl sm:text-3xl mb-1">{medal}</p>
                    {comp.flag && <p className="text-lg sm:text-xl">{comp.flag}</p>}
                    <p className={`text-xs font-bold mt-1 leading-tight ${tc}`}>{comp.name}</p>
                    <p className={`text-lg sm:text-xl font-extrabold mt-1 ${sc}`}>{comp.score}%</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{comp.focus}</p>
                  </div>

                  {/* Podium bar */}
                  <div
                    className={`w-32 sm:w-40 rounded-t-lg ${podiumBarHeight(rank === 0 ? 1 : rank === 1 ? 0 : 2)} flex items-end justify-center pb-2 ${bg}`}
                    aria-hidden="true"
                  >
                    <span className={`text-xl font-black ${tc}`}>{rank + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining ranked list (4th, 5th…) */}
          {ranked.length > 3 && (
            <div className="max-w-md mx-auto space-y-2">
              {ranked.slice(3).map((comp, i) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5"
                >
                  <span className="text-white/50 font-semibold text-sm w-8">{i + 4}.</span>
                  <span className="flex-1 text-white/70 text-sm">
                    {comp.flag && <span className="mr-1">{comp.flag}</span>}
                    {comp.name}
                  </span>
                  <span className="text-xs text-white/40 mr-3">{comp.focus}</span>
                  <span className="text-sm font-bold text-white/50">{comp.score}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Intro disclaimer */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-8 text-sm text-blue-200">
          <span className="font-semibold">📌 Note méthodologique : </span>
          Ce comparatif est basé sur des fonctionnalités publiquement disponibles et vérifiables au{' '}
          {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}. Les mentions
          « Partiel » (—) indiquent une fonctionnalité présente mais limitée ou non adaptée aux
          territoires d'Outre-mer.
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
                                comp.highlight ? 'text-blue-300' : 'text-white/40'
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
                                <span
                                  className="ml-1 text-white/30 text-xs cursor-help"
                                  title={feat.tooltip}
                                >
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

        {/* ── CE QUE FAIT LA CONCURRENCE, PAS NOUS ENCORE ─────────────────── */}
        <section
          className="mt-10 bg-slate-900/60 border border-slate-800 rounded-xl p-6"
          aria-label="Analyse des écarts"
        >
          <h2 className="text-lg font-bold text-white/90 mb-1">
            🚀 Ce que fait la concurrence — et notre feuille de route
          </h2>
          <p className="text-sm text-white/50 mb-6">
            Fonctionnalités proposées par au moins un concurrent que nous ne couvrons pas encore
            pleinement — avec notre positionnement.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {COMPETITOR_GAPS.map((gap) => (
              <div
                key={gap.feature}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{gap.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{gap.feature}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${gap.statusColor}`}
                      >
                        {gap.statusLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mb-1.5">
                      Proposé par : <span className="text-white/60">{gap.who}</span>
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">{gap.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend for gap statuses */}
          <div className="flex flex-wrap gap-4 mt-5 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full border text-blue-400 bg-blue-900/30 border-blue-700/40">
                🗓️ Sur la roadmap
              </span>
              Prévu dans une prochaine version
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full border text-yellow-400 bg-yellow-900/20 border-yellow-700/30">
                🔍 Étudié
              </span>
              En cours d'analyse
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full border text-slate-400 bg-slate-800/40 border-slate-700/30">
                ❌ Hors périmètre
              </span>
              Incompatible avec nos valeurs
            </span>
          </div>
        </section>

        {/* Unique selling points */}
        <section className="mt-10 bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-blue-300 mb-4">🌟 Ce qui nous rend uniques</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '🗺️',
                title: 'Spécialiste Outre-mer',
                desc: "Le seul outil conçu dès le départ pour les réalités économiques des DOM-COM. Aucun concurrent n'offre cette profondeur pour les territoires ultramarins.",
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
                desc: "Scannez un EAN ou photographiez votre ticket : l'app extrait, analyse et compare vos achats automatiquement.",
              },
              {
                icon: '📈',
                title: 'Indice DOM vs Hexagone',
                desc: "Mesurez l'écart de pouvoir d'achat réel entre les territoires. Une fonctionnalité unique, appuyée sur des données INSEE et Eurostat.",
              },
              {
                icon: '🔓',
                title: 'Open data & export libre',
                desc: 'Vos données sont vôtres. Exportez tout en CSV ou JSON. Les données agrégées sont librement réutilisables.',
              },
            ].map((usp) => (
              <div
                key={usp.title}
                className="bg-slate-900/60 rounded-lg p-4 border border-slate-800"
              >
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
          Comparatif établi sur la base des fonctionnalités publiquement disponibles. Dernière mise
          à jour :{' '}
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          .
        </p>
      </div>
    </div>
  );
}
