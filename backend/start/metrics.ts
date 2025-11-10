// metrics.ts - Prometheus metrics configuration
// This file sets up Prometheus metrics for monitoring the application

import * as promClient from 'prom-client';

// Create a Registry to hold all metrics
export const register = new promClient.Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
promClient.collectDefaultMetrics({ register });

/**
 * Counter: Total number of search requests
 * Labels: territory (e.g., "Guadeloupe", "Martinique")
 */
export const searchRequestsTotal = new promClient.Counter({
  name: 'search_requests_total',
  help: 'Total number of product search requests',
  labelNames: ['territory'],
  registers: [register]
});

/**
 * Counter: Total number of search errors
 * Labels: type (e.g., "exception", "validation")
 */
export const searchErrorsTotal = new promClient.Counter({
  name: 'search_errors_total',
  help: 'Total number of product search errors',
  labelNames: ['type'],
  registers: [register]
});

/**
 * Counter: Total number of searches that returned zero results
 * Labels: territory
 */
export const searchZeroResultsTotal = new promClient.Counter({
  name: 'search_zero_results_total',
  help: 'Total number of product searches that returned zero results',
  labelNames: ['territory'],
  registers: [register]
});

/**
 * Histogram: Search request duration in milliseconds
 * Labels: territory
 * Buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000] milliseconds
 */
export const searchDurationMs = new promClient.Histogram({
  name: 'search_duration_ms',
  help: 'Product search request duration in milliseconds',
  labelNames: ['territory'],
  buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000],
  registers: [register]
});
