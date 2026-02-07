export type ScanHubType =
  | 'receipt'
  | 'product'
  | 'shelf_label'
  | 'nutrition'
  | 'ingredients'
  | 'barcode'
  | 'legal'
  | 'promotion'
  | 'unknown';

export interface ScanHubClassification {
  type: ScanHubType;
  confidence: number;
  signals: string[];
  matches: Record<string, number>;
}

const TYPE_KEYWORDS: Record<ScanHubType, RegExp[]> = {
  receipt: [
    /ticket/i,
    /caisse/i,
    /tva/i,
    /ttc/i,
    /total/i,
    /montant/i,
    /cb|carte/i,
    /rendu|rendu monnaie/i,
  ],
  product: [/marque/i, /poids/i, /contient/i, /origine/i, /lot/i],
  shelf_label: [/€\/kg/i, /€\/l/i, /prix/i, /rayon/i, /promo/i, /lot/i],
  nutrition: [
    /valeurs nutritionnelles/i,
    /nutrition/i,
    /pour 100/i,
    /kcal/i,
    /kj/i,
    /matières grasses|lipides/i,
    /glucides|sucres/i,
    /protéines/i,
    /fibres/i,
    /sel/i,
  ],
  ingredients: [
    /ingr[ée]dients?/i,
    /allerg[èe]nes?/i,
    /peut contenir/i,
    /additifs?/i,
  ],
  barcode: [/\b\d{8,14}\b/],
  legal: [/mention l[ée]gale/i, /service consommateurs/i, /ne pas jeter/i, /lot/i],
  promotion: [/promo/i, /offre/i, /remise/i, /r[ée]duction/i, /2\+1/i],
  unknown: [],
};

const TYPE_LABELS: Record<ScanHubType, string> = {
  receipt: 'Ticket de caisse',
  product: 'Produit / emballage',
  shelf_label: 'Étiquette de gondole',
  nutrition: 'Tableau nutritionnel',
  ingredients: 'Liste d\'ingrédients',
  barcode: 'Code-barres / QR',
  legal: 'Mention légale',
  promotion: 'Texte promotionnel',
  unknown: 'Type non identifié',
};

export function getScanHubTypeLabel(type: ScanHubType): string {
  return TYPE_LABELS[type] ?? TYPE_LABELS.unknown;
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => (pattern.test(text) ? count + 1 : count), 0);
}

export function classifyScanText(text: string): ScanHubClassification {
  const normalized = text.toLowerCase();
  const matches: Record<string, number> = {};
  const signals: string[] = [];

  let bestType: ScanHubType = 'unknown';
  let bestScore = 0;

  (Object.keys(TYPE_KEYWORDS) as ScanHubType[]).forEach((type) => {
    const score = countMatches(normalized, TYPE_KEYWORDS[type]);
    matches[type] = score;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  });

  if (bestType === 'unknown' && normalized.length > 120) {
    bestType = 'product';
  }

  if (matches.receipt > 0) signals.push('Mention “ticket/caisse” détectée');
  if (matches.ingredients > 0) signals.push('Mots-clés ingrédients/allergènes');
  if (matches.nutrition > 0) signals.push('Mots-clés nutritionnels');
  if (matches.shelf_label > 0) signals.push('Prix unitaire / étiquette');
  if (matches.barcode > 0) signals.push('Séquence numérique type code-barres');
  if (matches.promotion > 0) signals.push('Mention promotionnelle');
  if (matches.legal > 0) signals.push('Mentions légales');

  const confidence = Math.min(98, Math.max(35, bestScore * 20 + Math.min(normalized.length / 40, 10)));

  return {
    type: bestType,
    confidence,
    signals,
    matches,
  };
}

export function extractPrices(text: string): number[] {
  const priceRegex = /\b(\d{1,3}(?:[.,]\d{2}))\b/g;
  const matches = [...text.matchAll(priceRegex)];
  return matches
    .map((match) => parseFloat(match[1].replace(',', '.')))
    .filter((value) => !Number.isNaN(value));
}

export function extractAdditives(text: string): string[] {
  const additiveRegex = /\bE\s?\d{3,4}\b/gi;
  const matches = [...text.matchAll(additiveRegex)];
  return Array.from(new Set(matches.map((match) => match[0].toUpperCase().replace(' ', ''))));
}

export function estimateNovaIndex(additivesCount: number): string {
  if (additivesCount === 0) return 'NOVA 1 (peu transformé)';
  if (additivesCount <= 2) return 'NOVA 2-3 (transformé)';
  return 'NOVA 4 (ultra-transformé)';
}

export function estimateNutriScore(text: string): string {
  const match = text.match(/nutri[-\s]?score\s*([a-e])/i);
  if (match?.[1]) {
    return `Nutri-Score ${match[1].toUpperCase()}`;
  }
  return 'Nutri-Score estimé: non déterminé';
}
