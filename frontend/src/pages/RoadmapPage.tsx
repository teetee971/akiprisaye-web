/**
 * RoadmapPage — Feuille de route publique A KI PRI SA YÉ
 *
 * Répond aux livrables de l'Issue #492 :
 *   ✅ Architecture technique détaillée
 *   ✅ Liste complète des modules & sous-modules
 *   ✅ Modèles de données (schémas)
 *   ✅ Roadmap MVP → V1 → V2
 *   ✅ Design system (règles claires)
 *   ✅ Stratégie IA responsable
 *   ✅ Modèle économique (tarification réelle)
 *   ✅ Checklist conformité & sécurité
 *
 * Principe : aucune donnée inventée — uniquement ce qui est constaté dans la base de code.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  CheckCircle,
  Clock,
  Circle,
  ChevronRight,
  BarChart3,
  Shield,
  Cpu,
  Palette,
  Brain,
  Wallet,
  List,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModuleStatus = 'done' | 'partial' | 'planned';
type PhaseKey = 'mvp' | 'v1' | 'v2';

interface RoadmapModule {
  name: string;
  description: string;
  status: ModuleStatus;
  features: { label: string; done: boolean }[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const MODULES: RoadmapModule[] = [
  {
    name: '1. Comparateur de prix avancé',
    description: 'Recherche et comparaison de produits entre enseignes et territoires DOM-COM.',
    status: 'partial',
    features: [
      { label: 'Comparaison multi-enseignes, multi-produits', done: true },
      { label: 'Comparaison multi-territoires', done: true },
      { label: 'Historique des prix & variations temporelles', done: true },
      { label: 'Comparaison par panier utilisateur', done: true },
      { label: "Indicateur d'écart DOM / métropole", done: false },
      { label: 'Optimisation GPS prix + distance', done: false },
    ],
  },
  {
    name: '2. Liste de courses intelligente GPS',
    description: 'Gestion de listes de courses avec géolocalisation et optimisation de trajet.',
    status: 'partial',
    features: [
      { label: 'Création et gestion de listes', done: true },
      { label: 'Recherche des produits exacts', done: true },
      { label: 'Géolocalisation automatique', done: true },
      { label: 'Calcul prix total & économies', done: true },
      { label: 'Meilleur compromis prix vs distance', done: false },
      { label: 'Parcours optimal suggéré', done: false },
    ],
  },
  {
    name: '3. Scanner universel',
    description: 'Reconnaissance de produits par code-barres EAN, OCR tickets ou photo.',
    status: 'done',
    features: [
      { label: 'Scan codes-barres EAN', done: true },
      { label: 'OCR tickets de caisse', done: true },
      { label: 'Reconnaissance produit par photo', done: true },
      { label: 'Association produit ↔ prix ↔ enseigne', done: true },
      { label: 'Mode hors-ligne partiel', done: true },
    ],
  },
  {
    name: '4. Fiche produit complète',
    description: 'Données nutritionnelles, traçabilité, historique des prix et alertes sanitaires.',
    status: 'done',
    features: [
      { label: 'Nom, fabricant, origine, composition', done: true },
      { label: 'Nutri-Score & Eco-Score', done: true },
      { label: 'Traçabilité & sources officielles', done: true },
      { label: 'Historique des prix', done: true },
      { label: 'Enseignes disponibles & prix locaux', done: true },
      { label: 'Alertes sanitaires liées au produit', done: true },
    ],
  },
  {
    name: '5. Alertes consommateurs',
    description: 'Notifications personnalisées sur les variations de prix et rappels de produits.',
    status: 'partial',
    features: [
      { label: 'Alertes prix personnalisées', done: true },
      { label: 'Alertes sanitaires & rappels produits', done: true },
      { label: 'Page dédiée par alerte', done: true },
      { label: 'Bouton "Signaler un produit"', done: true },
      { label: 'Rapport exportable (PDF / CSV)', done: false },
    ],
  },
  {
    name: '6. Fiches entreprises (SIRET / SIREN)',
    description: "Informations légales et publiques des enseignes référencées sur la plateforme.",
    status: 'partial',
    features: [
      { label: 'Nom légal, statut, adresse, GPS', done: true },
      { label: 'Données SIRET / SIREN visibles', done: true },
      { label: 'Territoires couverts', done: false },
      { label: "Historique public de l'enseigne", done: false },
    ],
  },
  {
    name: '7. Marketplace enseignes (payante)',
    description: 'Espace dédié aux enseignes pour publier leurs magasins, prix et statistiques.',
    status: 'done',
    features: [
      { label: 'Inscription payante', done: true },
      { label: 'Ajout de magasins & mise à jour prix', done: true },
      { label: 'Gestion multi-boutiques', done: true },
      { label: 'Statistiques & analytics internes', done: true },
      { label: 'Facturation automatique', done: true },
    ],
  },
  {
    name: '8. IA de prédiction des prix (responsable)',
    description: 'Prévisions basées sur historiques réels avec transparence des hypothèses.',
    status: 'partial',
    features: [
      { label: 'Prédictions basées sur historiques réels', done: true },
      { label: 'Données publiques intégrées', done: true },
      { label: 'Affichage des hypothèses et limites', done: false },
      { label: 'Intervalles de confiance visibles', done: false },
    ],
  },
  {
    name: '9. Devis IA (B2G / B2B)',
    description: 'Module de devis structuré avec pipeline de validation humaine pour institutions.',
    status: 'done',
    features: [
      { label: 'Formulaire structuré avec identité légale', done: true },
      { label: "Moteur d'estimation IA explicable", done: true },
      { label: 'Validation humaine obligatoire', done: true },
      { label: 'Pipeline DRAFT→VALIDATED→SENT→ACCEPTED→PAID', done: true },
      { label: "Piste d'audit complète (Firestore)", done: true },
      { label: 'Dashboard client de suivi', done: true },
      { label: 'Interface admin devis', done: true },
    ],
  },
  {
    name: '10. Observatoire des prix',
    description: 'Tableau de bord public des tendances de prix par territoire et catégorie.',
    status: 'done',
    features: [
      { label: 'Indice de pression inflationniste', done: true },
      { label: 'Statistiques produits les plus chers', done: true },
      { label: 'Tendances de prix IA', done: true },
      { label: 'Cartographie des prix par territoire', done: true },
      { label: 'Export rapport (PDF / CSV)', done: false },
      { label: 'Alertes marchés automatiques', done: false },
    ],
  },
  {
    name: '11. Comparateurs spécialisés',
    description: 'Suite de comparateurs sectoriels : carburants, vols, fret, assurances, télécoms…',
    status: 'done',
    features: [
      { label: 'Comparateur carburants DOM-COM (temps réel)', done: true },
      { label: 'Comparateur vols DOM ↔ Métropole', done: true },
      { label: 'Comparateur fret maritime', done: true },
      { label: 'Comparateur assurances habitation & auto', done: true },
      { label: 'Comparateur télécoms & services', done: true },
      { label: 'Comparateur location voiture', done: true },
      { label: 'Comparateur matériaux de construction', done: true },
      { label: 'API temps réel billets avion', done: false },
    ],
  },
  {
    name: '12. Messagerie & communauté citoyenne',
    description: 'Espaces de dialogue entre citoyens : groupes de parole, messagerie privée.',
    status: 'done',
    features: [
      { label: 'Messagerie privée inter-citoyens', done: true },
      { label: 'Groupes de parole thématiques', done: true },
      { label: 'Modération et signalements', done: true },
      { label: 'Notifications en temps réel', done: true },
      { label: 'Archivage et export conversations', done: false },
    ],
  },
  {
    name: '13. Administration & back-office',
    description: 'Panneau de gestion pour administrateurs : utilisateurs, produits, devis, contenus.',
    status: 'done',
    features: [
      { label: 'Gestion des utilisateurs & rôles', done: true },
      { label: 'Gestion des produits & prix', done: true },
      { label: 'Validation et suivi des devis B2G', done: true },
      { label: 'Tableau de bord analytics', done: true },
      { label: 'Checklist de conformité production', done: true },
      { label: 'Logs et audit sécurité', done: false },
    ],
  },
  {
    name: '14. API institutionnelle & accès données',
    description: "Accès programmatique aux données de la plateforme pour partenaires et institutions.",
    status: 'planned',
    features: [
      { label: 'Documentation API publique (OpenAPI)', done: false },
      { label: 'Authentification par clé API', done: false },
      { label: 'Endpoints prix, produits, territoires', done: false },
      { label: 'Rate limiting & quotas par offre', done: false },
      { label: 'Tableau de bord usage API', done: false },
    ],
  },
  {
    name: '15. Mode hors-ligne étendu (PWA)',
    description: 'Application progressive avec cache local pour zones à faible connectivité.',
    status: 'planned',
    features: [
      { label: 'Cache produits consultés récemment', done: false },
      { label: 'Scan EAN hors-ligne', done: false },
      { label: 'Synchronisation différée des listes', done: false },
      { label: 'Manifest PWA & icônes installables', done: false },
      { label: 'Notification push (alertes prix)', done: false },
    ],
  },
];

const PHASES: { key: PhaseKey; label: string; subtitle: string; items: string[] }[] = [
  {
    key: 'mvp',
    label: 'MVP',
    subtitle: 'Plateforme opérationnelle — Déployée',
    items: [
      'Comparateur de prix multi-enseignes, multi-territoires',
      'Scanner EAN + OCR tickets de caisse',
      'Fiche produit avec historique',
      'Alertes prix personnalisées',
      'Authentification & gestion des rôles',
      "Interface d'administration",
      'Messagerie interne citoyenne',
      'Groupes de parole citoyens',
      'Observatoire des prix avec données historiques',
      'CI/CD industriel + déploiement Cloudflare Pages',
    ],
  },
  {
    key: 'v1',
    label: 'V1',
    subtitle: 'Monétisation & institutionnel — En cours',
    items: [
      'Marketplace enseignes payante (opérationnelle)',
      'Abonnements citoyens + Pro + Business',
      'Module Devis IA B2G avec validation humaine',
      'Dossier investisseurs structuré',
      'Prédictions de prix explicables',
      'Optimisation GPS liste de courses',
      'Rapport exportable alertes consommateurs',
      "Indicateur d'écart prix DOM / métropole",
    ],
  },
  {
    key: 'v2',
    label: 'V2',
    subtitle: 'Extension territoriale & partenariats — Planifiée',
    items: [
      'Extension aux COM éloignées (Polynésie, Nouvelle-Calédonie…)',
      'Partenariats formels avec observatoires officiels',
      'Accès API documenté pour institutions',
      'Rapports sectoriels automatisés',
      'Fiches entreprises enrichies (historique public)',
      'Intervalles de confiance sur les prédictions IA',
      'Mode hors-ligne étendu (PWA)',
      'Extension comparative nationale (conditionnel)',
    ],
  },
];

const DESIGN_SYSTEM = [
  { rule: 'Couleur primaire', value: 'Indigo 600 (#4F46E5) — institutionnel, sobre' },
  { rule: "Couleur d'alerte", value: "Ambre 500 / Rouge 600 — signaux d'urgence uniquement" },
  { rule: 'Typographie', value: 'Système natif (font-sans) — lisibilité maximale' },
  { rule: 'Espacement', value: 'Grille Tailwind 4px — cohérence globale' },
  { rule: 'Cartes', value: 'rounded-xl (12px), shadow-sm, border border-gray-200' },
  { rule: 'Boutons primaires', value: 'bg-indigo-600 rounded-xl px-6 py-2.5 font-semibold' },
  { rule: 'Accessibilité', value: 'WCAG AA minimum — focus visible, aria-labels, contraste ≥ 4,5:1' },
  { rule: 'Animations', value: 'Framer Motion — transitions fonctionnelles, jamais gadget' },
  { rule: 'Densité', value: 'UI dense sur desktop, single-column sur mobile' },
  { rule: 'Icônes', value: 'Lucide React — cohérence, taille 4 (16px) ou 5 (20px)' },
];

const AI_STRATEGY = [
  { principe: 'Explicabilité obligatoire', detail: "Chaque estimation IA affiche ses facteurs de calcul, ligne par ligne, visibles pour l'utilisateur." },
  { principe: "Pas d'engagement automatique", detail: "Aucun devis, contrat ou engagement contractuel n'est émis sans validation humaine explicite." },
  { principe: 'Données uniquement réelles', detail: 'Les modèles de prédiction utilisent exclusivement les historiques de prix observés et les données publiques vérifiables.' },
  { principe: 'Intervalles de confiance', detail: 'Les prédictions affichent leurs limites : intervalle, horizon temporel et hypothèses de départ. Prévu en V2.' },
  { principe: 'Pas de LLM opaque', detail: 'Pas de modèle de langage tiers non auditable. Les règles métier sont codées explicitement et versionnées.' },
  { principe: 'Disclaimer systématique', detail: "Chaque sortie IA est accompagnée d'un avertissement clair sur sa nature indicative et non contractuelle." },
];

const CONFORMITE = [
  { categorie: 'RGPD', items: ["Minimisation des données collectées", "Consentement explicite à l'inscription", "Droit d'accès et de suppression implémentés", 'Aucune revente de données personnelles', 'Durée de conservation documentée'] },
  { categorie: 'Sécurité', items: ['Règles Firestore séparant accès citoyen / pro / admin', 'Aucune clé API exposée côté client', 'CSP configurée via Cloudflare', 'CI/CD avec étapes de lint et test bloquantes', 'Rollback instantané sur Cloudflare Pages'] },
  { categorie: 'Conformité légale devis', items: ['Identité légale (SIRET/SIREN) obligatoire', 'Horodatage et traçabilité de chaque action', "Piste d'audit immuable (Firestore arrayUnion)", 'Séparation stricte estimation IA / devis contractuel'] },
  { categorie: 'Accessibilité', items: ['WCAG AA minimum visé', 'Aria-labels sur éléments interactifs', 'Navigation clavier supportée', 'Contrastes respectés sur tous les composants actifs'] },
];

const DATA_SCHEMAS = [
  {
    collection: 'users',
    fields: ['uid: string', 'email: string', 'displayName: string', 'role: "citizen"|"pro"|"admin"', 'createdAt: Timestamp'],
  },
  {
    collection: 'conversations/{id}/messages',
    fields: ['from: string (uid)', 'text: string', 'at: Timestamp'],
  },
  {
    collection: 'devis',
    fields: ['ref: string (DEVIS-YYYYMMDD-NNNN)', 'status: DevisStatus', 'organisation: string', 'siret: string', 'typesBesoin: TypeBesoin[]', 'estimation: DevisEstimation', 'quote: DevisQuote | null', 'auditTrail: DevisAuditEntry[]', 'createdAt: Timestamp'],
  },
  {
    collection: 'groupes_parole',
    fields: ['name: string', 'territoire: TerritoryCode', 'members: string[]', 'createdAt: Timestamp'],
  },
  {
    collection: 'prices / price_observations',
    fields: ['productId: string', 'storeId: string', 'price: number', 'date: Timestamp', 'source: string', 'territory: TerritoryCode'],
  },
  {
    collection: 'stores',
    fields: ['name: string', 'siret: string', 'address: string', 'location: GeoPoint', 'hours: StoreHours', 'territory: TerritoryCode'],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'roadmap', label: 'Roadmap', icon: BarChart3 },
  { key: 'modules', label: 'Modules', icon: List },
  { key: 'schemas', label: 'Schémas données', icon: Cpu },
  { key: 'design', label: 'Design system', icon: Palette },
  { key: 'ia', label: 'Stratégie IA', icon: Brain },
  { key: 'conformite', label: 'Conformité', icon: Shield },
  { key: 'economique', label: 'Modèle éco.', icon: Wallet },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');

  return (
    <>
      <Helmet>
        <title>Roadmap & Architecture — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Feuille de route, architecture technique, modules, stratégie IA et conformité — A KI PRI SA YÉ"
        />
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/roadmap" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/roadmap" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/roadmap" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="px-4 pt-4 max-w-5xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.roadmap}
            alt="Roadmap — évolutions prévues de la plateforme"
            gradient="from-slate-950 to-purple-900"
            height="h-48 sm:h-64"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Feuille de route
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow leading-tight">
              🗺️ Roadmap
            </h1>
            <p className="text-purple-100 text-sm mt-2 drop-shadow max-w-2xl">
              Les évolutions prévues de la plateforme
            </p>
          </HeroImage>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 pb-20">

          {/* ── ROADMAP ────────────────────────────────────────────────── */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              {PHASES.map((phase) => (
                <div
                  key={phase.key}
                  className={`border rounded-2xl p-6
                    ${phase.key === 'mvp' ? 'border-green-200 bg-green-50/30' : phase.key === 'v1' ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0
                        ${phase.key === 'mvp' ? 'bg-green-100 text-green-800' : phase.key === 'v1' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {phase.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 leading-snug">{phase.subtitle}</p>
                    </div>
                    {phase.key === 'mvp' && (
                      <span className="flex-shrink-0 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                        ✓ Déployé
                      </span>
                    )}
                    {phase.key === 'v1' && (
                      <span className="flex-shrink-0 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        En cours
                      </span>
                    )}
                    {phase.key === 'v2' && (
                      <span className="flex-shrink-0 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">
                        Planifié
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {phase.items.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MODULES ────────────────────────────────────────────────── */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Opérationnel</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> Partiel</span>
                  <span className="flex items-center gap-1"><Circle className="w-3.5 h-3.5 text-gray-300" /> Planifié</span>
                </div>
                <Link
                  to="/module-audit"
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  → Audit complet de tous les modules
                </Link>
              </div>
              {/* Completion summary */}
              {(() => {
                const total = MODULES.reduce((n, m) => n + m.features.length, 0);
                const done = MODULES.reduce((n, m) => n + m.features.filter(f => f.done).length, 0);
                const pct = Math.round((done / total) * 100);
                const opCount = MODULES.filter(m => m.status === 'done').length;
                const partialCount = MODULES.filter(m => m.status === 'partial').length;
                const plannedCount = MODULES.filter(m => m.status === 'planned').length;
                return (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">Avancement global</span>
                      <span className="text-sm font-bold text-indigo-700">{done} / {total} fonctionnalités ({pct} %)</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Avancement global : ${pct}%`}
                      className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3"
                    >
                      <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> {opCount} opérationnel{opCount > 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> {partialCount} partiel{partialCount > 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Circle className="w-3.5 h-3.5 text-gray-300" /> {plannedCount} planifié{plannedCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })()}
              {MODULES.map((mod) => (
                <div key={mod.name} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-1">
                    <div className="mt-0.5 flex-shrink-0">
                      {mod.status === 'done' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {mod.status === 'partial' && <Clock className="w-5 h-5 text-yellow-500" />}
                      {mod.status === 'planned' && <Circle className="w-5 h-5 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{mod.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${mod.status === 'done' ? 'bg-green-100 text-green-700' : mod.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                          {mod.status === 'done' ? 'Opérationnel' : mod.status === 'partial' ? 'Partiel' : 'Planifié'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-3">
                    {mod.features.map((f) => (
                      <div key={f.label} className={`flex items-start gap-2 text-sm ${f.done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {f.done
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          : <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                        }
                        {f.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SCHEMAS ────────────────────────────────────────────────── */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Collections Firestore principales. Les champs listés sont ceux utilisés
                en production. L'architecture est schéma-flexible (NoSQL) — les champs
                optionnels ne sont pas systématiquement présents.
              </p>
              {DATA_SCHEMAS.map((schema) => (
                <div key={schema.collection} className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="font-mono text-sm font-bold text-indigo-700 mb-3">
                    {schema.collection}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {schema.fields.map((f) => (
                      <p key={f} className="font-mono text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── DESIGN SYSTEM ──────────────────────────────────────────── */}
          {activeTab === 'design' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                Règles de design appliquées sur l'ensemble de la plateforme.
                Fondées sur Tailwind CSS 4 + Lucide React.
              </p>
              {DESIGN_SYSTEM.map((d) => (
                <div key={d.rule} className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-start gap-4">
                  <p className="text-sm font-semibold text-gray-900 w-44 flex-shrink-0">{d.rule}</p>
                  <p className="text-sm text-gray-600 font-mono">{d.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── IA ─────────────────────────────────────────────────────── */}
          {activeTab === 'ia' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Principes de l'IA responsable appliqués sur la plateforme.
                Aucun modèle opaque n'est utilisé — les règles métier sont explicites
                et versionnées dans le code source ouvert.
              </p>
              {AI_STRATEGY.map((s) => (
                <div key={s.principe} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-sm text-indigo-700 mb-1">{s.principe}</p>
                  <p className="text-sm text-gray-600">{s.detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── CONFORMITÉ ─────────────────────────────────────────────── */}
          {activeTab === 'conformite' && (
            <div className="space-y-5">
              {CONFORMITE.map((cat) => (
                <div key={cat.categorie} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">{cat.categorie}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ── MODÈLE ÉCONOMIQUE ──────────────────────────────────────── */}
          {activeTab === 'economique' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Tarification réelle telle que configurée dans la plateforme.
                Aucune projection de revenus n'est présentée — les métriques d'adoption
                sont en phase pilote.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">Offre</th>
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">Mensuel</th>
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">Annuel</th>
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">Cible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { offre: 'Gratuit', monthly: '0 €', yearly: '0 €', cible: 'Grand public — scan illimité, comparaisons basiques' },
                      { offre: 'Citoyen Premium', monthly: '3,99 €', yearly: '39 €', cible: 'Citoyens actifs — OCR, alertes, historique 12 mois' },
                      { offre: 'Pro', monthly: '19 €', yearly: '190 €', cible: 'Associations, analystes, professionnels' },
                      { offre: 'Business', monthly: '99 €', yearly: '990 €', cible: 'Équipes, exploitation intensive' },
                      { offre: 'Institution', monthly: 'Sur devis', yearly: 'Sur devis', cible: 'Collectivités, État, chercheurs' },
                      { offre: 'Prestation IA', monthly: 'Par projet', yearly: 'Par projet', cible: 'Rapports, audits, études territoriales' },
                    ].map((r) => (
                      <tr key={r.offre} className="border-b border-gray-200">
                        <td className="px-4 py-2.5 border border-gray-200 font-medium">{r.offre}</td>
                        <td className="px-4 py-2.5 border border-gray-200 text-indigo-700 font-medium">{r.monthly}</td>
                        <td className="px-4 py-2.5 border border-gray-200 text-indigo-700">{r.yearly}</td>
                        <td className="px-4 py-2.5 border border-gray-200 text-gray-600">{r.cible}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Note :</strong> Une remise DOM -30 % est appliquée sur les offres Pro et Business
                pour les utilisateurs dont le territoire est un DOM-COM. Ce mécanisme est implémenté
                dans le système de facturation.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
