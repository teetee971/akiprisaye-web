/**
 * Invoice OCR Service v1.0.0
 * 
 * Service d'extraction automatique des données de factures transporteurs
 * Détection des frais cachés
 */

import type { InvoiceData, HiddenFee, FreightQuote } from '../types/freightComparison';

/**
 * Extrait les données d'une facture (OCR)
 * Note: Implémentation simplifiée - nécessite intégration Tesseract.js ou API OCR
 */
export async function extractInvoiceData(file: File): Promise<InvoiceData | null> {
  try {
    // TODO: Implémenter OCR réel avec Tesseract.js
    // Pour l'instant, retourner structure de base
    
    console.log('OCR extraction pour:', file.name);
    
    // Simulation d'extraction
    return {
      carrier: 'Non détecté',
      route: {
        origin: '',
        destination: '',
      },
      basePrice: 0,
      fees: [],
      totalPaid: 0,
      extractionConfidence: 0.5,
    };
  } catch (error) {
    console.error('Error extracting invoice data:', error);
    return null;
  }
}

/**
 * Détecte les frais cachés en comparant avec le devis attendu
 */
export function detectHiddenFees(
  invoiceData: InvoiceData,
  expectedQuote: FreightQuote | null
): HiddenFee[] {
  const hiddenFees: HiddenFee[] = [];
  
  if (!expectedQuote) {
    // Pas de devis de référence, marquer tous les frais comme potentiellement cachés
    invoiceData.fees.forEach((fee) => {
      hiddenFees.push({
        name: fee.name,
        amount: fee.amount,
        unexpected: true,
        category: categorizeFee(fee.name),
      });
    });
    return hiddenFees;
  }
  
  // Comparer avec le devis attendu
  const expectedFees = new Map<string, number>();
  expectedFees.set('base', expectedQuote.pricing.basePrice);
  expectedFees.set('manutention', expectedQuote.pricing.handlingFee);
  if (expectedQuote.pricing.insurance) {
    expectedFees.set('assurance', expectedQuote.pricing.insurance);
  }
  expectedFees.set('octroi', expectedQuote.pricing.octroi);
  
  // Vérifier chaque frais de la facture
  invoiceData.fees.forEach((fee) => {
    const category = categorizeFee(fee.name);
    const expectedAmount = expectedFees.get(category);
    
    if (!expectedAmount) {
      // Frais non prévu
      hiddenFees.push({
        name: fee.name,
        amount: fee.amount,
        unexpected: true,
        category,
      });
    } else if (Math.abs(fee.amount - expectedAmount) > expectedAmount * 0.1) {
      // Différence > 10%
      hiddenFees.push({
        name: fee.name,
        amount: fee.amount,
        unexpected: true,
        category,
      });
    }
  });
  
  // Vérifier le total
  const totalDifference = Math.abs(
    invoiceData.totalPaid - expectedQuote.pricing.totalTTC
  );
  if (totalDifference > expectedQuote.pricing.totalTTC * 0.05) {
    // Différence > 5% sur le total
    hiddenFees.push({
      name: 'Différence totale non expliquée',
      amount: totalDifference,
      unexpected: true,
      category: 'surcharge',
    });
  }
  
  return hiddenFees;
}

/**
 * Catégorise un frais selon son nom
 */
function categorizeFee(feeName: string): HiddenFee['category'] {
  const lowerName = feeName.toLowerCase();
  
  if (
    lowerName.includes('manutention') ||
    lowerName.includes('handling') ||
    lowerName.includes('manipulation')
  ) {
    return 'handling';
  }
  
  if (
    lowerName.includes('douane') ||
    lowerName.includes('customs') ||
    lowerName.includes('import')
  ) {
    return 'customs';
  }
  
  if (
    lowerName.includes('octroi') ||
    lowerName.includes('taxe') ||
    lowerName.includes('tax') ||
    lowerName.includes('tva')
  ) {
    return 'tax';
  }
  
  if (
    lowerName.includes('supplément') ||
    lowerName.includes('surcharge') ||
    lowerName.includes('frais supplémentaire')
  ) {
    return 'surcharge';
  }
  
  return 'other';
}

/**
 * Valide les données extraites
 */
export function validateInvoiceData(data: InvoiceData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!data.carrier || data.carrier === 'Non détecté') {
    errors.push('Transporteur non détecté');
  }
  
  if (!data.route.origin || !data.route.destination) {
    errors.push('Origine ou destination manquante');
  }
  
  if (data.basePrice <= 0) {
    errors.push('Prix de base invalide');
  }
  
  if (data.totalPaid <= 0) {
    errors.push('Total payé invalide');
  }
  
  if (data.extractionConfidence < 0.7) {
    warnings.push('Confiance d\'extraction faible - vérifiez les données');
  }
  
  // Vérifier cohérence
  const calculatedTotal = data.basePrice + data.fees.reduce((sum, f) => sum + f.amount, 0);
  const difference = Math.abs(calculatedTotal - data.totalPaid);
  if (difference > data.totalPaid * 0.01) {
    // Différence > 1%
    warnings.push('Incohérence entre le total calculé et le total payé');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Parse un fichier PDF pour extraire le texte
 * Note: Nécessite intégration pdf.js ou similaire
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // TODO: Implémenter extraction PDF avec pdf.js
    console.log('Extraction PDF pour:', file.name);
    return '';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

/**
 * Parse une image pour extraire le texte (OCR)
 * Note: Nécessite intégration Tesseract.js
 */
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // TODO: Implémenter OCR avec Tesseract.js
    console.log('OCR image pour:', file.name);
    return '';
  } catch (error) {
    console.error('Error extracting image text:', error);
    return '';
  }
}

/**
 * Parse le texte extrait pour identifier les données structurées
 */
export function parseInvoiceText(text: string): Partial<InvoiceData> {
  const data: Partial<InvoiceData> = {
    fees: [],
  };
  
  // Patterns de détection
  const carrierPatterns = [
    /colissimo/i,
    /chronopost/i,
    /dhl/i,
    /ups/i,
    /fedex/i,
    /cma\s*cgm/i,
    /maersk/i,
  ];
  
  // Détecter le transporteur
  for (const pattern of carrierPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.carrier = match[0];
      break;
    }
  }
  
  // Détecter les montants (EUR, €)
  const pricePattern = /(\d+[.,]\d{2})\s*(?:EUR|€)/gi;
  const prices = Array.from(text.matchAll(pricePattern)).map((m) =>
    parseFloat(m[1].replace(',', '.'))
  );
  
  if (prices.length > 0) {
    data.totalPaid = prices[prices.length - 1]; // Dernier montant = total
    if (prices.length > 1) {
      data.basePrice = prices[0]; // Premier montant = base
    }
  }
  
  // Détecter poids (kg)
  const weightPattern = /(\d+[.,]?\d*)\s*kg/i;
  const weightMatch = text.match(weightPattern);
  if (weightMatch) {
    data.weight = parseFloat(weightMatch[1].replace(',', '.'));
  }
  
  // Détecter numéro de suivi
  const trackingPattern = /(?:tracking|suivi|n°|numéro)\s*:?\s*([A-Z0-9]{10,})/i;
  const trackingMatch = text.match(trackingPattern);
  if (trackingMatch) {
    data.trackingNumber = trackingMatch[1];
  }
  
  return data;
}
