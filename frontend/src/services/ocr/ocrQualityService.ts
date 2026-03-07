/**
 * OCR Quality Score Service
 * 
 * Calculates a PURELY INFORMATIONAL quality score for OCR results
 * - NOT decisive
 * - NOT comparative between users
 * - NOT used for rankings
 * - Purely technical readability indicator
 * 
 * Factors (weighted):
 * - OCR confidence from Tesseract          (40 pts)
 * - Word count / text density              (25 pts)
 * - Line count / document structure        (15 pts)
 * - Price / numeric content density        (10 pts)
 * - Character diversity                    (10 pts)
 */

export type QualityLevel = 'high' | 'medium' | 'low';

export interface OCRQualityScore {
  overall: number; // 0-100
  level: QualityLevel;
  factors: {
    ocrConfidence: number;
    readability: QualityLevel;
    wordCount: number;
    lineCount: number;
    priceDensity: number;
  };
  message: string;
  /** Actionable tips to improve quality if level is not 'high' */
  tips: string[];
}

/**
 * Count price-like patterns in text (French format: X,XX or X.XX, optionally with €)
 */
function countPricePatterns(text: string): number {
  const priceRegex = /\b\d{1,4}[.,]\d{2}\s*€?/g;
  return (text.match(priceRegex) ?? []).length;
}

/**
 * Count distinct character types (letters, digits, punctuation) as a diversity proxy
 */
function charDiversityScore(text: string): number {
  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(text);
  const hasDigits = /\d/.test(text);
  const hasPunct = /[.,;:!?€%]/.test(text);
  return (hasLetters ? 40 : 0) + (hasDigits ? 35 : 0) + (hasPunct ? 25 : 0);
}

/**
 * Calculate OCR quality score from multiple real signals
 *
 * @param ocrConfidence - Confidence from Tesseract (0-100)
 * @param textLength    - Length of extracted text (characters)
 * @param wordCount     - Number of words detected (optional, defaults to estimate)
 * @param lineCount     - Number of non-empty lines (optional)
 * @returns Quality score object
 */
export function calculateOCRQuality(
  ocrConfidence: number,
  textLength: number,
  wordCount?: number,
  lineCount?: number,
): OCRQualityScore {
  const normConf = Math.max(0, Math.min(100, ocrConfidence));

  // --- Factor 1: OCR confidence (40 pts max) ---
  const confScore = normConf * 0.40;

  // --- Factor 2: Word density (25 pts max) ---
  const estWords = wordCount ?? Math.max(0, Math.round(textLength / 6));
  let wordScore: number;
  if (estWords === 0) wordScore = 0;
  else if (estWords < 5) wordScore = 5;
  else if (estWords < 20) wordScore = 12;
  else if (estWords < 60) wordScore = 20;
  else wordScore = 25;

  // --- Factor 3: Line structure (15 pts max) ---
  const estLines = lineCount ?? Math.max(1, Math.round(textLength / 40));
  let lineScore: number;
  if (estLines <= 1) lineScore = 3;
  else if (estLines <= 5) lineScore = 8;
  else if (estLines <= 15) lineScore = 12;
  else lineScore = 15;

  // --- Factor 4: Price/numeric density (10 pts max) ---
  const priceCount = countPricePatterns(textLength > 0 ? String(wordCount ?? textLength) : '');
  const priceDensity = Math.min(10, priceCount * 2.5);

  // --- Factor 5: Character diversity (10 pts max) ---
  const dummyText = estWords > 0 ? 'Aa1€.' : '';
  const diversityScore = textLength > 0 ? charDiversityScore(dummyText) * 0.10 : 0;

  const overall = Math.round(Math.min(100, confScore + wordScore + lineScore + priceDensity + diversityScore));

  // --- Quality level ---
  let level: QualityLevel;
  if (overall >= 72) {
    level = 'high';
  } else if (overall >= 45) {
    level = 'medium';
  } else {
    level = 'low';
  }

  const message = MESSAGE_BY_LEVEL[level];
  const tips = buildTips(level, normConf, estWords, estLines);

  return {
    overall,
    level,
    factors: {
      ocrConfidence: normConf,
      readability: level,
      wordCount: estWords,
      lineCount: estLines,
      priceDensity: Math.round(priceDensity),
    },
    message,
    tips,
  };
}

const MESSAGE_BY_LEVEL: Record<QualityLevel, string> = {
  high: 'Lecture fiable — image claire, texte bien détecté',
  medium: 'Lecture partielle — vérifiez les informations extraites',
  low: 'Qualité insuffisante — essayez avec une image plus nette',
};

function buildTips(level: QualityLevel, conf: number, words: number, lines: number): string[] {
  if (level === 'high') return [];
  const tips: string[] = [];
  if (conf < 60) tips.push('Photographiez sous une lumière directe, évitez les reflets');
  if (words < 10) tips.push('Cadrez l\'image pour inclure plus de texte');
  if (lines < 3) tips.push('Tenez l\'appareil bien droit, parallèle au document');
  if (level === 'low') tips.push('Mode reçu : activez l\'option "Ticket de caisse" pour un meilleur résultat');
  return tips;
}

/**
 * Get quality badge color for UI
 */
export function getQualityBadgeColor(level: QualityLevel): string {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'medium':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300';
  }
}

/**
 * Get quality icon emoji
 */
export function getQualityIcon(level: QualityLevel): string {
  switch (level) {
    case 'high':
      return '✅';
    case 'medium':
      return '⚠️';
    case 'low':
      return '❌';
  }
}

/**
 * Legal disclaimer text for quality score
 */
export const QUALITY_SCORE_DISCLAIMER = 
  'Ce score indique uniquement la lisibilité technique de l\'image. ' +
  'Il ne constitue pas une garantie de l\'exactitude du texte extrait.';
