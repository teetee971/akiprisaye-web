/**
 * Cloudflare Pages Function: /metrics
 * Prometheus metrics endpoint
 * 
 * SECURITY NOTE: This endpoint is unauthenticated for internal network scraping.
 * In production, protect this endpoint using:
 * - Reverse proxy (e.g., Cloudflare Access, nginx)
 * - IP allowlist (only allow Prometheus server IPs)
 * - Internal network routing
 */

// Import metrics from the search function
// Note: In serverless environments, metrics are ephemeral per instance
// For persistent metrics, consider using Cloudflare Workers KV or Durable Objects

/**
 * Generate Prometheus text exposition format
 */
function generatePrometheusMetrics(metrics) {
  let output = '';
  
  // search_requests_total counter
  output += '# HELP search_requests_total Total number of product search requests\n';
  output += '# TYPE search_requests_total counter\n';
  for (const [key, value] of Object.entries(metrics.search_requests_total || {})) {
    const labels = Object.entries(value.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    output += `search_requests_total{${labels}} ${value.count}\n`;
  }
  
  // search_errors_total counter
  output += '# HELP search_errors_total Total number of product search errors\n';
  output += '# TYPE search_errors_total counter\n';
  for (const [key, value] of Object.entries(metrics.search_errors_total || {})) {
    const labels = Object.entries(value.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    output += `search_errors_total{${labels}} ${value.count}\n`;
  }
  
  // search_zero_results_total counter
  output += '# HELP search_zero_results_total Total number of product searches that returned zero results\n';
  output += '# TYPE search_zero_results_total counter\n';
  for (const [key, value] of Object.entries(metrics.search_zero_results_total || {})) {
    const labels = Object.entries(value.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    output += `search_zero_results_total{${labels}} ${value.count}\n`;
  }
  
  // search_duration_ms histogram
  output += '# HELP search_duration_ms Product search request duration in milliseconds\n';
  output += '# TYPE search_duration_ms histogram\n';
  for (const [key, value] of Object.entries(metrics.search_duration_buckets || {})) {
    const labels = Object.entries(value.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    // Output buckets
    for (const [bucket, count] of Object.entries(value.buckets)) {
      output += `search_duration_ms_bucket{${labels},le="${bucket}"} ${count}\n`;
    }
    output += `search_duration_ms_bucket{${labels},le="+Inf"} ${value.count}\n`;
    output += `search_duration_ms_sum{${labels}} ${value.sum}\n`;
    output += `search_duration_ms_count{${labels}} ${value.count}\n`;
  }
  
  return output;
}

/**
 * In-memory metrics storage shared with search endpoint
 * Note: This is a simplified implementation for demonstration
 * In a real serverless environment, metrics would need to be stored externally
 */
const globalMetrics = {
  search_requests_total: {},
  search_errors_total: {},
  search_zero_results_total: {},
  search_duration_buckets: {}
};

/**
 * GET /metrics
 */
export async function onRequestGet(context) {
  try {
    // In a real implementation, you would fetch metrics from a shared store
    // For now, we'll generate a basic response with the schema
    const metricsText = generatePrometheusMetrics(globalMetrics);
    
    // Add Node.js default metrics placeholder
    // Note: In Cloudflare Workers/Pages, these metrics are not available
    // This is a placeholder to show the expected format
    let output = metricsText;
    
    // Add some basic runtime metrics if available
    output += '\n# HELP nodejs_version_info Node.js version info\n';
    output += '# TYPE nodejs_version_info gauge\n';
    output += 'nodejs_version_info{version="cloudflare-workers",major="0",minor="0",patch="0"} 1\n';
    
    return new Response(output, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to collect metrics',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
