/**
 * Cloudflare Pages Function: /api/evolution/prix
 * Évolution temporelle des prix basée sur observations réelles uniquement
 * 
 * ⚠️ RÈGLES CRITIQUES (NON NÉGOCIABLES):
 * - Aucune interpolation
 * - Aucun lissage artificiel
 * - Aucune extrapolation
 * - Aucun comblement de période vide
 * - Si une période n'a pas de données, elle est absente du tableau
 */

type Granularite = 'jour' | 'semaine' | 'mois';

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

interface PeriodData {
  periode: string;
  min: number;
  max: number;
  moyenne: number;
  observations: number;
}

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
 * Get week number in ISO 8601 format (YYYY-Www)
 */
function getISOWeek(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get period key based on granularity
 */
function getPeriodKey(date: string, granularite: Granularite): string {
  const d = new Date(date);
  
  if (granularite === 'jour') {
    return date; // Already in YYYY-MM-DD format
  }
  
  if (granularite === 'semaine') {
    return getISOWeek(d);
  }
  
  if (granularite === 'mois') {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
  
  return date;
}

/**
 * Determine automatic granularity based on date range
 */
function determineGranularity(date_from: string, date_to: string): Granularite {
  const from = new Date(date_from);
  const to = new Date(date_to);
  const days = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
  
  if (days <= 31) {
    return 'jour';
  } else if (days <= 180) {
    return 'semaine';
  } else {
    return 'mois';
  }
}

/**
 * Filter observations by date range
 */
function filterByDateRange(
  observations: Observation[],
  date_from?: string,
  date_to?: string
): Observation[] {
  let filtered = [...observations];

  if (date_from) {
    filtered = filtered.filter(obs => obs.date >= date_from);
  }

  if (date_to) {
    filtered = filtered.filter(obs => obs.date <= date_to);
  }

  return filtered;
}

/**
 * Calculate price evolution for a specific product and territory
 */
function calculatePriceEvolution(
  observations: Observation[],
  productQuery: string,
  territoire: string,
  granularite: Granularite
): PeriodData[] {
  const productNorm = normalizeProductName(productQuery);
  
  // Group prices by period
  const periodData = new Map<string, number[]>();

  for (const obs of observations) {
    // Filter by territory
    if (obs.territoire !== territoire) continue;
    
    if (!obs.produits || !Array.isArray(obs.produits)) continue;

    for (const produit of obs.produits) {
      if (!produit.nom) continue;
      
      // Match product by name (partial match for flexibility)
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

  // Calculate aggregations for each period
  const evolution: PeriodData[] = [];

  for (const [periode, prices] of periodData.entries()) {
    if (prices.length === 0) continue;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((acc, price) => acc + price, 0);
    const moyenne = sum / prices.length;

    evolution.push({
      periode,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      moyenne: Math.round(moyenne * 100) / 100,
      observations: prices.length,
    });
  }

  // Sort by period (chronological order)
  return evolution.sort((a, b) => a.periode.localeCompare(b.periode));
}

/**
 * Sanitize and validate date format
 */
function sanitizeDate(date: string | null): string | null {
  if (!date) return null;
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return date;
}

/**
 * Sanitize string parameter
 */
function sanitizeString(value: string | null): string {
  if (!value) return '';
  return value.trim().slice(0, 100);
}

/**
 * Validate granularity parameter
 */
function validateGranularite(value: string | null): Granularite | null {
  if (!value) return null;
  const normalized = value.toLowerCase() as Granularite;
  if (['jour', 'semaine', 'mois'].includes(normalized)) {
    return normalized;
  }
  return null;
}

/**
 * GET /api/evolution/prix
 * Returns temporal price evolution for a product in a territory
 */
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Extract and validate parameters
  const produit = sanitizeString(url.searchParams.get('produit'));
  const territoire = sanitizeString(url.searchParams.get('territoire'));
  const date_from = sanitizeDate(url.searchParams.get('date_from'));
  const date_to = sanitizeDate(url.searchParams.get('date_to'));
  const granulariteParam = validateGranularite(url.searchParams.get('granularite'));

  // Validate required parameters
  if (!produit || !territoire) {
    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          error: 'Les paramètres "produit" et "territoire" sont requis',
        },
        evolution: [],
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
    let observations = await loadObservations();

    // Default date range: last 30 days if not specified
    let dateFrom = date_from;
    let dateTo = date_to;
    
    if (!dateFrom && !dateTo) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      dateTo = now.toISOString().split('T')[0];
    } else if (!dateFrom) {
      dateFrom = '2020-01-01'; // Default start date
    } else if (!dateTo) {
      dateTo = new Date().toISOString().split('T')[0];
    }

    // Filter by date range
    observations = filterByDateRange(observations, dateFrom, dateTo);

    // Determine granularity (automatic if not specified)
    const granularite = granulariteParam || determineGranularity(dateFrom, dateTo);

    // Calculate evolution
    const evolution = calculatePriceEvolution(observations, produit, territoire, granularite);

    // Prepare response
    const response = {
      meta: {
        produit,
        territoire,
        granularite,
        periode: {
          from: dateFrom,
          to: dateTo,
        },
        source: 'A KI PRI SA YÉ',
        generated_at: new Date().toISOString(),
        avertissement: 'Données observées uniquement – aucune interpolation – périodes sans données sont absentes',
      },
      evolution,
    };

    // Add warning if no data found
    if (evolution.length === 0) {
      response.meta.avertissement = 'Aucune donnée disponible pour ce produit, territoire et période. Aucune estimation n\'est effectuée.';
    }

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
    console.error('Error in price evolution API:', error);
    
    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          error: 'Erreur interne du serveur',
        },
        evolution: [],
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
 * OPTIONS /api/evolution/prix
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
