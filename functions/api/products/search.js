/**
 * Cloudflare Pages Function: /api/products/search
 * Product search endpoint with Prometheus metrics and structured logging
 */

import crypto from 'node:crypto';

// In-memory metrics storage for serverless environment
// Note: In production, consider using Cloudflare Workers KV or Durable Objects for persistence
const metrics = {
  search_requests_total: {},
  search_errors_total: {},
  search_zero_results_total: {},
  search_duration_buckets: {}
};

/**
 * Hash query for privacy
 */
function hashQuery(query) {
  const normalized = query.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Log structured JSON event
 */
function logStructured(level, event, data = {}) {
  const logEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Increment counter metric
 */
function incrementCounter(metricName, labels = {}) {
  const key = JSON.stringify(labels);
  if (!metrics[metricName][key]) {
    metrics[metricName][key] = { labels, count: 0 };
  }
  metrics[metricName][key].count++;
}

/**
 * Record histogram observation
 */
function recordHistogram(metricName, value, labels = {}) {
  const key = JSON.stringify(labels);
  if (!metrics[metricName][key]) {
    metrics[metricName][key] = {
      labels,
      buckets: { 50: 0, 100: 0, 200: 0, 300: 0, 500: 0, 1000: 0, 2000: 0, 5000: 0 },
      sum: 0,
      count: 0
    };
  }
  
  const metric = metrics[metricName][key];
  metric.sum += value;
  metric.count++;
  
  // Increment buckets
  for (const bucket of [50, 100, 200, 300, 500, 1000, 2000, 5000]) {
    if (value <= bucket) {
      metric.buckets[bucket]++;
    }
  }
}

/**
 * GET /api/products/search
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const territory = url.searchParams.get('territory') || 'Guadeloupe';
  
  const startTime = Date.now();
  
  // Increment total request counter
  incrementCounter('search_requests_total', { territory });
  
  try {
    if (q.length < 3) {
      const duration = Date.now() - startTime;
      recordHistogram('search_duration_buckets', duration, { territory });
      
      // Log zero results for short queries
      const qHash = hashQuery(q);
      logStructured('info', 'search', {
        q_hash: qHash,
        territory,
        results: 0,
        reason: 'query_too_short'
      });
      
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Search Open Food Facts
    const results = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15`
    ).then((r) => r.json());

    const items = (results.products || [])
      .map((p) => ({
        name: p.product_name || p.generic_name || 'Produit inconnu',
        brand: p.brands || '—',
        ean: p.code,
        image: p.image_small_url || p.image_url || null,
      }))
      .filter((p) => p.ean)
      .slice(0, 15);

    // Check for zero results
    if (items.length === 0) {
      incrementCounter('search_zero_results_total', { territory });
    }
    
    // Record duration
    const duration = Date.now() - startTime;
    recordHistogram('search_duration_buckets', duration, { territory });
    
    // Log structured search event
    const qHash = hashQuery(q);
    logStructured('info', 'search', {
      q_hash: qHash,
      territory,
      results: items.length
    });

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    // Increment error counter
    incrementCounter('search_errors_total', { type: 'exception' });
    
    // Record duration
    const duration = Date.now() - startTime;
    recordHistogram('search_duration_buckets', duration, { territory });
    
    // Log error with structured logging
    const qHash = hashQuery(q);
    logStructured('error', 'search', {
      q_hash: qHash,
      territory,
      error: error.message,
      type: 'exception'
    });
    
    console.error('Erreur API produits :', error);
    
    return new Response(JSON.stringify({
      error: 'Error searching products',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Export metrics for /metrics endpoint
export { metrics };
