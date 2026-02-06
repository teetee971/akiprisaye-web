import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function sendToAnalytics(metric: Metric) {
  const payload = {
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,
    path: window.location.pathname,
    timestamp: Date.now(),
  };

  const endpoint = import.meta.env.VITE_WEB_VITALS_ENDPOINT;
  if (endpoint && navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
    return;
  }

  if (import.meta.env.PROD) {
    console.info('📊 Web Vital:', payload);
    return;
  }

  if (import.meta.env.DEV) {
    console.log('📊 Web Vital:', payload);
  }
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Core Web Vitals (v4)
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics); // Remplace FID depuis web-vitals v3
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);

  return null; // Component invisible
}
