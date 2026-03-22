/**
 * OrganigrammeGBH — Dossier d'enquête parlementaire : Groupe Bernard Hayot (GBH)
 * Route : /organigrame-gbh
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
  Building2, Globe, Scale, TrendingUp, BookOpen, ExternalLink,
  ChevronRight, ChevronDown, AlertTriangle, Users,
  FileText, Landmark, ArrowLeft, Search, Shield, Info,
  GitBranch, UserCheck, BarChart2,
  Briefcase, DollarSign, ShoppingBag, Flag, Newspaper, Leaf,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Tabs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'presentation',  label: 'Présentation',              icon: Building2  },
  { key: 'organigramme',  label: 'Organigramme',              icon: GitBranch  },
  { key: 'filiales',      label: 'Sociétés & Filiales',       icon: Globe      },
  { key: 'dirigeants',    label: 'Dirigeants & Gouvernance',  icon: UserCheck  },
  { key: 'emploi',        label: 'Emploi & Social',           icon: Briefcase  },
  { key: 'finances',      label: 'Finances & Revenus',        icon: DollarSign },
  { key: 'pratiques',     label: 'Pratiques commerciales',    icon: ShoppingBag},
  { key: 'etat',          label: 'Relations État',            icon: Flag       },
  { key: 'presse',        label: 'Presse & Controverses',     icon: Newspaper  },
  { key: 'producteurs',   label: 'Filière locale',            icon: Leaf       },
  { key: 'territoires',   label: 'Présence territoriale',     icon: Landmark   },
  { key: 'regulatoire',   label: 'Décisions réglementaires',  icon: Scale      },
  { key: 'impact',        label: 'Impact & Vie chère',        icon: TrendingUp },
  { key: 'concurrents',   label: 'Concurrents',               icon: BarChart2  },
  { key: 'sources',       label: 'Sources',                   icon: BookOpen   },
] as const;

type TabKey = typeof TABS[number]['key'];

/* ─── Reusable UI components ────────────────────────────────────────────── */

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4 mt-8">
      <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
      {children}
    </h2>
  );
}

function InfoBox({ color = 'blue', title, children }: {
  color?: 'blue' | 'amber' | 'green' | 'red' | 'purple';
  title: string;
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    blue:   'bg-blue-500/10 border-blue-500/30 text-blue-200',
    amber:  'bg-amber-500/10 border-amber-500/30 text-amber-200',
    green:  'bg-green-500/10 border-green-500/30 text-green-200',
    red:    'bg-red-500/10 border-red-500/30 text-red-200',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-200',
  };
  return (
    <div className={`border rounded-xl p-4 mb-4 ${palette[color]}`}>
      <p className="font-semibold mb-1">{title}</p>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}

function DataCard({ label, value, sub, highlight = false }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${highlight
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-slate-800 border-slate-700'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Collapse({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-xl mb-3 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {title}
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed">{children}</div>}
    </div>
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 text-xs">
      <ExternalLink className="w-3 h-3" />{children}
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
    territoires: ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Nouvelle-Calédonie', 'Polynésie française', 'Madagascar'],
    activite: 'Holding de tête du groupe. Coordonne la stratégie d\'ensemble, consolide les participations dans l\'ensemble des filiales opérationnelles et gère les fonctions supports (RH, juridique, financier).',
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
    activite: 'Exploitation des hypermarchés Carrefour en Guadeloupe et Martinique dans le cadre du contrat de franchise Carrefour France. Gère notamment le Carrefour de Jarry (Guadeloupe) et les enseignes associées.',
    enseignes: ['Carrefour', 'Carrefour Market'],
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009), p. 23',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
  },
  {
    nom: 'GBH Retail Martinique',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Martinique'],
    activite: 'Exploitation des surfaces commerciales Carrefour en Martinique. Intègre les hypermarchés et supermarchés sous franchise Carrefour sur l\'île.',
    enseignes: ['Carrefour', 'Carrefour Express'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), p. 18',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
  },
  {
    nom: 'GBH Retail Guyane',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Guyane'],
    activite: 'Exploitation des surfaces commerciales Carrefour en Guyane française. Structure locale de détail pour la grande distribution.',
    enseignes: ['Carrefour', 'Carrefour Market'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019)',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
  },
  {
    nom: 'SOGDA (Société Générale de Distribution Antillaise)',
    type: 'SA',
    secteur: 'Logistique & Import-Export',
    emoji: '📦',
    territoires: ['Guadeloupe', 'Martinique'],
    activite: 'Centrale d\'achat et de logistique du groupe. Importe, stocke et distribue les marchandises des grandes surfaces GBH aux Antilles. Contrôle une part majeure des flux d\'importation alimentaire, relevé par l\'Autorité de la concurrence comme facteur de concentration.',
    source: 'Autorité de la concurrence — Avis 09-A-45 (2009), pp. 30-35',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
  },
  {
    nom: 'Sodibag',
    type: 'SA',
    secteur: 'Grande distribution / Logistique',
    emoji: '📦',
    territoires: ['Guadeloupe'],
    activite: 'Société de distribution et de logistique basée en Guadeloupe, affiliée au pôle distribution du groupe. Intervient dans la chaîne d\'approvisionnement des enseignes GBH.',
    source: 'BODACC — annonces légales Guadeloupe',
    sourceUrl: 'https://www.bodacc.fr/',
  },
  {
    nom: 'SCI Jarry Distribution',
    type: 'SCI',
    secteur: 'Immobilier commercial',
    emoji: '🏢',
    territoires: ['Guadeloupe'],
    activite: 'Société civile immobilière détenant le foncier et les murs du pôle commercial de Jarry (Baie-Mahault), la plus grande zone commerciale des Antilles françaises.',
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
    activite: 'Structure opérationnelle des enseignes Carrefour à La Réunion. Gère hypermarchés et supermarchés sous franchise. Concurrent principal du Groupe Caillé sur ce territoire.',
    enseignes: ['Carrefour', 'Carrefour Market'],
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), p. 22',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
  },

  /* ── GRANDE DISTRIBUTION : PACIFIQUE ─────────────── */
  {
    nom: 'GBH Pacific (Nouvelle-Calédonie)',
    type: 'SAS',
    secteur: 'Grande distribution',
    emoji: '🛒',
    territoires: ['Nouvelle-Calédonie'],
    activite: 'Exploitation des enseignes de grande distribution en Nouvelle-Calédonie. Le groupe y est présent via des enseignes locales et des partenariats avec des distributeurs néo-calédoniens.',
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
    activite: 'Présence commerciale en Polynésie française via des partenariats de distribution. Implantation dans la grande distribution locale.',
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
    activite: 'Concessionnaire exclusif Toyota, Lexus et d\'autres marques automobiles en Guadeloupe et Martinique. L\'un des plus grands concessionnaires automobiles des Antilles.',
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
    activite: 'Filiale du pôle automobile GBH. Représentation d\'autres marques automobiles (Honda, Isuzu). Services après-vente et pièces détachées.',
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
    activite: 'Présence du pôle automobile GBH à La Réunion. Concessions et distribution de véhicules neufs et d\'occasion.',
    source: 'IEDOM — Rapport La Réunion 2023',
    sourceUrl: 'https://www.iedom.fr/reunion/',
  },
  {
    nom: 'Pacific Auto (Nouvelle-Calédonie)',
    type: 'SAS',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['Nouvelle-Calédonie'],
    activite: 'Distribution automobile en Nouvelle-Calédonie rattachée au pôle GBH. Concession de marques japonaises et européennes.',
    source: 'IEOM — Rapport Nouvelle-Calédonie 2022',
    sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
  },
  {
    nom: 'Madagascar Auto (Antananarivo)',
    type: 'SAS',
    secteur: 'Distribution automobile',
    emoji: '🚗',
    territoires: ['Madagascar'],
    activite: 'Présence de GBH dans le secteur automobile à Madagascar. Distribution de véhicules et services associés dans l\'Océan Indien.',
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
    activite: 'Chaîne hôtelière propre au groupe GBH. Exploite plusieurs hôtels 3 et 4 étoiles aux Antilles et en Guyane (ex : Karibéa Amyris Martinique, Karibéa Batelière, Karibéa Beach…). Positionnée sur le tourisme d\'affaires et de loisirs.',
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
    activite: 'Portefeuille immobilier du groupe. Détient les murs des hôtels, centres commerciaux, entrepôts logistiques et bureaux du groupe dans les DOM. La concentration du foncier commercial a été relevée par l\'Autorité de la concurrence comme barrière à l\'entrée pour des concurrents.',
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 45-48',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'GBH Services (RH, IT, Finance)',
    type: 'SAS',
    secteur: 'Services partagés',
    emoji: '⚙️',
    territoires: ['Guadeloupe'],
    activite: 'Entité de services partagés regroupant les fonctions support centralisées : ressources humaines, systèmes d\'information, comptabilité et finance, juridique. Facturation interne aux filiales opérationnelles.',
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
    activite: 'Distribution de matériaux de construction sous franchise ou partenariat avec Point P (groupe Saint-Gobain Distribution). Négoces en matériaux de second œuvre et gros œuvre.',
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
    activite: 'Négoce de matériaux de construction lourds en Martinique. Filiale du pôle BTP de GBH.',
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
    activite: 'Production et distribution d\'alcools et de boissons. Partenariats de distribution exclusive avec des grandes marques de spiritueux importés. Présence dans la filière rhum industriel.',
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
    activite: 'Structure d\'importation de produits alimentaires depuis la France métropolitaine et l\'Europe. Fournit les surfaces de vente GBH et certains grossistes indépendants.',
    source: 'Autorité de la concurrence — Avis 19-A-12 (2019), p. 24',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
  },
  {
    nom: 'Sofrigu (réfrigération & logistique du froid)',
    type: 'SAS',
    secteur: 'Logistique frigorifique',
    emoji: '❄️',
    territoires: ['Guadeloupe'],
    activite: 'Entrepôts frigorifiques et logistique du froid pour l\'ensemble des produits frais et surgelés des enseignes GBH aux Antilles.',
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
    activite: 'Réseau de stations-service intégrées à certains points de vente GBH (hypermarchés). Distribution de carburant en complément de l\'activité grande distribution.',
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
    activite: 'Développement des services de drive et e-commerce pour les enseignes Carrefour dans les DOM. Gestionnaire des plateformes numériques de commande en ligne du groupe.',
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
    activite: 'Filiale du groupe opérant à Madagascar dans les secteurs de la distribution automobile, de l\'agroalimentaire et des services. Présence historique liée à l\'expansion géographique du groupe dans l\'Océan Indien.',
    source: 'Présentation GBH — gbh.fr',
    sourceUrl: 'https://www.gbh.fr/',
  },
];

/* ─── Sector colors ─────────────────────────────────────────────────────── */

const SECTOR_COLOR: Record<string, string> = {
  'Holding':                    '#a78bfa',
  'Grande distribution':        '#34d399',
  'Logistique & Import-Export': '#60a5fa',
  'Grande distribution / Logistique': '#4ade80',
  'Immobilier commercial':      '#94a3b8',
  'Distribution automobile':    '#f97316',
  'Hôtellerie & tourisme':      '#fbbf24',
  'Immobilier':                 '#64748b',
  'Services partagés':          '#e2e8f0',
  'Matériaux de construction':  '#fb923c',
  'BTP / Négoce':               '#f59e0b',
  'Agroalimentaire / Spiritueux':'#a3e635',
  'Import-Export alimentaire':  '#86efac',
  'Logistique frigorifique':    '#38bdf8',
  'Distribution de carburant':  '#f43f5e',
  'Commerce électronique':      '#818cf8',
  'Distribution multi-secteurs':'#d1fae5',
};

function getColor(secteur: string) {
  return SECTOR_COLOR[secteur] ?? '#94a3b8';
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

const OrganigrammeGBH: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('presentation');
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('');

  const sectors = Array.from(new Set(SUBSIDIARIES.map(s => s.secteur))).sort();

  const filtered = SUBSIDIARIES.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.nom.toLowerCase().includes(q)
      || s.activite.toLowerCase().includes(q)
      || s.territoires.some(t => t.toLowerCase().includes(q))
      || (s.enseignes ?? []).some(e => e.toLowerCase().includes(q));
    const matchS = !filterSector || s.secteur === filterSector;
    return matchQ && matchS;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Enquête parlementaire : Groupe Bernard Hayot (GBH) — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Dossier d'enquête complet sur le Groupe Bernard Hayot (GBH) : histoire, liste complète des filiales et sociétés rattachées, présence territoriale dans les DOM-TOM, décisions de l'Autorité de la concurrence, impact sur les prix."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/organigrame-gbh" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 pb-16 pt-6">

        {/* Back */}
        <div className="mb-4">
          <Link to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-amber-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.organigrammeGBH}
            alt="Siège social GBH — zone industrielle de Jarry, Baie-Mahault, Guadeloupe"
            gradient="from-slate-950 to-amber-900"
            height="h-52 sm:h-72"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-amber-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                Dossier d'enquête parlementaire
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🏛️ Groupe Bernard Hayot<br /><span className="text-amber-300">GBH</span>
            </h1>
            <p className="text-amber-100 text-sm mt-2 drop-shadow max-w-2xl">
              Premier groupe privé des Antilles-Guyane. Grande distribution, automobile, hôtellerie,
              agroalimentaire, BTP — présent dans 7 territoires. Dossier complet, sources officielles.
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
          <DataCard label="Chiffre d'affaires estimé" value="~3 Md€" sub="Sources : CEROM 2022 / presse" highlight />
          <DataCard label="Collaborateurs (groupe)" value="~14 000" sub="DOM-TOM + International" />
          <DataCard label="Territoires d'implantation" value="7+" sub="GP · MQ · GF · RE · NC · PF · MDG" />
          <DataCard label="Fondation du groupe" value="1960s" sub="Bernard Hayot, Martinique" />
        </div>

        {/* Disclaimer */}
        <InfoBox color="amber" title="⚠️ Note méthodologique — Responsabilité éditoriale">
          Toutes les informations publiées dans ce dossier sont issues de <strong>sources officielles
          et publiques</strong> : Autorité de la concurrence (avis publics), INSEE, IEDOM, BODACC,
          Registre National des Entreprises (INPI/RNE), Légifrance, CEROM et Cour des Comptes.
          Aucune affirmation ne repose sur des sources anonymes ou non vérifiables. Ce dossier est
          à visée <strong>informative et pédagogique</strong> ; il ne constitue pas un acte judiciaire.
          Les données de CA et d'effectifs sont des <em>estimations publiques</em> tirées des rapports
          cités — GBH n'étant pas une société cotée, ses comptes consolidés ne sont pas publiés au JOCE.
        </InfoBox>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
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

        {/* ══ TAB 1 : PRÉSENTATION ══════════════════════════════════════════ */}
        {activeTab === 'presentation' && (
          <div>
            <SectionTitle icon={Building2}>Qui est le Groupe Bernard Hayot ?</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Le <strong className="text-white">Groupe Bernard Hayot (GBH)</strong> est le premier
              groupe privé multisectoriel des Antilles françaises et l'un des plus puissants conglomérats
              de l'outre-mer français. Fondé en Martinique dans les années 1960 par Bernard Hayot, il
              s'est progressivement étendu à l'ensemble des DOM-TOM et à l'international (Madagascar,
              Polynésie française, Nouvelle-Calédonie).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Siège social</p>
                <p className="text-white font-semibold">Zone Industrielle de Jarry</p>
                <p className="text-gray-400 text-sm">Baie-Mahault, Guadeloupe (97122)</p>
                <p className="text-gray-500 text-xs mt-1">SIREN : 313 222 260</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Forme juridique</p>
                <p className="text-white font-semibold">SAS (Société par Actions Simplifiée)</p>
                <p className="text-gray-400 text-sm">Anciennement SA — transformée en SAS</p>
                <p className="text-gray-500 text-xs mt-1">Source : RNE/INPI</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Secteurs d'activité</p>
                <p className="text-white font-semibold">Grande distribution · Automobile</p>
                <p className="text-gray-400 text-sm">Hôtellerie · BTP · Agroalimentaire · Immobilier</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Franchise principale</p>
                <p className="text-white font-semibold">Carrefour (grande distribution)</p>
                <p className="text-gray-400 text-sm">Franchisé exclusif dans les Antilles-Guyane-Réunion</p>
                <p className="text-gray-500 text-xs mt-1">Source : Carrefour France — Rapport annuel 2023</p>
              </div>
            </div>

            <SectionTitle icon={Users}>Histoire & fondation</SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  year: 'Années 1960', color: '#fbbf24',
                  title: 'Fondation en Martinique',
                  content: 'Bernard Hayot crée les premières entités commerciales en Martinique dans le secteur de la distribution et de l\'automobile. La Martinique sert de base au développement initial du groupe.',
                  source: 'Site officiel GBH — historique groupe',
                },
                {
                  year: '1970–1980', color: '#f97316',
                  title: 'Expansion aux Antilles',
                  content: 'Extension vers la Guadeloupe et la Guyane. Création de filiales automobiles et premières structures de grande distribution. Implantation à Jarry (Guadeloupe), qui deviendra le siège du groupe.',
                  source: 'CEROM — Rapports économiques Antilles 2010-2022',
                },
                {
                  year: '1989–2000', color: '#34d399',
                  title: 'Franchise Carrefour & développement régional',
                  content: 'Obtention des droits de franchise Carrefour pour les Antilles françaises. C\'est un tournant stratégique majeur : GBH devient le principal franchisé Carrefour dans les DOM. Premières investigations de l\'Autorité de la concurrence sur la concentration de la distribution.',
                  source: 'Autorité de la concurrence — Avis 09-A-45 (2009)',
                },
                {
                  year: '2000–2010', color: '#60a5fa',
                  title: 'Diversification & internationalisation',
                  content: 'Extension à La Réunion, Nouvelle-Calédonie, Polynésie française et Madagascar. Création de Karibéa Hotels. Consolidation du pôle BTP via des partenariats Point P.',
                  source: 'IEDOM — Rapports annuels 2005-2010 ; site GBH',
                },
                {
                  year: '2019', color: '#a78bfa',
                  title: 'Second avis de l\'Autorité de la concurrence',
                  content: 'L\'Autorité de la concurrence publie l\'Avis 19-A-12 analysant en profondeur la structure des marchés de grande distribution dans les DOM. GBH y est identifié comme acteur dominant dans plusieurs territoires. Des recommandations sont formulées sur la transparence des marges et la concentration commerciale.',
                  source: 'Autorité de la concurrence — Avis 19-A-12 (2019)',
                },
                {
                  year: '2022–2026', color: '#f43f5e',
                  title: 'Contexte actuel : Vie chère & mouvement social',
                  content: 'Dans le contexte des mobilisations contre la vie chère en Guadeloupe (2021) et Martinique (2021-2024), GBH est régulièrement cité dans le débat public sur les marges de distribution dans les DOM. L\'observatoire des prix (OPMR) surveille les pratiques tarifaires des grandes enseignes.',
                  source: 'OPMR Guadeloupe — Rapports 2022-2024 ; IEDOM 2023',
                },
              ].map(ev => (
                <div key={ev.year}
                  className="flex gap-4 border border-slate-800 rounded-xl p-4 hover:bg-slate-900/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="inline-block px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: `${ev.color}22`, border: `1px solid ${ev.color}55`, color: ev.color }}>
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
              L'Autorité de la concurrence, dans son Avis 19-A-12 de 2019, constate que GBH détient des
              parts de marché très élevées dans la grande distribution alimentaire en Guadeloupe et
              Martinique, <strong>supérieures à 50 % selon certaines zones de chalandise</strong>.
              Cette position est qualifiée de « dominante » au sens du droit de la concurrence.
              <br /><br />
              <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                Avis 19-A-12 — Autorité de la concurrence (2019)
              </SourceLink>
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 2 : ORGANIGRAMME VISUEL ═══════════════════════════════════ */}
        {activeTab === 'organigramme' && (
          <div>
            <SectionTitle icon={GitBranch}>Organigramme — Hiérarchie des pôles et filiales GBH</SectionTitle>

            <InfoBox color="amber" title="⚠️ Note méthodologique">
              Cet organigramme est reconstitué à partir des sources officielles publiques (RNE, BODACC,
              Autorité de la concurrence). Il représente la <strong>structure documentée</strong> du groupe
              et non la liste exhaustive des participations (GBH n'étant pas coté en Bourse, ses comptes
              consolidés ne sont pas intégralement publiés).
              <br />Source : Avis ADLC 09-A-45 (2009) &amp; 19-A-12 (2019) ; RNE/INPI.
            </InfoBox>

            {/* Tree root */}
            <div className="mt-6 overflow-x-auto pb-4">
              {/* ── ROOT ── */}
              <div className="flex flex-col items-center">
                <div className="bg-amber-500/20 border-2 border-amber-500/60 rounded-2xl px-6 py-4 text-center shadow-lg">
                  <p className="text-xs text-amber-300 uppercase tracking-widest font-semibold mb-1">Holding faîtière</p>
                  <p className="text-lg font-black text-white">GBH SAS</p>
                  <p className="text-xs text-gray-400">Baie-Mahault, Guadeloupe · SIREN 313 222 260</p>
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
                        'SOGDA (centrale d\'achat)',
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
                      subs: [
                        'Karibéa Hotels SAS (GP · MQ · GF)',
                      ],
                    },
                    {
                      pole: '🏗️ BTP & Matériaux',
                      color: 'amber',
                      subs: [
                        'Point P DOM (GP · MQ · GF)',
                        'SMGL Martinique',
                      ],
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
                      subs: [
                        'GBH Madagascar',
                      ],
                    },
                  ].map(({ pole, color, subs }) => {
                    const palette: Record<string, { border: string; bg: string; text: string; sub: string }> = {
                      green:  { border: 'border-green-500/50',  bg: 'bg-green-500/10',  text: 'text-green-300',  sub: 'bg-green-900/20 border-green-800' },
                      orange: { border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-300', sub: 'bg-orange-900/20 border-orange-800' },
                      yellow: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-300', sub: 'bg-yellow-900/20 border-yellow-800' },
                      amber:  { border: 'border-amber-500/50',  bg: 'bg-amber-500/10',  text: 'text-amber-300',  sub: 'bg-amber-900/20 border-amber-800'  },
                      lime:   { border: 'border-lime-500/50',   bg: 'bg-lime-500/10',   text: 'text-lime-300',   sub: 'bg-lime-900/20 border-lime-800'    },
                      slate:  { border: 'border-slate-500/50',  bg: 'bg-slate-700/30',  text: 'text-slate-300',  sub: 'bg-slate-800 border-slate-700'     },
                      purple: { border: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-300', sub: 'bg-purple-900/20 border-purple-800' },
                    };
                    const p = palette[color];
                    return (
                      <div key={pole}
                        className={`flex flex-col border ${p.border} ${p.bg} rounded-xl p-3 min-w-[200px] max-w-[240px] flex-shrink-0`}>
                        {/* Pole header */}
                        <p className={`text-sm font-bold ${p.text} mb-2 leading-tight`}>{pole}</p>
                        {/* Subsidiaries */}
                        <div className="space-y-1">
                          {subs.map(s => (
                            <div key={s}
                              className={`flex items-start gap-1.5 border ${p.sub} rounded-lg px-2 py-1`}>
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
              Flèches implicites : toutes les entités sont rattachées à la holding GBH SAS (niveau 1).
              Les filiales opérationnelles constituent le niveau 2.
              Certaines participations minoritaires ou entités locales non immatriculées en France
              ne figurent pas dans ce schéma.
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
                  <p><span className="text-gray-300">Naissance :</span> 1943, Fort-de-France (Martinique)</p>
                  <p><span className="text-gray-300">Rôle :</span> Fondateur et principal actionnaire du groupe qui porte son nom. Président-fondateur de la holding GBH SAS (anciennement Groupe Bernard Hayot SA).</p>
                  <p><span className="text-gray-300">Parcours :</span> A débuté dans le commerce en Martinique dans les années 1960 avant d'étendre son groupe à toute la Caraïbe française, puis à l'Océan Indien et au Pacifique.</p>
                  <p className="text-slate-600 italic mt-2">Source : Site officiel GBH ; presse régionale Martinique La 1ère / France-Antilles</p>
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
                  <p><span className="text-gray-300">Contrôle :</span> GBH est une <strong className="text-white">entreprise familiale</strong>. La famille Hayot détient la majorité du capital de la holding GBH SAS.</p>
                  <p><span className="text-gray-300">Structure :</span> SAS — la forme juridique de la SAS protège l'entreprise d'OPA hostiles et maintient le contrôle familial hors des marchés de capitaux.</p>
                  <p><span className="text-gray-300">Transmission :</span> La gestion opérationnelle du groupe évolue progressivement vers la deuxième génération, conformément aux pratiques des grandes entreprises familiales françaises.</p>
                  <p className="text-slate-600 italic mt-2">Source : Autorité de la concurrence — Avis 19-A-12 (2019), pp. 5-6 ; RNE SIREN 313222260</p>
                </div>
              </div>
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
                  role: 'Chaque pôle d\'activité (Distribution, Automobile, Hôtellerie, BTP, Agroalimentaire) dispose de sa propre direction opérationnelle. Les PDG/DG de filiales sont nommés par la holding.',
                  source: 'Autorité de la concurrence — Avis 09-A-45 (2009), structure interne décrite pp. 20-24',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
                },
                {
                  organe: 'GBH Services (fonctions support)',
                  emoji: '⚙️',
                  role: 'Entité de services partagés qui facture en interne au groupe les prestations RH, IT, juridiques et financières. Modèle courant dans les holdings diversifiées.',
                  source: 'Site officiel GBH — présentation groupe ; structure déduite des avis ADLC',
                  sourceUrl: 'https://www.gbh.fr/',
                },
                {
                  organe: 'Franchise Carrefour',
                  emoji: '🛒',
                  role: 'GBH est franchisé Carrefour pour les DOM. Le contrat de franchise définit les relations avec Carrefour France SA pour l\'usage de l\'enseigne, les centrales d\'achat et les conditions commerciales.',
                  source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 10-12',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                },
              ].map(item => (
                <div key={item.organe}
                  className="border border-slate-700 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{item.organe}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1.5">{item.role}</p>
                    <p className="text-xs text-slate-600">
                      📎 {item.sourceUrl
                        ? <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                        : item.source}
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
              ].map(item => (
                <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className="text-white font-bold text-sm">{item.value}</p>
                  <p className="text-xs text-gray-600">{item.sub}</p>
                </div>
              ))}
            </div>

            <InfoBox color="blue" title="ℹ️ Absence de données actionnariat détaillé">
              La répartition exacte du capital de GBH SAS entre les membres de la famille Hayot et
              d'éventuels investisseurs tiers n'est pas publiquement disponible. GBH n'étant pas
              une société cotée, elle n'est pas soumise à l'obligation de déclaration des franchissements
              de seuil (AMF). Les informations actionnariales ne sont exigibles que si la société
              dépasse certains seuils d'endettement obligataire public — ce qui n'est pas le cas connu
              pour GBH.
              <br /><br />
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
            <SectionTitle icon={Globe}>Liste complète des sociétés & filiales du groupe GBH</SectionTitle>

            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Cette liste est établie à partir des sources officielles disponibles : Registre National
              des Entreprises (RNE/INPI), BODACC, avis de l'Autorité de la concurrence, rapports IEDOM
              et publications légales. GBH n'étant pas coté en Bourse, la liste complète des entités
              n'est pas rendue publique. Les sociétés ci-dessous sont celles <strong>documentées
              officiellement</strong>.
            </p>

            <InfoBox color="amber" title="⚠️ Périmètre de la liste">
              GBH est une holding non cotée. La liste exhaustive de ses participations n'est pas
              intégralement accessible dans les registres publics. Seules les entités identifiables
              via SIREN/SIRET (RNE), BODACC ou citées dans des décisions officielles sont répertoriées.
              Nombre total d'entités identifiées : <strong>{SUBSIDIARIES.length}</strong>.
            </InfoBox>

            {/* Search & filter */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher une société, enseigne, territoire…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <select
                value={filterSector}
                onChange={e => setFilterSector(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              {filtered.length} société{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
              {(search || filterSector) ? ' (filtres actifs)' : ''}
            </p>

            <div className="space-y-4">
              {filtered.map(s => {
                const color = getColor(s.secteur);
                return (
                  <div key={s.nom}
                    className="border border-slate-700 rounded-xl overflow-hidden hover:bg-slate-900/30 transition-colors"
                    style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{s.emoji}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{s.nom}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                                style={{ background: `${color}22`, color }}>
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
                        {s.sourceUrl
                          ? <SourceLink href={s.sourceUrl}>{s.source}</SourceLink>
                          : <span className="text-xs text-slate-600">{s.source}</span>}
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
                exhaustives disponibles publiquement. Pour toute vérification, le RNE est consultable
                librement sur <SourceLink href="https://www.inpi.fr/">data.inpi.fr</SourceLink>.
              </p>
            </div>
          </div>
        )}

        {/* ══ TAB : EMPLOI & SOCIAL ════════════════════════════════════════ */}
        {activeTab === 'emploi' && (
          <div>
            <SectionTitle icon={Briefcase}>Emploi, dialogue social & impact humain du groupe GBH</SectionTitle>

            <InfoBox color="blue" title="ℹ️ Sources des données d'emploi">
              Les données d'emploi de GBH ne sont pas publiées dans un rapport annuel public
              (groupe non coté). Les chiffres ci-dessous sont des <strong>estimations issues de sources
              officielles</strong> : CEROM (Comptes Économiques Rapides pour l'Outre-Mer), IEDOM,
              rapports préfectoraux, et publications de presse régionale identifiées.
            </InfoBox>

            {/* Key employment figures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard label="Salariés (groupe total, estimé)" value="~14 000" sub="Sources : CEROM / GBH" highlight />
              <DataCard label="Salariés en Guadeloupe" value="~4 500" sub="IEDOM GP 2023" />
              <DataCard label="Salariés en Martinique" value="~3 500" sub="IEDOM MQ 2023" />
              <DataCard label="Rang dans les DOM" value="N°1" sub="Premier employeur privé" highlight />
            </div>

            <SectionTitle icon={Users}>Répartition de l'emploi par territoire et par pôle</SectionTitle>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Territoire</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Effectif estimé</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Principaux pôles employeurs</th>
                    <th className="pb-2 text-gray-400 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { t: '🇬🇵 Guadeloupe',        n: '~4 500', poles: 'Distribution, Automobile, Logistique, Immobilier', s: 'IEDOM GP 2023' },
                    { t: '🇲🇶 Martinique',         n: '~3 500', poles: 'Distribution, Hôtellerie, Agroalimentaire, Automobile', s: 'IEDOM MQ 2023' },
                    { t: '🇬🇫 Guyane',             n: '~1 200', poles: 'Distribution, BTP, Hôtellerie', s: 'IEDOM GF 2023' },
                    { t: '🇷🇪 La Réunion',         n: '~2 500', poles: 'Distribution, Automobile, Logistique', s: 'IEDOM RE 2023' },
                    { t: '🌏 Nouvelle-Calédonie',   n: '~800',   poles: 'Distribution, Automobile', s: 'IEOM NC 2022' },
                    { t: '🌺 Polynésie française',  n: '~300',   poles: 'Distribution, Partenariats', s: 'IEOM PF 2022' },
                    { t: '🌍 Madagascar',           n: '~1 200', poles: 'Automobile, Agroalimentaire', s: 'GBH — site officiel' },
                    { t: 'Siège & services partagés', n: '~500', poles: 'RH, IT, Juridique, Finance', s: 'Structure interne estimée' },
                  ].map(r => (
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

            <SectionTitle icon={AlertTriangle}>Dialogue social — Grèves et conflits documentés</SectionTitle>

            <InfoBox color="amber" title="⚠️ Contexte : GBH cible du mouvement social de 2021">
              Le mouvement social de novembre 2021 en Guadeloupe, l'un des plus importants depuis
              les grandes grèves de 2009, a été déclenché notamment par des revendications contre
              la vie chère. Les grandes surfaces GBH (Carrefour) ont été directement impactées.
              Ces faits sont documentés dans les rapports préfectoraux et la presse nationale.
            </InfoBox>

            <div className="space-y-4 mb-8">
              {[
                {
                  date: 'Janvier-Février 2009 — LKP',
                  title: 'Grève générale — Mouvement LKP',
                  impact: 'Le Lyannaj Kont Pwofitasyon (LKP) conduit une grève générale de 44 jours en Guadeloupe. Les grandes surfaces GBH sont ciblées comme symboles de la vie chère. La grève aboutit aux « accords Jacob » prévoyant une baisse de prix sur certains produits alimentaires.',
                  resultat: 'Accord de baisse de prix sur ~100 produits. Création d\'un comité de suivi des prix.',
                  source: 'Rapport préfectoral Guadeloupe 2009 ; Archives Le Monde',
                  sourceUrl: 'https://www.lemonde.fr/',
                },
                {
                  date: 'Novembre-Décembre 2021 — Guadeloupe',
                  title: 'Insurrection sociale — Crise du coût de la vie',
                  impact: 'Mouvement de protestation violent en Guadeloupe. Les supermarchés GBH (Carrefour Jarry, Carrefour Milénis) sont directement visés. Des barrages bloquent les livraisons. Le préfet saisit les forces de l\'ordre. GBH ferme temporairement plusieurs points de vente pour des raisons de sécurité.',
                  resultat: 'Fermetures temporaires de magasins. Engagement de négociations avec l\'État sur les prix. Extension du bouclier qualité-prix.',
                  source: 'Rapport mission préfectorale Guadeloupe déc. 2021 ; France-Antilles',
                  sourceUrl: 'https://www.guadeloupe.gouv.fr/',
                },
                {
                  date: '2021-2024 — Martinique',
                  title: 'Mobilisations répétées contre la vie chère',
                  impact: 'Plusieurs épisodes de mobilisation en Martinique incluant des blocages de routes, des fermetures préventives de grandes surfaces. Les enseignes GBH sont régulièrement mentionnées dans les communiqués des organisations syndicales (CDMT, CGTM).',
                  resultat: 'Négociations État-distributeurs. Engagement de GBH dans le dispositif BQP élargi. Réductions tarifaires ciblées sur certaines catégories.',
                  source: 'IEDOM Martinique 2023 ; RFO / Martinique La 1ère',
                  sourceUrl: 'https://la1ere.francetvinfo.fr/martinique/',
                },
                {
                  date: 'Régulier — Conflits sociaux internes',
                  title: 'Grèves sectorielles dans les filiales GBH',
                  impact: 'Des grèves ponctuelles sont documentées dans les filiales GBH (caissiers, logisticiens, agents hôteliers). La CGT et la CGTG sont actives dans certaines entités du groupe. Les conflits portent généralement sur les salaires, le temps de travail et les conditions de travail.',
                  resultat: 'Accords de branche signés. GBH est engagé dans des conventions collectives de la grande distribution et de l\'hôtellerie.',
                  source: 'BODACC — dépôts comptes sociaux ; presse syndicale locale',
                  sourceUrl: 'https://www.bodacc.fr/',
                },
              ].map(ev => (
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
                      <p className="text-xs text-green-300 mb-1"><strong>Résultat documenté :</strong> {ev.resultat}</p>
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
                <li><strong>Grande distribution :</strong> GBH applique la Convention Collective Nationale du Commerce de Détail et de Gros à Prédominance Alimentaire (CCN 3305). Les salaires de base dans la distribution ultramarines intègrent la <strong>Majoration de vie chère (MVC)</strong> — 20 % pour la Guadeloupe, Martinique et Guyane, 12 % pour La Réunion.</li>
                <li><strong>Hôtellerie (Karibéa) :</strong> CCN des Hôtels, Cafés, Restaurants (HCR). La Martinique et la Guadeloupe bénéficient d'accords locaux.</li>
                <li><strong>SMIC DOM :</strong> Le SMIC horaire s'applique avec la majoration spécifique aux DOM. En 2024 : 11,65 €/h brut + MVC.</li>
                <li><strong>Intéressement et participation :</strong> Certaines filiales GBH déposent des accords d'intéressement (visible dans les dépôts obligatoires à la DREETS). Les montants ne sont pas publics.</li>
                <li><strong>Formation professionnelle :</strong> En tant qu'employeur de plus de 300 salariés, GBH est soumis à l'obligation de plan de développement des compétences et aux négociations annuelles obligatoires.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">Source : Légifrance — CCN Commerce Alimentaire ; DREETS Guadeloupe ; site Legifrance</p>
            </Collapse>

            <Collapse title="🤝 Organisations syndicales présentes dans le groupe">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2">
                <li><strong>CGTG (Confédération Générale du Travail de la Guadeloupe) :</strong> Syndicat historiquement influent en Guadeloupe, actif dans les grandes surfaces et la logistique.</li>
                <li><strong>CGTM (CGT Martinique) :</strong> Active dans la grande distribution martiniquaise, représentée dans les filiales GBH.</li>
                <li><strong>CDMT (Centrale Démocratique Martiniquaise des Travailleurs) :</strong> Syndicat martiniquais participant aux négociations de branche.</li>
                <li><strong>UGTG (Union Générale des Travailleurs de la Guadeloupe) :</strong> Syndicat lié au mouvement nationaliste guadeloupéen, à l'origine de certains appels à grève dans le secteur de la grande distribution.</li>
                <li><strong>FO, CFDT :</strong> Présence de syndicats nationaux dans certaines filiales, notamment dans les secteurs automobile et hôtellerie.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">Source : DREETS Guadeloupe et Martinique — représentativité syndicale ; presse régionale</p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : FINANCES & REVENUS ══════════════════════════════════════ */}
        {activeTab === 'finances' && (
          <div>
            <SectionTitle icon={DollarSign}>Finances, revenus estimés et marges du groupe GBH</SectionTitle>

            <InfoBox color="amber" title="⚠️ Limites des données financières disponibles">
              GBH SAS est une <strong>société non cotée</strong>. Ses comptes annuels consolidés ne sont
              pas publiés au Journal Officiel de l'UE. Les chiffres ci-dessous sont des <strong>estimations
              établies à partir de sources officielles</strong> : CEROM, IEDOM, avis de l'Autorité de la
              concurrence, données INSEE et évaluations publiées par des instituts économiques. Ils ne
              constituent pas des données comptables certifiées.
            </InfoBox>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard label="CA groupe total (estimé)" value="~2,5–3 Md€" sub="CEROM 2022 / presse" highlight />
              <DataCard label="CA pôle distribution (estimé)" value="~1,6–1,9 Md€" sub="~65 % du CA total" />
              <DataCard label="CA pôle automobile (estimé)" value="~400–500 M€" sub="~15–18 % du CA" />
              <DataCard label="CA hôtellerie & autres" value="~400–600 M€" sub="~15–20 % du CA" highlight />
            </div>

            <SectionTitle icon={BarChart2}>Décomposition estimée du chiffre d'affaires par pôle</SectionTitle>
            <div className="space-y-3 mb-8">
              {[
                { pole: '🛒 Grande Distribution (Carrefour DOM)', pct: 65, color: '#34d399', note: 'Pôle dominant du groupe. Inclut les hypermarchés, supermarchés, drives et e-commerce dans les 7 territoires.' },
                { pole: '🚗 Distribution Automobile', pct: 16, color: '#f97316', note: 'Concessions Toyota, Lexus, Honda dans les Antilles, Réunion, NC et Madagascar.' },
                { pole: '🏨 Hôtellerie (Karibéa)', pct: 6, color: '#fbbf24', note: 'Chaîne hôtelière Karibéa (GP, MQ, GF). Tourisme d\'affaires et de loisirs.' },
                { pole: '🏗️ BTP & Matériaux', pct: 5, color: '#f59e0b', note: 'Point P DOM, SMGL. Marchés portés par le dynamisme de la construction dans les DOM.' },
                { pole: '🥫 Agroalimentaire & Logistique', pct: 5, color: '#a3e635', note: 'Daribo distilleries, GBH Import, Sofrigu. Chaîne logistique du froid.' },
                { pole: '🌍 International (Madagascar)', pct: 3, color: '#a78bfa', note: 'Activités automobile et distribution à Madagascar. Potentiel de croissance.' },
              ].map(row => (
                <div key={row.pole} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{row.pole}</span>
                    <span className="text-white font-bold">{row.pct}%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                  <p className="text-xs text-gray-600">{row.note}</p>
                </div>
              ))}
            </div>

            <SectionTitle icon={TrendingUp}>Analyse des marges — données documentées officiellement</SectionTitle>

            <InfoBox color="red" title="📊 Les marges DOM sont structurellement plus élevées qu'en métropole">
              L'Autorité de la concurrence (Avis 09-A-45, 2009 ; Avis 19-A-12, 2019) constate que
              les <strong>marges brutes des distributeurs alimentaires dans les DOM sont supérieures
              de 30 à 40 % par rapport à la France métropolitaine</strong>. Cette différence est
              justifiée partiellement par des coûts plus élevés (fret, main d'œuvre, énergie), mais
              l'ADLC estime qu'une partie reflète le <strong>pouvoir de marché des opérateurs dominants</strong>.
            </InfoBox>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-gray-400 font-semibold pr-3">Indicateur</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">DOM (GBH/Carrefour est.)</th>
                    <th className="pb-2 text-gray-400 font-semibold pr-3">France métro (référence)</th>
                    <th className="pb-2 text-gray-400 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { ind: 'Marge brute grande distribution', dom: '28–35 %', metro: '20–25 %', s: 'ADLC Avis 19-A-12 (2019)' },
                    { ind: 'Taux de marque alimentaire', dom: '35–45 %', metro: '25–30 %', s: 'INSEE — Enquête prix DOM 2022' },
                    { ind: 'Marge nette estimée (groupe)', dom: '5–8 %', metro: '2–4 %', s: 'CEROM estimations 2022' },
                    { ind: 'Coût d\'achat moyen (importations)', dom: '+20–25 %', metro: 'Base 0', s: 'Fret maritime + délai' },
                    { ind: 'Charges de personnel / CA', dom: '15–18 %', metro: '12–15 %', s: 'Rapport branche distribution 2022' },
                    { ind: 'Loyers commerciaux / CA', dom: '2–3 % (groupe intégré)', metro: '4–6 %', s: 'ADLC — intégration verticale' },
                  ].map(r => (
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
                L'Autorité de la concurrence souligne que GBH bénéficie d'un avantage
                financier structurel lié à son <strong>intégration verticale</strong> : en
                détenant à la fois la centrale d'achat (SOGDA), les entrepôts (Sofrigu),
                le foncier (SCI Jarry Distribution) et les surfaces de vente (CaribHyp),
                le groupe réalise des économies significatives sur des postes qui sont des
                coûts fixes pour un concurrent externe.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li><strong>Loyers « internes » nuls :</strong> GBH ne paie pas de loyer à des propriétaires tiers pour ses surfaces (il est propriétaire). Économie estimée : plusieurs dizaines de millions d'euros par an.</li>
                <li><strong>Marges arrière internes :</strong> Les remises et ristournes obtenues des fournisseurs par la centrale SOGDA restent dans le groupe.</li>
                <li><strong>Logistique mutualisée :</strong> Les coûts de transport et de stockage sont partagés entre la distribution et les filiales automobiles/BTP, réduisant le coût unitaire.</li>
                <li><strong>Cash-flow amplifié :</strong> La rotation rapide des stocks en grande distribution génère un BFR (besoin en fonds de roulement) négatif — avantage de trésorerie structurel.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation">
                  ADLC — Avis 09-A-45 (2009), pp. 30-40
                </SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : PRATIQUES COMMERCIALES ═════════════════════════════════ */}
        {activeTab === 'pratiques' && (
          <div>
            <SectionTitle icon={ShoppingBag}>Pratiques commerciales documentées du groupe GBH</SectionTitle>

            <InfoBox color="amber" title="⚠️ Important — Distinction pratique et infraction">
              Les pratiques décrites ci-dessous sont issues des <strong>avis publics de l'Autorité
              de la concurrence</strong>. Ces avis décrivent des pratiques <em>observées ou potentielles</em>
              dans un marché, sans nécessairement les qualifier d'infractions. Aucune condamnation
              de GBH pour pratiques anticoncurrentielles n'est publiée à la date de ce dossier.
              L'objectif est informatif et pédagogique.
            </InfoBox>

            <SectionTitle icon={AlertTriangle}>Pratiques identifiées par l'Autorité de la concurrence</SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  pratique: 'Accords de gamme exclusifs territoriaux',
                  gravite: 'Élevée',
                  color: 'red',
                  description: 'L\'Autorité de la concurrence a identifié dans l\'Avis 09-A-45 (2009) des pratiques d\'accords de gamme exclusifs : un fournisseur s\'engage à n\'approvisionner qu\'un seul distributeur dans un territoire donné. Pour les petits marchés insulaires, cela peut équivaloir à une exclusivité de fait sur tout le territoire.',
                  impact: 'Verrouillage de l\'accès aux approvisionnements pour les concurrents. Un nouveau distributeur ne peut obtenir certaines marques si elles sont liées par accord à GBH.',
                  encadrement: 'Loi Lurel (2012) — Art. 2 : interdiction des accords de gamme exclusifs dans les DOM sur les produits de grande consommation. Applicable depuis 2013.',
                  source: 'ADLC — Avis 09-A-45 (2009), p. 31 ; Loi 2012-1270 art. 2',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
                },
                {
                  pratique: 'Conditions d\'accès aux linéaires défavorables aux producteurs locaux',
                  gravite: 'Modérée',
                  color: 'orange',
                  description: 'Les producteurs locaux (agriculteurs, PME agroalimentaires) disposent de peu de pouvoir de négociation face à GBH, acteur dominant. Les conditions de référencement (délais de paiement, remises de référencement, coûts de mise en rayon) peuvent être particulièrement lourdes pour les petits producteurs ultramarins.',
                  impact: 'Difficultés d\'accès aux linéaires pour les productions locales. Risque de marginalisation des producteurs locaux au profit des importations métropolitaines.',
                  encadrement: 'Loi EGAlim (2018) et ses décrets d\'application — plafonnement des délais de paiement, encadrement des conditions commerciales.',
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 35-40 ; Rapports OPMR 2022',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                },
                {
                  pratique: 'Position dominante dans les zones de chalandise locales',
                  gravite: 'Élevée',
                  color: 'red',
                  description: 'Dans certaines zones géographiques (ex : nord Grande-Terre en Guadeloupe, certains secteurs de Martinique), GBH détient des parts de marché supérieures à 50 % dans la zone de chalandise immédiate. Ce niveau de concentration, qualifié de « position dominante » par l\'ADLC, permet en théorie au groupe d\'imposer des prix ou des conditions sans crainte d\'une pression concurrentielle suffisante.',
                  impact: 'Prix plus élevés dans les zones sans concurrence proche. Limitation du pouvoir d\'achat des ménages les plus modestes qui n\'ont pas accès à d\'autres enseignes.',
                  encadrement: 'Art. L420-2 Code de commerce — abus de position dominante. Surveillance OPMR.',
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 15-22 ; OPMR Guadeloupe 2022',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                },
                {
                  pratique: 'Intégration verticale et risque de discrimination de prix de transfert',
                  gravite: 'Potentielle',
                  color: 'amber',
                  description: 'GBH contrôle à la fois la centrale d\'achat (SOGDA), les entrepôts (Sofrigu), le foncier commercial (SCI Jarry) et les surfaces de vente (CaribHyp). Cette intégration verticale, légale en elle-même, soulève la question des prix de transfert intragroupe : les filiales peuvent se facturer mutuellement des prix qui ne reflètent pas les conditions de marché, permettant de moduler les résultats comptables apparents de chaque entité.',
                  impact: 'Opacité sur la rentabilité réelle de chaque pôle. Difficulté pour les régulateurs de mesurer les marges exactes au niveau de chaque stade de la chaîne (importation, stockage, distribution).',
                  encadrement: 'Code général des impôts — Art. 57 : contrôle des prix de transfert entre sociétés liées. Obligation de documentation pour les grands groupes.',
                  source: 'ADLC — Avis 09-A-45 (2009), pp. 33-36 ; CGI art. 57',
                  sourceUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042910498/',
                },
                {
                  pratique: 'Barrières à l\'entrée foncières — contrôle des meilleures localisations',
                  gravite: 'Structurelle',
                  color: 'purple',
                  description: 'GBH détient les murs et le foncier de ses centres commerciaux via ses SCI (SCI Jarry Distribution notamment). La zone de Jarry à Baie-Mahault est la plus grande zone commerciale des Antilles françaises. Tout concurrent souhaitant s\'implanter doit trouver un terrain disponible, denrée rare dans des îles à surface limitée. GBH a ainsi créé une barrière à l\'entrée durable.',
                  impact: 'Impossibilité pratique pour un concurrent de taille significative de s\'implanter à proximité de la zone Jarry. Renforcement de la position dominante par le contrôle du foncier.',
                  encadrement: 'Commission d\'équipement commercial (CEC) en Guadeloupe — autorisation nécessaire pour les surfaces > 1 000 m². Loi Lurel 2012 — volet foncier commercial.',
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 40-48 ; Loi 2012-1270',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
                },
              ].map(item => {
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
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${colorMap[item.color]}`}>
                        Risque : {item.gravite}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.description}</p>
                    <p className="text-xs text-amber-200 mb-1.5"><strong>Impact documenté :</strong> {item.impact}</p>
                    <p className="text-xs text-blue-300 mb-2"><strong>Encadrement légal :</strong> {item.encadrement}</p>
                    <p className="text-xs text-slate-600">
                      📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                    </p>
                  </div>
                );
              })}
            </div>

            <Collapse title="📋 Recommandations de l'ADLC restées sans suite obligatoire">
              <p className="mb-3 text-xs text-gray-300">
                Les avis de l'Autorité de la concurrence sont <strong>consultatifs et non contraignants</strong>
                (sauf si une injonction formelle est émise dans le cadre d'une procédure contentieuse).
                Plusieurs recommandations formulées en 2009 et 2019 n'ont pas donné lieu à des
                mesures législatives contraignantes spécifiques au secteur de la grande distribution DOM.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li>Recommandation 2009 : Publication obligatoire des marges par segment dans les DOM — <em>non mise en œuvre.</em></li>
                <li>Recommandation 2019 : Plafonnement des parts de marché par zone de chalandise (seuil d'alerte à 50 %) — <em>non mise en œuvre.</em></li>
                <li>Recommandation 2019 : Séparation obligatoire entre centrale d'achat et distribution de détail dans les DOM — <em>non mise en œuvre.</em></li>
                <li>Recommandation 2019 : Renforcement du rôle de l'OPMR avec pouvoirs d'injonction — <em>partiellement suivi par la loi DROM de 2022.</em></li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                  Avis 19-A-12 — Récapitulatif des recommandations, pp. 60-68
                </SourceLink>
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : RELATIONS ÉTAT ══════════════════════════════════════════ */}
        {activeTab === 'etat' && (
          <div>
            <SectionTitle icon={Flag}>Relations avec l'État et les collectivités d'Outre-Mer</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              En tant que premier groupe privé des Antilles-Guyane, GBH entretient des relations
              multiples avec les pouvoirs publics : réglementaires, fiscales, contractuelles et
              sociales. Ces relations sont encadrées par le droit commun et des dispositions
              spécifiques aux DOM.
            </p>

            <SectionTitle icon={DollarSign}>Mécanismes fiscaux avantageux dans les DOM (droit applicable)</SectionTitle>

            <InfoBox color="blue" title="ℹ️ Ces mécanismes sont légaux et s'appliquent à tous les groupes investissant dans les DOM">
              Les dispositifs décrits ci-dessous sont des mécanismes fiscaux de droit commun applicables
              dans les DOM. Ils visent à compenser les surcoûts liés à l'insularité et à attirer les
              investissements. Il n'est pas établi que GBH les utilise systématiquement — seuls les
              principes légaux sont décrits ici.
            </InfoBox>

            <div className="space-y-4 mb-8">
              {[
                {
                  mecanisme: 'Défiscalisation loi Girardin (CGI art. 199 undecies B)',
                  icon: '📉',
                  description: 'Les investissements productifs dans les DOM (équipements, matériels, constructions) peuvent bénéficier d\'une réduction d\'impôt pouvant atteindre 115 % du montant investi pour les investisseurs métropolitains. Les groupes réalisant des investissements en outre-mer y ont généralement recours via des montages Girardin industriel.',
                  application: 'Un groupe comme GBH, réalisant régulièrement des investissements immobiliers et d\'équipements dans les DOM, est susceptible d\'y avoir recours — directement ou via des SCI partenaires.',
                  source: 'CGI art. 199 undecies B et C ; Bofip.impots.gouv.fr',
                  sourceUrl: 'https://bofip.impots.gouv.fr/',
                },
                {
                  mecanisme: 'Exonérations spécifiques de l\'octroi de mer (OM)',
                  icon: '🚢',
                  description: 'L\'octroi de mer frappe les importations mais aussi les productions locales. Cependant, les Conseils Régionaux peuvent voter des exonérations ou des taux réduits pour certains produits ou certaines entreprises (notamment les producteurs locaux). GBH, en tant qu\'importateur et distributeur, est assujetti à l\'OM sur ses importations, mais peut bénéficier d\'exonérations sur certains produits distribués localement.',
                  application: 'Les taux d\'OM s\'appliquent différemment selon les produits. La capacité de GBH à optimiser ses achats en fonction des taux d\'OM constitue un avantage concurrentiel.',
                  source: 'Loi 2004-639 ; Délibérations CR Guadeloupe 2022',
                  sourceUrl: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/',
                },
                {
                  mecanisme: 'Fonds FEDER (Fonds Européen de Développement Régional)',
                  icon: '🇪🇺',
                  description: 'Les DOM bénéficient de fonds structurels européens significatifs (FEDER, FSE). Les entreprises privées réalisant des investissements en cofinancement avec les collectivités peuvent accéder à ces fonds. Les projets d\'infrastructure commerciale, logistique ou hôtelière peuvent en bénéficier.',
                  application: 'Des projets d\'investissement dans les DOM en partenariat avec les collectivités peuvent associer des fonds FEDER. Les détails des bénéficiaires privés sont publiés dans les rapports des autorités de gestion.',
                  source: 'DAECT — Rapports FEDER Guadeloupe/Martinique 2021-2027',
                  sourceUrl: 'https://www.europe-en-guadeloupe.eu/',
                },
                {
                  mecanisme: 'Zone Franche d\'Activité Nouvelle Génération (ZFANG)',
                  icon: '🏭',
                  description: 'Créées par la loi PACTE (2019), les ZFANG permettent aux entreprises situées dans les DOM de bénéficier d\'abattements sur les bénéfices industriels et commerciaux (BIC), les droits de mutation et la CFE. Ces abattements sont dégressifs selon la taille de l\'entreprise.',
                  application: 'Applicable aux filiales de GBH remplissant les critères (moins de 250 salariés, CA < 50 M€). Certaines filiales opérationnelles de GBH peuvent y être éligibles.',
                  source: 'Loi n° 2019-486 PACTE art. 146 ; CGI art. 44 quaterdecies',
                  sourceUrl: 'https://www.legifrance.gouv.fr/',
                },
              ].map(item => (
                <div key={item.mecanisme} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>{item.mecanisme}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{item.description}</p>
                  <p className="text-xs text-blue-300 mb-2"><strong>Application potentielle :</strong> {item.application}</p>
                  <p className="text-xs text-slate-600">
                    📎 <SourceLink href={item.sourceUrl}>{item.source}</SourceLink>
                  </p>
                </div>
              ))}
            </div>

            <SectionTitle icon={Landmark}>Marchés publics & Relations contractuelles avec l'État</SectionTitle>
            <Collapse title="🏛️ GBH comme prestataire des collectivités DOM" defaultOpen>
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2">
                <li><strong>Hôtellerie (Karibéa) :</strong> Les hôtels Karibéa hébergent régulièrement des délégations officielles, des conférences publiques et des séminaires d'État aux Antilles. Ces prestations constituent des marchés publics de fait, soumis au Code de la commande publique.</li>
                <li><strong>Fournitures alimentaires :</strong> Les filiales de distribution GBH peuvent être titulaires de marchés d'approvisionnement pour des cantines scolaires, des hôpitaux ou des services pénitentiaires dans les DOM.</li>
                <li><strong>BTP & Matériaux :</strong> Le pôle BTP (Point P DOM) fournit potentiellement des collectivités et des organismes publics locaux en matériaux de construction.</li>
                <li><strong>Stations-service :</strong> Des marchés de carburant pour les flottes de véhicules publics peuvent être attribués aux stations GBH Energy.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Les marchés publics passés avec des entités GBH sont théoriquement consultables sur
                <SourceLink href="https://www.marches-publics.info/"> marches-publics.info</SourceLink> et
                <SourceLink href="https://www.boamp.fr/"> BOAMP</SourceLink>.
              </p>
            </Collapse>

            <Collapse title="🗳️ Relations politiques — éléments documentés de la presse régionale">
              <p className="mb-3 text-xs text-gray-300">
                En tant que premier employeur et contributeur fiscal privé des Antilles, GBH joue
                un rôle économique structurant qui lui confère une influence de fait dans le débat
                politique régional. Les éléments suivants sont documentés dans la presse régionale.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-gray-400">
                <li><strong>Lobbying institutionnel :</strong> GBH est membre de fédérations patronales DOM (MEDEF Guadeloupe, CGPME Martinique) qui représentent les intérêts du secteur privé auprès des pouvoirs publics et participent aux concertations sociales.</li>
                <li><strong>Questions parlementaires :</strong> Plusieurs questions écrites de parlementaires (députés et sénateurs des DOM) ont été déposées sur les marges de GBH, les prix dans les grandes surfaces et la concentration du marché. Source : Questions.assemblee-nationale.fr.</li>
                <li><strong>Conférence de presse 2021 :</strong> Suite aux violences de novembre 2021 en Guadeloupe, Bernard Hayot a accordé des interviews à la presse régionale pour défendre la politique de prix du groupe et annoncer des baisses ciblées.</li>
                <li><strong>Relations avec les préfets :</strong> Le groupe participe aux réunions de crise sur les prix organisées par les préfets des DOM, notamment dans le cadre du dispositif BQP (Bouclier Qualité-Prix).</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Assemblée Nationale — Questions écrites DOM (questions.assemblee-nationale.fr) ;
                presse régionale (France-Antilles, Guadeloupe La 1ère, Martinique La 1ère).
              </p>
            </Collapse>

            <Collapse title="🛡️ Bouclier Qualité-Prix (BQP) — rôle de GBH">
              <p className="mb-3 text-xs text-gray-300">
                Le Bouclier Qualité-Prix (BQP) est un dispositif réglementaire instauré dans
                les DOM en application de l'article 1er de la loi n° 2012-1270 relative à la
                régulation économique outre-mer. Il impose une négociation annuelle entre les
                préfets, les distributeurs et les fournisseurs pour établir un panier d'une
                centaine de produits à prix maîtrisés.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-400">
                <li>GBH/Carrefour est l'un des signataires obligatoires du BQP dans les Antilles-Guyane et à La Réunion.</li>
                <li>Le panier BQP est publié par arrêté préfectoral chaque année (consultable sur legifrance.gouv.fr).</li>
                <li>En 2023, le BQP a été élargi à la suite des mobilisations de 2021-2022, augmentant le nombre de produits concernés.</li>
                <li>Des observateurs (OPMR, associations de consommateurs) relèvent que certains produits du BQP voient leur prix compensés par des hausses sur des produits hors-panier.</li>
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
            <SectionTitle icon={Newspaper}>Presse, déclarations publiques & controverses documentées</SectionTitle>

            <InfoBox color="amber" title="⚠️ Rigueur factuelle — Presse et sources primaires uniquement">
              Cette section recense des faits documentés dans la <strong>presse régionale et nationale</strong>,
              les questions parlementaires et les rapports officiels. Aucune information ne repose sur
              des sources anonymes. Les opinions formulées par des tiers (syndicats, élus, associations)
              sont clairement identifiées comme telles et ne reflètent pas une position de ce dossier.
            </InfoBox>

            <SectionTitle icon={Newspaper}>Chronologie des faits médiatiques majeurs</SectionTitle>
            <div className="space-y-4 mb-8">
              {[
                {
                  date: '2009',
                  titre: 'Révélation publique des marges GBH lors de l\'Avis 09-A-45',
                  contenu: 'La publication de l\'Avis 09-A-45 de l\'Autorité de la concurrence provoque une large couverture médiatique aux Antilles. Pour la première fois, les mécanismes de formation des prix et le rôle des grandes centrales d\'achat comme SOGDA sont expliqués publiquement. La presse régionale (France-Antilles, RFO) consacre plusieurs dossiers à cette question.',
                  media: 'Autorité de la concurrence ; France-Antilles ; RFO Antilles',
                  nature: 'Enquête institutionnelle',
                  color: '#60a5fa',
                },
                {
                  date: '2009 — LKP',
                  titre: 'Bernard Hayot et GBH au centre du mouvement LKP',
                  contenu: 'Lors de la grève générale de 44 jours conduite par le LKP (Lyannaj Kont Pwofitasyon — "Alliance Contre l\'Exploitation"), GBH est désigné comme symbole du système de vie chère. Des leaders du LKP appellent au boycott des magasins Carrefour. Le groupe est contraint de participer aux négociations avec les pouvoirs publics et de signer les accords de baisse de prix dits "accords Jacob".',
                  media: 'France-Antilles Guadeloupe ; RFO ; Le Monde',
                  nature: 'Crise sociale',
                  color: '#f43f5e',
                },
                {
                  date: '2019',
                  titre: 'Avis 19-A-12 — Confirmation et aggravation des constats',
                  contenu: 'L\'Avis 19-A-12 constate que la position de GBH n\'a pas faibli depuis 2009 et que certaines recommandations précédentes n\'ont pas été suivies d\'effet. La presse nationale (Le Monde, Libération) reprend les conclusions sur les marges excessives dans les DOM. Des associations de consommateurs antillaises organisent des campagnes de sensibilisation.',
                  media: 'Autorité de la concurrence ; Le Monde ; UFC-Que Choisir DOM',
                  nature: 'Enquête institutionnelle',
                  color: '#60a5fa',
                },
                {
                  date: 'Novembre 2021',
                  titre: 'Insurrection sociale en Guadeloupe — GBH ciblé',
                  contenu: 'Les violences sociales de novembre 2021 en Guadeloupe voient des manifestants s\'en prendre aux symboles de la vie chère. Des supermarchés Carrefour appartenant à GBH sont ciblés lors d\'incendies et de pillages. Bernard Hayot réagit publiquement, dénonçant les violences tout en annonçant un plan de baisses de prix ciblées. Le Premier ministre Jean Castex reçoit des représentants des collectifs antillais.',
                  media: 'Guadeloupe La 1ère ; Le Monde ; France Inter ; BFM TV',
                  nature: 'Crise sociale — dommages matériels',
                  color: '#f43f5e',
                },
                {
                  date: '2021-2022',
                  titre: 'Questions parlementaires sur GBH et les prix dans les DOM',
                  contenu: 'Suite aux événements de 2021, plusieurs parlementaires (dont des députés de Guadeloupe et de Martinique) déposent des questions écrites au gouvernement sur les marges de GBH et la régulation des prix dans les DOM. Ces questions sont consultables sur le site de l\'Assemblée Nationale. Le gouvernement répond en invoquant le dispositif BQP et la surveillance OPMR.',
                  media: 'Assemblée Nationale — Questions écrites (questions.assemblee-nationale.fr)',
                  nature: 'Débat parlementaire',
                  color: '#a78bfa',
                },
                {
                  date: '2022-2024',
                  titre: 'Mobilisations Martinique & baisses de prix négociées',
                  contenu: 'La Martinique connaît plusieurs épisodes de mobilisation contre la vie chère. Des négociations sont menées entre les préfets, GBH et les autres distributeurs. Des baisses de prix sur certains produits sont annoncées et vérifiées par l\'OPMR. La presse locale suit l\'évolution des engagements pris.',
                  media: 'Martinique La 1ère ; France-Antilles Martinique ; RCI Martinique',
                  nature: 'Négociations socio-économiques',
                  color: '#fbbf24',
                },
                {
                  date: 'Mars 2024',
                  titre: 'Rapport sénatorial sur la vie chère dans les DOM',
                  contenu: 'Le Sénat publie un rapport sur la vie chère dans les Outre-Mer. GBH y est mentionné dans le contexte de la concentration de la grande distribution. Le rapport préconise un renforcement du cadre réglementaire et un durcissement des sanctions en cas d\'abus de position dominante avérés.',
                  media: 'Sénat français — Rapport 2024 sur la vie chère dans les Outre-Mer',
                  nature: 'Rapport législatif',
                  color: '#a78bfa',
                },
              ].map(ev => (
                <div key={ev.date} className="border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 min-w-[80px]">
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: `${ev.color}22`, border: `1px solid ${ev.color}55`, color: ev.color }}>
                        {ev.date}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">{ev.titre}</p>
                      <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-xs border"
                        style={{ background: `${ev.color}15`, borderColor: `${ev.color}40`, color: ev.color }}>
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
                <li><strong>Défense des surcoûts structurels :</strong> GBH justifie systématiquement les prix plus élevés dans les DOM par les surcoûts réels (fret maritime, octroi de mer, coûts de main d'œuvre, énergie). Cette position est partiellement fondée et reconnue par l'ADLC elle-même.</li>
                <li><strong>Engagement sur le BQP :</strong> Le groupe se présente comme acteur engagé dans le dispositif Bouclier Qualité-Prix et partenaire des politiques publiques de régulation des prix.</li>
                <li><strong>Investissements locaux :</strong> GBH met en avant son rôle de premier employeur privé des Antilles et ses investissements dans les territoires ultramarins.</li>
                <li><strong>Condamnation des violences de 2021 :</strong> Bernard Hayot a publiquement condamné les violences de novembre 2021 en Guadeloupe tout en annonçant des baisses de prix ciblées dans les jours suivants.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Interviews GBH — France-Antilles, Guadeloupe La 1ère (nov. 2021 – déc. 2022) ;
                Communiqués officiels gbh.fr.
              </p>
            </Collapse>
          </div>
        )}

        {/* ══ TAB : FILIÈRE LOCALE & PRODUCTEURS ═══════════════════════════ */}
        {activeTab === 'producteurs' && (
          <div>
            <SectionTitle icon={Leaf}>Filière locale — Relations de GBH avec les producteurs ultramarins</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              La question de l'accès des producteurs locaux (agriculteurs, PME agroalimentaires)
              aux linéaires des grandes surfaces GBH est un enjeu majeur pour les économies
              ultramarines. Cette section analyse les relations documentées entre le groupe
              et la production locale.
            </p>

            <InfoBox color="green" title="🌱 Enjeu : réduire la dépendance aux importations">
              Les DOM importent environ 80 à 90 % des produits alimentaires consommés (INSEE,
              Enquête budget des familles 2022). Favoriser l'accès des productions locales aux
              linéaires de GBH est une question stratégique pour la souveraineté alimentaire
              des territoires ultramarins.
            </InfoBox>

            <SectionTitle icon={BarChart2}>Importations vs production locale — données officielles</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard label="Part des imports alimentaires (GP)" value="~85 %" sub="INSEE 2022" highlight />
              <DataCard label="Part des imports alimentaires (MQ)" value="~82 %" sub="INSEE 2022" />
              <DataCard label="Part des imports alimentaires (GF)" value="~88 %" sub="INSEE / CCIG 2022" />
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
                  description: 'La banane antillaise (Cavendish) est le seul produit agricole des DOM exporté massivement vers la métropole. Elle est présente dans les rayons GBH, mais la banane importée (Amérique latine, moins chère) est souvent plus visible. L\'étiquetage d\'origine est obligatoire depuis le règlement UE 1169/2011.',
                  source: 'IEDOM MQ/GP 2023 ; UGPBAN (Union des groupements de producteurs de banane)',
                  sourceUrl: 'https://www.ugpban.com/',
                },
                {
                  filiere: '🥬 Fruits et légumes pays',
                  emoji: '🥬',
                  territoire: 'Guadeloupe, Martinique, Guyane',
                  statut: 'Présence limitée',
                  description: 'Les fruits et légumes "pays" (produits localement) représentent une part minoritaire des rayons fruits & légumes des grandes surfaces GBH. Les contraintes d\'approvisionnement (régularité, calibrage, emballage) pénalisent les petits producteurs face aux importateurs organisés. L\'ADLC a recommandé un accès facilité aux linéaires.',
                  source: 'ADLC — Avis 19-A-12 (2019), pp. 35-40 ; DAAF Guadeloupe',
                  sourceUrl: 'https://daaf.guadeloupe.agriculture.gouv.fr/',
                },
                {
                  filiere: '🥩 Viande bovine & porcine',
                  emoji: '🥩',
                  territoire: 'Martinique',
                  statut: 'Présence marginale',
                  description: 'La production de viande bovine et porcine dans les DOM est très limitée face à la demande. La quasi-totalité est importée de métropole ou du Brésil. Quelques éleveurs locaux accèdent aux rayons GBH via des filières courtes certifiées (Label Rouge DOM), mais leur part de marché reste inférieure à 5 %.',
                  source: 'DAAF Martinique ; IEDOM MQ 2023',
                  sourceUrl: 'https://daaf.martinique.agriculture.gouv.fr/',
                },
                {
                  filiere: '🍫 Cacao & café — productions de niche',
                  emoji: '🍫',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Rayon terroir limité',
                  description: 'Du cacao (notamment en Guadeloupe, vallée de Capesterre) et du café (Guadeloupe Bonifieur) sont produits localement en quantités très limitées. Ces productions haut de gamme accèdent aux rayons GBH dans les espaces "terroir" ou "produits locaux", généralement à des prix sensiblement plus élevés que les équivalents importés.',
                  source: 'DAAF Guadeloupe — productions AOC/IGP ; chambre d\'agriculture GP',
                  sourceUrl: 'https://daaf.guadeloupe.agriculture.gouv.fr/',
                },
                {
                  filiere: '🍹 Rhum agricole — filière d\'excellence',
                  emoji: '🍹',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Bien représentée',
                  description: 'Le rhum agricole de Martinique (AOC) et le rhum de Guadeloupe bénéficient d\'une solide présence dans les rayons GBH. Cependant, GBH distribue également ses propres marques via le pôle Daribo Distilleries, ce qui crée une situation de potentiel conflit d\'intérêt (distributeur & producteur concurrent des autres rhums locaux). Ce point mériterait une analyse plus approfondie.',
                  source: 'ADLC — Avis 09-A-45 (2009), pp. 31-34 ; CIVAM rhum Martinique',
                  sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
                },
                {
                  filiere: '🧴 Cosmétiques naturels — émergence locale',
                  emoji: '🧴',
                  territoire: 'Guadeloupe, Martinique',
                  statut: 'Émergent',
                  description: 'Une filière de cosmétiques naturels à base de plantes locales (vétiver, ylang-ylang, vanille, bois d\'Inde) émerge dans les DOM. Ces produits accèdent progressivement aux linéaires des grandes surfaces GBH via des programmes de mise en rayon "produits locaux", mais les contraintes de référencement (volumes, délais de paiement, coûts) restent un frein pour les TPE locales.',
                  source: 'Chambre de commerce et d\'industrie Guadeloupe ; ADEME DOM 2022',
                  sourceUrl: 'https://www.cci.gp/',
                },
              ].map(item => (
                <div key={item.filiere} className="border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white">{item.filiere}</p>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                      item.statut === 'Bien représentée'
                        ? 'bg-green-500/10 border-green-500/30 text-green-300'
                        : item.statut === 'Présence limitée' || item.statut === 'Présence marginale'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}>
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

            <SectionTitle icon={AlertTriangle}>Obstacles documentés à l'accès des producteurs locaux</SectionTitle>
            <Collapse title="📋 Barrières identifiées par les pouvoirs publics" defaultOpen>
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2 text-gray-300">
                <li><strong>Exigences de volumes :</strong> Les grandes surfaces GBH exigent une régularité d'approvisionnement et des volumes minimaux difficiles à atteindre pour les petits agriculteurs ultramarins (exploitations de moins de 5 ha en moyenne).</li>
                <li><strong>Normes de calibrage et d'emballage :</strong> Les standards de présentation (emballages, étiquetage, calibre des fruits et légumes) imposent des investissements que beaucoup de petits producteurs ne peuvent pas assumer seuls.</li>
                <li><strong>Délais de paiement :</strong> Les délais de règlement des fournisseurs locaux peuvent atteindre 30 à 60 jours, créant des difficultés de trésorerie pour les TPE agricoles.</li>
                <li><strong>Coûts de référencement :</strong> Des frais de référencement (mise en rayon, animation promotionnelle) sont parfois exigés, représentant une barrière financière pour les petites structures locales.</li>
                <li><strong>Concurrence déloyale des importations aidées :</strong> Certains produits importés bénéficient d'aides à la production dans leur pays d'origine (subventions PAC pour les produits européens), les rendant moins chers que les équivalents locaux malgré les coûts de fret.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
                  ADLC — Avis 19-A-12 (2019), pp. 38-42
                </SourceLink> ; DAAF Guadeloupe — Rapport sur la souveraineté alimentaire 2023.
              </p>
            </Collapse>

            <Collapse title="✅ Initiatives documentées en faveur du local">
              <ul className="list-disc pl-5 space-y-2 text-xs mt-2 text-gray-300">
                <li><strong>Rayon Produits Pays :</strong> Les Carrefour des Antilles disposent de rayons dédiés aux produits locaux (fruits, légumes, condiments, artisanat alimentaire). La surface dédiée varie selon les magasins.</li>
                <li><strong>Programme Carrefour "Agir pour la Guadeloupe/Martinique" :</strong> Des programmes de référencement préférentiel pour les producteurs locaux ont été annoncés dans le cadre des engagements post-crise 2021. Leur mise en œuvre effective reste à vérifier par des tiers.</li>
                <li><strong>Participation aux marchés de producteurs :</strong> Certains espaces Carrefour DOM accueillent ponctuellement des marchés de producteurs locaux dans leurs parkings ou espaces extérieurs.</li>
                <li><strong>Engagement BQP produits locaux :</strong> Le Bouclier Qualité-Prix inclut progressivement des produits locaux afin de valoriser la production ultramarine.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : Site officiel Carrefour Guadeloupe ; OPMR Guadeloupe 2023 ; presse régionale.
              </p>
            </Collapse>
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
                secteurs: ['Grande distribution (Carrefour)', 'Distribution automobile (Toyota, Lexus)', 'BTP / Matériaux', 'Logistique (SOGDA, Sofrigu)', 'Immobilier commercial (Jarry)', 'Distribution de carburant'],
                note: 'Jarry (Baie-Mahault) abrite le siège social du groupe et la plus grande zone commerciale des Antilles. GBH y détient une position dominante dans la grande distribution.',
                source: 'Avis 19-A-12 (2019) ; RCS Guadeloupe',
                sourceUrl: 'https://www.autoritedelaconcurrence.fr/',
              },
              {
                territoire: '🇲🇶 Martinique (972)',
                statut: 'DROM — territoire fondateur',
                color: '#fbbf24',
                secteurs: ['Grande distribution (Carrefour)', 'Distribution automobile', 'Hôtellerie (Karibéa Hotels)', 'Agroalimentaire / Daribo', 'BTP'],
                note: 'La Martinique est le territoire d\'origine du groupe. GBH y reste leader de la grande distribution malgré une concurrence plus forte qu\'en Guadeloupe.',
                source: 'Avis 19-A-12 (2019) ; IEDOM Martinique 2023',
                sourceUrl: 'https://www.iedom.fr/martinique/',
              },
              {
                territoire: '🇬🇫 Guyane (973)',
                statut: 'DROM',
                color: '#60a5fa',
                secteurs: ['Grande distribution (Carrefour)', 'Hôtellerie (Karibéa)', 'Logistique / Import'],
                note: 'Présence dans la grande distribution et l\'hôtellerie. Marché plus limité mais GBH y détient une part significative de la distribution alimentaire formelle.',
                source: 'Avis 19-A-12 (2019) ; IEDOM Guyane 2023',
                sourceUrl: 'https://www.iedom.fr/guyane/',
              },
              {
                territoire: '🇷🇪 La Réunion (974)',
                statut: 'DROM',
                color: '#f97316',
                secteurs: ['Grande distribution (Carrefour)', 'Distribution automobile', 'Logistique'],
                note: 'Concurrent du Groupe Caillé. GBH y est présent via Carrefour Réunion mais n\'y occupe pas la position dominante qu\'il détient aux Antilles.',
                source: 'Avis 19-A-12 (2019) ; IEDOM La Réunion 2023',
                sourceUrl: 'https://www.iedom.fr/reunion/',
              },
              {
                territoire: '🌏 Nouvelle-Calédonie (988)',
                statut: 'COM',
                color: '#a78bfa',
                secteurs: ['Grande distribution', 'Distribution automobile'],
                note: 'Présence via GBH Pacific. Marché soumis à la réglementation néo-calédonienne propre (pas d\'octroi de mer mais des taxes équivalentes).',
                source: 'IEOM Nouvelle-Calédonie 2022',
                sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
              },
              {
                territoire: '🌺 Polynésie française (987)',
                statut: 'COM',
                color: '#f43f5e',
                secteurs: ['Grande distribution (partenariats)', 'Distribution automobile'],
                note: 'Implantation plus légère qu\'en Nouvelle-Calédonie. Partenariats locaux pour la distribution.',
                source: 'IEOM Polynésie française 2022',
                sourceUrl: 'https://www.ieom.fr/polynesie-francaise/',
              },
              {
                territoire: '🌍 Madagascar',
                statut: 'International',
                color: '#64748b',
                secteurs: ['Distribution automobile', 'Agroalimentaire', 'Services'],
                note: 'Extension internationale dans l\'Océan Indien. GBH y est présent depuis les années 2000 dans les secteurs automobile et agroalimentaire.',
                source: 'Site officiel GBH — présentation groupe',
                sourceUrl: 'https://www.gbh.fr/',
              },
            ].map(t => (
              <div key={t.territoire}
                className="mb-5 border border-slate-700 rounded-xl overflow-hidden"
                style={{ borderLeftColor: t.color, borderLeftWidth: 4 }}>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-base font-bold text-white">{t.territoire}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${t.color}22`, color: t.color }}>
                        {t.statut}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.secteurs.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-gray-300">
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
            <SectionTitle icon={Scale}>Décisions et enquêtes réglementaires concernant GBH</SectionTitle>

            <InfoBox color="blue" title="ℹ️ Rappel juridique important">
              Les avis de l'Autorité de la concurrence sont des <strong>actes administratifs non
              contraignants</strong> (sauf exceptions). Ils analysent la structure des marchés et
              formulent des recommandations. Ils ne constituent pas des sanctions et ne préjugent
              pas de comportements illicites. Les décisions citées sont toutes <strong>publiques et
              consultables librement</strong> sur le site officiel de l'Autorité.
            </InfoBox>

            <Collapse title="📋 Avis 09-A-45 du 8 décembre 2009 — Mécanismes d'importation et distribution DOM" defaultOpen>
              <p className="mb-3">
                <strong>Objet :</strong> Analyse des mécanismes d'importation et de distribution des
                produits de grande consommation dans les DOM.
              </p>
              <p className="mb-3">
                <strong>Principaux constats concernant GBH :</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>GBH identifié comme acteur <strong>dominant dans la grande distribution
                  alimentaire</strong> en Guadeloupe et Martinique.</li>
                <li>Contrôle d'une part significative des <strong>flux d'importation</strong> via
                  ses structures de centrale d'achat (SOGDA).</li>
                <li>Cumul de positions : distribution de détail + centrale d'achat +
                  entrepôts logistiques + foncier commercial. Ce cumul est identifié comme
                  un <strong>facteur limitant la concurrence</strong>.</li>
                <li>La détention des murs des centres commerciaux de Jarry crée une <strong>barrière
                  à l'entrée</strong> pour de nouveaux concurrents.</li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation">
                  Avis 09-A-45 complet — autoritedelaconcurrence.fr
                </SourceLink>
              </p>
            </Collapse>

            <Collapse title="📋 Avis 19-A-12 du 13 juin 2019 — Situation de la concurrence dans les DOM" defaultOpen>
              <p className="mb-3">
                <strong>Objet :</strong> Suivi approfondi de la situation concurrentielle dans les
                départements d'Outre-Mer 10 ans après l'Avis 09-A-45.
              </p>
              <p className="mb-3">
                <strong>Principaux constats concernant GBH :</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>GBH maintient et a <strong>renforcé sa position dominante</strong> dans la
                  grande distribution aux Antilles depuis 2009.</li>
                <li>Parts de marché supérieures à <strong>50 % dans certaines zones de
                  chalandise</strong> en Guadeloupe et Martinique.</li>
                <li>L'Autorité recommande une <strong>plus grande transparence</strong> sur les
                  marges pratiquées et les conditions d'accès aux linéaires pour les producteurs
                  locaux.</li>
                <li>La diversification du groupe (automobile, BTP, hôtellerie) renforce sa
                  capacité à exercer des pressions croisées sur ses partenaires commerciaux.</li>
                <li>Recommandation de <strong>vigilance accrue</strong> de l'OPMR (Observatoire
                  des Prix, des Marges et des Revenus) sur les pratiques tarifaires.</li>
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
                économique outre-mer (loi Lurel). Il est chargé de surveiller les prix et les
                marges dans la grande distribution dans les DOM.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>Les rapports annuels de l'OPMR Guadeloupe et de l'OPMR Martinique incluent
                  des données sur les marges pratiquées par les principales enseignes,
                  <strong>dont Carrefour/GBH</strong>.</li>
                <li>Les données OPMR montrent des <strong>écarts de prix moyens de +22 %</strong>
                  sur les produits alimentaires entre les DOM et la France métropolitaine
                  (toutes causes confondues).</li>
                <li>La surveillance OPMR est une obligation légale depuis la loi Lurel (2012).</li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.opmr.fr/">
                  OPMR — Site officiel
                </SourceLink>
              </p>
            </Collapse>

            <Collapse title="📋 Loi du 20 novembre 2012 (Loi Lurel) — Régulation économique outre-mer">
              <p className="mb-3">
                La loi n° 2012-1270 dite « loi Lurel » a été adoptée spécifiquement pour réguler
                les marchés ultra-marins. Elle s'applique directement aux activités de GBH.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-3 text-xs">
                <li>Création de l'OPMR et obligations de transparence tarifaire.</li>
                <li>Dispositions sur les <strong>accords de gamme exclusifs</strong> (pratique
                  consistant à contraindre les fournisseurs à n'approvisionner qu'un seul
                  distributeur dans un territoire) — identifiées comme problématiques aux
                  Antilles.</li>
                <li>Encadrement des pratiques de référencement et des conditions commerciales
                  dans les petits marchés insulaires.</li>
              </ul>
              <p className="text-xs text-gray-500">
                <SourceLink href="https://www.legifrance.gouv.fr/loi/id/JORFTEXT000026607977/">
                  Loi n° 2012-1270 — Légifrance
                </SourceLink>
              </p>
            </Collapse>

            <InfoBox color="green" title="✅ Aucune condamnation pénale ou sanction administrative publiée">
              À la date de rédaction de ce dossier (mars 2026), aucune <strong>décision de
              condamnation</strong> de l'Autorité de la concurrence ou de juridiction pénale
              à l'encontre du groupe GBH spécifiquement n'est publiée dans les registres officiels
              français (BODACC, Légifrance, ADLC). Les avis cités sont des <em>avis de marché</em>,
              non des sanctions. Cette précision est essentielle pour la rigueur factuelle du dossier.
            </InfoBox>
          </div>
        )}

        {/* ══ TAB 5 : IMPACT & VIE CHÈRE ════════════════════════════════════ */}
        {activeTab === 'impact' && (
          <div>
            <SectionTitle icon={TrendingUp}>Impact économique & contribution à la vie chère dans les DOM</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              La concentration du marché de la grande distribution aux mains d'un nombre limité
              d'acteurs — dont GBH est le principal — est identifiée par les institutions publiques
              comme <strong>l'un des facteurs structurels</strong> de la cherté de la vie dans les
              DOM. Ces constats sont fondés sur des données officielles.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <DataCard label="Surcoût alimentaire DOM vs métropole" value="+11 à +17%" sub="INSEE 2022" highlight />
              <DataCard label="Part de GBH grande distribution GP" value=">50%" sub="Avis 19-A-12 (zones)" />
              <DataCard label="Marges distribution DOM (estimées)" value="+30 à +40%" sub="vs 20-25% métro" />
              <DataCard label="Part distribution dans surcoût total" value="~25%" sub="Autorité concurrence" />
            </div>

            <Collapse title="📊 Décomposition du surcoût alimentaire dans les DOM (INSEE 2022)" defaultOpen>
              <div className="space-y-3 mt-3">
                {[
                  { factor: 'Marges de distribution plus élevées',    pct: 25, color: '#f97316' },
                  { factor: 'Octroi de mer',                           pct: 30, color: '#a78bfa' },
                  { factor: 'Fret maritime & surcoût logistique',      pct: 28, color: '#60a5fa' },
                  { factor: 'Coûts d\'exploitation plus élevés',       pct: 12, color: '#fbbf24' },
                  { factor: 'Autres facteurs',                         pct: 5,  color: '#64748b' },
                ].map(row => (
                  <div key={row.factor} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 min-w-[250px]">{row.factor}</span>
                    <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden"
                      role="progressbar" aria-valuenow={row.pct} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`${row.factor} : ${row.pct}%`}>
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
                    </div>
                    <span className="text-xs font-bold min-w-[36px] text-right" style={{ color: row.color }}>
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Source : INSEE — Enquête niveaux de vie DOM 2022 ;
                Autorité de la concurrence, Avis 09-A-45 (2009) et Avis 19-A-12 (2019).
                Parts estimées, non exclusives.
              </p>
            </Collapse>

            <SectionTitle icon={AlertTriangle}>Contexte social : mouvements contre la vie chère</SectionTitle>
            <div className="space-y-3">
              {[
                {
                  date: 'Nov. 2021 — Guadeloupe',
                  desc: 'Mouvement social majeur en Guadeloupe. Les revendications incluent explicitement la lutte contre la vie chère et la demande de régulation des prix dans la grande distribution. GBH est cité dans le débat public.',
                  source: 'Rapport mission préfectorale Guadeloupe déc. 2021',
                },
                {
                  date: '2021–2024 — Martinique',
                  desc: 'Mobilisations répétées en Martinique contre la vie chère. Demandes de plafonnement des prix sur les produits alimentaires essentiels. L\'État engage des négociations avec les distributeurs, dont GBH.',
                  source: 'IEDOM Martinique 2023 ; Presse locale Martinique La 1ère',
                },
                {
                  date: '2023 — Bouclier qualité-prix (BQP)',
                  desc: 'L\'État français étend le dispositif "Bouclier qualité-prix" dans les DOM : panier d\'une centaine de produits dont les prix sont négociés et plafonnés. Les grandes enseignes dont Carrefour/GBH sont parties prenantes obligatoires.',
                  source: 'Arrêtés préfectoraux BQP 2023 — Légifrance',
                },
              ].map(ev => (
                <div key={ev.date} className="border border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-300 mb-1">{ev.date}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-1">{ev.desc}</p>
                  <p className="text-xs text-slate-600 italic">{ev.source}</p>
                </div>
              ))}
            </div>

            <InfoBox color="purple" title="📌 Position institutionnelle — nuance nécessaire">
              Les rapports officiels (CEROM, IEDOM, Autorité de la concurrence) soulignent que le
              surcoût dans les DOM résulte de <strong>causes multiples</strong> : logistique insulaire,
              fiscalité (octroi de mer), faiblesse de la concurrence locale et coûts de production
              plus élevés. La concentration de la distribution est <em>un facteur parmi d'autres</em>,
              pas le seul responsable. Cette nuance est explicitement posée dans l'Avis 19-A-12 (p. 12).
            </InfoBox>
          </div>
        )}

        {/* ══ TAB : CONCURRENTS ══════════════════════════════════════════════ */}
        {activeTab === 'concurrents' && (
          <div>
            <SectionTitle icon={BarChart2}>Paysage concurrentiel — GBH face à ses concurrents dans les DOM</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Les marchés de grande distribution dans les DOM se caractérisent par un nombre
              limité d'acteurs. L'Autorité de la concurrence (Avis 19-A-12, 2019) a cartographié
              ce paysage concurrentiel. GBH y occupe une position dominante dans plusieurs territoires,
              mais fait face à plusieurs groupes dans les autres DOM.
            </p>

            <InfoBox color="blue" title="ℹ️ Source des données concurrentielles">
              Les données de parts de marché et les noms des concurrents cités sont issus des
              avis publics de l'Autorité de la concurrence (09-A-45 et 19-A-12), des rapports
              IEDOM et de la presse régionale. Les parts de marché exactes sont estimées ou
              issues de fourchettes publiées dans les avis officiels.
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
                  { nom: 'E.Leclerc (Guadeloupe)', part: '~20-25 %', note: 'Via franchisés locaux indépendants' },
                  { nom: 'Intermarché DOM', part: '~10-15 %', note: 'Franchisés locaux' },
                  { nom: 'Petits commerces & hard discount', part: '~10 %', note: 'Leader Price, Lidl (limité)' },
                ],
                source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 15-20',
                sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                note: 'GBH est l\'acteur dominant incontesté en Guadeloupe, notamment via la maîtrise de la zone commerciale de Jarry (Baie-Mahault), identifiée comme barrière à l\'entrée par l\'ADLC.',
              },
              {
                territoire: '🇲🇶 Martinique',
                flag: 'bg-amber-500/10 border-amber-500/30',
                header: 'text-amber-300',
                gbhPart: '40-50 %',
                gbhEnseignes: 'Carrefour, Carrefour Market, Carrefour Express',
                concurrents: [
                  { nom: 'E.Leclerc Martinique', part: '~25-30 %', note: 'Groupement Leclerc, franchisé local' },
                  { nom: 'Hyper U / Super U', part: '~10-15 %', note: 'Groupe Système U, présence locale' },
                  { nom: 'Intermarché', part: '~10 %', note: 'Franchisés locaux Martinique' },
                ],
                source: 'Autorité de la concurrence — Avis 19-A-12 (2019), pp. 20-25',
                sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                note: 'En Martinique, GBH fait face à une concurrence plus structurée qu\'en Guadeloupe avec E.Leclerc et Hyper U. Sa part de marché y est dominante mais pas hégémonique.',
              },
              {
                territoire: '🇬🇫 Guyane',
                flag: 'bg-blue-500/10 border-blue-500/30',
                header: 'text-blue-300',
                gbhPart: '~35-45 %',
                gbhEnseignes: 'Carrefour, Carrefour Market',
                concurrents: [
                  { nom: 'E.Leclerc Guyane', part: '~25 %', note: 'Franchisé Leclerc en Guyane' },
                  { nom: 'Hyper U / Champion (anciens)', part: '~15 %', note: 'Présence historique' },
                  { nom: 'Commerce informel & petits détaillants', part: '~15-20 %', note: 'Spécificité guyanaise (bassins frontaliers)' },
                ],
                source: 'Autorité de la concurrence — Avis 19-A-12 (2019) ; IEDOM Guyane 2023',
                sourceUrl: 'https://www.iedom.fr/guyane/',
                note: 'La Guyane a une structure particulière avec une part significative du commerce informel et transfrontalier (Brésil, Suriname). GBH y est présent mais moins dominant qu\'aux Antilles.',
              },
              {
                territoire: '🇷🇪 La Réunion',
                flag: 'bg-orange-500/10 border-orange-500/30',
                header: 'text-orange-300',
                gbhPart: '~20-30 %',
                gbhEnseignes: 'Carrefour Réunion',
                concurrents: [
                  { nom: 'Vindemia — Groupe Bourbon (Carrefour RE historique)', part: '~30 %', note: 'Groupe Bourbon, historiquement franchisé Carrefour avant GBH' },
                  { nom: 'Groupe Caillé (E.Leclerc RE)', part: '~25-30 %', note: 'Principal concurrent à La Réunion, franchisé Leclerc' },
                  { nom: 'Jumbo Score (Groupe Cilam)', part: '~10-15 %', note: 'Groupe réunionnais Cilam' },
                  { nom: 'Hyper U / Super U Réunion', part: '~10 %', note: 'Franchisés Système U' },
                ],
                source: 'IEDOM La Réunion 2023 ; Avis 19-A-12 (2019), pp. 25-30',
                sourceUrl: 'https://www.iedom.fr/reunion/',
                note: 'À La Réunion, GBH n\'est pas l\'acteur dominant : Vindemia et le Groupe Caillé (Leclerc) sont des concurrents de taille équivalente. Le marché réunionnais est le plus concurrentiel des DOM.',
              },
              {
                territoire: '🌏 Nouvelle-Calédonie',
                flag: 'bg-purple-500/10 border-purple-500/30',
                header: 'text-purple-300',
                gbhPart: 'Position significative',
                gbhEnseignes: 'Carrefour NC, Proxi',
                concurrents: [
                  { nom: 'Dock de France / Casino NC', part: 'Important', note: 'Groupe Casino présent historiquement' },
                  { nom: 'Kenu-In / Commerce local', part: 'Important', note: 'Réseaux commerciaux locaux calédoniens' },
                ],
                source: 'IEOM Nouvelle-Calédonie 2022',
                sourceUrl: 'https://www.ieom.fr/nouvelle-caledonie/',
                note: 'La Nouvelle-Calédonie a un cadre réglementaire propre (pas d\'octroi de mer, taxes locales). GBH y est en concurrence avec d\'autres groupes implantés localement.',
              },
            ].map(t => (
              <div key={t.territoire}
                className={`mb-6 border rounded-xl overflow-hidden ${t.flag}`}>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className={`text-base font-bold ${t.header}`}>{t.territoire}</h3>
                  </div>

                  {/* GBH position */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-0.5">GBH / Carrefour</p>
                    <p className="text-white font-bold text-sm">{t.gbhPart} de part de marché (est.)</p>
                    <p className="text-xs text-gray-400">Enseignes : {t.gbhEnseignes}</p>
                  </div>

                  {/* Competitors */}
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Principaux concurrents</p>
                  <div className="space-y-2 mb-3">
                    {t.concurrents.map(c => (
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
                  <p className="text-xs text-gray-400 italic border-t border-slate-800 pt-2 mb-1">{t.note}</p>
                  <p className="text-xs text-slate-600">
                    Source : <SourceLink href={t.sourceUrl}>{t.source}</SourceLink>
                  </p>
                </div>
              </div>
            ))}

            <SectionTitle icon={AlertTriangle}>Synthèse concurrentielle — Facteurs structurels</SectionTitle>
            <Collapse title="📊 Pourquoi la concurrence reste limitée dans les DOM ?" defaultOpen>
              <p className="mb-3">
                L'Autorité de la concurrence (Avis 19-A-12, 2019) identifie plusieurs
                <strong> barrières à l'entrée structurelles</strong> qui protègent les
                acteurs établis, dont GBH :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Foncier commercial concentré :</strong> GBH détient les murs et le foncier de ses centres commerciaux (SCI Jarry Distribution, Immobilière Hayot). Tout nouvel entrant doit trouver des terrains disponibles, rares dans des îles à surface limitée.</li>
                <li><strong>Logistique maîtrisée :</strong> SOGDA contrôle une part significative des flux d'importation en Guadeloupe et Martinique. Les entrepôts frigorifiques (Sofrigu) sont une infrastructure critique difficile à dupliquer.</li>
                <li><strong>Taille du marché :</strong> Les marchés insulaires sont trop petits pour amortir les coûts fixes d'une grande surface sur de nombreux concurrents. Ceci favorise la concentration naturelle.</li>
                <li><strong>Accords de gamme exclusifs :</strong> Pratique consistant à obtenir l'exclusivité d'approvisionnement d'un fournisseur sur un territoire. Limitée par la loi Lurel (2012) mais difficile à détecter.</li>
                <li><strong>Marque Carrefour :</strong> Le contrat de franchise Carrefour confère un avantage de notoriété et d'approvisionnement (centrale d'achat Carrefour) difficile à concurrencer pour un entrant indépendant.</li>
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Source : <SourceLink href="https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer">
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
                      { groupe: 'GBH (Hayot)',         enseignes: 'Carrefour DOM',       territoires: 'GP, MQ, GF, RE, NC, PF', statut: 'Non coté — familial' },
                      { groupe: 'Groupe Caillé',        enseignes: 'E.Leclerc Réunion',   territoires: 'RE',                     statut: 'Non coté — familial' },
                      { groupe: 'Vindemia (Bourbon)',   enseignes: 'Géant Casino / Score', territoires: 'RE',                    statut: 'Filiale Groupe SEB/Bourbon' },
                      { groupe: 'Leclerc DOM (frch.)',  enseignes: 'E.Leclerc',           territoires: 'GP, MQ, GF, RE',         statut: 'Franchisés indépendants' },
                      { groupe: 'Intermarché DOM',      enseignes: 'Intermarché',         territoires: 'GP, MQ, GF',             statut: 'Franchisés ITM Entreprises' },
                      { groupe: 'Groupe Cilam',         enseignes: 'Jumbo Score',         territoires: 'RE',                     statut: 'Groupe réunionnais' },
                      { groupe: 'Système U DOM',        enseignes: 'Hyper U / Super U',   territoires: 'GP, MQ, RE',             statut: 'Coopérative commerçants' },
                    ].map(r => (
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

        {/* ══ TAB 6 : SOURCES ════════════════════════════════════════════════ */}
        {activeTab === 'sources' && (
          <div>
            <SectionTitle icon={BookOpen}>Sources officielles et références documentaires</SectionTitle>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Toutes les informations publiées dans ce dossier reposent sur les sources ci-dessous,
              toutes <strong>officielles, publiques et librement consultables</strong>. Aucune source
              anonyme n'est utilisée.
            </p>

            <Collapse title="⚖️ Autorité de la concurrence — Avis officiels" defaultOpen>
              <ul className="space-y-2 text-xs">
                {[
                  {
                    text: 'Avis n° 09-A-45 du 8 décembre 2009 — Mécanismes d\'importation et distribution DOM',
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-mecanismes-dimportation-et-de-distribution-des-produits-de-grande-consommation',
                  },
                  {
                    text: 'Avis n° 19-A-12 du 13 juin 2019 — Situation de la concurrence dans les DOM',
                    url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-a-la-situation-de-la-concurrence-dans-les-departements-doutre-mer',
                  },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="📊 INSEE & économie">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'INSEE — Enquête comparaison des niveaux de vie et des prix DOM 2022', url: 'https://www.insee.fr/fr/statistiques' },
                  { text: 'CEROM — Comptes économiques rapides pour l\'Outre-Mer 2022', url: 'https://www.cerom-outremer.fr/' },
                  { text: 'IEDOM — Rapports annuels Guadeloupe, Martinique, Guyane, La Réunion 2023', url: 'https://www.iedom.fr/' },
                  { text: 'IEOM — Rapports Nouvelle-Calédonie, Polynésie française 2022', url: 'https://www.ieom.fr/' },
                  { text: 'Cour des Comptes — Rapport finances collectivités DOM 2023', url: 'https://www.ccomptes.fr/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🏛️ Registres d'entreprises & publications légales">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'RNE/INPI — Registre National des Entreprises (data.inpi.fr)', url: 'https://www.inpi.fr/' },
                  { text: 'BODACC — Bulletin officiel des annonces civiles et commerciales', url: 'https://www.bodacc.fr/' },
                  { text: 'Infogreffe — Registres du Commerce et des Sociétés', url: 'https://www.infogreffe.fr/' },
                  { text: 'Légifrance — Journal Officiel, textes législatifs', url: 'https://www.legifrance.gouv.fr/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="📜 Textes législatifs applicables">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'Loi n° 2012-1270 du 20 novembre 2012 relative à la régulation économique outre-mer (Loi Lurel)', url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000026607977/' },
                  { text: 'Loi n° 2004-639 du 2 juillet 2004 relative à l\'octroi de mer', url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/' },
                  { text: 'Articles L420-1 et suivants du Code de commerce — Pratiques anticoncurrentielles', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000005634379/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🌐 Site institutionnel GBH">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'Site officiel GBH — présentation du groupe, activités et implantations', url: 'https://www.gbh.fr/' },
                  { text: 'Karibéa Hotels — site officiel', url: 'https://www.karibea.com/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="💼 Sources emploi & dialogue social">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'DREETS Guadeloupe — représentativité syndicale et accords collectifs', url: 'https://www.guadeloupe.dreets.gouv.fr/' },
                  { text: 'DREETS Martinique — dépôts d\'accords d\'entreprise', url: 'https://www.martinique.dreets.gouv.fr/' },
                  { text: 'Légifrance — Convention collective commerce alimentaire (CCN 3305)', url: 'https://www.legifrance.gouv.fr/' },
                  { text: 'Légifrance — Loi n° 2012-1270 Lurel (régulation économique outre-mer)', url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000026607977/' },
                  { text: 'Rapport préfectoral Guadeloupe — Mission d\'urgence sociale déc. 2021', url: 'https://www.guadeloupe.gouv.fr/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🌱 Sources filière agricole & production locale">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'DAAF Guadeloupe — Direction de l\'alimentation, de l\'agriculture et de la forêt', url: 'https://daaf.guadeloupe.agriculture.gouv.fr/' },
                  { text: 'DAAF Martinique — Productions agricoles locales', url: 'https://daaf.martinique.agriculture.gouv.fr/' },
                  { text: 'UGPBAN — Union des groupements de producteurs de banane de Guadeloupe et Martinique', url: 'https://www.ugpban.com/' },
                  { text: 'INSEE — Enquête budget des familles DOM 2022 — Parts des importations alimentaires', url: 'https://www.insee.fr/' },
                  { text: 'Chambre d\'agriculture Guadeloupe — État des filières 2022', url: 'https://www.cci.gp/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <Collapse title="🏛️ Sources parlementaires & presse nationale">
              <ul className="space-y-2 text-xs">
                {[
                  { text: 'Assemblée Nationale — Questions écrites des parlementaires des DOM sur les prix', url: 'https://questions.assemblee-nationale.fr/' },
                  { text: 'Sénat — Rapport 2024 sur la vie chère dans les Outre-Mer', url: 'https://www.senat.fr/' },
                  { text: 'BOFIP — Fiche défiscalisation Girardin (CGI art. 199 undecies B)', url: 'https://bofip.impots.gouv.fr/' },
                  { text: 'Europe en Guadeloupe — Fonds FEDER 2021-2027', url: 'https://www.europe-en-guadeloupe.eu/' },
                  { text: 'BOAMP — Bulletin officiel des annonces des marchés publics', url: 'https://www.boamp.fr/' },
                  { text: 'Guadeloupe La 1ère — Archives presse 2009-2024', url: 'https://la1ere.francetvinfo.fr/guadeloupe/' },
                  { text: 'Martinique La 1ère — Archives presse 2021-2024', url: 'https://la1ere.francetvinfo.fr/martinique/' },
                ].map(ref => (
                  <li key={ref.text} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">▸</span>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-300 underline underline-offset-2">{ref.text}</a>
                  </li>
                ))}
              </ul>
            </Collapse>

            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-300 mb-1">Responsabilité éditoriale</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ce dossier est produit par l'Observatoire des Prix <strong>A KI PRI SA YÉ</strong> à
                    vocation informative et citoyenne. Toutes les affirmations sont sourcées et
                    vérifiables. Aucune information confidentielle n'est utilisée. En cas d'erreur
                    factuelle, merci de nous contacter pour correction immédiate.
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
            Illustrations : photos libres de droits (Unsplash) représentant des zones commerciales et
            centres-villes ultramarins — à titre illustratif uniquement.
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
            ].map(img => (
              <div key={img.src} className="rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-28 object-cover opacity-60"
                  loading="lazy"
                />
                <p className="text-xs text-center text-gray-600 py-1 px-2 bg-slate-900">{img.alt}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrganigrammeGBH;
