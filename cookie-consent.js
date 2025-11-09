// Cookie Consent Management - RGPD/GDPR Compliant
// A KI PRI SA YÉ

class CookieConsent {
  constructor() {
    this.cookieName = 'akiprisaye-cookie-consent';
    this.consentExpiry = 365; // days
    this.init();
  }

  init() {
    // Check if user has already given consent
    const consent = this.getConsent();
    
    if (consent === null) {
      // No consent given yet, show banner
      this.showBanner();
    } else if (consent === 'accepted') {
      // Consent accepted, load analytics/tracking
      this.loadAnalytics();
    }
    // If declined, do nothing (only essential cookies)
  }

  showBanner() {
    // Create banner element
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement aux cookies');
    banner.setAttribute('aria-live', 'polite');
    
    banner.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-text">
          <p>
            🍪 Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
            Les cookies essentiels sont nécessaires au fonctionnement, les cookies de performance 
            nous aident à améliorer le site.
            <a href="/mentions.html#cookies" target="_blank">En savoir plus</a>.
          </p>
        </div>
        <div class="cookie-consent-buttons">
          <button class="cookie-btn cookie-btn-accept" id="cookie-accept" aria-label="Accepter tous les cookies">
            ✓ Accepter tout
          </button>
          <button class="cookie-btn cookie-btn-settings" id="cookie-settings" aria-label="Paramètres des cookies">
            ⚙️ Paramètres
          </button>
          <button class="cookie-btn cookie-btn-decline" id="cookie-decline" aria-label="Refuser les cookies optionnels">
            ✗ Essentiels uniquement
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Show banner with animation
    setTimeout(() => {
      banner.classList.add('show');
    }, 500);
    
    // Add event listeners
    document.getElementById('cookie-accept')?.addEventListener('click', () => {
      this.setConsent('accepted');
      this.setPreferences({ analytics: true, functional: true });
      this.hideBanner(banner);
      this.loadAnalytics();
    });
    
    document.getElementById('cookie-decline')?.addEventListener('click', () => {
      this.setConsent('declined');
      this.setPreferences({ analytics: false, functional: false });
      this.hideBanner(banner);
    });
    
    document.getElementById('cookie-settings')?.addEventListener('click', () => {
      this.showSettings(banner);
    });
  }
  
  showSettings(banner) {
    // Create settings modal
    const modal = document.createElement('div');
    modal.className = 'cookie-settings-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cookie-settings-title');
    
    modal.innerHTML = `
      <div class="cookie-settings-overlay"></div>
      <div class="cookie-settings-content">
        <h2 id="cookie-settings-title" style="color: #0f62fe; margin-bottom: 1rem;">
          Paramètres des cookies
        </h2>
        
        <div class="cookie-category" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(15, 98, 254, 0.05); border-radius: 8px; border: 1px solid #2a2d3e;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #ffffff;">🔒 Cookies essentiels</strong>
            <span style="color: #10b981; font-size: 0.85rem; font-weight: 600;">Toujours actifs</span>
          </div>
          <p style="color: #b8b8b8; font-size: 0.9rem; margin: 0;">
            Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.
          </p>
        </div>
        
        <div class="cookie-category" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(15, 98, 254, 0.05); border-radius: 8px; border: 1px solid #2a2d3e;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #ffffff;">📊 Cookies de performance</strong>
            <label class="cookie-toggle">
              <input type="checkbox" id="performance-cookies" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="color: #b8b8b8; font-size: 0.9rem; margin: 0;">
            Ces cookies nous aident à comprendre comment vous utilisez le site pour l'améliorer.
          </p>
        </div>
        
        <div class="cookie-category" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(15, 98, 254, 0.05); border-radius: 8px; border: 1px solid #2a2d3e;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #ffffff;">⚙️ Cookies fonctionnels</strong>
            <label class="cookie-toggle">
              <input type="checkbox" id="functional-cookies" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p style="color: #b8b8b8; font-size: 0.9rem; margin: 0;">
            Ces cookies permettent de mémoriser vos préférences (territoire, langue, etc.).
          </p>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button class="cookie-btn cookie-btn-accept" id="save-preferences" style="flex: 1;">
            ✓ Enregistrer mes choix
          </button>
          <button class="cookie-btn cookie-btn-decline" id="cancel-settings">
            Annuler
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 50);
    
    // Event listeners
    document.getElementById('save-preferences')?.addEventListener('click', () => {
      const analytics = document.getElementById('performance-cookies')?.checked || false;
      const functional = document.getElementById('functional-cookies')?.checked || false;
      
      this.setConsent(analytics || functional ? 'accepted' : 'declined');
      this.setPreferences({ analytics, functional });
      
      this.hideModal(modal);
      this.hideBanner(banner);
      
      if (analytics) {
        this.loadAnalytics();
      }
    });
    
    document.getElementById('cancel-settings')?.addEventListener('click', () => {
      this.hideModal(modal);
    });
    
    modal.querySelector('.cookie-settings-overlay')?.addEventListener('click', () => {
      this.hideModal(modal);
    });
  }
  
  hideModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
  
  setPreferences(prefs) {
    localStorage.setItem('cookie-preferences', JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString()
    }));
  }
  
  getPreferences() {
    try {
      const prefs = localStorage.getItem('cookie-preferences');
      return prefs ? JSON.parse(prefs) : null;
    } catch {
      return null;
    }

  hideBanner(banner) {
    banner.classList.remove('show');
    setTimeout(() => {
      banner.remove();
    }, 300);
  }

  setConsent(value) {
    const date = new Date();
    date.setTime(date.getTime() + (this.consentExpiry * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${this.cookieName}=${value};${expires};path=/;SameSite=Strict`;
  }

  getConsent() {
    const name = this.cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  loadAnalytics() {
    // Placeholder for analytics/tracking code
    console.log('Cookie consent accepted - Analytics can be loaded');
    
    // Example: Load Google Analytics, Firebase Analytics, etc.
    // if (typeof gtag !== 'undefined') {
    //   gtag('consent', 'update', {
    //     'analytics_storage': 'granted'
    //   });
    // }
  }

  // Public method to check if analytics should be loaded
  static hasConsent() {
    const name = 'akiprisaye-cookie-consent=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length) === 'accepted';
      }
    }
    return false;
  }
}

// Initialize cookie consent when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CookieConsent();
  });
} else {
  new CookieConsent();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieConsent;
}
