/**
 * GlobalSearch — Barre de recherche globale (palette de commandes)
 *
 * Accessible via :
 *   - Le bouton Recherche dans le Header
 *   - Raccourci clavier Ctrl+K / Cmd+K
 *   - Touche Escape pour fermer
 *
 * Recherche dans :
 *   - Pages / rubriques du site
 *   - Magasins évalués
 *   - Produits alimentaires courants
 *   - Territoires
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Clock } from 'lucide-react';

// ─── Données de recherche ──────────────────────────────────────────────────────

type SearchResult = {
  id: string;
  type: 'page' | 'store' | 'product' | 'territory';
  label: string;
  description: string;
  icon: string;
  to: string;
  keywords: string[];
};

const SEARCH_INDEX: SearchResult[] = [
  // ── Pages principales ────────────────────────────────────────────────────────
  { id: 'home',               type: 'page', label: 'Accueil',                     description: 'Page principale du site',                          icon: 'H', to: '/',                          keywords: ['accueil', 'home', 'début'] },
  { id: 'comparateur',        type: 'page', label: 'Comparateur de prix',         description: 'Comparer les prix entre enseignes et territoires',  icon: 'C', to: '/comparateur',               keywords: ['comparateur', 'prix', 'comparer', 'enseigne'] },
  { id: 'search',             type: 'page', label: 'Recherche produit',           description: 'Rechercher un produit et son prix',                 icon: 'R', to: '/search',                    keywords: ['recherche', 'produit', 'prix', 'scanner', 'code-barres'] },
  { id: 'carte',              type: 'page', label: 'Carte des magasins',          description: 'Trouver un magasin sur la carte',                   icon: 'M', to: '/carte',                     keywords: ['carte', 'map', 'magasin', 'localisation', 'gps'] },
  { id: 'evaluation',         type: 'page', label: 'Évaluation des magasins',     description: 'Noter les magasins de votre territoire',            icon: 'E', to: '/evaluation-magasins',       keywords: ['évaluation', 'note', 'magasin', 'avis', 'noter'] },
  { id: 'actualites',         type: 'page', label: 'Actualités',                  description: 'Dernières nouvelles des DOM/COM',                   icon: 'A', to: '/actualites',                keywords: ['actualités', 'news', 'infos', 'nouvelles'] },
  { id: 'organigramme-gbh',  type: 'page', label: 'Organigramme GBH',          description: 'Dossier complet GBH : filiales, gouvernance, chronologie', icon: 'G', to: '/organigramme-gbh',         keywords: ['organigramme', 'gbh', 'hayot', 'filiales', 'enquête'] },
  { id: 'lettre-hebdo',       type: 'page', label: 'Lettre Hebdomadaire IA',      description: 'Éditorial IA chaque lundi sur les DOM/COM',         icon: 'L', to: '/lettre-hebdo',              keywords: ['lettre', 'hebdo', 'ia', 'editorial', 'newsletter'] },
  { id: 'lettre-jour',        type: 'page', label: 'Briefing Journalier IA',      description: 'Briefing IA quotidien sur les DOM/COM',             icon: 'B', to: '/lettre-jour',               keywords: ['briefing', 'journalier', 'ia', 'quotidien'] },
  { id: 'observatoire',       type: 'page', label: 'Observatoire des prix',       description: 'Données citoyennes sur les prix',                   icon: 'O', to: '/observatoire',              keywords: ['observatoire', 'données', 'prix', 'statistiques'] },
  { id: 'comparaison-terr',   type: 'page', label: 'Comparaison territoires',     description: 'Comparer les prix entre territoires',               icon: 'T', to: '/comparaison-territoires',   keywords: ['comparaison', 'territoire', 'dom', 'com', 'outre-mer'] },
  { id: 'comparaison-ensei',  type: 'page', label: 'Comparaison enseignes',       description: 'Comparer les prix entre enseignes',                 icon: 'S', to: '/comparaison-enseignes',     keywords: ['comparaison', 'enseigne', 'carrefour', 'casino', 'leader price'] },
  { id: 'contribuer',         type: 'page', label: 'Contribuer',                  description: 'Participer au relevé des prix citoyens',            icon: 'P', to: '/contribuer',                keywords: ['contribuer', 'signaler', 'relever', 'prix', 'citoyen'] },
  { id: 'contribuer-prix',    type: 'page', label: 'Contribuer un prix',          description: 'Soumettre un prix observé',                        icon: 'N', to: '/contribuer-prix',           keywords: ['contribuer', 'prix', 'soumettre', 'signaler'] },
  { id: 'alertes',            type: 'page', label: 'Alertes prix',               description: 'Recevoir des alertes quand un prix change',         icon: 'I', to: '/alertes-prix',              keywords: ['alerte', 'notification', 'prix', 'changement'] },
  { id: 'liste',              type: 'page', label: 'Ma liste de courses',         description: 'Gérer votre liste de courses',                     icon: 'G', to: '/liste',                     keywords: ['liste', 'courses', 'panier', 'achats'] },
  { id: 'scanner',            type: 'page', label: 'Scanner un code-barres',      description: 'Scanner un produit pour trouver son prix',          icon: 'Q', to: '/scanner',                   keywords: ['scanner', 'code-barres', 'ean', 'scan', 'barcode'] },
  { id: 'analyse-nutri',      type: 'page', label: 'Analyse nutritionnelle',      description: 'Analyser la nutrition des produits',                icon: 'U', to: '/analyse-nutri',             keywords: ['nutrition', 'analyse', 'santé', 'nutriscore', 'calories'] },
  { id: 'dlc',                type: 'page', label: 'Anti-gaspi DLC',              description: 'Gérer les dates de péremption',                     icon: 'D', to: '/dlc-antigaspi',            keywords: ['dlc', 'anti-gaspi', 'péremption', 'date', 'gaspillage'] },
  { id: 'budget-vital',       type: 'page', label: 'Budget vital',                description: 'Calculer votre budget alimentaire minimum',        icon: 'V', to: '/budget-vital',              keywords: ['budget', 'vital', 'minimum', 'pauvreté', 'alimentaire'] },
  { id: 'octroi',             type: 'page', label: 'Calculateur octroi de mer',   description: 'Calculer la taxe octroi de mer',                    icon: 'X', to: '/calculateur-octroi',       keywords: ['octroi', 'mer', 'taxe', 'douane', 'calcul'] },
  { id: 'carburants',         type: 'page', label: 'Prix des carburants',         description: 'Prix de l\'essence et du diesel dans les DOM/COM',  icon: 'F', to: '/comparateur-carburants',    keywords: ['carburant', 'essence', 'diesel', 'sp95', 'sp98', 'gazole'] },
  { id: 'ia-hub',             type: 'page', label: 'Assistant IA',                description: 'Votre assistant IA pour les prix',                  icon: 'J', to: '/assistant-ia',              keywords: ['ia', 'intelligence', 'artificielle', 'assistant', 'chatbot'] },
  { id: 'vie-chere',          type: 'page', label: 'Lutte contre la vie chère',   description: 'Informations sur la vie chère dans les DOM/COM',    icon: 'Y', to: '/vie-chere',                 keywords: ['vie chère', 'cherté', 'pouvoir d\'achat', 'inflation'] },
  { id: 'guide-territoire',   type: 'page', label: 'Guide territoire',            description: 'Guide intelligent par territoire',                  icon: 'Z', to: '/guide-territoire',          keywords: ['guide', 'territoire', 'information', 'local'] },
  { id: 'comprendre-prix',    type: 'page', label: 'Comprendre les prix',         description: 'Pourquoi les prix sont si élevés dans les DOM ?',   icon: 'K', to: '/comprendre-prix',           keywords: ['comprendre', 'prix', 'élevés', 'pourquoi', 'explication'] },
  { id: 'reclamation',        type: 'page', label: 'Réclamation IA',              description: 'Générer une lettre de réclamation',                 icon: 'W', to: '/reclamation-ia',           keywords: ['réclamation', 'lettre', 'plainte', 'ia', 'consommateur'] },
  { id: 'detection-fraude',   type: 'page', label: 'Détection de fraude',         description: 'Détecter les pratiques commerciales déloyales',     icon: 'R', to: '/detection-fraude',          keywords: ['fraude', 'détecter', 'pratique', 'déloyale', 'signaler'] },
  { id: 'faq',                type: 'page', label: 'FAQ',                          description: 'Questions fréquentes',                              icon: 'F', to: '/faq',                       keywords: ['faq', 'question', 'aide', 'comment', 'pourquoi'] },
  { id: 'contact',            type: 'page', label: 'Contact',                     description: 'Nous contacter',                                    icon: 'C', to: '/contact',                   keywords: ['contact', 'écrire', 'message', 'email'] },
  { id: 'a-propos',           type: 'page', label: 'À propos',                    description: 'Qui sommes-nous ?',                                 icon: 'P', to: '/a-propos',                  keywords: ['à propos', 'qui', 'sommes-nous', 'équipe', 'mission'] },
  { id: 'pricing',            type: 'page', label: 'Offres & abonnements',        description: 'Nos offres Pro, Institution...',                    icon: 'O', to: '/pricing',                   keywords: ['offre', 'abonnement', 'pro', 'institution', 'premium', 'gratuit'] },
  { id: 'rapport-citoyen',    type: 'page', label: 'Rapport citoyen',             description: 'Générer un rapport sur les prix de votre territoire',icon: 'R', to: '/rapport-citoyen',          keywords: ['rapport', 'citoyen', 'bilan', 'statistiques', 'territoire'] },
  // ── Territoires ──────────────────────────────────────────────────────────────
  { id: 'terr-gp',  type: 'territory', label: 'Guadeloupe',          description: 'Prix et actualités en Guadeloupe',          icon: 'G', to: '/comparaison-territoires?t=gp', keywords: ['guadeloupe', '971', 'pointe-à-pitre', 'basse-terre'] },
  { id: 'terr-mq',  type: 'territory', label: 'Martinique',          description: 'Prix et actualités en Martinique',          icon: 'M', to: '/comparaison-territoires?t=mq', keywords: ['martinique', '972', 'fort-de-france', 'lamentin'] },
  { id: 'terr-gf',  type: 'territory', label: 'Guyane',              description: 'Prix et actualités en Guyane',              icon: 'G', to: '/comparaison-territoires?t=gf', keywords: ['guyane', '973', 'cayenne', 'kourou', 'saint-laurent'] },
  { id: 'terr-re',  type: 'territory', label: 'La Réunion',          description: 'Prix et actualités à La Réunion',           icon: 'R', to: '/comparaison-territoires?t=re', keywords: ['réunion', '974', 'saint-denis', 'saint-pierre'] },
  { id: 'terr-yt',  type: 'territory', label: 'Mayotte',             description: 'Prix et actualités à Mayotte',              icon: 'M', to: '/comparaison-territoires?t=yt', keywords: ['mayotte', '976', 'mamoudzou', 'dzaoudzi'] },
  { id: 'terr-nc',  type: 'territory', label: 'Nouvelle-Calédonie',  description: 'Prix et actualités en Nouvelle-Calédonie',  icon: 'N', to: '/comparaison-territoires?t=nc', keywords: ['nouvelle-calédonie', 'noumea', 'nouméa', 'cal'] },
  { id: 'terr-pf',  type: 'territory', label: 'Polynésie française', description: 'Prix et actualités en Polynésie française', icon: 'P', to: '/comparaison-territoires?t=pf', keywords: ['polynésie', 'tahiti', 'papeete', 'moorea'] },
  { id: 'terr-fr',  type: 'territory', label: 'Métropole',           description: 'Prix en France métropolitaine',             icon: 'F', to: '/comparaison-territoires?t=fr', keywords: ['france', 'métropole', 'hexagone', 'paris', 'lyon', 'marseille'] },
  // ── Produits courants ─────────────────────────────────────────────────────────
  { id: 'prod-lait',       type: 'product', label: 'Lait',              description: 'Comparer le prix du lait',               icon: 'L', to: '/search?q=lait',          keywords: ['lait', 'litre', 'demi-écrémé', 'entier'] },
  { id: 'prod-riz',        type: 'product', label: 'Riz',               description: 'Comparer le prix du riz',                icon: 'R', to: '/search?q=riz',           keywords: ['riz', 'kg', 'blanc', 'brun', 'basmati'] },
  { id: 'prod-huile',      type: 'product', label: 'Huile',             description: 'Comparer le prix de l\'huile',           icon: 'H', to: '/search?q=huile',         keywords: ['huile', 'tournesol', 'olive', 'friture'] },
  { id: 'prod-pain',       type: 'product', label: 'Pain',              description: 'Comparer le prix du pain',               icon: 'P', to: '/search?q=pain',          keywords: ['pain', 'baguette', 'miche', 'boulangerie'] },
  { id: 'prod-sucre',      type: 'product', label: 'Sucre',             description: 'Comparer le prix du sucre',              icon: 'S', to: '/search?q=sucre',         keywords: ['sucre', 'blanc', 'roux', 'canne', 'kg'] },
  { id: 'prod-poulet',     type: 'product', label: 'Poulet',            description: 'Comparer le prix du poulet',             icon: 'P', to: '/search?q=poulet',        keywords: ['poulet', 'kg', 'entier', 'escalope', 'viande'] },
  { id: 'prod-poisson',    type: 'product', label: 'Poisson',           description: 'Comparer le prix du poisson',            icon: 'P', to: '/search?q=poisson',       keywords: ['poisson', 'filet', 'thon', 'saumon', 'tilapia'] },
  { id: 'prod-eau',        type: 'product', label: 'Eau minérale',      description: 'Comparer le prix de l\'eau',             icon: 'E', to: '/search?q=eau',           keywords: ['eau', 'minérale', 'bouteille', 'litre', 'plate', 'gazeuse'] },
  { id: 'prod-yaourt',     type: 'product', label: 'Yaourt',            description: 'Comparer le prix des yaourts',           icon: 'Y', to: '/search?q=yaourt',        keywords: ['yaourt', 'yogurt', 'nature', 'fruits', 'danone'] },
  { id: 'prod-beurre',     type: 'product', label: 'Beurre',            description: 'Comparer le prix du beurre',             icon: 'B', to: '/search?q=beurre',        keywords: ['beurre', 'doux', 'demi-sel', 'tartine'] },
  { id: 'prod-farine',     type: 'product', label: 'Farine',            description: 'Comparer le prix de la farine',          icon: 'F', to: '/search?q=farine',        keywords: ['farine', 'blé', 'maïs', 'kg', 't45', 't65'] },
  { id: 'prod-pates',      type: 'product', label: 'Pâtes',             description: 'Comparer le prix des pâtes',             icon: 'P', to: '/search?q=pates',         keywords: ['pâtes', 'spaghetti', 'tagliatelle', 'penne', 'macaroni'] },
  { id: 'prod-cafe',       type: 'product', label: 'Café',              description: 'Comparer le prix du café',               icon: 'C', to: '/search?q=cafe',          keywords: ['café', 'moulu', 'grain', 'expresso', 'nespresso'] },
  { id: 'prod-savon',      type: 'product', label: 'Savon / Lessive',   description: 'Comparer le prix des produits ménagers', icon: 'S', to: '/search?q=lessive',       keywords: ['savon', 'lessive', 'nettoyant', 'détergent', 'ménager'] },
  // ── Magasins (extraction depuis la page évaluation) ──────────────────────────
  { id: 'store-carrefour', type: 'store', label: 'Carrefour Désirade',        description: 'ZAC de Jarry, Baie-Mahault · Guadeloupe',           icon: 'C', to: '/evaluation-magasins?store=1',  keywords: ['carrefour', 'désirade', 'jarry', 'guadeloupe', 'supermarché'] },
  { id: 'store-champion',  type: 'store', label: 'Champion Lamentin',         description: 'Galeria, Le Lamentin · Martinique',                 icon: 'C', to: '/evaluation-magasins?store=2',  keywords: ['champion', 'lamentin', 'martinique', 'supermarché'] },
  { id: 'store-leader',    type: 'store', label: 'Leader Price Saint-Denis',  description: 'Rue du Maréchal Leclerc · La Réunion',              icon: 'L', to: '/evaluation-magasins?store=3',  keywords: ['leader', 'price', 'saint-denis', 'réunion', 'supermarché'] },
  { id: 'store-monoprix',  type: 'store', label: 'Monoprix Nouméa Centre',    description: 'Rue de l\'Alma, Nouméa · Nouvelle-Calédonie',       icon: 'M', to: '/evaluation-magasins?store=4',  keywords: ['monoprix', 'nouméa', 'nouvelle-calédonie', 'supermarché'] },
  { id: 'store-pharmgp',   type: 'store', label: 'Pharmacie du Bourg',        description: 'Centre-ville, Sainte-Anne · Guadeloupe',            icon: 'P', to: '/evaluation-magasins?store=5',  keywords: ['pharmacie', 'bourg', 'sainte-anne', 'guadeloupe'] },
  { id: 'store-pharmgf',   type: 'store', label: 'Pharmacie Centrale Cayenne',description: 'Av. du Gal de Gaulle, Cayenne · Guyane',            icon: 'P', to: '/evaluation-magasins?store=6',  keywords: ['pharmacie', 'centrale', 'cayenne', 'guyane'] },
  { id: 'store-leroy',     type: 'store', label: 'Leroy Merlin Jarry',        description: 'ZAC de Jarry, Baie-Mahault · Guadeloupe',           icon: 'L', to: '/evaluation-magasins?store=10', keywords: ['leroy merlin', 'bricolage', 'jarry', 'guadeloupe'] },
  { id: 'store-decath',    type: 'store', label: 'Décathlon Basse-Terre',     description: 'Route Nationale, Basse-Terre · Guadeloupe',         icon: 'D', to: '/evaluation-magasins?store=16', keywords: ['décathlon', 'sport', 'basse-terre', 'guadeloupe'] },
  { id: 'store-fnac',      type: 'store', label: 'FNAC Pointe-à-Pitre',       description: 'Milenis, Baie-Mahault · Guadeloupe',                icon: 'F', to: '/evaluation-magasins?store=18', keywords: ['fnac', 'informatique', 'pointe-à-pitre', 'guadeloupe'] },
  { id: 'store-hotel1',    type: 'store', label: 'Hôtel La Créole Beach',     description: 'Pointe de la Verdure, Gosier · Guadeloupe',         icon: 'H', to: '/evaluation-magasins?store=39', keywords: ['hôtel', 'créole', 'beach', 'gosier', 'guadeloupe'] },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const LS_KEY = 'akiprisaye-global-search-recent';

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const prev = getRecentSearches().filter((q) => q !== query);
    localStorage.setItem(LS_KEY, JSON.stringify([query, ...prev].slice(0, 6)));
  } catch { /* */ }
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['-]/g, ' ')
    .trim();
}

function score(item: SearchResult, query: string): number {
  const q = normalize(query);
  const label = normalize(item.label);
  const desc = normalize(item.description);
  const kws = item.keywords.map(normalize).join(' ');

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (kws.includes(q)) return 40;
  if (desc.includes(q)) return 20;

  // Partial token match
  const tokens = q.split(/\s+/);
  const hits = tokens.filter((t) => label.includes(t) || kws.includes(t) || desc.includes(t)).length;
  if (hits > 0) return (hits / tokens.length) * 15;

  return 0;
}

// ─── Type icons/colors ─────────────────────────────────────────────────────────

const TYPE_META = {
  page:      { label: 'Page',       color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  store:     { label: 'Magasin',    color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  product:   { label: 'Produit',    color: 'text-green-400',  bg: 'bg-green-500/15'  },
  territory: { label: 'Territoire', color: 'text-purple-400', bg: 'bg-purple-500/15' },
};

// ─── Composant ─────────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function GlobalSearch({ isOpen, onClose, initialQuery = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  // Load recent searches on open
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setActiveIdx(0);
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Compute results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return SEARCH_INDEX
      .map((item) => ({ item, score: score(item, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => r.item);
  }, [query]);

  const handleSelect = useCallback((item: SearchResult) => {
    saveRecentSearch(item.label);
    onClose();
    navigate(item.to);
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const max = results.length;
    if (!max) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % max);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + max) % max);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIdx]) handleSelect(results[activeIdx]);
    }
  }, [results, activeIdx, handleSelect]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [results]);

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une page, un produit, un magasin…"
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm outline-none min-w-0"
            autoComplete="off"
            spellCheck={false}
            aria-label="Recherche globale"
            aria-autocomplete="list"
            aria-controls="global-search-results"
            aria-activedescendant={results[activeIdx] ? `gsr-${results[activeIdx].id}` : undefined}
          />
          <button
            onClick={onClose}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Fermer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / empty states */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {/* Active results */}
          {results.length > 0 && (
            <ul
              id="global-search-results"
              ref={listRef}
              role="listbox"
              className="py-2"
            >
              {results.map((item, idx) => {
                const meta = TYPE_META[item.type];
                const isActive = idx === activeIdx;
                return (
                  <li
                    key={item.id}
                    id={`gsr-${item.id}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}
                  >
                    {/* Icon */}
                    <span className="text-xl shrink-0 w-7 text-center" aria-hidden="true">{item.icon}</span>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100 truncate">{item.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{item.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          )}

          {/* Empty state with recent searches */}
          {!query.trim() && (
            <div className="py-4 px-4">
              {recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recherches récentes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuery(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-slate-500 mb-3 text-center">Accès rapide</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                       { icon: 'C', label: 'Comparateur', to: '/comparateur' },
                       { icon: 'M', label: 'Carte magasins', to: '/carte' },
                       { icon: 'E', label: 'Évaluations', to: '/evaluation-magasins' },
                       { icon: 'A', label: 'Actualités', to: '/actualites' },
                       { icon: 'F', label: 'Carburants', to: '/comparateur-carburants' },
                       { icon: 'I', label: 'Alertes prix', to: '/alertes-prix' },
                    ].map((item) => (
                      <button
                        key={item.to}
                        onClick={() => { onClose(); navigate(item.to); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-sm transition-colors border border-slate-700/50 text-left"
                      >
                        <span className="text-base" aria-hidden="true">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && (
            <div className="py-10 px-4 text-center">
               <div className="text-3xl mb-3">Recherche</div>
              <p className="text-sm text-slate-400 mb-1">Aucun résultat pour <strong className="text-slate-200">« {query} »</strong></p>
              <p className="text-xs text-slate-500">Essayez un autre terme ou parcourez les rubriques du menu.</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400">↑↓</kbd> naviguer</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400">↵</kbd> sélectionner</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400">Esc</kbd> fermer</span>
          </div>
          <span className="hidden sm:block">A KI PRI SA YÉ</span>
        </div>
      </div>
    </div>
  );
}

// ─── Hook global keyboard shortcut ────────────────────────────────────────────

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpen]);
}
