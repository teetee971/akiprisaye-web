/**
 * Manual Test Script for Prometheus Metrics and Structured Logging
 * 
 * This script demonstrates the functionality of the metrics and logging system.
 * It simulates API calls and shows the expected outputs.
 * 
 * To run this test in a real environment:
 * 1. Deploy the Cloudflare Pages functions
 * 2. Make a few search requests: GET /api/products/search?q=lait&territory=Guadeloupe
 * 3. Check the metrics endpoint: GET /metrics
 * 4. Review the structured logs in Cloudflare dashboard or logs
 * 
 * Expected Behavior:
 * - Each search increments search_requests_total counter
 * - Zero-result searches increment search_zero_results_total counter
 * - Errors increment search_errors_total counter
 * - All searches record duration in search_duration_ms histogram
 * - All events logged as JSON with query hash (not plain text)
 */

// Example structured log output:
const exampleLogs = [
  {
    level: 'info',
    event: 'search',
    timestamp: '2025-11-10T00:33:01.996Z',
    q_hash: 'a1b2c3d4e5f6...', // SHA256 hash of query
    territory: 'Guadeloupe',
    results: 15,
  },
  {
    level: 'info',
    event: 'search',
    timestamp: '2025-11-10T00:33:02.123Z',
    q_hash: 'f6e5d4c3b2a1...',
    territory: 'Martinique',
    results: 0,
  },
  {
    level: 'error',
    event: 'search',
    timestamp: '2025-11-10T00:33:03.456Z',
    q_hash: 'b2c3d4e5f6a1...',
    territory: 'Guadeloupe',
    error: 'Network error',
    type: 'exception',
  },
];

// Example Prometheus metrics output:
const exampleMetrics = `
# HELP search_requests_total Total number of product search requests
# TYPE search_requests_total counter
search_requests_total{territory="Guadeloupe"} 150
search_requests_total{territory="Martinique"} 75
search_requests_total{territory="Réunion"} 45

# HELP search_errors_total Total number of product search errors
# TYPE search_errors_total counter
search_errors_total{type="exception"} 3

# HELP search_zero_results_total Total number of product searches that returned zero results
# TYPE search_zero_results_total counter
search_zero_results_total{territory="Guadeloupe"} 12
search_zero_results_total{territory="Martinique"} 8

# HELP search_duration_ms Product search request duration in milliseconds
# TYPE search_duration_ms histogram
search_duration_ms_bucket{territory="Guadeloupe",le="50"} 10
search_duration_ms_bucket{territory="Guadeloupe",le="100"} 45
search_duration_ms_bucket{territory="Guadeloupe",le="200"} 120
search_duration_ms_bucket{territory="Guadeloupe",le="300"} 140
search_duration_ms_bucket{territory="Guadeloupe",le="500"} 148
search_duration_ms_bucket{territory="Guadeloupe",le="1000"} 150
search_duration_ms_bucket{territory="Guadeloupe",le="2000"} 150
search_duration_ms_bucket{territory="Guadeloupe",le="5000"} 150
search_duration_ms_bucket{territory="Guadeloupe",le="+Inf"} 150
search_duration_ms_sum{territory="Guadeloupe"} 23450
search_duration_ms_count{territory="Guadeloupe"} 150
`;

console.log('=== Example Structured Logs (JSON Format) ===');
exampleLogs.forEach(log => console.log(JSON.stringify(log)));

console.log('\n=== Example Prometheus Metrics Output ===');
console.log(exampleMetrics);

console.log('\n=== Test Scenarios ===');
console.log('1. Successful search with results:');
console.log('   - Increments search_requests_total{territory="X"}');
console.log('   - Records duration in search_duration_ms{territory="X"}');
console.log('   - Logs: {"level":"info","event":"search","q_hash":"...","territory":"X","results":N}');

console.log('\n2. Search with zero results:');
console.log('   - Increments search_requests_total{territory="X"}');
console.log('   - Increments search_zero_results_total{territory="X"}');
console.log('   - Records duration in search_duration_ms{territory="X"}');
console.log('   - Logs: {"level":"info","event":"search","q_hash":"...","territory":"X","results":0}');

console.log('\n3. Search with error:');
console.log('   - Increments search_requests_total{territory="X"}');
console.log('   - Increments search_errors_total{type="exception"}');
console.log('   - Records duration in search_duration_ms{territory="X"}');
console.log('   - Logs: {"level":"error","event":"search","q_hash":"...","territory":"X","error":"...","type":"exception"}');

console.log('\n=== Security Notes ===');
console.log('- Query strings are hashed with SHA256 (not stored in plain text)');
console.log('- /metrics endpoint should be protected in production:');
console.log('  * Use Cloudflare Access for authentication');
console.log('  * Configure IP allowlist for Prometheus scraper');
console.log('  * Use reverse proxy with authentication');

module.exports = {
  exampleLogs,
  exampleMetrics,
};
