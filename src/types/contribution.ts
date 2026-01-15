/**
 * Contribution System Type Definitions
 * For citizen price contributions and gamification
 */

export type ContributionStatus = 'pending' | 'validated' | 'rejected' | 'flagged';
export type ContributionSource = 'manual' | 'receipt_scan' | 'barcode_scan';

export interface PriceContribution {
  id: string;
  userId?: string;
  username?: string;
  productEAN: string;
  productName: string;
  price: number;
  storeId: string;
  storeName: string;
  territory: string;
  observationDate: string;
  submittedAt: string;
  status: ContributionStatus;
  source: ContributionSource;
  receiptPhoto?: string; // Base64 or URL
  validations: ContributionValidation[];
  points: number;
}

export interface ContributionValidation {
  userId: string;
  vote: 'confirm' | 'reject' | 'unsure';
  comment?: string;
  timestamp: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number; // Contributions needed
  unlockedAt?: string;
}

export interface UserStats {
  userId: string;
  totalContributions: number;
  validatedContributions: number;
  points: number;
  level: number;
  badges: UserBadge[];
  rank?: number; // Global or territory rank
}
