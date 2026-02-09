import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'akiprisaye-analytics-events';

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
    } catch {
      events = [];
    }
    events.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-50)));
  }, [location.pathname, location.hash]);

  return null;
}
