/**
 * OCR Data Integrity Service
 * 
 * Provides cryptographic signature for OCR results
 * - SHA-256 hash of extracted text
 * - Timestamp
 * - Optional metadata
 * - Allows public verification
 * - No private keys (simple integrity check)
 */

export interface OCRSignature {
  hash: string; // SHA-256 hex
  timestamp: number;
  textLength: number;
  ocrConfidence: number;
  version: string;
}

/**
 * Generate SHA-256 hash of text
 */
async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Sign OCR result with cryptographic hash
 */
export async function signOCRResult(
  text: string,
  confidence: number
): Promise<OCRSignature> {
  const hash = await generateSHA256(text);
  
  return {
    hash,
    timestamp: Date.now(),
    textLength: text.length,
    ocrConfidence: confidence,
    version: '1.0.0',
  };
}

/**
 * Verify OCR signature
 */
export async function verifyOCRSignature(
  text: string,
  signature: OCRSignature
): Promise<boolean> {
  try {
    const currentHash = await generateSHA256(text);
    return currentHash === signature.hash && text.length === signature.textLength;
  } catch {
    return false;
  }
}

/**
 * Export signature to shareable JSON
 */
export function exportSignature(signature: OCRSignature, text: string): string {
  return JSON.stringify(
    {
      signature,
      text,
      exportedAt: new Date().toISOString(),
      tool: 'A KI PRI SA YÉ - OCR Module',
    },
    null,
    2
  );
}

/**
 * Format signature for display
 */
export function formatSignature(signature: OCRSignature): string {
  const date = new Date(signature.timestamp).toLocaleString('fr-FR');
  return `
Hash SHA-256: ${signature.hash}
Date: ${date}
Longueur texte: ${signature.textLength} caractères
Confiance OCR: ${signature.ocrConfidence.toFixed(1)}%
Version: ${signature.version}
  `.trim();
}
