import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'akiprisaye-analytics-events';

/**
 * Tracks route changes and records lightweight analytics events to localStorage when the user has opted in.
 *
 * When the opt-in flag `akiprisaye-analytics-optin` is set to `'true'`, the component records an event on changes
 * to the current path or hash. Each event contains path, hash, ISO timestamp, referrer (or `'direct'`), and page
 * language (or `'fr'` if unset). Events are persisted under `akiprisaye-analytics-events` and capped to the most
 * recent 50 entries.
 *
 * @returns {null} Renders nothing (no UI).
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const isOptIn = localStorage.getItem('akiprisaye-analytics-optin') === 'true';
    if (!isOptIn) {
      return;
    }

    const event = {
      path: location.pathname,
      hash: location.hash,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      language: document.documentElement.lang || 'fr',
    };

    let events = [];
    try {
      events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to parse analytics events from localStorage:', error);
      }
      events = [];
    }
    events.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-50)));
  }, [location.pathname, location.hash]);

  return null;
}