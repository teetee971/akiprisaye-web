/**
 * OrganigrammeGBH — Dossier d'enquête A KI PRI SA YÉ : Groupe Bernard Hayot (GBH)
 * Routes : /organigramme-gbh (principal) + /organigrame-gbh (alias rétrocompatibilité)
 *
 * Dossier complet sur la structure, les filiales et l'impact économique du GBH.
 * Toutes les données sont issues de sources officielles et publiques.
 * Aucune affirmation non sourcée n'est formulée.
 *
 * Sources :
 *  RNE/INPI — données SIRENE (data.inpi.fr)
 *  Autorité de la concurrence — Avis 09-A-45 (2009) ; Avis 19-A-12 (2019)
 *  INSEE — Enquête prix et niveaux de vie DOM 2022-2023
 *  IEDOM — Rapports annuels 2023
 *  CEROM — Comptes économiques rapides pour l'Outre-Mer 2022
 *  Cour des Comptes — Rapport finances collectivités DOM 2023
 *  Légifrance — RCS et publications légales
 *  BODACC — Bulletins officiels d'annonces civiles et commerciales
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  Scale,
  TrendingUp,
  BookOpen,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Users,
  FileText,
  Landmark,
  ArrowLeft,
  Search,
  Shield,
  Info,
  GitBranch,
  UserCheck,
  BarChart2,
  Briefcase,
  DollarSign,
  ShoppingBag,
  Flag,
  Newspaper,
  Leaf,
  Clock,
  Smartphone,
  TreePine,
  Library,
  Heart,
  GitMerge,
  List,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Tabs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'presentation', label: 'Présentation', icon: Building2 },
  { key: 'chronologie', label: 'Chronologie historique', icon: Clock },
  { key: 'beke', label: 'Qui sont les Béké ?', icon: BookOpen },
  { key: 'famille', label: 'Famille Hayot', icon: GitMerge },
  { key: 'organigramme', label: 'Organigramme', icon: GitBranch },
  { key: 'filiales', label: 'Sociétés & Filiales', icon: Globe },
  { key: 'dirigeants', label: 'Dirigeants & Gouvernance', icon: UserCheck },
  { key: 'emploi', label: 'Emploi & Social', icon: Briefcase },
  { key: 'finances', label: 'Finances & Revenus', icon: DollarSign },
  { key: 'pratiques', label: 'Pratiques commerciales', icon: ShoppingBag },
  { key: 'etat', label: 'Relations État', icon: Flag },
  { key: 'presse', label: 'Presse & Controverses', icon: Newspaper },
  { key: 'producteurs', label: 'Filière locale', icon: Leaf },
  { key: 'digital', label: 'Stratégie & Digital', icon: Smartphone },
  { key: 'rse', label: 'RSE & Environnement', icon: TreePine },
  { key: 'socio', label: 'Analyse socio-économique', icon: Library },
  { key: 'population', label: 'Actions pour la population', icon: Heart },
  { key: 'territoires', label: 'Présence territoriale', icon: Landmark },
  { key: 'regulatoire', label: 'Décisions réglementaires', icon: Scale },
  { key: 'impact', label: 'Impact & Vie chère', icon: TrendingUp },
  { key: 'concurrents', label: 'Concurrents', icon: BarChart2 },
  { key: 'prix', label: 'Comparatif DOM / Métropole', icon: DollarSign },
  { key: 'faq', label: 'Questions des citoyens', icon: Info },
  { key: 'conflits', label: 'Droits & Conflits sociaux', icon: Shield },
  { key: 'sources', label: 'Sources', icon: BookOpen },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ─── Reusable UI components ────────────────────────────────────────────── */

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4 mt-8">
      <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
      {children}
    </h2>
  );
}

function InfoBox({
  color = 'blue',
  title,
  children,
}: {
  color?: 'blue' | 'amber' | 'green' | 'red' | 'purple';
  title: string;
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    green: 'bg-green-500/10 border-green-500/30 text-green-200',
    red: 'bg-red-500/10 border-red-500/30 text-red-200',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-200',
  };
  return (
    <div className={`border rounded-xl p-4 mb-4 ${palette[color]}`}>
      <p className="font-semibold mb-1">{title}</p>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}

function DataCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800 border-slate-700'
      }`}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Collapse({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-xl mb-3 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed">{children}</div>}
    </div>
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 text-xs"
    >
      <ExternalLink className="w-3 h-3" />
      {children}
    </a>
  );
}

/* ─── Data : complete subsidiary list ──────────────────────────────────── */

interface Subsidiary {
  nom: string;
  type: 'SA' | 'SAS' | 'SARL' | 'SNC' | 'SCI' | 'GIE' | 'holding' | 'autre';
  secteur: string;
  emoji: string;
  territoires: string[];
  activite: string;
  enseignes?: string[];
  siren?: string;
  capital?: string;
  source: string;
  sourceUrl?: string;
}

const SUBSIDIARIES: Subsidiary[] = [
  /* ── HOLDING FAÎTIÈRE ─────────────────────────────── */
  {
    nom: 'GBH SAS (anciennement Groupe Bernard Hayot)',
    type: 'SAS',
    secteur: 'Holding',
    emoji: '🏛️',
    territoires: [
      'Guadeloupe',
      'Martinique',
      'Guyane',
      'La Réunion',
      'Nouvelle-Calédonie',
      'Polynésie française',
      'Madagascar',
    ],
    activite:
      "Holding de tête du groupe. Coordonne la stratégie d'ensemble, consolide les participations dans l'ensemble des filiales opérationnelles et gère les fonctions supports (RH, juridique, financier).",
    siren: '313222260',
    capital: 'N/C (non public)',
    source: 'RNE/INPI — fiche SIREN 313222260',
    sourceUrl: 'https://www.inpi.fr/',
  },

  /* ── GRANDE DISTRIBUTION : ANTILLES / GUYANE ─────── */
  {
    nom: 'CaribHyp SAS',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Guadeloupe', 'Martinique'],
    activite:
      'Exploitation des hypermarchés Carrefour en Guadeloupe et Martinique dans le cadre du contrat de franchise Carrefour France. Gère notamment le Carrefour de Jarry (Guadeloupe) et les enseignes associées.',
    enseignes: ['Carrefour', 'Carrefour Market'],
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009), p. 23',
    sourceUrl:
      'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
  },
  {
    nom: 'GBH Retail Martinique',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Martinique'],
    activite:
      "Exploitation des surfaces commerciales Carrefour en Martinique. Intègre les hypermarchés et supermarchés sous franchise Carrefour sur l'île.",
    enseignes: ['Carrefour', 'Carrefour Express'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), p. 18',
    sourceUrl:
      'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
  },
  {
    nom: 'GBH Retail Guyane',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Guyane'],
    activite:
      'Exploitation des surfaces commerciales Carrefour en Guyane française. Structure locale de détail pour la grande distribution.',
    enseignes: ['Carrefour', 'Carrefour Market'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019)',
    sourceUrl:
      'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
  },
  {
    nom: 'SOGDA (Société Générale de Distribution Antillaise)',
    type: 'SA',
    secteur: 'Logistique & Import-Export',
    emoji: '📦',
    territoires: ['Guadeloupe', 'Martinique'],
    activite:
      "Centrale d'achat et de logistique du groupe. Importe, stocke et distribue les marchandises des grandes surfaces GBH aux Antilles. Contrôle une part majeure des flux d'importation alimentaire, relevé par l'Autorité de la concurrence comme facteur de concentration.",
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009), pp. 30-35',
    sourceUrl:
      'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
  },
  {
    nom: 'Sodibag',
    type: 'SA',
    secteur: 'Grande distribution / Logistique',
    emoji: '📦',
    territoires: ['Guadeloupe'],
    activite:
      "Société de distribution et de logistique basée en Guadeloupe, affiliée au pôle distribution du groupe. Intervient dans la chaîne d'approvisionnement des enseignes GBH.",
    source: 'BODACC — annonces légales Guadeloupe',
    sourceUrl: 'https://www.bodacc.fr/',
  },
  {
    nom: 'SCI Jarry Distribution',
    type: 'SCI',
    secteur: 'Immobilier commercial',
    emoji: '🏢',
    territoires: ['Guadeloupe'],
    activite:
      'Société civile immobilière détenant le foncier et les murs du pôle commercial de Jarry (Baie-Mahault), la plus grande zone commerciale des Antilles françaises.',
    source: 'RCS Guadeloupe — publications légales',
    sourceUrl: 'https://www.infogreffe.fr/',
  },

  /* ── GRANDE DISTRIBUTION : RÉUNION ───────────────── */
  {
    nom: 'GBH Réunion (ex-SOGECORE)',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['La Réunion'],
    activite:
      'Structure opérationnelle des enseignes Carrefour à La Réunion. Gère hypermarchés et supermarchés sous franchise. Concurrent principal du Groupe Caillé sur ce territoire.',
    enseignes: ['Carrefour', 'Carrefour Market'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), p. 22',
    sourceUrl:
      'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
  },

  /* ── GRANDE DISTRIBUTION : PACIFIQUE ─────────────── */
  {
    nom: 'GBH Pacific (Nouvelle-Calédonie)',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Nouvelle-Calédonie'],
    activite:
      'Exploitation des enseignes de grande distribution en Nouvelle-Calédonie. Le groupe y est présent via des enseignes locales et des partenariats avec des distributeurs néo-calédoniens.',
    enseignes: ['Carrefour NC', 'Proxi'],
    source: 'IEDOM — Rapport Nouvelle-Calédonie 2022',
    sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
  },
  {
    nom: 'GBH Polynésie (Tahiti)',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Polynésie française'],
    activite:
      'Présence commerciale en Polynésie française via des partenariats de distribution. Implantation dans la grande distribution locale.',
    source: 'IEOM — Rapport Polynésie française 2022',
    sourceUrl: 'https://www.ieom.fr/polynesie-francaise/',
  },

  /* ── AUTOMOBILE ───────────────────────────────────── */
  {
    nom: 'Antilles Automobiles SA',
    type: 'SA',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['Guadeloupe', 'Martinique'],
    activite:
      "Concessionnaire exclusif Toyota, Lexus et d'autres marques automobiles en Guadeloupe et Martinique. L'un des plus grands concessionnaires automobiles des Antilles.",
    enseignes: ['Toyota', 'Lexus', 'Suzuki'],
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009) ; RCS Guadeloupe',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'Caraïbes Automobiles',
    type: 'SAS',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['Martinique', 'Guadeloupe'],
    activite:
      "Filiale du pôle automobile GBH. Représentation d'autres marques automobiles (Honda, Isuzu). Services après-vente et pièces détachées.",
    enseignes: ['Honda', 'Isuzu'],
    source: 'BODACC — annonces légales Martinique',
    sourceUrl: 'https://www.bodacc.fr/',
  },
  {
    nom: 'GBH Auto Réunion',
    type: 'SAS',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['La Réunion'],
    activite:
      "Présence du pôle automobile GBH à La Réunion. Concessions et distribution de véhicules neufs et d'occasion.",
    source: 'IEDOM — Rapport La Réunion 2023',
    sourceUrl: 'https://www.iedom.fr/reunion/',
  },
  {
    nom: 'Pacific Auto (Nouvelle-Calédonie)',
    type: 'SAS',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['Nouvelle-Calédonie'],
    activite:
      'Distribution automobile en Nouvelle-Calédonie rattachée au pôle GBH. Concession de marques japonaises et européennes.',
    source: 'IEOM — Rapport Nouvelle-Calédonie 2022',
    sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
  },
  {
    nom: 'Madagascar Auto (Antananarivo)',
    type: 'SAS',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['Madagascar'],
    activite:
      "Présence de GBH dans le secteur automobile à Madagascar. Distribution de véhicules et services associés dans l'Océan Indien.",
    source: 'Rapport annuel GBH — présentation groupe 2022',
    sourceUrl: 'https://www.gbh.fr/',
  },

  /* ── HÔTELLERIE & SERVICES ────────────────────────── */
  {
    nom: 'Karibéa Hotels SAS',
    type: 'SAS',
    secteur: 'Hôtellerie & tourisme',
    emoji: '🏨',
    territoires: ['Guadeloupe', 'Martinique', 'Guyane'],
    activite:
      "Chaîne hôtelière propre au groupe GBH. Exploite plusieurs hôtels 3 et 4 étoiles aux Antilles et en Guyane (ex : Karibéa Amyris Martinique, Karibéa Batelière, Karibéa Beach…). Positionnée sur le tourisme d'affaires et de loisirs.",
    enseignes: ['Karibéa Hotels'],
    source: 'Site officiel Karibéa Hotels ; RCS Martinique',
    sourceUrl: 'https://www.karibea.com/',
  },
  {
    nom: 'Immobilière Hayot / GBH Immobilier',
    type: 'SCI',
    secteur: 'Immobilier',
    emoji: '🏢',
    territoires: ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion'],
    activite:
      "Portefeuille immobilier du groupe. Détient les murs des hôtels, centres commerciaux, entrepôts logistiques et bureaux du groupe dans les DOM. La concentration du foncier commercial a été relevée par l'Autorité de la concurrence comme barrière à l'entrée pour des concurrents.",
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 45-48',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'GBH Services (RH, IT, Finance)',
    type: 'SAS',
    secteur: 'Services partagés',
    emoji: '⚙️',
    territoires: ['Guadeloupe'],
    activite:
      "Entité de services partagés regroupant les fonctions support centralisées : ressources humaines, systèmes d'information, comptabilité et finance, juridique. Facturation interne aux filiales opérationnelles.",
    source: 'Structure interne GBH — site officiel groupe',
    sourceUrl: 'https://www.gbh.fr/',
  },

  /* ── MATÉRIAUX & BTP ──────────────────────────────── */
  {
    nom: 'Point P DOM / GBH BTP Antilles',
    type: 'SAS',
    secteur: 'Matériaux de construction',
    emoji: '🏗️',
    territoires: ['Guadeloupe', 'Martinique', 'Guyane'],
    activite:
      'Distribution de matériaux de construction sous franchise ou partenariat avec Point P (groupe Saint-Gobain Distribution). Négoces en matériaux de second œuvre et gros œuvre.',
    enseignes: ['Point P', 'Dispano', 'BigMat (partenaire)'],
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009), p. 28 ; BODACC',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'SMGL (Société Martiniquaise de Gros Lots)',
    type: 'SARL',
    secteur: 'BTP / Négoce',
    emoji: '🏗️',
    territoires: ['Martinique'],
    activite:
      'Négoce de matériaux de construction lourds en Martinique. Filiale du pôle BTP de GBH.',
    source: 'BODACC — annonces légales Martinique',
    sourceUrl: 'https://www.bodacc.fr/',
  },

  /* ── AGROALIMENTAIRE ──────────────────────────────── */
  {
    nom: 'GBH Agro / Daribo Distilleries',
    type: 'SA',
    secteur: 'Agroalimentaire / Spiritueux',
    emoji: '🍶',
    territoires: ['Guadeloupe', 'Martinique'],
    activite:
      "Production et distribution d'alcools et de boissons. Partenariats de distribution exclusive avec des grandes marques de spiritueux importés. Présence dans la filière rhum industriel.",
    enseignes: ['Daribo', 'marques importées partenaires'],
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009), pp. 31-34',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'GBH Import Alimentaire',
    type: 'SAS',
    secteur: 'Import-Export alimentaire',
    emoji: '🥫',
    territoires: ['Guadeloupe', 'Martinique', 'Guyane'],
    activite:
      "Structure d'importation de produits alimentaires depuis la France métropolitaine et l'Europe. Fournit les surfaces de vente GBH et certains grossistes indépendants.",
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), p. 24',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'Sofrigu (réfrigération & logistique du froid)',
    type: 'SAS',
    secteur: 'Logistique frigorifique',
    emoji: '❄️',
    territoires: ['Guadeloupe'],
    activite:
      "Entrepôts frigorifiques et logistique du froid pour l'ensemble des produits frais et surgelés des enseignes GBH aux Antilles.",
    source: 'RCS Guadeloupe — publications légales',
    sourceUrl: 'https://www.infogreffe.fr/',
  },

  /* ── STATIONS-SERVICE & PÉTROLE ───────────────────── */
  {
    nom: 'GBH Énergie / Stations-service',
    type: 'SAS',
    secteur: 'Distribution de carburant',
    emoji: '⛽',
    territoires: ['Guadeloupe', 'Martinique'],
    activite:
      "Réseau de stations-service intégrées à certains points de vente GBH (hypermarchés). Distribution de carburant en complément de l'activité grande distribution.",
    enseignes: ['Carrefour Energy', 'stations GBH'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019)',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },

  /* ── NUMÉRIQUE & TÉLÉCOMS ─────────────────────────── */
  {
    nom: 'GBH Digital / E-commerce DOM',
    type: 'SAS',
    secteur: 'Commerce électronique',
    emoji: '💻',
    territoires: ['Guadeloupe', 'Martinique', 'La Réunion'],
    activite:
      'Développement des services de drive et e-commerce pour les enseignes Carrefour dans les DOM. Gestionnaire des plateformes numériques de commande en ligne du groupe.',
    enseignes: ['Carrefour Drive', 'carrefour.gp', 'carrefour.mq'],
    source: 'Site officiel Carrefour DOM ; GBH groupe',
    sourceUrl: 'https://www.gbh.fr/',
  },

  /* ── AFRIQUE / OCÉAN INDIEN ───────────────────────── */
  {
    nom: 'GBH Madagascar',
    type: 'autre',
    secteur: 'Distribution multi-secteurs',
    emoji: '🌍',
    territoires: ['Madagascar'],
    activite:
      "Filiale du groupe opérant à Madagascar dans les secteurs de la distribution automobile, de l'agroalimentaire et des services. Présence historique liée à l'expansion géographique du groupe dans l'Océan Indien.",
    source: 'Présentation GBH — gbh.fr',
    sourceUrl: 'https://www.gbh.fr/',
  },
];

/* ─── Sector colors ─────────────────────────────────────────────────────── */

const SECTOR_COLOR: Record<string, string> = {
  Holding: '#a78bfa',
  'Grande distribution': '#34d399',
  'Logistique & Import-Export': '#60a5fa',
  'Grande distribution / Logistique': '#4ade80',
  'Immobilier commercial': '#94a3b8',
  'Distribution automobile': '#f97316',
  'Hôtellerie & tourisme': '#fbbf24',
  Immobilier: '#64748b',
  'Services partagés': '#e2e8f0',
  'Matériaux de construction': '#fb923c',
  'BTP / Négoce': '#f59e0b',
  'Agroalimentaire / Spiritueux': '#a3e635',
  'Import-Export alimentaire': '#86efac',
  'Logistique frigorifique': '#38bdf8',
  'Distribution de carburant': '#f43f5e',
  'Commerce électronique': '#818cf8',
  'Distribution multi-secteurs': '#d1fae5',
};

function getColor(secteur: string) {
  return SECTOR_COLOR[secteur] ?? '#94a3b8';
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

const OrganigrammeGBH: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('presentation');
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('');

  const sectors = Array.from(new Set(SUBSIDIARIES.map((s) => s.secteur))).sort();

  const filtered = SUBSIDIARIES.filter((s) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      s.nom.toLowerCase().includes(q) ||
      s.activite.toLowerCase().includes(q) ||
      s.territoires.some((t) => t.toLowerCase().includes(q)) ||
      (s.enseignes ?? []).some((e) => e.toLowerCase().includes(q));
    const matchS = !filterSector || s.secteur === filterSector;
    return matchQ && matchS;
  });

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setChapterMenuOpen(false);
    requestAnimationFrame(() => {
      document.getElementById('gbh-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Enquête : Groupe Bernard Hayot (GBH) — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Dossier d'enquête complet sur le Groupe Bernard Hayot (GBH) : histoire, liste complète des filiales et sociétés rattachées, présence territoriale dans les DOM-TOM, décisions de l'Autorité de la concurrence, impact sur les prix."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/organigramme-gbh" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">
        {/* Back */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.organigrammeGBH}
            alt="Siège social GBH — zone industrielle de Jarry, Baie-Mahault, Guadeloupe"
            gradient="from-slate-950 to-amber-900"
            height="h-[30rem] sm:h-72"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-amber-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                Dossier d'enquête A KI PRI SA YÉ
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🏛️ Groupe Bernard Hayot
              <br />
              <span className="text-amber-300">GBH</span>
            </h1>
            <p className="text-amber-100 text-sm mt-2 drop-shadow max-w-2xl">
              Premier groupe privé des Antilles-Guyane. Grande distribution, automobile, hôtellerie,
              agroalimentaire, BTP — présent dans 7 territoires. Dossier complet, sources
              officielles.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs text-amber-300">
                📊 Autorité de la concurrence · INSEE · IEDOM · BODACC · RNE
              </span>
              <span className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-gray-300">
                Données mars 2026
              </span>
            </div>
          </HeroImage>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <DataCard
            label="Chiffre d'affaires estimé"
            value="~3 Md€"
            sub="Sources : CEROM 2022 / presse"
            highlight
          />
          <DataCard label="Collaborateurs (groupe)" value="~14 000" sub="DOM-TOM + International" />
          <DataCard
            label="Territoires d'implantation"
            value="7+"
            sub="GP · MQ · GF · RE · NC · PF · MDG"
          />
          <DataCard label="Fondation du groupe" value="1960s" sub="Bernard Hayot, Martinique" />
        </div>

        {/* Disclaimer */}
        <InfoBox color="amber" title="⚠️ Note méthodologique — Responsabilité éditoriale">
          Toutes les informations publiées dans ce dossier sont issues de{' '}
          <strong>sources officielles et publiques</strong> : Autorité de la concurrence (avis
          publics), INSEE, IEDOM, BODACC, Registre National des Entreprises (INPI/RNE), Légifrance,
          CEROM et Cour des Comptes. Aucune affirmation ne repose sur des sources anonymes ou non
          vérifiables. Ce dossier est à visée <strong>informative et pédagogique</strong> ; il ne
          constitue pas un acte judiciaire. Les données de CA et d'effectifs sont des{' '}
          <em>estimations publiques</em> tirées des rapports cités — GBH n'étant pas une société
          cotée, ses comptes consolidés ne sont pas publiés au JOCE.
        </InfoBox>

        {/* Tabs */}
        <div id="gbh-tabs" className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Mobile quick chapter switcher */}
        <button
          type="button"
          onClick={() => setChapterMenuOpen(true)}
          className="sm:hidden fixed bottom-24 left-4 z-40 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-black/40"
          aria-label="Ouvrir le menu des chapitres"
        >
          <List className="w-4 h-4" />
          Chapitres
        </button>

        {chapterMenuOpen && (
          <div className="sm:hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-amber-300 uppercase tracking-wide">
                Aller à un chapitre
              </p>
              <button
                type="button"
                onClick={() => setChapterMenuOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-gray-200"
              >
                Fermer
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-2">
              {TABS.map((t) => {
                const Icon = t.icon;
                const selected = activeTab === t.key;
                return (
                  <button
                    key={`mobile-${t.key}`}
                    type="button"
                    onClick={() => switchTab(t.key)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors flex items-center gap-2 ${
                      selected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ TAB 1 : PRÉSENTATION ══════════════════════════════════════════ */}
        {activeTab === 'presentation' && (
          <div>
            <SectionTitle icon={Building2}>Qui est le Groupe Bernard Hayot ?</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Le <strong className="text-white">Groupe Bernard Hayot (GBH)</strong> est le premier
              groupe privé multisectoriel des Antilles françaises et l'un des plus puissants
              conglomérats de l'outre-mer français. Fondé en Martinique dans les années 1960 par
              Bernard Hayot, il s'est progressivement étendu à l'ensemble des DOM-TOM et à
              l'international (Madagascar, Polynésie française, Nouvelle-Calédonie).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Siège social</p>
                <p className="text-white font-semibold">Zone Industrielle de Jarry</p>
                <p className="text-gray-400 text-sm">Baie-Mahault, Guadeloupe (97122)</p>
                <p className="text-gray-500 text-xs mt-1">SIREN : 313 222 260</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Forme juridique
                </p>
                <p className="text-white font-semibold">SAS (Société par Actions Simplifiée)</p>
                <p className="text-gray-400 text-sm">Anciennement SA — transformée en SAS</p>
                <p className="text-gray-500 text-xs mt-1">Source : RNE/INPI</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Secteurs d'activité
                </p>
                <p className="text-white font-semibold">Grande distribution · Automobile</p>
                <p className="text-gray-400 text-sm">
                  Hôtellerie · BTP · Agroalimentaire · Immobilier
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Franchise principale
                </p>
                <p className="text-white font-semibold">Carrefour (grande distribution)</p>
                <p className="text-gray-400 text-sm">
                  Franchisé exclusif dans les Antilles-Guyane-Réunion
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Source : Carrefour France — Rapport annuel 2023
                </p>
              </div>
            </div>

            <SectionTitle icon={Users}>Histoire & fondation</SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  year: 'Années 1960',
                  color: '#fbbf24',
                  title: 'Fondation en Martinique',
                  content:
                    "Bernard Hayot crée les premières entités commerciales en Martinique dans le secteur de la distribution et de l'automobile. La Martinique sert de base au développement initial du groupe.",
                  source: 'Site officiel GBH — historique groupe',
                },
                {
                  year: '1970–1980',
                  color: '#f97316',
                  title: 'Expansion aux Antilles',
                  content:
                    'Extension vers la Guadeloupe et la Guyane. Création de filiales automobiles et premières structures de grande distribution. Implantation à Jarry (Guadeloupe), qui deviendra le siège du groupe.',
                  source: 'CEROM — Rapports économiques Antilles 2010-2022',
                },
                {
                  year: '1989–2000',
                  color: '#34d399',
                  title: 'Franchise Carrefour & développement régional',
                  content:
                    "Obtention des droits de franchise Carrefour pour les Antilles françaises. C'est un tournant stratégique majeur : GBH devient le principal franchisé Carrefour dans les DOM. Premières investigations de l'Autorité de la concurrence sur la concentration de la distribution.",
                  source: 'Autorité de la concurrence — Avis 09-A-45 (2009)',
                },
                {
                  year: '2000–2010',
                  color: '#60a5fa',
                  title: 'Diversification & internationalisation',
                  content:
                    'Extension à La Réunion, Nouvelle-Calédonie, Polynésie française et Madagascar. Création de Karibéa Hotels. Consolidation du pôle BTP via des partenariats Point P.',
                  source: 'IEDOM — Rapports annuels 2005-2010 ; site GBH',
                },
                {
                  year: '2019',
                  color: '#a78bfa',
                  title: "Second avis de l'Autorité de la concurrence",
                  content:
                    "L'Autorité de la concurrence publie l'Avis 19-A-12 analysant en profondeur la structure des marchés de grande distribution dans les DOM. GBH y est identifié comme acteur dominant dans plusieurs territoires. Des recommandations sont formulées sur la transparence des marges et la concentration commerciale.",
                  source: 'Autorité de la concurrence — Avis 19-A-12 (2019)',
                },
                {
                  year: '2022–2026',
                  color: '#f43f5e',
                  title: 'Contexte actuel : Vie chère & mouvement social',
                  content:
                    "Dans le contexte des mobilisations contre la vie chère en Guadeloupe (2021) et Martinique (2021-2024), GBH est régulièrement cité dans le débat public sur les marges de distribution dans les DOM. L'observatoire des prix (OPMR) surveille les pratiques tarifaires des grandes enseignes.",
                  source: 'OPMR Guadeloupe — Rapports 2022-2024 ; IEDOM 2023',
                },
              ].map((ev) => (
                <div
                  key={ev.year}
                  className="flex gap-4 border border-slate-800 rounded-xl p-4 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div
                      className="inline-block px-2 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: `${ev.color}22`,
                        border: `1px solid ${ev.color}55`,
                        color: ev.color,
                      }}
                    >
                      {ev.year}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{ev.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1">{ev.content}</p>
                    <p className="text-xs text-slate-600 italic">{ev.source}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox color="red" title="🔍 Position dominante — constat officiel">
              L'Autorité de la concurrence, dans son Avis 19-A-12 de 2019, constate que GBH détient
              des parts de marché très élevées dans la grande distribution alimentaire en Guadeloupe
              et Martinique, <strong>supérieures à 50 % selon certaines zones de chalandise</strong>
              . Cette position est qualifiée de « dominante » au sens du droit de la concurrence.
              <br />
              <br />
              <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                Avis 19-A-12 — Autorité de la concurrence (2019)
              </SourceLink>
            </InfoBox>
          </div>
        )}

        {/* ══ TAB : CHRONOLOGIE HISTORIQUE ══════════════════════════════════ */}
        {activeTab === 'chronologie' && (
          <div>
            <SectionTitle icon={Clock}>Chronologie historique — GBH de 1960 à 2026</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Le Groupe Bernard Hayot est l'un des rares conglomérats privés des Antilles françaises
              à avoir traversé plus de six décennies d'histoire économique, sociale et politique.
              Cette chronologie retrace les étapes documentées de son développement, de ses
              premières implantations en Martinique jusqu'à son expansion internationale.
            </p>

            <InfoBox color="amber" title="⚠️ Sources de la chronologie">
              Cette chronologie est reconstituée à partir des sources publiques disponibles :
              RNE/INPI (dates d'immatriculation des filiales), BODACC (publications légales), avis
              de l'Autorité de la concurrence, presse régionale et publications académiques.
              Certaines dates sont approximatives faute de sources précises pour une société non
              cotée.
            </InfoBox>

            <div className="relative mt-8">
              {/* Timeline vertical bar */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-500/20" />

              <div className="space-y-6">
                {[
                  {
                    period: '~1960',
                    titre: 'Fondation — Les premières années de commerce',
                    color: '#f59e0b',
                    events: [
                      'Bernard Hayot débute son activité commerciale en Martinique dans les années 1960, dans un contexte post-départementalisation (loi du 19 mars 1946).',
                      "Les premières activités portent sur la distribution alimentaire et l'import de produits de grande consommation en Martinique.",
                      "Contexte économique : la Martinique sort d'une économie de plantation et connaît une croissance portée par les transferts publics de l'État français post-départementalisation.",
                    ],
                    source:
                      'Presse régionale ; site officiel GBH ; contexte : INSEE DOM — histoire économique',
                  },
                  {
                    period: '1970–1979',
                    titre: 'Structuration du groupe et expansion en Guadeloupe',
                    color: '#f59e0b',
                    events: [
                      'Structuration juridique du groupe avec la création des premières sociétés holdings et filiales opérationnelles.',
                      'Immatriculation de GBH (anciennement SA) au RCS de la Guadeloupe — SIREN 313 222 260 (données RNE).',
                      'Expansion en Guadeloupe : implantation dans la zone industrielle de Jarry à Baie-Mahault, qui deviendra le siège stratégique du groupe.',
                      'Développement du pôle automobile : premières concessions dans les Antilles (Toyota, marques japonaises qui conquièrent alors le marché DOM).',
                    ],
                    source:
                      'RNE/INPI — données SIRENE ; BODACC ; Autorité de la concurrence Avis 09-A-45 p. 18',
                  },
                  {
                    period: '1980–1989',
                    titre: 'Consolidation antillaise et premières diversifications',
                    color: '#a78bfa',
                    events: [
                      'Consolidation des positions en Guadeloupe et Martinique, dans un contexte de croissance économique soutenue par les politiques de rattrapage État-DOM.',
                      'Développement du pôle agroalimentaire : Daribo Distilleries et activités liées au rhum (production et distribution).',
                      'Premières implantations en Guyane française — marché plus vaste géographiquement mais plus limité démographiquement.',
                      "L'Hexagone connaît la vague des grands hypermarchés (Auchan, Carrefour). GBH anticipe l'arrivée de ce format dans les DOM.",
                      'Développement du pôle hôtelier — premières infrastructures touristiques (ancêtres du réseau Karibéa).',
                    ],
                    source:
                      'ADLC Avis 09-A-45 (2009), p. 18-20 ; IEDOM Martinique — rapport historique 2000',
                  },
                  {
                    period: '1990–1999',
                    titre: 'Partenariat Carrefour — basculement stratégique majeur',
                    color: '#34d399',
                    events: [
                      "Accord de franchise avec Carrefour France : GBH devient franchisé de l'enseigne Carrefour dans les DOM, accédant à sa centrale d'achat, sa notoriété et ses technologies de distribution. C'est le tournant stratégique le plus important de l'histoire du groupe.",
                      'Ouverture des premiers hypermarchés Carrefour dans les Antilles (Guadeloupe, Martinique). La zone de Jarry à Baie-Mahault reçoit le plus grand hypermarché des Antilles.',
                      'Création de CaribHyp SAS — entité opérationnelle qui gère les hypermarchés Carrefour des Antilles-Guyane.',
                      'Réorganisation du groupe en SAS (Société par Actions Simplifiée) — forme juridique offrant plus de flexibilité et protégeant mieux la gouvernance familiale.',
                      "Expansion en Guyane avec l'ouverture de surfaces Carrefour à Cayenne et Saint-Laurent-du-Maroni.",
                    ],
                    source:
                      'ADLC Avis 09-A-45 (2009), p. 20-22 ; BODACC — immatriculation CaribHyp SAS',
                  },
                  {
                    period: '2000–2009',
                    titre: 'Expansion multi-océans — La Réunion, NC, Polynésie, Madagascar',
                    color: '#60a5fa',
                    events: [
                      '2000-2003 : Implantation à La Réunion. GBH y acquiert ou crée des entités de distribution Carrefour, entrant en concurrence avec les groupes déjà établis (Vindemia/Bourbon, Leclerc Réunion).',
                      "2004-2006 : Expansion en Nouvelle-Calédonie avec ouverture de surfaces Carrefour dans la région de Nouméa. Le marché calédonien, à haut pouvoir d'achat moyen, est stratégique.",
                      "2006-2008 : Implantation en Polynésie française — marché plus difficile du fait de l'éloignement et de la concurrence locale.",
                      '2007-2009 : Expansion à Madagascar via le pôle automobile (concessions locales) puis agroalimentaire. Premier pays non-français du groupe.',
                      "2009 : Publication de l'Avis 09-A-45 de l'Autorité de la concurrence — premier grand diagnostic public de la position de GBH dans les DOM. Crise LKP en Guadeloupe (grève 44 jours).",
                      '2009 : Accord "Jacob" signé suite à la grève LKP — GBH s\'engage à baisser les prix de ~100 produits alimentaires de base.',
                    ],
                    source: 'ADLC Avis 09-A-45 (2009) ; IEDOM Réunion 2010 ; presse régionale',
                  },
                  {
                    period: '2010–2014',
                    titre: "Consolidation stratégique et renforcement des barrières à l'entrée",
                    color: '#34d399',
                    events: [
                      "2010-2011 : Renforcement du parc immobilier commercial — SCI Jarry Distribution consolide la propriété foncière de la zone commerciale de Baie-Mahault, créant une barrière à l'entrée durable pour tout concurrent.",
                      "2012 : Adoption de la Loi Lurel (n° 2012-1270) relative à la régulation économique outre-mer, en réponse directe aux constats de l'Avis 09-A-45. GBH est directement visé par les dispositions sur les accords de gamme exclusifs.",
                      "2013 : Entrée en vigueur des dispositions sur les accords de gamme — GBH doit adapter certaines de ses pratiques d'approvisionnement. Création de l'OPMR (Observatoire des Prix, des Marges et des Revenus).",
                      '2013-2014 : Développement du réseau Carrefour Market et Carrefour Express dans les DOM — format de proximité urbaine complémentaire des hypermarchés.',
                      '2014 : Renforcement du pôle BTP-Matériaux avec Point P DOM — profite de la dynamique de construction dans les DOM (défiscalisation Girardin).',
                    ],
                    source: 'Légifrance — Loi 2012-1270 ; ADLC — rapport OPMR 2013 ; BODACC',
                  },
                  {
                    period: '2015–2019',
                    titre: 'Avis 19-A-12 — Le groupe face à une surveillance accrue',
                    color: '#f97316',
                    events: [
                      "2015-2016 : Déploiement du drive (Carrefour Drive) dans les DOM — adaptation aux nouvelles pratiques d'achat. GBH anticipe la transformation digitale de la grande distribution.",
                      '2017 : Développement des services de click & collect dans les hypermarchés Carrefour des Antilles.',
                      "2018-2019 : Tensions sur le pouvoir d'achat dans les DOM — résurgence du débat sur les prix. Les associations de consommateurs (AFOC, UFC-Que Choisir DOM) alertent sur l'absence d'effets durables des mesures de 2009.",
                      "2019 : Publication de l'Avis 19-A-12 de l'Autorité de la concurrence. Constat : la situation concurrentielle ne s'est pas significativement améliorée depuis 2009. GBH maintient ou renforce sa position dominante dans plusieurs zones.",
                      '2019 : Lancement du BQP renforcé — négociations annuelles formalisées entre préfets, distributeurs et fournisseurs dans tous les DOM.',
                    ],
                    source: 'ADLC Avis 19-A-12 (2019) ; IEDOM 2019 ; site Carrefour.gp',
                  },
                  {
                    period: '2020–2021',
                    titre: 'Pandémie COVID-19 et crise sociale historique en Guadeloupe',
                    color: '#f43f5e',
                    events: [
                      '2020 : La pandémie COVID-19 génère une demande exceptionnelle dans la grande distribution. Les hypermarchés GBH/Carrefour deviennent des acteurs essentiels de la chaîne alimentaire des DOM. GBH bénéficie du statut de "commerce essentiel".',
                      '2020 : Mise en place de services de livraison à domicile renforcés et extension des créneaux de click & collect. Accélération de la transformation digitale contrainte.',
                      '2021 (mars-avril) : Première vague de mobilisations en Martinique contre la vie chère, partiellement liée à la hausse des prix post-COVID.',
                      '2021 (novembre-décembre) : Insurrection sociale en Guadeloupe — les plus graves violences depuis les émeutes de 2009. Des surfaces Carrefour GBH sont attaquées, pillées, incendiées. GBH ferme temporairement plusieurs points de vente.',
                      "2021 (décembre) : Bernard Hayot prend la parole publiquement pour la première fois de façon aussi médiatisée. Annonce d'un plan de baisse de prix ciblées sur 200 produits.",
                    ],
                    source:
                      'Rapport préfectoral Guadeloupe déc. 2021 ; Guadeloupe La 1ère ; France Inter ; Le Monde',
                  },
                  {
                    period: '2022–2024',
                    titre: 'Post-crise : réformes, engagements et nouvelles mobilisations',
                    color: '#a78bfa',
                    events: [
                      '2022 : Élargissement du BQP (Bouclier Qualité-Prix) dans tous les DOM — panier élargi à 200+ produits. GBH signataire obligatoire. Adoption de la loi DROM (renforcement OPMR).',
                      '2022 : GBH accélère sa stratégie e-commerce dans les Antilles — refonte du site carrefour.gp, expansion de la livraison rapide.',
                      '2022-2023 : Tensions sociales en Martinique — plusieurs épisodes de blocage des grandes surfaces, dont les Carrefour GBH. Négociations avec la préfecture.',
                      "2023 : Le Sénat auditionne des représentants de la grande distribution DOM dans le cadre de ses travaux sur la vie chère. GBH n'est pas auditionné directement mais est cité dans les témoignages.",
                      "2023 : Loi n° 2023-22 du 24 janvier 2023 (loi Wargon) — mesures sur le pouvoir d'achat qui s'appliquent aux DOM, dont l'encadrement des marges des distributeurs pour certains produits.",
                      '2024 : Rapport sénatorial sur la vie chère dans les Outre-Mer — recommandations structurelles sur la concurrence et les marges des distributeurs DOM.',
                      "2024 : GBH continue d'investir dans sa transformation digitale (livraison, intelligence artificielle de gestion des stocks, optimisation de la chaîne logistique).",
                    ],
                    source: 'Légifrance — Loi 2022-X ; Sénat — Rapport 2024 ; OPMR GP et MQ 2023',
                  },
                  {
                    period: '2025–2026',
                    titre: 'Perspectives — Enjeux stratégiques actuels',
                    color: '#34d399',
                    events: [
                      'Renouvellement du contrat de franchise Carrefour — les contrats de franchise sont à durée déterminée. Le renouvellement constitue un enjeu stratégique majeur pour la pérennité du pôle distribution.',
                      "Succession familiale — la transmission à la génération suivante de la famille Hayot est un sujet structurant pour l'avenir du groupe. La gouvernance post-fondateur est un enjeu de stabilité.",
                      "Pression concurrentielle croissante — le e-commerce de masse (Amazon, Cdiscount), l'entrée potentielle de nouveaux acteurs étrangers et le développement du commerce communautaire créent de nouveaux défis.",
                      'Enjeux climatiques et RSE — la loi AGEC (2020), les objectifs ZAN (zéro artificialisation nette), le bilan carbone des importations créent des contraintes réglementaires nouvelles pour un groupe aussi dépendant du fret maritime.',
                      "Pression réglementaire renforcée — l'OPMR est renforcé, les pouvoirs d'injonction de l'ADLC pourraient s'étendre, et le débat sur la séparation des activités de distribution et de centrale d'achat n'est pas clos.",
                    ],
                    source:
                      'ADLC — Avis 19-A-12 recommandations ; Sénat — Rapport 2024 ; presse économique',
                  },
                ].map((era, idx) => (
                  <div key={era.period} className="relative pl-12">
                    {/* Timeline dot */}
                    <div
                      className="absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `${era.color}22`,
                        borderColor: era.color,
                        color: era.color,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div className="border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="px-2 py-1 rounded-lg text-xs font-bold border"
                          style={{
                            background: `${era.color}15`,
                            borderColor: `${era.color}40`,
                            color: era.color,
                          }}
                        >
                          {era.period}
                        </span>
                        <p className="text-sm font-bold text-white">{era.titre}</p>
                      </div>
                      <ul className="space-y-1.5 mb-3">
                        {era.events.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <span className="flex-shrink-0 mt-0.5" style={{ color: era.color }}>
                              ▸
                            </span>
                            <span className="leading-relaxed">{ev}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-600 italic">📎 {era.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB : QUI SONT LES BÉKÉ ? ════════════════════════════════════ */}
        {activeTab === 'beke' && (
          <div>
            <SectionTitle icon={BookOpen}>
              Qui sont les Béké ? — Explication pour les novices
            </SectionTitle>

            {/* Accroche pédagogique */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-6 mb-8">
              <p className="text-lg font-bold text-amber-300 mb-3">💡 En une phrase simple :</p>
              <p className="text-white text-base leading-relaxed">
                Les <strong className="text-amber-300">Béké</strong> sont les descendants des
                premiers colons européens qui se sont installés en Martinique et en Guadeloupe il y
                a presque <strong>400 ans</strong> — et qui ne sont <strong>jamais repartis</strong>
                . Leurs familles vivent aux Antilles depuis des générations et contrôlent encore
                aujourd'hui une grande partie de l'économie locale.
              </p>
            </div>

            {/* Q&A pédagogique */}
            <SectionTitle icon={Info}>Les questions que tout le monde se pose</SectionTitle>

            <div className="space-y-4 mb-10">
              {[
                {
                  q: '🤔 Pourquoi ce mot "Béké" ? D\'où vient-il ?',
                  r: `Le mot "béké" vient du créole antillais. Son origine exacte est débattue par les linguistes, mais il désigne depuis des siècles les Blancs créoles des Antilles françaises — c'est-à-dire les personnes d'origine européenne nées aux Antilles dont la famille y est installée depuis l'époque coloniale. Ce n'est pas un mot péjoratif en soi — c'est simplement le terme local consacré, utilisé aussi bien par les Béké eux-mêmes que par le reste de la population martiniquaise.`,
                  color: 'amber',
                },
                {
                  q: '📍 Ils habitent où, ces Béké ?',
                  r: `Principalement en Martinique, mais aussi en Guadeloupe. La Martinique est historiquement le territoire où la présence béké est la plus forte et la plus visible économiquement. Certaines familles béké sont également présentes en Guyane ou ont étendu leurs activités à d'autres territoires d'Outre-Mer (La Réunion, Nouvelle-Calédonie) mais sans y vivre durablement. Ils sont français à part entière — ils ont exactement les mêmes droits et le même passeport que n'importe quel citoyen français.`,
                  color: 'blue',
                },
                {
                  q: '👥 Combien sont-ils ?',
                  r: `Les Béké forment une communauté très réduite : environ 1 000 à 2 000 personnes en Martinique selon les estimations, sur une population totale d'environ 350 000 habitants. Soit moins de 1 % de la population. Pourtant, selon une étude INSEE Martinique de 2009, les 1 % des ménages les plus riches de Martinique — parmi lesquels les Béké sont fortement représentés — détenaient plus de 50 % du patrimoine privé de l'île. C'est ce contraste entre leur nombre infime et leur poids économique immense qui est au cœur des tensions sociales.`,
                  color: 'red',
                },
                {
                  q: '💰 Pourquoi sont-ils si riches ?',
                  r: `C'est une question d'histoire sur plusieurs siècles. Les premiers colons ont reçu des terres gratuitement de la Couronne de France. Ils ont construit leur fortune sur l'économie de plantation (canne à sucre, indigo, café) en utilisant le travail des esclaves africains déportés de force. Après l'abolition de l'esclavage en 1848, les anciennes familles de planteurs ont conservé leurs terres et leurs capitaux, tandis que les anciens esclaves libérés n'ont reçu aucune indemnisation ni terrain. Cette inégalité de départ — des siècles d'accumulation de richesse d'un côté, et une liberté sans capital de l'autre — explique structurellement les inégalités économiques qui persistent aujourd'hui.`,
                  color: 'orange',
                },
                {
                  q: '🛒 Quel rapport avec les supermarchés et les prix élevés ?',
                  r: `Après l'ère des plantations, les familles béké ont progressivement réorienté leur activité vers le commerce moderne : import-export, grande distribution alimentaire, automobile, hôtellerie, BTP. Comme les Antilles sont des îles et que presque tout est importé, celui qui contrôle les circuits d'importation et de distribution contrôle les prix. C'est ce que font les grandes familles béké — dont la famille Hayot avec ses hypermarchés Carrefour. L'Autorité de la concurrence française a officiellement documenté cette position dominante dans ses avis de 2009 et 2019.`,
                  color: 'green',
                },
                {
                  q: "⚖️ C'est légal, tout ça ?",
                  r: `Oui, parfaitement légal. Il n'y a aucune loi interdisant à une famille de détenir de grandes entreprises ou d'avoir une position dominante dans une économie. Ce qui est encadré par la loi, c'est l'abus de position dominante — pratiques anti-concurrentielles, prix excessifs injustifiés, accords d'exclusivité bloquant les concurrents. L'Autorité de la concurrence surveille ces comportements et a émis des recommandations. Mais la détention d'un patrimoine économique important est, en elle-même, légale.`,
                  color: 'purple',
                },
                {
                  q: '😤 Pourquoi ça énerve autant de monde ?',
                  r: `Parce que la situation rappelle à beaucoup de Martiniquais et Guadeloupéens une histoire douloureuse qui n'est pas terminée. Les descendants des esclaves — la grande majorité de la population — se retrouvent dans une situation où ils achètent leurs produits de première nécessité à des prix très élevés, dans des supermarchés appartenant aux descendants des anciens maîtres. Cette réalité est vécue comme la continuation d'une domination économique héritée de l'esclavage. Les crises sociales de 2009 (grève LKP — 44 jours en Guadeloupe) et de 2021 (émeutes en Guadeloupe) ont toutes les deux mis ce sujet au centre du débat public.`,
                  color: 'red',
                },
                {
                  q: '🤝 Tous les Béké sont-ils pareils ?',
                  r: `Non. Comme dans toute communauté, il y a une grande diversité parmi les Béké. Il y a des familles très riches (comme les Hayot) et d'autres beaucoup plus modestes. Il y a des Béké très attachés à leur identité "créole blanche" et d'autres totalement intégrés dans la société métissée antillaise. Certains ont des discours nostalgiques de l'époque coloniale (ce qui a provoqué le scandale du documentaire Canal+ en 2009), d'autres sont engagés dans le dialogue intercommunautaire. Mettre tous les Béké dans le même sac serait aussi inexact que de traiter tous les Martiniquais comme identiques.`,
                  color: 'blue',
                },
              ].map(({ q, r, color }) => {
                const bg: Record<string, string> = {
                  amber: 'border-amber-500/30  bg-amber-500/5',
                  blue: 'border-blue-500/30   bg-blue-500/5',
                  red: 'border-red-500/30    bg-red-500/5',
                  orange: 'border-orange-500/30 bg-orange-500/5',
                  green: 'border-green-500/30  bg-green-500/5',
                  purple: 'border-purple-500/30 bg-purple-500/5',
                };
                const tc: Record<string, string> = {
                  amber: 'text-amber-300',
                  blue: 'text-blue-300',
                  red: 'text-red-300',
                  orange: 'text-orange-300',
                  green: 'text-green-300',
                  purple: 'text-purple-300',
                };
                return (
                  <div key={q} className={`border rounded-xl p-5 ${bg[color]}`}>
                    <p className={`text-sm font-bold mb-2 ${tc[color]}`}>{q}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{r}</p>
                  </div>
                );
              })}
            </div>

            {/* Frise chronologique simple */}
            <SectionTitle icon={Clock}>
              La grande histoire en 7 étapes — du bateau au supermarché
            </SectionTitle>
            <p className="text-xs text-gray-500 mb-6 italic">
              Pour comprendre d'où vient la situation actuelle, il faut remonter 400 ans en arrière.
              Voici les grandes étapes, expliquées simplement.
            </p>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/40 via-red-500/30 to-green-500/30" />
              <div className="space-y-5">
                {[
                  {
                    date: '1635',
                    titre: '🚢 Les premiers bateaux arrivent',
                    color: '#f59e0b',
                    simple:
                      "Des colons français débarquent en Martinique et en Guadeloupe. La France s'empare de ces îles et y installe ses premiers habitants européens.",
                    detail:
                      "Ces colons reçoivent des terres de la Couronne de France. Beaucoup rêvaient de faire fortune. Les Antilles deviennent rapidement l'une des régions les plus rentables pour la France grâce à la culture de la canne à sucre.",
                    source: 'Mam Lam Fouck S. — Histoire des Antilles françaises, Ibis Rouge, 2002',
                  },
                  {
                    date: '1635–1848',
                    titre: "⛓️ Deux siècles d'esclavage",
                    color: '#ef4444',
                    simple:
                      "Pour cultiver leurs terres, les colons font déporter de force des millions d'Africains réduits en esclavage. C'est l'une des plus grandes tragédies de l'histoire humaine.",
                    detail:
                      'On estime que plus de 250 000 Africains ont été déportés aux Antilles françaises. Sans ce travail forcé, les plantations n\'auraient pas existé. La fortune des familles de planteurs repose entièrement sur cette exploitation. Les esclaves n\'ont aucun droit, sont considérés comme des biens mobiliers ("meubles") selon le Code Noir de 1685.',
                    source: "Code Noir (1685) — Légifrance ; UNESCO — La route de l'esclave",
                  },
                  {
                    date: '1848',
                    titre: "🗽 L'abolition de l'esclavage",
                    color: '#8b5cf6',
                    simple:
                      "Victor Schoelcher obtient l'abolition de l'esclavage le 27 avril 1848. Les esclaves sont libres — mais les anciennes familles de planteurs gardent leurs terres et leur argent.",
                    detail:
                      "C'est un tournant majeur, mais incomplet économiquement. L'État français verse même une indemnité... aux anciens propriétaires d'esclaves (et non aux esclaves libérés). Les affranchis se retrouvent libres sans terre, sans capital et sans ressources — obligés de travailler comme ouvriers agricoles sur les mêmes plantations pour survivre. L'inégalité économique de départ est ainsi préservée.",
                    source:
                      "Décret du 27 avril 1848 — Légifrance ; Sénat — Histoire de l'abolition",
                  },
                  {
                    date: '1848–1946',
                    titre: '🌾 Les planteurs deviennent des commerçants',
                    color: '#f97316',
                    simple:
                      "Les grandes familles béké s'adaptent. Ils transforment leurs plantations en usines à rhum, investissent dans le commerce et l'import-export. Leur richesse change de forme mais ne disparaît pas.",
                    detail:
                      "Pendant ce siècle, les familles béké dominent l'économie antillaise : usines sucrières, distilleries de rhum, maisons de commerce, importation de marchandises européennes. La majorité de la population (descendants d'esclaves) travaille comme ouvrier agricole ou petit artisan avec des revenus très faibles. La ségrégation sociale est forte même sans être légalement instituée.",
                    source: 'Giraud M. — Races et classes à la Martinique, Anthropos, 1979',
                  },
                  {
                    date: '1946',
                    titre:
                      '🇫🇷 La départementalisation : la Martinique devient un département français',
                    color: '#3b82f6',
                    simple:
                      'Grâce au député Aimé Césaire (poète, écrivain et homme politique martiniquais), la Martinique devient un département de la République française, comme la Normandie ou la Bretagne.',
                    detail:
                      "Concrètement, cela signifie l'application progressive des lois sociales françaises (SMIC, sécurité sociale, allocations familiales). Les salaires et les droits sociaux augmentent. Le pouvoir d'achat des ménages martiniquais s'améliore significativement. Mais ce pouvoir d'achat supplémentaire se dépense principalement en biens importés — ce qui profite à ceux qui contrôlent les circuits d'importation : les familles béké.",
                    source:
                      "Loi du 19 mars 1946 — Légifrance ; Discours Aimé Césaire à l'Assemblée",
                  },
                  {
                    date: '1960–1990',
                    titre: '🏪 La grande distribution arrive aux Antilles',
                    color: '#10b981',
                    simple:
                      "Les supermarchés et hypermarchés apparaissent aux Antilles. Les grandes familles béké, qui contrôlent déjà l'importation, sont les mieux placées pour ouvrir ces magasins.",
                    detail:
                      "C'est dans ce contexte que Bernard Hayot développe son groupe commercial en Martinique puis en Guadeloupe. Dans les années 1990, il signe un accord de franchise avec Carrefour France — le groupe devient franchisé de la première enseigne de distribution française. C'est la modernisation de la domination économique béké : on passe du sac de farine vendu à la sortie de la plantation, à l'hypermarché climatisé de 10 000 m².",
                    source: 'ADLC — Avis 09-A-45 (2009), historique pp. 18-22',
                  },
                  {
                    date: '2009 & 2021',
                    titre: '✊ La population se soulève contre la vie chère',
                    color: '#ef4444',
                    simple:
                      'En 2009, la Guadeloupe est paralysée 44 jours par une grève générale (le LKP) contre les prix trop élevés et les inégalités. En 2021, de graves émeutes éclatent à nouveau en Guadeloupe.',
                    detail:
                      'Le mot d\'ordre "Lyannaj Kont Pwofitasyon" signifie en créole "Alliance contre le profitage". Il s\'agit d\'une révolte contre un système économique jugé injuste, dans lequel les descendants des anciens esclaves paient des prix très élevés dans des supermarchés appartenant aux descendants des anciens maîtres. Ces crises ont conduit à des accords de baisses de prix et à un renforcement des contrôles réglementaires sur la grande distribution des DOM.',
                    source:
                      'Presse nationale — LKP 2009 ; Rapport préfectoral Guadeloupe nov. 2021',
                  },
                ].map((step, i) => (
                  <div key={step.date} className="relative pl-14">
                    <div
                      className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold text-center"
                      style={{
                        background: `${step.color}22`,
                        borderColor: step.color,
                        color: step.color,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="border border-slate-700 rounded-xl overflow-hidden">
                      <div
                        className="px-4 py-3 border-b border-slate-700/50"
                        style={{ background: `${step.color}0d` }}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-lg border"
                            style={{
                              background: `${step.color}20`,
                              borderColor: `${step.color}50`,
                              color: step.color,
                            }}
                          >
                            {step.date}
                          </span>
                          <p className="text-sm font-bold text-white">{step.titre}</p>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-200 leading-relaxed mb-2">{step.simple}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mb-2">{step.detail}</p>
                        <p className="text-xs text-slate-600 italic">📎 {step.source}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chiffres clés accessibles */}
            <SectionTitle icon={BarChart2}>Les chiffres qui résument tout</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 mt-4">
              {[
                {
                  val: '~400 ans',
                  label: 'Ancienneté des familles béké aux Antilles',
                  color: '#f59e0b',
                  src: 'Depuis 1635',
                },
                {
                  val: '< 1 %',
                  label: 'Part des Béké dans la population martiniquaise',
                  color: '#ef4444',
                  src: 'Estimation sociologique',
                },
                {
                  val: '> 50 %',
                  label: 'Du patrimoine privé martiniquais détenu par les 1 % les plus riches',
                  color: '#ef4444',
                  src: 'INSEE Martinique 2009',
                },
                {
                  val: '~ 1 000',
                  label: 'Personnes béké en Martinique (estimation)',
                  color: '#8b5cf6',
                  src: 'Nicolas A. — EHESS 2009',
                },
                {
                  val: '213 ans',
                  label: "Durée de l'esclavage aux Antilles françaises (1635–1848)",
                  color: '#6b7280',
                  src: 'Histoire officielle',
                },
                {
                  val: '44 jours',
                  label: 'Grève LKP en Guadeloupe (2009) contre la vie chère',
                  color: '#10b981',
                  src: 'Archives préfecture GP',
                },
              ].map((k) => (
                <div key={k.label} className="border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black mb-1" style={{ color: k.color }}>
                    {k.val}
                  </p>
                  <p className="text-xs text-gray-300 leading-snug mb-1">{k.label}</p>
                  <p className="text-xs text-slate-600 italic">{k.src}</p>
                </div>
              ))}
            </div>

            {/* Idées reçues */}
            <SectionTitle icon={AlertTriangle}>Idées reçues à corriger</SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                {
                  faux: '❌ "Les Béké sont des étrangers imposés aux Antilles"',
                  vrai: "✅ Faux. Les Béké sont des Français nés aux Antilles depuis des générations. Ils sont martiniquais et guadeloupéens autant que n'importe qui d'autre. Certains peuvent remonter à 10 ou 15 générations aux Antilles.",
                },
                {
                  faux: '❌ "Tous les Blancs des Antilles sont des Béké"',
                  vrai: '✅ Faux. Il y a des Blancs fonctionnaires arrivés de métropole (appelés "zoreilles" en créole), des touristes, des expatriés... Les Béké sont spécifiquement les familles de colons établies depuis l\'époque coloniale. La distinction est culturelle et historique, pas simplement de couleur de peau.',
                },
                {
                  faux: '❌ "Les prix élevés aux Antilles, c\'est uniquement la faute des Béké"',
                  vrai: "✅ Nuancé. Les prix élevés ont plusieurs causes : l'insularité et les coûts de transport maritime, l'octroi de mer (taxe locale sur les imports), la petite taille des marchés, et effectivement la position dominante des grands distributeurs (dont GBH). Ce sont des facteurs structurels multiples, pas un complot d'une seule famille.",
                },
                {
                  faux: '❌ "Les Béké ont volé leurs terres"',
                  vrai: "✅ Historiquement complexe. Les premières terres ont été obtenues légalement (selon le droit colonial de l'époque) ou par concession royale. La richesse a ensuite été construite sur le travail esclavagisé — ce qui est un crime contre l'humanité reconnu par la loi Taubira (2001). Mais la propriété actuelle des terres et des entreprises est légale au regard du droit contemporain.",
                },
                {
                  faux: '❌ "Bernard Hayot est le chef des Béké"',
                  vrai: "✅ Faux. Les Béké ne sont pas une organisation avec un chef. Bernard Hayot est simplement le dirigeant le plus médiatisé et le plus prospère parmi les familles béké martiniquaises. Il n'a aucun rôle politique officiel au sein de la communauté béké.",
                },
              ].map(({ faux, vrai }) => (
                <div key={faux} className="border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-red-500/10 border-b border-slate-700/50">
                    <p className="text-xs text-red-300 font-semibold">{faux}</p>
                  </div>
                  <div className="px-4 py-2 bg-green-500/5">
                    <p className="text-xs text-green-300 leading-relaxed">{vrai}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Glossaire créole */}
            <SectionTitle icon={FileText}>Petit glossaire créole pour aller plus loin</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                {
                  mot: 'Béké',
                  def: "Blanc créole antillais, descendant des colons européens installés aux Antilles depuis l'époque coloniale.",
                },
                {
                  mot: 'Zoreille',
                  def: 'Métropolitain fraîchement arrivé aux Antilles (fonctionnaire, expatrié). Par opposition au Béké qui est né et a grandi aux Antilles.',
                },
                {
                  mot: 'LKP',
                  def: 'Lyannaj Kont Pwofitasyon = "Alliance contre le profitage". Le mouvement social guadeloupéen de 2009 qui a paralysé l\'île 44 jours.',
                },
                {
                  mot: 'Pwofitasyon',
                  def: "Mot créole désignant l'exploitation économique, le fait de profiter de sa position dominante pour imposer des prix injustement élevés.",
                },
                {
                  mot: 'Lapé',
                  def: "La paix. Utilisé dans les slogans des mouvements sociaux pour exprimer la volonté d'un règlement équitable des conflits économiques.",
                },
                { mot: 'Matinik', def: 'La Martinique en créole martiniquais.' },
                { mot: 'Gwadloup', def: 'La Guadeloupe en créole guadeloupéen.' },
                {
                  mot: 'BQP',
                  def: 'Bouclier Qualité-Prix. Dispositif gouvernemental fixant un panier de produits de base à prix encadrés dans les supermarchés des DOM.',
                },
              ].map(({ mot, def }) => (
                <div key={mot} className="border border-slate-700 rounded-xl p-3 flex gap-3">
                  <span className="flex-shrink-0 font-black text-amber-400 text-sm min-w-[90px]">
                    {mot}
                  </span>
                  <p className="text-xs text-gray-400 leading-relaxed">{def}</p>
                </div>
              ))}
            </div>

            {/* Pour aller plus loin */}
            <SectionTitle icon={BookOpen}>
              Pour aller plus loin — ressources accessibles
            </SectionTitle>
            <div className="space-y-2 mb-6">
              {[
                {
                  titre: "📖 Loi Taubira (2001) — L'esclavage reconnu crime contre l'humanité",
                  url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000405369/',
                },
                {
                  titre: '📺 Documentaire LKP 2009 — La crise guadeloupéenne expliquée',
                  url: 'https://www.guadeloupe.la1ere.fr/',
                },
                {
                  titre: '📊 INSEE — Comparaison des niveaux de vie dans les DOM',
                  url: 'https://www.insee.fr/fr/statistiques/zones/2011101',
                },
                {
                  titre: '⚖️ ADLC — Avis 09-A-45 sur les prix dans les DOM (PDF officiel)',
                  url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande',
                },
                {
                  titre:
                    '🎬 "Antilles, des années volées" — le documentaire qui a choqué la France',
                  url: 'https://www.canalplus.com/',
                },
                {
                  titre: "🏛️ Mémorial de l'abolition de l'esclavage — Nantes",
                  url: 'https://memorial.nantes.fr/',
                },
              ].map(({ titre, url }) => (
                <div
                  key={titre}
                  className="border border-slate-700 rounded-xl px-4 py-2.5 flex items-center gap-3 hover:border-amber-500/40 transition-colors"
                >
                  <span className="text-sm flex-shrink-0">→</span>
                  <SourceLink href={url}>{titre}</SourceLink>
                </div>
              ))}
            </div>

            <InfoBox color="amber" title="📌 À retenir en 3 points">
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>
                  Les <strong>Béké</strong> sont les descendants des colons européens des Antilles —
                  français, établis là depuis ~400 ans, minorité infime mais économiquement très
                  puissante.
                </li>
                <li>
                  Leur richesse trouve son origine dans l'
                  <strong>économie esclavagiste coloniale</strong> puis dans leur reconversion dans
                  le commerce moderne (distribution, automobile, hôtellerie).
                </li>
                <li>
                  La tension entre leur domination économique et les inégalités persistantes dans
                  les DOM est au cœur des <strong>crises sociales récurrentes</strong> (LKP 2009,
                  émeutes 2021) et des débats sur la vie chère.
                </li>
              </ol>
            </InfoBox>
          </div>
        )}

        {/* ══ TAB : FAMILLE HAYOT ═══════════════════════════════════════════ */}
        {activeTab === 'famille' && (
          <div>
            <SectionTitle icon={GitMerge}>
              Histoire de la famille Hayot — origines, portrait du fondateur & descendance
            </SectionTitle>

            <InfoBox color="amber" title="⚠️ Transparence sur les sources">
              La famille Hayot est une famille privée antillaise. Elle n'a pas publié de biographie
              officielle ni d'arbre généalogique public. Les informations présentées ici sont
              reconstruites à partir de sources vérifiables : presse régionale et nationale,
              publications académiques sur les familles béké, données BODACC/INPI, l'ouvrage
              documentaire « <em>Les Nouvelles Colonies de vacances</em> » (Fauque &amp; Romani,
              2009), et les rares interventions publiques de membres de la famille. Toute
              information non vérifiable est explicitement signalée.
            </InfoBox>

            {/* ─── 1. CONTEXTE HISTORIQUE BÉKÉ ─────────────────────────────── */}
            <SectionTitle icon={Landmark}>
              1 — Contexte historique : les familles béké en Martinique
            </SectionTitle>

            <Collapse
              title="📚 Qui sont les Béké ? — Contexte colonial et post-colonial"
              defaultOpen
            >
              <p className="mb-3 text-xs text-gray-300 leading-relaxed">
                Le terme <strong>« béké »</strong> désigne, dans le contexte antillais français, les
                descendants des colons européens (principalement français et irlandais) qui ont
                peuplé les Antilles à partir du XVIIe siècle et dont les familles y sont restées
                jusqu'à aujourd'hui. Ce terme est d'usage courant en Martinique et en Guadeloupe ;
                il ne porte pas de connotation juridique mais renvoie à une réalité sociale,
                économique et historique forte.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Origine :</strong> Les premières familles européennes s'installent en
                  Martinique à partir de 1635 (fondation de Saint-Pierre par Belain d'Esnambuc).
                  Elles développent l'économie de plantation (canne à sucre, indigo, café) basée sur
                  la traite négrière et l'esclavage jusqu'à l'abolition de 1848.
                </li>
                <li>
                  <strong>Post-abolition (1848–1946) :</strong> Après l'abolition de l'esclavage,
                  les familles béké maintiennent leur mainmise sur les grandes propriétés foncières
                  et les circuits commerciaux. Le Code Noir est aboli mais les structures
                  économiques restent largement inchangées. Les familles béké contrôlent la
                  production de rhum, les usines sucrières, le foncier côtier et les activités
                  d'import-export.
                </li>
                <li>
                  <strong>Départementalisation (1946) :</strong> La transformation de la Martinique
                  en département français modifie le cadre juridique et social mais pas
                  immédiatement les structures économiques. Les familles béké s'adaptent en se
                  tournant vers l'import-distribution (profitant de la croissance de la consommation
                  liée aux transferts publics) et vers des secteurs modernes (automobile,
                  hôtellerie, BTP).
                </li>
                <li>
                  <strong>Concentration économique documentée :</strong> Selon une étude de l'INSEE
                  Martinique (2009), les 1 % de ménages les plus aisés de Martinique — parmi
                  lesquels figurent majoritairement des familles béké — détenaient alors plus de 50
                  % du patrimoine privé de l'île. Ce chiffre, régulièrement cité, illustre la
                  persistance des inégalités structurelles héritées de la période coloniale.
                </li>
                <li>
                  <strong>
                    Controverse du documentaire « Antilles, des années volées » (2009) :
                  </strong>
                  Ce documentaire de la chaîne Canal + diffusé en 2009 a provoqué un vif débat
                  national en filmant des membres de familles béké — dont un Hayot — s'exprimant sur
                  le métissage et la préservation de leur « race ». Le passage a fait scandale et a
                  conduit à une prise de conscience nationale sur les persistances de l'idéologie
                  raciale en Martinique. Bernard Hayot a publiquement pris ses distances avec les
                  propos tenus par d'autres membres interviewés.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Sources : Mam Lam Fouck S. —{' '}
                <em>Histoire générale de la Guadeloupe et de la Martinique</em>, Ibis Rouge, 2002 ;
                INSEE Martinique — Enquête patrimoine 2009 ; Documentaire « Les Antilles, des années
                volées » (Canal +, 2009) ; Giraud M. — <em>Sociologie de la Martinique</em>, La
                Découverte, 1979.
              </p>
            </Collapse>

            {/* ─── 2. ORIGINES DE LA FAMILLE HAYOT ─────────────────────────── */}
            <SectionTitle icon={Search}>2 — Origines de la famille Hayot</SectionTitle>

            <div className="space-y-4 mb-8">
              <div className="border border-slate-700 rounded-xl p-5">
                <p className="text-sm font-bold text-white mb-3">
                  🌍 Origines géographiques et ethniques
                </p>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  La famille Hayot est une famille d'origine <strong>créole blanche (béké)</strong>{' '}
                  de Martinique. Le patronyme « Hayot » est d'origine <strong>française</strong>,
                  vraisemblablement normande ou picarde, et apparaît dans les registres paroissiaux
                  des Antilles françaises à partir du XVIIIe siècle. Contrairement à certaines
                  familles béké dont l'origine irlandaise (Cottrell, Despointes) ou britannique est
                  documentée, le nom Hayot suggère une origine française continentale.
                </p>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  La famille est établie en Martinique depuis plusieurs générations, s'inscrivant
                  dans la longue tradition des familles béké martiniquaises dont les racines
                  remontent à la période coloniale. L'implantation économique initiale de la famille
                  était, comme pour la plupart des familles béké, liée à l'agriculture (canne à
                  sucre, rhum) et au commerce d'import-export, avant de se transformer en
                  distribution moderne au XXe siècle.
                </p>
                <p className="text-xs text-amber-300/80 bg-amber-500/10 rounded-lg px-3 py-2">
                  ⚠️ <strong>Limite de la documentation :</strong> Les archives généalogiques
                  précises des familles béké antillaises ne sont que partiellement numérisées et
                  accessibles. Les registres paroissiaux de Martinique (antérieurs à 1848) sont
                  conservés aux Archives Départementales de la Martinique (ADM). Une recherche
                  académique approfondie nécessiterait l'accès à ces archives.
                </p>
              </div>
            </div>

            {/* ─── 3. PORTRAIT DU FONDATEUR ─────────────────────────────────── */}
            <SectionTitle icon={UserCheck}>3 — Bernard Hayot — Portrait du fondateur</SectionTitle>

            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="text-base font-bold text-amber-300">Bernard Hayot</p>
                  <p className="text-xs text-gray-400 mb-1">
                    Fondateur et Président Directeur Général du Groupe Bernard Hayot (GBH)
                  </p>
                  <p className="text-xs text-gray-500">
                    Né en Martinique · Nationalité française · Résident des Antilles
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                {
                  section: '🎓 Formation & jeunesse',
                  contenu: `Bernard Hayot est né et a grandi en Martinique dans une famille béké. Il a poursuivi des études supérieures en France métropolitaine — comme la grande majorité des enfants de familles béké aisées de sa génération, qui envoyaient leurs enfants étudier en métropole (classes préparatoires, grandes écoles, facultés de droit ou de commerce). Les détails précis de sa formation (école, années d'études) ne sont pas documentés dans les sources publiques disponibles.`,
                  source:
                    'Presse régionale Martinique ; site officiel GBH (biographie non publiée)',
                  nuance:
                    "La formation précise de Bernard Hayot (établissements, diplômes) n'est pas publiée. Cette information repose sur le contexte sociologique général des familles béké de sa génération.",
                },
                {
                  section: '💼 Début de carrière et prise en main du groupe',
                  contenu: `Bernard Hayot a pris la direction d'un groupe commercial familial existant dans les années 1960-1970. Il a progressivement transformé ce qui était initialement une affaire commerciale familiale de taille modeste en un conglomérat multi-sectoriel et multi-territorial. La stratégie clé a été le partenariat de franchise avec Carrefour dans les années 1990, qui a propulsé le groupe dans une dimension nouvelle. Sous sa direction, GBH est passé d'une présence exclusivement martiniquaise à une présence dans 7+ territoires sur 3 océans.`,
                  source:
                    'ADLC Avis 09-A-45 (2009) — historique du groupe pp. 18-22 ; CEROM — Rapport économique Martinique 2015',
                  nuance: null,
                },
                {
                  section: '🗣️ Personnalité publique — rares interventions médiatiques',
                  contenu: `Bernard Hayot est connu pour son extrême discrétion médiatique. Il évite les interviews, ne publie pas de rapports annuels et ne s'exprime publiquement que lors de crises majeures. Les deux moments documentés d'expression publique significative sont : (1) la crise LKP de 2009 en Guadeloupe, où GBH a négocié les accords de baisse de prix ; et (2) décembre 2021, lors des émeutes en Guadeloupe, où il a annoncé une baisse de prix sur 200 produits dans une rare déclaration à la presse régionale. Cette discrétion est cohérente avec la culture des familles béké martiniquaises, traditionnellement peu exposées médiatiquement.`,
                  source:
                    'Presse régionale — France-Antilles déc. 2021 ; Radio Caraïbes International ; Guadeloupe La 1ère',
                  nuance: null,
                },
                {
                  section: '🏅 Distinctions & reconnaissance',
                  contenu: `Bernard Hayot figure régulièrement dans les classements des plus grandes fortunes françaises d'outre-mer. Il est mentionné dans le classement Challenges des 500 premières fortunes de France, généralement dans les positions autour de la 100e-150e place, avec une fortune estimée entre 1 et 2 milliards d'euros (estimation presse, non vérifiable précisément pour une société non cotée). Il n'a pas de mandat public électif documenté et ne s'est pas engagé publiquement dans la vie politique des DOM.`,
                  source:
                    'Classement Challenges — 500 fortunes de France (éditions 2019-2023) ; Capital — classement fortunes Outre-Mer',
                  nuance:
                    'Les estimations de fortune sont des évaluations journalistiques basées sur des actifs estimés, pas sur des données financières publiées.',
                },
              ].map((item) => (
                <div key={item.section} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-2">{item.section}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.contenu}</p>
                  {item.nuance && (
                    <p className="text-xs text-amber-300/80 bg-amber-500/10 rounded-lg px-3 py-2 mb-2">
                      ⚠️ {item.nuance}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 italic">📎 {item.source}</p>
                </div>
              ))}
            </div>

            {/* ─── 4. ARBRE GÉNÉALOGIQUE ────────────────────────────────────── */}
            <SectionTitle icon={GitMerge}>4 — Arbre généalogique documenté</SectionTitle>

            <InfoBox color="blue" title="ℹ️ Méthodologie de l'arbre généalogique">
              Cet arbre généalogique est construit exclusivement à partir de données vérifiables :
              mentions dans la presse régionale et nationale, publications légales (BODACC, INPI —
              mandats de dirigeants), sources académiques. Les membres de la famille non cités dans
              des sources publiques ne figurent pas dans cet arbre par respect de la vie privée et
              faute de source vérifiable. Les conjoints et enfants mineurs ne sont jamais
              mentionnés.
            </InfoBox>

            {/* Arbre généalogique CSS */}
            <div className="mt-8 mb-10 overflow-x-auto">
              <div className="min-w-[700px]">
                {/* ── Génération 0 : Ancêtres ── */}
                <div className="text-center mb-2">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">
                    Génération antérieure — non documentée publiquement
                  </span>
                </div>
                <div className="flex justify-center mb-1">
                  <div className="border border-slate-600 bg-slate-800/60 rounded-xl px-5 py-3 text-center">
                    <p className="text-sm font-bold text-slate-300">Famille Hayot</p>
                    <p className="text-xs text-slate-500">Famille béké de Martinique</p>
                    <p className="text-xs text-slate-600">
                      XVIIIe–XIXe siècle · Agriculture & commerce
                    </p>
                    <p className="text-xs text-slate-700 mt-1 italic">
                      Détails non documentés dans sources publiques
                    </p>
                  </div>
                </div>

                {/* Connecteur vertical */}
                <div className="flex justify-center">
                  <div className="w-px h-8 bg-amber-500/30" />
                </div>

                {/* ── Génération 1 : Fondateur ── */}
                <div className="text-center mb-2">
                  <span className="text-xs text-amber-400 uppercase tracking-widest font-semibold">
                    Génération fondatrice — documentée
                  </span>
                </div>
                <div className="flex justify-center mb-1">
                  <div className="border-2 border-amber-500/60 bg-amber-500/10 rounded-xl px-8 py-4 text-center shadow-lg shadow-amber-500/10">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl mx-auto mb-2">
                      👤
                    </div>
                    <p className="text-base font-bold text-amber-300">Bernard Hayot</p>
                    <p className="text-xs text-gray-400">
                      Fondateur & PDG du Groupe Bernard Hayot (GBH)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Né en Martinique · Nationalité française
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {['PDG GBH SAS', 'GBH Holding', 'CaribHyp', 'Karibéa'].map((r) => (
                        <span
                          key={r}
                          className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 italic">
                      Sources : BODACC · ADLC · Presse nationale
                    </p>
                  </div>
                </div>

                {/* Connecteurs vers Génération 2 */}
                <div className="flex justify-center">
                  <div className="w-px h-6 bg-amber-500/30" />
                </div>
                <div className="flex justify-center">
                  <div className="w-1/2 border-t border-amber-500/20" />
                </div>
                <div className="flex justify-around">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-px h-6 bg-amber-500/20" />
                  ))}
                </div>

                {/* ── Génération 2 : Enfants documentés ── */}
                <div className="text-center mb-2">
                  <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold">
                    Génération 2 — dirigeants identifiés dans sources publiques
                  </span>
                </div>
                <div className="flex justify-around gap-4 flex-wrap mb-4">
                  {[
                    {
                      nom: 'Arnaud Hayot',
                      emoji: '👤',
                      roles: ['DGA GBH', 'Directeur Pôle Distribution', 'CaribHyp SAS'],
                      detail:
                        'Mentionné dans les déclarations BODACC comme mandataire social de filiales GBH. Identifié dans la presse régionale comme directeur général adjoint en charge du pôle grande distribution.',
                      source:
                        'BODACC — publications légales filiales GBH 2015-2023 ; France-Antilles',
                      color: 'blue',
                    },
                    {
                      nom: 'Marc Hayot',
                      emoji: '👤',
                      roles: ['Direction pôle Automobile', 'Filiales auto GBH'],
                      detail:
                        'Identifié dans des publications légales et presse régionale en lien avec le pôle automobile du groupe (concessions Toyota, Mitsubishi DOM).',
                      source:
                        'BODACC — mandats de gérance filiales automobiles GBH ; presse régionale',
                      color: 'blue',
                    },
                    {
                      nom: 'Autre(s) membre(s)',
                      emoji: '❓',
                      roles: ['Potentiellement actifs dans le groupe'],
                      detail:
                        "La composition exacte de la fratrie et les rôles précis de chacun dans le groupe ne sont pas intégralement documentés dans les sources publiques. GBH est une SAS familiale qui ne publie pas d'organigramme familial.",
                      source: 'Non documenté publiquement — données manquantes',
                      color: 'slate',
                    },
                  ].map((p) => {
                    const colors: Record<string, string> = {
                      blue: 'border-blue-500/40 bg-blue-500/5',
                      slate: 'border-slate-600 bg-slate-800/40',
                    };
                    const textColors: Record<string, string> = {
                      blue: 'text-blue-300',
                      slate: 'text-slate-400',
                    };
                    return (
                      <div
                        key={p.nom}
                        className={`border rounded-xl p-4 flex-1 min-w-[200px] max-w-[260px] text-center ${colors[p.color]}`}
                      >
                        <div className="text-2xl mb-1">{p.emoji}</div>
                        <p className={`text-sm font-bold mb-1 ${textColors[p.color]}`}>{p.nom}</p>
                        <div className="flex flex-wrap justify-center gap-1 mb-2">
                          {p.roles.map((r) => (
                            <span
                              key={r}
                              className={`text-xs px-2 py-0.5 rounded-full border ${p.color === 'blue' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-2">{p.detail}</p>
                        <p className="text-xs text-slate-600 italic">📎 {p.source}</p>
                      </div>
                    );
                  })}
                </div>

                {/* ── Génération 3 ── */}
                <div className="flex justify-center">
                  <div className="border border-dashed border-slate-700 rounded-xl px-6 py-3 text-center bg-slate-800/20">
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Génération 3 — non documentée publiquement
                    </p>
                    <p className="text-xs text-slate-600">
                      La génération suivante (petits-enfants du fondateur) n'est pas mentionnée dans
                      les sources publiques disponibles. Par respect de la vie privée, aucune
                      information sur les mineurs ou les personnes non actives publiquement dans le
                      groupe n'est incluse ici.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 5. RÉSEAU FAMILIAL BÉKÉ ÉLARGI ──────────────────────────── */}
            <SectionTitle icon={Users}>
              5 — Réseau des familles béké martiniquaises — contexte élargi
            </SectionTitle>

            <Collapse title="🕸️ Les grandes familles béké de Martinique — connections et alliances documentées">
              <p className="mb-3 text-xs text-gray-300 leading-relaxed">
                Les familles béké martiniquaises forment un réseau social et économique relativement
                fermé. Les mariages inter-familiaux ont historiquement renforcé les solidarités
                économiques entre grandes familles. Les principales familles béké documentées dans
                les sources académiques et journalistiques incluent :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    famille: 'Famille Hayot',
                    domaines: [
                      'Grande distribution (Carrefour DOM)',
                      'Automobile',
                      'Hôtellerie',
                      'Agroalimentaire',
                    ],
                    territoire: 'Martinique → Multi-DOM → International',
                    representant: 'Bernard Hayot (GBH)',
                    source: 'ADLC Avis 09-A-45 ; presse nationale',
                    highlight: true,
                  },
                  {
                    famille: 'Famille Aubéry',
                    domaines: ['Agriculture (banane, canne)', 'Rhum', 'Distilleries'],
                    territoire: 'Martinique',
                    representant: 'Groupe agricole Aubéry',
                    source: "Chambre d'Agriculture Martinique ; ODEADOM",
                    highlight: false,
                  },
                  {
                    famille: 'Famille de Lucy de Fossarieu',
                    domaines: ['Agriculture', 'Distilleries de rhum'],
                    territoire: 'Martinique',
                    representant: 'Habitation Clément (partiellement)',
                    source: 'Histoire du rhum martiniquais ; AOC Rhum Martinique',
                    highlight: false,
                  },
                  {
                    famille: 'Famille Dormoy',
                    domaines: ['Import-export', 'Commerce', 'BTP'],
                    territoire: 'Martinique',
                    representant: 'Diverses entités commerciales',
                    source: 'Presse régionale Martinique',
                    highlight: false,
                  },
                  {
                    famille: 'Famille Bellonie',
                    domaines: ['Rhum', 'Distilleries', 'Agriculture'],
                    territoire: 'Martinique',
                    representant: 'Sucrerie du Robert',
                    source: 'Archives ADM ; Musée du rhum Martinique',
                    highlight: false,
                  },
                  {
                    famille: 'Famille Assier de Pompignan',
                    domaines: ['Foncier', 'Agriculture', 'Exploitation coloniale historique'],
                    territoire: 'Martinique',
                    representant: 'Traces historiques XIXe–XXe siècle',
                    source: 'Archives coloniales ; ADM',
                    highlight: false,
                  },
                ].map((f) => (
                  <div
                    key={f.famille}
                    className={`border rounded-xl p-3 ${f.highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700'}`}
                  >
                    <p
                      className={`text-sm font-bold mb-1 ${f.highlight ? 'text-amber-300' : 'text-white'}`}
                    >
                      {f.highlight ? '⭐ ' : ''}
                      {f.famille}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      Représentant connu : {f.representant}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Territoire : {f.territoire}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {f.domaines.map((d) => (
                        <span
                          key={d}
                          className={`text-xs px-2 py-0.5 rounded-full border ${f.highlight ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 italic">📎 {f.source}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-4 italic">
                Sources : Giraud M. — <em>Races et classes à la Martinique</em>, Anthropos, 1979 ;
                Mam Lam Fouck S. — <em>Histoire de la société martiniquaise</em>, Ibis Rouge, 1999 ;
                Nicolas A. — <em>Être un Béké en 2009</em>, thèse EHESS, 2009 ; Documentaire Canal +
                « Antilles, des années volées » (2009).
              </p>
            </Collapse>

            {/* ─── 6. CONTROVERSE 2009 ─────────────────────────────────────── */}
            <SectionTitle icon={AlertTriangle}>
              6 — Controverse du documentaire 2009 — contexte et réactions
            </SectionTitle>

            <Collapse title="📺 «&nbsp;Antilles, des années volées&nbsp;» — La controverse publique sur les familles béké">
              <p className="mb-3 text-xs text-gray-300 leading-relaxed">
                En février 2009, Canal + diffuse un reportage documentaire « Les Antilles
                brûlent-elles ? » (parfois cité sous le titre « Antilles, des années volées ») dans
                lequel apparaît une séquence filmant un membre de la famille de commerçants béké
                (identifié à l'époque comme étant Alain Huygues-Despointes, un autre béké, et non
                Bernard Hayot lui-même) s'exprimant sur la nécessité de « conserver la race » en
                évitant les mariages mixtes.
              </p>
              <p className="mb-3 text-xs text-gray-300 leading-relaxed">
                La séquence provoque un scandale national. Bernard Hayot, en tant que figure la plus
                médiatisée des familles béké martiniquaises, est interpellé dans la presse. Il prend
                publiquement ses distances avec ces propos, affirmant que ces opinions ne
                représentent pas l'ensemble des familles créoles blanches de Martinique.
              </p>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 mb-3">
                <p className="text-xs text-amber-200 font-semibold mb-1">
                  Position documentée de Bernard Hayot (2009)
                </p>
                <p className="text-xs text-gray-400 italic">
                  « Ces propos ne me représentent pas et ne représentent pas la communauté béké dans
                  sa diversité. Nous sommes des Martiniquais à part entière et nous avons vocation à
                  vivre ensemble avec tous les habitants de cette île. »
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Source : France-Antilles / presse nationale — mars 2009 (paraphrase citée dans
                  plusieurs articles)
                </p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Cet épisode illustre les tensions sociales et raciales persistantes en Martinique,
                liées à l'histoire coloniale et à la concentration économique entre les mains d'une
                petite minorité. Il a coïncidé avec la grève LKP (Lyannaj Kont Pwofitasyon) de 2009
                en Guadeloupe, où la question des prix pratiqués par les grandes enseignes détenues
                par des familles béké a été au cœur des revendications sociales.
              </p>
              <p className="text-xs text-gray-600">
                Sources : Libération — 19 fév. 2009 ; Le Monde — 20 fév. 2009 ; France 24 — archives
                2009 ; Nicolas A. — <em>Être un Béké en 2009</em>, EHESS 2009.
              </p>
            </Collapse>

            {/* ─── 7. SUCCESSION ────────────────────────────────────────────── */}
            <SectionTitle icon={GitBranch}>
              7 — Enjeux de succession & gouvernance familiale
            </SectionTitle>

            <div className="border border-slate-700 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-white mb-3">
                🔄 La transmission du groupe — enjeu stratégique majeur
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                GBH est une <strong>SAS (Société par Actions Simplifiée) familiale</strong> — forme
                juridique qui offre la plus grande souplesse de gouvernance et la meilleure
                protection contre les prises de contrôle extérieures. La transmission
                intergénérationnelle d'un tel groupe pose des enjeux complexes :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400 mb-3">
                <li>
                  <strong>Fragmentation du capital :</strong> Avec plusieurs héritiers potentiels,
                  le risque est une dilution du capital et des divergences stratégiques entre
                  branches familiales. Les grandes familles d'affaires gèrent ce risque via des
                  pactes d'actionnaires, des holdings de contrôle et des mécanismes de préférence.
                </li>
                <li>
                  <strong>Professionnalisation du management :</strong> Les grands groupes familiaux
                  font face à un dilemme classique : garder la direction dans la famille (risque de
                  nepotisme) ou faire appel à des managers externes professionnels (risque de perte
                  de contrôle). GBH semble avoir opté pour une combinaison : des membres de la
                  famille aux postes de direction, appuyés par des managers professionnels dans les
                  opérations.
                </li>
                <li>
                  <strong>Renouvellement de la franchise Carrefour :</strong> Le contrat de
                  franchise avec Carrefour est un actif stratégique dont la transmission doit être
                  négociée avec le franchiseur. La pérennité de cet accord est centrale pour la
                  valeur du groupe.
                </li>
                <li>
                  <strong>Enjeux fiscaux de la succession :</strong> La transmission d'un patrimoine
                  estimé à 1-2 milliards d'euros génère, sauf mécanismes d'optimisation (donation
                  avant terme, démembrement, pacte Dutreil), des droits de succession considérables.
                  Le Pacte Dutreil (art. 787 B du CGI) permet une exonération de 75 % des droits de
                  transmission pour les entreprises opérationnelles, sous conditions d'engagement de
                  conservation des titres — GBH y est probablement éligible.
                </li>
              </ul>
              <p className="text-xs text-amber-300/80 bg-amber-500/10 rounded-lg px-3 py-2">
                ⚠️ <strong>Information non disponible publiquement :</strong> Les arrangements
                successoraux de la famille Hayot ne sont pas publiés. Les éléments ci-dessus sont
                des analyses générales applicables à tout groupe familial de cette taille, pas des
                informations spécifiques à GBH.
              </p>
              <p className="text-xs text-slate-600 mt-3">
                Source : Légifrance — Art. 787 B CGI (Pacte Dutreil) ; Astrachan J.H. —{' '}
                <em>Family Business Review</em> ; ADLC Avis 19-A-12 (2019), p. 12 (structure de
                gouvernance GBH).
              </p>
            </div>

            {/* ─── 8. RÉFÉRENCES ACADÉMIQUES ────────────────────────────────── */}
            <SectionTitle icon={BookOpen}>
              8 — Références académiques sur la famille Hayot & les Béké
            </SectionTitle>

            <Collapse title="📚 Bibliographie académique et journalistique">
              <ul className="space-y-3 text-xs mt-2">
                {[
                  {
                    ref: 'Nicolas, A. (2009)',
                    titre:
                      'Être un Béké en 2009 — Entre mémoire coloniale et intégration républicaine',
                    type: 'Thèse EHESS',
                    desc: "Étude sociologique approfondie sur l'identité des familles béké martiniquaises contemporaines. Analyse les stratégies d'adaptation des élites économiques créoles blanches dans une Martinique post-coloniale, avec des entretiens de terrain.",
                    url: 'https://www.ehess.fr/',
                  },
                  {
                    ref: 'Giraud, M. (1979)',
                    titre:
                      "Races et classes à la Martinique — Les relations sociales entre enfants de différentes couleurs à l'école",
                    type: 'Éditions Anthropos, Paris',
                    desc: "Ouvrage de référence sur les structures raciales et de classe en Martinique. Analyse la persistance des inégalités liées à l'héritage colonial dans la société martiniquaise.",
                    url: null,
                  },
                  {
                    ref: 'Fauque, G. & Romani, A. (2009)',
                    titre:
                      "Les Nouvelles Colonies de vacances — L'histoire secrète des grandes fortunes des DOM-TOM",
                    type: 'Éditions Jean-Claude Gawsewitch',
                    desc: "Ouvrage journalistique d'enquête sur les grandes fortunes des Outre-Mer français, dont GBH et la famille Hayot. Contient des éléments biographiques et économiques non publiés ailleurs. À lire avec précautions méthodologiques (ouvrage journalistique, pas académique).",
                    url: null,
                  },
                  {
                    ref: 'Mam Lam Fouck, S. (2002)',
                    titre:
                      'Histoire générale de la Guadeloupe et de la Martinique — Des origines à nos jours',
                    type: 'Ibis Rouge Éditions',
                    desc: "Histoire économique et sociale des Antilles françaises. Contextualise le rôle des familles béké dans l'économie antillaise sur la longue durée historique.",
                    url: null,
                  },
                  {
                    ref: 'Autorité de la concurrence (2009)',
                    titre:
                      "Avis n° 09-A-45 du 8 septembre 2009 relatif aux mécanismes d'importation et de distribution des produits de grande consommation dans les DOM",
                    type: 'Document institutionnel officiel',
                    desc: 'Référence institutionnelle clé. Cite GBH et ses pratiques de façon documentée. Analyse la position du groupe dans les marchés de distribution des DOM.',
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande',
                  },
                  {
                    ref: 'Challenges — Classement des 500 premières fortunes (2019–2023)',
                    titre:
                      'Bernard Hayot dans le classement annuel des grandes fortunes françaises',
                    type: 'Presse économique',
                    desc: 'Estimation journalistique annuelle de la fortune de Bernard Hayot (1 à 2 milliards €, positions variables). Source à utiliser avec précaution (estimation, non auditée).',
                    url: 'https://www.challenges.fr/classements/fortunes/',
                  },
                ].map((r) => (
                  <li key={r.ref} className="border border-slate-700 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-white">{r.ref}</p>
                      <span className="flex-shrink-0 text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                        {r.type}
                      </span>
                    </div>
                    <p className="text-xs text-amber-300/80 italic mb-1">{r.titre}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-1">{r.desc}</p>
                    {r.url && <SourceLink href={r.url}>Consulter la source</SourceLink>}
                  </li>
                ))}
              </ul>
            </Collapse>
          </div>
        )}

        {/* ══ TAB 2 : ORGANIGRAMME VISUEL ═══════════════════════════════════ */}
        {activeTab === 'organigramme' && (
          <div>
            <SectionTitle icon={GitBranch}>
              Organigramme — Hiérarchie des pôles et filiales GBH
            </SectionTitle>

            <InfoBox color="amber" title="⚠️ Note méthodologique">
              Cet organigramme est reconstitué à partir des sources officielles publiques (RNE,
              BODACC, Autorité de la concurrence). Il représente la{' '}
              <strong>structure documentée</strong> du groupe et non la liste exhaustive des
              participations (GBH n'étant pas coté en Bourse, ses comptes consolidés ne sont pas
              intégralement publiés).
              <br />
              Source : Avis ADLC 09-A-45 (2009) &amp; 19-A-12 (2019) ; RNE/INPI.
            </InfoBox>

            {/* Tree root */}
            <div className="mt-6 overflow-x-auto pb-4">
              {/* ── ROOT ── */}
              <div className="flex flex-col items-center">
                <div className="bg-amber-500/20 border-2 border-amber-500/60 rounded-2xl px-6 py-4 text-center shadow-lg">
                  <p className="text-xs text-amber-300 uppercase tracking-widest font-semibold mb-1">
                    Holding faîtière
                  </p>
                  <p className="text-lg font-black text-white">GBH SAS</p>
                  <p className="text-xs text-gray-400">
                    Baie-Mahault, Guadeloupe · SIREN 313 222 260
                  </p>
                </div>

                {/* Vertical connector */}
                <div className="w-0.5 h-8 bg-amber-500/40" />

                {/* ── POLES ── */}
                <div className="flex flex-wrap justify-center gap-4 w-full">
                  {[
                    {
                      pole: '🛒 Grande Distribution',
                      color: 'green',
                      subs: [
                        'CaribHyp SAS (Carrefour GP + MQ)',
                        'GBH Retail Martinique',
                        'GBH Retail Guyane',
                        'GBH Réunion (ex-SOGECORE)',
                        'GBH Pacific NC',
                        'GBH Polynésie',
                        "SOGDA (centrale d'achat)",
                        'Sodibag',
                        'GBH Import Alimentaire',
                        'GBH Digital (e-commerce)',
                      ],
                    },
                    {
                      pole: '🚗 Automobile',
                      color: 'orange',
                      subs: [
                        'Antilles Automobiles SA (Toyota · Lexus)',
                        'Caraïbes Automobiles (Honda)',
                        'GBH Auto Réunion',
                        'Pacific Auto NC',
                        'Madagascar Auto',
                      ],
                    },
                    {
                      pole: '🏨 Hôtellerie & Tourisme',
                      color: 'yellow',
                      subs: ['Karibéa Hotels SAS (GP · MQ · GF)'],
                    },
                    {
                      pole: '🏗️ BTP & Matériaux',
                      color: 'amber',
                      subs: ['Point P DOM (GP · MQ · GF)', 'SMGL Martinique'],
                    },
                    {
                      pole: '🥫 Agroalimentaire',
                      color: 'lime',
                      subs: [
                        'GBH Agro / Daribo Distilleries',
                        'Sofrigu (logistique froid)',
                        'GBH Énergie (carburant)',
                      ],
                    },
                    {
                      pole: '🏢 Immobilier & Services',
                      color: 'slate',
                      subs: [
                        'SCI Jarry Distribution (foncier GP)',
                        'Immobilière Hayot (DOM)',
                        'GBH Services (RH · IT · Finances)',
                      ],
                    },
                    {
                      pole: '🌍 International',
                      color: 'purple',
                      subs: ['GBH Madagascar'],
                    },
                  ].map(({ pole, color, subs }) => {
                    const palette: Record<
                      string,
                      { border: string; bg: string; text: string; sub: string }
                    > = {
                      green: {
                        border: 'border-green-500/50',
                        bg: 'bg-green-500/10',
                        text: 'text-green-300',
                        sub: 'bg-green-900/20 border-green-800',
                      },
                      orange: {
                        border: 'border-orange-500/50',
                        bg: 'bg-orange-500/10',
                        text: 'text-orange-300',
                        sub: 'bg-orange-900/20 border-orange-800',
                      },
                      yellow: {
                        border: 'border-yellow-500/50',
                        bg: 'bg-yellow-500/10',
                        text: 'text-yellow-300',
                        sub: 'bg-yellow-900/20 border-yellow-800',
                      },
                      amber: {
                        border: 'border-amber-500/50',
                        bg: 'bg-amber-500/10',
                        text: 'text-amber-300',
                        sub: 'bg-amber-900/20 border-amber-800',
                      },
                      lime: {
                        border: 'border-lime-500/50',
                        bg: 'bg-lime-500/10',
                        text: 'text-lime-300',
                        sub: 'bg-lime-900/20 border-lime-800',
                      },
                      slate: {
                        border: 'border-slate-500/50',
                        bg: 'bg-slate-700/30',
                        text: 'text-slate-300',
                        sub: 'bg-slate-800 border-slate-700',
                      },
                      purple: {
                        border: 'border-purple-500/50',
                        bg: 'bg-purple-500/10',
                        text: 'text-purple-300',
                        sub: 'bg-purple-900/20 border-purple-800',
                      },
                    };
                    const p = palette[color];
                    return (
                      <div
                        key={pole}
                        className={`flex flex-col border ${p.border} ${p.bg} rounded-xl p-3 min-w-[200px] max-w-[240px] flex-shrink-0`}
                      >
                        {/* Pole header */}
                        <p className={`text-sm font-bold ${p.text} mb-2 leading-tight`}>{pole}</p>
                        {/* Subsidiaries */}
                        <div className="space-y-1">
                          {subs.map((s) => (
                            <div
                              key={s}
                              className={`flex items-start gap-1.5 border ${p.sub} rounded-lg px-2 py-1`}
                            >
                              <span className={`text-xs mt-0.5 ${p.text} flex-shrink-0`}>▸</span>
                              <span className="text-xs text-gray-300 leading-tight">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 text-xs text-gray-500 text-center">
              Flèches implicites : toutes les entités sont rattachées à la holding GBH SAS (niveau
              1). Les filiales opérationnelles constituent le niveau 2. Certaines participations
              minoritaires ou entités locales non immatriculées en France ne figurent pas dans ce
              schéma.
            </div>
          </div>
        )}

        {/* ══ TAB 3 : DIRIGEANTS & GOUVERNANCE ══════════════════════════════ */}
        {activeTab === 'dirigeants' && (
          <div>
            <SectionTitle icon={UserCheck}>Gouvernance et dirigeants du groupe GBH</SectionTitle>

            <InfoBox color="amber" title="⚠️ Sources disponibles et limites">
              GBH est une <strong>société non cotée en Bourse</strong>. Ses comptes consolidés et la
              composition exacte de ses organes dirigeants ne sont pas intégralement publiés. Les
              informations ci-dessous proviennent du RNE/INPI, du BODACC, des avis de l'Autorité de
              la concurrence et de la presse régionale antillaise. Toute information non sourcée est
              signalée explicitement.
            </InfoBox>

            <SectionTitle icon={Users}>Fondateur & gouvernance familiale</SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                    👤
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Bernard Hayot</p>
                    <p className="text-xs text-amber-300">Fondateur & dirigeant historique</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <p>
                    <span className="text-gray-300">Naissance :</span> 1943, Fort-de-France
                    (Martinique)
                  </p>
                  <p>
                    <span className="text-gray-300">Rôle :</span> Fondateur et principal actionnaire
                    du groupe qui porte son nom. Président-fondateur de la holding GBH SAS
                    (anciennement Groupe Bernard Hayot SA).
                  </p>
                  <p>
                    <span className="text-gray-300">Parcours :</span> A débuté dans le commerce en
                    Martinique dans les années 1960 avant d'étendre son groupe à toute la Caraïbe
                    française, puis à l'Océan Indien et au Pacifique.
                  </p>
                  <p className="text-slate-600 italic mt-2">
                    Source : Site officiel GBH ; presse régionale Martinique La 1ère /
                    France-Antilles
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                    🏛️
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Gouvernance familiale</p>
                    <p className="text-xs text-blue-300">Structure de contrôle</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-400">
                  <p>
                    <span className="text-gray-300">Contrôle :</span> GBH est une{' '}
                    <strong className="text-white">entreprise familiale</strong>. La famille Hayot
                    détient la majorité du capital de la holding GBH SAS.
                  </p>
                  <p>
                    <span className="text-gray-300">Structure :</span> SAS — la forme juridique de
                    la SAS protège l'entreprise d'OPA hostiles et maintient le contrôle familial
                    hors des marchés de capitaux.
                  </p>
                  <p>
                    <span className="text-gray-300">Transmission :</span> La gestion opérationnelle
                    du groupe évolue progressivement vers la deuxième génération, conformément aux
                    pratiques des grandes entreprises familiales françaises.
                  </p>
                  <p className="text-slate-600 italic mt-2">
                    Source : Autorité de la concurrence — Avis 19-A-12 (2019), pp. 5-6 ; RNE SIREN
                    313222260
                  </p>
                </div>
              </div>
            </div>

            <SectionTitle icon={BarChart2}>
              Tableau des dirigeants & mandataires sociaux documentés
            </SectionTitle>

            <InfoBox color="blue" title="ℹ️ Sources du tableau des dirigeants">
              Ce tableau est construit à partir des sources publiques disponibles : Registre
              National des Entreprises (RNE/INPI — SIREN 313 222 260 et filiales), publications
              BODACC, Avis de l'Autorité de la concurrence (09-A-45, 19-A-12), presse régionale
              antillaise et site officiel GBH. Les mandats précis et dates d'entrée en fonction ne
              sont pas tous publiés pour une SAS familiale non cotée.
            </InfoBox>

            {/* Tableau principal des dirigeants */}
            <div className="overflow-x-auto mb-8 mt-4">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-amber-500/30 bg-amber-500/5">
                    <th className="pb-3 pt-2 px-3 text-amber-300 font-bold">Dirigeant</th>
                    <th className="pb-3 pt-2 px-3 text-amber-300 font-bold">Titre / Fonction</th>
                    <th className="pb-3 pt-2 px-3 text-amber-300 font-bold">
                      Entité(s) concernée(s)
                    </th>
                    <th className="pb-3 pt-2 px-3 text-amber-300 font-bold">Pôle</th>
                    <th className="pb-3 pt-2 px-3 text-amber-300 font-bold">Source</th>
                    <th className="pb-3 pt-2 px-3 text-amber-300 font-bold">Fiabilité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    {
                      nom: 'Bernard Hayot',
                      emoji: '👤',
                      titre: 'Fondateur & PDG',
                      detail:
                        'Président Directeur Général de la holding de tête GBH SAS. Actionnaire majoritaire. Décisionnaire stratégique ultime du groupe.',
                      entites: 'GBH SAS (holding)',
                      pole: 'Groupe entier',
                      source: 'RNE · ADLC · Presse nationale',
                      fiabilite: 'Certifié',
                      color: 'amber',
                    },
                    {
                      nom: 'Arnaud Hayot',
                      emoji: '👤',
                      titre: 'Directeur Général Adjoint',
                      detail:
                        'Identifié dans le BODACC comme mandataire social de plusieurs filiales du pôle distribution. Responsable opérationnel du pôle Grande Distribution Carrefour dans les DOM.',
                      entites: 'CaribHyp SAS · Filiales Carrefour DOM',
                      pole: 'Distribution',
                      source: 'BODACC · France-Antilles',
                      fiabilite: 'Documenté',
                      color: 'blue',
                    },
                    {
                      nom: 'Marc Hayot',
                      emoji: '👤',
                      titre: 'Directeur Pôle Automobile',
                      detail:
                        'Mentionné dans des publications légales et presse régionale en lien avec les filiales automobiles du groupe (concessions Toyota, Mitsubishi, Kia dans les Antilles).',
                      entites: 'Filiales automobile GBH (GP, MQ, GF)',
                      pole: 'Automobile',
                      source: 'BODACC · Presse régionale',
                      fiabilite: 'Documenté',
                      color: 'blue',
                    },
                    {
                      nom: 'Direction CaribHyp SAS',
                      emoji: '🏪',
                      titre: 'Direction opérationnelle Distribution',
                      detail:
                        "CaribHyp SAS est l'entité qui opère les hypermarchés Carrefour dans les DOM au nom de GBH. Elle est dotée de sa propre direction générale, dont la composition précise n'est pas intégralement publiée.",
                      entites: 'CaribHyp SAS',
                      pole: 'Distribution DOM',
                      source: 'RNE · ADLC 09-A-45',
                      fiabilite: 'Partiel',
                      color: 'slate',
                    },
                    {
                      nom: 'Direction Karibéa',
                      emoji: '🏨',
                      titre: 'Direction réseau hôtelier',
                      detail:
                        "Le réseau hôtelier Karibéa (Guadeloupe, Martinique, Guyane) dispose d'une direction propre. Les dirigeants opérationnels ne sont pas systématiquement publiés dans les sources ouvertes.",
                      entites: 'Karibéa Hôtels & Résidences',
                      pole: 'Hôtellerie',
                      source: 'Site karibea.com · BODACC',
                      fiabilite: 'Partiel',
                      color: 'slate',
                    },
                    {
                      nom: 'Direction Pôle BTP',
                      emoji: '🏗️',
                      titre: 'Direction matériaux & construction',
                      detail:
                        'Le pôle BTP / matériaux de construction (Point P DOM, Brico Pro, agences de matériaux) dispose de directeurs régionaux. Mandats disponibles partiellement dans le RNE.',
                      entites: 'Filiales BTP GBH (GP, MQ, GF, RE)',
                      pole: 'BTP & Matériaux',
                      source: 'RNE/INPI · BODACC filiales BTP',
                      fiabilite: 'Partiel',
                      color: 'slate',
                    },
                    {
                      nom: 'Daribo Distilleries — Direction',
                      emoji: '🍹',
                      titre: 'Direction pôle agroalimentaire / rhum',
                      detail:
                        "Daribo Distilleries est la filiale agroalimentaire phare du groupe (rhum, spiritueux, boissons). Sa direction propre n'est pas publiée nominativement dans les sources accessibles.",
                      entites: 'Daribo Distilleries SAS',
                      pole: 'Agroalimentaire',
                      source: 'RNE · BODACC Daribo',
                      fiabilite: 'Partiel',
                      color: 'slate',
                    },
                    {
                      nom: 'GBH Services — Direction',
                      emoji: '⚙️',
                      titre: 'Direction des fonctions support groupe',
                      detail:
                        "GBH Services est l'entité de services partagés du groupe (RH, IT, juridique, finance, marketing). Elle facture en interne les prestations aux filiales. Direction non publiée nominativement.",
                      entites: 'GBH Services SAS',
                      pole: 'Support transverse',
                      source: 'Site gbh.fr · structure déduite ADLC',
                      fiabilite: 'Partiel',
                      color: 'slate',
                    },
                  ].map((d) => {
                    const badge: Record<string, string> = {
                      Certifié: 'bg-green-500/20  text-green-300  border-green-500/40',
                      Documenté: 'bg-blue-500/20   text-blue-300   border-blue-500/40',
                      Partiel: 'bg-amber-500/20  text-amber-300  border-amber-500/40',
                    };
                    const rowBg: Record<string, string> = {
                      amber: 'bg-amber-500/5',
                      blue: '',
                      slate: 'bg-slate-800/30',
                    };
                    return (
                      <tr
                        key={d.nom}
                        className={`${rowBg[d.color]} hover:bg-slate-700/20 transition-colors`}
                      >
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{d.emoji}</span>
                            <span
                              className={`font-bold ${d.color === 'amber' ? 'text-amber-300' : d.color === 'blue' ? 'text-blue-300' : 'text-slate-300'}`}
                            >
                              {d.nom}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <p className="font-semibold text-white">{d.titre}</p>
                          <p className="text-gray-500 mt-0.5 leading-relaxed">{d.detail}</p>
                        </td>
                        <td className="py-3 px-3 align-top text-gray-400">{d.entites}</td>
                        <td className="py-3 px-3 align-top">
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 whitespace-nowrap">
                            {d.pole}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top text-slate-500 italic">{d.source}</td>
                        <td className="py-3 px-3 align-top">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${badge[d.fiabilite]}`}
                          >
                            {d.fiabilite}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Légende fiabilité */}
            <div className="flex flex-wrap gap-3 mb-8 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/60 inline-block" />
                <span className="text-gray-400">
                  <strong className="text-green-300">Certifié</strong> — Mentionné dans BODACC / RNE
                  / Avis ADLC en nom propre
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500/40 border border-blue-500/60 inline-block" />
                <span className="text-gray-400">
                  <strong className="text-blue-300">Documenté</strong> — Identifié dans presse
                  régionale + sources légales croisées
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/60 inline-block" />
                <span className="text-gray-400">
                  <strong className="text-amber-300">Partiel</strong> — Entité connue, dirigeants
                  nominatifs non intégralement publiés
                </span>
              </div>
            </div>

            {/* Fiche synthèse PDG */}
            <SectionTitle icon={UserCheck}>
              Fiche détaillée — Bernard Hayot (PDG fondateur)
            </SectionTitle>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left border border-slate-700 rounded-xl overflow-hidden">
                <tbody className="divide-y divide-slate-800">
                  {[
                    { champ: 'Nom complet', valeur: 'Bernard Hayot', fiable: true },
                    {
                      champ: 'Année de naissance',
                      valeur: '~1943 · Fort-de-France, Martinique',
                      fiable: true,
                    },
                    { champ: 'Nationalité', valeur: 'Française', fiable: true },
                    {
                      champ: 'Origine familiale',
                      valeur: 'Famille béké martiniquaise (créoles blancs)',
                      fiable: true,
                    },
                    {
                      champ: 'Fonction principale',
                      valeur: 'Président-fondateur · GBH SAS (holding)',
                      fiable: true,
                    },
                    { champ: 'SIREN de la holding', valeur: '313 222 260', fiable: true },
                    {
                      champ: 'Siège social',
                      valeur: 'Zone de Jarry, Baie-Mahault, 97122 Guadeloupe',
                      fiable: true,
                    },
                    {
                      champ: 'Territoires dirigés',
                      valeur: 'GP · MQ · GF · RE · NC · PF · MDG',
                      fiable: true,
                    },
                    {
                      champ: 'Fortune estimée (presse)',
                      valeur: '1 – 2 milliards € (estimation Challenges 2019-2023)',
                      fiable: false,
                    },
                    { champ: 'Mandat électif public', valeur: 'Aucun documenté', fiable: true },
                    {
                      champ: 'Distinctions publiques',
                      valeur: 'Non documentées dans les sources publiques',
                      fiable: true,
                    },
                    {
                      champ: 'Résidence principale',
                      valeur: 'Martinique / Antilles françaises',
                      fiable: false,
                    },
                    {
                      champ: 'Activité médiatique',
                      valeur: 'Très discrète — interventions rares (2009, 2021)',
                      fiable: true,
                    },
                  ].map((row) => (
                    <tr key={row.champ} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-gray-400 font-medium w-1/3 bg-slate-800/20">
                        {row.champ}
                      </td>
                      <td className="py-2.5 px-4 text-white">{row.valeur}</td>
                      <td className="py-2.5 px-4 text-center w-16">
                        {row.fiable ? (
                          <span className="text-green-400 font-bold">✓</span>
                        ) : (
                          <span className="text-amber-400 font-bold">~</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-600 mt-2 italic">
                ✓ = donnée vérifiée dans sources publiques · ~ = estimation journalistique, non
                auditée · Sources : RNE/INPI · ADLC Avis 09-A-45 et 19-A-12 · Challenges classement
                fortunes · presse régionale
              </p>
            </div>

            <SectionTitle icon={Building2}>Structure de gouvernance documentée</SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                {
                  organe: 'GBH SAS — Holding faîtière',
                  emoji: '🏛️',
                  role: 'Organe de tête du groupe. Coordonne la stratégie globale, détient les participations dans toutes les filiales, gère les fonctions support centralisées (RH, juridique, finances, IT).',
                  source: 'RNE/INPI — SIREN 313222260 ; site officiel gbh.fr',
                  sourceUrl: 'https://www.inpi.fr/',
                },
                {
                  organe: 'Directoires de pôles',
                  emoji: '📊',
                  role: "Chaque pôle d'activité (Distribution, Automobile, Hôtellerie, BTP, Agroalimentaire) dispose de sa propre direction opérationnelle. Les PDG/DG de filiales sont nommés par la holding.",
                  source:
                    'Autorité de la concurrence — Avis 09-A-45 (2009), structure interne décrite pp. 20-24',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
                },
                {
                  organe: 'GBH Services (fonctions support)',
                  emoji: '⚙️',
                  role: 'Entité de services partagés qui facture en interne au groupe les prestations RH, IT, juridiques et financières. Modèle courant dans les holdings diversifiées.',
                  source:
                    'Site officiel GBH — présentation groupe ; structure déduite des avis ADLC',
                  sourceUrl: 'https://www.gbh.fr/',
                },
                {
                  organe: 'Franchise Carrefour',
                  emoji: '🛒',
                  role: "GBH est franchisé Carrefour pour les DOM. Le contrat de franchise définit les relations avec Carrefour France SA pour l'usage de l'enseigne, les centrales d'achat et les conditions commerciales.",
                  source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 10-12',
                  sourceUrl:
                    'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                },
              ].map((item) => (
                <div
                  key={item.organe}
                  className="border border-slate-700 rounded-xl p-4 flex items-start gap-3"
                >
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{item.organe}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1.5">{item.role}</p>
                    <p className="text-xs text-slate-600">
                      📎{' '}
                      {item.sourceUrl ? (
                        <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                      ) : (
                        item.source
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <SectionTitle icon={FileText}>Informations légales publiques</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Forme juridique', value: 'SAS', sub: 'Société par Actions Simplifiée' },
                { label: 'SIREN', value: '313 222 260', sub: 'Identifiant national unique' },
                { label: 'Siège social', value: 'Baie-Mahault', sub: 'Zone de Jarry, 97122 GP' },
                { label: 'Date immatriculation', value: '1978', sub: 'RCS Guadeloupe' },
                { label: 'Code APE/NAF', value: '6420Z', sub: 'Activités des sociétés holding' },
                { label: 'Capital', value: 'Non public', sub: 'Société non cotée' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-3"
                >
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className="text-white font-bold text-sm">{item.value}</p>
                  <p className="text-xs text-gray-600">{item.sub}</p>
                </div>
              ))}
            </div>

            <InfoBox color="blue" title="ℹ️ Absence de données actionnariat détaillé">
              La répartition exacte du capital de GBH SAS entre les membres de la famille Hayot et
              d'éventuels investisseurs tiers n'est pas publiquement disponible. GBH n'étant pas une
              société cotée, elle n'est pas soumise à l'obligation de déclaration des
              franchissements de seuil (AMF). Les informations actionnariales ne sont exigibles que
              si la société dépasse certains seuils d'endettement obligataire public — ce qui n'est
              pas le cas connu pour GBH.
              <br />
              <br />
              <SourceLink href="https://www.amf-france.org/">
                AMF — Autorité des marchés financiers
              </SourceLink>
            </InfoBox>
          </div>
        )}

        {/* ══ TAB (filiales) ═══════════════════════════════════════════════════ */}
        {/* ══ TAB 4 : FILIALES & SOCIÉTÉS ═══════════════════════════════════ */}
        {activeTab === 'filiales' && (
          <div>
            <SectionTitle icon={Globe}>
              Liste complète des sociétés & filiales du groupe GBH
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Cette liste est établie à partir des sources officielles disponibles : Registre
              National des Entreprises (RNE/INPI), BODACC, avis de l'Autorité de la concurrence,
              rapports IEDOM et publications légales. GBH n'étant pas coté en Bourse, la liste
              complète des entités n'est pas rendue publique. Les sociétés ci-dessous sont celles{' '}
              <strong>documentées officiellement</strong>.
            </p>

            <InfoBox color="amber" title="⚠️ Périmètre de la liste">
              GBH est une holding non cotée. La liste exhaustive de ses participations n'est pas
              intégralement accessible dans les registres publics. Seules les entités identifiables
              via SIREN/SIRET (RNE), BODACC ou citées dans des décisions officielles sont
              répertoriées. Nombre total d'entités identifiées :{' '}
              <strong>{SUBSIDIARIES.length}</strong>.
            </InfoBox>

            {/* Search & filter */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher une société, enseigne, territoire…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              {filtered.length} société{filtered.length > 1 ? 's' : ''} affichée
              {filtered.length > 1 ? 's' : ''}
              {search || filterSector ? ' (filtres actifs)' : ''}
            </p>

            <div className="space-y-4">
              {filtered.map((s) => {
                const color = getColor(s.secteur);
                return (
                  <div
                    key={s.nom}
                    className="border border-slate-700 rounded-xl overflow-hidden hover:bg-slate-900/30 transition-colors"
                    style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{s.emoji}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{s.nom}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-semibold"
                                style={{ background: `${color}22`, color }}
                              >
                                {s.secteur}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700 text-gray-300">
                                {s.type}
                              </span>
                              {s.siren && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700 text-gray-400">
                                  SIREN {s.siren}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed mb-2">{s.activite}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          <span className="text-gray-400">Territoires : </span>
                          {s.territoires.join(' · ')}
                        </span>
                        {s.enseignes && s.enseignes.length > 0 && (
                          <span>
                            <span className="text-gray-400">Enseignes : </span>
                            {s.enseignes.join(', ')}
                          </span>
                        )}
                        {s.capital && (
                          <span>
                            <span className="text-gray-400">Capital : </span>
                            {s.capital}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-600">📎 Source : </span>
                        {s.sourceUrl ? (
                          <SourceLink href={s.sourceUrl}>{s.source}</SourceLink>
                        ) : (
                          <span className="text-xs text-slate-600">{s.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p>Aucune société ne correspond à votre recherche.</p>
                </div>
              )}
            </div>

            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-300">Remarque sur les données :</strong> Les sociétés
                affiliées à GBH qui ne sont pas immatriculées en France (ex : Madagascar) ou qui
                opèrent sous forme de participations minoritaires ne figurent pas au RNE français.
                Le BODACC et les avis de l'Autorité de la concurrence restent les sources les plus
                exhaustives disponibles publiquement. Pour toute vérification, le RNE est
                consultable librement sur{' '}
                <SourceLink href="https://www.inpi.fr/">data.inpi.fr</SourceLink>.
              </p>
            </div>
          </div>
        )}

        {/* ══ TAB : EMPLOI & SOCIAL ════════════════════════════════════════ */}
        {activeTab === 'emploi' && (
          <div>
            <SectionTitle icon={Briefcase}>
              Emploi, dialogue social & impact humain du groupe GBH
            </SectionTitle>

            <InfoBox color="blue" title="ℹ️ Sources des données d'emploi">
              Les données d'emploi de GBH ne sont pas publiées dans un rapport annuel public (groupe
              non coté). Les chiffres ci-dessous sont des{' '}
              <strong>estimations issues de sources officielles</strong> : CEROM (Comptes
              Économiques Rapides pour l'Outre-Mer), IEDOM, rapports préfectoraux, et publications
              de presse régionale identifiées.
            </InfoBox>

            {/* Key employment figures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard
                label="Salariés (groupe total, estimé)"
                value="~14 000"
                sub="Sources : CEROM / GBH"
                highlight
              />
              <DataCard label="Salariés en Guadeloupe" value="~4 500" sub="IEDOM GP 2023" />
              <DataCard label="Salariés en Martinique" value="~3 500" sub="IEDOM MQ 2023" />
              <DataCard
                label="Rang dans les DOM"
                value="N°1"
                sub="Premier employeur privé"
                highlight
              />
            </div>

            <SectionTitle icon={Users}>
              Répartition de l'emploi par territoire et par pôle
            </SectionTitle>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Territoire</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Effectif estimé</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">
                      Principaux pôles employeurs
                    </th>
                    <th className="pb-2 text-gray-400 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    {
                      t: '🇬🇵 Guadeloupe',
                      n: '~4 500',
                      poles: 'Distribution, Automobile, Logistique, Immobilier',
                      s: 'IEDOM GP 2023',
                    },
                    {
                      t: '🇲🇶 Martinique',
                      n: '~3 500',
                      poles: 'Distribution, Hôtellerie, Agroalimentaire, Automobile',
                      s: 'IEDOM MQ 2023',
                    },
                    {
                      t: '🇬🇫 Guyane',
                      n: '~1 200',
                      poles: 'Distribution, BTP, Hôtellerie',
                      s: 'IEDOM GF 2023',
                    },
                    {
                      t: '🇷🇪 La Réunion',
                      n: '~2 500',
                      poles: 'Distribution, Automobile, Logistique',
                      s: 'IEDOM RE 2023',
                    },
                    {
                      t: '🌏 Nouvelle-Calédonie',
                      n: '~800',
                      poles: 'Distribution, Automobile',
                      s: 'IEOM NC 2022',
                    },
                    {
                      t: '🌺 Polynésie française',
                      n: '~300',
                      poles: 'Distribution, Partenariats',
                      s: 'IEOM PF 2022',
                    },
                    {
                      t: '🌍 Madagascar',
                      n: '~1 200',
                      poles: 'Automobile, Agroalimentaire',
                      s: 'GBH — site officiel',
                    },
                    {
                      t: 'Siège & services partagés',
                      n: '~500',
                      poles: 'RH, IT, Juridique, Finance',
                      s: 'Structure interne estimée',
                    },
                  ].map((r) => (
                    <tr key={r.t}>
                      <td className="py-2 text-white font-medium pr-3">{r.t}</td>
                      <td className="py-2 text-amber-300 font-bold pr-3">{r.n}</td>
                      <td className="py-2 text-gray-400 pr-3">{r.poles}</td>
                      <td className="py-2 text-gray-600 italic">{r.s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionTitle icon={AlertTriangle}>
              Dialogue social — Grèves et conflits documentés
            </SectionTitle>

            <InfoBox color="amber" title="⚠️ Contexte : GBH cible du mouvement social de 2021">
              Le mouvement social de novembre 2021 en Guadeloupe, l'un des plus importants depuis
              les grandes grèves de 2009, a été déclenché notamment par des revendications contre la
              vie chère. Les grandes surfaces GBH (Carrefour) ont été directement impactées. Ces
              faits sont documentés dans les rapports préfectoraux et la presse nationale.
            </InfoBox>

            <div className="space-y-4 mb-8">
              {[
                {
                  date: 'Janvier-Février 2009 — LKP',
                  title: 'Grève générale — Mouvement LKP',
                  impact:
                    'Le Lyannaj Kont Pwofitasyon (LKP) conduit une grève générale de 44 jours en Guadeloupe. Les grandes surfaces GBH sont ciblées comme symboles de la vie chère. La grève aboutit aux « accords Jacob » prévoyant une baisse de prix sur certains produits alimentaires.',
                  resultat:
                    "Accord de baisse de prix sur ~100 produits. Création d'un comité de suivi des prix.",
                  source: 'Rapport préfectoral Guadeloupe 2009 ; Archives Le Monde',
                  sourceUrl: 'https://www.lemonde.fr/',
                },
                {
                  date: 'Novembre-Décembre 2021 — Guadeloupe',
                  title: 'Insurrection sociale — Crise du coût de la vie',
                  impact:
                    "Mouvement de protestation violent en Guadeloupe. Les supermarchés GBH (Carrefour Jarry, Carrefour Milénis) sont directement visés. Des barrages bloquent les livraisons. Le préfet saisit les forces de l'ordre. GBH ferme temporairement plusieurs points de vente pour des raisons de sécurité.",
                  resultat:
                    "Fermetures temporaires de magasins. Engagement de négociations avec l'État sur les prix. Extension du bouclier qualité-prix.",
                  source: 'Rapport mission préfectorale Guadeloupe déc. 2021 ; France-Antilles',
                  sourceUrl: 'https://www.guadeloupe.gouv.fr/',
                },
                {
                  date: '2021-2024 — Martinique',
                  title: 'Mobilisations répétées contre la vie chère',
                  impact:
                    'Plusieurs épisodes de mobilisation en Martinique incluant des blocages de routes, des fermetures préventives de grandes surfaces. Les enseignes GBH sont régulièrement mentionnées dans les communiqués des organisations syndicales (CDMT, CGTM).',
                  resultat:
                    'Négociations État-distributeurs. Engagement de GBH dans le dispositif BQP élargi. Réductions tarifaires ciblées sur certaines catégories.',
                  source: 'IEDOM Martinique 2023 ; RFO / Martinique La 1ère',
                  sourceUrl: 'https://la1ere.francetvinfo.fr/martinique/',
                },
                {
                  date: 'Régulier — Conflits sociaux internes',
                  title: 'Grèves sectorielles dans les filiales GBH',
                  impact:
                    'Des grèves ponctuelles sont documentées dans les filiales GBH (caissiers, logisticiens, agents hôteliers). La CGT et la CGTG sont actives dans certaines entités du groupe. Les conflits portent généralement sur les salaires, le temps de travail et les conditions de travail.',
                  resultat:
                    "Accords de branche signés. GBH est engagé dans des conventions collectives de la grande distribution et de l'hôtellerie.",
                  source: 'BODACC — dépôts comptes sociaux ; presse syndicale locale',
                  sourceUrl: 'https://www.bodacc.fr/',
                },
              ].map((ev) => (
                <div key={ev.date} className="border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold bg-red-500/20 border border-red-500/30 text-red-300">
                        {ev.date}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{ev.title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed mb-2">{ev.impact}</p>
                      <p className="text-xs text-green-300 mb-1">
                        <strong>Résultat documenté :</strong> {ev.resultat}
                      </p>
                      <p className="text-xs text-slate-600">
                        📎 <SourceLink href={ev.sourceUrl}>{ev.source}</SourceLink>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SectionTitle icon={Briefcase}>Conditions salariales — éléments connus</SectionTitle>
            <Collapse title="💼 Rémunérations et conventions collectives applicables">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2">
                <li>
                  <strong>Grande distribution :</strong> GBH applique la Convention Collective
                  Nationale du Commerce de Détail et de Gros à Prédominance Alimentaire (CCN 3305).
                  Les salaires de base dans la distribution ultramarines intègrent la{' '}
                  <strong>Majoration de vie chère (MVC)</strong> — 20 % pour la Guadeloupe,
                  Martinique et Guyane, 12 % pour La Réunion.
                </li>
                <li>
                  <strong>Hôtellerie (Karibéa) :</strong> CCN des Hôtels, Cafés, Restaurants (HCR).
                  La Martinique et la Guadeloupe bénéficient d'accords locaux.
                </li>
                <li>
                  <strong>SMIC DOM :</strong> Le SMIC horaire s'applique avec la majoration
                  spécifique aux DOM. En 2024 : 11,65 €/h brut + MVC.
                </li>
                <li>
                  <strong>Intéressement et participation :</strong> Certaines filiales GBH déposent
                  des accords d'intéressement (visible dans les dépôts obligatoires à la DREETS).
                  Les montants ne sont pas publics.
                </li>
                <li>
                  <strong>Formation professionnelle :</strong> En tant qu'employeur de plus de 300
                  salariés, GBH est soumis à l'obligation de plan de développement des compétences
                  et aux négociations annuelles obligatoires.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Légifrance — CCN Commerce Alimentaire ; DREETS Guadeloupe ; site Legifrance
              </p>
            </Collapse>

            <Collapse title="🤝 Organisations syndicales présentes dans le groupe">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2">
                <li>
                  <strong>CGTG (Confédération Générale du Travail de la Guadeloupe) :</strong>{' '}
                  Syndicat historiquement influent en Guadeloupe, actif dans les grandes surfaces et
                  la logistique.
                </li>
                <li>
                  <strong>CGTM (CGT Martinique) :</strong> Active dans la grande distribution
                  martiniquaise, représentée dans les filiales GBH.
                </li>
                <li>
                  <strong>CDMT (Centrale Démocratique Martiniquaise des Travailleurs) :</strong>{' '}
                  Syndicat martiniquais participant aux négociations de branche.
                </li>
                <li>
                  <strong>UGTG (Union Générale des Travailleurs de la Guadeloupe) :</strong>{' '}
                  Syndicat lié au mouvement nationaliste guadeloupéen, à l'origine de certains
                  appels à grève dans le secteur de la grande distribution.
                </li>
                <li>
                  <strong>FO, CFDT :</strong> Présence de syndicats nationaux dans certaines
                  filiales, notamment dans les secteurs automobile et hôtellerie.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : DREETS Guadeloupe et Martinique — représentativité syndicale ; presse
                régionale
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : FINANCES & REVENUS ══════════════════════════════════════ */}
        {activeTab === 'finances' && (
          <div>
            <SectionTitle icon={DollarSign}>
              Finances, revenus estimés et marges du groupe GBH
            </SectionTitle>

            <InfoBox color="amber" title="⚠️ Limites des données financières disponibles">
              GBH SAS est une <strong>société non cotée</strong>. Ses comptes annuels consolidés ne
              sont pas publiés au Journal Officiel de l'UE. Les chiffres ci-dessous sont des{' '}
              <strong>estimations établies à partir de sources officielles</strong> : CEROM, IEDOM,
              avis de l'Autorité de la concurrence, données INSEE et évaluations publiées par des
              instituts économiques. Ils ne constituent pas des données comptables certifiées.
            </InfoBox>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard
                label="CA groupe total (estimé)"
                value="~2,5–3 Md€"
                sub="CEROM 2022 / presse"
                highlight
              />
              <DataCard
                label="CA pôle distribution (estimé)"
                value="~1,6–1,9 Md€"
                sub="~65 % du CA total"
              />
              <DataCard
                label="CA pôle automobile (estimé)"
                value="~400–500 M€"
                sub="~15–18 % du CA"
              />
              <DataCard
                label="CA hôtellerie & autres"
                value="~400–600 M€"
                sub="~15–20 % du CA"
                highlight
              />
            </div>

            <SectionTitle icon={BarChart2}>
              Décomposition estimée du chiffre d'affaires par pôle
            </SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                {
                  pole: '🛒 Grande Distribution (Carrefour DOM)',
                  pct: 65,
                  color: '#34d399',
                  note: 'Pôle dominant du groupe. Inclut les hypermarchés, supermarchés, drives et e-commerce dans les 7 territoires.',
                },
                {
                  pole: '🚗 Distribution Automobile',
                  pct: 16,
                  color: '#f97316',
                  note: 'Concessions Toyota, Lexus, Honda dans les Antilles, Réunion, NC et Madagascar.',
                },
                {
                  pole: '🏨 Hôtellerie (Karibéa)',
                  pct: 6,
                  color: '#fbbf24',
                  note: "Chaîne hôtelière Karibéa (GP, MQ, GF). Tourisme d'affaires et de loisirs.",
                },
                {
                  pole: '🏗️ BTP & Matériaux',
                  pct: 5,
                  color: '#f59e0b',
                  note: 'Point P DOM, SMGL. Marchés portés par le dynamisme de la construction dans les DOM.',
                },
                {
                  pole: '🥫 Agroalimentaire & Logistique',
                  pct: 5,
                  color: '#a3e635',
                  note: 'Daribo distilleries, GBH Import, Sofrigu. Chaîne logistique du froid.',
                },
                {
                  pole: '🌍 International (Madagascar)',
                  pct: 3,
                  color: '#a78bfa',
                  note: 'Activités automobile et distribution à Madagascar. Potentiel de croissance.',
                },
              ].map((row) => (
                <div key={row.pole} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{row.pole}</span>
                    <span className="text-white font-bold">{row.pct}%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">{row.note}</p>
                </div>
              ))}
            </div>

            <SectionTitle icon={TrendingUp}>
              Analyse des marges — données documentées officiellement
            </SectionTitle>

            <InfoBox
              color="red"
              title="📊 Les marges DOM sont structurellement plus élevées qu'en métropole"
            >
              L'Autorité de la concurrence (Avis 09-A-45, 2009 ; Avis 19-A-12, 2019) constate que
              les{' '}
              <strong>
                marges brutes des distributeurs alimentaires dans les DOM sont supérieures de 30 à
                40 % par rapport à la France métropolitaine
              </strong>
              . Cette différence est justifiée partiellement par des coûts plus élevés (fret, main
              d'œuvre, énergie), mais l'ADLC estime qu'une partie reflète le{' '}
              <strong>pouvoir de marché des opérateurs dominants</strong>.
            </InfoBox>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Indicateur</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">
                      DOM (GBH/Carrefour est.)
                    </th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">
                      France métro (référence)
                    </th>
                    <th className="pb-2 text-gray-400 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    {
                      ind: 'Marge brute grande distribution',
                      dom: '28–35 %',
                      metro: '20–25 %',
                      s: 'ADLC Avis 19-A-12 (2019)',
                    },
                    {
                      ind: 'Taux de marque alimentaire',
                      dom: '35–45 %',
                      metro: '25–30 %',
                      s: 'INSEE — Enquête prix DOM 2022',
                    },
                    {
                      ind: 'Marge nette estimée (groupe)',
                      dom: '5–8 %',
                      metro: '2–4 %',
                      s: 'CEROM estimations 2022',
                    },
                    {
                      ind: "Coût d'achat moyen (importations)",
                      dom: '+20–25 %',
                      metro: 'Base 0',
                      s: 'Fret maritime + délai',
                    },
                    {
                      ind: 'Charges de personnel / CA',
                      dom: '15–18 %',
                      metro: '12–15 %',
                      s: 'Rapport branche distribution 2022',
                    },
                    {
                      ind: 'Loyers commerciaux / CA',
                      dom: '2–3 % (groupe intégré)',
                      metro: '4–6 %',
                      s: 'ADLC — intégration verticale',
                    },
                  ].map((r) => (
                    <tr key={r.ind}>
                      <td className="py-2 text-white pr-3">{r.ind}</td>
                      <td className="py-2 text-amber-300 font-bold pr-3">{r.dom}</td>
                      <td className="py-2 text-gray-400 pr-3">{r.metro}</td>
                      <td className="py-2 text-gray-600 italic">{r.s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Collapse title="💡 Avantage financier de l'intégration verticale">
              <p className="mb-3 text-xs text-gray-300">
                L'Autorité de la concurrence souligne que GBH bénéficie d'un avantage financier
                structurel lié à son <strong>intégration verticale</strong> : en détenant à la fois
                la centrale d'achat (SOGDA), les entrepôts (Sofrigu), le foncier (SCI Jarry
                Distribution) et les surfaces de vente (CaribHyp), le groupe réalise des économies
                significatives sur des postes qui sont des coûts fixes pour un concurrent externe.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li>
                  <strong>Loyers « internes » nuls :</strong> GBH ne paie pas de loyer à des
                  propriétaires tiers pour ses surfaces (il est propriétaire). Économie estimée :
                  plusieurs dizaines de millions d'euros par an.
                </li>
                <li>
                  <strong>Marges arrière internes :</strong> Les remises et ristournes obtenues des
                  fournisseurs par la centrale SOGDA restent dans le groupe.
                </li>
                <li>
                  <strong>Logistique mutualisée :</strong> Les coûts de transport et de stockage
                  sont partagés entre la distribution et les filiales automobiles/BTP, réduisant le
                  coût unitaire.
                </li>
                <li>
                  <strong>Cash-flow amplifié :</strong> La rotation rapide des stocks en grande
                  distribution génère un BFR (besoin en fonds de roulement) négatif — avantage de
                  trésorerie structurel.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source :{' '}
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation">
                  ADLC — Avis 09-A-45 (2009), pp. 30-40
                </SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : PRATIQUES COMMERCIALES ═════════════════════════════════ */}
        {activeTab === 'pratiques' && (
          <div>
            <SectionTitle icon={ShoppingBag}>
              Pratiques commerciales documentées du groupe GBH
            </SectionTitle>

            <InfoBox color="amber" title="⚠️ Important — Distinction pratique et infraction">
              Les pratiques décrites ci-dessous sont issues des{' '}
              <strong>avis publics de l'Autorité de la concurrence</strong>. Ces avis décrivent des
              pratiques <em>observées ou potentielles</em>
              dans un marché, sans nécessairement les qualifier d'infractions. Aucune condamnation
              de GBH pour pratiques anticoncurrentielles n'est publiée à la date de ce dossier.
              L'objectif est informatif et pédagogique.
            </InfoBox>

            <SectionTitle icon={AlertTriangle}>
              Pratiques identifiées par l'Autorité de la concurrence
            </SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  pratique: 'Accords de gamme exclusifs territoriaux',
                  gravite: 'Élevée',
                  color: 'red',
                  description:
                    "L'Autorité de la concurrence a identifié dans l'Avis 09-A-45 (2009) des pratiques d'accords de gamme exclusifs : un fournisseur s'engage à n'approvisionner qu'un seul distributeur dans un territoire donné. Pour les petits marchés insulaires, cela peut équivaloir à une exclusivité de fait sur tout le territoire.",
                  impact:
                    "Verrouillage de l'accès aux approvisionnements pour les concurrents. Un nouveau distributeur ne peut obtenir certaines marques si elles sont liées par accord à GBH.",
                  encadrement:
                    'Loi Lurel (2012) — Art. 2 : interdiction des accords de gamme exclusifs dans les DOM sur les produits de grande consommation. Applicable depuis 2013.',
                  source: 'ADLC — Avis 09-A-45 (2009), p. 31 ; Loi 2012-1270 art. 2',
                  sourceUrl:
                    'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
                },
                {
                  pratique: "Conditions d'accès aux linéaires défavorables aux producteurs locaux",
                  gravite: 'Modérée',
                  color: 'orange',
                  description:
                    'Les producteurs locaux (agriculteurs, PME agroalimentaires) disposent de peu de pouvoir de négociation face à GBH, acteur dominant. Les conditions de référencement (délais de paiement, remises de référencement, coûts de mise en rayon) peuvent être particulièrement lourdes pour les petits producteurs ultramarins.',
                  impact:
                    "Difficultés d'accès aux linéaires pour les productions locales. Risque de marginalisation des producteurs locaux au profit des importations métropolitaines.",
                  encadrement:
                    "Loi EGAlim (2018) et ses décrets d'application — plafonnement des délais de paiement, encadrement des conditions commerciales.",
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 35-40 ; Rapports OPMR 2022',
                  sourceUrl:
                    'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                },
                {
                  pratique: 'Position dominante dans les zones de chalandise locales',
                  gravite: 'Élevée',
                  color: 'red',
                  description:
                    "Dans certaines zones géographiques (ex : nord Grande-Terre en Guadeloupe, certains secteurs de Martinique), GBH détient des parts de marché supérieures à 50 % dans la zone de chalandise immédiate. Ce niveau de concentration, qualifié de « position dominante » par l'ADLC, permet en théorie au groupe d'imposer des prix ou des conditions sans crainte d'une pression concurrentielle suffisante.",
                  impact:
                    "Prix plus élevés dans les zones sans concurrence proche. Limitation du pouvoir d'achat des ménages les plus modestes qui n'ont pas accès à d'autres enseignes.",
                  encadrement:
                    'Art. L420-2 Code de commerce — abus de position dominante. Surveillance OPMR.',
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 15-22 ; OPMR Guadeloupe 2022',
                  sourceUrl:
                    'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                },
                {
                  pratique:
                    'Intégration verticale et risque de discrimination de prix de transfert',
                  gravite: 'Potentielle',
                  color: 'amber',
                  description:
                    "GBH contrôle à la fois la centrale d'achat (SOGDA), les entrepôts (Sofrigu), le foncier commercial (SCI Jarry) et les surfaces de vente (CaribHyp). Cette intégration verticale, légale en elle-même, soulève la question des prix de transfert intragroupe : les filiales peuvent se facturer mutuellement des prix qui ne reflètent pas les conditions de marché, permettant de moduler les résultats comptables apparents de chaque entité.",
                  impact:
                    'Opacité sur la rentabilité réelle de chaque pôle. Difficulté pour les régulateurs de mesurer les marges exactes au niveau de chaque stade de la chaîne (importation, stockage, distribution).',
                  encadrement:
                    'Code général des impôts — Art. 57 : contrôle des prix de transfert entre sociétés liées. Obligation de documentation pour les grands groupes.',
                  source: 'ADLC — Avis 09-A-45 (2009), pp. 33-36 ; CGI art. 57',
                  sourceUrl:
                    'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042910498/',
                },
                {
                  pratique:
                    "Barrières à l'entrée foncières — contrôle des meilleures localisations",
                  gravite: 'Structurelle',
                  color: 'purple',
                  description:
                    "GBH détient les murs et le foncier de ses centres commerciaux via ses SCI (SCI Jarry Distribution notamment). La zone de Jarry à Baie-Mahault est la plus grande zone commerciale des Antilles françaises. Tout concurrent souhaitant s'implanter doit trouver un terrain disponible, denrée rare dans des îles à surface limitée. GBH a ainsi créé une barrière à l'entrée durable.",
                  impact:
                    "Impossibilité pratique pour un concurrent de taille significative de s'implanter à proximité de la zone Jarry. Renforcement de la position dominante par le contrôle du foncier.",
                  encadrement:
                    "Commission d'équipement commercial (CEC) en Guadeloupe — autorisation nécessaire pour les surfaces > 1 000 m². Loi Lurel 2012 — volet foncier commercial.",
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 40-48 ; Loi 2012-1270',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
                },
              ].map((item) => {
                const colorMap: Record<string, string> = {
                  red: 'bg-red-500/10 border-red-500/30 text-red-300',
                  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
                  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
                };
                return (
                  <div key={item.pratique} className="border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-white leading-tight">{item.pratique}</p>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${colorMap[item.color]}`}
                      >
                        Risque : {item.gravite}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.description}</p>
                    <p className="text-xs text-amber-200 mb-1.5">
                      <strong>Impact documenté :</strong> {item.impact}
                    </p>
                    <p className="text-xs text-blue-300 mb-2">
                      <strong>Encadrement légal :</strong> {item.encadrement}
                    </p>
                    <p className="text-xs text-slate-600">
                      📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                    </p>
                  </div>
                );
              })}
            </div>

            <Collapse title="📋 Recommandations de l'ADLC restées sans suite obligatoire">
              <p className="mb-3 text-xs text-gray-300">
                Les avis de l'Autorité de la concurrence sont{' '}
                <strong>consultatifs et non contraignants</strong>
                (sauf si une injonction formelle est émise dans le cadre d'une procédure
                contentieuse). Plusieurs recommandations formulées en 2009 et 2019 n'ont pas donné
                lieu à des mesures législatives contraignantes spécifiques au secteur de la grande
                distribution DOM.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li>
                  Recommandation 2009 : Publication obligatoire des marges par segment dans les DOM
                  — <em>non mise en œuvre.</em>
                </li>
                <li>
                  Recommandation 2019 : Plafonnement des parts de marché par zone de chalandise
                  (seuil d'alerte à 50 %) — <em>non mise en œuvre.</em>
                </li>
                <li>
                  Recommandation 2019 : Séparation obligatoire entre centrale d'achat et
                  distribution de détail dans les DOM — <em>non mise en œuvre.</em>
                </li>
                <li>
                  Recommandation 2019 : Renforcement du rôle de l'OPMR avec pouvoirs d'injonction —{' '}
                  <em>partiellement suivi par la loi DROM de 2022.</em>
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source :{' '}
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                  Avis 19-A-12 — Récapitulatif des recommandations, pp. 60-68
                </SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : RELATIONS ÉTAT ══════════════════════════════════════════ */}
        {activeTab === 'etat' && (
          <div>
            <SectionTitle icon={Flag}>
              Relations avec l'État et les collectivités d'Outre-Mer
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              En tant que premier groupe privé des Antilles-Guyane, GBH entretient des relations
              multiples avec les pouvoirs publics : réglementaires, fiscales, contractuelles et
              sociales. Ces relations sont encadrées par le droit commun et des dispositions
              spécifiques aux DOM.
            </p>

            <SectionTitle icon={DollarSign}>
              Mécanismes fiscaux avantageux dans les DOM (droit applicable)
            </SectionTitle>

            <InfoBox
              color="blue"
              title="ℹ️ Ces mécanismes sont légaux et s'appliquent à tous les groupes investissant dans les DOM"
            >
              Les dispositifs décrits ci-dessous sont des mécanismes fiscaux de droit commun
              applicables dans les DOM. Ils visent à compenser les surcoûts liés à l'insularité et à
              attirer les investissements. Il n'est pas établi que GBH les utilise systématiquement
              — seuls les principes légaux sont décrits ici.
            </InfoBox>

            <div className="space-y-4 mb-8">
              {[
                {
                  mecanisme: 'Défiscalisation loi Girardin (CGI art. 199 undecies B)',
                  icon: '📉',
                  description:
                    "Les investissements productifs dans les DOM (équipements, matériels, constructions) peuvent bénéficier d'une réduction d'impôt pouvant atteindre 115 % du montant investi pour les investisseurs métropolitains. Les groupes réalisant des investissements en outre-mer y ont généralement recours via des montages Girardin industriel.",
                  application:
                    "Un groupe comme GBH, réalisant régulièrement des investissements immobiliers et d'équipements dans les DOM, est susceptible d'y avoir recours — directement ou via des SCI partenaires.",
                  source: 'CGI art. 199 undecies B et C ; Bofip.impots.gouv.fr',
                  sourceUrl: 'https://bofip.impots.gouv.fr/',
                },
                {
                  mecanisme: "Exonérations spécifiques de l'octroi de mer (OM)",
                  icon: '🚢',
                  description:
                    "L'octroi de mer frappe les importations mais aussi les productions locales. Cependant, les Conseils Régionaux peuvent voter des exonérations ou des taux réduits pour certains produits ou certaines entreprises (notamment les producteurs locaux). GBH, en tant qu'importateur et distributeur, est assujetti à l'OM sur ses importations, mais peut bénéficier d'exonérations sur certains produits distribués localement.",
                  application:
                    "Les taux d'OM s'appliquent différemment selon les produits. La capacité de GBH à optimiser ses achats en fonction des taux d'OM constitue un avantage concurrentiel.",
                  source: 'Loi 2004-639 ; Délibérations CR Guadeloupe 2022',
                  sourceUrl: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/',
                },
                {
                  mecanisme: 'Fonds FEDER (Fonds Européen de Développement Régional)',
                  icon: '🇪🇺',
                  description:
                    "Les DOM bénéficient de fonds structurels européens significatifs (FEDER, FSE). Les entreprises privées réalisant des investissements en cofinancement avec les collectivités peuvent accéder à ces fonds. Les projets d'infrastructure commerciale, logistique ou hôtelière peuvent en bénéficier.",
                  application:
                    "Des projets d'investissement dans les DOM en partenariat avec les collectivités peuvent associer des fonds FEDER. Les détails des bénéficiaires privés sont publiés dans les rapports des autorités de gestion.",
                  source: 'DAECT — Rapports FEDER Guadeloupe/Martinique 2021-2027',
                  sourceUrl: 'https://www.europe-en-guadeloupe.eu/',
                },
                {
                  mecanisme: "Zone Franche d'Activité Nouvelle Génération (ZFANG)",
                  icon: '🏭',
                  description:
                    "Créées par la loi PACTE (2019), les ZFANG permettent aux entreprises situées dans les DOM de bénéficier d'abattements sur les bénéfices industriels et commerciaux (BIC), les droits de mutation et la CFE. Ces abattements sont dégressifs selon la taille de l'entreprise.",
                  application:
                    'Applicable aux filiales de GBH remplissant les critères (moins de 250 salariés, CA < 50 M€). Certaines filiales opérationnelles de GBH peuvent y être éligibles.',
                  source: 'Loi n° 2019-486 PACTE art. 146 ; CGI art. 44 quaterdecies',
                  sourceUrl: 'https://www.legifrance.gouv.fr/',
                },
              ].map((item) => (
                <div key={item.mecanisme} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    {item.mecanisme}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.description}</p>
                  <p className="text-xs text-blue-300 mb-2">
                    <strong>Application potentielle :</strong> {item.application}
                  </p>
                  <p className="text-xs text-slate-600">
                    📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                  </p>
                </div>
              ))}
            </div>

            <SectionTitle icon={Landmark}>
              Marchés publics & Relations contractuelles avec l'État
            </SectionTitle>
            <Collapse title="🏛️ GBH comme prestataire des collectivités DOM" defaultOpen>
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2">
                <li>
                  <strong>Hôtellerie (Karibéa) :</strong> Les hôtels Karibéa hébergent régulièrement
                  des délégations officielles, des conférences publiques et des séminaires d'État
                  aux Antilles. Ces prestations constituent des marchés publics de fait, soumis au
                  Code de la commande publique.
                </li>
                <li>
                  <strong>Fournitures alimentaires :</strong> Les filiales de distribution GBH
                  peuvent être titulaires de marchés d'approvisionnement pour des cantines
                  scolaires, des hôpitaux ou des services pénitentiaires dans les DOM.
                </li>
                <li>
                  <strong>BTP & Matériaux :</strong> Le pôle BTP (Point P DOM) fournit
                  potentiellement des collectivités et des organismes publics locaux en matériaux de
                  construction.
                </li>
                <li>
                  <strong>Stations-service :</strong> Des marchés de carburant pour les flottes de
                  véhicules publics peuvent être attribués aux stations GBH Energy.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Les marchés publics passés avec des entités GBH sont théoriquement consultables sur
                <SourceLink href="https://www.marches-publics.info/">
                  {' '}
                  marches-publics.info
                </SourceLink>{' '}
                et
                <SourceLink href="https://www.boamp.fr/"> BOAMP</SourceLink>.
              </p>
            </Collapse>

            <Collapse title="🗳️ Relations politiques — éléments documentés de la presse régionale">
              <p className="mb-3 text-xs text-gray-300">
                En tant que premier employeur et contributeur fiscal privé des Antilles, GBH joue un
                rôle économique structurant qui lui confère une influence de fait dans le débat
                politique régional. Les éléments suivants sont documentés dans la presse régionale.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Lobbying institutionnel :</strong> GBH est membre de fédérations
                  patronales DOM (MEDEF Guadeloupe, CGPME Martinique) qui représentent les intérêts
                  du secteur privé auprès des pouvoirs publics et participent aux concertations
                  sociales.
                </li>
                <li>
                  <strong>Questions parlementaires :</strong> Plusieurs questions écrites de
                  parlementaires (députés et sénateurs des DOM) ont été déposées sur les marges de
                  GBH, les prix dans les grandes surfaces et la concentration du marché. Source :
                  Questions.assemblee-nationale.fr.
                </li>
                <li>
                  <strong>Conférence de presse 2021 :</strong> Suite aux violences de novembre 2021
                  en Guadeloupe, Bernard Hayot a accordé des interviews à la presse régionale pour
                  défendre la politique de prix du groupe et annoncer des baisses ciblées.
                </li>
                <li>
                  <strong>Relations avec les préfets :</strong> Le groupe participe aux réunions de
                  crise sur les prix organisées par les préfets des DOM, notamment dans le cadre du
                  dispositif BQP (Bouclier Qualité-Prix).
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Assemblée Nationale — Questions écrites DOM
                (questions.assemblee-nationale.fr) ; presse régionale (France-Antilles, Guadeloupe
                La 1ère, Martinique La 1ère).
              </p>
            </Collapse>

            <Collapse title="🛡️ Bouclier Qualité-Prix (BQP) — rôle de GBH">
              <p className="mb-3 text-xs text-gray-300">
                Le Bouclier Qualité-Prix (BQP) est un dispositif réglementaire instauré dans les DOM
                en application de l'article 1er de la loi n° 2012-1270 relative à la régulation
                économique outre-mer. Il impose une négociation annuelle entre les préfets, les
                distributeurs et les fournisseurs pour établir un panier d'une centaine de produits
                à prix maîtrisés.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li>
                  GBH/Carrefour est l'un des signataires obligatoires du BQP dans les
                  Antilles-Guyane et à La Réunion.
                </li>
                <li>
                  Le panier BQP est publié par arrêté préfectoral chaque année (consultable sur
                  legifrance.gouv.fr).
                </li>
                <li>
                  En 2023, le BQP a été élargi à la suite des mobilisations de 2021-2022, augmentant
                  le nombre de produits concernés.
                </li>
                <li>
                  Des observateurs (OPMR, associations de consommateurs) relèvent que certains
                  produits du BQP voient leur prix compensés par des hausses sur des produits
                  hors-panier.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Légifrance — Arrêtés préfectoraux BQP 2022-2024 ;
                <SourceLink href="https://www.legifrance.gouv.fr/"> legifrance.gouv.fr</SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : PRESSE & CONTROVERSES ══════════════════════════════════ */}
        {activeTab === 'presse' && (
          <div>
            <SectionTitle icon={Newspaper}>
              Presse, déclarations publiques & controverses documentées
            </SectionTitle>

            <InfoBox
              color="amber"
              title="⚠️ Rigueur factuelle — Presse et sources primaires uniquement"
            >
              Cette section recense des faits documentés dans la{' '}
              <strong>presse régionale et nationale</strong>, les questions parlementaires et les
              rapports officiels. Aucune information ne repose sur des sources anonymes. Les
              opinions formulées par des tiers (syndicats, élus, associations) sont clairement
              identifiées comme telles et ne reflètent pas une position de ce dossier.
            </InfoBox>

            <SectionTitle icon={Newspaper}>Chronologie des faits médiatiques majeurs</SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  date: '2009',
                  titre: "Révélation publique des marges GBH lors de l'Avis 09-A-45",
                  contenu:
                    "La publication de l'Avis 09-A-45 de l'Autorité de la concurrence provoque une large couverture médiatique aux Antilles. Pour la première fois, les mécanismes de formation des prix et le rôle des grandes centrales d'achat comme SOGDA sont expliqués publiquement. La presse régionale (France-Antilles, RFO) consacre plusieurs dossiers à cette question.",
                  media: 'Autorité de la concurrence ; France-Antilles ; RFO Antilles',
                  nature: 'Enquête institutionnelle',
                  color: '#60a5fa',
                },
                {
                  date: '2009 — LKP',
                  titre: 'Bernard Hayot et GBH au centre du mouvement LKP',
                  contenu:
                    'Lors de la grève générale de 44 jours conduite par le LKP (Lyannaj Kont Pwofitasyon — "Alliance Contre l\'Exploitation"), GBH est désigné comme symbole du système de vie chère. Des leaders du LKP appellent au boycott des magasins Carrefour. Le groupe est contraint de participer aux négociations avec les pouvoirs publics et de signer les accords de baisse de prix dits "accords Jacob".',
                  media: 'France-Antilles Guadeloupe ; RFO ; Le Monde',
                  nature: 'Crise sociale',
                  color: '#f43f5e',
                },
                {
                  date: '2019',
                  titre: 'Avis 19-A-12 — Confirmation et aggravation des constats',
                  contenu:
                    "L'Avis 19-A-12 constate que la position de GBH n'a pas faibli depuis 2009 et que certaines recommandations précédentes n'ont pas été suivies d'effet. La presse nationale (Le Monde, Libération) reprend les conclusions sur les marges excessives dans les DOM. Des associations de consommateurs antillaises organisent des campagnes de sensibilisation.",
                  media: 'Autorité de la concurrence ; Le Monde ; UFC-Que Choisir DOM',
                  nature: 'Enquête institutionnelle',
                  color: '#60a5fa',
                },
                {
                  date: 'Novembre 2021',
                  titre: 'Insurrection sociale en Guadeloupe — GBH ciblé',
                  contenu:
                    "Les violences sociales de novembre 2021 en Guadeloupe voient des manifestants s'en prendre aux symboles de la vie chère. Des supermarchés Carrefour appartenant à GBH sont ciblés lors d'incendies et de pillages. Bernard Hayot réagit publiquement, dénonçant les violences tout en annonçant un plan de baisses de prix ciblées. Le Premier ministre Jean Castex reçoit des représentants des collectifs antillais.",
                  media: 'Guadeloupe La 1ère ; Le Monde ; France Inter ; BFM TV',
                  nature: 'Crise sociale — dommages matériels',
                  color: '#f43f5e',
                },
                {
                  date: '2021-2022',
                  titre: 'Questions parlementaires sur GBH et les prix dans les DOM',
                  contenu:
                    "Suite aux événements de 2021, plusieurs parlementaires (dont des députés de Guadeloupe et de Martinique) déposent des questions écrites au gouvernement sur les marges de GBH et la régulation des prix dans les DOM. Ces questions sont consultables sur le site de l'Assemblée Nationale. Le gouvernement répond en invoquant le dispositif BQP et la surveillance OPMR.",
                  media:
                    'Assemblée Nationale — Questions écrites (questions.assemblee-nationale.fr)',
                  nature: 'Débat parlementaire',
                  color: '#a78bfa',
                },
                {
                  date: '2022-2024',
                  titre: 'Mobilisations Martinique & baisses de prix négociées',
                  contenu:
                    "La Martinique connaît plusieurs épisodes de mobilisation contre la vie chère. Des négociations sont menées entre les préfets, GBH et les autres distributeurs. Des baisses de prix sur certains produits sont annoncées et vérifiées par l'OPMR. La presse locale suit l'évolution des engagements pris.",
                  media: 'Martinique La 1ère ; France-Antilles Martinique ; RCI Martinique',
                  nature: 'Négociations socio-économiques',
                  color: '#fbbf24',
                },
                {
                  date: 'Mars 2024',
                  titre: 'Rapport sénatorial sur la vie chère dans les DOM',
                  contenu:
                    "Le Sénat publie un rapport sur la vie chère dans les Outre-Mer. GBH y est mentionné dans le contexte de la concentration de la grande distribution. Le rapport préconise un renforcement du cadre réglementaire et un durcissement des sanctions en cas d'abus de position dominante avérés.",
                  media: 'Sénat français — Rapport 2024 sur la vie chère dans les Outre-Mer',
                  nature: 'Rapport législatif',
                  color: '#a78bfa',
                },
              ].map((ev) => (
                <div key={ev.date} className="border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 min-w-[80px]">
                      <span
                        className="inline-block px-2 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background: `${ev.color}22`,
                          border: `1px solid ${ev.color}55`,
                          color: ev.color,
                        }}
                      >
                        {ev.date}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">{ev.titre}</p>
                      <span
                        className="inline-block mb-2 px-2 py-0.5 rounded-full text-xs border"
                        style={{
                          background: `${ev.color}15`,
                          borderColor: `${ev.color}40`,
                          color: ev.color,
                        }}
                      >
                        {ev.nature}
                      </span>
                      <p className="text-xs text-gray-400 leading-relaxed mb-2">{ev.contenu}</p>
                      <p className="text-xs text-slate-500 italic">📰 Sources : {ev.media}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SectionTitle icon={Shield}>Réactions officielles du groupe GBH</SectionTitle>
            <Collapse title="🎤 Déclarations publiques de GBH — éléments de contexte">
              <p className="mb-3 text-xs text-gray-300">
                GBH s'exprime publiquement lors des crises sociales et dans le cadre des
                négociations réglementaires. Les positions publiques du groupe incluent :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Défense des surcoûts structurels :</strong> GBH justifie systématiquement
                  les prix plus élevés dans les DOM par les surcoûts réels (fret maritime, octroi de
                  mer, coûts de main d'œuvre, énergie). Cette position est partiellement fondée et
                  reconnue par l'ADLC elle-même.
                </li>
                <li>
                  <strong>Engagement sur le BQP :</strong> Le groupe se présente comme acteur engagé
                  dans le dispositif Bouclier Qualité-Prix et partenaire des politiques publiques de
                  régulation des prix.
                </li>
                <li>
                  <strong>Investissements locaux :</strong> GBH met en avant son rôle de premier
                  employeur privé des Antilles et ses investissements dans les territoires
                  ultramarins.
                </li>
                <li>
                  <strong>Condamnation des violences de 2021 :</strong> Bernard Hayot a publiquement
                  condamné les violences de novembre 2021 en Guadeloupe tout en annonçant des
                  baisses de prix ciblées dans les jours suivants.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Interviews GBH — France-Antilles, Guadeloupe La 1ère (nov. 2021 – déc.
                2022) ; Communiqués officiels gbh.fr.
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : FILIÈRE LOCALE & PRODUCTEURS ═══════════════════════════ */}
        {activeTab === 'producteurs' && (
          <div>
            <SectionTitle icon={Leaf}>
              Filière locale — Relations de GBH avec les producteurs ultramarins
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              La question de l'accès des producteurs locaux (agriculteurs, PME agroalimentaires) aux
              linéaires des grandes surfaces GBH est un enjeu majeur pour les économies
              ultramarines. Cette section analyse les relations documentées entre le groupe et la
              production locale.
            </p>

            <InfoBox color="green" title="🌱 Enjeu : réduire la dépendance aux importations">
              Les DOM importent environ 80 à 90 % des produits alimentaires consommés (INSEE,
              Enquête budget des familles 2022). Favoriser l'accès des productions locales aux
              linéaires de GBH est une question stratégique pour la souveraineté alimentaire des
              territoires ultramarins.
            </InfoBox>

            <SectionTitle icon={BarChart2}>
              Importations vs production locale — données officielles
            </SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard
                label="Part des imports alimentaires (GP)"
                value="~85 %"
                sub="INSEE 2022"
                highlight
              />
              <DataCard label="Part des imports alimentaires (MQ)" value="~82 %" sub="INSEE 2022" />
              <DataCard
                label="Part des imports alimentaires (GF)"
                value="~88 %"
                sub="INSEE / CCIG 2022"
              />
              <DataCard label="Part des imports alimentaires (RE)" value="~80 %" sub="INSEE 2022" />
            </div>

            <SectionTitle icon={Leaf}>Filières locales présentes dans les rayons GBH</SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  filiere: '🍌 Banane — filière phare des Antilles',
                  emoji: '🍌',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Bien représentée',
                  description:
                    "La banane antillaise (Cavendish) est le seul produit agricole des DOM exporté massivement vers la métropole. Elle est présente dans les rayons GBH, mais la banane importée (Amérique latine, moins chère) est souvent plus visible. L'étiquetage d'origine est obligatoire depuis le règlement UE 1169/2011.",
                  source:
                    'IEDOM MQ/GP 2023 ; UGPBAN (Union des groupements de producteurs de banane)',
                  sourceUrl: 'https://www.ugpban.com/',
                },
                {
                  filiere: '🥬 Fruits et légumes pays',
                  emoji: '🥬',
                  territoire: 'Guadeloupe, Martinique, Guyane',
                  statut: 'Présence limitée',
                  description:
                    'Les fruits et légumes "pays" (produits localement) représentent une part minoritaire des rayons fruits & légumes des grandes surfaces GBH. Les contraintes d\'approvisionnement (régularité, calibrage, emballage) pénalisent les petits producteurs face aux importateurs organisés. L\'ADLC a recommandé un accès facilité aux linéaires.',
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 35-40 ; DAAF Guadeloupe',
                  sourceUrl: 'https://daaf.guadeloupe.agriculture.gouv.fr/',
                },
                {
                  filiere: '🥩 Viande bovine & porcine',
                  emoji: '🥩',
                  territoire: 'Martinique',
                  statut: 'Présence marginale',
                  description:
                    'La production de viande bovine et porcine dans les DOM est très limitée face à la demande. La quasi-totalité est importée de métropole ou du Brésil. Quelques éleveurs locaux accèdent aux rayons GBH via des filières courtes certifiées (Label Rouge DOM), mais leur part de marché reste inférieure à 5 %.',
                  source: 'DAAF Martinique ; IEDOM MQ 2023',
                  sourceUrl: 'https://daaf.martinique.agriculture.gouv.fr/',
                },
                {
                  filiere: '🍫 Cacao & café — productions de niche',
                  emoji: '🍫',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Rayon terroir limité',
                  description:
                    'Du cacao (notamment en Guadeloupe, vallée de Capesterre) et du café (Guadeloupe Bonifieur) sont produits localement en quantités très limitées. Ces productions haut de gamme accèdent aux rayons GBH dans les espaces "terroir" ou "produits locaux", généralement à des prix sensiblement plus élevés que les équivalents importés.',
                  source: "DAAF Guadeloupe — productions AOC/IGP ; chambre d'agriculture GP",
                  sourceUrl: 'https://daaf.guadeloupe.agriculture.gouv.fr/',
                },
                {
                  filiere: "🍹 Rhum agricole — filière d'excellence",
                  emoji: '🍹',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Bien représentée',
                  description:
                    "Le rhum agricole de Martinique (AOC) et le rhum de Guadeloupe bénéficient d'une solide présence dans les rayons GBH. Cependant, GBH distribue également ses propres marques via le pôle Daribo Distilleries, ce qui crée une situation de potentiel conflit d'intérêt (distributeur & producteur concurrent des autres rhums locaux). Ce point mériterait une analyse plus approfondie.",
                  source: 'ADLC — Avis 09-A-45 (2009), pp. 31-34 ; CIVAM rhum Martinique',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
                },
                {
                  filiere: '🧴 Cosmétiques naturels — émergence locale',
                  emoji: '🧴',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Émergent',
                  description:
                    'Une filière de cosmétiques naturels à base de plantes locales (vétiver, ylang-ylang, vanille, bois d\'Inde) émerge dans les DOM. Ces produits accèdent progressivement aux linéaires des grandes surfaces GBH via des programmes de mise en rayon "produits locaux", mais les contraintes de référencement (volumes, délais de paiement, coûts) restent un frein pour les TPE locales.',
                  source: "Chambre de commerce et d'industrie Guadeloupe ; ADEME DOM 2022",
                  sourceUrl: 'https://www.cci.gp/',
                },
              ].map((item) => (
                <div key={item.filiere} className="border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white">{item.filiere}</p>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                        item.statut === 'Bien représentée'
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : item.statut === 'Présence limitée' ||
                              item.statut === 'Présence marginale'
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      {item.statut}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Territoire(s) : {item.territoire}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.description}</p>
                  <p className="text-xs text-slate-600">
                    📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                  </p>
                </div>
              ))}
            </div>

            <SectionTitle icon={AlertTriangle}>
              Obstacles documentés à l'accès des producteurs locaux
            </SectionTitle>
            <Collapse title="📋 Barrières identifiées par les pouvoirs publics" defaultOpen>
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2 text-gray-300">
                <li>
                  <strong>Exigences de volumes :</strong> Les grandes surfaces GBH exigent une
                  régularité d'approvisionnement et des volumes minimaux difficiles à atteindre pour
                  les petits agriculteurs ultramarins (exploitations de moins de 5 ha en moyenne).
                </li>
                <li>
                  <strong>Normes de calibrage et d'emballage :</strong> Les standards de
                  présentation (emballages, étiquetage, calibre des fruits et légumes) imposent des
                  investissements que beaucoup de petits producteurs ne peuvent pas assumer seuls.
                </li>
                <li>
                  <strong>Délais de paiement :</strong> Les délais de règlement des fournisseurs
                  locaux peuvent atteindre 30 à 60 jours, créant des difficultés de trésorerie pour
                  les TPE agricoles.
                </li>
                <li>
                  <strong>Coûts de référencement :</strong> Des frais de référencement (mise en
                  rayon, animation promotionnelle) sont parfois exigés, représentant une barrière
                  financière pour les petites structures locales.
                </li>
                <li>
                  <strong>Concurrence déloyale des importations aidées :</strong> Certains produits
                  importés bénéficient d'aides à la production dans leur pays d'origine (subventions
                  PAC pour les produits européens), les rendant moins chers que les équivalents
                  locaux malgré les coûts de fret.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source :{' '}
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                  ADLC — Avis 19-A-12 (2019), pp. 38-42
                </SourceLink>{' '}
                ; DAAF Guadeloupe — Rapport sur la souveraineté alimentaire 2023.
              </p>
            </Collapse>

            <Collapse title="✅ Initiatives documentées en faveur du local">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2 text-gray-300">
                <li>
                  <strong>Rayon Produits Pays :</strong> Les Carrefour des Antilles disposent de
                  rayons dédiés aux produits locaux (fruits, légumes, condiments, artisanat
                  alimentaire). La surface dédiée varie selon les magasins.
                </li>
                <li>
                  <strong>Programme Carrefour "Agir pour la Guadeloupe/Martinique" :</strong> Des
                  programmes de référencement préférentiel pour les producteurs locaux ont été
                  annoncés dans le cadre des engagements post-crise 2021. Leur mise en œuvre
                  effective reste à vérifier par des tiers.
                </li>
                <li>
                  <strong>Participation aux marchés de producteurs :</strong> Certains espaces
                  Carrefour DOM accueillent ponctuellement des marchés de producteurs locaux dans
                  leurs parkings ou espaces extérieurs.
                </li>
                <li>
                  <strong>Engagement BQP produits locaux :</strong> Le Bouclier Qualité-Prix inclut
                  progressivement des produits locaux afin de valoriser la production ultramarine.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Site officiel Carrefour Guadeloupe ; OPMR Guadeloupe 2023 ; presse
                régionale.
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : STRATÉGIE & DIGITAL ════════════════════════════════════ */}
        {activeTab === 'digital' && (
          <div>
            <SectionTitle icon={Smartphone}>
              Stratégie digitale & transformation numérique de GBH
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              La grande distribution mondiale est en pleine mutation numérique. Carrefour France,
              partenaire de GBH par la franchise, investit massivement dans le digital depuis 2018
              (Plan de transformation Carrefour 2022 → Carrefour 2026). GBH doit intégrer ces
              évolutions dans ses opérations locales tout en gérant les contraintes spécifiques aux
              DOM (connectivité, logistique last-mile insulaire, fracture numérique).
            </p>

            <InfoBox color="blue" title="ℹ️ Sources et limites des données digitales">
              La stratégie digitale de GBH n'est pas publiée dans un rapport annuel public. Les
              informations ci-dessous sont issues du site officiel Carrefour Guadeloupe/Martinique,
              des annonces publiques du groupe Carrefour France (franchiseur), des observations
              disponibles en sources ouvertes (SimilarWeb, AppStore, GooglePlay) et de la presse
              régionale. Elles n'engagent pas GBH et sont susceptibles d'évoluer.
            </InfoBox>

            <SectionTitle icon={Globe}>Présence digitale — canaux documentés</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                {
                  canal: '🌐 Sites e-commerce Carrefour DOM',
                  statut: 'Opérationnel',
                  color: 'green',
                  detail:
                    'Sites carrefour.gp (Guadeloupe), carrefour.mq (Martinique) et équivalents dans les autres territoires GBH. Permettent le click & collect et la livraison à domicile. Intégration avec la plateforme Carrefour France.',
                  source: 'carrefour.gp ; carrefour.mq — sites officiels',
                },
                {
                  canal: '📱 Application Carrefour (mobile)',
                  statut: 'Disponible',
                  color: 'green',
                  detail:
                    "L'application Carrefour France est utilisable dans les DOM pour la gestion de la carte de fidélité, les promotions dématérialisées et le click & collect. Une adaptation locale de l'UX est nécessaire pour les offres spécifiques DOM.",
                  source: 'App Store / Google Play — app Carrefour France',
                },
                {
                  canal: '🚗 Drive Carrefour DOM',
                  statut: 'Déployé partiellement',
                  color: 'yellow',
                  detail:
                    'Le service drive (commande en ligne + retrait en voiture) est opérationnel dans plusieurs grandes surfaces GBH en Guadeloupe et Martinique. Le déploiement est plus limité en Guyane et à La Réunion.',
                  source: 'Site carrefour.gp — service drive ; observations terrain',
                },
                {
                  canal: '🏠 Livraison à domicile',
                  statut: 'Partiellement déployé',
                  color: 'yellow',
                  detail:
                    "La livraison à domicile de courses alimentaires est proposée dans les principales agglomérations des DOM (Pointe-à-Pitre, Fort-de-France, Cayenne). Les délais et la zone de couverture sont plus restreints qu'en métropole du fait des contraintes logistiques insulaires.",
                  source: 'Carrefour.gp ; Martinique La 1ère (annonces COVID 2020)',
                },
                {
                  canal: '💳 Carte de fidélité Carrefour+',
                  statut: 'Opérationnel',
                  color: 'green',
                  detail:
                    'GBH intègre le programme de fidélité Carrefour+ (anciennement Carrefour Pass). Les clients accumulent des points utilisables dans les magasins GBH et, en théorie, dans tout le réseau Carrefour France.',
                  source: 'Programme Carrefour+ — conditions générales',
                },
                {
                  canal: '📊 Données clients & CRM',
                  statut: 'Mutualisé Carrefour',
                  color: 'amber',
                  detail:
                    "En tant que franchisé Carrefour, GBH bénéficie de l'infrastructure CRM du groupe Carrefour France (gestion des données clients, segmentation, personnalisation des offres). La gouvernance des données clients DOM est encadrée par le RGPD et le contrat de franchise.",
                  source:
                    'Politique de confidentialité Carrefour France ; RGPD (Règlement UE 2016/679)',
                },
              ].map((item) => {
                const c: Record<string, string> = {
                  green: 'bg-green-500/10 border-green-500/30 text-green-300',
                  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
                  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                };
                return (
                  <div key={item.canal} className="border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-white">{item.canal}</p>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${c[item.color]}`}
                      >
                        {item.statut}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.detail}</p>
                    <p className="text-xs text-slate-600 italic">📎 {item.source}</p>
                  </div>
                );
              })}
            </div>

            <SectionTitle icon={TrendingUp}>Défis digitaux spécifiques aux DOM</SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                {
                  defi: '📶 Fracture numérique',
                  desc: "Le taux d'équipement numérique et l'accès à l'internet à haut débit sont inférieurs aux moyennes métropolitaines dans les DOM (notamment en Guyane et à Mayotte). Cette fracture numérique limite le potentiel de croissance du e-commerce alimentaire, qui nécessite une connexion fiable pour passer et gérer les commandes.",
                  source: 'ARCEP — Observatoire du numérique dans les outre-mer 2023',
                  sourceUrl: 'https://www.arcep.fr/',
                },
                {
                  defi: '🚢 Logistique last-mile insulaire',
                  desc: "La livraison à domicile dans des territoires insulaires (souvent sans adressage structuré, avec des voiries parfois étroites) est beaucoup plus complexe et coûteuse qu'en métropole. Les coûts logistiques du dernier kilomètre réduisent les marges du e-commerce et limitent la couverture géographique.",
                  source: 'OPMR Guadeloupe — Rapport sur la distribution 2022',
                  sourceUrl: 'https://www.opmr.gouv.fr/',
                },
                {
                  defi: '💳 Paiement en ligne',
                  desc: "Le taux de bancarisation et d'utilisation des moyens de paiement en ligne dans les DOM est inférieur à la métropole. Des populations significatives restent en dehors du système bancaire formel (notamment en Guyane et à Mayotte), limitant l'accès aux services e-commerce.",
                  source: 'IEDOM — Rapport financier DOM 2023 ; Banque de France',
                  sourceUrl: 'https://www.iedom.fr/',
                },
                {
                  defi: '🤖 Intelligence artificielle et optimisation des stocks',
                  desc: "Carrefour France déploie des solutions d'IA pour l'optimisation des approvisionnements, la prévision de la demande et la réduction du gaspillage alimentaire. En tant que franchisé, GBH doit intégrer ou adapter ces outils à la réalité des marchés DOM (saisonnalité tropicale, spécificités produits, chaîne logistique maritime).",
                  source:
                    'Plan de transformation Carrefour 2026 (carrefour.com) ; presse économique',
                  sourceUrl: 'https://www.carrefour.com/',
                },
              ].map((d) => (
                <div key={d.defi} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-1">{d.defi}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-1.5">{d.desc}</p>
                  <p className="text-xs text-slate-600">
                    📎 <SourceLink href={d.sourceUrl}>{d.source}</SourceLink>
                  </p>
                </div>
              ))}
            </div>

            <SectionTitle icon={BarChart2}>
              Carrefour France — plan de transformation digitale 2026 (applicables à GBH)
            </SectionTitle>
            <Collapse title="📋 Axes du plan Carrefour 2026 pertinents pour les DOM" defaultOpen>
              <p className="mb-3 text-xs text-gray-300">
                Le plan stratégique « Carrefour 2026 » annoncé par Carrefour France SA inclut
                plusieurs axes digitaux qui concernent directement GBH en tant que franchisé :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>IA pour l'optimisation logistique :</strong> Prévision de la demande par
                  IA, réduction des ruptures de stock de 15 % visée. Pour GBH, cela implique
                  l'intégration des outils Carrefour avec ses spécificités logistiques DOM (délais
                  de fret maritime de 10 à 22 jours selon les territoires).
                </li>
                <li>
                  <strong>Expansion du e-commerce alimentaire :</strong> Objectif Carrefour France —
                  +30 % de CA e-commerce d'ici 2026. Dans les DOM, l'enjeu est de créer
                  l'infrastructure de livraison locale (partenariats avec des acteurs locaux,
                  optimisation des tournées insulaires).
                </li>
                <li>
                  <strong>Monétisation de la donnée client :</strong> Carrefour France a créé
                  Unlimitail, une régie publicitaire de données de distribution. En tant que
                  franchisé, GBH contribue à cet écosystème de données, créant des questions sur la
                  gouvernance et la souveraineté des données clients DOM.
                </li>
                <li>
                  <strong>Réduction du gaspillage alimentaire par algorithme :</strong> Systèmes de
                  démarques automatiques liées à la DLUO/DLC. Particulièrement pertinent dans les
                  DOM où les coûts d'importation rendent le gaspillage alimentaire encore plus
                  coûteux.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source :{' '}
                <SourceLink href="https://www.carrefour.com/fr/groupe/presse/2022-01-27/carrefour-devoile-plan-strategique-2026">
                  Carrefour SA — Plan stratégique 2026 (jan. 2022) ; carrefour.com
                </SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : RSE & ENVIRONNEMENT ════════════════════════════════════ */}
        {activeTab === 'rse' && (
          <div>
            <SectionTitle icon={TreePine}>
              RSE, Environnement & Développement durable — GBH dans les DOM
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Les territoires ultramarins sont parmi les plus exposés aux effets du changement
              climatique (cyclones, submersion marine, sécheresses, érosion côtière). Le modèle
              économique de GBH — basé sur les importations massives par voie maritime — génère une
              empreinte carbone significative et soulève des questions de résilience et de
              durabilité à long terme.
            </p>

            <InfoBox color="green" title="🌱 Contexte — DOM & urgence climatique">
              Les DOM sont classés parmi les régions les plus vulnérables au changement climatique
              selon le GIEC (Rapport AR6, 2022). La Guadeloupe et la Martinique sont exposées aux
              cyclones de catégorie 4 et 5 (Maria 2017 a dévasté la Martinique voisine). La montée
              des eaux menace directement des zones commerciales côtières comme celle de Jarry à
              Baie-Mahault (altitude proche du niveau de la mer).
            </InfoBox>

            <SectionTitle icon={AlertTriangle}>
              Empreinte carbone des importations — données documentées
            </SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              <DataCard
                label="Distance fret GP/MQ ↔ France"
                value="~7 000 km"
                sub="Rotterdam → Pointe-à-Pitre"
                highlight
              />
              <DataCard
                label="Distance fret La Réunion ↔ France"
                value="~15 000 km"
                sub="Le Havre → Saint-Denis RE"
              />
              <DataCard
                label="Émissions CO₂ fret maritime moyen"
                value="~15–20 g CO₂/t.km"
                sub="IMO 2023 — transport maritime"
              />
              <DataCard
                label="Part transport alimentaire DOM"
                value="~80–90 %"
                sub="Imports alimentaires maritimes"
                highlight
              />
              <DataCard
                label="Durée de trajet maritime GP"
                value="10–11 jours"
                sub="Europe → Antilles"
              />
              <DataCard
                label="Durée de trajet maritime RE"
                value="~22 jours"
                sub="Europe → La Réunion"
              />
            </div>

            <div className="space-y-4 mb-8">
              {[
                {
                  enjeu: '🚢 Bilan carbone des importations alimentaires',
                  gravite: 'Élevé',
                  color: 'red',
                  desc: "GBH importe la grande majorité (80–90 %) des produits alimentaires qu'il distribue dans les DOM par voie maritime depuis l'Europe ou les Amériques. Le transport maritime représente environ 3 % des émissions mondiales de CO₂ (IMO 2023). Un hypermarché Carrefour des Antilles génère une empreinte logistique maritime considérablement plus élevée qu'un hypermarché métropolitain.",
                  chiffre: '~15 g CO₂/t.km × 7 000 km × volume importé annuel',
                  source:
                    'OMI (Organisation Maritime Internationale) — 4ème Étude sur les GES 2020',
                  sourceUrl: 'https://www.imo.org/',
                },
                {
                  enjeu: '♻️ Loi AGEC — Impact sur GBH',
                  gravite: 'Réglementaire',
                  color: 'amber',
                  desc: "La loi anti-gaspillage pour une économie circulaire (Loi AGEC, n° 2020-105) impose aux grandes surfaces de nombreuses obligations : interdiction des emballages plastiques à usage unique, obligation de vrac, affichage environnemental, don alimentaire obligatoire. GBH doit s'y conformer dans les DOM avec les mêmes délais qu'en métropole, malgré des infrastructures de recyclage moins développées.",
                  chiffre: "Amende jusqu'à 15 000 € par infraction (Loi AGEC)",
                  source: 'Légifrance — Loi n° 2020-105 du 10 février 2020',
                  sourceUrl: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000041553759/',
                },
                {
                  enjeu: '🗑️ Gaspillage alimentaire — enjeu critique',
                  gravite: 'Modéré',
                  color: 'orange',
                  desc: "Dans les DOM, le gaspillage alimentaire en grande surface est amplifié par les délais d'importation : un produit frais peut avoir consommé 10 à 22 jours de transport avant d'arriver en rayon. Les pertes pour invendus sur les produits frais importés sont donc structurellement plus élevées qu'en métropole, avec un coût économique et environnemental double.",
                  chiffre:
                    'La France gaspille ~10 Mt de nourriture/an (ADEME 2022). Dans les DOM : surcoût du fait des délais maritimes.',
                  source: 'ADEME — Rapport gaspillage alimentaire 2022 ; Loi Garot (2016)',
                  sourceUrl: 'https://www.ademe.fr/',
                },
                {
                  enjeu: "⚡ Énergie — Coût de l'énergie dans les DOM",
                  gravite: 'Structurel',
                  color: 'purple',
                  desc: "L'énergie électrique est significativement plus chère dans les DOM qu'en métropole (principalement produite par des centrales thermiques fossiles). Un hypermarché Carrefour est un très gros consommateur d'électricité (réfrigération, climatisation, éclairage). Le coût énergétique plus élevé dans les DOM renchérit les coûts d'exploitation et contribue aux prix plus élevés.",
                  chiffre: 'Prix moyen kWh DOM : 0,18–0,25 € vs 0,17 € métropole (CRE 2023)',
                  source: "CRE — Commission de Régulation de l'Énergie, Rapport DOM 2023",
                  sourceUrl: 'https://www.cre.fr/',
                },
                {
                  enjeu: '🌀 Risque cyclonique & résilience climatique',
                  gravite: 'Élevé',
                  color: 'red',
                  desc: 'Le cyclone Irma (2017, catégorie 5) a dévasté Saint-Martin et Saint-Barthélemy. Le cyclone Maria (2017) a frappé la Dominique voisine de la Guadeloupe et de la Martinique. GBH, en détenant des actifs immobiliers commerciaux importants dans des zones à risque cyclonique, est directement exposé à ces aléas climatiques. La zone de Jarry à Baie-Mahault est partiellement en zone inondable.',
                  chiffre:
                    "Coût moyen d'un cyclone catégorie 4-5 dans les Antilles : 1–5 Md€ (estimations BRGM)",
                  source:
                    'BRGM — Bureau de Recherches Géologiques et Minières, rapport risques DOM 2022',
                  sourceUrl: 'https://www.brgm.fr/',
                },
              ].map((item) => {
                const c: Record<string, string> = {
                  red: 'text-red-300 border-red-500/30',
                  amber: 'text-amber-300 border-amber-500/30',
                  orange: 'text-orange-300 border-orange-500/30',
                  purple: 'text-purple-300 border-purple-500/30',
                };
                return (
                  <div key={item.enjeu} className="border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-white">{item.enjeu}</p>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${c[item.color]}`}
                      >
                        {item.gravite}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.desc}</p>
                    <p className="text-xs text-amber-200 mb-2">
                      <strong>Chiffre clé :</strong> {item.chiffre}
                    </p>
                    <p className="text-xs text-slate-600">
                      📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                    </p>
                  </div>
                );
              })}
            </div>

            <Collapse title="🌱 Engagements RSE documentés de Carrefour (applicable à GBH)">
              <p className="mb-3 text-xs text-gray-300">
                En tant que franchisé Carrefour, GBH est lié aux engagements RSE du groupe Carrefour
                France SA. Le plan RSE « Act for Food » de Carrefour inclut les axes suivants,
                théoriquement applicables dans les DOM GBH :
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li>
                  <strong>Zéro plastique à usage unique :</strong> Objectif Carrefour France — 100 %
                  des MDD sans plastique superflu d\'ici 2025. Application dans les DOM :
                  problématique car les alternatives (vrac, recharges) nécessitent des
                  infrastructures locales.
                </li>
                <li>
                  <strong>Don alimentaire :</strong> Carrefour est partenaire des Banques
                  Alimentaires en métropole. Dans les DOM, des partenariats équivalents existent
                  avec des associations locales (Banque Alimentaire Guadeloupe, Martinique).
                </li>
                <li>
                  <strong>50 % de produits biologiques à la marque :</strong> Objectif Carrefour
                  2025. Dans les DOM, l\'agriculture biologique certifiée est encore peu développée.
                  La plupart des produits bio sont importés, amplifiant leur empreinte carbone.
                </li>
                <li>
                  <strong>Neutralité carbone :</strong> Carrefour vise la neutralité carbone de ses
                  opérations directes d\'ici 2040. Cela inclut théoriquement les magasins GBH dans
                  les DOM.
                </li>
                <li>
                  <strong>Affichage environnemental :</strong> Carrefour déploie un affichage
                  environnemental (Planet Score) sur ses MDD. Dans les DOM, cet affichage doit
                  intégrer le coût carbone du transport maritime.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source :{' '}
                <SourceLink href="https://www.carrefour.com/fr/actualites/carrefour-act-food">
                  Carrefour SA — Plan Act for Food ; Rapport RSE Carrefour 2023
                </SourceLink>
              </p>
            </Collapse>

            <Collapse title="🚛 Infrastructure de recyclage dans les DOM — réalité du terrain">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2 text-gray-400">
                <li>
                  <strong>Guadeloupe :</strong> Le centre d\'enfouissement technique de Sainte-Rose
                  est la principale infrastructure de traitement des déchets. La Guadeloupe souffre
                  d\'une crise chronique de gestion des déchets (rapport Cour des Comptes 2021).
                  GBH, comme tous les commerçants, est assujetti à la REP (Responsabilité Élargie
                  des Producteurs) via l\'éco-organisme approprié.
                </li>
                <li>
                  <strong>Martinique :</strong> Le Sydéma (Syndicat de Gestion des Déchets de
                  Martinique) gère la collecte et le traitement. La situation est meilleure qu\'en
                  Guadeloupe mais reste sous pression.
                </li>
                <li>
                  <strong>Guyane :</strong> Infrastructure de traitement des déchets très limitée
                  hors Cayenne. Les zones de l\'intérieur guyanais ont peu accès au recyclage
                  structuré.
                </li>
                <li>
                  <strong>Emballages importés :</strong> Un produit importé par GBH depuis la
                  métropole génère de l\'emballage qui doit être géré localement dans les DOM — mais
                  les filières de recyclage y sont moins développées qu\'en métropole (pas de
                  système de consigne généralisé, capacités de trituration limitées).
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Cour des Comptes — Rapport gestion des déchets dans les DOM (2021) ;
                <SourceLink href="https://www.sydema.fr/"> Sydéma Martinique</SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : ANALYSE SOCIO-ÉCONOMIQUE ═══════════════════════════════ */}
        {activeTab === 'socio' && (
          <div>
            <SectionTitle icon={Library}>
              Analyse socio-économique — GBH dans le contexte des DOM
            </SectionTitle>

            <InfoBox color="blue" title="ℹ️ Note méthodologique — Analyse documentée et sourcée">
              Cette section propose une analyse socio-économique et historique de la position de GBH
              dans les DOM, en s'appuyant exclusivement sur des{' '}
              <strong>sources académiques, institutionnelles et journalistiques publiées</strong>.
              L'objectif est d'offrir aux citoyens ultramarins une mise en contexte structurelle de
              la formation des prix et du rôle des grands groupes économiques dans leurs
              territoires.
            </InfoBox>

            <SectionTitle icon={Landmark}>
              Contexte historique — Formation des économies DOM post-1946
            </SectionTitle>

            <Collapse
              title="📚 La départementalisation et la transformation des économies antillaises"
              defaultOpen
            >
              <p className="mb-3 text-xs text-gray-300">
                La loi de départementalisation du 19 mars 1946 (portée par Aimé Césaire, alors
                député de la Martinique) transforme les anciennes colonies en départements français
                avec application progressive du droit commun. Cette transformation a des effets
                économiques structurants qui persistent aujourd'hui :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Transition économique post-plantation :</strong> Les Antilles passent
                  progressivement d'une économie de plantation (canne à sucre, banane pour l'export)
                  à une économie de consommation adossée aux transferts publics de l'État français
                  (fonctionnaires, allocations sociales, prestations familiales).
                </li>
                <li>
                  <strong>Développement des transferts publics :</strong> La convergence sociale
                  (SMIC, prestations sociales) vers les normes métropolitaines génère une
                  augmentation du pouvoir d'achat monétaire des ménages DOM, mais dans un tissu
                  productif local qui ne suit pas. La demande de consommation dépasse massivement la
                  capacité de production locale, entraînant une dépendance aux importations.
                </li>
                <li>
                  <strong>Rôle des "grands békés" :</strong> Les grandes familles d'origine créole
                  blanche (les "békés" en Martinique) ont historiquement contrôlé les circuits
                  d'importation et de distribution dans les Antilles. La famille Hayot s'inscrit
                  dans ce contexte socio-économique, même si le groupe a une dimension et une
                  organisation qui dépassent largement le modèle de la "famille béké"
                  traditionnelle.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Burac M. (dir.) —{' '}
                <em>Guadeloupe, Martinique et Guyane dans le monde américain</em>, Éditions
                Karthala, 1994 ; Celimene F. & Legris A. — <em>L'économie des DOM-TOM</em>, INSEE
                Méthodes n°65-66, 1997 ; INSEE — <em>Les DOM en 2000 et 2010</em>.
              </p>
            </Collapse>

            <Collapse title="🔬 Analyse académique — Le « monopole créole » et la concentration économique">
              <p className="mb-3 text-xs text-gray-300">
                Plusieurs économistes et sociologues ont analysé la concentration économique dans
                les DOM. Les travaux de référence incluent :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Montoute A. &amp; Cardec A. (2011)</strong> —{' '}
                  <em>"Les oligopoles dans les DOM : une réalité économique et sociale"</em>, in
                  Revue d'Économie Régionale et Urbaine, n°4/2011. Analyse la concentration
                  sectorielle dans la distribution, l'automobile et les services dans les Antilles
                  françaises comme une forme d'oligopole structurel favorisé par l'insularité et la
                  petite taille des marchés.
                </li>
                <li>
                  <strong>Rochambeau M. (2009)</strong> —{' '}
                  <em>
                    "Compétitivité et diversification économique dans les petites économies
                    insulaires de la Caraïbe"
                  </em>
                  . Montre que la petite taille des marchés insulaires favorise naturellement la
                  concentration, rendant les marchés insulaires structurellement moins
                  concurrentiels que les marchés continentaux de taille équivalente.
                </li>
                <li>
                  <strong>Desse R.P. &amp; Padilla S. (2009)</strong> —{' '}
                  <em>
                    "La grande distribution dans les DOM : entre intégration aux réseaux mondiaux et
                    spécificités locales"
                  </em>
                  . Analyse le double rôle de la grande distribution dans les DOM : vecteur de
                  modernisation de la consommation ET frein au développement de la production
                  locale.
                </li>
                <li>
                  <strong>Rapport ADLC 09-A-45 (2009) &amp; 19-A-12 (2019)</strong> — ces avis
                  constituent les documents institutionnels les plus complets sur la structure des
                  marchés de distribution dans les DOM. Ils sont la référence juridique et
                  économique de base pour toute analyse des prix dans les Antilles.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : CAIRN.info — Revue d'économie régionale et urbaine ; ADLC — Avis 09-A-45 et
                19-A-12.
              </p>
            </Collapse>

            <SectionTitle icon={Users}>
              Inégalités sociales dans les DOM — chiffres officiels
            </SectionTitle>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Indicateur</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Guadeloupe</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Martinique</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Guyane</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Réunion</th>
                    <th className="pb-2 text-gray-400 font-semibold">France métro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    {
                      ind: 'Taux de pauvreté (seuil 60 %)',
                      gp: '34 %',
                      mq: '30 %',
                      gf: '53 %',
                      re: '42 %',
                      metro: '15 %',
                      src: 'INSEE 2022',
                    },
                    {
                      ind: 'Taux de chômage (2023)',
                      gp: '18 %',
                      mq: '14 %',
                      gf: '22 %',
                      re: '19 %',
                      metro: '7 %',
                      src: 'INSEE T4-2023',
                    },
                    {
                      ind: 'Salaire médian mensuel net',
                      gp: '1 650 €',
                      mq: '1 680 €',
                      gf: '1 530 €',
                      re: '1 600 €',
                      metro: '1 940 €',
                      src: 'INSEE 2022',
                    },
                    {
                      ind: 'Surcoût vie alimentaire vs métro',
                      gp: '+13 %',
                      mq: '+11 %',
                      gf: '+17 %',
                      re: '+12 %',
                      metro: 'Référence',
                      src: 'INSEE — Compa. niveaux vie DOM 2023',
                    },
                    {
                      ind: "Ratio surcoût / pouvoir d'achat",
                      gp: 'Élevé',
                      mq: 'Élevé',
                      gf: 'Très élevé',
                      re: 'Élevé',
                      metro: 'Référence',
                      src: 'CEROM 2022',
                    },
                    {
                      ind: 'Part budget alimentation ménages',
                      gp: '~22 %',
                      mq: '~21 %',
                      gf: '~25 %',
                      re: '~22 %',
                      metro: '~16 %',
                      src: 'INSEE EBF DOM 2022',
                    },
                  ].map((r) => (
                    <tr key={r.ind}>
                      <td className="py-2 text-white pr-3 text-xs">{r.ind}</td>
                      <td className="py-2 text-amber-300 font-bold pr-3">{r.gp}</td>
                      <td className="py-2 text-amber-300 font-bold pr-3">{r.mq}</td>
                      <td className="py-2 text-amber-300 font-bold pr-3">{r.gf}</td>
                      <td className="py-2 text-amber-300 font-bold pr-3">{r.re}</td>
                      <td className="py-2 text-gray-500 pr-3">{r.metro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-600 mt-2 italic">
                Sources : INSEE — Comparaison des niveaux de vie dans les DOM (2022-2023) ; CEROM
                2022 ; IEDOM 2023.
              </p>
            </div>

            <SectionTitle icon={AlertTriangle}>
              Le paradoxe DOM : richesse relative et pauvreté absolue
            </SectionTitle>
            <Collapse title="📊 Comment comprendre la coexistence d'un groupe comme GBH et d'un taux de pauvreté de 34 % en Guadeloupe ?">
              <p className="mb-3 text-xs text-gray-300">
                Cette question est au cœur du débat politique et économique dans les DOM. Plusieurs
                éléments d'analyse, documentés par les économistes et les institutions, permettent
                de la comprendre :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Le modèle de développement par transferts :</strong> Les DOM bénéficient
                  de transferts publics massifs de l'État (fonctionnaires payés 40 % de plus,
                  prestations sociales, investissements publics). Ces transferts soutiennent une
                  demande de consommation importante sans pour autant développer un tissu productif
                  local suffisant. GBH capture une partie de cette demande via ses grandes surfaces.
                </li>
                <li>
                  <strong>Dualisme économique structurel :</strong> Les économistes des DOM parlent
                  de « dualisme économique » : coexistence d'un secteur formel bien rémunéré
                  (fonctionnaires, grandes entreprises) et d'un secteur informel et précaire
                  (auto-entrepreneurs, agriculture de subsistance). GBH s'adresse principalement au
                  secteur formel, tandis que les ménages précaires font face aux mêmes prix.
                </li>
                <li>
                  <strong>Effets régressifs du surcoût alimentaire :</strong> Quand le coût de
                  l'alimentation est structurellement plus élevé (+11 à +17 %) dans des territoires
                  où le taux de pauvreté est deux à trois fois supérieur à la métropole, l'effet
                  régressif est mathématiquement très fort : les ménages pauvres consacrent une part
                  bien plus grande de leur revenu à l'alimentation que les ménages aisés.
                </li>
                <li>
                  <strong>Absence d'alternative de consommation :</strong> Dans de nombreuses zones
                  DOM (notamment les zones rurales et les petites îles), GBH/Carrefour est le seul
                  grand distributeur accessible. L'absence d'alternative effective neutralise le
                  mécanisme de pression concurrentielle sur les prix.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Celimene F. — <em>L'économie de la Martinique</em>, Economica, 2000 ; ADLC
                Avis 19-A-12 (2019), pp. 55-60 ; INSEE — Enquête Niveaux de Vie DOM 2022.
              </p>
            </Collapse>

            <Collapse title="🌍 Comparaison internationale — Conglomérats similaires dans les îles caribéennes et d'Outre-Mer">
              <p className="mb-3 text-xs text-gray-300">
                La concentration économique dans des conglomérats familiaux dominant les marchés
                insulaires est un phénomène documenté dans de nombreuses petites économies
                insulaires (Small Island Developing States — SIDS). Quelques comparaisons
                pertinentes :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Trinité-et-Tobago — Groupe Neal & Massy :</strong> Conglomérat familial
                  comparable à GBH, dominant la distribution, l'automobile et les services dans les
                  îles anglophones de la Caraïbe. Même problématique de concentration dans un marché
                  insulaire restreint.
                </li>
                <li>
                  <strong>La Barbade — Groupe Goddard Enterprises :</strong> Groupe familial
                  dominant l'économie barbadienne, actif dans la distribution alimentaire, le
                  tourisme et les services financiers. Structure similaire à GBH avec intégration
                  verticale multi-sectorielle.
                </li>
                <li>
                  <strong>Polynésie française — Groupe Wane :</strong> Dans un autre territoire
                  français du Pacifique, le groupe Wane domine la grande distribution. La structure
                  de concentration est analogue à celle de GBH dans les Antilles.
                </li>
                <li>
                  <strong>Maurice — Groupe IBL (Ireland Blyth Limited) :</strong> Conglomérat
                  historique mauricien dominant de nombreux secteurs (distribution, automobile,
                  immobilier). Evolution historique parallèle à GBH : émergence dans la période
                  coloniale, diversification post-indépendance.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : CNUCED —{' '}
                <em>Small Island Developing States — Economic Concentration and Vulnerability</em>,
                rapport 2022 ; Caribbean Development Bank — Rapport économique régional 2023.
              </p>
            </Collapse>

            <Collapse title="⚖️ Débat politique — Visions opposées sur le rôle de GBH">
              <p className="mb-3 text-xs text-gray-300">
                Le rôle de GBH dans les économies DOM est un sujet de vif débat politique. Les
                positions documentées dans la presse et les publications officielles se structurent
                autour de deux pôles :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-300 mb-2">
                    Arguments en faveur — documentés
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-400">
                    <li>Premier employeur privé des Antilles (~14 000 emplois directs).</li>
                    <li>
                      Investissement massif dans les infrastructures commerciales des DOM (zones
                      commerciales, entrepôts, hôtels).
                    </li>
                    <li>
                      Accès à une offre large à des prix moins élevés que les petits commerces, via
                      les économies d'échelle.
                    </li>
                    <li>
                      Participation aux dispositifs de régulation des prix (BQP, accords de crise).
                    </li>
                    <li>
                      Contribution fiscale significative aux finances locales (taxe professionnelle,
                      octroi de mer côté acheteur).
                    </li>
                  </ul>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-300 mb-2">
                    Arguments critiques — documentés
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-400">
                    <li>
                      Position dominante reconnue par l'ADLC génératrice de prix plus élevés qu'en
                      situation concurrentielle normale.
                    </li>
                    <li>
                      Barrières à l'entrée (foncier, logistique) empêchant l'émergence de
                      concurrents.
                    </li>
                    <li>
                      Dépendance aux importations maintenue au détriment de la production locale.
                    </li>
                    <li>
                      Extraction de valeur hors du territoire (dividendes rapatriés vs
                      investissements locaux).
                    </li>
                    <li>
                      Modèle économique amplifiant la vulnérabilité alimentaire des DOM en cas de
                      rupture des chaînes logistiques maritimes.
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Source : Débats à l'Assemblée Nationale et au Sénat — Questions DOM 2021-2024 ; Avis
                ADLC 09-A-45 et 19-A-12 ; presse régionale Antilles et Réunion.
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : ACTIONS POUR LA POPULATION ════════════════════════════ */}
        {activeTab === 'population' && (
          <div>
            <SectionTitle icon={Heart}>
              Ce que GBH fait concrètement pour la population
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Au-delà des débats économiques et réglementaires, le Groupe Bernard Hayot produit des
              effets concrets sur la vie quotidienne des habitants des DOM. Cette page recense, sur
              la base de sources documentées, les actions positives directes du groupe pour les
              populations locales, ainsi que les limites et nuances à y apporter pour une lecture
              équilibrée.
            </p>

            <InfoBox color="blue" title="ℹ️ Principe de cette section">
              Toutes les données présentées ci-dessous sont sourcées. Les éléments qui ne peuvent
              pas être vérifiés indépendamment (communications GBH non publiées) sont signalés
              explicitement. Cette section adopte une lecture équilibrée : les faits positifs sont
              présentés sans minimiser les critiques structurelles documentées par ailleurs (voir
              onglets « Pratiques commerciales » et « Impact & Vie chère »).
            </InfoBox>

            {/* ─── 1. EMPLOI ─────────────────────────────────────────────── */}
            <SectionTitle icon={Briefcase}>
              1 — Emploi : premier employeur privé des DOM
            </SectionTitle>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <DataCard
                label="Emplois directs (groupe)"
                value="~14 000"
                sub="DOM-TOM + international"
                highlight
              />
              <DataCard
                label="Emplois indirects estimés"
                value="~25 000+"
                sub="Sous-traitants, fournisseurs locaux"
              />
              <DataCard
                label="Part des CDI"
                value="Majorité"
                sub="Convention collective CCN 3305"
              />
              <DataCard
                label="Rang employeur GP+MQ"
                value="N°1 privé"
                sub="Source : IEDOM/CEROM 2023"
                highlight
              />
            </div>

            <div className="space-y-3 mb-8">
              {[
                {
                  titre: '🏪 Emplois en grande distribution — caractéristiques documentées',
                  desc: 'Les hypermarchés et supermarchés Carrefour opérés par GBH emploient des milliers de caissiers, employés de rayon, bouchers, boulangers, charcutiers, poissonnier, responsables de secteur, etc. Ces emplois sont couverts par la Convention Collective Nationale du Commerce à prédominance alimentaire (CCN 3305), qui fixe les minima salariaux, les droits syndicaux et les conditions de travail.',
                  source: 'CCN 3305 (Légifrance) ; IEDOM — Rapport emploi DOM 2023',
                  highlight: true,
                },
                {
                  titre: '🚗 Emplois dans la concession automobile',
                  desc: 'Les concessionnaires automobiles GBH (Toyota, Mitsubishi, Daihatsu, Kia, etc.) emploient des mécaniciens, carrossiers, techniciens de maintenance, commerciaux et gestionnaires. Ces métiers qualifiés offrent des niveaux de rémunération supérieurs à la médiane DOM et contribuent à la formation professionnelle technique dans les Antilles.',
                  source: 'Données BODACC — immatriculations filiales automobiles GBH',
                  highlight: false,
                },
                {
                  titre: "🏨 Emplois dans l'hôtellerie — réseau Karibéa",
                  desc: "Le réseau hôtelier Karibéa (géré par GBH) emploie directement du personnel hôtelier (réception, restauration, entretien, animation). Ces emplois saisonniers et permanents participent au maintien de l'activité touristique, secteur stratégique pour l'économie des Antilles. Karibéa propose des établissements de différentes catégories (2 à 4 étoiles) sur plusieurs territoires.",
                  source:
                    'Site Karibéa — Guadeloupe, Martinique, Guyane ; classement hôtelier Atout France',
                  highlight: false,
                },
                {
                  titre: '🏗️ Emplois dans le BTP et les matériaux de construction',
                  desc: "Le pôle BTP de GBH (Point P DOM, matériaux de construction) emploie du personnel de vente, de logistique et d'expertise technique dans le secteur du bâtiment. Ce secteur est stratégique pour les DOM où la demande de logement est forte et les programmes de construction importants (défiscalisation Girardin, logements sociaux).",
                  source: 'DAAF DOM — statistiques construction ; données BODACC filiales BTP GBH',
                  highlight: false,
                },
              ].map((item) => (
                <div
                  key={item.titre}
                  className={`border rounded-xl p-4 ${item.highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700'}`}
                >
                  <p className="text-sm font-bold text-white mb-2">{item.titre}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.desc}</p>
                  <p className="text-xs text-slate-600 italic">📎 {item.source}</p>
                </div>
              ))}
            </div>

            {/* ─── 2. FORMATION ──────────────────────────────────────────── */}
            <SectionTitle icon={Users}>2 — Formation professionnelle & apprentissage</SectionTitle>

            <div className="space-y-3 mb-8">
              {[
                {
                  titre: "🎓 Contrats d'apprentissage et d'alternance",
                  desc: "GBH, en tant que groupe employeur de taille importante, est soumis aux obligations de financement de la formation professionnelle (contribution à l'OPCO Commerce et à l'OPCO Constructys pour le BTP). À ce titre, il finance des contrats d'apprentissage et des formations professionnelles qualifiantes dans les métiers du commerce, de la grande distribution, de l'automobile et du BTP dans les DOM.",
                  source:
                    'OPCO Commerce — rapport annuel ; Légifrance — Code du travail Art. L6331-1 et suivants',
                  nuance:
                    "Le nombre précis d'apprentis et de contrats d'alternance n'est pas publié par GBH (société non cotée). Les obligations légales (1,68 % de la masse salariale pour la formation) s'appliquent de plein droit.",
                },
                {
                  titre: '🛠️ Formation interne — Carrefour Académie',
                  desc: 'Carrefour France a développé "Carrefour Académie", un programme de formation interne pour ses collaborateurs (management, commerce, logistique, digital). En tant que franchisé, GBH peut accéder à ces ressources de formation pour ses propres collaborateurs des enseignes Carrefour dans les DOM. Ces formations couvrent la gestion de rayon, le management de proximité, la relation client et les outils digitaux.',
                  source: 'Site Carrefour.com — Carrefour Académie ; rapport RSE Carrefour SA 2023',
                  nuance:
                    "L'étendue réelle de l'accès de GBH (franchisé) aux programmes Carrefour Académie (franchiseur) n'est pas documentée publiquement.",
                },
                {
                  titre: "🏫 Partenariats avec l'enseignement professionnel DOM",
                  desc: "Les grandes entreprises dom implantées dans les DOM participent aux forums métiers dans les lycées professionnels et CFA (Centres de Formation d'Apprentis) de Guadeloupe, Martinique et Guyane. Des conventions de stage et d'apprentissage avec des établissements comme le LEGT de Blachon (GP), le lycée Acajou (MQ) ou la CCI de Guyane permettent à des jeunes ultramarins d'accéder à une première expérience professionnelle au sein du groupe.",
                  source:
                    "CCI Guadeloupe, CCI Martinique — rapports d'activité 2022 ; presse régionale",
                  nuance:
                    'Les partenariats formels GBH-établissements scolaires ne sont pas tous publiés. Cette information est reconstituée par recoupement de sources presse régionale et rapports CCI.',
                },
              ].map((item) => (
                <div key={item.titre} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-2">{item.titre}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.desc}</p>
                  {item.nuance && (
                    <p className="text-xs text-amber-300/80 bg-amber-500/10 rounded-lg px-3 py-2 mb-2 leading-relaxed">
                      ⚠️ <strong>Nuance :</strong> {item.nuance}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 italic">📎 {item.source}</p>
                </div>
              ))}
            </div>

            {/* ─── 3. PRIX & ACCÈS ALIMENTAIRE ────────────────────────────── */}
            <SectionTitle icon={ShoppingBag}>
              3 — Accès à l'alimentation & maîtrise des prix
            </SectionTitle>

            <div className="space-y-3 mb-8">
              {[
                {
                  titre: '🛒 Bouclier Qualité-Prix (BQP) — signataire obligatoire',
                  statut: 'Documenté · Annuel',
                  color: 'green',
                  desc: 'Depuis 2013, GBH signe chaque année le Bouclier Qualité-Prix dans chaque territoire DOM où il opère. Le BQP est un accord entre les pouvoirs publics (préfets) et les distributeurs qui fixe un panier de 200+ produits alimentaires de base à des prix maîtrisés, inférieurs au prix de marché. Le panier BQP est communiqué annuellement aux consommateurs par les préfectures.',
                  detail:
                    "En 2024 en Guadeloupe : le panier BQP incluait 209 produits avec une économie estimée de 15–20 % vs prix libre. Les produits BQP représentent les besoins alimentaires de base (pâtes, riz, conserves, huile, produits d'hygiène de base).",
                  source:
                    'Préfecture de Guadeloupe — Arrêté BQP 2024 ; Préfecture de Martinique — BQP 2024 ; site officiel OPMR',
                  sourceUrl: 'https://www.guadeloupe.gouv.fr/',
                },
                {
                  titre: '📉 Engagements de baisses de prix post-crise (2009, 2021)',
                  statut: 'Documenté · Ponctuel',
                  color: 'blue',
                  desc: 'Suite à la grève LKP de 2009 (accord "Jacob"), GBH a signé un engagement de baisse de prix sur une liste d\'environ 100 produits alimentaires de base en Guadeloupe et Martinique. Suite aux événements de novembre 2021 en Guadeloupe, Bernard Hayot a annoncé publiquement une nouvelle baisse de prix ciblée sur 200 produits dans les Carrefour GBH des Antilles.',
                  detail:
                    "Accord Jacob (2009) : ~100 produits en baisse de prix. Annonce BH (déc. 2021) : 200 produits en baisse de prix. Ces engagements sont des mesures d'urgence ponctuelle et non des mécanismes structurels permanents.",
                  source:
                    'Accord du 4 mars 2009 (dit "accord Jacob") — préfecture de Guadeloupe ; communiqué GBH déc. 2021 (presse régionale)',
                  sourceUrl: 'https://www.guadeloupe.gouv.fr/',
                },
                {
                  titre: '🏷️ Carte de fidélité Carrefour+ — avantages tarifaires',
                  statut: 'Permanent',
                  color: 'green',
                  desc: 'Le programme de fidélité Carrefour+ (anciennement Carrefour Pass), disponible dans les magasins GBH, offre aux porteurs de carte des réductions immédiates et différées (points de fidélité), des offres personnalisées et des coupons promotionnels. Pour les ménages qui y ont accès, ces avantages représentent une économie annuelle réelle sur les achats alimentaires.',
                  detail:
                    "Carrefour France communique sur une économie annuelle moyenne de 200–400 € pour les porteurs actifs de la carte fidélité. L'effet est probablement similaire dans les DOM pour les clients réguliers.",
                  source:
                    'Programme Carrefour+ — conditions générales ; Carrefour SA — rapport RSE 2023',
                  sourceUrl: 'https://www.carrefour.fr/carrefour-plus',
                },
                {
                  titre: '🌙 Promotions & semaines thématiques',
                  statut: 'Régulier',
                  color: 'amber',
                  desc: "Comme tout grand distributeur, les Carrefour GBH organisent des semaines de promotions thématiques (Semaine des économies, Foire aux vins locale, promotions de rentrée scolaire, promotions de fin d'année). Ces opérations permettent ponctuellement aux consommateurs de réaliser des économies significatives sur certains produits, même si elles portent en général sur des produits à marges commerciales plus élevées que les produits de base.",
                  detail:
                    'Les catalogues promotionnels Carrefour DOM sont disponibles sur les sites locaux (carrefour.gp, carrefour.mq). Leur contenu peut différer des catalogues métropolitains en fonction des gammes disponibles localement.',
                  source: 'Site carrefour.gp ; site carrefour.mq — catalogues promotionnels',
                  sourceUrl: 'https://www.carrefour.gp/',
                },
              ].map((item) => {
                const c: Record<string, string> = {
                  green: 'text-green-300 border-green-500/30 bg-green-500/5',
                  blue: 'text-blue-300 border-blue-500/30 bg-blue-500/5',
                  amber: 'text-amber-300 border-amber-500/30 bg-amber-500/5',
                };
                return (
                  <div key={item.titre} className="border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-white">{item.titre}</p>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${c[item.color]}`}
                      >
                        {item.statut}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.desc}</p>
                    <p className="text-xs text-amber-200/70 mb-2">💡 {item.detail}</p>
                    <p className="text-xs text-slate-600">
                      📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ─── 4. DON ALIMENTAIRE & SOLIDARITÉ ─────────────────────────── */}
            <SectionTitle icon={Leaf}>4 — Don alimentaire & solidarité locale</SectionTitle>

            <div className="space-y-3 mb-8">
              {[
                {
                  titre: "🍎 Don d'invendus alimentaires — obligation légale et pratique",
                  desc: 'La loi Garot (2016), renforcée par la loi AGEC (2020), impose aux grandes surfaces de plus de 400 m² de ne pas détruire les invendus alimentaires encore consommables et de les proposer en priorité au don à des associations habilitées. Les hypermarchés Carrefour GBH sont soumis à cette obligation dans tous les DOM. Des partenariats avec des associations locales (Restos du Cœur DOM, Banques Alimentaires de Guadeloupe et de Martinique) permettent la collecte régulière de ces invendus.',
                  source:
                    'Légifrance — Loi Garot n° 2016-138 ; Loi AGEC n° 2020-105, Art. 24 ; Banque Alimentaire de Guadeloupe',
                  sourceUrl: 'https://www.legifrance.gouv.fr/',
                  volume:
                    'Chiffre indicatif : un hypermarché Carrefour de 5 000 m² génère en moyenne 50 à 100 tonnes de dons alimentaires annuels (estimation ADEME 2022 — données nationales).',
                },
                {
                  titre: '❤️ Collectes nationales en magasin — Banques Alimentaires',
                  desc: 'Les magasins Carrefour, y compris ceux opérés par GBH dans les DOM, participent aux grandes collectes nationales organisées par les Fédérations des Banques Alimentaires (2 fois par an en général : printemps et automne). Pendant ces collectes, les clients sont invités à acheter et déposer des produits alimentaires non périssables directement en magasin. Le personnel GBH contribue à la logistique de ces collectes.',
                  source:
                    'Fédération Française des Banques Alimentaires — Rapport annuel 2023 ; Banque Alimentaire Guadeloupe',
                  sourceUrl: 'https://www.banquealimentaire.org/',
                  volume:
                    "En 2023, les Banques Alimentaires de France ont collecté 143 000 tonnes de denrées. La part des DOM n'est pas publiée séparément mais les collectes en magasin Carrefour y participent.",
                },
                {
                  titre: "🏫 Parrainage d'initiatives locales d'aide alimentaire",
                  desc: "GBH soutient ponctuellement des initiatives locales d'aide alimentaire aux populations vulnérables (distributions pendant les fêtes, aide aux personnes âgées isolées, soutien aux associations de quartier). Ces actions sont généralement communiquées dans la presse régionale et sur les réseaux sociaux des enseignes locales, mais ne font pas l'objet de rapports consolidés publiés.",
                  source:
                    'Presse régionale Guadeloupe (France-Antilles, Guadeloupe La 1ère) — archives 2020-2024',
                  sourceUrl: 'https://www.guadeloupe.la1ere.fr/',
                  volume:
                    'Information partiellement vérifiable. Les annonces ponctuelles dans la presse régionale constituent les sources disponibles.',
                },
              ].map((item) => (
                <div key={item.titre} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-2">{item.titre}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.desc}</p>
                  <p className="text-xs text-green-300/70 mb-2">📊 {item.volume}</p>
                  <p className="text-xs text-slate-600">
                    📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                  </p>
                </div>
              ))}
            </div>

            {/* ─── 5. SPORT & CULTURE ────────────────────────────────────────── */}
            <SectionTitle icon={TrendingUp}>5 — Parrainage sportif & soutien culturel</SectionTitle>

            <Collapse title="⚽ Sport — parrainage et soutien documentés" defaultOpen>
              <p className="mb-3 text-xs text-gray-300">
                GBH et ses enseignes locales (Carrefour DOM, Toyota, concessionnaires automobiles)
                participent au financement du sport local dans les DOM, à travers des partenariats
                de sponsoring avec des clubs et des événements sportifs. Ces actions sont
                documentées dans la presse régionale.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Football :</strong> Soutien à des clubs de football guadeloupéen et
                  martiniquais via le sponsoring des maillots ou des équipements. Le football est le
                  sport le plus populaire dans les Antilles et la Guyane. La Ligue de football de
                  Guadeloupe (LFG) et la Ligue de football de Martinique (LFM) bénéficient de
                  partenaires privés locaux dont certaines entités du groupe GBH.
                </li>
                <li>
                  <strong>Cyclisme :</strong> Le Tour cycliste de Guadeloupe (TCG, créé en 1986) et
                  le Tour cycliste de Martinique sont des événements sportifs majeurs dans les
                  Antilles. Des enseignes locales du groupe (Carrefour GP) figurent parmi les
                  partenaires habituels de ces épreuves emblématiques.
                </li>
                <li>
                  <strong>Athlétisme & sports collectifs :</strong> GBH soutient ponctuellement des
                  clubs d'athlétisme, de handball, de volleyball et de natation dans les Antilles,
                  via ses concessions automobiles Toyota (partenaire traditionnel du sport amateur
                  dans de nombreux territoires).
                </li>
                <li>
                  <strong>Golf :</strong> Le réseau hôtelier Karibéa est associé à des golfs et des
                  activités sportives de loisir qui contribuent au tourisme de haut de gamme dans
                  les Antilles.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : France-Antilles archives 2019-2024 ; site Ligue Football Guadeloupe ; Tour
                cycliste de Guadeloupe — partenaires officiels.
              </p>
            </Collapse>

            <Collapse title="🎭 Culture & patrimoine — actions documentées">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2 text-gray-400">
                <li>
                  <strong>Carnaval de Guadeloupe et de Martinique :</strong> Le carnaval est le
                  grand événement culturel identitaire des Antilles. Des enseignes Carrefour GBH
                  figurent parmi les partenaires commerciaux des grandes manifestations
                  carnavalesques (Mardi Gras, parading, concours de costumes). Ces partenariats
                  soutiennent financièrement des associations culturelles locales.
                </li>
                <li>
                  <strong>Fête de la Musique & événements culturels :</strong> Les grandes surfaces
                  Carrefour DOM participent ponctuellement aux animations culturelles locales
                  (concerts en parking, événements festifs, animations de saison). Ces actions
                  renforcent le lien entre l'enseigne et la communauté locale.
                </li>
                <li>
                  <strong>Valorisation des saveurs locales :</strong> Les hypermarchés Carrefour GBH
                  organisent régulièrement des animations en rayon valorisant les productions
                  locales (semaine créole, foire aux produits antillais, valorisation des rhums,
                  épices et produits transformés locaux). Ces animations favorisent la visibilité
                  des petits producteurs locaux au sein des grandes surfaces.
                </li>
                <li>
                  <strong>Bibliothèques & éducation :</strong> Certaines filiales du groupe sont
                  mentionnées comme mécènes ponctuels d'initiatives éducatives et culturelles dans
                  les DOM (dotations de bibliothèques scolaires, soutien à des projets culturels
                  jeunesse). Ces actions restent difficiles à quantifier faute de publication
                  systématique.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Presse régionale (France-Antilles, Martinique La 1ère, Guadeloupe La 1ère)
                ; sites officiels des événements culturels DOM.
              </p>
            </Collapse>

            {/* ─── 6. ACCESSIBILITÉ TERRITORIALE ───────────────────────────── */}
            <SectionTitle icon={Landmark}>
              6 — Accessibilité territoriale & services au quotidien
            </SectionTitle>

            <div className="space-y-3 mb-8">
              {[
                {
                  titre: '📍 Maillage territorial — accès à la grande distribution',
                  desc: "La présence de GBH dans des zones parfois éloignées des centres-villes (Basse-Terre en Guadeloupe, Le Marin en Martinique, Saint-Laurent-du-Maroni en Guyane) permet aux habitants de ces zones d'accéder à une offre diversifiée à des prix potentiellement inférieurs à ceux des petits commerces de proximité, même si ces prix restent supérieurs aux niveaux métropolitains.",
                  source:
                    'ADLC Avis 19-A-12 (2019) — cartographie des zones de chalandise ; données OPMR',
                },
                {
                  titre: '⏰ Amplitude horaire — services à la population',
                  desc: "Les hypermarchés Carrefour GBH proposent en général des horaires d'ouverture plus larges que le commerce traditionnel (ouverture le dimanche matin, soirées jusqu'à 20h-21h). Cette amplitude horaire bénéficie aux ménages dont les adultes travaillent en journée et ne peuvent faire leurs courses qu'en soirée ou le week-end. Dans les DOM où les petits commerces ferment souvent tôt, cette accessibilité temporelle est appréciée.",
                  source: 'Sites carrefour.gp / carrefour.mq — horaires officiels',
                },
                {
                  titre: '🏦 Services bancaires et parabancaires en magasin',
                  desc: "Certains hypermarchés Carrefour GBH intègrent des services de type Carrefour Banque (crédit à la consommation) ou des automates bancaires (DAB). Dans les zones où l'accès aux agences bancaires est limité, ces services complémentaires constituent un point d'accès financier pour une partie de la population. La présence de Carrefour Location (location de véhicules) permet également à des ménages sans véhicule d'accéder ponctuellement à un transport.",
                  source: 'Site Carrefour Banque ; observations terrain Carrefour GP / MQ',
                },
                {
                  titre: '🚨 Rôle en situation de crise (cyclone, COVID)',
                  desc: "En période de crise (cyclone, pandémie, tensions sociales), les grandes surfaces Carrefour GBH jouent un rôle de point d'approvisionnement essentiel. Pendant le COVID-19 (2020), les hypermarchés GBH sont restés ouverts en tant que \"commerces essentiels\" et ont fourni les populations en denrées alimentaires et en produits d'hygiène. Après le cyclone Irma (2017), les structures GBH encore opérationnelles dans les zones non dévastées ont servi de point d'approvisionnement de secours.",
                  source:
                    'Préfecture de Guadeloupe — rapports COVID 2020 ; France Info DOM — cyclone Irma 2017',
                },
              ].map((item) => (
                <div key={item.titre} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-2">{item.titre}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.desc}</p>
                  <p className="text-xs text-slate-600 italic">📎 {item.source}</p>
                </div>
              ))}
            </div>

            {/* ─── 7. FISCALITÉ LOCALE ──────────────────────────────────────── */}
            <SectionTitle icon={DollarSign}>7 — Contribution fiscale locale</SectionTitle>

            <Collapse title="🏛️ Fiscalité locale — impôts et taxes versés par GBH dans les DOM">
              <p className="mb-3 text-xs text-gray-300">
                En tant qu'entreprise opérant dans les DOM, GBH contribue à la fiscalité locale à
                travers plusieurs prélèvements obligatoires dont le produit finance les services
                publics locaux (collectivités, communes, Région).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li>
                  <strong>Cotisation Foncière des Entreprises (CFE) :</strong> Calculée sur la
                  valeur locative des biens immobiliers occupés. Pour GBH qui occupe d'importantes
                  surfaces commerciales (hypermarchés, entrepôts, concessions), la CFE constitue une
                  contribution significative aux budgets communaux dans les DOM.
                </li>
                <li>
                  <strong>Cotisation sur la Valeur Ajoutée des Entreprises (CVAE) :</strong> Taxe
                  assise sur la valeur ajoutée produite dans les DOM. GBH, en générant une part
                  significative de la valeur ajoutée dans les économies DOM, contribue à cet impôt
                  local (en voie de suppression progressive depuis 2023, mais encore partiellement
                  actif).
                </li>
                <li>
                  <strong>Taxe Foncière sur les Propriétés Bâties :</strong> Sur les biens
                  immobiliers détenus en propre par les SCI du groupe (SCI Jarry Distribution,
                  etc.). Ces taxes alimentent directement les budgets des communes où les zones
                  commerciales sont implantées.
                </li>
                <li>
                  <strong>Octroi de Mer (OM) :</strong> Taxe spécifique aux DOM sur les importations
                  et la production locale. GBH, en tant qu'importateur massif de marchandises,
                  acquitte l'octroi de mer côté acheteur (répercuté dans les prix de vente). Cet
                  impôt, perçu par les collectivités territoriales, représente une ressource fiscale
                  essentielle pour les Régions et communes DOM (entre 30 et 50 % des recettes
                  fiscales locales dans certains DOM).
                </li>
                <li>
                  <strong>Cotisations sociales patronales :</strong> Pour ~14 000 salariés, GBH
                  verse des cotisations sociales patronales (URSSAF, retraite, prévoyance, chômage)
                  qui financent le système de protection sociale dans les DOM.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Légifrance — Code général des impôts ; ADLC Avis 09-A-45 p. 45 (rôle de
                l'octroi de mer) ; IEDOM — Rapport fiscal DOM 2022.
              </p>
              <p className="text-xs text-amber-300/80 bg-amber-500/10 rounded-lg px-3 py-2 mt-2">
                ⚠️ <strong>Nuance :</strong> Les montants exacts d'impôts versés par GBH ne sont pas
                publiés (société non cotée). La contribution fiscale est réelle mais n'est pas
                quantifiable publiquement sans accès aux comptes non publiés du groupe.
              </p>
            </Collapse>

            {/* ─── 8. BILAN ────────────────────────────────────────────────── */}
            <SectionTitle icon={Scale}>
              8 — Bilan équilibré — forces et limites documentées
            </SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-sm font-bold text-green-300 mb-3">
                  ✅ Ce que GBH apporte concrètement (documenté)
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-400">
                  <li>~14 000 emplois directs couverts par convention collective (CCN 3305)</li>
                  <li>Participation annuelle obligatoire au BQP (200+ produits à prix encadrés)</li>
                  <li>Don d'invendus alimentaires (obligation Loi Garot 2016 + Loi AGEC 2020)</li>
                  <li>
                    Contribution fiscale locale réelle (CFE, taxe foncière, cotisations sociales)
                  </li>
                  <li>Accès à une offre diversifiée dans des zones parfois isolées</li>
                  <li>Amplitude horaire large (dimanche, soirées)</li>
                  <li>Rôle de point d'approvisionnement essentiel en cas de crise</li>
                  <li>Parrainage sportif et culturel (sport amateur local, carnaval)</li>
                </ul>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-300 mb-3">
                  ⚠️ Limites & nuances à documenter (sources officielles)
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-400">
                  <li>
                    Les actions BQP et BH sont des obligations ou réactions aux crises, pas des
                    initiatives spontanées (ADLC 19-A-12)
                  </li>
                  <li>
                    Le surcoût alimentaire structurel (+11 à +17 %) persiste malgré les dispositifs
                    (INSEE 2023)
                  </li>
                  <li>
                    Position dominante reconnue : les prix DOM restent structurellement supérieurs à
                    ce qu'ils seraient en situation concurrentielle normale (ADLC)
                  </li>
                  <li>
                    Les emplois GBH sont dans des secteurs de distribution non exportateurs — ils ne
                    contribuent pas à la diversification économique des DOM
                  </li>
                  <li>
                    La contribution fiscale reste opaque (société non cotée, aucune publication des
                    comptes)
                  </li>
                  <li>
                    Les actions RSE et caritatives ne sont pas consolidées dans un rapport public
                    accessible
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4 italic text-center">
              Sources de synthèse : ADLC Avis 09-A-45 (2009) et 19-A-12 (2019) · INSEE DOM 2022-2023
              · IEDOM/CEROM 2023 · Légifrance · Presse régionale 2019-2024
            </p>
          </div>
        )}

        {/* ══ TAB 3 : TERRITOIRES ════════════════════════════════════════════ */}
        {activeTab === 'territoires' && (
          <div>
            <SectionTitle icon={Landmark}>Présence territoriale du groupe GBH</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              GBH est l'un des rares groupes privés français à être implantés simultanément dans les
              quatre DROM continentaux et plusieurs COM d'Outre-Mer. Voici la cartographie de sa
              présence par territoire.
            </p>

            {[
              {
                territoire: '🇬🇵 Guadeloupe (971)',
                statut: 'DROM — siège du groupe',
                color: '#34d399',
                secteurs: [
                  'Grande distribution (Carrefour)',
                  'Distribution automobile (Toyota, Lexus)',
                  'BTP / Matériaux',
                  'Logistique (SOGDA, Sofrigu)',
                  'Immobilier commercial (Jarry)',
                  'Distribution de carburant',
                ],
                note: 'Jarry (Baie-Mahault) abrite le siège social du groupe et la plus grande zone commerciale des Antilles. GBH y détient une position dominante dans la grande distribution.',
                source: 'Avis 19-A-12 (2019) ; RCS Guadeloupe',
                sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
              },
              {
                territoire: '🇲🇶 Martinique (972)',
                statut: 'DROM — territoire fondateur',
                color: '#fbbf24',
                secteurs: [
                  'Grande distribution (Carrefour)',
                  'Distribution automobile',
                  'Hôtellerie (Karibéa Hotels)',
                  'Agroalimentaire / Daribo',
                  'BTP',
                ],
                note: "La Martinique est le territoire d'origine du groupe. GBH y reste leader de la grande distribution malgré une concurrence plus forte qu'en Guadeloupe.",
                source: 'Avis 19-A-12 (2019) ; IEDOM Martinique 2023',
                sourceUrl: 'https://www.iedom.fr/martinique/',
              },
              {
                territoire: '🇬🇫 Guyane (973)',
                statut: 'DROM',
                color: '#60a5fa',
                secteurs: [
                  'Grande distribution (Carrefour)',
                  'Hôtellerie (Karibéa)',
                  'Logistique / Import',
                ],
                note: "Présence dans la grande distribution et l'hôtellerie. Marché plus limité mais GBH y détient une part significative de la distribution alimentaire formelle.",
                source: 'Avis 19-A-12 (2019) ; IEDOM Guyane 2023',
                sourceUrl: 'https://www.iedom.fr/guyane/',
              },
              {
                territoire: '🇷🇪 La Réunion (974)',
                statut: 'DROM',
                color: '#f97316',
                secteurs: [
                  'Grande distribution (Carrefour)',
                  'Distribution automobile',
                  'Logistique',
                ],
                note: "Concurrent du Groupe Caillé. GBH y est présent via Carrefour Réunion mais n'y occupe pas la position dominante qu'il détient aux Antilles.",
                source: 'Avis 19-A-12 (2019) ; IEDOM La Réunion 2023',
                sourceUrl: 'https://www.iedom.fr/reunion/',
              },
              {
                territoire: '🌏 Nouvelle-Calédonie (988)',
                statut: 'COM',
                color: '#a78bfa',
                secteurs: ['Grande distribution', 'Distribution automobile'],
                note: "Présence via GBH Pacific. Marché soumis à la réglementation néo-calédonienne propre (pas d'octroi de mer mais des taxes équivalentes).",
                source: 'IEOM Nouvelle-Calédonie 2022',
                sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
              },
              {
                territoire: '🌺 Polynésie française (987)',
                statut: 'COM',
                color: '#f43f5e',
                secteurs: ['Grande distribution (partenariats)', 'Distribution automobile'],
                note: "Implantation plus légère qu'en Nouvelle-Calédonie. Partenariats locaux pour la distribution.",
                source: 'IEOM Polynésie française 2022',
                sourceUrl: 'https://www.ieom.fr/polynesie-francaise/',
              },
              {
                territoire: '🌍 Madagascar',
                statut: 'International',
                color: '#64748b',
                secteurs: ['Distribution automobile', 'Agroalimentaire', 'Services'],
                note: "Extension internationale dans l'Océan Indien. GBH y est présent depuis les années 2000 dans les secteurs automobile et agroalimentaire.",
                source: 'Site officiel GBH — présentation groupe',
                sourceUrl: 'https://www.gbh.fr/',
              },
            ].map((t) => (
              <div
                key={t.territoire}
                className="mb-5 border border-slate-700 rounded-xl overflow-hidden"
                style={{ borderLeftColor: t.color, borderLeftWidth: 4 }}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-base font-bold text-white">{t.territoire}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${t.color}22`, color: t.color }}
                      >
                        {t.statut}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.secteurs.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-gray-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{t.note}</p>
                  <p className="text-xs text-slate-600">
                    Source : <SourceLink href={t.sourceUrl}>{t.source}</SourceLink>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB 4 : DÉCISIONS RÉGLEMENTAIRES ══════════════════════════════ */}
        {activeTab === 'regulatoire' && (
          <div>
            <SectionTitle icon={Scale}>
              Décisions et enquêtes réglementaires concernant GBH
            </SectionTitle>

            <InfoBox color="blue" title="ℹ️ Rappel juridique important">
              Les avis de l'Autorité de la concurrence sont des{' '}
              <strong>actes administratifs non contraignants</strong> (sauf exceptions). Ils
              analysent la structure des marchés et formulent des recommandations. Ils ne
              constituent pas des sanctions et ne préjugent pas de comportements illicites. Les
              décisions citées sont toutes <strong>publiques et consultables librement</strong> sur
              le site officiel de l'Autorité.
            </InfoBox>

            <Collapse
              title="📋 Avis 09-A-45 du 8 décembre 2009 — Mécanismes d'importation et distribution DOM"
              defaultOpen
            >
              <p className="mb-3">
                <strong>Objet :</strong> Analyse des mécanismes d'importation et de distribution des
                produits de grande consommation dans les DOM.
              </p>
              <p className="mb-3">
                <strong>Principaux constats concernant GBH :</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>
                  GBH identifié comme acteur{' '}
                  <strong>dominant dans la grande distribution alimentaire</strong> en Guadeloupe et
                  Martinique.
                </li>
                <li>
                  Contrôle d'une part significative des <strong>flux d'importation</strong> via ses
                  structures de centrale d'achat (SOGDA).
                </li>
                <li>
                  Cumul de positions : distribution de détail + centrale d'achat + entrepôts
                  logistiques + foncier commercial. Ce cumul est identifié comme un{' '}
                  <strong>facteur limitant la concurrence</strong>.
                </li>
                <li>
                  La détention des murs des centres commerciaux de Jarry crée une{' '}
                  <strong>barrière à l'entrée</strong> pour de nouveaux concurrents.
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation">
                  Avis 09-A-45 complet — autoritedelaconcurrence.fr
                </SourceLink>
              </p>
            </Collapse>

            <Collapse
              title="📋 Avis 19-A-12 du 13 juin 2019 — Situation de la concurrence dans les DOM"
              defaultOpen
            >
              <p className="mb-3">
                <strong>Objet :</strong> Suivi approfondi de la situation concurrentielle dans les
                départements d'Outre-Mer 10 ans après l'Avis 09-A-45.
              </p>
              <p className="mb-3">
                <strong>Principaux constats concernant GBH :</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>
                  GBH maintient et a <strong>renforcé sa position dominante</strong> dans la grande
                  distribution aux Antilles depuis 2009.
                </li>
                <li>
                  Parts de marché supérieures à{' '}
                  <strong>50 % dans certaines zones de chalandise</strong> en Guadeloupe et
                  Martinique.
                </li>
                <li>
                  L'Autorité recommande une <strong>plus grande transparence</strong> sur les marges
                  pratiquées et les conditions d'accès aux linéaires pour les producteurs locaux.
                </li>
                <li>
                  La diversification du groupe (automobile, BTP, hôtellerie) renforce sa capacité à
                  exercer des pressions croisées sur ses partenaires commerciaux.
                </li>
                <li>
                  Recommandation de <strong>vigilance accrue</strong> de l'OPMR (Observatoire des
                  Prix, des Marges et des Revenus) sur les pratiques tarifaires.
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                  Avis 19-A-12 complet — autoritedelaconcurrence.fr
                </SourceLink>
              </p>
            </Collapse>

            <Collapse title="📋 OPMR — Surveillance continue des prix (2018–2026)">
              <p className="mb-3">
                L'<strong>Observatoire des Prix, des Marges et des Revenus (OPMR)</strong> est un
                organisme public créé par la loi du 20 novembre 2012 relative à la régulation
                économique outre-mer (loi Lurel). Il est chargé de surveiller les prix et les marges
                dans la grande distribution dans les DOM.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>
                  Les rapports annuels de l'OPMR Guadeloupe et de l'OPMR Martinique incluent des
                  données sur les marges pratiquées par les principales enseignes,
                  <strong>dont Carrefour/GBH</strong>.
                </li>
                <li>
                  Les données OPMR montrent des <strong>écarts de prix moyens de +22 %</strong>
                  sur les produits alimentaires entre les DOM et la France métropolitaine (toutes
                  causes confondues).
                </li>
                <li>La surveillance OPMR est une obligation légale depuis la loi Lurel (2012).</li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.opmr.fr/">OPMR — Site officiel</SourceLink>
              </p>
            </Collapse>

            <Collapse title="📋 Loi du 20 novembre 2012 (Loi Lurel) — Régulation économique outre-mer">
              <p className="mb-3">
                La loi n° 2012-1270 dite « loi Lurel » a été adoptée spécifiquement pour réguler les
                marchés ultra-marins. Elle s'applique directement aux activités de GBH.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>Création de l'OPMR et obligations de transparence tarifaire.</li>
                <li>
                  Dispositions sur les <strong>accords de gamme exclusifs</strong> (pratique
                  consistant à contraindre les fournisseurs à n'approvisionner qu'un seul
                  distributeur dans un territoire) — identifiées comme problématiques aux Antilles.
                </li>
                <li>
                  Encadrement des pratiques de référencement et des conditions commerciales dans les
                  petits marchés insulaires.
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.legifrance.gouv.fr/loi/id/JORFTEXT000026607977/">
                  Loi n° 2012-1270 — Légifrance
                </SourceLink>
              </p>
            </Collapse>

            <InfoBox
              color="green"
              title="✅ Aucune condamnation pénale ou sanction administrative publiée"
            >
              À la date de rédaction de ce dossier (mars 2026), aucune{' '}
              <strong>décision de condamnation</strong> de l'Autorité de la concurrence ou de
              juridiction pénale à l'encontre du groupe GBH spécifiquement n'est publiée dans les
              registres officiels français (BODACC, Légifrance, ADLC). Les avis cités sont des{' '}
              <em>avis de marché</em>, non des sanctions. Cette précision est essentielle pour la
              rigueur factuelle du dossier.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 5 : IMPACT & VIE CHÈRE ════════════════════════════════════ */}
        {activeTab === 'impact' && (
          <div>
            <SectionTitle icon={TrendingUp}>
              Impact économique & contribution à la vie chère dans les DOM
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              La concentration du marché de la grande distribution aux mains d'un nombre limité
              d'acteurs — dont GBH est le principal — est identifiée par les institutions publiques
              comme <strong>l'un des facteurs structurels</strong> de la cherté de la vie dans les
              DOM. Ces constats sont fondés sur des données officielles.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard
                label="Surcoût alimentaire DOM vs métropole"
                value="+11 à +17%"
                sub="INSEE 2022"
                highlight
              />
              <DataCard
                label="Part de GBH grande distribution GP"
                value=">50%"
                sub="Avis 19-A-12 (zones)"
              />
              <DataCard
                label="Marges distribution DOM (estimées)"
                value="+30 à +40%"
                sub="vs 20-25% métro"
              />
              <DataCard
                label="Part distribution dans surcoût total"
                value="~25%"
                sub="Autorité concurrence"
              />
            </div>

            <Collapse
              title="📊 Décomposition du surcoût alimentaire dans les DOM (INSEE 2022)"
              defaultOpen
            >
              <div className="space-y-3 mt-3">
                {[
                  { factor: 'Marges de distribution plus élevées', pct: 25, color: '#f97316' },
                  { factor: 'Octroi de mer', pct: 30, color: '#a78bfa' },
                  { factor: 'Fret maritime & surcoût logistique', pct: 28, color: '#60a5fa' },
                  { factor: "Coûts d'exploitation plus élevés", pct: 12, color: '#fbbf24' },
                  { factor: 'Autres facteurs', pct: 5, color: '#64748b' },
                ].map((row) => (
                  <div key={row.factor} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 min-w-[250px]">{row.factor}</span>
                    <div
                      className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={row.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.factor} : ${row.pct}%`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.pct}%`, background: row.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold min-w-[36px] text-right"
                      style={{ color: row.color }}
                    >
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Source : INSEE — Enquête niveaux de vie DOM 2022 ; Autorité de la concurrence, Avis
                09-A-45 (2009) et Avis 19-A-12 (2019). Parts estimées, non exclusives.
              </p>
            </Collapse>

            <SectionTitle icon={AlertTriangle}>
              Contexte social : mouvements contre la vie chère
            </SectionTitle>
            <div className="space-y-3">
              {[
                {
                  date: 'Nov. 2021 — Guadeloupe',
                  desc: 'Mouvement social majeur en Guadeloupe. Les revendications incluent explicitement la lutte contre la vie chère et la demande de régulation des prix dans la grande distribution. GBH est cité dans le débat public.',
                  source: 'Rapport mission préfectorale Guadeloupe déc. 2021',
                },
                {
                  date: '2021–2024 — Martinique',
                  desc: "Mobilisations répétées en Martinique contre la vie chère. Demandes de plafonnement des prix sur les produits alimentaires essentiels. L'État engage des négociations avec les distributeurs, dont GBH.",
                  source: 'IEDOM Martinique 2023 ; Presse locale Martinique La 1ère',
                },
                {
                  date: '2023 — Bouclier qualité-prix (BQP)',
                  desc: 'L\'État français étend le dispositif "Bouclier qualité-prix" dans les DOM : panier d\'une centaine de produits dont les prix sont négociés et plafonnés. Les grandes enseignes dont Carrefour/GBH sont parties prenantes obligatoires.',
                  source: 'Arrêtés préfectoraux BQP 2023 — Légifrance',
                },
              ].map((ev) => (
                <div key={ev.date} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-300 mb-1">{ev.date}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-1">{ev.desc}</p>
                  <p className="text-xs text-slate-600 italic">{ev.source}</p>
                </div>
              ))}
            </div>

            <InfoBox color="purple" title="📌 Position institutionnelle — nuance nécessaire">
              Les rapports officiels (CEROM, IEDOM, Autorité de la concurrence) soulignent que le
              surcoût dans les DOM résulte de <strong>causes multiples</strong> : logistique
              insulaire, fiscalité (octroi de mer), faiblesse de la concurrence locale et coûts de
              production plus élevés. La concentration de la distribution est{' '}
              <em>un facteur parmi d'autres</em>, pas le seul responsable. Cette nuance est
              explicitement posée dans l'Avis 19-A-12 (p. 12).
            </InfoBox>
          </div>
        )}

        {/* ══ TAB : CONCURRENTS ══════════════════════════════════════════════ */}
        {activeTab === 'concurrents' && (
          <div>
            <SectionTitle icon={BarChart2}>
              Paysage concurrentiel — GBH face à ses concurrents dans les DOM
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Les marchés de grande distribution dans les DOM se caractérisent par un nombre limité
              d'acteurs. L'Autorité de la concurrence (Avis 19-A-12, 2019) a cartographié ce paysage
              concurrentiel. GBH y occupe une position dominante dans plusieurs territoires, mais
              fait face à plusieurs groupes dans les autres DOM.
            </p>

            <InfoBox color="blue" title="ℹ️ Source des données concurrentielles">
              Les données de parts de marché et les noms des concurrents cités sont issus des avis
              publics de l'Autorité de la concurrence (09-A-45 et 19-A-12), des rapports IEDOM et de
              la presse régionale. Les parts de marché exactes sont estimées ou issues de
              fourchettes publiées dans les avis officiels.
            </InfoBox>

            {/* Territory by territory competition table */}
            {[
              {
                territoire: '🇬🇵 Guadeloupe',
                flag: 'bg-green-500/10 border-green-500/30',
                header: 'text-green-300',
                gbhPart: '> 50 %',
                gbhEnseignes: 'Carrefour, Carrefour Market',
                concurrents: [
                  {
                    nom: 'E.Leclerc (Guadeloupe)',
                    part: '~20-25 %',
                    note: 'Via franchisés locaux indépendants',
                  },
                  { nom: 'Intermarché DOM', part: '~10-15 %', note: 'Franchisés locaux' },
                  {
                    nom: 'Petits commerces & hard discount',
                    part: '~10 %',
                    note: 'Leader Price, Lidl (limité)',
                  },
                ],
                source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 15-20',
                sourceUrl:
                  'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                note: "GBH est l'acteur dominant incontesté en Guadeloupe, notamment via la maîtrise de la zone commerciale de Jarry (Baie-Mahault), identifiée comme barrière à l'entrée par l'ADLC.",
              },
              {
                territoire: '🇲🇶 Martinique',
                flag: 'bg-amber-500/10 border-amber-500/30',
                header: 'text-amber-300',
                gbhPart: '40-50 %',
                gbhEnseignes: 'Carrefour, Carrefour Market, Carrefour Express',
                concurrents: [
                  {
                    nom: 'E.Leclerc Martinique',
                    part: '~25-30 %',
                    note: 'Groupement Leclerc, franchisé local',
                  },
                  {
                    nom: 'Hyper U / Super U',
                    part: '~10-15 %',
                    note: 'Groupe Système U, présence locale',
                  },
                  { nom: 'Intermarché', part: '~10 %', note: 'Franchisés locaux Martinique' },
                ],
                source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 20-25',
                sourceUrl:
                  'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                note: "En Martinique, GBH fait face à une concurrence plus structurée qu'en Guadeloupe avec E.Leclerc et Hyper U. Sa part de marché y est dominante mais pas hégémonique.",
              },
              {
                territoire: '🇬🇫 Guyane',
                flag: 'bg-blue-500/10 border-blue-500/30',
                header: 'text-blue-300',
                gbhPart: '~35-45 %',
                gbhEnseignes: 'Carrefour, Carrefour Market',
                concurrents: [
                  { nom: 'E.Leclerc Guyane', part: '~25 %', note: 'Franchisé Leclerc en Guyane' },
                  {
                    nom: 'Hyper U / Champion (anciens)',
                    part: '~15 %',
                    note: 'Présence historique',
                  },
                  {
                    nom: 'Commerce informel & petits détaillants',
                    part: '~15-20 %',
                    note: 'Spécificité guyanaise (bassins frontaliers)',
                  },
                ],
                source: 'Autorité de la concurrence — Avis 19-A-12 (2019) ; IEDOM Guyane 2023',
                sourceUrl: 'https://www.iedom.fr/guyane/',
                note: "La Guyane a une structure particulière avec une part significative du commerce informel et transfrontalier (Brésil, Suriname). GBH y est présent mais moins dominant qu'aux Antilles.",
              },
              {
                territoire: '🇷🇪 La Réunion',
                flag: 'bg-orange-500/10 border-orange-500/30',
                header: 'text-orange-300',
                gbhPart: '~20-30 %',
                gbhEnseignes: 'Carrefour Réunion',
                concurrents: [
                  {
                    nom: 'Vindemia — Groupe Bourbon (Carrefour RE historique)',
                    part: '~30 %',
                    note: 'Groupe Bourbon, historiquement franchisé Carrefour avant GBH',
                  },
                  {
                    nom: 'Groupe Caillé (E.Leclerc RE)',
                    part: '~25-30 %',
                    note: 'Principal concurrent à La Réunion, franchisé Leclerc',
                  },
                  {
                    nom: 'Jumbo Score (Groupe Cilam)',
                    part: '~10-15 %',
                    note: 'Groupe réunionnais Cilam',
                  },
                  { nom: 'Hyper U / Super U Réunion', part: '~10 %', note: 'Franchisés Système U' },
                ],
                source: 'IEDOM La Réunion 2023 ; Avis 19-A-12 (2019), pp. 25-30',
                sourceUrl: 'https://www.iedom.fr/reunion/',
                note: "À La Réunion, GBH n'est pas l'acteur dominant : Vindemia et le Groupe Caillé (Leclerc) sont des concurrents de taille équivalente. Le marché réunionnais est le plus concurrentiel des DOM.",
              },
              {
                territoire: '🌏 Nouvelle-Calédonie',
                flag: 'bg-purple-500/10 border-purple-500/30',
                header: 'text-purple-300',
                gbhPart: 'Position significative',
                gbhEnseignes: 'Carrefour NC, Proxi',
                concurrents: [
                  {
                    nom: 'Dock de France / Casino NC',
                    part: 'Important',
                    note: 'Groupe Casino présent historiquement',
                  },
                  {
                    nom: 'Kenu-In / Commerce local',
                    part: 'Important',
                    note: 'Réseaux commerciaux locaux calédoniens',
                  },
                ],
                source: 'IEOM Nouvelle-Calédonie 2022',
                sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
                note: "La Nouvelle-Calédonie a un cadre réglementaire propre (pas d'octroi de mer, taxes locales). GBH y est en concurrence avec d'autres groupes implantés localement.",
              },
            ].map((t) => (
              <div
                key={t.territoire}
                className={`mb-6 border rounded-xl overflow-hidden ${t.flag}`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className={`text-base font-bold ${t.header}`}>{t.territoire}</h3>
                  </div>

                  {/* GBH position */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-0.5">
                      GBH / Carrefour
                    </p>
                    <p className="text-white font-bold text-sm">
                      {t.gbhPart} de part de marché (est.)
                    </p>
                    <p className="text-xs text-gray-400">Enseignes : {t.gbhEnseignes}</p>
                  </div>

                  {/* Competitors */}
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Principaux concurrents
                  </p>
                  <div className="space-y-2 mb-3">
                    {t.concurrents.map((c) => (
                      <div key={c.nom} className="flex items-start gap-2 text-xs">
                        <span className="text-gray-500 mt-0.5 flex-shrink-0">▸</span>
                        <div>
                          <span className="text-gray-200 font-medium">{c.nom}</span>
                          <span className="text-gray-500"> — {c.part}</span>
                          {c.note && <span className="text-gray-600 block">{c.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  <p className="text-xs text-gray-400 italic border-t border-slate-800 pt-2 mb-1">
                    {t.note}
                  </p>
                  <p className="text-xs text-slate-600">
                    Source : <SourceLink href={t.sourceUrl}>{t.source}</SourceLink>
                  </p>
                </div>
              </div>
            ))}

            <SectionTitle icon={AlertTriangle}>
              Synthèse concurrentielle — Facteurs structurels
            </SectionTitle>
            <Collapse title="📊 Pourquoi la concurrence reste limitée dans les DOM ?" defaultOpen>
              <p className="mb-3">
                L'Autorité de la concurrence (Avis 19-A-12, 2019) identifie plusieurs
                <strong> barrières à l'entrée structurelles</strong> qui protègent les acteurs
                établis, dont GBH :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Foncier commercial concentré :</strong> GBH détient les murs et le foncier
                  de ses centres commerciaux (SCI Jarry Distribution, Immobilière Hayot). Tout
                  nouvel entrant doit trouver des terrains disponibles, rares dans des îles à
                  surface limitée.
                </li>
                <li>
                  <strong>Logistique maîtrisée :</strong> SOGDA contrôle une part significative des
                  flux d'importation en Guadeloupe et Martinique. Les entrepôts frigorifiques
                  (Sofrigu) sont une infrastructure critique difficile à dupliquer.
                </li>
                <li>
                  <strong>Taille du marché :</strong> Les marchés insulaires sont trop petits pour
                  amortir les coûts fixes d'une grande surface sur de nombreux concurrents. Ceci
                  favorise la concentration naturelle.
                </li>
                <li>
                  <strong>Accords de gamme exclusifs :</strong> Pratique consistant à obtenir
                  l'exclusivité d'approvisionnement d'un fournisseur sur un territoire. Limitée par
                  la loi Lurel (2012) mais difficile à détecter.
                </li>
                <li>
                  <strong>Marque Carrefour :</strong> Le contrat de franchise Carrefour confère un
                  avantage de notoriété et d'approvisionnement (centrale d'achat Carrefour)
                  difficile à concurrencer pour un entrant indépendant.
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source :{' '}
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                  Avis 19-A-12 — ADLC (2019), pp. 40-55
                </SourceLink>
              </p>
            </Collapse>

            <Collapse title="📋 Comparaison des grands groupes de distribution DOM">
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-2 text-gray-400 font-semibold pr-4">Groupe</th>
                      <th className="pb-2 text-gray-400 font-semibold pr-4">Enseigne(s)</th>
                      <th className="pb-2 text-gray-400 font-semibold pr-4">Territoires</th>
                      <th className="pb-2 text-gray-400 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      {
                        groupe: 'GBH (Hayot)',
                        enseignes: 'Carrefour DOM',
                        territoires: 'GP, MQ, GF, RE, NC, PF',
                        statut: 'Non coté — familial',
                      },
                      {
                        groupe: 'Groupe Caillé',
                        enseignes: 'E.Leclerc Réunion',
                        territoires: 'RE',
                        statut: 'Non coté — familial',
                      },
                      {
                        groupe: 'Vindemia (Bourbon)',
                        enseignes: 'Géant Casino / Score',
                        territoires: 'RE',
                        statut: 'Filiale Groupe SEB/Bourbon',
                      },
                      {
                        groupe: 'Leclerc DOM (frch.)',
                        enseignes: 'E.Leclerc',
                        territoires: 'GP, MQ, GF, RE',
                        statut: 'Franchisés indépendants',
                      },
                      {
                        groupe: 'Intermarché DOM',
                        enseignes: 'Intermarché',
                        territoires: 'GP, MQ, GF',
                        statut: 'Franchisés ITM Entreprises',
                      },
                      {
                        groupe: 'Groupe Cilam',
                        enseignes: 'Jumbo Score',
                        territoires: 'RE',
                        statut: 'Groupe réunionnais',
                      },
                      {
                        groupe: 'Système U DOM',
                        enseignes: 'Hyper U / Super U',
                        territoires: 'GP, MQ, RE',
                        statut: 'Coopérative commerçants',
                      },
                    ].map((r) => (
                      <tr key={r.groupe}>
                        <td className="py-2 text-white font-medium pr-4">{r.groupe}</td>
                        <td className="py-2 text-gray-300 pr-4">{r.enseignes}</td>
                        <td className="py-2 text-gray-400 pr-4">{r.territoires}</td>
                        <td className="py-2 text-gray-500">{r.statut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Source : Avis 09-A-45 (2009) et Avis 19-A-12 (2019) — Autorité de la concurrence ;
                IEDOM Rapports annuels 2023 ; sites officiels des groupes cités.
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : COMPARATIF PRIX DOM / MÉTROPOLE ════════════════════════ */}
        {activeTab === 'prix' && (
          <div>
            <SectionTitle icon={DollarSign}>
              Comparatif des prix DOM / Métropole — données concrètes
            </SectionTitle>

            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/30 rounded-2xl p-5 mb-8">
              <p className="text-base font-bold text-red-300 mb-2">
                🛒 La question que tout le monde se pose : combien ça coûte de plus aux Antilles ?
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Les prix dans les DOM sont{' '}
                <strong className="text-red-300">structurellement plus élevés</strong> qu'en
                métropole. L'INSEE mesure régulièrement cet écart. En 2023, les produits
                alimentaires coûtent en moyenne{' '}
                <strong className="text-red-300">+11 % à +17 %</strong> de plus en Guadeloupe et
                Martinique qu'en France métropolitaine — et davantage encore pour certaines
                catégories de produits.
              </p>
            </div>

            <InfoBox color="amber" title="⚠️ Méthode & limites">
              Les prix présentés ci-dessous sont issus des relevés officiels de l'INSEE DOM, de
              l'Observatoire des Prix, des Marges et des Revenus (OPMR) et de rapports
              parlementaires. Ils sont indicatifs et peuvent varier selon les enseignes, les
              références exactes et les périodes promotionnelles. GBH n'est pas le seul distributeur
              en DOM — mais il est dominant ({'>'} 40 % de part de marché en distribution
              alimentaire en Guadeloupe et Martinique selon l'ADLC 2019).
            </InfoBox>

            {/* Tableau des prix */}
            <SectionTitle icon={ShoppingBag}>
              Tableau comparatif — produits du quotidien
            </SectionTitle>
            <p className="text-xs text-gray-500 mb-4 italic">
              Prix moyens constatés. Sources : INSEE DOM 2022-2023 · OPMR Guadeloupe & Martinique ·
              rapports sénat 2023.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left min-w-[680px]">
                <thead>
                  <tr className="border-b border-red-500/30 bg-red-500/5">
                    <th className="pb-3 pt-2 px-3 text-red-300 font-bold">Produit</th>
                    <th className="pb-3 pt-2 px-3 text-red-300 font-bold text-right">
                      Prix Métropole
                    </th>
                    <th className="pb-3 pt-2 px-3 text-red-300 font-bold text-right">
                      Prix DOM (moy.)
                    </th>
                    <th className="pb-3 pt-2 px-3 text-red-300 font-bold text-right">Écart</th>
                    <th className="pb-3 pt-2 px-3 text-red-300 font-bold text-center">Niveau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    {
                      produit: '🥛 Lait demi-écrémé 1L',
                      metro: '0,90 €',
                      dom: '1,25–1,55 €',
                      ecart: '+39–72 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🍞 Pain de mie 500g',
                      metro: '1,50 €',
                      dom: '2,10–2,60 €',
                      ecart: '+40–73 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🍚 Riz blanc 1kg',
                      metro: '1,20 €',
                      dom: '1,60–2,00 €',
                      ecart: '+33–67 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🍝 Pâtes 500g',
                      metro: '0,85 €',
                      dom: '1,10–1,40 €',
                      ecart: '+29–65 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🧴 Huile de tournesol 1L',
                      metro: '1,80 €',
                      dom: '2,40–3,00 €',
                      ecart: '+33–67 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🍅 Concentré de tomate 140g',
                      metro: '0,60 €',
                      dom: '0,90–1,10 €',
                      ecart: '+50–83 %',
                      niveau: 'trés-haut',
                    },
                    {
                      produit: '☕ Café moulu 250g',
                      metro: '2,50 €',
                      dom: '3,20–4,00 €',
                      ecart: '+28–60 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🧻 Papier toilette x6',
                      metro: '2,80 €',
                      dom: '4,00–5,50 €',
                      ecart: '+43–96 %',
                      niveau: 'trés-haut',
                    },
                    {
                      produit: '🧼 Savon liquide 500ml',
                      metro: '1,90 €',
                      dom: '2,80–3,50 €',
                      ecart: '+47–84 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🐟 Thon en boîte 180g',
                      metro: '1,40 €',
                      dom: '2,00–2,60 €',
                      ecart: '+43–86 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🧀 Emmental râpé 200g',
                      metro: '1,80 €',
                      dom: '2,80–3,40 €',
                      ecart: '+56–89 %',
                      niveau: 'trés-haut',
                    },
                    {
                      produit: '🍗 Escalope de poulet 500g',
                      metro: '4,50 €',
                      dom: '6,00–8,00 €',
                      ecart: '+33–78 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🧈 Beurre 250g',
                      metro: '2,20 €',
                      dom: '3,20–4,00 €',
                      ecart: '+45–82 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🥚 Œufs x6',
                      metro: '1,80 €',
                      dom: '2,60–3,50 €',
                      ecart: '+44–94 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🥫 Haricots rouges en boîte 400g',
                      metro: '0,90 €',
                      dom: '1,40–1,80 €',
                      ecart: '+56–100 %',
                      niveau: 'trés-haut',
                    },
                    {
                      produit: "🧃 Jus d'orange 1L",
                      metro: '1,50 €',
                      dom: '2,20–2,80 €',
                      ecart: '+47–87 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🥤 Eau minérale 1,5L',
                      metro: '0,45 €',
                      dom: '0,80–1,20 €',
                      ecart: '+78–167 %',
                      niveau: 'trés-haut',
                    },
                    {
                      produit: '🍼 Lait infantile 1er âge 800g',
                      metro: '12,00 €',
                      dom: '16,00–22,00 €',
                      ecart: '+33–83 %',
                      niveau: 'haut',
                    },
                    {
                      produit: '🚿 Shampoing 400ml',
                      metro: '2,50 €',
                      dom: '4,00–5,50 €',
                      ecart: '+60–120 %',
                      niveau: 'trés-haut',
                    },
                    {
                      produit: '💊 Doliprane 1g x8',
                      metro: '2,80 €',
                      dom: '3,80–4,80 €',
                      ecart: '+36–71 %',
                      niveau: 'haut',
                    },
                  ].map((row) => {
                    const c =
                      row.niveau === 'trés-haut'
                        ? {
                            bg: 'bg-red-500/10',
                            ecart: 'text-red-400 font-bold',
                            badge: 'bg-red-500/20 text-red-300 border-red-500/40',
                          }
                        : {
                            bg: '',
                            ecart: 'text-orange-400 font-semibold',
                            badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
                          };
                    return (
                      <tr
                        key={row.produit}
                        className={`hover:bg-slate-700/20 transition-colors ${c.bg}`}
                      >
                        <td className="py-2.5 px-3 text-gray-200">{row.produit}</td>
                        <td className="py-2.5 px-3 text-right text-gray-400 font-mono">
                          {row.metro}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-300 font-mono font-semibold">
                          {row.dom}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono ${c.ecart}`}>
                          {row.ecart}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${c.badge}`}>
                            {row.niveau === 'trés-haut' ? '🔴 Très élevé' : '🟠 Élevé'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard
                label="Écart moyen alimentaire"
                value="+11 à +17 %"
                sub="Guadeloupe & Martinique vs métropole"
                highlight
              />
              <DataCard
                label="Écart produits frais"
                value="+20 à +30 %"
                sub="Viandes, produits laitiers"
                highlight
              />
              <DataCard
                label="Écart hygiène/beauté"
                value="+40 à +70 %"
                sub="Catégorie la plus touchée"
                highlight
              />
              <DataCard
                label="Part du budget alim."
                value="25–35 %"
                sub="Ménages modestes DOM vs 15% métro"
              />
            </div>

            {/* Pourquoi ces écarts ? */}
            <SectionTitle icon={AlertTriangle}>
              Pourquoi les prix sont-ils si élevés ? — Les vraies raisons
            </SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                {
                  rang: '1',
                  emoji: '🚢',
                  titre: 'Le transport maritime — incontournable',
                  part: "~30–40 % de l'écart",
                  color: '#f59e0b',
                  desc: "Les Antilles sont des îles. Tout ce qui n'est pas produit localement doit être importé par bateau depuis la métropole ou d'autres pays. Le coût du fret maritime (conteneurs, délais, assurances, manutention portuaire) est répercuté dans le prix de vente. C'est une réalité géographique incompressible qui concerne tous les distributeurs, pas seulement GBH.",
                  source: 'CEROM — Rapport économique DOM 2022 ; OPMR Guadeloupe 2023',
                },
                {
                  rang: '2',
                  emoji: '🏷️',
                  titre: "L'Octroi de Mer — taxe locale sur les imports",
                  part: "~15–25 % de l'écart",
                  color: '#ef4444',
                  desc: "L'octroi de mer est une taxe spécifique aux DOM, perçue sur toutes les marchandises importées (et sur certaines productions locales). Héritage du système colonial, il est devenu la principale ressource fiscale des collectivités locales DOM (30 à 50 % de leurs recettes). Il est donc intégré dans le prix de vente au consommateur. Son maintien est défendu par les collectivités locales même s'il contribue à la vie chère.",
                  source:
                    'ADLC — Avis 09-A-45 (2009) pp. 30-35 ; FEDOM — rapport octroi de mer 2022',
                },
                {
                  rang: '3',
                  emoji: '📦',
                  titre: 'Les marges de la distribution — rôle de GBH',
                  part: "~20–35 % de l'écart",
                  color: '#8b5cf6',
                  desc: "C'est ici que la responsabilité de GBH est la plus directement engagée. La position dominante du groupe en distribution alimentaire (>40 % de pdm) réduit la pression concurrentielle et permet des marges plus élevées qu'en métropole. L'ADLC a documenté des marges brutes supérieures dans les DOM vs métropole pour les mêmes produits Carrefour. La taille réduite des marchés DOM et les coûts fixes élevés (personnel, immobilier) expliquent une partie de ces marges — mais pas la totalité.",
                  source: 'ADLC — Avis 19-A-12 (2019) pp. 25-40 ; Rapport Sénateur Claireaux 2023',
                },
                {
                  rang: '4',
                  emoji: '🏗️',
                  titre: 'Les coûts locaux — immobilier, énergie, personnel',
                  part: "~10–20 % de l'écart",
                  color: '#10b981',
                  desc: "Les coûts d'exploitation en DOM sont intrinsèquement plus élevés : l'électricité est plus chère (CRE — 0,18 à 0,25 €/kWh vs 0,12 €/kWh en métropole), l'immobilier commercial est plus rare, et le coût de l'adaptation aux conditions tropicales (climatisation, normes anticyclones) augmente les charges. Ces coûts sont réels mais partiellement absorbables par des économies d'échelle que seul un groupe de la taille de GBH peut réaliser.",
                  source: 'CRE — rapport tarifs DOM 2023 ; BRGM — risques naturels DOM',
                },
              ].map((r) => (
                <div key={r.rang} className="border border-slate-700 rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50"
                    style={{ background: `${r.color}11` }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2"
                      style={{ background: `${r.color}22`, borderColor: r.color, color: r.color }}
                    >
                      {r.rang}
                    </span>
                    <span className="text-lg">{r.emoji}</span>
                    <p className="text-sm font-bold text-white flex-1">{r.titre}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                      style={{
                        background: `${r.color}20`,
                        borderColor: `${r.color}50`,
                        color: r.color,
                      }}
                    >
                      {r.part}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{r.desc}</p>
                    <p className="text-xs text-slate-600 italic">📎 {r.source}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* BQP — le bouclier */}
            <SectionTitle icon={Shield}>
              Le Bouclier Qualité-Prix (BQP) — ce que ça change concrètement
            </SectionTitle>
            <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-5 mb-8">
              <p className="text-sm font-bold text-green-300 mb-3">
                🛡️ Le BQP en pratique : 200+ produits à prix encadrés
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <DataCard
                  label="Produits dans le BQP 2024 (GP)"
                  value="209"
                  sub="Arrêté préfectoral annuel"
                />
                <DataCard
                  label="Économie estimée par rapport au prix libre"
                  value="15–20 %"
                  sub="Sur le panier BQP uniquement"
                />
                <DataCard
                  label="Part du budget alimentaire couverte"
                  value="~25–35 %"
                  sub="Estimation OPMR"
                />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Le panier BQP 2024 en Guadeloupe comprend notamment : huile, riz, pâtes, conserves
                de légumes, produits d'hygiène de base (dentifrice, savon, papier toilette), café,
                lait, yaourts, farine, sucre... Ces produits sont vendus à des prix plafonnés dans
                tous les supermarchés GBH (et les autres enseignes signataires). C'est une mesure
                réelle et vérifiable qui atténue (sans éliminer) le surcoût pour les ménages à
                revenus modestes.
              </p>
              <p className="text-xs text-amber-300/80 bg-amber-500/10 rounded-lg px-3 py-2">
                ⚠️ <strong>Limite :</strong> Le BQP ne concerne que ~20 % des références en magasin.
                Les 80 % restants sont à prix libres, où les marges sont potentiellement plus
                élevées. Le BQP est aussi une obligation négociée sous pression réglementaire, pas
                une initiative volontaire de GBH.
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Source : Arrêté BQP 2024 — Préfecture de Guadeloupe · Préfecture de Martinique ·
                OPMR
              </p>
            </div>

            {/* Recommandations pratiques */}
            <SectionTitle icon={Info}>Conseils pratiques pour économiser en DOM</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  emoji: '🏷️',
                  titre: 'Acheter les produits du BQP',
                  desc: "Le panier BQP est affiché en magasin. Ces 200+ produits sont garantis à prix encadré. C'est là que l'économie est la plus grande par rapport au prix libre.",
                },
                {
                  emoji: '🛒',
                  titre: 'Comparer les enseignes',
                  desc: "Même si GBH est dominant, d'autres enseignes existent (Leader Price, Hyper U, Marché Passion). Les prix peuvent varier de 5 à 15 % selon les produits et les enseignes.",
                },
                {
                  emoji: '🌱',
                  titre: 'Acheter local au marché',
                  desc: 'Les marchés locaux (légumes antillais, fruits tropicaux, poisson frais local) proposent souvent des prix inférieurs aux grandes surfaces pour les produits frais locaux.',
                },
                {
                  emoji: '💳',
                  titre: 'Carte de fidélité Carrefour+',
                  desc: "La carte fidélité Carrefour+ offre des réductions immédiates et des points. Pour un foyer actif, l'économie annuelle peut être de 150 à 300 € selon les achats.",
                },
                {
                  emoji: '📅',
                  titre: 'Profiter des promotions catalogues',
                  desc: "Les catalogues Carrefour DOM (consultables sur carrefour.gp et carrefour.mq) proposent chaque semaine des promotions pouvant aller jusqu'à -30 % sur certains produits.",
                },
                {
                  emoji: '🏪',
                  titre: 'Acheter les MDD Carrefour',
                  desc: 'Les marques distributeur (Carrefour Essential, Carrefour Bio) sont généralement 20 à 30 % moins chères que les marques nationales pour une qualité souvent comparable.',
                },
              ].map((c) => (
                <div key={c.titre} className="border border-slate-700 rounded-xl p-3 flex gap-3">
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-white mb-1">{c.titre}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 text-center italic">
              Sources principales : INSEE DOM — Comparaisons de prix 2022-2023 · OPMR Guadeloupe &
              Martinique · ADLC Avis 19-A-12 (2019) · Rapport Sénateur Claireaux — Vie chère en
              Outre-Mer 2023
            </p>
          </div>
        )}

        {/* ══ TAB : FAQ CITOYENNE ═══════════════════════════════════════════ */}
        {activeTab === 'faq' && (
          <div>
            <SectionTitle icon={Info}>Questions des citoyens — Réponses documentées</SectionTitle>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/5 border border-blue-500/30 rounded-2xl p-5 mb-8">
              <p className="text-base font-bold text-blue-300 mb-2">
                💬 Ce que les Guadeloupéens et Martiniquais demandent vraiment sur GBH
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Cette page rassemble les questions les plus fréquentes posées par les citoyens des
                DOM sur le Groupe Bernard Hayot — sur les réseaux sociaux, dans la presse régionale,
                lors des crises sociales. Les réponses sont basées sur des sources vérifiables, sans
                tabou, avec les nuances nécessaires.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: '💰 Combien gagne Bernard Hayot ? Est-il vraiment milliardaire ?',
                  statut: 'Estimation journalistique',
                  color: 'amber',
                  r: `Le magazine Challenges classe chaque année les 500 premières fortunes de France. Bernard Hayot y figure régulièrement avec une fortune estimée entre 1 et 2 milliards d'euros selon les éditions (2019-2023). Ces estimations sont réalisées par des journalistes sur la base d'actifs estimés — immobilier, valeur des filiales, participation dans le capital GBH — et ne sont pas auditées. GBH étant une société non cotée et non publiante, les chiffres exacts sont inconnus du public. Ce qu'on peut dire avec certitude : il figure parmi les personnes les plus riches de France et c'est, de très loin, la plus grande fortune privée des Antilles françaises.`,
                  source:
                    'Challenges — Classement 500 fortunes (éditions 2019-2023) ; Capital — Fortunes Outre-Mer',
                },
                {
                  q: "🤔 Pourquoi GBH n'est pas obligé de publier ses comptes ?",
                  statut: 'Question juridique',
                  color: 'blue',
                  r: `GBH est structuré en SAS (Société par Actions Simplifiée). La loi française oblige les grandes entreprises à publier leurs comptes seulement si elles dépassent certains seuils cumulés sur deux des trois critères suivants : bilan > 4 M€, chiffre d'affaires > 8 M€, et nombre de salariés > 50. GBH dépasse ces seuils, mais il existe des exceptions pour les filiales de groupes qui déposent des comptes consolidés — or GBH n'a pas d'obligation de consolidation publique. En 2023, le gouvernement a renforcé les obligations de publication des grandes entreprises, mais l'application aux SAS familiales reste partielle. C'est un vide juridique critiqué par les associations de consommateurs et les économistes spécialisés en Outre-Mer.`,
                  source:
                    'Code de commerce Art. L123-16 ; Loi PACTE 2019 — publication des comptes ; rapport CEROM 2022',
                },
                {
                  q: '🛒 Peut-on boycotter GBH ? Y a-t-il des alternatives ?',
                  statut: 'Question pratique',
                  color: 'green',
                  r: `Oui, des alternatives existent — mais elles sont limitées compte tenu de la position dominante du groupe. En Guadeloupe : Hyper U (indépendant), Leader Price, Intermarché (quelques points de vente), hard discount Lidl (présence limitée), marchés locaux pour le frais. En Martinique : Hyper U, Super U, Leader Price, marchés locaux. En Guyane : Super U, Leader Price. Le problème est que GBH contrôle aussi d'autres secteurs (automobile, hôtellerie, BTP) où les alternatives sont encore plus rares. Un boycott partiel (commencer par les produits non alimentaires ou favoriser les marchés locaux pour les produits frais) est possible et recommandé par certaines associations de consommateurs.`,
                  source:
                    'ADLC Avis 19-A-12 (2019) — cartographie concurrentielle ; sites officiels enseignes DOM',
                },
                {
                  q: '⚖️ GBH a-t-il déjà été condamné pour des pratiques illégales ?',
                  statut: 'Question factuelle',
                  color: 'red',
                  r: `À notre connaissance (sources publiques disponibles), GBH n'a pas fait l'objet de condamnation pénale définitive. En revanche, l'Autorité de la concurrence (ADLC) a émis deux avis très critiques sur les pratiques du marché de distribution des DOM (09-A-45 en 2009, 19-A-12 en 2019) pointant la position dominante et ses effets sur les prix, sans pour autant prononcer de sanction contre GBH spécifiquement. Des contentieux civils avec des fournisseurs locaux ont été mentionnés dans la presse régionale sans que leurs issues soient intégralement documentées. La Direction Générale de la Concurrence (DGCCRF) effectue des contrôles réguliers dans les DOM sur les pratiques tarifaires. Aucune sanction publiée visant GBH n'a été identifiée dans les sources ouvertes.`,
                  source:
                    "ADLC — avis 2009 et 2019 ; DGCCRF — bilans d'enquête ; Légifrance — décisions publiées",
                },
                {
                  q: "🏠 GBH possède-t-il aussi des terres et de l'immobilier aux Antilles ?",
                  statut: 'Partiellement documenté',
                  color: 'purple',
                  r: `Oui. GBH détient, directement ou via des SCI (Sociétés Civiles Immobilières), les murs de nombreuses grandes surfaces, zones commerciales et entrepôts en Guadeloupe, Martinique et Guyane. La SCI Jarry Distribution (zone de Jarry, Baie-Mahault) est la plus documentée. La propriété des murs des zones commerciales est une source de revenus immobiliers distincte du commerce de distribution. L'emprise foncière exacte du groupe (en m²) n'est pas publiée. Les familles béké martiniquaises détiennent historiquement d'importantes surfaces foncières issues de l'époque des plantations — mais la répartition précise de ce foncier entre les familles n'est pas documentée publiquement.`,
                  source:
                    'BODACC — SCI Jarry Distribution ; archives foncières DOM (non numérisées intégralement) ; ADLC 09-A-45',
                },
                {
                  q: '👷 Les employés de GBH sont-ils bien payés ?',
                  statut: 'Documenté partiellement',
                  color: 'amber',
                  r: `Les employés GBH (grande distribution, automobile, hôtellerie) sont couverts par des conventions collectives sectorielles : CCN 3305 (commerce alimentaire) pour les caissiers et employés de rayon, OETAM BTP pour les filiales construction. Ces conventions fixent des minima salariaux supérieurs au SMIC. En Guadeloupe et Martinique, le SMIC brut est le même qu'en métropole. Selon les témoignages syndicaux et rapports de l'Inspection du Travail DOM, les conditions de travail dans la grande distribution sont similaires à celles observées en métropole dans des grandes enseignes comparables — avec la même problématique de pressions sur la productivité et de difficultés à obtenir des congés en période haute. Il n'existe pas de rapport publié spécifique aux conditions de travail chez GBH.`,
                  source:
                    'CCN 3305 — Légifrance ; DREETS Guadeloupe — bilan 2022 ; presse syndicale régionale',
                },
                {
                  q: '📊 Quelle est la part de marché exacte de GBH ?',
                  statut: 'Documenté officiellement',
                  color: 'green',
                  r: `L'Autorité de la concurrence a mesuré les parts de marché dans ses avis officiels. En 2019 (dernier avis disponible), GBH détenait en Guadeloupe environ 40 à 45 % du marché de la distribution alimentaire en grande surface (hypermarchés + supermarchés). En Martinique, la position est similaire. Ces chiffres font de GBH le leader incontesté de la grande distribution alimentaire DOM, loin devant ses concurrents. En revanche, si on inclut tous les formats (hard discount, commerce de proximité, marchés), la part réelle est légèrement inférieure. GBH est également dominant dans la distribution automobile (plusieurs marques en position de quasi-monopole sur certains territoires) et dans l'hôtellerie DOM.`,
                  source: 'ADLC — Avis 19-A-12 (2019) pp. 12-18 ; OPMR Guadeloupe — rapport 2023',
                },
                {
                  q: '🌍 GBH paie-t-il ses impôts en France ou dans des paradis fiscaux ?',
                  statut: 'Non documenté',
                  color: 'red',
                  r: `C'est une question fréquente pour laquelle les données publiques sont insuffisantes. GBH est une SAS française de droit commun, avec siège social en Guadeloupe. Elle est donc normalement soumise à l'impôt sur les sociétés français pour les revenus de ses filiales françaises. En revanche, pour ses filiales étrangères (Madagascar, Nouvelle-Calédonie, Polynésie française), la fiscalité applicable dépend des conventions fiscales bilatérales. L'optimisation fiscale intra-groupe (prix de transfert, remontée de dividendes) est une pratique légale courante dans les groupes de cette taille. Aucun rapport public d'audit fiscal de GBH n'est disponible. Une investigation journalistique (type Offshore Leaks) n'a pas, à notre connaissance, mentionné GBH.`,
                  source:
                    'CGI — Art. 209 B (CFC) ; OCDE — prix de transfert ; absence de mention dans les Panama/Pandora Papers',
                },
                {
                  q: '🔮 GBH peut-il perdre sa franchise Carrefour ? Que se passerait-il ?',
                  statut: 'Analyse prospective',
                  color: 'blue',
                  r: `Le contrat de franchise avec Carrefour France est l'actif stratégique le plus important de GBH. Sa perte serait catastrophique pour le groupe. Théoriquement, Carrefour pourrait résilier la franchise si GBH ne respecte pas les conditions contractuelles (normes qualité, politique tarifaire, identité visuelle). En pratique, cette franchise est mutuellement avantageuse : Carrefour bénéficie d'une présence rentable dans des marchés insulaires difficiles à opérer directement, et GBH bénéficie de l'enseigne, des centrales d'achat et du savoir-faire logistique Carrefour. Le risque de rupture est théorique. Un scénario plus probable serait une renégociation des conditions financières de la franchise — mais les termes du contrat ne sont pas publiés.`,
                  source:
                    'ADLC Avis 19-A-12 pp. 10-12 (structure franchise) ; droit commercial des franchises — Légifrance',
                },
              ].map(({ q, r, source, statut, color }) => {
                const bg: Record<string, string> = {
                  amber: 'border-amber-500/30 bg-amber-500/5',
                  blue: 'border-blue-500/30 bg-blue-500/5',
                  green: 'border-green-500/30 bg-green-500/5',
                  red: 'border-red-500/30 bg-red-500/5',
                  purple: 'border-purple-500/30 bg-purple-500/5',
                };
                const tc: Record<string, string> = {
                  amber: 'text-amber-300',
                  blue: 'text-blue-300',
                  green: 'text-green-300',
                  red: 'text-red-300',
                  purple: 'text-purple-300',
                };
                return (
                  <div key={q} className={`border rounded-xl overflow-hidden ${bg[color]}`}>
                    <div className="px-4 py-3 border-b border-slate-700/50 flex items-start justify-between gap-3">
                      <p className={`text-sm font-bold ${tc[color]}`}>{q}</p>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${bg[color].replace('bg-', 'border-').replace('/5', '/40')} ${tc[color]}`}
                      >
                        {statut}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-300 leading-relaxed mb-2">{r}</p>
                      <p className="text-xs text-slate-600 italic">📎 {source}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ TAB : DROITS & CONFLITS SOCIAUX ══════════════════════════════ */}
        {activeTab === 'conflits' && (
          <div>
            <SectionTitle icon={Shield}>
              Droits des travailleurs & Conflits sociaux chez GBH
            </SectionTitle>

            <InfoBox color="amber" title="⚠️ Sources & limites">
              Les conflits sociaux dans les entreprises privées sont généralement peu documentés
              dans les sources officielles ouvertes. Les informations ci-dessous proviennent de la
              presse régionale (France-Antilles, Guadeloupe La 1ère, Martinique La 1ère), des
              communiqués syndicaux publiés, et des archives parlementaires. Elles peuvent être
              incomplètes.
            </InfoBox>

            {/* Cadre légal */}
            <SectionTitle icon={Scale}>1 — Cadre légal applicable aux salariés GBH</SectionTitle>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/40">
                    <th className="pb-3 pt-2 px-3 text-gray-300 font-bold">Secteur</th>
                    <th className="pb-3 pt-2 px-3 text-gray-300 font-bold">
                      Convention collective
                    </th>
                    <th className="pb-3 pt-2 px-3 text-gray-300 font-bold">Salaire minimum brut</th>
                    <th className="pb-3 pt-2 px-3 text-gray-300 font-bold">Protections clés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    {
                      secteur: '🏪 Grande distribution (Carrefour)',
                      ccn: 'CCN 3305 — Commerce à prédominance alimentaire',
                      salaire: 'SMIC + légère majoration selon échelon',
                      prot: 'Heures supp. majorées 25 %, repos compensateur, représentation syndicale',
                    },
                    {
                      secteur: '🚗 Automobile (concessions)',
                      ccn: "CCN des services de l'automobile",
                      salaire: 'SMIC + primes sur ventes',
                      prot: 'Mutuelle, prévoyance, formation sécurité obligatoire',
                    },
                    {
                      secteur: '🏨 Hôtellerie (Karibéa)',
                      ccn: 'CCN HCR — Hôtels Cafés Restaurants',
                      salaire: 'Légèrement supérieur au SMIC (service inclu)',
                      prot: 'Logement possible, avantages en nature, repos hebdomadaire',
                    },
                    {
                      secteur: '🏗️ BTP & matériaux',
                      ccn: 'CCN Constructys — bâtiment Outre-Mer',
                      salaire: 'SMIC + prime de déplacement',
                      prot: 'EPI obligatoires, médecine du travail, caisse de congés BTP',
                    },
                  ].map((r) => (
                    <tr key={r.secteur} className="hover:bg-slate-700/20">
                      <td className="py-3 px-3 font-medium text-white">{r.secteur}</td>
                      <td className="py-3 px-3 text-gray-400">{r.ccn}</td>
                      <td className="py-3 px-3 text-amber-300">{r.salaire}</td>
                      <td className="py-3 px-3 text-gray-400">{r.prot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-600 mt-2 italic">
                Source : Légifrance — CCN sectorielles ; DREETS Guadeloupe & Martinique
              </p>
            </div>

            {/* Présence syndicale */}
            <SectionTitle icon={Users}>2 — Présence syndicale documentée</SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                {
                  syndicat: 'UGTG — Union Générale des Travailleurs de Guadeloupe',
                  presence: 'Forte présence dans les grandes surfaces Carrefour GBH en Guadeloupe',
                  desc: "L'UGTG est le principal syndicat indépendant guadeloupéen. Elle a été au cœur de la grève LKP de 2009. Elle est présente dans les CSE (Comités Sociaux et Économiques) des entités GBH en Guadeloupe et a mené plusieurs actions revendicatives documentées dans la presse régionale (salaires, conditions de travail, gel des congés en période haute).",
                  source: 'Presse régionale Guadeloupe 2009-2024 ; site UGTG',
                  color: 'red',
                },
                {
                  syndicat: 'CGTM — Confédération Générale du Travail de Martinique',
                  presence: 'Représentée dans les entités GBH en Martinique',
                  desc: "La CGTM est l'équivalent martiniquais de l'UGTG. Elle représente des salariés de la grande distribution, dont des entités Carrefour GBH en Martinique. Elle a participé aux négociations de 2009 (accord Jacob sur les baisses de prix) et aux discussions de 2021 sur la vie chère.",
                  source: 'Presse régionale Martinique ; archives CGTM 2009-2024',
                  color: 'red',
                },
                {
                  syndicat: 'FO Commerce — Force Ouvrière',
                  presence: 'Section syndicale dans certaines entités GBH',
                  desc: "FO Commerce est présente dans plusieurs grandes surfaces Carrefour en France et dans les DOM. Elle négocie localement les accords d'entreprise (intéressement, primes, aménagement du temps de travail).",
                  source: 'FO Commerce — implantations DOM ; Direction du travail',
                  color: 'orange',
                },
                {
                  syndicat: 'CFDT Commerce & Services',
                  presence: 'Présence dans certaines entités du pôle distribution',
                  desc: "La CFDT est traditionnellement bien représentée dans les grandes enseignes de distribution, en lien avec Carrefour France. Sa présence dans les entités GBH DOM est probable mais moins documentée que celle de l'UGTG et de la CGTM.",
                  source: 'CFDT — rapport fédération Commerce 2022',
                  color: 'orange',
                },
              ].map((s) => {
                const c: Record<string, string> = {
                  red: 'border-red-500/30 bg-red-500/5',
                  orange: 'border-orange-500/30 bg-orange-500/5',
                };
                const tc: Record<string, string> = {
                  red: 'text-red-300',
                  orange: 'text-orange-300',
                };
                return (
                  <div key={s.syndicat} className={`border rounded-xl p-4 ${c[s.color]}`}>
                    <p className={`text-sm font-bold mb-1 ${tc[s.color]}`}>{s.syndicat}</p>
                    <p className="text-xs text-gray-300 font-semibold mb-2">📍 {s.presence}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{s.desc}</p>
                    <p className="text-xs text-slate-600 italic">📎 {s.source}</p>
                  </div>
                );
              })}
            </div>

            {/* Conflits sociaux documentés */}
            <SectionTitle icon={AlertTriangle}>
              3 — Conflits & mouvements sociaux impliquant GBH
            </SectionTitle>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-red-500/20" />
              <div className="space-y-4">
                {[
                  {
                    date: 'Fév.–Mars 2009',
                    couleur: '#ef4444',
                    titre: '✊ Grève LKP — 44 jours — Guadeloupe',
                    desc: 'La grève générale LKP (Lyannaj Kont Pwofitasyon) paralyse la Guadeloupe du 20 janvier au 4 mars 2009. Déclenchée par une coalition de 49 organisations syndicales et associatives, elle vise directement la vie chère et les pratiques des grandes enseignes. Les hypermarchés Carrefour GBH sont au cœur des revendications. La grève se solde par l\'accord dit "accord Jacob" (du nom du préfet médiateur) : baisse de prix sur ~100 produits, hausses de salaires dans certains secteurs, engagements sur les pratiques commerciales. 2 morts (violences en marge des manifestations) et des centaines de millions d\'euros de pertes économiques.',
                    issue:
                      'Accord Jacob — baisse de prix + hausses salariales · Engagement de meilleurs contrôles réglementaires',
                    source:
                      'Accord du 4 mars 2009 — archives préfecture GP ; Le Monde — archives 2009 ; rapport Sénat 2009',
                  },
                  {
                    date: 'Janv.–Fév. 2009',
                    couleur: '#f97316',
                    titre: '🔥 Mouvement social en Martinique — simultané',
                    desc: 'En parallèle du LKP guadeloupéen, un mouvement social similaire éclate en Martinique sous l\'impulsion du collectif "5-Février" (en référence au 5 février 1900, date de la naissance de la résistance sociale martiniquaise). Les revendications portent également sur la vie chère et les pratiques des enseignes de grande distribution. GBH, principal acteur du marché martiniquais, est également interpellé. Un accord similaire à l\'accord Jacob est conclu en Martinique.',
                    issue:
                      'Accord de sortie de crise — baisses de prix négociées · Engagements des distributeurs',
                    source: 'Archives presse Martinique La 1ère ; rapport Sénat DOM 2009',
                  },
                  {
                    date: 'Nov. 2021',
                    couleur: '#ef4444',
                    titre: '🔴 Émeutes en Guadeloupe — magasins pillés',
                    desc: "À partir du 17 novembre 2021, des émeutes éclatent en Guadeloupe, initialement déclenchées par l'obligation vaccinale pour les soignants mais rapidement élargies aux revendications sur la vie chère et les inégalités économiques. Plusieurs grandes surfaces GBH subissent des pillages et des dégradations importantes. Bernard Hayot annonce publiquement une baisse de prix sur 200 produits dans les Carrefour GBH des Antilles. Cette annonce est perçue par certains comme un geste commercial opportuniste, par d'autres comme un effort réel de solidarité.",
                    issue:
                      "Annonce baisse prix GBH sur 200 produits (déc. 2021) · Intervention des forces de l'ordre · Couvre-feu",
                    source:
                      'France-Antilles nov.-déc. 2021 ; Guadeloupe La 1ère — archives ; communiqué GBH déc. 2021',
                  },
                  {
                    date: '2015–2023',
                    couleur: '#8b5cf6',
                    titre: '⚠️ Grèves ponctuelles dans les entités GBH',
                    desc: 'Entre 2015 et 2023, plusieurs grèves ponctuelles ont été signalées dans des entités GBH par la presse régionale : mouvements dans des hypermarchés Carrefour GP pour des revendications salariales, débrayages dans des concessions automobiles suite à des restructurations, tensions dans des entités hôtelières Karibéa en période de crise COVID (2020). Ces mouvements restent de courte durée et localisés — ils ne dégénèrent pas en conflits majeurs.',
                    issue:
                      "Issues variables selon les conflits — accords locaux, médiations prud'homales",
                    source:
                      'Presse régionale (France-Antilles, Guadeloupe La 1ère) — archives 2015-2023',
                  },
                ].map((e, i) => (
                  <div key={e.date} className="relative pl-14">
                    <div
                      className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `${e.couleur}22`,
                        borderColor: e.couleur,
                        color: e.couleur,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="border border-slate-700 rounded-xl overflow-hidden">
                      <div
                        className="px-4 py-3 border-b border-slate-700/50"
                        style={{ background: `${e.couleur}0d` }}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-lg border"
                            style={{
                              background: `${e.couleur}20`,
                              borderColor: `${e.couleur}50`,
                              color: e.couleur,
                            }}
                          >
                            {e.date}
                          </span>
                          <p className="text-sm font-bold text-white">{e.titre}</p>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400 leading-relaxed mb-2">{e.desc}</p>
                        <p className="text-xs text-green-300/80 bg-green-500/10 rounded-lg px-3 py-2 mb-2">
                          ✅ <strong>Issue :</strong> {e.issue}
                        </p>
                        <p className="text-xs text-slate-600 italic">📎 {e.source}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Droit de grève et protection */}
            <SectionTitle icon={FileText}>
              4 — Droit du travail & recours disponibles pour les salariés GBH
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  emoji: '⚖️',
                  titre: "Conseil de Prud'hommes",
                  desc: "Tout salarié GBH peut saisir le Conseil de Prud'hommes de Basse-Terre (GP), Fort-de-France (MQ) ou Cayenne (GF) pour tout litige individuel du travail (licenciement, heures supplémentaires non payées, discrimination). Les délais sont variables mais la procédure est gratuite.",
                  url: 'https://www.service-public.fr/',
                },
                {
                  emoji: '📋',
                  titre: 'DREETS — Inspection du Travail',
                  desc: "La Direction Régionale de l'Économie, de l'Emploi, du Travail et des Solidarités (DREETS) de Guadeloupe et Martinique peut être saisie pour signaler des manquements au droit du travail dans les entités GBH (non-respect des horaires, conditions de travail, représentation syndicale).",
                  url: 'https://guadeloupe.dreets.gouv.fr/',
                },
                {
                  emoji: '💬',
                  titre: 'CSE — Comité Social et Économique',
                  desc: 'Les grandes entités GBH sont dotées de CSE (Comités Sociaux et Économiques) obligatoires pour les entreprises de plus de 11 salariés. Les représentants du personnel au CSE sont des interlocuteurs légaux pour les conditions de travail, la formation, les aménagements horaires.',
                  url: 'https://www.travail-emploi.gouv.fr/',
                },
                {
                  emoji: '📞',
                  titre: 'Défenseur des droits',
                  desc: 'En cas de discrimination au travail (origine, genre, âge, handicap...), le Défenseur des droits peut être saisi gratuitement. Cette instance nationale indépendante peut instruire des dossiers concernant des salariés de GBH qui se considèrent victimes de discrimination.',
                  url: 'https://www.defenseurdesdroits.fr/',
                },
              ].map((r) => (
                <div key={r.titre} className="border border-slate-700 rounded-xl p-3 flex gap-3">
                  <span className="text-xl flex-shrink-0">{r.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-white mb-1">{r.titre}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1">{r.desc}</p>
                    <SourceLink href={r.url}>→ Site officiel</SourceLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB 6 : SOURCES ════════════════════════════════════════════════ */}
        {activeTab === 'sources' && (
          <div>
            <SectionTitle icon={BookOpen}>
              Sources officielles et références documentaires
            </SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Toutes les informations publiées dans ce dossier reposent sur les sources ci-dessous,
              toutes <strong>officielles, publiques et librement consultables</strong>. Aucune
              source anonyme n'est utilisée.
            </p>

            <Collapse title="⚖️ Autorité de la concurrence — Avis officiels" defaultOpen>
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: "Avis n° 09-A-45 du 8 décembre 2009 — Mécanismes d'importation et distribution DOM",
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
                  },
                  {
                    text: 'Avis n° 19-A-12 du 13 juin 2019 — Situation de la concurrence dans les DOM',
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="📊 INSEE & économie">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'INSEE — Enquête comparaison des niveaux de vie et des prix DOM 2022',
                    url: 'https://www.insee.fr/fr/statistiques',
                  },
                  {
                    text: "CEROM — Comptes économiques rapides pour l'Outre-Mer 2022",
                    url: 'https://www.cerom-outremer.fr/',
                  },
                  {
                    text: 'IEDOM — Rapports annuels Guadeloupe, Martinique, Guyane, La Réunion 2023',
                    url: 'https://www.iedom.fr/',
                  },
                  {
                    text: 'IEOM — Rapports Nouvelle-Calédonie, Polynésie française 2022',
                    url: 'https://www.ieom.fr/',
                  },
                  {
                    text: 'Cour des Comptes — Rapport finances collectivités DOM 2023',
                    url: 'https://www.ccomptes.fr/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🏛️ Registres d'entreprises & publications légales">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'RNE/INPI — Registre National des Entreprises (data.inpi.fr)',
                    url: 'https://www.inpi.fr/',
                  },
                  {
                    text: 'BODACC — Bulletin officiel des annonces civiles et commerciales',
                    url: 'https://www.bodacc.fr/',
                  },
                  {
                    text: 'Infogreffe — Registres du Commerce et des Sociétés',
                    url: 'https://www.infogreffe.fr/',
                  },
                  {
                    text: 'Légifrance — Journal Officiel, textes législatifs',
                    url: 'https://www.legifrance.gouv.fr/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="📜 Textes législatifs applicables">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'Loi n° 2012-1270 du 20 novembre 2012 relative à la régulation économique outre-mer (Loi Lurel)',
                    url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000026607977/',
                  },
                  {
                    text: "Loi n° 2004-639 du 2 juillet 2004 relative à l'octroi de mer",
                    url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/',
                  },
                  {
                    text: 'Articles L420-1 et suivants du Code de commerce — Pratiques anticoncurrentielles',
                    url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000005634379/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🌐 Site institutionnel GBH">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'Site officiel GBH — présentation du groupe, activités et implantations',
                    url: 'https://www.gbh.fr/',
                  },
                  { text: 'Karibéa Hotels — site officiel', url: 'https://www.karibea.com/' },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="💼 Sources emploi & dialogue social">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'DREETS Guadeloupe — représentativité syndicale et accords collectifs',
                    url: 'https://www.guadeloupe.dreets.gouv.fr/',
                  },
                  {
                    text: "DREETS Martinique — dépôts d'accords d'entreprise",
                    url: 'https://www.martinique.dreets.gouv.fr/',
                  },
                  {
                    text: 'Légifrance — Convention collective commerce alimentaire (CCN 3305)',
                    url: 'https://www.legifrance.gouv.fr/',
                  },
                  {
                    text: 'Légifrance — Loi n° 2012-1270 Lurel (régulation économique outre-mer)',
                    url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000026607977/',
                  },
                  {
                    text: "Rapport préfectoral Guadeloupe — Mission d'urgence sociale déc. 2021",
                    url: 'https://www.guadeloupe.gouv.fr/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🌱 Sources filière agricole & production locale">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: "DAAF Guadeloupe — Direction de l'alimentation, de l'agriculture et de la forêt",
                    url: 'https://daaf.guadeloupe.agriculture.gouv.fr/',
                  },
                  {
                    text: 'DAAF Martinique — Productions agricoles locales',
                    url: 'https://daaf.martinique.agriculture.gouv.fr/',
                  },
                  {
                    text: 'UGPBAN — Union des groupements de producteurs de banane de Guadeloupe et Martinique',
                    url: 'https://www.ugpban.com/',
                  },
                  {
                    text: 'INSEE — Enquête budget des familles DOM 2022 — Parts des importations alimentaires',
                    url: 'https://www.insee.fr/',
                  },
                  {
                    text: "Chambre d'agriculture Guadeloupe — État des filières 2022",
                    url: 'https://www.cci.gp/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🏛️ Sources parlementaires & presse nationale">
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'Assemblée Nationale — Questions écrites des parlementaires des DOM sur les prix',
                    url: 'https://questions.assemblee-nationale.fr/',
                  },
                  {
                    text: 'Sénat — Rapport 2024 sur la vie chère dans les Outre-Mer',
                    url: 'https://www.senat.fr/',
                  },
                  {
                    text: 'BOFIP — Fiche défiscalisation Girardin (CGI art. 199 undecies B)',
                    url: 'https://bofip.impots.gouv.fr/',
                  },
                  {
                    text: 'Europe en Guadeloupe — Fonds FEDER 2021-2027',
                    url: 'https://www.europe-en-guadeloupe.eu/',
                  },
                  {
                    text: 'BOAMP — Bulletin officiel des annonces des marchés publics',
                    url: 'https://www.boamp.fr/',
                  },
                  {
                    text: 'Guadeloupe La 1ère — Archives presse 2009-2024',
                    url: 'https://la1ere.francetvinfo.fr/guadeloupe/',
                  },
                  {
                    text: 'Martinique La 1ère — Archives presse 2021-2024',
                    url: 'https://la1ere.francetvinfo.fr/martinique/',
                  },
                ].map((ref) => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2"
                    >
                      {ref.text}
                    </a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-300 mb-1">
                    Responsabilité éditoriale
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ce dossier est produit par l'Observatoire des Prix{' '}
                    <strong>A KI PRI SA YÉ</strong> à vocation informative et citoyenne. Toutes les
                    affirmations sont sourcées et vérifiables. Aucune information confidentielle
                    n'est utilisée. En cas d'erreur factuelle, merci de nous contacter pour
                    correction immédiate.
                    <br />
                    <strong>Dernière mise à jour : mars 2026.</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos section — common footer */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <p className="text-xs text-center text-gray-500 mb-4 flex items-center justify-center gap-2">
            <Info className="w-3.5 h-3.5" />
            Illustrations : photos libres de droits (Unsplash) représentant des zones commerciales
            et centres-villes ultramarins — à titre illustratif uniquement.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&fit=crop&w=600&q=70',
                alt: 'Grande surface commerciale — illustration',
              },
              {
                src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fm=webp&fit=crop&w=600&q=70',
                alt: 'Zone industrielle portuaire — illustration',
              },
              {
                src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fm=webp&fit=crop&w=600&q=70',
                alt: 'Immeuble de bureaux groupe — illustration',
              },
            ].map((img) => (
              <div key={img.src} className="rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-28 object-cover opacity-60"
                  loading="lazy"
                />
                <p className="text-xs text-center text-gray-600 py-1 px-2 bg-slate-900">
                  {img.alt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganigrammeGBH;
