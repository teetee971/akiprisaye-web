/**
 * User Gratification System
 * Reconnaissance sobre et non-compétitive
 * Version v1.6.1
 */

export interface GratificationBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: string;
  accessLevel: 'PUBLIC' | 'CITIZEN' | 'PROFESSIONAL' | 'INSTITUTIONAL' | 'ALL';
}

export interface UserStats {
  downloadsCount: number;
  contributionsCount: number;
  scannedProductsCount: number; // Nouveau: compteur de produits scannés
  activeUsageDays: number;
  lastActive: Date;
}

/**
 * Badges de reconnaissance (non gamifiés)
 * Audit v1.0 - Section 4: Système de gratification
 */
export const GRATIFICATION_BADGES: GratificationBadge[] = [
  {
    id: 'contributeur_citoyen',
    title: 'Contributeur citoyen',
    description: 'Reconnaissance pour participation active aux signalements',
    icon: '🏅',
    criteria: 'Participation aux signalements et améliorations',
    accessLevel: 'ALL',
  },
  {
    id: 'veilleur_prix',
    title: 'Veilleur de prix',
    description: 'Reconnaissance pour suivi régulier des prix',
    icon: '👁️',
    criteria: 'Usage régulier du service (30+ scans actifs)',
    accessLevel: 'ALL',
  },
  {
    id: 'institutional_partner',
    title: 'Partenaire institutionnel',
    description: 'Collaboration institutionnelle reconnue',
    icon: '🏛️',
    criteria: 'Partenariat officiel ou convention active',
    accessLevel: 'INSTITUTIONAL',
  },
];

/**
 * Check if user has earned a badge
 */
export const hasBadge = (badgeId: string, userStats: UserStats, accessLevel: string): boolean => {
  const badge = GRATIFICATION_BADGES.find((b) => b.id === badgeId);

  if (!badge) return false;

  // Check access level requirement
  if (badge.accessLevel !== 'ALL' && badge.accessLevel !== accessLevel) {
    return false;
  }

  // Badge-specific logic
  switch (badgeId) {
    case 'contributeur_citoyen':
      return userStats.contributionsCount > 0;

    case 'veilleur_prix':
      return userStats.scannedProductsCount >= 30;

    case 'institutional_partner':
      return accessLevel === 'INSTITUTIONAL';

    default:
      return false;
  }
};

/**
 * Get all earned badges for a user
 */
export const getEarnedBadges = (
  userStats: UserStats,
  accessLevel: string
): GratificationBadge[] => {
  return GRATIFICATION_BADGES.filter((badge) => hasBadge(badge.id, userStats, accessLevel));
};

/**
 * Mock user stats (à remplacer par données réelles)
 */
export const getMockUserStats = (): UserStats => {
  return {
    downloadsCount: 12,
    contributionsCount: 3,
    scannedProductsCount: 47,
    activeUsageDays: 45,
    lastActive: new Date(),
  };
};

/**
 * Format download count
 */
export const formatDownloadCount = (count: number): string => {
  if (count === 0) return 'Aucun téléchargement';
  if (count === 1) return '1 téléchargement';
  return `${count} téléchargements`;
};

/**
 * Format contribution count
 */
export const formatContributionCount = (count: number): string => {
  if (count === 0) return 'Aucune contribution';
  if (count === 1) return '1 contribution';
  return `${count} contributions`;
};

/**
 * Format scanned products count
 */
export const formatScannedProductsCount = (count: number): string => {
  if (count === 0) return 'Aucun produit scanné';
  if (count === 1) return '1 produit scanné';
  return `${count} produits scannés`;
};

/**
 * Get contribution message
 */
export const getContributionMessage = (): string => {
  return 'Votre contribution améliore la transparence locale';
};

export default {
  GRATIFICATION_BADGES,
  hasBadge,
  getEarnedBadges,
  getMockUserStats,
  formatDownloadCount,
  formatContributionCount,
  formatScannedProductsCount,
  getContributionMessage,
};
