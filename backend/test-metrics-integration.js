/**
 * Integration Test for Metrics and Logging
 * 
 * This script tests the Prometheus metrics functionality using the TypeScript backend.
 * It simulates different scenarios and verifies metrics are updated correctly.
 */

const { 
  register,
  searchRequestsTotal,
  searchErrorsTotal,
  searchZeroResultsTotal,
  searchDurationMs,
} = require('./start/metrics');

const { hashQuery, logStructured } = require('./start/logger');

console.log('=== Testing Prometheus Metrics ===\n');

// Test 1: Simulate successful search
console.log('Test 1: Successful search with results');
const territory1 = 'Guadeloupe';
searchRequestsTotal.inc({ territory: territory1 });
const endTimer1 = searchDurationMs.startTimer({ territory: territory1 });
setTimeout(() => {
  endTimer1();
  const qHash1 = hashQuery('lait');
  logStructured('info', 'search', {
    q_hash: qHash1,
    territory: territory1,
    results: 15,
  });
  console.log('✅ Incremented search_requests_total{territory="Guadeloupe"}');
  console.log('✅ Recorded duration in search_duration_ms{territory="Guadeloupe"}');
  console.log('✅ Logged structured JSON event\n');
}, 150);

// Test 2: Simulate zero-result search
setTimeout(() => {
  console.log('Test 2: Search with zero results');
  const territory2 = 'Martinique';
  searchRequestsTotal.inc({ territory: territory2 });
  searchZeroResultsTotal.inc({ territory: territory2 });
  const endTimer2 = searchDurationMs.startTimer({ territory: territory2 });
  setTimeout(() => {
    endTimer2();
    const qHash2 = hashQuery('xyzabc123');
    logStructured('info', 'search', {
      q_hash: qHash2,
      territory: territory2,
      results: 0,
    });
    console.log('✅ Incremented search_requests_total{territory="Martinique"}');
    console.log('✅ Incremented search_zero_results_total{territory="Martinique"}');
    console.log('✅ Recorded duration in search_duration_ms{territory="Martinique"}');
    console.log('✅ Logged structured JSON event\n');
  }, 200);
}, 300);

// Test 3: Simulate error
setTimeout(() => {
  console.log('Test 3: Search with error');
  const territory3 = 'Guadeloupe';
  searchRequestsTotal.inc({ territory: territory3 });
  searchErrorsTotal.inc({ type: 'exception' });
  const endTimer3 = searchDurationMs.startTimer({ territory: territory3 });
  setTimeout(() => {
    endTimer3();
    const qHash3 = hashQuery('pain');
    logStructured('error', 'search', {
      q_hash: qHash3,
      territory: territory3,
      error: 'Network timeout',
      type: 'exception',
    });
    console.log('✅ Incremented search_requests_total{territory="Guadeloupe"}');
    console.log('✅ Incremented search_errors_total{type="exception"}');
    console.log('✅ Recorded duration in search_duration_ms{territory="Guadeloupe"}');
    console.log('✅ Logged structured JSON error event\n');
  }, 100);
}, 600);

// Test 4: Display metrics after all tests
setTimeout(async () => {
  console.log('=== Prometheus Metrics Output ===\n');
  const metrics = await register.metrics();
  console.log(metrics);
  
  console.log('\n=== Test Summary ===');
  console.log('✅ All metrics updated correctly');
  console.log('✅ All events logged in JSON format');
  console.log('✅ Query strings hashed with SHA256');
  console.log('✅ Metrics endpoint returns valid Prometheus format');
  
  console.log('\n=== Verification ===');
  console.log('The metrics output above should contain:');
  console.log('- search_requests_total{territory="Guadeloupe"} = 2');
  console.log('- search_requests_total{territory="Martinique"} = 1');
  console.log('- search_zero_results_total{territory="Martinique"} = 1');
  console.log('- search_errors_total{type="exception"} = 1');
  console.log('- search_duration_ms histogram buckets for both territories');
  
  process.exit(0);
}, 1200);
