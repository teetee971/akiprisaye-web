/**
 * Cloudflare Pages Function: /api/anomalies/prix
 * Détection automatique d'anomalies de prix - Service de vigilance citoyenne
 * 
 * ⚠️ RÈGLES FONDAMENTALES (OBLIGATOIRES):
 * - Aucune prédiction
 * - Aucun score opaque
 * - Aucun apprentissage automatique non explicable
 * - Méthodes statistiques simples, explicables, traçables
 * - Résultats interprétables par un citoyen ou une collectivité
 * 
 * MÉTHODES AUTORISÉES:
 * - Médiane historique
 * - Écart interquartile (IQR)
 * - Seuils fixes configurables
 * - Comparaison période N vs N-1
 */

type Granularite = 'jour' | 'semaine' | 'mois';
type TypeAnomalie = 'hausse_brutale' | 'baisse_brutale' | 'ecart_extreme' | 'dispersion_anormale';
type NiveauAnomalie = 'faible' | 'modéré' | 'élevé';

interface Product {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  categorie?: string;
  ean?: string;
}

interface Observation {
  id: string;
  territoire: string;
  date: string;
  produits: Product[];
  [key: string]: any;
}

interface PeriodStats {
  periode: string;
  min: number;
  max: number;
  moyenne: number;
  mediane: number;
  prices: number[];
}

interface Anomalie {
  type: TypeAnomalie;
  periode: string;
  valeur: number;
  reference: number;
  variation_pct: number;
  niveau: NiveauAnomalie;
  commentaire: string;
  methode: string;
}

/**
 * Configuration des seuils de détection (explicites et configurables)
 */
const SEUILS = {
  // Variation brutale (%)
  HAUSSE_MODEREE: 15,
  HAUSSE_ELEVEE: 25,
  BAISSE_MODEREE: 15,
  BAISSE_ELEVEE: 25,
  
  // Écart par rapport à la médiane (facteur IQR)
  ECART_MODERE: 1.5,
  ECART_ELEVE: 3.0,
  
  // Dispersion (ratio max/min)
  DISPERSION_MODEREE: 1.3,
  DISPERSION_ELEVEE: 1.5,
  
  // Nombre minimum d'observations pour détecter
  MIN_OBSERVATIONS: 3,
  MIN_PERIODES_HISTORIQUE: 4,
};

/**
 * Load observations from JSON file
 */
async function loadObservations(): Promise<Observation[]> {
  try {
    const response = await fetch('https://akiprisaye.pages.dev/data/observations/index.json');
    if (!response.ok) {
      throw new Error('Failed to fetch observations');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading observations:', error);
    return [];
  }
}

/**
 * Normalize product name for matching
 */
function normalizeProductName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Get period key based on granularity
 */
function getPeriodKey(date: string, granularite: Granularite): string {
  const d = new Date(date);
  
  if (granularite === 'jour') {
    return date;
  }
  
  if (granularite === 'semaine') {
    const year = d.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }
  
  if (granularite === 'mois') {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
  
  return date;
}

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate Interquartile Range (IQR)
 */
function calculateIQR(values: number[]): { q1: number; q3: number; iqr: number } {
  if (values.length < 4) {
    return { q1: 0, q3: 0, iqr: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  return { q1, q3, iqr };
}

/**
 * Collect price data by period for a product and territory
 */
function collectPricesByPeriod(
  observations: Observation[],
  productQuery: string,
  territoire: string,
  granularite: Granularite
): Map<string, PeriodStats> {
  const productNorm = normalizeProductName(productQuery);
  const periodData = new Map<string, number[]>();

  for (const obs of observations) {
    if (obs.territoire !== territoire) continue;
    if (!obs.produits || !Array.isArray(obs.produits)) continue;

    for (const produit of obs.produits) {
      if (!produit.nom) continue;
      
      const produitNorm = normalizeProductName(produit.nom);
      if (!produitNorm.includes(productNorm) && !productNorm.includes(produitNorm)) {
        continue;
      }

      if (typeof produit.prix_unitaire === 'number' && produit.prix_unitaire > 0) {
        const periodKey = getPeriodKey(obs.date, granularite);
        const prices = periodData.get(periodKey) || [];
        prices.push(produit.prix_unitaire);
        periodData.set(periodKey, prices);
      }
    }
  }

  // Calculate statistics for each period
  const stats = new Map<string, PeriodStats>();
  
  for (const [periode, prices] of periodData.entries()) {
    if (prices.length === 0) continue;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((acc, price) => acc + price, 0);
    const moyenne = sum / prices.length;
    const mediane = calculateMedian(prices);

    stats.set(periode, {
      periode,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      moyenne: Math.round(moyenne * 100) / 100,
      mediane: Math.round(mediane * 100) / 100,
      prices,
    });
  }

  return stats;
}

/**
 * Detect anomalies using explainable statistical methods
 */
function detectAnomalies(periodStats: Map<string, PeriodStats>): Anomalie[] {
  const anomalies: Anomalie[] = [];
  const periods = Array.from(periodStats.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  if (periods.length < SEUILS.MIN_PERIODES_HISTORIQUE) {
    return anomalies; // Pas assez de données historiques
  }

  // Collect all prices for global statistics
  const allPrices: number[] = [];
  for (const [, stats] of periods) {
    allPrices.push(...stats.prices);
  }

  const globalMedian = calculateMedian(allPrices);
  const { q1, q3, iqr } = calculateIQR(allPrices);

  // Analyze each period
  for (let i = 0; i < periods.length; i++) {
    const [periode, currentStats] = periods[i];
    
    if (currentStats.prices.length < SEUILS.MIN_OBSERVATIONS) {
      continue; // Pas assez d'observations dans cette période
    }

    // 1. Detect sudden variation (comparison with previous period)
    if (i > 0) {
      const [, prevStats] = periods[i - 1];
      const variation = ((currentStats.moyenne - prevStats.moyenne) / prevStats.moyenne) * 100;
      
      // Hausse brutale
      if (variation >= SEUILS.HAUSSE_MODEREE) {
        const niveau: NiveauAnomalie = variation >= SEUILS.HAUSSE_ELEVEE ? 'élevé' : 'modéré';
        anomalies.push({
          type: 'hausse_brutale',
          periode,
          valeur: currentStats.moyenne,
          reference: prevStats.moyenne,
          variation_pct: Math.round(variation * 100) / 100,
          niveau,
          commentaire: `Augmentation de ${Math.round(variation)}% par rapport à la période précédente`,
          methode: 'Comparaison période N vs N-1',
        });
      }
      
      // Baisse brutale
      if (variation <= -SEUILS.BAISSE_MODEREE) {
        const niveau: NiveauAnomalie = variation <= -SEUILS.BAISSE_ELEVEE ? 'élevé' : 'modéré';
        anomalies.push({
          type: 'baisse_brutale',
          periode,
          valeur: currentStats.moyenne,
          reference: prevStats.moyenne,
          variation_pct: Math.round(variation * 100) / 100,
          niveau,
          commentaire: `Diminution de ${Math.round(Math.abs(variation))}% par rapport à la période précédente`,
          methode: 'Comparaison période N vs N-1',
        });
      }
    }

    // 2. Detect extreme deviation from global median (using IQR method)
    if (iqr > 0) {
      const lowerBound = q1 - SEUILS.ECART_ELEVE * iqr;
      const upperBound = q3 + SEUILS.ECART_ELEVE * iqr;
      
      if (currentStats.moyenne < lowerBound || currentStats.moyenne > upperBound) {
        const deviation = Math.abs(currentStats.moyenne - globalMedian);
        const deviationPct = (deviation / globalMedian) * 100;
        
        const niveau: NiveauAnomalie = 
          (currentStats.moyenne < q1 - SEUILS.ECART_ELEVE * iqr || 
           currentStats.moyenne > q3 + SEUILS.ECART_ELEVE * iqr) ? 'élevé' : 'modéré';
        
        anomalies.push({
          type: 'ecart_extreme',
          periode,
          valeur: currentStats.moyenne,
          reference: globalMedian,
          variation_pct: Math.round(deviationPct * 100) / 100,
          niveau,
          commentaire: `Prix très éloigné de la médiane historique (${Math.round(deviationPct)}%)`,
          methode: 'Méthode IQR (Interquartile Range)',
        });
      }
    }

    // 3. Detect abnormal dispersion within the period
    if (currentStats.min > 0) {
      const dispersionRatio = currentStats.max / currentStats.min;
      
      if (dispersionRatio >= SEUILS.DISPERSION_MODEREE) {
        const niveau: NiveauAnomalie = dispersionRatio >= SEUILS.DISPERSION_ELEVEE ? 'élevé' : 'modéré';
        const variationPct = (dispersionRatio - 1) * 100;
        
        anomalies.push({
          type: 'dispersion_anormale',
          periode,
          valeur: currentStats.max,
          reference: currentStats.min,
          variation_pct: Math.round(variationPct * 100) / 100,
          niveau,
          commentaire: `Écart important entre prix minimum (${currentStats.min}€) et maximum (${currentStats.max}€)`,
          methode: 'Ratio max/min',
        });
      }
    }
  }

  return anomalies;
}

/**
 * Sanitize and validate parameters
 */
function sanitizeString(value: string | null): string {
  if (!value) return '';
  return value.trim().slice(0, 100);
}

function validateGranularite(value: string | null): Granularite {
  if (!value) return 'semaine';
  const normalized = value.toLowerCase() as Granularite;
  if (['jour', 'semaine', 'mois'].includes(normalized)) {
    return normalized;
  }
  return 'semaine';
}

/**
 * GET /api/anomalies/prix
 * Returns detected price anomalies using explainable statistical methods
 */
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Extract and validate parameters
  const produit = sanitizeString(url.searchParams.get('produit'));
  const territoire = sanitizeString(url.searchParams.get('territoire'));
  const periode = validateGranularite(url.searchParams.get('periode'));

  // Validate required parameters
  if (!produit || !territoire) {
    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          error: 'Les paramètres "produit" et "territoire" sont requis',
        },
        anomalies: [],
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // Load observations
    const observations = await loadObservations();

    // Collect price statistics by period
    const periodStats = collectPricesByPeriod(observations, produit, territoire, periode);

    // Detect anomalies
    const anomalies = detectAnomalies(periodStats);

    // Prepare response
    const response = {
      meta: {
        produit,
        territoire,
        periode,
        generated_at: new Date().toISOString(),
        methodologie: 'IQR + variation relative + seuils configurables',
        avertissement: 'Les anomalies signalées sont des indicateurs statistiques basés sur des observations réelles. Elles ne constituent ni une accusation ni une preuve de pratique illégale.',
        source: 'A KI PRI SA YÉ',
      },
      anomalies,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in anomaly detection API:', error);
    
    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          error: 'Erreur interne du serveur',
        },
        anomalies: [],
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * OPTIONS /api/anomalies/prix
 * CORS preflight request handler
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
