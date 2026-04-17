/**
 * RoadmapPage — Feuille de route publique A KI PRI SA YÉ
 *
 * Répond aux livrables de l'Issue #492 :
 *   ✅ Architecture technique détaillée
 *   ✅ Liste complète des modules & sous-modules
 *   ✅ Modèles de données (schémas)
 *   ✅ Roadmap MVP → V1 → V2
 *   ✅ UX wireframes (description structurée)
 *   ✅ Design system (règles claires)
 *   ✅ Stratégie IA responsable
 *   ✅ Modèle économique (tarification réelle)
 *   ✅ Checklist conformité & sécurité
 *
 * Principe : aucune donnée inventée — uniquement ce qui est constaté dans la base de code.
 */

import { useMemo, useState } from 'react';
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
  Search,
  Server,
  ExternalLink,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModuleStatus = 'done' | 'partial' | 'planned';
type PhaseKey = 'mvp' | 'v1' | 'v2' | 'v3';

interface RoadmapPhase {
  key: PhaseKey;
  label: string;
  subtitle: string;
  items: string[];
  /** ISO 8601 — début de la phase */
  startDate: string;
  /** ISO 8601 — livraison cible (ou date réelle si déjà déployé) */
  targetDate: string;
}

interface RoadmapModule {
  name: string;
  description: string;
  status: ModuleStatus;
  features: { label: string; done: boolean }[];
  link?: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const MODULES: RoadmapModule[] = [
  {
    name: '1. Comparateur de prix avancé',
    description: 'Recherche et comparaison de produits entre enseignes et territoires DOM-COM.',
    status: 'partial',
    link: '/comparateur',
    features: [
      { label: 'Comparaison multi-enseignes, multi-produits', done: true },
      { label: 'Comparaison multi-territoires', done: true },
      { label: 'Historique des prix & variations temporelles', done: true },
      { label: 'Comparaison par panier utilisateur', done: true },
      { label: "Indicateur d'écart DOM / métropole", done: true },
      { label: 'Optimisation GPS prix + distance', done: false },
    ],
  },
  {
    name: '2. Liste de courses intelligente GPS',
    description: 'Gestion de listes de courses avec géolocalisation et optimisation de trajet.',
    status: 'partial',
    link: '/liste',
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
    link: '/scanner',
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
    link: '/alertes',
    features: [
      { label: 'Alertes prix personnalisées', done: true },
      { label: 'Alertes sanitaires & rappels produits', done: true },
      { label: 'Page dédiée par alerte', done: true },
      { label: 'Bouton "Signaler un produit"', done: true },
      { label: 'Rapport exportable (PDF / CSV)', done: true },
    ],
  },
  {
    name: '6. Fiches entreprises (SIRET / SIREN)',
    description: 'Informations légales et publiques des enseignes référencées sur la plateforme.',
    status: 'done',
    features: [
      { label: 'Nom légal, statut, adresse, GPS', done: true },
      { label: 'Données SIRET / SIREN visibles', done: true },
      { label: 'Territoires couverts', done: true },
      { label: "Historique public de l'enseigne", done: true },
    ],
  },
  {
    name: '7. Marketplace enseignes (payante)',
    description: 'Espace dédié aux enseignes pour publier leurs magasins, prix et statistiques.',
    status: 'done',
    link: '/inscription-pro',
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
    status: 'done',
    features: [
      { label: 'Prédictions basées sur historiques réels', done: true },
      { label: 'Données publiques intégrées', done: true },
      { label: 'Affichage des hypothèses et limites', done: true },
      { label: 'Intervalles de confiance visibles', done: true },
    ],
  },
  {
    name: '9. Devis IA (B2G / B2B)',
    description: 'Module de devis structuré avec pipeline de validation humaine pour institutions.',
    status: 'done',
    link: '/devis-ia',
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
    status: 'partial',
    link: '/observatoire',
    features: [
      { label: 'Indice de pression inflationniste', done: true },
      { label: 'Statistiques produits les plus chers', done: true },
      { label: 'Tendances de prix IA', done: true },
      { label: 'Cartographie des prix par territoire', done: true },
      { label: 'Export rapport (PDF / CSV)', done: true },
      { label: 'Alertes marchés automatiques', done: false },
    ],
  },
  {
    name: '11. Comparateurs spécialisés',
    description: 'Suite de comparateurs sectoriels : carburants, vols, fret, assurances, télécoms…',
    status: 'partial',
    link: '/comparateurs',
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
    status: 'partial',
    link: '/messagerie',
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
    description:
      'Panneau de gestion pour administrateurs : utilisateurs, produits, devis, contenus.',
    status: 'partial',
    features: [
      { label: 'Gestion des utilisateurs & rôles', done: true },
      { label: 'Gestion des produits & prix', done: true },
      { label: 'Validation et suivi des devis B2G', done: true },
      { label: 'Tableau de bord analytics', done: true },
      { label: 'Checklist de conformité production', done: true },
      { label: 'Logs et audit sécurité', done: true },
    ],
  },
  {
    name: '14. API institutionnelle & accès données',
    description:
      'Accès programmatique aux données de la plateforme pour partenaires et institutions.',
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

  // ── Nouvelles fonctionnalités suggérées ───────────────────────────────────
  {
    name: '16. Guide intelligent des territoires',
    description:
      "Guide par territoire (Guadeloupe, Martinique, etc.) alimenté par l'IA avec conseils locaux.",
    status: 'partial',
    link: '/guide-territoire',
    features: [
      { label: 'Fiche territoire : économie, prix, spécificités locales', done: true },
      { label: "Conseils d'achat contextuels par territoire", done: true },
      { label: 'Comparaison inter-territoires assistée par IA', done: false },
      { label: 'Mise à jour dynamique via données observatoire', done: false },
    ],
  },
  {
    name: "17. Graphiques d'historique des prix interactifs",
    description: 'Visualisation interactive des séries chronologiques pour chaque produit.',
    status: 'done',
    features: [
      { label: 'Graphique temporel par produit (recharts)', done: true },
      { label: 'Filtres par territoire, enseigne, catégorie', done: true },
      { label: 'Vue mensuelle / annuelle / par produit', done: true },
      { label: 'Export CSV / PDF des séries historiques', done: true },
      { label: 'Comparaison multi-produits sur le même graphique', done: true },
    ],
  },
  {
    name: '18. Outil de création de budgets comparatifs',
    description: 'Élaborez des budgets familiaux dans différents territoires DOM-COM.',
    status: 'done',
    features: [
      { label: 'Simulateur budget familial mensuel', done: true },
      { label: 'Comparaison par territoire', done: true },
      { label: 'Export PDF du budget comparatif', done: true },
      { label: 'Panier type DOM vs Métropole', done: true },
    ],
  },
  {
    name: "19. Transparence de la chaîne d'approvisionnement",
    description:
      "Représentation visuelle du parcours d'un produit de son origine à la mise en rayon.",
    status: 'partial',
    link: '/chaine-fourniture',
    features: [
      { label: 'Timeline du parcours produit (origine → rayon)', done: true },
      { label: 'Affichage des intermédiaires (importateurs, distributeurs)', done: true },
      { label: 'Coûts de transport et taxes visibles', done: true },
      { label: 'Sources publiques (douanes, fret) intégrées', done: false },
    ],
  },
  {
    name: '20. Tableau de bord des partenaires commerciaux',
    description: 'Synchronisation en temps réel pour les réseaux de commerçants.',
    status: 'partial',
    features: [
      { label: 'Dashboard enseigne avec stats et analytics', done: true },
      { label: 'Gestion multi-magasins et mise à jour des prix', done: true },
      { label: 'Synchronisation temps réel avec API partenaire', done: false },
      { label: 'Intégration Carrefour, E.Leclerc, Coursesu.com', done: false },
    ],
  },
  {
    name: '21. Classement des contributions communautaires',
    description: 'Mise en avant des meilleurs contributeurs par territoire.',
    status: 'partial',
    features: [
      { label: 'Leaderboard global et par territoire', done: true },
      { label: 'Badges et récompenses de contribution', done: true },
      { label: 'Vérification des parrainages', done: false },
      { label: 'Métadonnées territoriales complètes', done: false },
    ],
  },
  {
    name: "22. Synchronisation avec l'application mobile",
    description: 'Meilleure fonctionnalité hors ligne et synchronisation mobile.',
    status: 'planned',
    features: [
      { label: 'Wrapper Capacitor (iOS / Android)', done: false },
      { label: 'Cache local synchronisé (listes, alertes)', done: false },
      { label: 'Push notifications mobiles', done: false },
      { label: 'Facturation Google Play / App Store', done: false },
    ],
  },
  {
    name: '23. Scanner de magasin AR',
    description:
      'Numérisation des rayons en réalité augmentée avec comparaison de prix instantanée.',
    status: 'partial',
    link: '/ar-scanner',
    features: [
      { label: 'Accès caméra et flux vidéo en direct', done: true },
      { label: 'Bounding boxes et overlay produits détectés', done: true },
      { label: 'Intégration TensorFlow.js ou Google Vision API', done: false },
      { label: 'Comparaison de prix en temps réel dans le rayon', done: false },
    ],
  },
  {
    name: '24. Changement de territoire dynamique',
    description: "Comparaison fluide lors des déplacements d'utilisateurs entre territoires.",
    status: 'done',
    features: [
      { label: 'Comparateur inter-territoires opérationnel', done: true },
      { label: 'Détection géolocation du territoire actuel', done: true },
      { label: 'Bascule dynamique sans rechargement de page', done: true },
      { label: 'Mémorisation du territoire préféré (localStorage)', done: true },
    ],
  },
  {
    name: '25. Alertes de prix prédictives',
    description:
      "Alertes basées sur l'apprentissage automatique pour des moments d'achat optimaux.",
    status: 'partial',
    features: [
      { label: 'Alertes prix personnalisées opérationnelles', done: true },
      { label: 'Prédictions basées sur historiques réels', done: true },
      { label: "Modèle ML pour fenêtres d'achat optimal", done: false },
      { label: 'Canaux alerte (push / e-mail / in-app) connectés', done: false },
    ],
  },
  {
    name: '26. Commerce social',
    description: 'Partagez vos listes de courses et vos recommandations avec vos amis.',
    status: 'partial',
    link: '/commerce-social',
    features: [
      { label: 'Partage de liste de courses entre utilisateurs', done: false },
      { label: 'Recommandations produits entre citoyens', done: false },
      { label: 'Messagerie inter-citoyens existante', done: true },
      { label: 'Profil public de contributeur', done: false },
    ],
  },
  {
    name: '27. Analyse des factures',
    description: 'Historique des dépenses et analyse des tendances par extraction OCR.',
    status: 'done',
    link: '/analyse-factures',
    features: [
      { label: 'Upload de factures PDF / photo', done: true },
      { label: 'Extraction OCR des montants et produits', done: true },
      { label: 'Catégorisation automatique des dépenses', done: true },
      { label: 'Tableau de bord tendances de dépenses', done: true },
      { label: 'Export CSV / PDF du rapport', done: true },
    ],
  },
  {
    name: '28. Détection de fraude',
    description: 'Signalement des hausses de prix inhabituelles ou des anomalies via ML.',
    status: 'partial',
    link: '/detection-fraude',
    features: [
      { label: 'Signalement manuel abus déjà opérationnel', done: true },
      { label: "Détection automatique d'anomalies de prix", done: false },
      { label: 'Algorithme de scoring des variations suspectes', done: false },
      { label: 'Tableau de bord admin alertes fraude', done: false },
    ],
  },
  {
    name: '29. Évaluation des magasins par les utilisateurs',
    description: 'Notation : qualité du service, propreté, disponibilité des produits.',
    status: 'partial',
    link: '/evaluation-magasins',
    features: [
      { label: 'Formulaire de notation (service, propreté, disponibilité)', done: true },
      { label: 'Affichage des notes agrégées sur la fiche magasin', done: true },
      { label: 'Classement des magasins par territoire', done: true },
      { label: 'Modération des avis citoyens', done: true },
    ],
  },
  {
    name: '30. Portail API pour développeurs',
    description:
      'API publique documentée pour les intégrations tierces et partenaires institutionnels.',
    status: 'partial',
    link: '/portail-developpeurs',
    features: [
      { label: 'Documentation OpenAPI interactive (Swagger)', done: true },
      {
        label:
          'Endpoints publics live (carburants, actualités, taux change, signalconso, IEVR, prix)',
        done: true,
      },
      { label: 'Génération et gestion de clés API', done: false },
      { label: 'Sandbox de test avec données anonymisées', done: false },
      { label: 'Rate limiting et quotas par plan', done: false },
      { label: 'SDK JavaScript / Python open-source', done: false },
    ],
  },
];

const PHASES: RoadmapPhase[] = [
  {
    key: 'mvp',
    label: 'MVP',
    subtitle: 'Plateforme opérationnelle — Déployée',
    startDate: '2026-01-14T09:00',
    targetDate: '2026-04-07T17:00',
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
    startDate: '2026-04-07T09:00',
    targetDate: '2026-06-30T17:00',
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
    startDate: '2026-07-01T09:00',
    targetDate: '2026-10-31T17:00',
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
  {
    key: 'v3',
    label: 'V3',
    subtitle: 'Nouvelles fonctionnalités & intelligence augmentée — Partiellement déployé',
    startDate: '2026-04-14T10:00',
    targetDate: '2027-02-28T17:00',
    items: [
      'Guide intelligent des territoires alimenté par IA ✅',
      'Scanner AR de rayons (TensorFlow.js / Google Vision) ⚙️',
      "Transparence de la chaîne d'approvisionnement ✅",
      'Commerce social (partage de listes et recommandations) ⚙️',
      'Analyse des factures par OCR + IA ⚙️',
      'Détection de fraude par apprentissage automatique ⚙️',
      'Évaluation des magasins par les utilisateurs ✅',
      'Portail API développeurs avec SDK open-source ⚙️',
      'Alertes de prix prédictives (ML)',
      'Synchronisation application mobile (Capacitor)',
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
  {
    rule: 'Accessibilité',
    value: 'WCAG AA minimum — focus visible, aria-labels, contraste ≥ 4,5:1',
  },
  { rule: 'Animations', value: 'Framer Motion — transitions fonctionnelles, jamais gadget' },
  { rule: 'Densité', value: 'UI dense sur desktop, single-column sur mobile' },
  { rule: 'Icônes', value: 'Lucide React — cohérence, taille 4 (16px) ou 5 (20px)' },
];

const AI_STRATEGY = [
  {
    principe: 'Explicabilité obligatoire',
    detail:
      "Chaque estimation IA affiche ses facteurs de calcul, ligne par ligne, visibles pour l'utilisateur.",
  },
  {
    principe: "Pas d'engagement automatique",
    detail:
      "Aucun devis, contrat ou engagement contractuel n'est émis sans validation humaine explicite.",
  },
  {
    principe: 'Données uniquement réelles',
    detail:
      'Les modèles de prédiction utilisent exclusivement les historiques de prix observés et les données publiques vérifiables.',
  },
  {
    principe: 'Intervalles de confiance',
    detail:
      'Les prédictions affichent leurs limites : intervalle, horizon temporel et hypothèses de départ. Implémenté dans le composant AIPricePrediction.',
  },
  {
    principe: 'Pas de LLM opaque',
    detail:
      'Pas de modèle de langage tiers non auditable. Les règles métier sont codées explicitement et versionnées.',
  },
  {
    principe: 'Disclaimer systématique',
    detail:
      "Chaque sortie IA est accompagnée d'un avertissement clair sur sa nature indicative et non contractuelle.",
  },
];

const CONFORMITE = [
  {
    categorie: 'RGPD',
    items: [
      'Minimisation des données collectées',
      "Consentement explicite à l'inscription",
      "Droit d'accès et de suppression implémentés",
      'Aucune revente de données personnelles',
      'Durée de conservation documentée',
    ],
  },
  {
    categorie: 'Sécurité',
    items: [
      'Règles Firestore séparant accès citoyen / pro / admin',
      'Aucune clé API exposée côté client',
      'CSP configurée via Cloudflare',
      'CI/CD avec étapes de lint et test bloquantes',
      'Rollback instantané sur Cloudflare Pages',
    ],
  },
  {
    categorie: 'Conformité légale devis',
    items: [
      'Identité légale (SIRET/SIREN) obligatoire',
      'Horodatage et traçabilité de chaque action',
      "Piste d'audit immuable (Firestore arrayUnion)",
      'Séparation stricte estimation IA / devis contractuel',
    ],
  },
  {
    categorie: 'Accessibilité',
    items: [
      'WCAG AA minimum visé',
      'Aria-labels sur éléments interactifs',
      'Navigation clavier supportée',
      'Contrastes respectés sur tous les composants actifs',
    ],
  },
];

const DATA_SCHEMAS = [
  {
    collection: 'users',
    fields: [
      'uid: string',
      'email: string',
      'displayName: string',
      'role: "citizen"|"pro"|"admin"',
      'createdAt: Timestamp',
    ],
  },
  {
    collection: 'conversations/{id}/messages',
    fields: ['from: string (uid)', 'text: string', 'at: Timestamp'],
  },
  {
    collection: 'devis',
    fields: [
      'ref: string (DEVIS-YYYYMMDD-NNNN)',
      'status: DevisStatus',
      'organisation: string',
      'siret: string',
      'typesBesoin: TypeBesoin[]',
      'estimation: DevisEstimation',
      'quote: DevisQuote | null',
      'auditTrail: DevisAuditEntry[]',
      'createdAt: Timestamp',
    ],
  },
  {
    collection: 'groupes_parole',
    fields: [
      'name: string',
      'territoire: TerritoryCode',
      'members: string[]',
      'createdAt: Timestamp',
    ],
  },
  {
    collection: 'prices / price_observations',
    fields: [
      'productId: string',
      'storeId: string',
      'price: number',
      'date: Timestamp',
      'source: string',
      'territory: TerritoryCode',
    ],
  },
  {
    collection: 'stores',
    fields: [
      'name: string',
      'siret: string',
      'address: string',
      'location: GeoPoint',
      'hours: StoreHours',
      'territory: TerritoryCode',
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const ARCHITECTURE = [
  {
    couche: 'Frontend',
    icone: '🖥️',
    stack: [
      'React 18 + TypeScript 5 — UI déclarative, typage strict',
      'Vite 5 — build ultra-rapide, HMR instantané',
      'Tailwind CSS 4 — design system utilitaire',
      'React Router 6 — navigation SPA côté client',
      'Firebase SDK v10 — Auth, Firestore, Storage',
      'Recharts — graphiques de prix interactifs',
      'Lucide React — icônes cohérentes',
      'Framer Motion — animations fonctionnelles',
    ],
  },
  {
    couche: 'Backend / Serverless',
    icone: '⚙️',
    stack: [
      'Cloudflare Pages Functions (TypeScript) — API serverless à la périphérie',
      'Firebase Auth — authentification citoyens / pro / admin',
      'Firestore (NoSQL) — base de données temps réel, règles de sécurité granulaires',
      'Firebase Storage — stockage photos produits et tickets OCR',
    ],
  },
  {
    couche: 'Hébergement & Déploiement',
    icone: '🚀',
    stack: [
      'Cloudflare Pages — hébergement principal (CDN mondial, latence < 50 ms)',
      'GitHub Pages — miroir de déploiement (backup / tests)',
      'GitHub Actions — CI/CD : lint → typecheck → tests → build → deploy',
      'Rollback instantané via Cloudflare Pages (version précédente en 1 clic)',
      'Prerender statique de 91+ routes pour SEO et deep-links',
    ],
  },
  {
    couche: 'APIs exposées',
    icone: '🔌',
    stack: [
      'GET /api/fuel-prices — carburants DOM-COM temps réel',
      'GET /api/news — actualités territoriales',
      'GET /api/exchange-rates — taux de change',
      'GET /api/signalconso — alertes SignalConso',
      'GET /api/indice — indice IEVR',
      'GET /api/health — statut de la plateforme',
      'GET /api/prices/realtime?ean&territory — prix temps réel (OpenPrices)',
      'GET /api/prices/feed?territory&since&limit — flux de prix historiques',
      'POST /api/browser-rendering/crawl — crawl Cloudflare Browser Rendering sécurisé',
      'GET /api/browser-rendering/crawl?id=jobId — statut et résultats d’un crawl',
    ],
  },
  {
    couche: 'Sécurité',
    icone: '🔐',
    stack: [
      'Règles Firestore : séparation stricte citoyen / pro / admin',
      'Aucune clé API exposée côté client (variables Cloudflare uniquement)',
      'CSP (Content Security Policy) configurée via Cloudflare',
      'Audit automatique NPM (CI bloquant si vulnérabilité critique)',
      'Merge Conflict Marker detection en CI',
    ],
  },
  {
    couche: 'Observabilité',
    icone: '📊',
    stack: [
      'Cloudflare Analytics — trafic et performances',
      'Cache HTTP adaptatif : 5 min (prix temps réel), 10 min (flux), 30 min (carburants)',
      "Logs Firestore pour les pistes d'audit devis",
      'Checklist de conformité production accessible depuis /admin',
    ],
  },
];

const UX_WIREFRAMES = [
  {
    page: 'Comparateur de prix',
    route: '/comparateur',
    layout: [
      'En-tête : barre de recherche produit + sélecteur de territoire',
      'Résultats : liste de cartes produit (photo, nom, prix min/max, écart métropole)',
      'Détail produit : historique graphique, enseignes, Nutri-Score, traçabilité',
      'Filtres latéraux : catégorie, enseigne, territoire, fourchette de prix',
    ],
  },
  {
    page: 'Liste de courses',
    route: '/liste',
    layout: [
      'Formulaire d\'ajout rapide (EAN ou nom) + bouton "Scanner"',
      'Liste de courses avec quantités, prix unitaires et total',
      'Carte GPS : enseignes proches avec prix comparés',
      'Résumé : enseigne optimale (prix + distance), économies potentielles',
    ],
  },
  {
    page: 'Scanner universel',
    route: '/scanner',
    layout: [
      'Flux caméra plein écran avec viseur EAN animé',
      'Affichage immédiat du produit reconnu (nom, prix local, Nutri-Score)',
      'Bouton "OCR ticket" : photo de ticket → liste de produits extraits',
      'Historique des scans récents en bas de page',
    ],
  },
  {
    page: 'Observatoire des prix',
    route: '/observatoire',
    layout: [
      "Tableau de bord : indice d'inflation, top produits en hausse, carte territoriale",
      'Graphiques de tendances (mensuel / annuel) par catégorie',
      'Comparaison inter-territoires : Guadeloupe vs Métropole vs Martinique…',
      'Export rapport PDF / CSV (planifié V1)',
    ],
  },
  {
    page: 'Administration',
    route: '/admin',
    layout: [
      'Tableau de bord : KPIs globaux, utilisateurs actifs, devis en cours',
      'Gestion utilisateurs : rôles, suspension, historique connexions',
      'Gestion produits & prix : ajout, correction, validation crowdsource',
      'Suivi devis B2G : pipeline DRAFT → VALIDATED → SENT → PAID',
      'Checklist conformité production : 20+ critères vérifiables',
    ],
  },
  {
    page: 'Profil & Abonnement',
    route: '/profil',
    layout: [
      'Informations personnelles + territoire préféré',
      "Offre active avec limites d'utilisation (quotas)",
      'Historique des alertes prix reçues',
      'Accès aux fonctionnalités premium selon le plan',
    ],
  },
];

const TABS = [
  { key: 'roadmap', label: 'Roadmap', icon: BarChart3 },
  { key: 'modules', label: 'Modules', icon: List },
  { key: 'architecture', label: 'Architecture', icon: Server },
  { key: 'schemas', label: 'Schémas données', icon: Cpu },
  { key: 'design', label: 'Design system', icon: Palette },
  { key: 'ia', label: 'Stratégie IA', icon: Brain },
  { key: 'conformite', label: 'Conformité', icon: Shield },
  { key: 'economique', label: 'Modèle éco.', icon: Wallet },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');
  const [moduleSearch, setModuleSearch] = useState('');

  const filteredModules = useMemo(() => {
    if (!moduleSearch.trim()) return MODULES;
    const q = moduleSearch.toLowerCase();
    return MODULES.filter(
      (mod) =>
        mod.name.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.features.some((f) => f.label.toLowerCase().includes(q))
    );
  }, [moduleSearch]);

  const completionStats = useMemo(() => {
    const total = MODULES.reduce((n, m) => n + m.features.length, 0);
    const done = MODULES.reduce((n, m) => n + m.features.filter((f) => f.done).length, 0);
    const pct = Math.round((done / total) * 100);
    const opCount = MODULES.filter((m) => m.status === 'done').length;
    const partialCount = MODULES.filter((m) => m.status === 'partial').length;
    const plannedCount = MODULES.filter((m) => m.status === 'planned').length;
    return { total, done, pct, opCount, partialCount, plannedCount };
  }, []);

  return (
    <>
      <Helmet>
        <title>Roadmap & Architecture — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Feuille de route, architecture technique, modules, stratégie IA et conformité — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/roadmap" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/roadmap"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/roadmap"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="A KI PRI SA YÉ" />
        <meta property="og:title" content="Roadmap & Architecture — A KI PRI SA YÉ" />
        <meta
          property="og:description"
          content="Feuille de route publique, architecture technique, modules déployés, stratégie IA responsable et conformité RGPD de la plateforme A KI PRI SA YÉ."
        />
        <meta property="og:url" content="https://teetee971.github.io/akiprisaye-web/roadmap" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="px-4 pt-4 max-w-5xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.roadmap}
            alt="Roadmap — évolutions prévues de la plateforme"
            gradient="from-slate-950 to-purple-900"
            height="h-36 sm:h-48"
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
          <div
            role="tablist"
            aria-label="Sections de la feuille de route"
            className="flex flex-wrap gap-2 border-b border-gray-200 pb-3"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${
                    activeTab === tab.key
                      ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 pb-12">
          {/* ── ROADMAP ────────────────────────────────────────────────── */}
          {activeTab === 'roadmap' && (
            <div
              id="panel-roadmap"
              role="tabpanel"
              aria-labelledby="tab-roadmap"
              className="space-y-6"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  État d&apos;avancement global
                </h2>
                <p className="text-sm text-gray-700">
                  Non, toutes les feuilles de route ne sont pas encore finalisées :{' '}
                  <span className="font-semibold text-indigo-700">
                    {completionStats.done} fonctionnalités sur {completionStats.total}
                  </span>{' '}
                  sont livrées, et{' '}
                  <span className="font-semibold text-amber-700">
                    {completionStats.total - completionStats.done} restent à mettre en ligne
                  </span>
                  .
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Détail complet dans l&apos;onglet <span className="font-medium">Modules</span>{' '}
                  (opérationnel, partiel, planifié).
                </p>
              </div>
              {PHASES.map((phase) => (
                <div
                  key={phase.key}
                  className={`border rounded-2xl p-6
                    ${phase.key === 'mvp' ? 'border-green-200 bg-green-50/30' : phase.key === 'v1' ? 'border-indigo-200 bg-indigo-50/20' : phase.key === 'v3' ? 'border-purple-200 bg-purple-50/20' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0
                        ${phase.key === 'mvp' ? 'bg-green-100 text-green-800' : phase.key === 'v1' ? 'bg-indigo-100 text-indigo-800' : phase.key === 'v3' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {phase.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 leading-snug">{phase.subtitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span>
                          🗓 Début :{' '}
                          <time dateTime={phase.startDate}>
                            {new Date(phase.startDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            à{' '}
                            {new Date(phase.startDate).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </span>
                        <span>
                          🏁 {phase.key === 'mvp' ? 'Livré' : 'Cible'} :{' '}
                          <time dateTime={phase.targetDate}>
                            {new Date(phase.targetDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            à{' '}
                            {new Date(phase.targetDate).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </span>
                      </p>
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
                    {phase.key === 'v3' && (
                      <span className="flex-shrink-0 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        En déploiement
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
            <div
              id="panel-modules"
              role="tabpanel"
              aria-labelledby="tab-modules"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Opérationnel
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-500" /> Partiel
                  </span>
                  <span className="flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5 text-gray-300" /> Planifié
                  </span>
                </div>
                <Link
                  to="/module-audit"
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  → Audit complet de tous les modules
                </Link>
              </div>
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Rechercher un module…"
                  aria-label="Rechercher un module"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
              </div>
              {/* Completion summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Avancement global</span>
                  <span className="text-sm font-bold text-indigo-700">
                    {completionStats.done} / {completionStats.total} fonctionnalités (
                    {completionStats.pct} %)
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={completionStats.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Avancement global : ${completionStats.pct}%`}
                  className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3"
                >
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${completionStats.pct}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {completionStats.opCount}{' '}
                    opérationnel{completionStats.opCount > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-500" /> {completionStats.partialCount}{' '}
                    partiel{completionStats.partialCount > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5 text-gray-300" /> {completionStats.plannedCount}{' '}
                    planifié{completionStats.plannedCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {filteredModules.map((mod) => (
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
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${mod.status === 'done' ? 'bg-green-100 text-green-700' : mod.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {mod.status === 'done'
                            ? 'Opérationnel'
                            : mod.status === 'partial'
                              ? 'Partiel'
                              : 'Planifié'}
                        </span>
                        {mod.link && (
                          <Link
                            to={mod.link}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Voir la page
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-3">
                    {mod.features.map((f) => (
                      <div
                        key={f.label}
                        className={`flex items-start gap-2 text-sm ${f.done ? 'text-gray-700' : 'text-gray-400'}`}
                      >
                        {f.done ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        {f.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {moduleSearch.trim() && filteredModules.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">
                  Aucun module ne correspond à « {moduleSearch} ».
                </p>
              )}
            </div>
          )}

          {/* ── ARCHITECTURE ───────────────────────────────────────────── */}
          {activeTab === 'architecture' && (
            <div
              id="panel-architecture"
              role="tabpanel"
              aria-labelledby="tab-architecture"
              className="space-y-5"
            >
              <p className="text-sm text-gray-600 mb-4">
                Architecture technique telle que déployée en production. Toutes les technologies
                listées sont actives dans la base de code.
              </p>
              {ARCHITECTURE.map((layer) => (
                <div key={layer.couche} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{layer.icone}</span>
                    <h3 className="font-semibold text-gray-900">{layer.couche}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {layer.stack.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* UX Wireframes */}
              <div className="border-t border-gray-200 pt-5">
                <h2 className="text-base font-semibold text-gray-900 mb-1">
                  🖼️ UX — Structure des écrans principaux
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Description structurée des layouts de chaque page clé de la plateforme.
                </p>
                <div className="space-y-4">
                  {UX_WIREFRAMES.map((wf) => (
                    <div key={wf.page} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900">{wf.page}</h3>
                        <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {wf.route}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {wf.layout.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEMAS ────────────────────────────────────────────────── */}
          {activeTab === 'schemas' && (
            <div
              id="panel-schemas"
              role="tabpanel"
              aria-labelledby="tab-schemas"
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 mb-4">
                Collections Firestore principales. Les champs listés sont ceux utilisés en
                production. L'architecture est schéma-flexible (NoSQL) — les champs optionnels ne
                sont pas systématiquement présents.
              </p>
              {DATA_SCHEMAS.map((schema) => (
                <div
                  key={schema.collection}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <p className="font-mono text-sm font-bold text-indigo-700 mb-3">
                    {schema.collection}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {schema.fields.map((f) => (
                      <p
                        key={f}
                        className="font-mono text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
                      >
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
            <div
              id="panel-design"
              role="tabpanel"
              aria-labelledby="tab-design"
              className="space-y-2"
            >
              <p className="text-sm text-gray-600 mb-4">
                Règles de design appliquées sur l'ensemble de la plateforme. Fondées sur Tailwind
                CSS 4 + Lucide React.
              </p>
              {DESIGN_SYSTEM.map((d) => (
                <div
                  key={d.rule}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-start gap-4"
                >
                  <p className="text-sm font-semibold text-gray-900 w-44 flex-shrink-0">{d.rule}</p>
                  <p className="text-sm text-gray-600 font-mono">{d.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── IA ─────────────────────────────────────────────────────── */}
          {activeTab === 'ia' && (
            <div id="panel-ia" role="tabpanel" aria-labelledby="tab-ia" className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Principes de l'IA responsable appliqués sur la plateforme. Aucun modèle opaque n'est
                utilisé — les règles métier sont explicites et versionnées dans le code source
                ouvert.
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
            <div
              id="panel-conformite"
              role="tabpanel"
              aria-labelledby="tab-conformite"
              className="space-y-5"
            >
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
            <div
              id="panel-economique"
              role="tabpanel"
              aria-labelledby="tab-economique"
              className="space-y-5"
            >
              <p className="text-sm text-gray-600">
                Tarification réelle telle que configurée dans la plateforme. Aucune projection de
                revenus n'est présentée — les métriques d'adoption sont en phase pilote.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">
                        Offre
                      </th>
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">
                        Mensuel
                      </th>
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">
                        Annuel
                      </th>
                      <th className="text-left px-4 py-2.5 border border-gray-200 font-semibold">
                        Cible
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        offre: 'Gratuit',
                        monthly: '0 €',
                        yearly: '0 €',
                        cible: 'Grand public — scan illimité, comparaisons basiques',
                      },
                      {
                        offre: 'Citoyen Premium',
                        monthly: '3,99 €',
                        yearly: '39 €',
                        cible: 'Citoyens actifs — OCR, alertes, historique 12 mois',
                      },
                      {
                        offre: 'Pro',
                        monthly: '19 €',
                        yearly: '190 €',
                        cible: 'Associations, analystes, professionnels',
                      },
                      {
                        offre: 'Business',
                        monthly: '99 €',
                        yearly: '990 €',
                        cible: 'Équipes, exploitation intensive',
                      },
                      {
                        offre: 'Institution',
                        monthly: 'Sur devis',
                        yearly: 'Sur devis',
                        cible: 'Collectivités, État, chercheurs',
                      },
                      {
                        offre: 'Prestation IA',
                        monthly: 'Par projet',
                        yearly: 'Par projet',
                        cible: 'Rapports, audits, études territoriales',
                      },
                    ].map((r) => (
                      <tr key={r.offre} className="border-b border-gray-200">
                        <td className="px-4 py-2.5 border border-gray-200 font-medium">
                          {r.offre}
                        </td>
                        <td className="px-4 py-2.5 border border-gray-200 text-indigo-700 font-medium">
                          {r.monthly}
                        </td>
                        <td className="px-4 py-2.5 border border-gray-200 text-indigo-700">
                          {r.yearly}
                        </td>
                        <td className="px-4 py-2.5 border border-gray-200 text-gray-600">
                          {r.cible}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Note :</strong> Une remise DOM -30 % est appliquée sur les offres Pro et
                Business pour les utilisateurs dont le territoire est un DOM-COM. Ce mécanisme est
                implémenté dans le système de facturation.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
