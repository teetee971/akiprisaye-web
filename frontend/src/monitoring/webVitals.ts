/**
 * webVitals.ts
 * Collect Core Web Vitals and push them into the monitoring buffer.
 * Uses the official web-vitals library (already a project dependency).
 *
 * Metrics collected: LCP, CLS, INP, FCP, TTFB
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { monitoringBuffer } from './storageBuffer';

export interface VitalEntry {
  category: 'web_vital';
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
}

function record(metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}): void {
  const entry: VitalEntry = {
    category: 'web_vital',
    name: metric.name,
    value: Math.round(metric.value * 10) / 10,
    rating: metric.rating,
    timestamp: new Date().toISOString(),
  };
  monitoringBuffer.addItem(entry);
  if (import.meta.env.DEV) {
    const icon =
      metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.info(`[webVitals] ${icon} ${metric.name} = ${entry.value} (${metric.rating})`);
  }
}

let _installed = false;

/**
 * Register Web Vitals collectors.
 * Idempotent — safe to call multiple times.
 */
export function initWebVitals(): void {
  if (_installed) return;
  _installed = true;
  onLCP(record);
  onCLS(record);
  onINP(record);
  onFCP(record);
  onTTFB(record);
}

/** Return all buffered vitals */
export function getVitals(): VitalEntry[] {
  return monitoringBuffer
    .getItems()
    .filter(
      (item): item is VitalEntry =>
        typeof item === 'object' && item !== null && (item as VitalEntry).category === 'web_vital'
    );
}
