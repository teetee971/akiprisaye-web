/**
 * Cloudflare Pages Function: /api/comparaison/territoires
 * Comparaison territoriale des prix basée sur observations réelles uniquement
 * 
 * ⚠️ GOUVERNANCE STRICTE:
 * - Aucune prédiction
 * - Aucune extrapolation
 * - Aucune estimation de prix manquant
 * - Données observées uniquement
 */

import { 
  loadObservations, 
  matchesProductQuery, 
  getApiHeaders, 
  createOptionsResponse, 
  API_CONFIG,
  type Observation 
} from '../utils';

interface TerritorialComparison {
  territoire: string;
  min: number;
  max: number;
  moyenne: number;
  observations: number;
  derniere_mise_a_jour: string;
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
 * Calculate territorial comparison for a specific product
 */
function calculateTerritorialComparison(
  observations: Observation[],
  productQuery: string,
  territories?: string[]
): TerritorialComparison[] {
  // Group prices by territory
  const territoryData = new Map<string, {
    prices: number[];
    lastDate: string;
  }>();

  for (const obs of observations) {
    // Skip if we're filtering by specific territories and this isn't one of them
    if (territories && territories.length > 0 && !territories.includes(obs.territoire)) {
      continue;
    }

    if (!obs.produits || !Array.isArray(obs.produits)) continue;

    for (const produit of obs.produits) {
      if (!produit.nom) continue;
      
      // Match product by name (partial match for flexibility)
      if (!matchesProductQuery(produit.nom, productQuery)) {
        continue;
      }

      const current = territoryData.get(obs.territoire) || {
        prices: [],
        lastDate: obs.date,
      };

      if (typeof produit.prix_unitaire === 'number' && produit.prix_unitaire > 0) {
        current.prices.push(produit.prix_unitaire);
      }

      if (obs.date > current.lastDate) {
        current.lastDate = obs.date;
      }

      territoryData.set(obs.territoire, current);
    }
  }

  // Calculate aggregations for each territory
  const comparisons: TerritorialComparison[] = [];

  for (const [territoire, data] of territoryData.entries()) {
    if (data.prices.length === 0) continue;

    const min = Math.min(...data.prices);
    const max = Math.max(...data.prices);
    const sum = data.prices.reduce((acc, price) => acc + price, 0);
    const moyenne = sum / data.prices.length;

    comparisons.push({
      territoire,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      moyenne: Math.round(moyenne * 100) / 100,
      observations: data.prices.length,
      derniere_mise_a_jour: data.lastDate,
    });
  }

  // Sort by territory name
  return comparisons.sort((a, b) => a.territoire.localeCompare(b.territoire));
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
 * GET /api/comparaison/territoires
 * Compare product prices across territories
 */
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Extract and validate parameters
  const produit = sanitizeString(url.searchParams.get('produit'));
  const territoriesParam = sanitizeString(url.searchParams.get('territoires'));
  const date_from = sanitizeDate(url.searchParams.get('date_from'));
  const date_to = sanitizeDate(url.searchParams.get('date_to'));

  // Validate required parameter
  if (!produit) {
    return new Response(
      JSON.stringify({
        meta: {
          source: API_CONFIG.SOURCE_NAME,
          generated_at: new Date().toISOString(),
          error: 'Le paramètre "produit" est requis',
        },
        comparaison: [],
      }),
      {
        status: 400,
        headers: getApiHeaders(false),
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
    }

    // Filter by date range
    observations = filterByDateRange(observations, dateFrom || undefined, dateTo || undefined);

    // Parse territories list
    const territories = territoriesParam
      ? territoriesParam.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : undefined;

    // Calculate comparison
    const comparaison = calculateTerritorialComparison(observations, produit, territories);

    // Prepare response
    const response = {
      meta: {
        produit,
        periode: {
          from: dateFrom || 'non spécifié',
          to: dateTo || 'non spécifié',
        },
        source: 'A KI PRI SA YÉ',
        generated_at: new Date().toISOString(),
        avertissement: 'Données observées – non prédictives – usage citoyen et institutionnel',
      },
      comparaison,
    };

    // Add warning if no data found
    if (comparaison.length === 0) {
      response.meta.avertissement = 'Aucune donnée disponible pour ce produit et cette période. Les comparaisons sont basées uniquement sur des observations réelles.';
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: getApiHeaders(),
    });
  } catch (error) {
    console.error('Error in territorial comparison API:', error);
    
    return new Response(
      JSON.stringify({
        meta: {
          source: API_CONFIG.SOURCE_NAME,
          generated_at: new Date().toISOString(),
          error: 'Erreur interne du serveur',
        },
        comparaison: [],
      }),
      {
        status: 500,
        headers: getApiHeaders(false),
      }
    );
  }
}

/**
 * OPTIONS /api/comparaison/territoires
 * CORS preflight request handler
 */
export async function onRequestOptions() {
  return createOptionsResponse();
}
