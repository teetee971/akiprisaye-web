import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  DollarSign, Weight, TrendingDown, Map, BarChart3,
  Plane, Ship, Package, Droplet, Shield, GraduationCap,
  Car, HardHat, Wifi, ArrowRight, Users, ShoppingCart, Globe, Search,
  TrendingUp, Activity, Sparkles, Zap, Bell, Clock, BookOpen, FileText,
  Scale, SlidersHorizontal, Camera, Calculator, Heart, Trash2, Bot,
  Eye, Tag, HandHeart, BarChart2, Newspaper, MessageSquare, Star, Wallet,
  FlaskConical, Leaf,
} from 'lucide-react';
import { GlassCard } from '../components/ui/glass-card';
import Comparateur from './Comparateur';
import HistoriquePrix from './HistoriquePrix';

type ComparateurTab = 'prix' | 'kilo' | 'shrinkflation' | 'metropole' | 'historique';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ObsItem { produit: string; prix: number; enseigne: string; territoire?: string; commune?: string; unite?: string }
interface ObsSnapshot { territoire: string; date_snapshot: string; source: string; donnees: ObsItem[] }

// ── Real data loader from observatoire snapshots ───────────────────────────────
async function loadObsSnapshot(stem: string, month: string): Promise<ObsSnapshot | null> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}data/observatoire/${stem}_${month}.json`);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// ── General comparators navigation cards ─────────────────────────────────────
const GENERAL_COMPARATEURS = [
  { path: '/comparateur',            icon: DollarSign,        label: 'Comparateur Prix',          color: 'text-lime-400',    bg: 'bg-lime-500/10 border-lime-500/30',     desc: 'Comparer les prix produits en temps réel' },
  { path: '/comparateur-citoyen',    icon: Users,             label: 'Comparateur Citoyen',       color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/30',   desc: 'Comparaison participative, données citoyennes' },
  { path: '/comparateur-avance',     icon: SlidersHorizontal, label: 'Comparateur Avancé',        color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30', desc: 'Comparateur enrichi avec géolocalisation et fiabilité' },
  { path: '/compare',                icon: Scale,             label: 'Comparaison Rapide',        color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',       desc: 'Comparaison rapide par enseigne et distance' },
  { path: '/comparateurs-prix',      icon: BarChart2,         label: 'Comparateurs par Territoire', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30',     desc: 'Vue comparative multi-territoire par catégorie' },
  { path: '/comparaison-enseignes',  icon: Search,            label: 'Comparaison Enseignes',     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',     desc: 'Comparer les prix entre supermarchés' },
  { path: '/comparaison-panier',     icon: ShoppingCart,      label: 'Comparaison Panier',        color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/30',     desc: 'Simuler votre panier dans différentes enseignes' },
  { path: '/comparateur-territoires',icon: Globe,             label: 'Comparateur Territoires',   color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30', desc: 'Comparer les prix entre territoires DOM–COM' },
  { path: '/comparaison-territoires',icon: Map,               label: 'Bilan des Territoires',     color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',     desc: 'Vue d\'ensemble des écarts DOM vs Hexagone' },
  { path: '/inflation-categories',   icon: TrendingUp,        label: 'Inflation par Catégorie',   color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Suivi de l\'inflation par famille de produits' },
  { path: '/tableau-inflation',      icon: BarChart3,         label: 'Tableau de l\'Inflation',   color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'Tableau de bord inflation multi-territoires' },
  { path: '/couverture-territoires', icon: Activity,          label: 'Couverture Territoires',    color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30',     desc: 'Rapport de couverture des données par territoire' },
  { path: '/alertes-prix',           icon: Bell,              label: 'Alertes Prix',              color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',       desc: 'Soyez alerté quand un prix baisse' },
  { path: '/prix-historique',        icon: Clock,             label: 'Historique des Prix',       color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/30',   desc: 'Courbes d\'évolution des prix dans le temps' },
  { path: '/historique-prix',        icon: BarChart3,         label: 'Évolution des Prix',        color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/30', desc: 'Graphes d\'évolution des prix par produit' },
  { path: '/comparatif-concurrence', icon: Scale,             label: 'Comparatif Concurrence',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   desc: 'Positionnement d\'A KI PRI SA YÉ face aux alternatives' },
  { path: '/recherche-avancee',      icon: SlidersHorizontal, label: 'Recherche Avancée',         color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/30', desc: 'Moteur de recherche multi-critères et comparaison' },
];

// ── Specialized comparators navigation cards ──────────────────────────────────
const SPECIALIZED = [
  { path: '/comparateur-vols',            icon: Plane,       label: 'Vols',              color: 'text-sky-400',      bg: 'bg-sky-500/10 border-sky-500/30',    desc: 'Billets d\'avion DOM–Métropole et inter-îles' },
  { path: '/comparateur-bateaux',         icon: Ship,        label: 'Bateaux / Ferries', color: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/30',  desc: 'Traversées inter-îles Antilles' },
  { path: '/comparateur-fret',            icon: Package,     label: 'Fret / Colis',      color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/30',desc: 'Colissimo, DHL, GLS, UPS vers les DOM' },
  { path: '/comparateur-carburants',      icon: Droplet,     label: 'Carburants',        color: 'text-yellow-400',   bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'SP95, Diesel, GPL par territoire' },
  { path: '/comparateur-assurances',      icon: Shield,      label: 'Assurances',        color: 'text-purple-400',   bg: 'bg-purple-500/10 border-purple-500/30', desc: 'Auto, habitation, santé en DOM' },
  { path: '/comparateur-formations',      icon: GraduationCap, label: 'Formations',      color: 'text-pink-400',     bg: 'bg-pink-500/10 border-pink-500/30',  desc: 'Formations professionnelles et certifiantes' },
  { path: '/comparateur-location-voiture',icon: Car,         label: 'Location voiture',  color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Agences locales et internationales' },
  { path: '/comparateur-materiaux-batiment', icon: HardHat,  label: 'Matériaux BTP',     color: 'text-orange-400',   bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Ciment, acier, bois, tôles, PVC…' },
  { path: '/comparateur-services',        icon: Wifi,        label: 'Télécoms / Services', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', desc: 'Internet, mobile, eau, électricité' },
  { path: '/evaluation-cosmetique',       icon: Sparkles,    label: 'Cosmétiques',        color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30', desc: 'Évaluation des produits cosmétiques DOM' },
];

// ── Recherche-prix sub-comparators ─────────────────────────────────────────────
const RECHERCHE_PRIX = [
  { path: '/recherche-prix/avions',              icon: Plane,      label: 'Tarifs Avions',            color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',     desc: 'Prix des billets d\'avion DOM–Métropole par mois' },
  { path: '/recherche-prix/bateaux',             icon: Ship,       label: 'Tarifs Bateaux',           color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30',   desc: 'Traversées et ferries Antilles / Réunion' },
  { path: '/recherche-prix/fret',                icon: Package,    label: 'Prix Fret Maritime',       color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30', desc: 'Coûts du fret maritime vers les DOM' },
  { path: '/recherche-prix/fret-aerien',         icon: Package,    label: 'Prix Fret Aérien',         color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Tarifs de fret aérien express vers les DOM' },
  { path: '/recherche-prix/electricite',         icon: Zap,        label: 'Tarifs Électricité',       color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'Prix du kWh par territoire DOM–COM' },
  { path: '/recherche-prix/eau',                 icon: Droplet,    label: 'Tarifs Eau',               color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',   desc: 'Prix de l\'eau potable par collectivité' },
  { path: '/recherche-prix/abonnements-internet',icon: Wifi,       label: 'Abonnements Internet',     color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/30', desc: 'Offres fibre, ADSL et satellite par territoire' },
  { path: '/recherche-prix/abonnements-mobile',  icon: Wifi,       label: 'Abonnements Mobile',       color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30', desc: 'Forfaits mobiles 4G/5G en DOM–COM' },
  { path: '/recherche-prix/delais-logistiques',  icon: Clock,      label: 'Délais Logistiques',       color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',   desc: 'Tensions et délais d\'approvisionnement vers les DOM' },
  { path: '/recherche-prix/indice-logistique',   icon: BarChart3,  label: 'Indice Logistique',        color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/30',   desc: 'Indice synthétique du coût logistique par territoire' },
  { path: '/recherche-prix/pourquoi-delais-produit', icon: Activity, label: 'Pourquoi ces délais ?', color: 'text-lime-400',    bg: 'bg-lime-500/10 border-lime-500/30',   desc: 'Comprendre les causes des délais produits en DOM–COM' },
];

// ── Ressources & documentation ─────────────────────────────────────────────────
const RESSOURCES = [
  { path: '/comprendre-prix',                              icon: DollarSign,   label: 'Comprendre les Prix',              color: 'text-lime-400',    bg: 'bg-lime-500/10 border-lime-500/30',     desc: 'Décrypter la formation des prix en DOM–COM' },
  { path: '/ressources/questions-logistique-dom',          icon: BookOpen,     label: 'Questions Logistique DOM',         color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',       desc: 'FAQ sur la logistique et les surcoûts en outre-mer' },
  { path: '/ressources/glossaire-logistique-dom',          icon: FileText,     label: 'Glossaire Logistique',             color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30',     desc: 'Définitions clés : fret, octroi de mer, COTRAM…' },
  { path: '/ressources/comprendre-promotions-prix-barres', icon: TrendingDown, label: 'Promotions & Prix Barrés',         color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Décoder les promotions et les prix barrés en grande surface' },
  { path: '/ressources/pourquoi-prix-varie-sans-changement', icon: TrendingUp, label: 'Variations de Prix Silencieuses', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'Pourquoi un prix change sans que le produit évolue' },
];

// ── Scanner & OCR tools ────────────────────────────────────────────────────────
const SCANNERS = [
  { path: '/scanner',                icon: Camera,   label: 'Scanner Hub',             color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Hub de tous les outils de scan et reconnaissance' },
  { path: '/scan-ean',               icon: Camera,   label: 'Scan Code-barres EAN',    color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/30',     desc: 'Scanner un code-barres produit instantanément' },
  { path: '/scan-ocr',               icon: FileText, label: 'OCR Ticket de caisse',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       desc: 'Analyser un ticket de caisse par reconnaissance optique' },
  { path: '/scan-photo',             icon: Camera,   label: 'Photo Produit',           color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30',   desc: 'Identifier un produit par photo' },
  { path: '/analyse-photo-produit',  icon: FlaskConical, label: 'Analyse Photo Avancée', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30',       desc: 'Analyse approfondie des photos produit (IA)' },
  { path: '/ocr',                    icon: Eye,      label: 'OCR Hub',                 color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/30',     desc: 'Accès à tous les outils OCR de l\'application' },
];

// ── Calculators & simulators ────────────────────────────────────────────────────
const CALCULATEURS = [
  { path: '/calculateur-octroi',   icon: Calculator, label: 'Calculateur Octroi de Mer', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',   desc: 'Calculer l\'octroi de mer sur vos achats en DOM' },
  { path: '/simulateur-budget',    icon: Wallet,     label: 'Simulateur Budget Familial', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30',   desc: 'Simuler votre budget courses mensuel' },
  { path: '/budget-vital',         icon: Wallet,     label: 'Budget Vital',               color: 'text-lime-400',  bg: 'bg-lime-500/10 border-lime-500/30',     desc: 'Calcul du panier vital minimum par territoire' },
  { path: '/budget-reel-mensuel',  icon: BarChart2,  label: 'Budget Réel Mensuel',        color: 'text-teal-400',  bg: 'bg-teal-500/10 border-teal-500/30',     desc: 'Votre vrai budget mensuel selon les prix locaux' },
  { path: '/planificateur-repas',  icon: Leaf,       label: 'Planificateur Repas',        color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/30',desc: 'Planifier vos repas selon vos contraintes de budget' },
  { path: '/dlc-antigaspi',        icon: Trash2,     label: 'Anti-gaspillage DLC',        color: 'text-orange-400',bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Gérer les dates limites pour zéro gaspillage' },
  { path: '/analyse-nutri',        icon: Heart,      label: 'Analyse Nutritionnelle',     color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30',       desc: 'Évaluer la qualité nutritionnelle de vos achats' },
  { path: '/promos',               icon: Tag,        label: 'Promotions',                 color: 'text-pink-400',  bg: 'bg-pink-500/10 border-pink-500/30',     desc: 'Toutes les promos en cours dans votre territoire' },
  { path: '/alertes-rupture',      icon: Bell,       label: 'Alertes Rupture de Stock',   color: 'text-rose-400',  bg: 'bg-rose-500/10 border-rose-500/30',     desc: 'Être alerté des ruptures de stock locales' },
];

// ── Observatoire & Données ──────────────────────────────────────────────────────
const OBSERVATOIRE = [
  { path: '/observatoire',               icon: Eye,       label: 'Observatoire des Prix',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       desc: 'Hub de l\'observatoire citoyen des prix DOM–COM' },
  { path: '/observatoire-temps-reel',    icon: Activity,  label: 'Observatoire Temps Réel',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Données de prix actualisées en temps réel' },
  { path: '/observatoire-vivant',        icon: Sparkles,  label: 'Observatoire Vivant',        color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30',   desc: 'Visualisation dynamique de l\'évolution des prix' },
  { path: '/observatoire/methodologie',  icon: BookOpen,  label: 'Méthodologie Observatoire',  color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',         desc: 'Comment les données sont collectées et validées' },
  { path: '/vie-chere',                  icon: TrendingUp,label: 'Lutte Vie Chère',             color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         desc: 'Analyse de la vie chère en outre-mer' },
  { path: '/ievr',                       icon: BarChart3, label: 'Indice IEVR',                 color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     desc: 'Indice d\'équité de vie réelle par territoire' },
  { path: '/donnees-publiques',          icon: Globe,     label: 'Données Publiques',           color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30',       desc: 'Accès aux données publiques en open data' },
  { path: '/rapport-citoyen',            icon: FileText,  label: 'Rapport Citoyen',             color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/30',       desc: 'Générer un rapport citoyen sur les prix locaux' },
];

// ── IA & Analyses ───────────────────────────────────────────────────────────────
const IA_OUTILS = [
  { path: '/assistant-ia',        icon: Bot,       label: 'Assistant IA',            color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30',   desc: 'Posez vos questions à notre assistant intelligent' },
  { path: '/ia-reclamation',      icon: FileText,  label: 'IA Réclamation',          color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         desc: 'Rédiger une réclamation officielle assistée par IA' },
  { path: '/devis-ia',            icon: Calculator,label: 'Devis IA',                color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       desc: 'Obtenir un devis de travaux assisté par l\'IA' },
  { path: '/ai-insights',         icon: Sparkles,  label: 'IA Insights Marché',      color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     desc: 'Analyses IA du marché et tendances des prix' },
  { path: '/ia-conseiller',       icon: Star,      label: 'Conseiller IA',           color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',   desc: 'Conseils personnalisés basés sur vos habitudes' },
  { path: '/predictions',         icon: TrendingUp,label: 'Prédictions Prix',        color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/30',       desc: 'Prévisions d\'évolution des prix à court terme' },
  { path: '/analyse-concurrence', icon: BarChart2, label: 'Analyse Concurrence',     color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30',       desc: 'Analyse comparative des enseignes concurrentes' },
  { path: '/evaluation-cosmetique',icon: FlaskConical,label: 'Évaluation Cosmétiques',color:'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30', desc: 'Analyse IA des ingrédients cosmétiques' },
  { path: '/ai-dashboard',        icon: BarChart3, label: 'Tableau de Bord IA',      color: 'text-lime-400',    bg: 'bg-lime-500/10 border-lime-500/30',       desc: 'Tableau de bord IA avec prévisions et recommandations' },
];

// ── Citoyenneté & Communauté ────────────────────────────────────────────────────
const CITOYEN = [
  { path: '/groupes-parole',      icon: MessageSquare,label: 'Groupes de Parole',     color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/30',     desc: 'Rejoindre un groupe citoyen sur les prix locaux' },
  { path: '/solidarite',          icon: HandHeart,    label: 'Solidarité',            color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',       desc: 'Actions solidaires et entraide citoyenne' },
  { path: '/civic-modules',       icon: Users,        label: 'Modules Civiques',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',       desc: 'Outils citoyens de participation et de signalement' },
  { path: '/contribuer-prix',     icon: Eye,          label: 'Contribuer aux Prix',   color: 'text-lime-400',    bg: 'bg-lime-500/10 border-lime-500/30',       desc: 'Soumettre des prix observés dans votre enseigne' },
  { path: '/signalement',         icon: Bell,         label: 'Signaler un Abus',      color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30',   desc: 'Signaler une anomalie tarifaire ou un abus' },
  { path: '/lettre-hebdo',        icon: Newspaper,    label: 'Lettre Hebdo IA',       color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',         desc: 'La newsletter hebdomadaire sur les prix DOM–COM' },
  { path: '/conference-prix',     icon: Users,        label: 'Conférence Prix',       color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30',   desc: 'Programme des conférences citoyennes sur les prix' },
  { path: '/ti-panie',            icon: ShoppingCart, label: 'Ti Panie Solidaire',    color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/30',       desc: 'Panier solidaire pour les familles en difficulté' },
];

export default function ComparateursHub() {
  const [activeTab, setActiveTab] = useState<ComparateurTab>('prix');

  // ── Real observatoire data ────────────────────────────────────────────────────
  const [kiloItems, setKiloItems]         = useState<{ id: string; product: string; territory: string; avgPrice: number; unit: string; pricePerUnit: number; observations: number }[]>([]);
  const [metropoleItems, setMetropoleItems] = useState<{ id: string; product: string; territory: string; domPrice: number; metropolePrice: number }[]>([]);
  const [obsLoading, setObsLoading]       = useState(false);
  const [obsSource, setObsSource]         = useState('Observatoire A KI PRI SA YÉ – mars 2026');

  // Unit mapping: product name → [quantity, unit]
  const UNIT_MAP: Record<string, [number, string]> = {
    'Riz long blanc 1kg':      [1.0, 'kg'],
    'Huile de tournesol 1L':   [1.0, 'L'],
    'Lait demi-écrémé UHT 1L': [1.0, 'L'],
    'Sucre blanc 1kg':         [1.0, 'kg'],
    'Pâtes spaghetti 500g':    [0.5, 'kg'],
    'Eau minérale 1.5L':       [1.5, 'L'],
    'Café moulu 250g':         [0.25, 'kg'],
    'Poulet entier 1kg':       [1.0, 'kg'],
    'Tomates rondes 1kg':      [1.0, 'kg'],
    'Yaourt nature 4x125g':    [0.5, 'kg'],
  };

  useEffect(() => {
    if (activeTab !== 'kilo' && activeTab !== 'metropole') return;
    if (kiloItems.length > 0) return; // already loaded

    setObsLoading(true);

    const TERRITORIES = [
      { stem: 'guadeloupe', month: '2026-03', name: 'Guadeloupe' },
      { stem: 'martinique', month: '2026-03', name: 'Martinique' },
      { stem: 'guyane',     month: '2026-03', name: 'Guyane' },
      { stem: 'la_réunion', month: '2026-03', name: 'La Réunion' },
      { stem: 'mayotte',    month: '2026-03', name: 'Mayotte' },
    ];
    const HEX_STEM = { stem: 'hexagone', month: '2026-03', name: 'Hexagone' };

    Promise.all([
      ...TERRITORIES.map((t) => loadObsSnapshot(t.stem, t.month)),
      loadObsSnapshot(HEX_STEM.stem, HEX_STEM.month),
    ]).then((snaps) => {
      // Compute avg prices per (territory, product)
      const priceMap: Record<string, Record<string, number[]>> = {};
      snaps.forEach((snap, idx) => {
        if (!snap) return;
        const terrName = idx < TERRITORIES.length ? TERRITORIES[idx].name : HEX_STEM.name;
        snap.donnees.forEach((item) => {
          if (!UNIT_MAP[item.produit]) return;
          if (!priceMap[terrName]) priceMap[terrName] = {};
          if (!priceMap[terrName][item.produit]) priceMap[terrName][item.produit] = [];
          priceMap[terrName][item.produit].push(item.prix);
        });
      });

      // Build kilo items
      const kItems: typeof kiloItems = [];
      let idx = 1;
      Object.entries(priceMap).forEach(([territory, products]) => {
        if (territory === 'Hexagone') return;
        Object.entries(products).forEach(([product, prices]) => {
          if (!prices.length) return;
          const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
          const [qty, unit] = UNIT_MAP[product] ?? [1, 'unité'];
          kItems.push({
            id: `ppk-${idx++}`,
            product,
            territory,
            avgPrice: Math.round(avg * 100) / 100,
            unit,
            pricePerUnit: Math.round((avg / qty) * 100) / 100,
            observations: prices.length,
          });
        });
      });
      setKiloItems(kItems.slice(0, 20));

      // Build metropole comparison items
      const hexPrices = priceMap['Hexagone'] ?? {};
      const mItems: typeof metropoleItems = [];
      let midx = 1;
      Object.entries(priceMap).forEach(([territory, products]) => {
        if (territory === 'Hexagone') return;
        Object.entries(products).forEach(([product, prices]) => {
          const hexList = hexPrices[product];
          if (!prices.length || !hexList?.length) return;
          const domAvg = prices.reduce((s, v) => s + v, 0) / prices.length;
          const hexAvg = hexList.reduce((s, v) => s + v, 0) / hexList.length;
          mItems.push({
            id: `mp-${midx++}`,
            product,
            territory,
            domPrice: Math.round(domAvg * 100) / 100,
            metropolePrice: Math.round(hexAvg * 100) / 100,
          });
        });
      });
      setMetropoleItems(mItems.slice(0, 20));
      setObsLoading(false);
    });
  }, [activeTab]);

  const tabs = [
    { id: 'prix',         label: 'Prix standards',   icon: DollarSign,  description: 'Comparer les prix entre enseignes sur votre territoire' },
    { id: 'kilo',         label: 'Prix au kilo',      icon: Weight,      description: 'Comparer les prix ramenés au kilo ou au litre — données observatoire' },
    { id: 'shrinkflation',label: 'Shrinkflation',     icon: TrendingDown,description: 'Signalements citoyens de réductions de contenant sans baisse de prix' },
    { id: 'metropole',    label: 'vs Métropole',      icon: Map,         description: 'Écart de prix DOM–COM vs Hexagone — données observatoire mars 2026' },
    { id: 'historique',   label: 'Historique',        icon: BarChart3,   description: 'Évolution des prix dans le temps' },
  ] as const;

  const fmtPrice = (n: number) => n.toFixed(2) + ' €';

  return (
    <>
      <Helmet>
        <title>Comparateurs de prix – A KI PRI SA YÉ</title>
        <meta name="description" content="Comparez les prix entre enseignes, au kilo, avec la métropole. Accédez à tous les comparateurs spécialisés." />
      </Helmet>

      <div className="min-h-screen bg-slate-950 p-3 sm:p-4 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto">

          <div className="mb-5 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">📊 Comparateurs de prix</h1>
            <p className="text-gray-400 text-sm sm:text-lg">Tous vos outils de comparaison — données réelles observatoire</p>
          </div>

          {/* ── Tabs ── */}
          <GlassCard className="mb-4 p-2 sm:p-3">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ComparateurTab)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all flex-1 min-w-[calc(50%-0.375rem)] sm:flex-none sm:min-w-0 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-gray-300'
                    }`}
                    aria-label={`Sélectionner le mode ${tab.label}`}
                    aria-pressed={activeTab === tab.id}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Tab description */}
          <GlassCard className="mb-4 p-3 sm:p-4">
            <p className="text-gray-300 text-xs sm:text-sm">{tabs.find((t) => t.id === activeTab)?.description}</p>
          </GlassCard>

          {/* ── Tab Content ── */}
          <div>
            {activeTab === 'prix' && <Comparateur />}

            {activeTab === 'kilo' && (
              <GlassCard className="space-y-4">
                <h2 className="text-lg font-semibold text-white">⚖️ Prix au Kilo / Litre</h2>
                <p className="text-gray-400 text-sm">
                  Prix ramenés au kg ou au litre pour comparer les offres. Source : relevés citoyens observatoire (mars 2026).
                </p>
                <p className="text-xs text-slate-500">Source : {obsSource}</p>
                {obsLoading && <div className="h-8 bg-slate-700 rounded animate-pulse" />}
                {!obsLoading && kiloItems.length === 0 && (
                  <p className="text-gray-400 text-sm">Chargement des données…</p>
                )}
                {!obsLoading && kiloItems.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {kiloItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm leading-tight truncate">{item.product}</p>
                            <p className="text-xs text-slate-400">{item.territory}</p>
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">{item.observations} relevé{item.observations > 1 ? 's' : ''}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-blue-300 font-bold text-sm">
                            {fmtPrice(item.avgPrice)} <span className="text-xs font-normal text-blue-400">/ {item.product.match(/((?:\d+\s*x\s*\d+\s*(?:g|kg|L))|(?:\d+(?:[.,]\d+)?\s*(?:g|kg|L)))/i)?.[1] ?? item.unit}</span>
                          </span>
                          <span className="text-xs text-slate-400">{fmtPrice(item.pricePerUnit)} / {item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'shrinkflation' && (
              <GlassCard className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">📉 Signalements Shrinkflation</h2>
                <p className="text-gray-400 mb-4">
                  Cette section recense les signalements citoyens confirmés de réduction de contenant sans baisse proportionnelle du prix.
                  Les données ci-dessous proviennent uniquement de signalements vérifiés par la communauté.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                  <strong>Contribuez !</strong> Si vous avez constaté un produit dont la quantité a diminué sans que le prix baisse,{' '}
                  <Link to="/signaler-abus" className="underline hover:text-blue-200">signalez-le ici</Link>.
                  Nos équipes vérifient chaque signalement avant publication.
                </div>
                <div className="bg-slate-900/50 rounded-xl p-6 text-center">
                  <TrendingDown className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Aucun signalement vérifié pour ce mois-ci.</p>
                  <p className="text-gray-500 text-xs mt-1">Les premiers signalements vérifiés apparaîtront ici.</p>
                </div>
              </GlassCard>
            )}

            {activeTab === 'metropole' && (
              <GlassCard className="space-y-4">
                <h2 className="text-lg font-semibold text-white">🗺️ Équivalence vs Métropole</h2>
                <p className="text-gray-400 text-sm">
                  Écarts de prix entre chaque territoire DOM–COM et l'Hexagone.
                </p>
                <p className="text-xs text-slate-500">Source : {obsSource}</p>
                {obsLoading && <div className="h-8 bg-slate-700 rounded animate-pulse" />}
                {!obsLoading && metropoleItems.length === 0 && (
                  <p className="text-gray-400 text-sm">Chargement des données…</p>
                )}
                {!obsLoading && metropoleItems.length > 0 && (
                  <div className="space-y-2">
                    {metropoleItems.map((item) => {
                      const delta = item.domPrice - item.metropolePrice;
                      const pct   = item.metropolePrice > 0 ? Math.round((delta / item.metropolePrice) * 100) : 0;
                      const barPct = Math.min(100, Math.abs(pct));
                      const colorCls = pct > 30 ? 'text-red-400' : pct > 10 ? 'text-orange-400' : pct > 0 ? 'text-yellow-400' : 'text-green-400';
                      const barColor = pct > 30 ? '#f87171' : pct > 10 ? '#fb923c' : pct > 0 ? '#fbbf24' : '#4ade80';
                      return (
                        <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                          {/* Row 1: product + pct badge */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm leading-tight truncate">{item.product}</p>
                              <p className="text-xs text-slate-400">{item.territory}</p>
                            </div>
                            <span className={`shrink-0 font-bold text-sm tabular-nums ${colorCls}`}>
                              {pct > 0 ? '+' : ''}{pct}%
                            </span>
                          </div>
                          {/* Row 2: progress bar */}
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                            <div
                              style={{ width: `${barPct}%`, background: barColor }}
                              className="h-full rounded-full transition-all"
                              role="progressbar"
                              aria-valuenow={barPct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Écart de prix avec la métropole : ${pct > 0 ? '+' : ''}${pct}%`}
                            />
                          </div>
                          {/* Row 3: inline prices */}
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>🇫🇷 {fmtPrice(item.metropolePrice)}</span>
                            <span className={`font-semibold ${colorCls}`}>
                              {delta > 0 ? '+' : ''}{delta.toFixed(2)} €
                            </span>
                            <span className="text-slate-300">{item.territory.slice(0, 3).toUpperCase()} {fmtPrice(item.domPrice)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'historique' && <HistoriquePrix />}
          </div>

          {/* ── General comparators navigation ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">⚖️ Comparateurs généraux</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Prix citoyens, enseignes, panier et comparaisons inter-territoires.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {GENERAL_COMPARATEURS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Specialized comparators navigation ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">🔍 Comparateurs spécialisés</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Transports, énergie, assurances, formations, BTP — accédez directement à chaque outil.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {SPECIALIZED.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Recherche Prix sub-comparators ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">🔎 Recherche &amp; Tarifs</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Transports, énergie, eau, télécoms — tarifs détaillés par territoire et par période.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {RECHERCHE_PRIX.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Ressources & documentation ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">📚 Ressources &amp; Comprendre</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Guides pédagogiques, glossaire et analyses pour comprendre la formation des prix en DOM–COM.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {RESSOURCES.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Scanners & OCR ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">📷 Scanners &amp; OCR</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Scanner des produits, tickets de caisse et photos — identification instantanée.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {SCANNERS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Calculateurs & Simulateurs ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">🧮 Calculateurs &amp; Simulateurs</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Octroi de mer, budget familial, panier vital, repas — tous vos outils de calcul.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {CALCULATEURS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Observatoire & Données ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">🔭 Observatoire &amp; Données</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Données réelles, observatoire citoyen, vie chère et accès open data.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {OBSERVATOIRE.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── IA & Analyses ── */}
          <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">🤖 IA &amp; Analyses</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Assistant IA, réclamations, devis, prédictions et analyses de marché.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {IA_OUTILS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Citoyenneté & Communauté ── */}
          <div className="mt-8 mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">🤝 Citoyenneté &amp; Communauté</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Groupes citoyens, solidarité, signalements et newsletter communautaire.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {CITOYEN.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center sm:items-start gap-2 sm:gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-xs sm:text-sm leading-tight">{item.label}</p>
                      <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
