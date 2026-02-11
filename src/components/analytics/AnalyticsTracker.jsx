import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'akiprisaye-analytics-events';

/**
 * Tracks page navigation events and stores them in localStorage when the user has opted in.
 *
 * Records events containing path, hash, ISO timestamp, referrer, and language, and keeps the last 50 events under the `akiprisaye-analytics-events` key. Tracking is enabled only when `akiprisaye-analytics-optin` equals `"true"`.
 * @returns {null} Renders nothing.
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
    events = Array.isArray(events) ? events : [];
    events.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-50)));
  }, [location.pathname, location.hash]);

  return null;
}