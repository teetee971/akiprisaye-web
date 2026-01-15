/**
 * Cloudflare Pages Function: /api/territoires
 * Liste officielle des territoires disponibles dans les observations
 */

import { loadObservations, createOptionsResponse, API_CONFIG, type Observation } from './utils';

/**
 * Extract unique territories from observations
 */
function extractTerritoires(observations: Observation[]): Array<{ nom: string; count: number; derniere_observation: string }> {
  const territoireMap = new Map<string, { count: number; lastDate: string }>();

  for (const obs of observations) {
    if (!obs.territoire) continue;
    
    const current = territoireMap.get(obs.territoire) || { count: 0, lastDate: '' };
    current.count++;
    
    if (!current.lastDate || obs.date > current.lastDate) {
      current.lastDate = obs.date;
    }
    
    territoireMap.set(obs.territoire, current);
  }

  return Array.from(territoireMap.entries())
    .map(([nom, data]) => ({
      nom,
      count: data.count,
      derniere_observation: data.lastDate,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

/**
 * GET /api/territoires
 * Returns list of available territories with observation counts
 */
export async function onRequestGet() {
  try {
    // Load observations
    const observations = await loadObservations();

    // Extract unique territories
    const territoires = extractTerritoires(observations);

    return new Response(
      JSON.stringify({
        meta: {
          source: API_CONFIG.SOURCE_NAME,
          generated_at: new Date().toISOString(),
          count: territoires.length,
        },
        data: territoires,
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
    console.error('Error in territoires API:', error);
    
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
 * OPTIONS /api/territoires
 * CORS preflight request handler
 */
export async function onRequestOptions() {
  return createOptionsResponse();
}
