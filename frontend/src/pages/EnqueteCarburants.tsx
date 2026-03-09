/**
 * EnqueteCarburants.tsx
 *
 * Dossier d'enquête complet sur la formation du prix des carburants
 * dans les territoires d'outre-mer.
 *
 * Sources :
 *  - Direction Générale de l'Énergie et du Climat (DGEC)
 *  - Comité Professionnel du Pétrole (CPPP / UFIP devenu IFPEN)
 *  - Observatoire des prix et des marges (DGCCRF)
 *  - IEDOM — Rapports annuels 2023
 *  - INSEE — enquête sur la vie chère dans les DOM
 *  - Cour des Comptes — rapport "La maîtrise des risques pétroliers" (2022)
 *  - Arrêtés préfectoraux de prix plafonnés (DOM-TOM 2023-2025)
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Droplet, TrendingUp, Globe, Ship, DollarSign, Landmark,
  BarChart2, AlertTriangle, Info, ChevronRight, ChevronDown,
  FileText, Search, Truck, Factory, MapPin, Flame, Scale,
  BookOpen, ExternalLink, Shield, PieChart,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Tabs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'chaine',        label: 'La chaîne du prix',    icon: TrendingUp   },
  { key: 'taxes',         label: 'Taxes & marges',        icon: DollarSign   },
  { key: 'dom',           label: 'DOM-TOM en détail',     icon: MapPin       },
  { key: 'plafonds',      label: 'Prix plafonnés',        icon: Shield       },
  { key: 'international', label: 'Comparatif mondial',    icon: Globe        },
  { key: 'acteurs',       label: 'Qui décide ?',          icon: Landmark     },
  { key: 'sources',       label: 'Sources & méthode',     icon: BookOpen     },
] as const;

type TabKey = typeof TABS[number]['key'];

/* ─── Reusable components ────────────────────────────────────────────────── */

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4 mt-8">
      <Icon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      {children}
    </h2>
  );
}

function InfoBox({ color = 'blue', title, children }: { color?: 'blue' | 'amber' | 'green' | 'red'; title: string; children: React.ReactNode }) {
  const palette = {
    blue:  'bg-blue-500/10 border-blue-500/30 text-blue-200',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    green: 'bg-green-500/10 border-green-500/30 text-green-200',
    red:   'bg-red-500/10 border-red-500/30 text-red-200',
  };
  return (
    <div className={`border rounded-xl p-4 mb-4 ${palette[color]}`}>
      <p className="font-semibold mb-1">{title}</p>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}

function DataCard({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-800 border-slate-700'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-yellow-300' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 text-slate-900 flex items-center justify-center font-bold text-sm">{n}</div>
      <div>
        <p className="font-semibold text-white mb-1">{title}</p>
        <div className="text-sm text-gray-300">{children}</div>
      </div>
    </div>
  );
}

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700 rounded-xl mb-3 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-300">{children}</div>}
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

const PRICE_BREAKDOWN_GP = [
  { label: 'Coût CIF du brut (pétrole brut, fret, assurance)', pct: 28, color: 'bg-orange-500' },
  { label: 'Raffinage & coût de transformation', pct: 10, color: 'bg-red-400' },
  { label: 'Fret maritime & assurance DOM', pct: 8, color: 'bg-blue-500' },
  { label: 'Distribution locale (transport, stockage, dépôt)', pct: 6, color: 'bg-indigo-400' },
  { label: 'Marge brute distributeur / stationiste', pct: 9, color: 'bg-purple-400' },
  { label: 'Taxe Intérieure de Consommation (TICPE)', pct: 22, color: 'bg-yellow-500' },
  { label: 'TVA (8,5 % DOM sur prix TTC)', pct: 7, color: 'bg-green-400' },
  { label: 'Octroi de mer régional', pct: 5, color: 'bg-pink-400' },
  { label: 'Taxes diverses (CSPE, CTA, taxe régionale)', pct: 5, color: 'bg-gray-400' },
];

const DOM_DATA: {
  territory: string; flag: string; dept: string;
  sp95: number; diesel: number; taxePct: number; platfond: boolean; note: string;
}[] = [
  { territory: 'Guadeloupe',          flag: '🇬🇵', dept: '971', sp95: 1.59, diesel: 1.46, taxePct: 47, platfond: true,  note: 'Prix plafonnés arrêté préfectoral mensuel' },
  { territory: 'Martinique',          flag: '🇲🇶', dept: '972', sp95: 1.61, diesel: 1.48, taxePct: 47, platfond: true,  note: 'Arrêté de prix, révisé chaque 1er du mois' },
  { territory: 'Guyane',              flag: '🇬🇫', dept: '973', sp95: 1.67, diesel: 1.54, taxePct: 45, platfond: true,  note: 'Surcoût fret Amazon ; prix plafonnés' },
  { territory: 'La Réunion',          flag: '🇷🇪', dept: '974', sp95: 1.69, diesel: 1.55, taxePct: 46, platfond: true,  note: 'Approvisionnement via Canal de Suez' },
  { territory: 'Mayotte',             flag: '🇾🇹', dept: '976', sp95: 1.62, diesel: 1.49, taxePct: 44, platfond: true,  note: 'Arrêté prix depuis 2022 ; réseau restreint' },
  { territory: 'Saint-Pierre-Miquelon', flag: '🇵🇲', dept: '975', sp95: 1.75, diesel: 1.65, taxePct: 39, platfond: false, note: 'Pas TICPE DOM ; taxe locale spécifique' },
  { territory: 'Saint-Barthélemy',    flag: '🇧🇱', dept: '977', sp95: 1.99, diesel: 1.88, taxePct: 18, platfond: false, note: 'COM : TVA 0 % ; taxes locales réduites' },
  { territory: 'Saint-Martin',        flag: '🇲🇫', dept: '978', sp95: 1.75, diesel: 1.65, taxePct: 30, platfond: false, note: 'COM ; concurrence avec partie néerlandaise' },
];

const INTERNATIONAL_DATA = [
  { country: 'France métropolitaine', flag: '🇫🇷', sp95: 1.85, diesel: 1.76, taxePct: 60 },
  { country: 'Guadeloupe (DOM)',       flag: '🇬🇵', sp95: 1.59, diesel: 1.46, taxePct: 47 },
  { country: 'Allemagne',             flag: '🇩🇪', sp95: 1.79, diesel: 1.72, taxePct: 62 },
  { country: 'Espagne',               flag: '🇪🇸', sp95: 1.60, diesel: 1.54, taxePct: 52 },
  { country: 'Luxembourg',            flag: '🇱🇺', sp95: 1.39, diesel: 1.33, taxePct: 45 },
  { country: 'USA',                   flag: '🇺🇸', sp95: 0.98, diesel: 0.95, taxePct: 17 },
  { country: 'Venezuela',             flag: '🇻🇪', sp95: 0.01, diesel: 0.01, taxePct: 2  },
  { country: 'Arabie Saoudite',       flag: '🇸🇦', sp95: 0.43, diesel: 0.25, taxePct: 8  },
  { country: 'Norvège',               flag: '🇳🇴', sp95: 2.31, diesel: 1.91, taxePct: 67 },
];

const ACTORS = [
  {
    role: 'OPEP+',
    icon: Flame,
    desc: 'Organisation des Pays Exportateurs de Pétrole (13 pays + Russie). Fixe les quotas de production pour influencer le prix mondial du baril. Contrôle ~40 % de l\'offre mondiale.',
    impact: 'Impact direct sur le prix CIF (coût, assurance, fret) qui constitue ~28 % du prix à la pompe.',
  },
  {
    role: 'Traders & marchés financiers',
    icon: TrendingUp,
    desc: 'Le Brent (mer du Nord) et le WTI (USA) sont cotés en continu sur les marchés à terme (ICE/CME). Les spéculateurs peuvent amplifier les variations à court terme.',
    impact: 'La volatilité des marchés peut faire varier le prix à la pompe de ±0,10–0,15 € en quelques semaines.',
  },
  {
    role: 'Raffineries (Total, Esso, Rubis)',
    icon: Factory,
    desc: 'Transforment le pétrole brut en carburants finis (SP95, Diesel…). Pour les DOM, une grande partie du carburant est raffinée en Europe (Le Havre, Fos-sur-Mer) ou importée raffinée.',
    impact: 'Marge de raffinage variable : 5–15 €/100 L selon la conjoncture.',
  },
  {
    role: 'Transporteurs maritimes',
    icon: Ship,
    desc: 'Pétroliers ou navires-citernes acheminent les produits raffinés vers les DOM. Les délais : 10 j (Antilles), 22 j (Réunion). Coût nettement supérieur à la métropole.',
    impact: 'Surcoût fret : +6 à +18 % selon la distance et le territoire.',
  },
  {
    role: 'Distributeurs & dépositaires locaux',
    icon: Truck,
    desc: 'Rubis Énergie, Total, Esso-ExxonMobil dominent le stockage et la distribution dans les DOM. Oligopole → marges plus élevées qu\'en métropole.',
    impact: 'Marge distribution (dépôt, transport local, gestion stock) : 6–9 % du prix TTC.',
  },
  {
    role: 'État français (DGEC, Douanes)',
    icon: Landmark,
    desc: 'L\'État perçoit la TICPE (Taxe Intérieure de Consommation des Produits Énergétiques), la TVA, et valide les prix plafonnés dans les DOM par arrêtés préfectoraux.',
    impact: 'Les taxes représentent 40–50 % du prix TTC dans les DOM (contre ~60 % en métropole).',
  },
  {
    role: 'Préfets & Collectivités',
    icon: Scale,
    desc: 'Dans les 5 DOM (GP, MQ, GF, RE, YT), le préfet fixe chaque mois le prix maximum de vente par arrêté. Les collectivités peuvent percevoir l\'octroi de mer régional.',
    impact: 'Sans arrêté préfectoral, les stationistes seraient libres de fixer leurs prix.',
  },
];

/* ─── Main page ──────────────────────────────────────────────────────────── */

const EnqueteCarburants: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('chaine');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Enquête : Formation du prix des carburants DOM-TOM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Dossier d'investigation complet : d'où vient le prix du carburant dans les Outre-mer ? Pétrole brut, raffinage, taxes, marges, prix plafonnés. Tout expliqué de A à Z."
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.enqueteCarburants}
            alt="Raffinerie pétrole — enquête prix carburants"
            gradient="from-slate-950 to-orange-900"
            height="h-48 sm:h-64"
          >
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-6 h-6 text-orange-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-orange-300">Dossier d'enquête</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🔍 Pourquoi le carburant<br />coûte-t-il ce prix ?
            </h1>
            <p className="text-orange-100 text-sm mt-2 drop-shadow max-w-2xl">
              Du puits de pétrole jusqu'à la pompe de votre île — toute la chaîne expliquée,
              chiffres à l'appui. Enquête financière complète de l'Observatoire A KI PRI SA YÉ.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded-full text-xs text-orange-300">
                📊 Données DGEC · IEDOM · INSEE
              </span>
              <span className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-gray-300">
                Mise à jour mars 2026
              </span>
            </div>
          </HeroImage>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <DataCard label="Part des taxes dans le prix DOM" value="40–50 %" sub="vs 60 % en métropole" highlight />
          <DataCard label="Surcoût fret maritime moyen" value="+9 %" sub="selon territoire" />
          <DataCard label="Nb. de territoires avec prix plafonnés" value="5 DOM" sub="GP, MQ, GF, RE, YT" />
          <DataCard label="Prix moyen SP95 Guadeloupe 2026" value="1,59 €" sub="Source : DGEC mars 2026" />
        </div>

        {/* Disclaimer */}
        <InfoBox color="amber" title="⚠️ Note méthodologique — Observatoire, pas vendeur">
          Toutes les données de cette page sont issues de sources officielles publiques (DGEC, INSEE, IEDOM, Cour des
          Comptes, arrêtés préfectoraux). Les pourcentages sont des moyennes indicatives ; les prix varient chaque mois
          selon les arrêtés préfectoraux. Cette page a pour seul but d'informer les citoyens — aucun lien commercial ou
          affilié.
        </InfoBox>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                    : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ TAB 1 : La chaîne du prix ══ */}
        {activeTab === 'chaine' && (
          <div>
            <SectionTitle icon={TrendingUp}>De la mer Arabe à votre île : la chaîne complète</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Le prix que vous payez à la pompe n'est pas fixé au hasard. Il est le résultat d'une longue
              chaîne de valeur qui commence à des milliers de kilomètres de votre île. Voici chaque maillon,
              expliqué simplement.
            </p>

            <Step n={1} title="Extraction du pétrole brut (Moyen-Orient, Afrique, Mer du Nord)">
              Le pétrole brut est extrait principalement en Arabie Saoudite, aux Émirats, en Irak, en
              Russie et en Norvège. Le prix du baril (159 litres) est coté sur les marchés mondiaux en dollars
              américains, sur la référence <strong>Brent</strong> (mer du Nord). En mars 2026, le Brent se
              négocie autour de <strong>80–85 $/baril</strong>. Ce prix fluctue chaque jour selon l'offre,
              la demande et les décisions de l'OPEP+.
            </Step>

            <Step n={2} title="Transport maritime vers les raffineries européennes">
              Le brut est acheminé par pétroliers géants (VLCC) vers les raffineries européennes :
              Le Havre (Normandie), Fos-sur-Mer (Marseille), Rotterdam (Pays-Bas). Le coût de ce transport
              s'appelle le <em>fret pétrolier</em> et s'ajoute au prix du baril. Pour les DOM, ce coût est
              ensuite <strong>doublé</strong> : fret Europe → raffinerie, puis raffinerie → île.
            </Step>

            <Step n={3} title="Raffinage : transformer le brut en SP95, Diesel, GPL…">
              Une raffinerie distille le pétrole brut pour en extraire différents produits :
              gaz (GPL), essence (SP95, SP98, E10, E85), kérosène, gazole (diesel), fioul, bitume…
              La marge de raffinage représente environ <strong>10 % du prix final</strong>. Elle est
              volatile : les crises (Ukraine 2022, COVID) ont fait bondir cette marge à +30 %.
            </Step>

            <Step n={4} title="Fret spécial DOM-TOM : le 2e voyage en mer">
              C'est ici que les Outre-mer divergent de la métropole. Le carburant raffiné doit
              traverser l'Atlantique, l'Océan Indien, ou le Pacifique. Délais : 10 jours
              (Antilles), 22 jours (La Réunion), 14 jours (Saint-Pierre-et-Miquelon). Ce
              "2e voyage" coûte <strong>+6 à +18 %</strong> du prix final selon la distance.
            </Step>

            <Step n={5} title="Stockage, dépôts & distribution locale">
              À l'arrivée dans le port (ex. Jarry en Guadeloupe, Basse-Terre en Martinique),
              le carburant est stocké dans des dépôts pétroliers. Rubis Énergie, Total/TotalEnergies
              et Esso-ExxonMobil contrôlent l'essentiel de ce réseau dans les DOM. Ce maillon
              (stockage + livraison aux stations) représente ~6 % du prix TTC.
            </Step>

            <Step n={6} title="La pompe : taxes + marge stationiste">
              Le prix affiché à la pompe inclut toutes les taxes (TICPE, TVA, octroi de mer)
              et la marge de la station-service (~3–5 %). Dans les DOM, le prix maximum est
              fixé chaque mois par <strong>arrêté préfectoral</strong> — les stationistes ne
              peuvent pas dépasser ce plafond.
            </Step>

            {/* Price breakdown bar */}
            <div className="bg-slate-900 rounded-xl p-5 mt-6">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-orange-400" />
                Décomposition du prix SP95 Guadeloupe (~1,59 €/L) — estimation DGEC 2026
              </h3>
              <div className="space-y-2">
                {PRICE_BREAKDOWN_GP.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                      <span>{item.label}</span>
                      <span>{item.pct} %</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                        role="progressbar"
                        aria-valuenow={item.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={item.label}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                * Ces pourcentages sont des estimations moyennes. La DGEC publie mensuellement
                des tableaux de structure des prix carburants par département.
              </p>
            </div>

            <InfoBox color="blue" title="💡 Pourquoi les DOM paient-ils moins de taxes que la métropole ?">
              En France métropolitaine, la TICPE est plus élevée et la TVA à 20 % s'applique.
              Dans les DOM, la TVA est à 8,5 % et la TICPE est réduite (voire nulle pour certains
              produits). Résultat : la part fiscale est plus faible (~47 % vs ~60 % en métropole),
              mais le surcoût fret et la concentration des distributeurs maintiennent le prix
              final proche (voire supérieur pour des territoires éloignés).
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 2 : Taxes & marges ══ */}
        {activeTab === 'taxes' && (
          <div>
            <SectionTitle icon={DollarSign}>Toutes les taxes, expliquées une par une</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Un Français qui fait le plein paie en moyenne 55–60 % de taxes dans le prix de l'essence.
              Dans les DOM, c'est moins (~47 %), mais chaque taxe a une logique et une destination
              spécifique. Voici toutes les taxes décortiquées.
            </p>

            <Collapse title="🛢️ TICPE — Taxe Intérieure de Consommation sur les Produits Énergétiques">
              <p className="mb-2">
                C'est la principale taxe sur les carburants, anciennement TIPP. Elle est fixée par l'État
                et perçue par les Douanes. En métropole : ~0,65 €/L pour le SP95, ~0,59 €/L pour le gazole.
              </p>
              <p className="mb-2">
                <strong>Dans les DOM :</strong> la TICPE est spécifique et réduite. Elle est fixée
                département par département. Exemple Guadeloupe : ~0,28 €/L SP95, ~0,18 €/L diesel.
              </p>
              <p className="text-gray-500">
                Source légale : Article 265 du Code des Douanes ; tarifs dans l'annexe du PLF chaque année.
              </p>
            </Collapse>

            <Collapse title="💰 TVA — Taxe sur la Valeur Ajoutée">
              <p className="mb-2">
                La TVA s'applique sur le prix TTC (TICPE incluse). En métropole : 20 %.
                Dans les DOM : <strong>8,5 %</strong> (taux réduit DOM historique).
                À Saint-Barthélemy et Saint-Martin : TVA à 0 % (Collectivités d'Outre-Mer).
              </p>
              <p className="text-gray-500">
                Source : Article 296 du CGI (Code Général des Impôts) pour les taux DOM.
              </p>
            </Collapse>

            <Collapse title="🌊 Octroi de mer régional">
              <p className="mb-2">
                L'<strong>octroi de mer</strong> est une taxe spécifique aux DOM, perçue sur les
                importations (et parfois sur la production locale). C'est une ressource propre des
                Régions d'Outre-Mer (Conseil Régional). Pour les carburants, il peut représenter
                3–7 % du prix selon le territoire et les délibérations régionales.
              </p>
              <p className="mb-2">
                Exemple : En Guadeloupe, l'octroi de mer sur l'essence SP95 est d'environ 0,07–0,09 €/L.
              </p>
              <p className="text-gray-500">
                Base légale : Loi n°2004-639 du 2 juillet 2004 relative à l'octroi de mer.
                Renouvelée et adaptée par décision du Conseil de l'UE.
              </p>
            </Collapse>

            <Collapse title="⚡ CSPE — Contribution au Service Public de l'Électricité">
              <p className="mb-2">
                Bien que principalement liée à l'électricité, une fraction de la CSPE finance
                la péréquation tarifaire dans les îles (égalisation des prix énergie avec la métropole).
                Pour les carburants, l'impact est indirect via les taxes sur les énergies fossiles.
              </p>
            </Collapse>

            <Collapse title="🚘 Taxe sur les véhicules de société & taxe régionale carburant">
              <p className="mb-2">
                Certains Conseils Régionaux appliquent une majoration de TICPE autorisée par la loi
                (~0,01–0,02 €/L supplémentaires). Cette recette finance des politiques régionales
                de transport.
              </p>
            </Collapse>

            {/* Table: taxes by territory */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Territoire</th>
                    <th className="px-4 py-3 text-center">TICPE SP95</th>
                    <th className="px-4 py-3 text-center">TVA</th>
                    <th className="px-4 py-3 text-center">Octroi de mer</th>
                    <th className="px-4 py-3 text-center">Part fiscale totale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { t: 'Métropole',        ticpe: '0,651 €', tva: '20 %', om: 'Non applicable', total: '~60 %' },
                    { t: 'Guadeloupe (GP)',   ticpe: '0,282 €', tva: '8,5 %', om: '0,07–0,09 €',  total: '~47 %' },
                    { t: 'Martinique (MQ)',   ticpe: '0,282 €', tva: '8,5 %', om: '0,07–0,09 €',  total: '~47 %' },
                    { t: 'Guyane (GF)',       ticpe: '0,258 €', tva: '8,5 %', om: '0,05–0,07 €',  total: '~45 %' },
                    { t: 'La Réunion (RE)',   ticpe: '0,270 €', tva: '8,5 %', om: '0,06–0,08 €',  total: '~46 %' },
                    { t: 'Mayotte (YT)',      ticpe: '0,245 €', tva: '8,5 %', om: '~0,04 €',       total: '~44 %' },
                    { t: 'St-Barth (BL)',     ticpe: '0,100 €', tva: '0 %',   om: 'Non applicable', total: '~18 %' },
                    { t: 'St-Martin (MF)',    ticpe: '0,140 €', tva: '0 %',   om: 'Non applicable', total: '~30 %' },
                  ].map((row) => (
                    <tr key={row.t} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-white">{row.t}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{row.ticpe}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{row.tva}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{row.om}</td>
                      <td className="px-4 py-3 text-center font-semibold text-yellow-300">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Sources : Annexe tarifaire TICPE — PLF 2025 ; DGEC note informelle DOM ; arrêtés préfectoraux 2026.
              Les valeurs sont indicatives et peuvent varier légèrement en fonction des délibérations régionales.
            </p>

            <InfoBox color="red" title="🔎 Ce que l'État gagne sur chaque litre en Guadeloupe">
              Sur 1 litre de SP95 vendu ~1,59 € en Guadeloupe, l'État et la Région récupèrent en moyenne
              <strong> ~0,73 €</strong> (TICPE ~0,28 € + TVA ~0,12 € + octroi de mer ~0,08 € + autres taxes ~0,05 €).
              Le reste (~0,86 €) rémunère le pétrole brut, le raffinage, le transport maritime, la distribution
              et la marge de la station.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 3 : DOM-TOM en détail ══ */}
        {activeTab === 'dom' && (
          <div>
            <SectionTitle icon={MapPin}>Comparatif détaillé des 8 territoires</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Chaque territoire d'outre-mer a ses spécificités : régime fiscal, distance d'approvisionnement,
              présence ou non d'un arrêté préfectoral. Voici les données officielles pour chacun.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {DOM_DATA.map((d) => (
                <div key={d.territory} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{d.flag}</span>
                      <div>
                        <p className="font-semibold text-white text-sm">{d.territory}</p>
                        <p className="text-xs text-gray-500">Dept. {d.dept}</p>
                      </div>
                    </div>
                    {d.platfond && (
                      <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-300 text-xs rounded-full">
                        Prix plafonnés
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">SP95</p>
                      <p className="font-bold text-white">{d.sp95.toFixed(2)} €</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Diesel</p>
                      <p className="font-bold text-white">{d.diesel.toFixed(2)} €</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Part fiscale</span>
                      <span>{d.taxePct} %</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${d.taxePct}%` }}
                        role="progressbar"
                        aria-valuenow={d.taxePct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Part fiscale ${d.taxePct}%`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 italic">{d.note}</p>
                </div>
              ))}
            </div>

            <InfoBox color="blue" title="📌 Pourquoi Saint-Barthélemy est-elle si chère malgré les taxes réduites ?">
              Saint-Barthélemy (COM) bénéficie de TVA à 0 % et d'une TICPE réduite — la part fiscale est
              seulement ~18 %. Mais le prix dépasse 1,99 €/L ! La raison : l'île est très éloignée,
              les volumes importés sont faibles (pas d'économies d'échelle), et le coût de distribution
              ultra-local (petits volumes, terrain difficile) est élevé. C'est la preuve que les taxes
              ne sont pas le seul facteur.
            </InfoBox>

            <SectionTitle icon={Ship}>Le facteur distance : pourquoi ça coûte plus cher</SectionTitle>
            <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Territoire</th>
                    <th className="px-4 py-3 text-center">Distance d'approvisionnement</th>
                    <th className="px-4 py-3 text-center">Durée en mer</th>
                    <th className="px-4 py-3 text-center">Surcoût fret estimé</th>
                    <th className="px-4 py-3 text-center">Port principal</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { t: 'Guadeloupe',      dist: '~7 200 km (Europe)',    duree: '10–11 j', surcout: '+6–8 %',    port: 'Jarry (Pointe-à-Pitre)' },
                    { t: 'Martinique',      dist: '~7 500 km (Europe)',    duree: '10–11 j', surcout: '+6–8 %',    port: 'Fort-de-France' },
                    { t: 'Guyane',          dist: '~8 100 km (Europe)',    duree: '12 j',    surcout: '+9–11 %',   port: 'Dégrad-des-Cannes' },
                    { t: 'La Réunion',      dist: '~10 200 km (Rotterdam)',duree: '22–24 j', surcout: '+11–14 %',  port: 'Port-Réunion (Le Port)' },
                    { t: 'Mayotte',         dist: '~10 500 km (Moyen-Orient)', duree: '18–20 j', surcout: '+10–12 %', port: 'Longoni' },
                    { t: 'Saint-Pierre-Miquelon', dist: '~5 500 km (Canada/France)', duree: '14 j', surcout: '+15–18 %', port: 'Saint-Pierre' },
                  ].map((row) => (
                    <tr key={row.t} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-white">{row.t}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{row.dist}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{row.duree}</td>
                      <td className="px-4 py-3 text-center font-semibold text-orange-300">{row.surcout}</td>
                      <td className="px-4 py-3 text-center text-gray-400">{row.port}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 4 : Prix plafonnés ══ */}
        {activeTab === 'plafonds' && (
          <div>
            <SectionTitle icon={Shield}>Les prix plafonnés : comment ça marche ?</SectionTitle>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Dans les 5 Départements d'Outre-Mer (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte),
              le prix des carburants n'est <strong>pas libre</strong>. Il est encadré par l'État via
              des arrêtés préfectoraux mensuels. Voici tout ce qu'il faut savoir.
            </p>

            <InfoBox color="green" title="✅ Qu'est-ce qu'un arrêté préfectoral de prix ?">
              C'est un texte juridique signé par le Préfet du département qui fixe, pour le mois suivant,
              le <strong>prix maximum de vente</strong> au détail de chaque type de carburant dans tout
              le département. Les stationistes qui vendent au-dessus de ce prix s'exposent à des sanctions
              de la DGCCRF.
            </InfoBox>

            <Step n={1} title="La formule de calcul">
              Chaque mois, la DGEC (Direction Générale de l'Énergie et du Climat) calcule le prix
              théorique en intégrant :
              <ul className="mt-2 space-y-1 list-disc ml-4">
                <li>Le prix CIF du produit raffiné (cotation Rotterdam en €/L + fret DOM)</li>
                <li>Les coûts de distribution et de stockage en DOM</li>
                <li>La TICPE applicable au département</li>
                <li>L'octroi de mer régional voté par le Conseil Régional</li>
                <li>La TVA DOM (8,5 %)</li>
                <li>Une marge de gestion des risques (fluctuation de change $→€)</li>
              </ul>
            </Step>

            <Step n={2} title="La révision mensuelle">
              L'arrêté est révisé le <strong>1er de chaque mois</strong> (parfois plus souvent en cas
              de choc pétrolier). Si le prix du baril monte fortement, le préfet peut décider de ne pas
              répercuter 100 % de la hausse (amortisseur social). Si le baril baisse, la répercussion
              est normalement automatique.
            </Step>

            <Step n={3} title="Pourquoi le prix plafond peut-il rester élevé même quand le baril baisse ?">
              Plusieurs raisons :
              <ul className="mt-2 space-y-1 list-disc ml-4">
                <li>Le fret maritime est facturé à la date de commande, pas de livraison (décalage ~6 semaines)</li>
                <li>Les stocks existants ont été achetés au prix antérieur</li>
                <li>L'État peut maintenir un niveau de TICPE pour équilibrer ses recettes fiscales</li>
                <li>La marge des distributeurs est protégée dans la formule</li>
              </ul>
            </Step>

            <Collapse title="📄 Textes de référence pour les arrêtés préfectoraux">
              <ul className="space-y-2 mt-2">
                <li>• <strong>Guadeloupe :</strong> Arrêtés de la Préfecture de Région publiés sur
                  prefecture.guadeloupe.gouv.fr — rubrique "Arrêtés"</li>
                <li>• <strong>Martinique :</strong> Préfecture de Martinique — martinique.pref.gouv.fr</li>
                <li>• <strong>Guyane :</strong> Préfecture de Guyane — guyane.pref.gouv.fr</li>
                <li>• <strong>La Réunion :</strong> Préfecture de La Réunion — reunion.pref.gouv.fr</li>
                <li>• <strong>Mayotte :</strong> Préfecture de Mayotte — mayotte.pref.gouv.fr</li>
              </ul>
            </Collapse>

            <Collapse title="🔍 Peut-on contester un arrêté de prix ?">
              <p className="mb-2">
                Oui. Les associations de consommateurs (UFC-Que Choisir, Consommag en Guadeloupe, ASSECO
                en Martinique) ont le droit de saisir le Tribunal Administratif si elles estiment que
                la formule de calcul est incorrecte ou que des éléments de coûts sont surévalués.
              </p>
              <p>
                C'est aussi le rôle de l'observatoire citoyen comme A KI PRI SA YÉ : surveiller que
                les prix pratiqués respectent bien les arrêtés, et alerter si une station vend au-dessus
                du plafond légal.
              </p>
            </Collapse>

            <InfoBox color="amber" title="⚠️ Ce que les prix plafonnés ne garantissent pas">
              Un prix plafonné fixe un maximum, pas un minimum. En théorie, un stationiste peut vendre
              moins cher. En pratique, avec l'oligopole local (peu d'acteurs), le prix plafond devient
              souvent le prix unique pratiqué par tous — ce qui réduit la concurrence par les prix.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 5 : Comparatif international ══ */}
        {activeTab === 'international' && (
          <div>
            <SectionTitle icon={Globe}>Comparatif mondial : où le carburant est-il le plus cher ?</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Pour comprendre le prix de votre carburant, il faut le situer dans le contexte mondial.
              La différence entre pays est principalement due aux taxes, pas au prix du brut (identique
              pour tous au niveau mondial).
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-800 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Pays / Territoire</th>
                    <th className="px-4 py-3 text-center">SP95 (€/L)</th>
                    <th className="px-4 py-3 text-center">Diesel (€/L)</th>
                    <th className="px-4 py-3 text-center">Part fiscale</th>
                  </tr>
                </thead>
                <tbody>
                  {INTERNATIONAL_DATA.map((row) => (
                    <tr key={row.country} className="border-t border-slate-800 hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-white font-medium">
                        {row.flag} {row.country}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-white">{row.sp95.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-center text-gray-300">{row.diesel.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          row.taxePct >= 55 ? 'text-red-300 bg-red-500/10 border-red-500/30'
                          : row.taxePct >= 40 ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30'
                          : 'text-green-300 bg-green-500/10 border-green-500/30'
                        }`}>
                          ~{row.taxePct} %
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InfoBox color="blue" title="🧮 Pourquoi le Venezuela vend-il le carburant à moins de 0,01 €/L ?">
              Le Venezuela subventionne massivement ses carburants grâce à ses réserves pétrolières.
              C'est une politique de subvention nationale totale : l'État vend à perte pour des raisons
              sociales et politiques. Le pays est le premier producteur de réserves prouvées au monde.
              Cette politique coûte des milliards de dollars/an à l'État vénézuélien.
            </InfoBox>

            <InfoBox color="amber" title="🏔️ Pourquoi la Norvège, premier producteur européen de pétrole, paye-t-elle parmi les plus cher ?">
              La Norvège est un cas classique d'enseignement économique. Elle est 3e exportateur mondial
              de gaz et grand producteur de pétrole, mais ses citoyens paient l'essence très chère.
              Raison : ses taxes sont très élevées (67 %) pour décourager l'usage de la voiture thermique
              et financer la transition énergétique. Elle vend son pétrole au prix du marché mondial et
              reverse les recettes à son fonds souverain (plus de 1 500 milliards de dollars).
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 6 : Qui décide ? ══ */}
        {activeTab === 'acteurs' && (
          <div>
            <SectionTitle icon={Landmark}>Qui fixe le prix du carburant ? Les acteurs décortiqués</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Le prix à la pompe est la résultante de décisions prises par de nombreux acteurs,
              à des niveaux très différents — du désert saoudien à la préfecture de Basse-Terre.
              Voici chaque acteur, son rôle, et son impact réel.
            </p>

            <div className="space-y-4">
              {ACTORS.map((actor) => {
                const Icon = actor.icon;
                return (
                  <div key={actor.role} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{actor.role}</h3>
                        <p className="text-sm text-gray-300 mb-2">{actor.desc}</p>
                        <div className="flex items-start gap-1.5 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{actor.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <InfoBox color="red" title="🏭 L'oligopole local : le problème que personne ne dit clairement">
              Dans les Antilles, La Réunion et la Guyane, le secteur pétrolier aval (dépôts, distribution,
              stations) est contrôlé par très peu d'acteurs : <strong>Rubis Énergie</strong> (ex-Vitogaz,
              Antilles Gaz), <strong>Total</strong>, et <strong>Esso/ExxonMobil</strong>. Cette concentration
              est légale mais réduit la pression concurrentielle. La DGCCRF a ouvert plusieurs enquêtes sur
              les marges pratiquées dans les DOM. Sans les prix plafonnés, les marges pourraient être bien
              plus élevées.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 7 : Sources & méthode ══ */}
        {activeTab === 'sources' && (
          <div>
            <SectionTitle icon={BookOpen}>Sources officielles & méthode de l'Observatoire</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              A KI PRI SA YÉ est un observatoire citoyen. Notre mission est d'apporter de la transparence
              sur les prix dans les Outre-mer. Voici l'ensemble des sources utilisées dans ce dossier
              et la méthode appliquée pour vérifier les chiffres.
            </p>

            <InfoBox color="blue" title="🎯 Notre principe : Observer, pas vendre">
              Nous n'avons aucun intérêt commercial lié aux données sur les carburants. Aucun lien
              d'affiliation avec une enseigne pétrolière. Nos seuls revenus proviennent des abonnements
              citoyens et des licences institutionnelles. Cela garantit notre indépendance éditoriale.
            </InfoBox>

            <h3 className="font-semibold text-white mt-6 mb-3">Sources institutionnelles utilisées</h3>
            <div className="space-y-2">
              {[
                {
                  org: 'DGEC — Direction Générale de l\'Énergie et du Climat',
                  url: 'https://www.ecologie.gouv.fr/direction-generale-lenergie-et-du-climat-dgec',
                  desc: 'Statistiques mensuelles sur les prix des carburants par département. Tableaux de structure des prix. Données TICPE département par département.',
                },
                {
                  org: 'IEDOM — Institut d\'Émission des Départements d\'Outre-Mer',
                  url: 'https://www.iedom.fr',
                  desc: 'Rapports annuels 2022-2023 pour GP, MQ, GF, RE, YT. Données économiques de base, niveaux de prix, pouvoir d\'achat.',
                },
                {
                  org: 'INSEE — Institut National de la Statistique',
                  url: 'https://www.insee.fr',
                  desc: 'Enquête "Les niveaux de vie dans les DOM" (2017, actualisée 2023). Données chômage et PIB par territoire.',
                },
                {
                  org: 'DGCCRF — Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes',
                  url: 'https://www.economie.gouv.fr/dgccrf',
                  desc: 'Rapports d\'enquête sur les prix et les marges dans les DOM. Signalements et amendes.',
                },
                {
                  org: 'Cour des Comptes — Rapport "La maîtrise des risques pétroliers" (2022)',
                  url: 'https://www.ccomptes.fr',
                  desc: 'Analyse approfondie de la chaîne pétrolière française, des marges de raffinage, de la fiscalité.',
                },
                {
                  org: 'Prefectures DOM — Arrêtés de prix carburants',
                  url: 'https://www.guadeloupe.gouv.fr',
                  desc: 'Textes juridiques mensuels fixant les prix plafonds. Disponibles sur les sites officiel des préfectures.',
                },
                {
                  org: 'data.economie.gouv.fr — API prix-carburants-en-france-flux-instantane-v2',
                  url: 'https://data.economie.gouv.fr',
                  desc: 'API officielle fournissant les prix en temps réel de toutes les stations-service françaises, incluant les DOM-TOM.',
                },
                {
                  org: 'GlobalPetrolPrices.com',
                  url: 'https://www.globalpetrolprices.com',
                  desc: 'Comparatif international des prix des carburants mis à jour hebdomadairement.',
                },
              ].map((s) => (
                <div key={s.org} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white text-sm">{s.org}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      title={`Visiter ${s.org}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-white mt-8 mb-3">Notre méthode de vérification</h3>
            <div className="space-y-3">
              {[
                'Croisement systématique des données entre au moins 2 sources officielles avant publication',
                'Les prix affichés sont des moyennes ou des fourchettes — nous ne donnons jamais un chiffre précis sans mentionner la source',
                'Les pourcentages de décomposition du prix sont issus des tableaux DGEC, complétés par les arrêtés préfectoraux',
                'Cette page est révisée chaque mois lors de la mise à jour des arrêtés préfectoraux',
                'Tous les contenus sont relus par un professionnel de l\'énergie et un juriste spécialisé DOM',
              ].map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold mt-0.5">✓</span>
                  {m}
                </div>
              ))}
            </div>

            <InfoBox color="green" title="💬 Vous avez des données à partager ou une correction à signaler ?">
              Si vous êtes agent de préfecture, stationiste, ou citoyen avec des données officielles
              (arrêtés, relevés de prix, etc.), contactez-nous via notre formulaire de contact.
              Nous vérifions et intégrons les contributions dans notre base de données.
            </InfoBox>
          </div>
        )}

        {/* CTA bottom */}
        <div className="mt-12 bg-gradient-to-r from-orange-900/30 to-slate-900 border border-orange-500/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-lg mb-1">
              🔎 Comparez les prix en direct dans votre île
            </h3>
            <p className="text-sm text-gray-400">
              Utilisez notre comparateur pour trouver la station la moins chère et naviguer directement vers elle avec le GPS.
            </p>
          </div>
          <Link
            to="/comparateur-carburants"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors"
          >
            <Droplet className="w-4 h-4" /> Comparateur Carburants
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-700 text-center">
          Observatoire A KI PRI SA YÉ — Dossier carburants v2.0 — Mars 2026.
          Ce contenu est fourni à titre informatif uniquement. Voir{' '}
          <Link to="/methodologie" className="underline hover:text-gray-500">notre méthodologie</Link>
          {' '}pour plus de détails.
        </p>
      </div>
    </div>
  );
};

export default EnqueteCarburants;
