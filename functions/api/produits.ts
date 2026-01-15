/**
 * Cloudflare Pages Function: /api/produits
 * Liste des produits observés (nom, catégorie, EAN si présent)
 */

interface Product {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  tva_pct?: number;
  categorie?: string;
  ean?: string;
}

interface Observation {
  produits: Product[];
  date: string;
  [key: string]: any;
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
 * Normalize product name for deduplication
 */
function normalizeProductName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Extract unique products from observations
 */
function extractProduits(observations: Observation[]): Array<{
  nom: string;
  categorie: string;
  ean?: string;
  observations: number;
  derniere_observation: string;
}> {
  const productMap = new Map<string, {
    nom: string;
    categorie: string;
    ean?: string;
    count: number;
    lastDate: string;
  }>();

  for (const obs of observations) {
    if (!obs.produits || !Array.isArray(obs.produits)) continue;
    
    for (const produit of obs.produits) {
      if (!produit.nom) continue;
      
      const key = normalizeProductName(produit.nom);
      const current = productMap.get(key);
      
      if (!current) {
        productMap.set(key, {
          nom: produit.nom,
          categorie: produit.categorie || 'Non catégorisé',
          ean: produit.ean,
          count: 1,
          lastDate: obs.date,
        });
      } else {
        current.count++;
        if (obs.date > current.lastDate) {
          current.lastDate = obs.date;
        }
        // Update EAN if we have one and didn't before
        if (produit.ean && !current.ean) {
          current.ean = produit.ean;
        }
      }
    }
  }

  return Array.from(productMap.values())
    .map(p => ({
      nom: p.nom,
      categorie: p.categorie,
      ...(p.ean && { ean: p.ean }),
      observations: p.count,
      derniere_observation: p.lastDate,
    }))
    .sort((a, b) => b.observations - a.observations);
}

/**
 * GET /api/produits
 * Returns list of observed products with categories and EAN codes
 */
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Optional filter by category
  const categorie = url.searchParams.get('categorie');

  try {
    // Load observations
    const observations = await loadObservations();

    // Extract unique products
    let produits = extractProduits(observations);

    // Filter by category if specified
    if (categorie) {
      const categorieNorm = categorie.toLowerCase();
      produits = produits.filter(p => 
        p.categorie.toLowerCase().includes(categorieNorm)
      );
    }

    return new Response(
      JSON.stringify({
        meta: {
          source: 'A KI PRI SA YÉ',
          generated_at: new Date().toISOString(),
          count: produits.length,
          ...(categorie && { filters: { categorie } }),
        },
        data: produits,
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
    console.error('Error in produits API:', error);
    
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
 * OPTIONS /api/produits
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
