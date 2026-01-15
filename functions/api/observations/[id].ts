/**
 * Cloudflare Pages Function: /api/observations/[id]
 * Retourne une observation unique par son ID
 */

interface Observation {
  id: string;
  territoire: string;
  commune?: string;
  enseigne: string;
  magasin_id?: string;
  date: string;
  heure?: string;
  produits: Array<{
    nom: string;
    quantite: number;
    prix_unitaire: number;
    prix_total: number;
    tva_pct?: number;
    categorie?: string;
    ean?: string;
  }>;
  total_ttc: number;
  source: string;
  fiabilite: string;
  verifie: boolean;
  notes?: string;
  created_at: string;
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
 * GET /api/observations/:id
 * Returns a single observation by ID
 */
export async function onRequestGet(context: any) {
  const { params } = context;
  const observationId = params.id;

  if (!observationId) {
    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          count: 0,
          error: 'Missing observation ID',
        },
        data: [],
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // Load observations
    const observations = await loadObservations();

    // Find the specific observation
    const observation = observations.find(obs => obs.id === observationId);

    if (!observation) {
      return new Response(
        JSON.stringify({
          meta: {
            source: 'A KI PRI SA YÉ',
            generated_at: new Date().toISOString(),
            count: 0,
            error: 'Observation not found',
          },
          data: [],
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          count: 1,
        },
        data: [observation],
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching observation:', error);
    
    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          count: 0,
          error: 'Internal server error',
        },
        data: [],
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
 * OPTIONS /api/observations/:id
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
