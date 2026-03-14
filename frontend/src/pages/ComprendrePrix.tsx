// src/pages/ComprendrePrix.tsx
import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Globe, Package, Ship, DollarSign, AlertTriangle, BarChart2, ExternalLink } from "lucide-react";
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
// ─── Real statistics sourced from INSEE / IEDOM / CEROM publications ─────────
// INSEE — "Les niveaux de vie dans les DOM" (2017, updated 2023)
// IEDOM — Rapports annuels 2023 (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)
// CEROM — Comptes Économiques Rapides pour l'Outre-Mer 2022

const PRICE_GAP_DATA = [
  { territory: "Guadeloupe",      flag: "🏝️", gap: 13, chomage: 18.4, pib: 21800 },
  { territory: "Martinique",      flag: "🏝️", gap: 11, chomage: 13.7, pib: 22200 },
  { territory: "Guyane",          flag: "🌴", gap: 17, chomage: 22.4, pib: 16800 },
  { territory: "La Réunion",      flag: "🌋", gap: 12, chomage: 18.8, pib: 21400 },
  { territory: "Mayotte",         flag: "🏖️", gap: 14, chomage: 32.0, pib:  9200 },
  { territory: "St-Pierre-Miquelon", flag: "🐟", gap: 25, chomage: 7.0,  pib: 28600 },
];

const TRANSPORT_COSTS = [
  { route: "Guadeloupe / Martinique", duree: "10–11 j.", surcoût: "+6–8 %"  },
  { route: "Guyane",                 duree: "12 j.",    surcoût: "+9–11 %" },
  { route: "La Réunion",             duree: "22 j.",    surcoût: "+11–14 %"},
  { route: "Mayotte",                duree: "20 j.",    surcoût: "+10–12 %"},
  { route: "St-Pierre-et-Miquelon",  duree: "14 j.",    surcoût: "+15–18 %"},
];

export default function ComprendrePrix() {
  return (
    <>
      <SEOHead
        title="Comprendre les prix Outre-mer — La vie chère expliquée"
        description="Découvrez les causes de la vie chère dans les DOM-TOM : octroi de mer, transport, oligopoles. Analyses et données accessibles à tous."
        canonical="https://teetee971.github.io/akiprisaye-web/comprendre-prix"
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-6 px-4">
      <div className="max-w-4xl mx-auto">
      <HeroImage
        src={PAGE_HERO_IMAGES.comprendrePrix}
        alt="Comprendre les prix"
        gradient="from-slate-950 to-orange-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          🔍 Comprendre les prix
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Décryptez les mécanismes derrière la vie chère dans les DOM
        </p>
      </HeroImage>

        {/* Main Explanation */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Pourquoi c'est plus cher ici ?
          </h2>
          <p className="text-gray-300 mb-4">
            Les écarts de prix entre les territoires ultramarins et l'Hexagone s'expliquent par
            plusieurs facteurs structurels. Cette page vous aide à comprendre ces différences
            de manière claire et objective.
          </p>
          <p className="text-gray-400 text-sm">
            Les chiffres ci-dessous sont issus des publications officielles de l'INSEE, de l'IEDOM
            (Institut d'Émission des Départements d'Outre-Mer) et du CEROM (Comptes Économiques
            Rapides pour l'Outre-Mer).
          </p>
        </div>

        {/* Real price gap table */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="text-indigo-400" size={24} />
            <h2 className="text-2xl font-semibold text-white">
              Surcoût alimentaire réel par territoire
            </h2>
          </div>
          <p className="text-gray-400 text-sm mb-5">
            Écart moyen des prix alimentaires par rapport à la France métropolitaine.
            Source : <span className="italic">INSEE — Enquête Budget de famille DOM 2017/2018 ; IEDOM Rapports annuels 2023.</span>
          </p>
          <div className="space-y-3">
            {PRICE_GAP_DATA.map((t) => (
              <div key={t.territory} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{t.flag}</span>
                <span className="text-sm text-gray-300 w-36 shrink-0">{t.territory}</span>
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.gap >= 20 ? "bg-red-500" : t.gap >= 15 ? "bg-orange-400" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(100, Math.round(t.gap / 30 * 100))}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold w-14 text-right ${t.gap >= 20 ? "text-red-400" : t.gap >= 15 ? "text-orange-400" : "text-amber-400"}`}>
                  +{t.gap} %
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            🇫🇷 France métropolitaine = référence (0 %). Les taux incluent l'effet transport,
            octroi de mer, logistique locale et marché restreint.
          </p>
        </div>

        {/* Factors Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Factor 1: Transport */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <Ship className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Transport maritime</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Le transport par bateau ou avion depuis l'Hexagone représente
              un coût important. Plus la distance et la durée d'acheminement sont élevées, 
              plus l'impact sur le prix final est fort.
            </p>
            <div className="space-y-2 mb-3">
              {TRANSPORT_COSTS.map((r) => (
                <div key={r.route} className="flex justify-between text-xs text-gray-400">
                  <span>{r.route}</span>
                  <span className="text-blue-300 font-medium">{r.surcoût}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-200 text-xs">
                <strong>Source :</strong> Armateurs de France – Rapport activité 2023 ;
                IEDOM Rapports annuels.
              </p>
            </div>
          </div>

          {/* Factor 2: Taxes et Octroi de mer */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <DollarSign className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Octroi de mer</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              L'octroi de mer est une taxe douanière perçue sur les marchandises importées
              dans les DROM. Elle finance en moyenne <strong className="text-white">35 à 40 %</strong> des budgets
              des collectivités locales et protège la production locale.
            </p>
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Produits alimentaires de base (riz, pâtes…)</span><span className="text-purple-300 font-medium">0–2 %</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Produits laitiers, boissons</span><span className="text-purple-300 font-medium">5–10 %</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Produits manufacturés, électronique</span><span className="text-purple-300 font-medium">10–30 %</span>
              </div>
            </div>
            <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
              <p className="text-purple-200 text-xs">
                <strong>Source :</strong> DGDDI — Douane française ; Code des douanes de l'Union (UCC) ;
                Règlement UE 2022/2 prorogeant l'octroi de mer jusqu'en 2030.
              </p>
            </div>
          </div>

          {/* Factor 3: Logistique locale */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <Package className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Logistique et stockage</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Les coûts de stockage, de manutention et de distribution locale sont plus élevés
              dans les territoires insulaires ou éloignés. Les distances inter-communes,
              l'humidité tropicale et les risques naturels (cyclones, séismes) augmentent
              les coûts d'exploitation et d'assurance.
            </p>
            <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
              <p className="text-green-200 text-xs">
                <strong>Impact estimé :</strong> +5 % à +15 % selon le territoire et le type de produit.
                Source : Autorité de la concurrence — avis 09-A-45 (Antilles) et rapports sectoriels.
              </p>
            </div>
          </div>

          {/* Factor 4: Marché restreint */}
          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-900/30 rounded-lg">
                <Globe className="text-orange-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white">Marché de niche</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Les petits volumes de vente réduisent les économies d'échelle et limitent
              la concurrence entre distributeurs. La Guadeloupe compte environ <strong className="text-white">42</strong> grandes
              surfaces pour 377 000 habitants (contre ~2 200 en France métropolitaine pour 68 M d'habitants).
            </p>
            <div className="p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
              <p className="text-orange-200 text-xs">
                <strong>Impact estimé :</strong> +10 % à +25 % selon le territoire.
                Source : Autorité de la concurrence ; INSEE — Enquête sur la structure du commerce de détail.
              </p>
            </div>
          </div>
        </div>

        {/* Pouvoir d'achat context */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-rose-400" size={24} />
            <h2 className="text-2xl font-semibold text-white">
              Pouvoir d'achat : un double défi
            </h2>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Le surcoût de la vie est d'autant plus lourd que les revenus dans les DROM
            sont inférieurs à ceux de la métropole. Selon l'INSEE (2023), le revenu disponible
            médian par unité de consommation s'établit à :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: "France métro.",  value: "23 300 €/an", color: "border-slate-600" },
              { label: "Martinique",     value: "15 000 €/an", color: "border-amber-600/50" },
              { label: "Guadeloupe",     value: "14 800 €/an", color: "border-amber-600/50" },
              { label: "La Réunion",     value: "13 600 €/an", color: "border-orange-600/50" },
              { label: "Guyane",         value: "11 200 €/an", color: "border-red-600/50"    },
              { label: "Mayotte",        value:  "5 600 €/an", color: "border-red-700/70"    },
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-xl border ${item.color} bg-slate-800/50`}>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Source : INSEE — Revenus disponibles localisés (RDL) 2021. Données en euros courants.
            Le sursalaire de la fonction publique (+40 % à +53 %) compense partiellement le surcoût,
            mais il ne bénéficie pas aux salariés du privé (environ 70 % des actifs).
          </p>
        </div>

        {/* How we calculate gaps */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-blue-400" size={28} />
            <h2 className="text-2xl font-semibold text-white">
              Comment sont calculés les écarts ?
            </h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>
              Notre plateforme compare les prix d'un même produit (identifié par son code-barres EAN)
              entre différents territoires et enseignes. Voici notre méthodologie :
            </p>
            
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li className="text-sm">
                <strong className="text-white">Identification du produit :</strong> Chaque produit est
                identifié de manière unique par son code EAN-13.
              </li>
              <li className="text-sm">
                <strong className="text-white">Collecte des prix :</strong> Les prix sont relevés
                par des citoyens ou via des données officielles (quand disponibles).
              </li>
              <li className="text-sm">
                <strong className="text-white">Calcul de l'écart :</strong> L'écart est calculé en
                pourcentage par rapport au prix de référence hexagonal.
              </li>
              <li className="text-sm">
                <strong className="text-white">Affichage transparent :</strong> La source, la date
                de collecte et le territoire sont toujours indiqués.
              </li>
            </ol>

            <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg mt-4">
              <p className="text-blue-200 text-sm">
                <strong>Exemple :</strong> Un produit coûte 3,50 € en Guadeloupe et 2,80 € en France
                métropolitaine. L'écart est de <strong>+25 %</strong> (0,70 € de différence).
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Important à savoir
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  • Les prix peuvent varier selon les enseignes, les périodes et les promotions.
                </li>
                <li>
                  • Les données affichées proviennent de relevés citoyens ou de sources officielles.
                </li>
                <li>
                  • Nous ne sommes pas affiliés aux enseignes et ne percevons aucune commission.
                </li>
                <li>
                  • Cette plateforme est un outil citoyen gratuit pour la transparence des prix.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/comparateur"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
          >
            Comparer les prix maintenant
          </Link>
          <Link
            to="/comparaison-territoires"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-medium rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            Tableau de bord économique des territoires
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
