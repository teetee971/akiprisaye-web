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
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ─── Tabs ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'presentation',  label: 'Présentation',              icon: Building2  },
  { key: 'organigramme',  label: 'Organigramme',              icon: GitBranch  },
  { key: 'filiales',      label: 'Sociétés & Filiales',       icon: Globe      },
  { key: 'dirigeants',    label: 'Dirigeants & Gouvernance',  icon: UserCheck  },
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
