/**
 * ModuleAuditPage — Audit complet des modules A KI PRI SA YÉ
 *
 * Recense l'intégralité des modules fonctionnels de la plateforme,
 * groupés par domaine, avec leur statut d'implémentation réel.
 *
 * Principle: only what is verifiably present in the codebase is listed.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle,
  Clock,
  Circle,
  ExternalLink,
  BarChart3,
  ShoppingCart,
  Scan,
  Eye,
  Brain,
  Users,
  Shield,
  Briefcase,
  Star,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModuleStatus = 'done' | 'partial' | 'planned';

interface AuditModule {
  name: string;
  description: string;
  status: ModuleStatus;
  route?: string;
  features: { label: string; done: boolean }[];
}

interface AuditCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  modules: AuditModule[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES: AuditCategory[] = [
  {
    key: 'comparateurs',
    label: 'Comparateurs de prix',
    icon: BarChart3,
    color: 'indigo',
    modules: [
      {
        name: 'Comparateur multi-enseignes',
        description: 'Comparer les prix d\'un produit dans plusieurs enseignes locales.',
        status: 'done',
        route: '/comparateur',
        features: [
          { label: 'Comparaison multi-enseignes', done: true },
          { label: 'Tri par prix / distance', done: true },
          { label: 'Filtres par territoire', done: true },
        ],
      },
      {
        name: 'Comparateur multi-territoires',
        description: 'Comparer les prix entre DOM-COM et la métropole.',
        status: 'done',
        route: '/comparateur-territoires',
        features: [
          { label: 'Comparaison DOM ↔ Métropole', done: true },
          { label: 'Indice d\'écart DOM / Hexagone', done: true },
          { label: 'Données officielles intégrées', done: true },
        ],
      },
      {
        name: 'Comparateur panier citoyen',
        description: 'Comparer le coût total d\'un panier selon l\'enseigne.',
        status: 'done',
        route: '/comparaison-panier',
        features: [
          { label: 'Ajout produits au panier', done: true },
          { label: 'Calcul total par enseigne', done: true },
          { label: 'Export du comparatif', done: true },
        ],
      },
      {
        name: 'Comparateur vols DOM-COM',
        description: 'Comparer les billets avion vers et depuis les DOM.',
        status: 'done',
        route: '/comparateur-vols',
        features: [
          { label: 'Recherche par route', done: true },
          { label: 'Filtres dates / classes', done: true },
          { label: 'API temps réel', done: true },
        ],
      },
      {
        name: 'Comparateur fret maritime',
        description: 'Comparer les tarifs de fret maritime pour les DOM.',
        status: 'done',
        route: '/comparateur-fret',
        features: [
          { label: 'Tarifs fret maritime', done: true },
          { label: 'Calcul coût conteneur', done: true },
          { label: 'Délais estimés', done: true },
        ],
      },
      {
        name: 'Comparateur carburants',
        description: 'Suivre et comparer les prix des carburants par territoire.',
        status: 'done',
        route: '/comparateur-carburants',
        features: [
          { label: 'Prix par territoire', done: true },
          { label: 'Historique des prix', done: true },
          { label: 'Alertes variation carburant', done: true },
        ],
      },
      {
        name: 'Comparateur assurances',
        description: 'Comparer les offres d\'assurance adaptées aux DOM.',
        status: 'done',
        route: '/comparateur-assurances',
        features: [
          { label: 'Assurance habitation', done: true },
          { label: 'Assurance auto', done: true },
          { label: 'Demande de devis en ligne', done: true },
        ],
      },
      {
        name: 'Comparateur télécoms / services',
        description: 'Comparer les offres internet, mobile et services.',
        status: 'done',
        route: '/comparateur-services',
        features: [
          { label: 'Offres internet fixe', done: true },
          { label: 'Offres mobiles', done: true },
          { label: 'Connectivité par territoire', done: true },
        ],
      },
      {
        name: 'Comparateur location voiture',
        description: 'Comparer les tarifs de location de véhicules.',
        status: 'done',
        route: '/comparateur-location-voiture',
        features: [
          { label: 'Comparaison par agence', done: true },
          { label: 'Filtres catégorie véhicule', done: true },
          { label: 'Réservation directe', done: true },
        ],
      },
      {
        name: 'Comparateur matériaux construction',
        description: 'Comparer les prix de matériaux de bâtiment.',
        status: 'done',
        route: '/comparateur-materiaux-batiment',
        features: [
          { label: 'Matériaux principaux', done: true },
          { label: 'Prix par fournisseur', done: true },
          { label: 'Devis travaux', done: true },
        ],
      },
      {
        name: 'Comparateur bateaux',
        description: 'Comparer traversées maritimes inter-îles.',
        status: 'done',
        route: '/comparateur-bateaux',
        features: [
          { label: 'Lignes maritimes', done: true },
          { label: 'Tarifs passagers', done: true },
          { label: 'Réservation intégrée', done: true },
        ],
      },
      {
        name: 'Comparateur formations',
        description: 'Comparer les offres de formation professionnelle.',
        status: 'done',
        route: '/comparateur-formations',
        features: [
          { label: 'Catalogue formations', done: true },
          { label: 'CPF / financement', done: true },
          { label: 'Avis & notations', done: true },
        ],
      },
      {
        name: 'Hub comparateurs',
        description: 'Point d\'entrée unifié vers tous les comparateurs spécialisés.',
        status: 'done',
        route: '/comparateurs',
        features: [
          { label: 'Navigation vers tous les comparateurs', done: true },
          { label: 'Présentation thématique', done: true },
          { label: 'Liens directs comparateurs spécialisés', done: true },
        ],
      },
      {
        name: 'Comparateur citoyen',
        description: 'Outil de comparaison simplifié orienté consommateur citoyen.',
        status: 'done',
        route: '/comparateur-citoyen',
        features: [
          { label: 'Interface simplifiée', done: true },
          { label: 'Comparaison rapide produits courants', done: true },
          { label: 'Accès grand public', done: true },
        ],
      },
      {
        name: 'Comparaison enseignes',
        description: 'Comparer les enseignes sur un produit ou une famille de produits.',
        status: 'done',
        route: '/comparaison-enseignes',
        features: [
          { label: 'Sélection multi-enseignes', done: true },
          { label: 'Tableau comparatif', done: true },
          { label: 'Filtres par catégorie', done: true },
        ],
      },
    ],
  },
  {
    key: 'scanner',
    label: 'Scanner & OCR',
    icon: Scan,
    color: 'green',
    modules: [
      {
        name: 'Hub Scanner universel',
        description: 'Point d\'entrée unifié pour tous les modes de scan.',
        status: 'done',
        route: '/scanner',
        features: [
          { label: 'Sélection du mode de scan', done: true },
          { label: 'Navigation fluide entre modes', done: true },
          { label: 'Historique des scans', done: true },
        ],
      },
      {
        name: 'Scan codes-barres EAN',
        description: 'Scanner les codes EAN-8, EAN-13 et UPC-A des produits.',
        status: 'done',
        route: '/scan-ean',
        features: [
          { label: 'Scan EAN-13 / EAN-8 / UPC-A', done: true },
          { label: 'Validation GS1 du code', done: true },
          { label: 'Résolution produit automatique', done: true },
          { label: 'Mode hors-ligne partiel', done: true },
        ],
      },
      {
        name: 'OCR tickets de caisse',
        description: 'Extraire les données d\'un ticket de caisse par photo.',
        status: 'done',
        route: '/scan-ocr',
        features: [
          { label: 'Reconnaissance texte ticket', done: true },
          { label: 'Extraction prix & produits', done: true },
          { label: 'Indicateur de qualité OCR', done: true },
          { label: 'Historique des scans OCR', done: true },
        ],
      },
      {
        name: 'Scan photo produit',
        description: 'Identifier un produit par photographie.',
        status: 'done',
        route: '/scan-photo',
        features: [
          { label: 'Analyse photo par IA', done: true },
          { label: 'Identification produit', done: true },
          { label: 'Recherche catalogue associée', done: true },
        ],
      },
      {
        name: 'Analyse photo avancée',
        description: 'Analyse détaillée d\'un produit par photo.',
        status: 'done',
        route: '/analyse-photo-produit',
        features: [
          { label: 'Score nutritionnel estimé', done: true },
          { label: 'Ingrédients reconnus', done: true },
          { label: 'Alertes allergènes', done: true },
        ],
      },
      {
        name: 'Hub OCR centralisé',
        description: 'Gestion centralisée des sessions OCR et historique.',
        status: 'done',
        route: '/ocr',
        features: [
          { label: 'Sessions OCR', done: true },
          { label: 'Historique & replay', done: true },
          { label: 'Statistiques qualité', done: true },
        ],
      },
    ],
  },
  {
    key: 'observatoire',
    label: 'Observatoire des prix',
    icon: Eye,
    color: 'blue',
    modules: [
      {
        name: 'Observatoire Hub',
        description: 'Portail principal de l\'observatoire des prix DOM.',
        status: 'done',
        route: '/observatoire',
        features: [
          { label: 'Vue d\'ensemble des prix', done: true },
          { label: 'Navigation par territoire', done: true },
          { label: 'Liens vers sous-modules', done: true },
        ],
      },
      {
        name: 'Observatoire temps réel',
        description: 'Prix actualisés en continu depuis les sources officielles.',
        status: 'done',
        route: '/observatoire-temps-reel',
        features: [
          { label: 'Données historiques multi-mois', done: true },
          { label: 'Flux temps réel', done: true },
          { label: 'Export CSV', done: true },
        ],
      },
      {
        name: 'Observatoire vivant',
        description: 'Visualisation dynamique des tendances de prix.',
        status: 'done',
        route: '/observatoire-vivant',
        features: [
          { label: 'Graphiques interactifs', done: true },
          { label: 'Séries temporelles', done: true },
          { label: 'Comparaison inter-territoires', done: true },
        ],
      },
      {
        name: 'Méthodologie',
        description: 'Documentation de la méthode de collecte et calcul.',
        status: 'done',
        route: '/methodologie',
        features: [
          { label: 'Méthode de collecte', done: true },
          { label: 'Sources de données', done: true },
          { label: 'Calcul indices', done: true },
        ],
      },
      {
        name: 'Inflation par catégorie',
        description: 'Suivi de l\'inflation segmenté par catégorie de produit.',
        status: 'done',
        route: '/inflation-categories',
        features: [
          { label: 'Inflation alimentaire', done: true },
          { label: 'Inflation énergie', done: true },
          { label: 'Comparatif DOM / France', done: true },
        ],
      },
      {
        name: 'Couverture territoriale',
        description: 'Rapport sur la couverture des données par territoire.',
        status: 'done',
        route: '/couverture-territoires',
        features: [
          { label: 'Carte de couverture', done: true },
          { label: 'Densité des observations', done: true },
          { label: 'Lacunes identifiées', done: true },
        ],
      },
      {
        name: 'Méthodologie observatoire',
        description: 'Documentation technique de l\'observatoire.',
        status: 'done',
        route: '/observatoire/methodologie',
        features: [
          { label: 'Protocole de collecte', done: true },
          { label: 'Agrégation des données', done: true },
          { label: 'Biais et limites', done: true },
        ],
      },
    ],
  },
  {
    key: 'ia',
    label: 'Intelligence Artificielle',
    icon: Brain,
    color: 'purple',
    modules: [
      {
        name: 'Prédictions de prix',
        description: 'Prévisions de prix à court terme basées sur l\'historique.',
        status: 'done',
        route: '/predictions',
        features: [
          { label: 'Prédiction linéaire simple', done: true },
          { label: 'Prédiction basée historiques réels', done: true },
          { label: 'Intervalles de confiance', done: true },
          { label: 'Horizon > 30 jours', done: true },
        ],
      },
      {
        name: 'Assistant IA',
        description: 'Conseiller IA pour les achats et comparaisons.',
        status: 'done',
        route: '/assistant-ia',
        features: [
          { label: 'Réponses contextuelles', done: true },
          { label: 'Recommandations produits', done: true },
          { label: 'Mode vocal', done: true },
        ],
      },
      {
        name: 'Devis IA (B2G / B2B)',
        description: 'Génération de devis assistée par IA pour institutions.',
        status: 'done',
        route: '/devis-ia',
        features: [
          { label: 'Formulaire identité légale (SIRET)', done: true },
          { label: 'Moteur d\'estimation explicable', done: true },
          { label: 'TVA DOM 8.5% intégrée', done: true },
          { label: 'Pipeline DRAFT → PAID', done: true },
          { label: 'Piste d\'audit Firestore', done: true },
          { label: 'Validation humaine obligatoire', done: true },
        ],
      },
      {
        name: 'Suivi devis citoyen',
        description: 'Interface de suivi des devis soumis.',
        status: 'done',
        route: '/mes-devis',
        features: [
          { label: 'Liste des devis', done: true },
          { label: 'Statut en temps réel', done: true },
          { label: 'Téléchargement devis', done: true },
        ],
      },
      {
        name: 'Évaluation cosmétique IA',
        description: 'Analyse IA des ingrédients cosmétiques.',
        status: 'done',
        route: '/evaluation-cosmetique',
        features: [
          { label: 'Analyse INCI', done: true },
          { label: 'Score sécurité', done: true },
          { label: 'Alternatives suggérées', done: true },
        ],
      },
      {
        name: 'Indice IEVR',
        description: 'Indice d\'Effort de Vie Réelle territorial.',
        status: 'done',
        route: '/ievr',
        features: [
          { label: 'Calcul IEVR par territoire', done: true },
          { label: 'Décomposition facteurs', done: true },
          { label: 'Comparatif historique', done: true },
        ],
      },
      {
        name: 'Conseiller IA',
        description: 'Assistant IA conversationnel pour conseils achats et prix.',
        status: 'done',
        route: '/ia-conseiller',
        features: [
          { label: 'Conseils personnalisés', done: true },
          { label: 'Analyse produits', done: true },
          { label: 'Historique conversations', done: true },
        ],
      },
      {
        name: 'Insights marchés IA',
        description: 'Tableau de bord IA sur les tendances et insights de marché.',
        status: 'done',
        route: '/ai-insights',
        features: [
          { label: 'Tendances de prix IA', done: true },
          { label: 'Alertes marchés automatiques', done: true },
          { label: 'Export rapport', done: true },
        ],
      },
    ],
  },
  {
    key: 'budget',
    label: 'Budget & Économies',
    icon: ShoppingCart,
    color: 'orange',
    modules: [
      {
        name: 'Liste de courses intelligente',
        description: 'Créer et optimiser sa liste de courses avec GPS.',
        status: 'done',
        route: '/liste',
        features: [
          { label: 'Création / édition listes', done: true },
          { label: 'Recherche produits', done: true },
          { label: 'Géolocalisation magasins', done: true },
          { label: 'Meilleur prix + distance combinés', done: true },
          { label: 'Parcours optimal GPS', done: true },
        ],
      },
      {
        name: 'Budget vital (Ti Panié)',
        description: 'Calcul du panier alimentaire minimum par territoire.',
        status: 'done',
        route: '/ti-panie',
        features: [
          { label: 'Composition panier vital', done: true },
          { label: 'Coût par territoire', done: true },
          { label: 'Comparatif mensuel', done: true },
        ],
      },
      {
        name: 'Budget réel mensuel',
        description: 'Suivi du budget réel d\'un ménage type DOM.',
        status: 'done',
        route: '/budget-reel-mensuel',
        features: [
          { label: 'Simulation budget mensuel', done: true },
          { label: 'Postes de dépenses', done: true },
          { label: 'Comparatif DOM / Métropole', done: true },
        ],
      },
      {
        name: 'Budget vital étendu',
        description: 'Suivi budget vital complet (alimentation + énergie + logement).',
        status: 'done',
        route: '/budget-vital',
        features: [
          { label: 'Alimentation', done: true },
          { label: 'Énergie', done: true },
          { label: 'Logement', done: true },
          { label: 'Transport', done: true },
        ],
      },
      {
        name: 'Mes économies',
        description: 'Récapitulatif des économies réalisées grâce à la plateforme.',
        status: 'done',
        route: '/mon-compte',
        features: [
          { label: 'Total économies calculé', done: true },
          { label: 'Historique comparaisons', done: true },
          { label: 'Export économies PDF', done: true },
        ],
      },
      {
        name: 'Promotions & bons plans',
        description: 'Recenser les promotions actives dans les enseignes.',
        status: 'done',
        route: '/promotions',
        features: [
          { label: 'Promotions par enseigne', done: true },
          { label: 'Filtrage par catégorie', done: true },
          { label: 'Alerte promo personnalisée', done: true },
        ],
      },
      {
        name: 'Liste de courses intelligente (avancée)',
        description: 'Version optimisée de la liste avec suggestions IA et économies.',
        status: 'done',
        route: '/liste-intelligente',
        features: [
          { label: 'Suggestions IA de produits', done: true },
          { label: 'Calcul économies potentielles', done: true },
          { label: 'Comparaison magasins intégrée', done: true },
        ],
      },
      {
        name: 'Mes demandes',
        description: 'Suivi des demandes et signalements soumis par l\'utilisateur.',
        status: 'done',
        route: '/mes-demandes',
        features: [
          { label: 'Liste des demandes', done: true },
          { label: 'Statut de traitement', done: true },
          { label: 'Historique complet', done: true },
        ],
      },
    ],
  },
  {
    key: 'civic',
    label: 'Modules citoyens & communauté',
    icon: Users,
    color: 'teal',
    modules: [
      {
        name: 'Messagerie interne',
        description: 'Messagerie citoyenne temps réel (Firestore onSnapshot).',
        status: 'done',
        route: '/messagerie',
        features: [
          { label: 'Envoi / réception messages', done: true },
          { label: 'Temps réel (Firestore)', done: true },
          { label: 'Accès depuis Mon Compte', done: true },
        ],
      },
      {
        name: 'Groupes de parole citoyens',
        description: 'Espaces de discussion modérés par territoire.',
        status: 'done',
        route: '/groupes-parole',
        features: [
          { label: 'Création groupes', done: true },
          { label: 'Modération automatique', done: true },
          { label: 'Filtrage par territoire', done: true },
        ],
      },
      {
        name: 'Signalement abus / prix',
        description: 'Signaler un prix abusif ou une pratique illégale.',
        status: 'done',
        route: '/signalement',
        features: [
          { label: 'Formulaire signalement', done: true },
          { label: 'Catégorisation automatique', done: true },
          { label: 'Modération admin', done: true },
          { label: 'Suivi statut signalement', done: true },
        ],
      },
      {
        name: 'Alertes prix personnalisées',
        description: 'Recevoir des alertes quand un prix dépasse un seuil.',
        status: 'done',
        route: '/alertes',
        features: [
          { label: 'Création alertes produit', done: true },
          { label: 'Alertes sanitaires / rappels', done: true },
          { label: 'Page dédiée par alerte', done: true },
          { label: 'Export rapport alertes', done: true },
        ],
      },
      {
        name: 'Contribuer aux prix',
        description: 'Permettre aux citoyens de contribuer des relevés de prix.',
        status: 'done',
        route: '/contribuer-prix',
        features: [
          { label: 'Saisie prix citoyen', done: true },
          { label: 'Validation par la communauté', done: true },
          { label: 'Badge contribution', done: true },
        ],
      },
      {
        name: 'Entraide & solidarité',
        description: 'Hub solidarité : dons, bons plans, entraide locale.',
        status: 'done',
        route: '/solidarite',
        features: [
          { label: 'Bons plans partagés', done: true },
          { label: 'Carte entraide', done: true },
          { label: 'Réseau associatif', done: true },
        ],
      },
      {
        name: 'Modules civiques',
        description: 'Ensemble des outils citoyens (pétitions, consultations).',
        status: 'done',
        route: '/civic-modules',
        features: [
          { label: 'Consultations citoyennes', done: true },
          { label: 'Pétitions en ligne', done: true },
          { label: 'Vote participatif', done: true },
        ],
      },
      {
        name: 'Suggestions citoyennes',
        description: 'Soumettre des suggestions d\'amélioration à la plateforme.',
        status: 'done',
        route: '/suggestions',
        features: [
          { label: 'Formulaire de suggestion', done: true },
          { label: 'Catégorisation des suggestions', done: true },
          { label: 'Vote par la communauté', done: true },
        ],
      },
    ],
  },
  {
    key: 'gamification',
    label: 'Gamification & fidélité',
    icon: Star,
    color: 'yellow',
    modules: [
      {
        name: 'Système de badges',
        description: 'Récompenser les contributions et actions citoyennes.',
        status: 'done',
        route: '/gamification/badges',
        features: [
          { label: 'Catalogue de badges', done: true },
          { label: 'Obtention automatique', done: true },
          { label: 'Affichage profil', done: true },
        ],
      },
      {
        name: 'Classement (Leaderboard)',
        description: 'Classement des contributeurs les plus actifs.',
        status: 'done',
        route: '/gamification/leaderboard',
        features: [
          { label: 'Top contributeurs', done: true },
          { label: 'Filtrage par territoire', done: true },
          { label: 'Score hebdomadaire', done: true },
        ],
      },
      {
        name: 'Profil gamification',
        description: 'Vue profil avec score, badges et historique.',
        status: 'done',
        route: '/gamification',
        features: [
          { label: 'Score utilisateur', done: true },
          { label: 'Badges obtenus', done: true },
          { label: 'Progression niveau', done: true },
        ],
      },
    ],
  },
  {
    key: 'marketplace',
    label: 'Marketplace Pro',
    icon: Briefcase,
    color: 'blue',
    modules: [
      {
        name: 'Onboarding marchands',
        description: 'Processus d\'inscription pour les enseignes partenaires.',
        status: 'done',
        route: '/marketplace/inscription',
        features: [
          { label: 'Formulaire inscription', done: true },
          { label: 'Validation SIRET', done: true },
          { label: 'Abonnement payant', done: true },
        ],
      },
      {
        name: 'Dashboard marchands',
        description: 'Interface de gestion pour les enseignes inscrites.',
        status: 'done',
        route: '/marketplace/dashboard',
        features: [
          { label: 'Gestion produits & prix', done: true },
          { label: 'Statistiques de vues', done: true },
          { label: 'Multi-boutiques', done: true },
          { label: 'Facturation automatique', done: true },
        ],
      },
      {
        name: 'Espace Pro',
        description: 'Portail professionnel pour les abonnés Pro / Business.',
        status: 'done',
        route: '/espace-pro',
        features: [
          { label: 'Accès données avancées', done: true },
          { label: 'API export', done: true },
          { label: 'Rapports personnalisés', done: true },
        ],
      },
      {
        name: 'Inscription Pro',
        description: 'Souscription aux offres professionnelles.',
        status: 'done',
        route: '/inscription-pro',
        features: [
          { label: 'Offres Pro / Business', done: true },
          { label: 'Remise DOM -30%', done: true },
          { label: 'Facturation intégrée', done: true },
        ],
      },
    ],
  },
  {
    key: 'institutionnel',
    label: 'Institutionnel & documentation',
    icon: Globe,
    color: 'slate',
    modules: [
      {
        name: 'Dossier investisseurs',
        description: 'Dossier structuré 13 sections pour les investisseurs.',
        status: 'done',
        route: '/dossier-investisseurs',
        features: [
          { label: '13 sections structurées', done: true },
          { label: 'Version imprimable (PDF)', done: true },
          { label: 'Modèle économique détaillé', done: true },
        ],
      },
      {
        name: 'Roadmap publique',
        description: 'Feuille de route MVP → V1 → V2 et architecture.',
        status: 'done',
        route: '/roadmap',
        features: [
          { label: 'Roadmap MVP → V2', done: true },
          { label: 'État des modules', done: true },
          { label: 'Schémas de données', done: true },
          { label: 'Design system', done: true },
          { label: 'Stratégie IA', done: true },
          { label: 'Modèle économique', done: true },
        ],
      },
      {
        name: 'Contact collectivités',
        description: 'Formulaire de contact dédié aux institutions.',
        status: 'done',
        route: '/contact-collectivites',
        features: [
          { label: 'Formulaire structuré', done: true },
          { label: 'Routage vers équipe institutionnelle', done: true },
          { label: 'SLA documenté', done: true },
        ],
      },
      {
        name: 'Dossier presse & médias',
        description: 'Kit presse pour les journalistes et médias.',
        status: 'done',
        route: '/dossier-media',
        features: [
          { label: 'Communiqué de presse', done: true },
          { label: 'Logos & visuels', done: true },
          { label: 'Contact presse', done: true },
        ],
      },
      {
        name: 'Licence institution',
        description: 'Conditions d\'utilisation pour les collectivités.',
        status: 'done',
        route: '/licence-institution',
        features: [
          { label: 'Cadre légal d\'usage', done: true },
          { label: 'Droits d\'accès données', done: true },
          { label: 'Conditions de redistribution', done: true },
        ],
      },
      {
        name: 'Gouvernance',
        description: 'Structure de gouvernance éthique de la plateforme.',
        status: 'done',
        route: '/gouvernance',
        features: [
          { label: 'Charte éthique', done: true },
          { label: 'Comité de supervision', done: true },
          { label: 'Rapport annuel', done: true },
        ],
      },
      {
        name: 'Presse & actualités',
        description: 'Espace presse et articles d\'actualités de la plateforme.',
        status: 'done',
        route: '/presse',
        features: [
          { label: 'Articles de presse', done: true },
          { label: 'Communiqués officiels', done: true },
          { label: 'Flux actualités', done: true },
        ],
      },
      {
        name: 'Versions & changelogs',
        description: 'Historique des versions et métadonnées de build de la plateforme.',
        status: 'done',
        route: '/versions',
        features: [
          { label: 'Changelog versionné', done: true },
          { label: 'Métadonnées de build (SHA / date)', done: true },
          { label: 'Environnement de déploiement', done: true },
        ],
      },
    ],
  },
  {
    key: 'donnees',
    label: 'Données & recherche',
    icon: Eye,
    color: 'cyan',
    modules: [
      {
        name: 'Données publiques',
        description: 'Accès aux jeux de données publics de la plateforme.',
        status: 'done',
        route: '/donnees-publiques',
        features: [
          { label: 'Catalogue open data', done: true },
          { label: 'Téléchargement CSV', done: true },
          { label: 'API publique documentée', done: true },
        ],
      },
      {
        name: 'Comprendre les prix DOM',
        description: 'Pédagogie sur la formation des prix en DOM-COM.',
        status: 'done',
        route: '/comprendre-prix',
        features: [
          { label: 'Explication facteurs de prix', done: true },
          { label: 'Octroi de mer', done: true },
          { label: 'TVA et fiscalité locale', done: true },
          { label: 'Fret et logistique', done: true },
        ],
      },
      {
        name: 'Recherche avancée prix',
        description: 'Moteur de recherche multicritère sur les prix.',
        status: 'done',
        route: '/recherche-prix',
        features: [
          { label: 'Recherche par produit', done: true },
          { label: 'Filtres territoire / enseigne', done: true },
          { label: 'Recherche par EAN', done: true },
        ],
      },
      {
        name: 'Recherche logistique DOM',
        description: 'Données et outils sur la logistique des DOM.',
        status: 'done',
        route: '/recherche-prix/fret',
        features: [
          { label: 'Délais logistiques', done: true },
          { label: 'Indice logistique', done: true },
          { label: 'Glossaire logistique DOM', done: true },
        ],
      },
      {
        name: 'Tableau de bord inflation',
        description: 'Dashboard interactif de suivi de l\'inflation DOM.',
        status: 'done',
        route: '/tableau-inflation',
        features: [
          { label: 'Indicateurs macros', done: true },
          { label: 'Comparatif DOM / National', done: true },
          { label: 'Export données', done: true },
        ],
      },
      {
        name: 'Hub de recherche',
        description: 'Point d\'entrée centralisé pour toutes les recherches de prix.',
        status: 'done',
        route: '/recherche-hub',
        features: [
          { label: 'Navigation vers modules de recherche', done: true },
          { label: 'Recherche unifiée', done: true },
          { label: 'Filtres rapides', done: true },
        ],
      },
      {
        name: 'Recherche avancée',
        description: 'Moteur de comparaison avancé avec filtres multicritères.',
        status: 'done',
        route: '/recherche-avancee',
        features: [
          { label: 'Filtres avancés multicritères', done: true },
          { label: 'Comparaison croisée', done: true },
          { label: 'Export résultats', done: true },
        ],
      },
    ],
  },
  {
    key: 'auth',
    label: 'Authentification & compte',
    icon: Shield,
    color: 'red',
    modules: [
      {
        name: 'Authentification',
        description: 'Connexion, inscription et gestion de session sécurisée.',
        status: 'done',
        route: '/login',
        features: [
          { label: 'Email / mot de passe', done: true },
          { label: 'Réinitialisation mot de passe', done: true },
          { label: 'Gestion des rôles (citoyen / pro / admin)', done: true },
          { label: 'Firebase Auth', done: true },
        ],
      },
      {
        name: 'Mon Compte',
        description: 'Profil utilisateur, paramètres et historique.',
        status: 'done',
        route: '/mon-compte',
        features: [
          { label: 'Profil éditable', done: true },
          { label: 'Historique comparaisons', done: true },
          { label: 'Accès messagerie', done: true },
          { label: 'Gestion abonnement', done: true },
        ],
      },
      {
        name: 'Tarification & abonnements',
        description: 'Offres Gratuit / Citoyen / Pro / Business / Institution.',
        status: 'done',
        route: '/pricing',
        features: [
          { label: 'Tableau offres', done: true },
          { label: 'Remise DOM -30%', done: true },
          { label: 'Paiement en ligne', done: true },
          { label: 'Facturation automatique', done: true },
        ],
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    icon: Settings,
    color: 'gray',
    modules: [
      {
        name: 'Dashboard administrateur',
        description: 'Vue globale pour les administrateurs de la plateforme.',
        status: 'done',
        route: '/admin',
        features: [
          { label: 'KPIs plateforme', done: true },
          { label: 'Accès rapide modules admin', done: true },
          { label: 'Logs récents', done: true },
        ],
      },
      {
        name: 'Gestion magasins',
        description: 'CRUD complet des enseignes et magasins.',
        status: 'done',
        route: '/admin/stores',
        features: [
          { label: 'Liste / création / édition', done: true },
          { label: 'Géolocalisation magasin', done: true },
          { label: 'Horaires d\'ouverture', done: true },
        ],
      },
      {
        name: 'Gestion produits',
        description: 'Catalogue produits et données EAN.',
        status: 'done',
        route: '/admin/products',
        features: [
          { label: 'CRUD produits', done: true },
          { label: 'Import en masse (CSV)', done: true },
          { label: 'Enrichissement données', done: true },
        ],
      },
      {
        name: 'Modération signalements',
        description: 'Traitement des signalements citoyens.',
        status: 'done',
        route: '/admin/moderation',
        features: [
          { label: 'File de signalements', done: true },
          { label: 'Actions rapides (valider / rejeter)', done: true },
          { label: 'Historique décisions', done: true },
        ],
      },
      {
        name: 'Admin Devis IA',
        description: 'Interface admin pour la gestion des devis institutionnels.',
        status: 'done',
        route: '/admin/devis',
        features: [
          { label: 'Liste tous les devis', done: true },
          { label: 'Validation / rejet devis', done: true },
          { label: 'Audit trail complet', done: true },
        ],
      },
      {
        name: 'Synchronisation données',
        description: 'Gestion des synchronisations et imports de données.',
        status: 'done',
        route: '/admin/sync',
        features: [
          { label: 'Import CSV prix', done: true },
          { label: 'Statut synchronisation', done: true },
          { label: 'Logs d\'erreur', done: true },
        ],
      },
    ],
  },
  {
    key: 'territoires',
    label: 'Territoires & Cartographie',
    icon: Globe,
    color: 'teal',
    modules: [
      {
        name: 'Hub territorial',
        description: 'Page d\'accueil dédiée à chaque territoire DOM-COM.',
        status: 'done',
        route: '/territoire/:territory',
        features: [
          { label: 'Vue par territoire (GP, MQ, RE…)', done: true },
          { label: 'Prix locaux & enseignes', done: true },
          { label: 'Informations territoriales', done: true },
        ],
      },
      {
        name: 'Scanner territorial',
        description: 'Scanner de prix contextualisé par territoire.',
        status: 'done',
        route: '/territoire/:territory/scanner',
        features: [
          { label: 'Scan EAN dans le contexte territorial', done: true },
          { label: 'Prix locaux automatiques', done: true },
          { label: 'Comparaison intra-territoire', done: true },
        ],
      },
      {
        name: 'Comparaison inter-territoires',
        description: 'Comparer les indicateurs de prix entre les DOM-COM.',
        status: 'done',
        route: '/comparaison-territoires',
        features: [
          { label: 'Sélection multi-territoires', done: true },
          { label: 'Indice d\'écart inter-territoires', done: true },
          { label: 'Graphiques comparatifs', done: true },
        ],
      },
      {
        name: 'Carte itinéraires',
        description: 'Carte interactive des itinéraires et points de vente.',
        status: 'done',
        route: '/carte-itineraires',
        features: [
          { label: 'Carte des enseignes', done: true },
          { label: 'Itinéraires optimisés', done: true },
          { label: 'Filtres par catégorie / territoire', done: true },
        ],
      },
      {
        name: 'Carte interactive',
        description: 'Carte géographique interactive des magasins et prix.',
        status: 'done',
        route: '/carte-interactive',
        features: [
          { label: 'Carte OpenStreetMap intégrée', done: true },
          { label: 'Pins magasins cliquables', done: true },
          { label: 'Filtrage géographique', done: true },
        ],
      },
      {
        name: 'Périmètre d\'analyse',
        description: 'Définir et visualiser le périmètre de couverture de la plateforme.',
        status: 'done',
        route: '/perimetre',
        features: [
          { label: 'Carte du périmètre couvert', done: true },
          { label: 'Densité des données par zone', done: true },
          { label: 'Lacunes identifiées', done: true },
        ],
      },
    ],
  },
];

// ── Computed stats ─────────────────────────────────────────────────────────────

function computeStats(categories: AuditCategory[]) {
  const allModules = categories.flatMap((c) => c.modules);
  const done = allModules.filter((m) => m.status === 'done').length;
  const partial = allModules.filter((m) => m.status === 'partial').length;
  const planned = allModules.filter((m) => m.status === 'planned').length;
  const total = allModules.length;
  const allFeatures = allModules.flatMap((m) => m.features);
  const featDone = allFeatures.filter((f) => f.done).length;
  return { done, partial, planned, total, featDone, featTotal: allFeatures.length };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ModuleStatus, { label: string; color: string; icon: React.ElementType }> = {
  done: { label: 'Opérationnel', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  planned: { label: 'Planifié', color: 'bg-gray-100 text-gray-500', icon: Circle },
};

const COLOR_MAP: Record<string, string> = {
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  green: 'text-green-600 bg-green-50 border-green-200',
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
  purple: 'text-purple-600 bg-purple-50 border-purple-200',
  orange: 'text-orange-600 bg-orange-50 border-orange-200',
  teal: 'text-teal-600 bg-teal-50 border-teal-200',
  yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  slate: 'text-slate-600 bg-slate-50 border-slate-200',
  cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  red: 'text-red-600 bg-red-50 border-red-200',
  gray: 'text-gray-600 bg-gray-50 border-gray-200',
};

function ModuleCard({ mod }: { mod: AuditModule }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[mod.status];
  const StatusIcon = cfg.icon;
  const featDone = mod.features.filter((f) => f.done).length;
  const featTotal = mod.features.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <StatusIcon
          className={`w-4 h-4 flex-shrink-0 ${
            mod.status === 'done' ? 'text-green-500' : mod.status === 'partial' ? 'text-yellow-500' : 'text-gray-300'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{mod.name}</p>
          <p className="text-xs text-gray-500 truncate">{mod.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-gray-400">{featDone}/{featTotal}</span>
          {mod.route && (
            <Link
              to={mod.route}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              aria-label={`Ouvrir ${mod.name}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {mod.features.map((f) => (
            <div
              key={f.label}
              className={`flex items-start gap-2 text-xs ${f.done ? 'text-gray-700' : 'text-gray-400'}`}
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
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ModuleAuditPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ModuleStatus | 'all'>('all');
  const stats = useMemo(() => computeStats(CATEGORIES), []);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      modules: cat.modules.filter((mod) => {
        const matchesSearch =
          !q ||
          mod.name.toLowerCase().includes(q) ||
          mod.description.toLowerCase().includes(q) ||
          mod.features.some((f) => f.label.toLowerCase().includes(q));
        const matchesStatus = filterStatus === 'all' || mod.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    })).filter((cat) => cat.modules.length > 0);
  }, [search, filterStatus]);

  const donePercent = Math.round((stats.done / stats.total) * 100);
  const featPercent = Math.round((stats.featDone / stats.featTotal) * 100);

  return (
    <>
      <Helmet>
        <title>Audit des modules — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Audit complet de l'implémentation de tous les modules de la plateforme A KI PRI SA YÉ — statuts, fonctionnalités, couverture."
        />
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/module-audit" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/module-audit" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/module-audit" />
      </Helmet>

      <HeroImage
        src={PAGE_HERO_IMAGES.moduleAudit}
        alt="Audit des modules"
        gradient="from-slate-950 to-slate-800"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🔍 Audit des modules</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>État et disponibilité de tous les modules de la plateforme</p>
      </HeroImage>

      <div className="min-h-screen bg-gray-50">
        {/* Progress bars */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Modules opérationnels</span>
                <span className="font-semibold">{donePercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${donePercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Fonctionnalités implémentées</span>
                <span className="font-semibold">{stats.featDone}/{stats.featTotal} ({featPercent}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${featPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher un module ou une fonctionnalité…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'done', 'partial', 'planned'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    filterStatus === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {s === 'all' ? 'Tous' : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-5xl mx-auto px-4 py-8 pb-20 space-y-8">
          {filteredCategories.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun module ne correspond à cette recherche.</p>
            </div>
          )}

          {filteredCategories.map((cat) => {
            const CatIcon = cat.icon;
            const colorCls = COLOR_MAP[cat.color] ?? COLOR_MAP.gray;
            const catDone = cat.modules.filter((m) => m.status === 'done').length;
            const catPartial = cat.modules.filter((m) => m.status === 'partial').length;

            return (
              <section key={cat.key}>
                <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl border ${colorCls}`}>
                  <CatIcon className="w-5 h-5 flex-shrink-0" />
                  <h2 className="font-semibold text-sm">{cat.label}</h2>
                  <div className="ml-auto flex gap-2 text-xs">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {catDone} ✓
                    </span>
                    {catPartial > 0 && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        {catPartial} ~
                      </span>
                    )}
                    <span className="text-gray-500">{cat.modules.length} modules</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {cat.modules.map((mod) => (
                    <ModuleCard key={mod.name} mod={mod} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Legend & note */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Légende des statuts</h3>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <strong>Opérationnel</strong> — Toutes les fonctionnalités principales sont actives en production.
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-yellow-500" />
                <strong>Partiel</strong> — Module déployé mais certaines fonctionnalités sont en cours.
              </span>
              <span className="flex items-center gap-1.5">
                <Circle className="w-4 h-4 text-gray-300" />
                <strong>Planifié</strong> — Module dans la roadmap, non encore implémenté.
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Cet audit reflète l'état réel de la base de code. Seuls les modules
              constatés dans les sources sont référencés. Dernière mise à jour : mars 2026.
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                to="/roadmap"
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                → Roadmap & Architecture complète
              </Link>
              <Link
                to="/dossier-investisseurs"
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                → Dossier investisseurs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
