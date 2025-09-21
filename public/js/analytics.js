/**
 * Intégration Google Analytics et suivi des performances pour A KI PRI SA YÉ
 * Compatible RGPD avec consentement utilisateur
 */

class AnalyticsManager {
  constructor() {
    this.gaId = 'G-XXXXXXXXXX'; // À remplacer par votre ID Google Analytics
    this.consentGiven = false;
    this.events = [];
    this.init();
  }

  init() {
    this.checkConsent();
    this.createConsentBanner();
    this.setupEventTracking();
    if (this.consentGiven) {
      this.loadGoogleAnalytics();
    }
  }

  /**
   * Vérifier le consentement existant
   */
  checkConsent() {
    const consent = localStorage.getItem('akiprisaye_analytics_consent');
    this.consentGiven = consent === 'true';
  }

  /**
   * Créer la bannière de consentement RGPD
   */
  createConsentBanner() {
    if (this.consentGiven || document.querySelector('.consent-banner')) {
      return;
    }

    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid #334155;
      padding: 16px 20px;
      color: #e7eefc;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    `;

    const message = document.createElement('div');
    message.innerHTML = `
      🍪 Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation du site. 
      <a href="/legal/confidentialite.html" style="color: #00e5ff; text-decoration: underline;">En savoir plus</a>
    `;
    message.style.flex = '1';

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '8px';

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Accepter';
    acceptBtn.style.cssText = `
      background: linear-gradient(135deg, #00e5ff, #00ff95);
      color: #081224;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    `;
    acceptBtn.onclick = () => this.acceptConsent();

    const declineBtn = document.createElement('button');
    declineBtn.textContent = 'Refuser';
    declineBtn.style.cssText = `
      background: transparent;
      color: #94a3b8;
      border: 1px solid #475569;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    `;
    declineBtn.onclick = () => this.declineConsent();

    buttons.appendChild(declineBtn);
    buttons.appendChild(acceptBtn);

    banner.appendChild(message);
    banner.appendChild(buttons);

    document.body.appendChild(banner);

    // Responsive
    if (window.innerWidth < 768) {
      banner.style.flexDirection = 'column';
      banner.style.textAlign = 'center';
      message.style.marginBottom = '8px';
    }
  }

  /**
   * Accepter le consentement
   */
  acceptConsent() {
    localStorage.setItem('akiprisaye_analytics_consent', 'true');
    this.consentGiven = true;
    this.removeBanner();
    this.loadGoogleAnalytics();
    this.trackEvent('consent', 'accept', 'analytics');
  }

  /**
   * Refuser le consentement
   */
  declineConsent() {
    localStorage.setItem('akiprisaye_analytics_consent', 'false');
    this.consentGiven = false;
    this.removeBanner();
    this.trackEvent('consent', 'decline', 'analytics');
  }

  /**
   * Supprimer la bannière
   */
  removeBanner() {
    const banner = document.querySelector('.consent-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  /**
   * Charger Google Analytics
   */
  loadGoogleAnalytics() {
    if (window.gtag || !this.gaId || this.gaId === 'G-XXXXXXXXXX') {
      console.warn('Google Analytics déjà chargé ou ID non configuré');
      return;
    }

    // Charger le script Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    // Initialiser gtag
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      
      gtag('js', new Date());
      gtag('config', this.gaId, {
        anonymize_ip: true,
        respect_dnt: true,
        custom_map: {
          custom_dimension_1: 'territory',
          custom_dimension_2: 'user_type'
        }
      });

      // Envoyer les événements en attente
      this.sendQueuedEvents();
    };
  }

  /**
   * Configuration du suivi d'événements
   */
  setupEventTracking() {
    // Suivi des recherches
    this.trackSearches();
    
    // Suivi des clics sur les enseignes
    this.trackStoreClicks();
    
    // Suivi des comparaisons
    this.trackComparisons();
    
    // Suivi de l'engagement
    this.trackEngagement();
    
    // Suivi des erreurs
    this.trackErrors();
  }

  /**
   * Suivre les recherches
   */
  trackSearches() {
    // Écouter les soumissions de formulaires de recherche
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.matches('.search-form, [data-type="search"]') || 
          form.action.includes('recherche') ||
          form.querySelector('input[name="q"], input[name="query"]')) {
        
        const query = form.querySelector('input[name="q"], input[name="query"]')?.value;
        if (query) {
          this.trackEvent('search', 'query', query);
        }
      }
    });

    // Écouter les recherches via l'API
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      if (typeof url === 'string' && url.includes('/api/search')) {
        const urlObj = new URL(url, window.location.origin);
        const searchQuery = urlObj.searchParams.get('q');
        if (searchQuery) {
          this.trackEvent('api_search', 'query', searchQuery);
        }
      }
      return originalFetch(...args);
    };
  }

  /**
   * Suivre les clics sur les enseignes
   */
  trackStoreClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      const storeLink = target.closest('.store-link, .enseigne-link, [data-store]');
      
      if (storeLink) {
        const storeName = storeLink.dataset.store || 
                         storeLink.querySelector('.store-name')?.textContent || 
                         storeLink.textContent.trim();
        this.trackEvent('engagement', 'store_click', storeName);
      }
    });
  }

  /**
   * Suivre les comparaisons
   */
  trackComparisons() {
    // Suivre les comparaisons de prix
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.matches('.compare-btn, .comparison-btn, [data-action="compare"]')) {
        const productName = target.dataset.product || 
                           target.closest('.product-card')?.querySelector('.product-name')?.textContent ||
                           'unknown';
        this.trackEvent('comparison', 'start', productName);
      }

      if (target.matches('.export-btn, [data-action="export"]')) {
        const exportType = target.dataset.type || 'unknown';
        this.trackEvent('export', 'download', exportType);
      }
    });

    // Suivre l'utilisation des suggestions locales
    document.addEventListener('click', (e) => {
      if (e.target.closest('.local-suggestions-widget')) {
        this.trackEvent('suggestions', 'interaction', 'local_suggestions');
      }
    });
  }

  /**
   * Suivre l'engagement utilisateur
   */
  trackEngagement() {
    // Temps passé sur la page
    let startTime = Date.now();
    let engaged = false;
    
    // Marquer comme engagé après 30 secondes
    setTimeout(() => {
      engaged = true;
      this.trackEvent('engagement', 'time_spent', '30_seconds');
    }, 30000);

    // Suivi du scroll
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if ([25, 50, 75, 90].includes(scrollPercent)) {
          this.trackEvent('engagement', 'scroll', `${scrollPercent}%`);
        }
      }
    });

    // Suivi de la fermeture de page
    window.addEventListener('beforeunload', () => {
      if (engaged) {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        this.trackEvent('engagement', 'session_duration', timeSpent.toString());
      }
    });
  }

  /**
   * Suivre les erreurs
   */
  trackErrors() {
    // Erreurs JavaScript
    window.addEventListener('error', (e) => {
      this.trackEvent('error', 'javascript', e.message);
    });

    // Erreurs de ressources
    window.addEventListener('error', (e) => {
      if (e.target !== window) {
        this.trackEvent('error', 'resource', e.target.src || e.target.href);
      }
    }, true);

    // Promesses rejetées
    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent('error', 'promise_rejection', e.reason);
    });

    // Erreurs 404
    if (document.title.includes('404') || window.location.pathname.includes('404')) {
      this.trackEvent('error', '404', window.location.pathname);
    }
  }

  /**
   * Enregistrer un événement
   */
  trackEvent(category, action, label = '', value = 0) {
    const event = {
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    };

    // Ajouter des informations contextuelles
    event.page = window.location.pathname;
    event.territory = this.getUserTerritory();
    event.userAgent = navigator.userAgent;

    if (this.consentGiven && window.gtag) {
      // Envoyer directement à Google Analytics
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        custom_map: {
          territory: event.territory
        }
      });
    } else {
      // Stocker en attente
      this.events.push(event);
    }

    // Log local pour debug
    console.log('Analytics Event:', event);
  }

  /**
   * Envoyer les événements en attente
   */
  sendQueuedEvents() {
    if (!window.gtag || !this.consentGiven) return;

    this.events.forEach(event => {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value
      });
    });

    this.events = [];
  }

  /**
   * Détecter le territoire de l'utilisateur
   */
  getUserTerritory() {
    // Essayer depuis les préférences stockées
    const preferences = localStorage.getItem('akiprisaye_preferences');
    if (preferences) {
      try {
        return JSON.parse(preferences).territory || 'unknown';
      } catch (e) {
        // Ignorer l'erreur
      }
    }

    // Essayer depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const territory = urlParams.get('territory') || urlParams.get('zone');
    if (territory) return territory;

    return 'unknown';
  }

  /**
   * Suivre une conversion
   */
  trackConversion(type, value = 0) {
    this.trackEvent('conversion', type, '', value);
    
    if (window.gtag && this.consentGiven) {
      window.gtag('event', 'conversion', {
        send_to: this.gaId,
        value: value,
        currency: 'EUR'
      });
    }
  }

  /**
   * Suivre les performances Core Web Vitals
   */
  trackWebVitals() {
    // Observer les métriques de performance
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackEvent('performance', 'lcp', Math.round(lastEntry.startTime).toString());
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.trackEvent('performance', 'fid', Math.round(entry.processingStart - entry.startTime).toString());
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        if (cls > 0) {
          this.trackEvent('performance', 'cls', (cls * 1000).toFixed(0));
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Révoquer le consentement
   */
  revokeConsent() {
    localStorage.setItem('akiprisaye_analytics_consent', 'false');
    this.consentGiven = false;
    
    // Supprimer les cookies Google Analytics
    this.clearGACookies();
    
    this.trackEvent('consent', 'revoke', 'analytics');
  }

  /**
   * Supprimer les cookies Google Analytics
   */
  clearGACookies() {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga') || name.startsWith('_gid')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  }
}

// Initialisation automatique
if (typeof window !== 'undefined') {
  window.AnalyticsManager = AnalyticsManager;
  
  document.addEventListener('DOMContentLoaded', function() {
    window.analyticsManager = new AnalyticsManager();
    
    // Suivre les Web Vitals après le chargement
    window.addEventListener('load', () => {
      window.analyticsManager.trackWebVitals();
    });
  });
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsManager;
}