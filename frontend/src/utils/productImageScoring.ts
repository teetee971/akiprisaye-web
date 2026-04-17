/**
 * Product Image Scoring
 *
 * Calcul du score de pertinence (0–100) d'un candidat image pour un produit.
 * Toutes les fonctions sont pures (sans effets de bord) — facilement testables.
 *
 * Score composite:
 *  +35 marque exacte dans le titre de l'image
 *  +25 grammage/volume exact
 *  +20 mots-clés principaux (≥2 communs)
 *  +10 catégorie cohérente
 *  +10 source officielle
 *
 * Malus:
 *  -30 image manifestement non-produit (lifestyle, décoration)
 *  -20 logo seul
 *  -20 packaging incompatible (marque différente explicite)
 *  -15 taille incompatible (grammage différent et explicite)
 *  -10 candidat trop générique (titre court < 3 mots)
 *  -10 image décorative / générique
 */

import {
  extractBrandFromLabel,
  extractSizeFromLabel,
  removeAccents,
} from './productLabelNormalizer';

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Score minimum pour auto-attacher sans validation */
export const THRESHOLD_AUTO = 80;

/** Score minimum pour attacher avec needsReview=true */
export const THRESHOLD_REVIEW = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoringInput {
  rawLabel: string;
  normalizedLabel: string;
  brand?: string | null;
  size?: string | null;
  category?: string | null;
}

export interface ScoringCandidate {
  url: string;
  source: string;
  sourceType: 'official' | 'retailer' | 'openfoodfacts' | 'other';
  title?: string;
  matchedQuery: string;
  notes?: string;
}

export interface ScoredCandidate extends ScoringCandidate {
  confidenceScore: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  brandMatch: number;
  sizeMatch: number;
  keywordsMatch: number;
  categoryMatch: number;
  sourceBonus: number;
  packshotBonus: number;
  logoMalus: number;
  lifestyleMalus: number;
  sizeMismatchMalus: number;
  genericMalus: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise un texte pour comparaison insensible aux accents et casse */
function normalizeForComparison(str: string): string {
  return removeAccents(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrait les mots-clés significatifs d'un libellé (longueur ≥ 3) */
function extractKeywords(label: string): string[] {
  const stopwords = new Set(['les', 'des', 'une', 'pour', 'avec', 'sans', 'the', 'and', 'for']);
  return normalizeForComparison(label)
    .split(' ')
    .filter((w) => w.length >= 3 && !stopwords.has(w));
}

/** Extrait la valeur numérique d'un grammage (ex: "300g" → "300") */
function extractSizeValue(size: string): string {
  return size.replace(/[a-z]+$/i, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main scoring function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le score de confiance d'un candidat image pour un produit.
 *
 * @param input     - Descripteur produit (label, marque, taille, catégorie)
 * @param candidate - Candidat image à évaluer
 * @returns Score 0–100 + détail du calcul
 */
export function scoreImageCandidate(
  input: ScoringInput,
  candidate: ScoringCandidate
): ScoredCandidate {
  const breakdown: ScoreBreakdown = {
    brandMatch: 0,
    sizeMatch: 0,
    keywordsMatch: 0,
    categoryMatch: 0,
    sourceBonus: 0,
    packshotBonus: 0,
    logoMalus: 0,
    lifestyleMalus: 0,
    sizeMismatchMalus: 0,
    genericMalus: 0,
  };

  const titleNorm = normalizeForComparison(candidate.title ?? '');
  const titleWords = titleNorm.split(' ');

  const detectedBrand = input.brand ?? extractBrandFromLabel(input.rawLabel);
  const detectedSize = input.size ?? extractSizeFromLabel(input.rawLabel);

  // ── +35 marque exacte ─────────────────────────────────────────────────────
  if (detectedBrand) {
    const brandNorm = normalizeForComparison(detectedBrand);
    if (titleNorm.includes(brandNorm)) {
      breakdown.brandMatch = 35;
    }
  }

  // ── +25 grammage exact ────────────────────────────────────────────────────
  if (detectedSize) {
    const sizeNorm = normalizeForComparison(detectedSize);
    const sizeValue = extractSizeValue(detectedSize);
    if (titleNorm.includes(sizeNorm) || titleNorm.includes(sizeValue)) {
      breakdown.sizeMatch = 25;
    }
  }

  // ── +20 mots-clés principaux (≥2 mots en commun) ─────────────────────────
  const keywords = extractKeywords(input.normalizedLabel);
  const commonCount = keywords.filter((kw) =>
    titleWords.some((tw) => tw.includes(kw) || kw.includes(tw))
  ).length;
  if (commonCount >= 3) breakdown.keywordsMatch = 20;
  else if (commonCount === 2) breakdown.keywordsMatch = 14;
  else if (commonCount === 1) breakdown.keywordsMatch = 6;

  // ── +10 catégorie cohérente ───────────────────────────────────────────────
  if (input.category) {
    const catNorm = normalizeForComparison(input.category.replace(/_/g, ' '));
    // Si un mot de la catégorie apparaît dans le titre
    const catWords = catNorm.split(' ').filter((w) => w.length >= 4);
    if (catWords.some((cw) => titleNorm.includes(cw))) {
      breakdown.categoryMatch = 10;
    }
  }

  // ── +10 source officielle ─────────────────────────────────────────────────
  if (candidate.sourceType === 'official' || candidate.sourceType === 'retailer') {
    breakdown.sourceBonus = 10;
  }

  // ── +5 packshot ───────────────────────────────────────────────────────────
  if (candidate.notes?.includes('packshot')) {
    breakdown.packshotBonus = 5;
  }

  // ── Malus ─────────────────────────────────────────────────────────────────

  // -20 logo seul
  if (candidate.notes?.includes('logo')) {
    breakdown.logoMalus = -20;
  }

  // -30 lifestyle / non-produit
  if (candidate.notes?.includes('lifestyle') || candidate.notes?.includes('non-produit')) {
    breakdown.lifestyleMalus = -30;
  }

  // -15 grammage explicitement différent dans le titre
  if (detectedSize) {
    const sizeValue = extractSizeValue(detectedSize);
    const titleSizeMatch = titleNorm.match(/\b(\d+(?:[.,]\d+)?)\s*(?:kg|g|cl|l|ml|oz)\b/i);
    if (titleSizeMatch && titleSizeMatch[1] !== sizeValue) {
      breakdown.sizeMismatchMalus = -15;
    }
  }

  // -10 titre trop générique (< 3 mots)
  if (titleWords.filter((w) => w.length >= 2).length < 3) {
    breakdown.genericMalus = -10;
  }

  const raw =
    breakdown.brandMatch +
    breakdown.sizeMatch +
    breakdown.keywordsMatch +
    breakdown.categoryMatch +
    breakdown.sourceBonus +
    breakdown.packshotBonus +
    breakdown.logoMalus +
    breakdown.lifestyleMalus +
    breakdown.sizeMismatchMalus +
    breakdown.genericMalus;

  const confidenceScore = Math.max(0, Math.min(100, Math.round(raw)));

  return { ...candidate, confidenceScore, scoreBreakdown: breakdown };
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score et trie tous les candidats pour un produit.
 * Retourne la liste triée par score décroissant.
 */
export function scoreAllCandidates(
  input: ScoringInput,
  candidates: ScoringCandidate[]
): ScoredCandidate[] {
  return candidates
    .map((c) => scoreImageCandidate(input, c))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Sélectionne le meilleur candidat selon les seuils.
 *
 * @returns null si aucun candidat dépasse THRESHOLD_REVIEW
 */
export function chooseBestCandidate(
  input: ScoringInput,
  candidates: ScoringCandidate[]
): { candidate: ScoredCandidate; needsReview: boolean } | null {
  const scored = scoreAllCandidates(input, candidates);
  const best = scored[0];
  if (!best || best.confidenceScore < THRESHOLD_REVIEW) return null;
  return {
    candidate: best,
    needsReview: best.confidenceScore < THRESHOLD_AUTO,
  };
}

/**
 * Retourne la raison lisible du rejet d'un candidat.
 */
export function getRejectionReason(score: number): string {
  if (score < THRESHOLD_REVIEW) {
    return `Score ${score}/100 insuffisant (seuil: ${THRESHOLD_REVIEW})`;
  }
  if (score < THRESHOLD_AUTO) {
    return `Score ${score}/100 acceptable mais validation manuelle recommandée`;
  }
  return 'OK';
}
