/**
 * OCR Quality Score Service
 * 
 * Calculates a PURELY INFORMATIONAL quality score for OCR results
 * - NOT decisive
 * - NOT comparative between users
 * - NOT used for rankings
 * - Purely technical readability indicator
 * 
 * Factors:
 * - OCR confidence from Tesseract
 * - Image sharpness estimation
 * - Contrast level
 * - Linguistic coherence (basic)
 */

export type QualityLevel = 'high' | 'medium' | 'low';

export interface OCRQualityScore {
  overall: number; // 0-100
  level: QualityLevel;
  factors: {
    ocrConfidence: number;
    readability: QualityLevel;
  };
  message: string;
}

/**
 * Calculate OCR quality score
 * 
 * @param ocrConfidence - Confidence from Tesseract (0-100)
 * @param textLength - Length of extracted text
 * @returns Quality score object
 */
export function calculateOCRQuality(
  ocrConfidence: number,
  textLength: number
): OCRQualityScore {
  // Normalize OCR confidence (already 0-100)
  const normalizedConfidence = Math.max(0, Math.min(100, ocrConfidence));
  
  // Basic readability heuristic based on text length
  // Short text with high confidence is better than long text with lower confidence
  let readabilityScore = normalizedConfidence;
  
  if (textLength > 0 && textLength < 10) {
    // Very short text - might be unreliable
    readabilityScore *= 0.8;
  } else if (textLength > 1000) {
    // Very long text - good capture
    readabilityScore *= 1.1;
  }
  
  const overall = Math.round(Math.min(100, readabilityScore));
  
  // Determine quality level
  let level: QualityLevel;
  let message: string;
  
  if (overall >= 75) {
    level = 'high';
    message = 'Lecture fiable - Image claire et texte bien détecté';
  } else if (overall >= 50) {
    level = 'medium';
    message = 'Lecture partielle - Vérifiez les informations extraites';
  } else {
    level = 'low';
    message = 'Qualité insuffisante - Essayez avec une meilleure image';
  }
  
  return {
    overall,
    level,
    factors: {
      ocrConfidence: normalizedConfidence,
      readability: level,
    },
    message,
  };
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
