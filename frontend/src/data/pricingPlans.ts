export type PlanCadence = 'mensuel' | 'annuel' | 'option';

export type PricingPlan = {
  id: string;
  name: string;
  cadence: PlanCadence;
  priceEur: number | 'gratuit';
  highlight?: boolean;
  badge?: string;
  description: string;
  features: string[];
  limits?: string[];
  ctaLabel: string;
  ctaHref: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    cadence: 'mensuel',
    priceEur: 'gratuit',
    badge: 'Accès essentiel',
    description: 'Pour contribuer et comparer les prix au quotidien, sans engagement.',
    features: [
      'Recherche produits & enseignes',
      'Comparateur citoyen',
      'Historique de prix (basique)',
      'Signalements & contributions',
      'Accès multi-territoires (lecture)',
    ],
    limits: [
      'Fonctions avancées d’analyse limitées',
      'Exports et rapports désactivés',
      'Priorité support standard',
    ],
    ctaLabel: 'Commencer',
    ctaHref: '/inscription',
  },
  {
    id: 'pro',
    name: 'Pro',
    cadence: 'mensuel',
    priceEur: 9.99,
    highlight: true,
    badge: 'Recommandé',
    description: 'Pour analyser, suivre et optimiser tes dépenses.',
    features: [
      'Tout Freemium',
      'Alertes prix illimitées',
      'Suivi panier & économies',
      'Exports (CSV) + historique étendu',
      'Analyses graphiques avancées',
      'Accès prioritaire aux nouveautés',
    ],
    limits: ['Hors options IA / OCR avancé'],
    ctaLabel: 'Passer Pro',
    ctaHref: '/offres#contact',
  },
  {
    id: 'premium',
    name: 'Premium',
    cadence: 'mensuel',
    priceEur: 19.99,
    badge: 'Power user',
    description: 'Usage intensif: analyses poussées et monitoring multi-enseignes.',
    features: [
      'Tout Pro',
      'Rapports PDF (bientôt) / exports avancés',
      'Monitoring multi-enseignes',
      'Tableaux de bord étendus',
      'Support prioritaire',
    ],
    ctaLabel: 'Passer Premium',
    ctaHref: '/offres#contact',
  },
  {
    id: 'pro-annual',
    name: 'Pro Annuel',
    cadence: 'annuel',
    priceEur: 99.0,
    badge: '2 mois offerts',
    description: 'Le plan Pro avec avantage annuel (meilleur ROI).',
    features: ['Tout Pro', 'Facturation annuelle', 'Accès prioritaire aux nouveautés'],
    ctaLabel: 'Choisir l’annuel',
    ctaHref: '/offres#contact',
  },
  {
    id: 'option-ocr',
    name: 'Option OCR Tickets',
    cadence: 'option',
    priceEur: 4.99,
    badge: 'Option',
    description: 'Scanner des tickets et extraire automatiquement les prix.',
    features: ['OCR mobile', 'Classement automatique', 'Vérification assistée'],
    ctaLabel: 'Ajouter l’option',
    ctaHref: '/offres#contact',
  },
  {
    id: 'option-ai',
    name: 'Option IA Insights',
    cadence: 'option',
    priceEur: 6.99,
    badge: 'Option',
    description: 'Analyses IA: tendances, anomalies, recommandations.',
    features: ['Insights marché', 'Détection anomalies', 'Recommandations'],
    ctaLabel: 'Ajouter l’option',
    ctaHref: '/offres#contact',
  },
];
