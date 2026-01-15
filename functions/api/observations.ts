/**
 * Cloudflare Pages Function: /api/observations
 * API open-data publique en lecture seule pour l'observatoire des prix
 * 
 * Endpoints:
 * - GET /api/observations - Liste des observations validées
 * - GET /api/observations/:id - Observation unique
 */

import { 
  loadObservations, 
  matchesProductQuery, 
  getApiHeaders, 
  createOptionsResponse, 
  API_CONFIG,
  type Observation 
} from './utils';

interface ApiResponse {
  meta: {
    source: string;
    generated_at: string;
    count: number;
    filters?: Record<string, any>;
  };
  data: any[];
}

/**
 * Sanitize and validate string parameters
 */
function sanitizeString(value: string | null, maxLength = 100): string {
  if (!value) return '';
  return value.trim().slice(0, maxLength);
}

/**
 * Sanitize and validate date format (YYYY-MM-DD)
 */
function sanitizeDate(date: string | null): string | null {
  if (!date) return null;
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(`${year}-${month}-${day}`);
  if (isNaN(parsed.getTime())) return null;
  return `${year}-${month}-${day}`;
}

/**
 * Sanitize and validate numeric parameters
 */
function sanitizeNumber(value: string | null, defaultValue: number, min: number, max: number): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}



/**
 * Filter observations based on query parameters
 */
function filterObservations(
  observations: Observation[],
  filters: {
    territoire?: string;
    produit?: string;
    date_from?: string;
    date_to?: string;
  }
): Observation[] {
  let filtered = [...observations];

  if (filters.territoire) {
    const territoire = filters.territoire.toLowerCase();
    filtered = filtered.filter(obs => 
      obs.territoire.toLowerCase().includes(territoire)
    );
  }

  if (filters.produit) {
    filtered = filtered.filter(obs =>
      obs.produits.some(p => matchesProductQuery(p.nom, filters.produit!))
    );
  }

  if (filters.date_from) {
    filtered = filtered.filter(obs => obs.date >= filters.date_from!);
  }

  if (filters.date_to) {
    filtered = filtered.filter(obs => obs.date <= filters.date_to!);
  }

  return filtered;
}

/**
 * Paginate results
 */
function paginate<T>(items: T[], limit: number, offset: number): T[] {
  return items.slice(offset, offset + limit);
}

/**
 * Create standardized API response
 */
function createResponse(data: any[], filters?: Record<string, any>): ApiResponse {
  return {
    meta: {
      source: API_CONFIG.SOURCE_NAME,
      generated_at: new Date().toISOString(),
      count: data.length,
      ...(filters && { filters }),
    },
    data,
  };
}

/**
 * GET /api/observations
 * Returns list of validated observations with optional filters
 */
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Extract and sanitize query parameters
  const territoire = sanitizeString(url.searchParams.get('territoire'));
  const produit = sanitizeString(url.searchParams.get('produit'));
  const date_from = sanitizeDate(url.searchParams.get('date_from'));
  const date_to = sanitizeDate(url.searchParams.get('date_to'));
  const limit = sanitizeNumber(url.searchParams.get('limit'), 30, 1, 100);
  const offset = sanitizeNumber(url.searchParams.get('offset'), 0, 0, 10000);

  try {
    // Load observations
    const observations = await loadObservations();

    // Apply filters
    const filters: Record<string, any> = {};
    if (territoire) filters.territoire = territoire;
    if (produit) filters.produit = produit;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const filtered = filterObservations(observations, {
      territoire: territoire || undefined,
      produit: produit || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    });

    // Paginate
    const paginated = paginate(filtered, limit, offset);

    // Create response
    const response = createResponse(paginated, Object.keys(filters).length > 0 ? filters : undefined);

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: getApiHeaders(),
    });
  } catch (error) {
    console.error('Error in observations API:', error);
    
    return new Response(
      JSON.stringify({
        meta: {
          source: API_CONFIG.SOURCE_NAME,
          generated_at: new Date().toISOString(),
          count: 0,
          error: 'Internal server error',
        },
        data: [],
      }),
      {
        status: 500,
        headers: getApiHeaders(false),
      }
    );
  }
}

/**
 * OPTIONS /api/observations
 * CORS preflight request handler
 */
export async function onRequestOptions() {
  return createOptionsResponse();
}
