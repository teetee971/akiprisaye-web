/**
 * Centralized Unsplash image assets.
 * All photos are free to use under the Unsplash License.
 * Format: https://images.unsplash.com/photo-{ID}?auto=format&fm=webp&fit=crop&w={W}&q=80
 */

export const TERRITORY_IMAGES: Record<string, { url: string; alt: string; credit: string }> = {
  gp: {
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Guadeloupe — marché tropical, fruits et légumes locaux',
    credit: 'Unsplash',
  },
  mq: {
    url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Martinique — littoral et végétation tropicale',
    credit: 'Unsplash',
  },
  gf: {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Guyane — forêt amazonienne luxuriante',
    credit: 'Unsplash',
  },
  re: {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'La Réunion — paysage volcanique, piton de la Fournaise',
    credit: 'Unsplash',
  },
  yt: {
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Mayotte — lagon turquoise et mangrove',
    credit: 'Unsplash',
  },
  nc: {
    url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Nouvelle-Calédonie — lagon et récif corallien classé UNESCO',
    credit: 'Unsplash',
  },
  pf: {
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Polynésie française — bungalows sur l’eau de Bora Bora',
    credit: 'Unsplash',
  },
  wf: {
    url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Wallis-et-Futuna — île volcanique du Pacifique',
    credit: 'Unsplash',
  },
  pm: {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Saint-Pierre-et-Miquelon — côte rocheuse atlantique',
    credit: 'Unsplash',
  },
  bl: {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Saint-Barthélemy — plage de sable blanc des Caraïbes',
    credit: 'Unsplash',
  },
  mf: {
    url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Saint-Martin — côte caribéenne aux eaux cristallines',
    credit: 'Unsplash',
  },
  tf: {
    url: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'TAAF — terres australes et antarctiques françaises',
    credit: 'Unsplash',
  },
  fr: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'France métropolitaine — Paris, Tour Eiffel',
    credit: 'Unsplash',
  },
};

export const TERRITORY_GRADIENTS: Record<string, string> = {
  gp: 'from-emerald-700 to-teal-900',
  mq: 'from-orange-700 to-red-900',
  gf: 'from-green-800 to-emerald-950',
  re: 'from-orange-800 to-red-950',
  yt: 'from-cyan-700 to-blue-900',
  fr: 'from-blue-800 to-indigo-950',
  default: 'from-slate-700 to-slate-900',
};

export const CATEGORY_IMAGES: Record<string, { url: string; alt: string; gradient: string }> = {
  'Épicerie': {
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Épicerie — produits alimentaires',
    gradient: 'from-amber-500 to-orange-600',
  },
  'Produits laitiers': {
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Produits laitiers',
    gradient: 'from-blue-400 to-sky-600',
  },
  'Fruits et légumes': {
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Fruits et légumes frais',
    gradient: 'from-green-500 to-emerald-700',
  },
  'Boucherie / Charcuterie': {
    url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Boucherie',
    gradient: 'from-red-600 to-rose-800',
  },
  'Hygiène': {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Produits hygiène',
    gradient: 'from-purple-500 to-violet-700',
  },
  'Entretien / Nettoyage': {
    url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Produits ménagers',
    gradient: 'from-cyan-500 to-teal-700',
  },
  'Lessive': {
    url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Lessive',
    gradient: 'from-indigo-500 to-blue-700',
  },
  'Cosmétiques': {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Cosmétiques',
    gradient: 'from-pink-500 to-rose-700',
  },
  'Pharmacie': {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Pharmacie',
    gradient: 'from-emerald-500 to-green-700',
  },
  'Boissons': {
    url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Boissons',
    gradient: 'from-blue-500 to-cyan-700',
  },
  'Surgelés': {
    url: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Surgelés',
    gradient: 'from-sky-500 to-blue-800',
  },
};

export function getCategoryAsset(category: string) {
  return CATEGORY_IMAGES[category] ?? {
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fm=webp&fit=crop&w=400&q=80',
    alt: 'Produit',
    gradient: 'from-slate-500 to-slate-700',
  };
}

export function getTerritoryAsset(code: string) {
  return TERRITORY_IMAGES[code.toLowerCase()] ?? {
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=800&q=80',
    alt: 'Territoire',
    credit: 'Unsplash',
  };
}

export function getTerritoryGradient(code: string): string {
  return TERRITORY_GRADIENTS[code.toLowerCase()] ?? TERRITORY_GRADIENTS.default;
}

// Hero images for specific pages
export const PAGE_HERO_IMAGES = {
  // ── Custom 4-visual media pack (provided by product) ──────────────────────
  heroActualites: '/media/images/hero-actualites.webp',
  heroRecherche: '/media/images/hero-recherche.webp',
  articleDefault: '/media/images/article-default.webp',
  sectionProfessional3d: '/media/images/section-professional-3d.webp',
  // ── Pages already enriched ───────────────────────────────────────────────
  priceHistory: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=80',
  crossTerritory: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=1600&q=80',
  inflation: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  coverage: 'https://images.unsplash.com/photo-1526628953301-3cd8e16b67b1?auto=format&fm=webp&fit=crop&w=1600&q=80',
  alerts: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── New page heroes ──────────────────────────────────────────────────────
  /** Recherche de prix — fresh market/search */
  search: 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Scanner EAN — barcode scan at checkout */
  scanner: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Liste de courses intelligente — shopping cart */
  shoppingList: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Lutte contre la vie chère — community solidarity */
  lutteVieChere: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Contribuer — open data / teamwork */
  contribuer: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Solidarité — helping hands */
  solidarite: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** À Propos — French overseas territory sunset */
  aPropos: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Pricing — premium subscription */
  pricing: 'https://images.unsplash.com/photo-1620714223084-8fcacc2523dc?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** FAQ — question marks / knowledge */
  faq: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Contact — friendly communication */
  contact: 'https://images.unsplash.com/photo-1521791055366-0d553872952f?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Gamification profile — trophy/achievement */
  gamification: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparaison enseignes — supermarket checkout aisle */
  comparaisonEnseignes: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** App demo — person scanning barcode in tropical supermarket */
  appDemo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Vie chère poster — grocery / food economy */
  videoPoster: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fm=webp&fit=crop&w=1200&q=80',
  // ── Innovation Lab ───────────────────────────────────────────────────────
  /** Innovation Lab — futuristic tech lab / AI concept */
  innovationLab: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── Civic & Education ────────────────────────────────────────────────────
  /** Conférence prix — classroom / presentation */
  conferencePrix: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Lettre hebdo IA — newspaper / newsletter */
  lettreHebdo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Lettre journalière IA — morning coffee & editorial / tropical sunrise briefing */
  lettreJour: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comprendre prix — magnifying glass / price tag */
  comprendrePrix: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── New modules (this session) ───────────────────────────────────────────
  /** Calculateur octroi de mer — cargo ship at port */
  calculateurOctroi: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Enquête Octroi de Mer — customs / cargo containers at port */
  enqueteOctroiMer: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Conférence Octroi de Mer — parliament / institutional building */
  conferenceOctroiMer: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Enquête Eau — water infrastructure / pipes / treatment plant DOM */
  enqueteEau: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Conférence Eau — institutional meeting / water management conference */
  conferenceEau: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Simulateur budget familial — food & agricultural produce budget */
  simulateurBudget: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Alertes rupture de stock — empty supermarket shelf */
  alertesRupture: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Réclamation IA — person writing legal letter */
  reclamationIA: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Rapport citoyen — data / charts on screen */
  rapportCitoyen: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Planificateur repas — beautiful Caribbean/tropical food spread */
  planificateurRepas: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** DLC anti-gaspi — refrigerator / food storage */
  dlcAntigaspi: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Analyse nutrition — healthy food / nutrition label */
  analyseNutri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Analyse concurrence — business strategy meeting */
  analyseConcurrence: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── Account & social ─────────────────────────────────────────────────────
  /** Mon Compte — profile / personal data */
  monCompte: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Messagerie — chat / messaging */
  messagerie: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Groupes de parole — community discussion circle */
  groupesParole: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Suggestions — idea / light bulb */
  suggestions: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── Data & analysis ──────────────────────────────────────────────────────
  /** Roadmap — planning / calendar */
  roadmap: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Checklist Production — to-do list / clipboard */
  checklistProduction: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Versions — software update / code */
  versions: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Methodologie — research / methodology */
  methodologie: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Données publiques — open data */
  donneesPubliques: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Transparence / Politique de confidentialité */
  transparence: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Presse — press / journalism */
  presse: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Gouvernance */
  gouvernance: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Dossier investisseurs */
  dossierInvestisseurs: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Espace Pro */
  espacePro: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Devis IA */
  devisIA: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Observatoire hub */
  observatoire: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Carte interactive — map view */
  carte: 'https://images.unsplash.com/photo-1526628953301-3cd8e16b67b1?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Predictions — crystal ball / AI prediction */
  predictions: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Badges / Gamification */
  badges: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Leaderboard */
  leaderboard: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── Remaining pages ──────────────────────────────────────────────────────
  /** Alertes — alert bell, notifications */
  alertes: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Panier comparé / BasketComparison — Caribbean / DOM food market */
  basketComparison: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Modules civiques */
  civicModules: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Contact collectivités */
  contactCollectivites: 'https://images.unsplash.com/photo-1521791055366-0d553872952f?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Devis tracking */
  devisTracking: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Inscription */
  inscription: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Inscription Pro */
  inscriptionPro: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Licence institution */
  licenceInstitution: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Mentions légales */
  mentionsLegales: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Mes demandes */
  mesDemandes: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Mes listes */
  mesListes: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Audience en direct — podium territoires connectés */
  audience: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Statut plateforme — horloges territoires & déploiement */
  statut: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Module audit */
  moduleAudit: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Périmètre */
  perimetre: 'https://images.unsplash.com/photo-1526628953301-3cd8e16b67b1?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Produit — food market / product scene */
  produit: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Recherche hub */
  rechercheHub: 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Recherche produits */
  rechercheProduits: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Actualités */
  actualites: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Paramètres */
  settings: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** S'abonner */
  subscribe: 'https://images.unsplash.com/photo-1620714223084-8fcacc2523dc?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Territory hub */
  territoryHub: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Upgrade */
  upgradePage: 'https://images.unsplash.com/photo-1620714223084-8fcacc2523dc?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Budget réel mensuel */
  budgetReel: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Budget vital — supermarket / grocery promotion */
  budgetVital: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Dossier médias */
  dossierMedia: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Évaluation cosmétique */
  evaluationCosmetique: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Historique prix */
  historiquePrix: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** IA Conseiller */
  iaConseiller: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Ti Panie — colourful fresh-produce market */
  tiPanie: 'https://images.unsplash.com/photo-1540189549336-e6e99d931b8a?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Assistant IA */
  assistantIA: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── Specialized comparators ──────────────────────────────────────────────
  /** Comparateur Vols — airplane taking off over Caribbean sky */
  comparateurVols: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Bateaux — ferry crossing between islands */
  comparateurBateaux: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Fret — shipping containers at port */
  comparateurFret: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Carburants — fuel station, pumps */
  comparateurCarburants: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Enquête Carburants — oil refinery at sunset (investigation dossier) */
  enqueteCarburants: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Conférence Carburants — petroleum industry / oil tanks aerial view */
  conferenceCarburants: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Assurances — insurance shield / contract */
  comparateurAssurances: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Formations — classroom / training session */
  comparateurFormations: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Services — telecom / wifi / internet */
  comparateurServices: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Location Voiture — rental car keys */
  comparateurLocationVoiture: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Comparateur Matériaux BTP — construction site */
  comparateurMateriauxBTP: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fm=webp&fit=crop&w=1600&q=80',
  // ── Nouvelles pages V3 ───────────────────────────────────────────────────
  /** Guide intelligent des territoires — tropical map / DOM-COM islands */
  guideTerritoire: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Scanner AR de rayon — augmented reality / camera overlay */
  arScanner: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Chaîne d'approvisionnement — cargo ship at sea */
  chaineFourniture: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Commerce social — friends sharing phone / social shopping */
  commerceSocial: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Analyse des factures — person checking receipts / bills */
  analyseFactures: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Détection de fraude — lock / security / shield */
  detectionFraude: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Évaluation des magasins — supermarket interior / customer service */
  evaluationMagasins: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Portail développeurs — code / terminal / API */
  portailDeveloppeurs: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Marketplace enseignes — retail store / marketplace hall */
  marketplacePortal: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Petits commerces — small local shop / boutique in Caribbean */
  petitsCommerces: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Producteurs locaux — tropical farmers market / fresh local produce */
  producteursLocaux: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Marchés locaux — outdoor Caribbean market / colorful stalls */
  marchesLocaux: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Chocs de prix — price spike / alarm / red alert */
  chocsPrix: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Newsletter hub — mailbox / newspaper / subscription */
  newsletter: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Monitoring IA — server room / AI dashboard / futuristic tech */
  monitoringIA: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fm=webp&fit=crop&w=1600&q=80',
  /** Organigramme GBH — corporate structure / business hierarchy (office building) */
  organigrammeGBH: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fm=webp&fit=crop&w=1600&q=80',
};

/**
 * Product images for the 14 observatoire tracked products.
 * All photos are free to use under the Unsplash License.
 */
export const PRODUCT_IMAGES: Record<string, { url: string; alt: string }> = {
  'Lait demi-écrémé UHT 1L': {
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Lait demi-écrémé UHT 1 litre',
  },
  'Riz long blanc 1kg': {
    url: 'https://images.unsplash.com/photo-1516684669134-de2d4a1c0e8a?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Riz long blanc 1 kilogramme',
  },
  'Eau minérale 1.5L': {
    url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Bouteille d\'eau minérale 1,5 litre',
  },
  'Pâtes spaghetti 500g': {
    url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Pâtes spaghetti 500 grammes',
  },
  'Sucre blanc 1kg': {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Sucre blanc en poudre 1 kilogramme',
  },
  'Huile de tournesol 1L': {
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Huile de tournesol 1 litre',
  },
  'Tomates rondes 1kg': {
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Tomates rondes fraîches 1 kilogramme',
  },
  'Poulet entier 1kg': {
    url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Poulet entier 1 kilogramme',
  },
  'Yaourt nature 4x125g': {
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Yaourt nature 4×125 g',
  },
  'Lessive liquide 1.5L': {
    url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Lessive liquide 1,5 litre',
  },
  'Liquide vaisselle 500ml': {
    url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Liquide vaisselle 500 ml',
  },
  'Gel douche 250ml': {
    url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Gel douche 250 ml',
  },
  'Crème hydratante visage 50ml': {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Crème hydratante visage 50 ml',
  },
  'Paracétamol 500mg x16': {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Paracétamol 500 mg boîte de 16 comprimés',
  },
  'Café moulu 250g': {
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fm=webp&fit=crop&w=300&q=80',
    alt: 'Café moulu 250 grammes',
  },
};

export function getProductImage(productName: string): { url: string; alt: string } {
  return (
    PRODUCT_IMAGES[productName] ?? {
      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fm=webp&fit=crop&w=300&q=80',
      alt: productName,
    }
  );
}

/**
 * Food / recipe photos for PlanificateurRepas.
 * All Unsplash photos, free to use.
 */
export const RECIPE_IMAGES: Record<string, string> = {
  'colombo-poulet':  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fm=webp&fit=crop&w=400&q=80',
  'acras-morue':     'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fm=webp&fit=crop&w=400&q=80',
  'riz-haricots':    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fm=webp&fit=crop&w=400&q=80',
  'poisson-grillé':  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fm=webp&fit=crop&w=400&q=80',
  'salade-lentilles':'https://images.unsplash.com/photo-1512058454905-6b841e7ad132?auto=format&fm=webp&fit=crop&w=400&q=80',
  'gratin-légumes':  'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fm=webp&fit=crop&w=400&q=80',
  'soupe-legumes':   'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fm=webp&fit=crop&w=400&q=80',
  'blaff-poisson':   'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fm=webp&fit=crop&w=400&q=80',
  'omelette-légumes':'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fm=webp&fit=crop&w=400&q=80',
  'pain-beurre':     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fm=webp&fit=crop&w=400&q=80',
  'fruits-yaourt':   'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fm=webp&fit=crop&w=400&q=80',
};

/**
 * Innovation card concept images for InnovationLab.
 */
export const INNOVATION_IMAGES: Record<string, string> = {
  chatbot:           'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fm=webp&fit=crop&w=300&q=80',
  prediction:        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=300&q=80',
  'ocr-ticket':      'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fm=webp&fit=crop&w=300&q=80',
  heatmap:           'https://images.unsplash.com/photo-1526628953301-3cd8e16b67b1?auto=format&fm=webp&fit=crop&w=300&q=80',
  'api-ouverte':     'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=300&q=80',
  extension:         'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fm=webp&fit=crop&w=300&q=80',
  'rapport-pdf':     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=300&q=80',
  'programme-fidelite': 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fm=webp&fit=crop&w=300&q=80',
  'podcast-ia':      'https://images.unsplash.com/photo-1478737270239-2591ef84b836?auto=format&fm=webp&fit=crop&w=300&q=80',
  gamification:      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fm=webp&fit=crop&w=300&q=80',
  medicaments:       'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fm=webp&fit=crop&w=300&q=80',
  carburant:         'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fm=webp&fit=crop&w=300&q=80',
  'creole-ui':       'https://images.unsplash.com/photo-1486551937199-baf462c8af55?auto=format&fm=webp&fit=crop&w=300&q=80',
  'partenariats-opmr': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fm=webp&fit=crop&w=300&q=80',
  'devis-ia':        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=300&q=80',
  'analyse-ticket':  'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fm=webp&fit=crop&w=300&q=80',
  'nutrition-score': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fm=webp&fit=crop&w=300&q=80',
  'simulateur-budget': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fm=webp&fit=crop&w=300&q=80',
  'alertes-rupture': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fm=webp&fit=crop&w=300&q=80',
  'ia-plainte':      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fm=webp&fit=crop&w=300&q=80',
  'dlc-antigaspi':   'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fm=webp&fit=crop&w=300&q=80',
  'conference-prix': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fm=webp&fit=crop&w=300&q=80',
  'planificateur-repas': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fm=webp&fit=crop&w=300&q=80',
  'analyse-nutri':   'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fm=webp&fit=crop&w=300&q=80',
  'analyse-concurrence': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=300&q=80',
  'rapport-citoyen': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=300&q=80',
  'lettre-hebdo':    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fm=webp&fit=crop&w=300&q=80',
};
