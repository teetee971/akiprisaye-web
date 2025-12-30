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
            En continuant à naviguer, vous acceptez notre 
            <a href="/mentions.html#cookies" target="_blank">politique de cookies</a> et notre
            <a href="/mentions.html#privacy" target="_blank">politique de confidentialité</a>.
          </p>
        </div>
        <div class="cookie-consent-buttons">
          <button class="cookie-btn cookie-btn-accept" id="cookie-accept" aria-label="Accepter les cookies">
            ✓ Accepter
          </button>
          <button class="cookie-btn cookie-btn-decline" id="cookie-decline" aria-label="Refuser les cookies">
            ✗ Refuser
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
      this.hideBanner(banner);
      this.loadAnalytics();
    });
    
    document.getElementById('cookie-decline')?.addEventListener('click', () => {
      this.setConsent('declined');
      this.hideBanner(banner);
    });
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
    const expires = 'expires=' + date.toUTCString();
    document.cookie = `${this.cookieName}=${value};${expires};path=/;SameSite=Strict`;
  }

  getConsent() {
    const name = this.cookieName + '=';
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trimStart();
      if (trimmedCookie.startsWith(name)) {
        return trimmedCookie.substring(name.length);
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
