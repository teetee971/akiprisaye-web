/**
 * Système de validation et protection des formulaires pour A KI PRI SA YÉ
 * Inclut CSRF protection, validation côté client, et sanitisation
 */

class FormProtection {
  constructor() {
    this.csrfToken = this.generateCSRFToken();
    this.rateLimiter = new Map();
    this.bannedIPs = new Set();
    this.init();
  }

  init() {
    this.injectCSRFTokens();
    this.attachFormValidators();
    this.setupRateLimiting();
    this.protectAgainstBots();
  }

  /**
   * Générer un token CSRF unique
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Injecter les tokens CSRF dans tous les formulaires
   */
  injectCSRFTokens() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Ne pas ajouter CSRF aux formulaires de recherche simple
      if (form.method.toLowerCase() === 'get' || 
          form.classList.contains('no-csrf')) {
        return;
      }

      let csrfInput = form.querySelector('input[name="csrf_token"]');
      if (!csrfInput) {
        csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        form.appendChild(csrfInput);
      }
      csrfInput.value = this.csrfToken;
    });
  }

  /**
   * Attacher les validateurs aux formulaires
   */
  attachFormValidators() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => this.validateForm(e, form));
      
      // Validation en temps réel
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    });
  }

  /**
   * Valider un formulaire complet
   */
  validateForm(event, form) {
    // Vérifier le rate limiting
    if (!this.checkRateLimit()) {
      event.preventDefault();
      this.showError(form, 'Trop de tentatives. Veuillez patienter.');
      return false;
    }

    let isValid = true;
    const errors = [];

    // Valider tous les champs
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    // Validation spécifique par type de formulaire
    const formType = form.dataset.type || this.detectFormType(form);
    switch (formType) {
      case 'contact':
        if (!this.validateContactForm(form)) isValid = false;
        break;
      case 'login':
        if (!this.validateLoginForm(form)) isValid = false;
        break;
      case 'search':
        if (!this.validateSearchForm(form)) isValid = false;
        break;
      case 'report':
        if (!this.validateReportForm(form)) isValid = false;
        break;
    }

    // Vérifier le honeypot (anti-bot)
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value !== '') {
      event.preventDefault();
      this.logSuspiciousActivity('Honeypot triggered');
      return false;
    }

    // Vérifier le timestamp (protection contre les soumissions trop rapides)
    const timestamp = form.querySelector('input[name="form_timestamp"]');
    if (timestamp) {
      const timeDiff = Date.now() - parseInt(timestamp.value);
      if (timeDiff < 3000) { // Moins de 3 secondes
        event.preventDefault();
        this.showError(form, 'Formulaire soumis trop rapidement.');
        return false;
      }
    }

    if (!isValid) {
      event.preventDefault();
      this.focusFirstError(form);
    }

    return isValid;
  }

  /**
   * Valider un champ individuel
   */
  validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const isRequired = input.hasAttribute('required');
    let isValid = true;
    let errorMessage = '';

    // Validation des champs requis
    if (isRequired && !value) {
      errorMessage = 'Ce champ est obligatoire';
      isValid = false;
    }

    // Validation par type
    if (value && isValid) {
      switch (type) {
        case 'email':
          if (!this.isValidEmail(value)) {
            errorMessage = 'Adresse email invalide';
            isValid = false;
          }
          break;
        case 'tel':
          if (!this.isValidPhone(value)) {
            errorMessage = 'Numéro de téléphone invalide';
            isValid = false;
          }
          break;
        case 'url':
          if (!this.isValidURL(value)) {
            errorMessage = 'URL invalide';
            isValid = false;
          }
          break;
        case 'password':
          if (!this.isValidPassword(value)) {
            errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
            isValid = false;
          }
          break;
      }

      // Validation par pattern personnalisé
      const pattern = input.dataset.pattern;
      if (pattern && !new RegExp(pattern).test(value)) {
        errorMessage = input.dataset.patternMessage || 'Format invalide';
        isValid = false;
      }

      // Validation de longueur
      const minLength = input.dataset.minLength || input.minLength;
      const maxLength = input.dataset.maxLength || input.maxLength;
      
      if (minLength && value.length < minLength) {
        errorMessage = `Minimum ${minLength} caractères requis`;
        isValid = false;
      }
      
      if (maxLength && value.length > maxLength) {
        errorMessage = `Maximum ${maxLength} caractères autorisés`;
        isValid = false;
      }

      // Sanitisation
      if (isValid) {
        input.value = this.sanitizeInput(value, type);
      }
    }

    this.showFieldError(input, isValid ? '' : errorMessage);
    return isValid;
  }

  /**
   * Détection automatique du type de formulaire
   */
  detectFormType(form) {
    const action = form.action.toLowerCase();
    const classes = form.className.toLowerCase();
    
    if (action.includes('contact') || classes.includes('contact')) return 'contact';
    if (action.includes('login') || classes.includes('login')) return 'login';
    if (action.includes('search') || classes.includes('search')) return 'search';
    if (action.includes('report') || classes.includes('report')) return 'report';
    
    return 'generic';
  }

  /**
   * Validation spécifique au formulaire de contact
   */
  validateContactForm(form) {
    const name = form.querySelector('input[name="name"], input[name="nom"]');
    const email = form.querySelector('input[name="email"]');
    const message = form.querySelector('textarea[name="message"]');

    let isValid = true;

    if (name && name.value.length < 2) {
      this.showFieldError(name, 'Le nom doit contenir au moins 2 caractères');
      isValid = false;
    }

    if (message && message.value.length < 10) {
      this.showFieldError(message, 'Le message doit contenir au moins 10 caractères');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validation spécifique au formulaire de connexion
   */
  validateLoginForm(form) {
    const username = form.querySelector('input[name="username"], input[name="email"]');
    const password = form.querySelector('input[name="password"]');

    let isValid = true;

    if (username && username.value.length < 3) {
      this.showFieldError(username, 'Nom d\'utilisateur trop court');
      isValid = false;
    }

    if (password && password.value.length < 6) {
      this.showFieldError(password, 'Mot de passe trop court');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validation spécifique au formulaire de recherche
   */
  validateSearchForm(form) {
    const query = form.querySelector('input[name="q"], input[name="query"], input[name="search"]');
    
    if (query && query.value.length < 2) {
      this.showFieldError(query, 'Recherche trop courte (minimum 2 caractères)');
      return false;
    }

    return true;
  }

  /**
   * Validation spécifique au formulaire de signalement
   */
  validateReportForm(form) {
    const reason = form.querySelector('select[name="reason"]');
    const description = form.querySelector('textarea[name="description"]');

    let isValid = true;

    if (reason && !reason.value) {
      this.showFieldError(reason, 'Veuillez sélectionner un motif');
      isValid = false;
    }

    if (description && description.value.length < 20) {
      this.showFieldError(description, 'Description trop courte (minimum 20 caractères)');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validation d'email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validation de téléphone (format français/DOM-TOM)
   */
  isValidPhone(phone) {
    // Supprime les espaces et tirets
    const cleaned = phone.replace(/[\s\-\.]/g, '');
    // Format français métropolitain ou DOM-TOM
    const phoneRegex = /^(?:(?:\+33|0033|0)[1-9](?:[0-9]{8})|(?:\+590|0590)[0-9]{6})$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Validation d'URL
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validation de mot de passe
   */
  isValidPassword(password) {
    // Au moins 8 caractères, avec au moins une lettre et un chiffre
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Sanitisation des entrées
   */
  sanitizeInput(value, type) {
    // Suppression des caractères dangereux
    let sanitized = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().trim();
        break;
      case 'tel':
        sanitized = sanitized.replace(/[^\d\+\-\s\.]/g, '');
        break;
      case 'text':
      case 'textarea':
        // Échapper les caractères HTML
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
        break;
    }

    return sanitized;
  }

  /**
   * Rate limiting
   */
  setupRateLimiting() {
    // Limite: 10 soumissions par minute par IP
    this.rateLimit = {
      maxRequests: 10,
      timeWindow: 60000, // 1 minute
      cleanupInterval: 300000 // 5 minutes
    };

    // Nettoyage périodique
    setInterval(() => this.cleanupRateLimiter(), this.rateLimit.cleanupInterval);
  }

  checkRateLimit() {
    const clientIP = this.getClientIP();
    const now = Date.now();
    
    if (!this.rateLimiter.has(clientIP)) {
      this.rateLimiter.set(clientIP, []);
    }

    const requests = this.rateLimiter.get(clientIP);
    
    // Supprimer les requêtes anciennes
    const validRequests = requests.filter(time => now - time < this.rateLimit.timeWindow);
    
    if (validRequests.length >= this.rateLimit.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.rateLimiter.set(clientIP, validRequests);
    return true;
  }

  getClientIP() {
    // Simulation d'IP (en production, utiliser le vrai IP côté serveur)
    return localStorage.getItem('client_ip') || 'unknown';
  }

  cleanupRateLimiter() {
    const now = Date.now();
    for (const [ip, requests] of this.rateLimiter.entries()) {
      const validRequests = requests.filter(time => now - time < this.rateLimit.timeWindow);
      if (validRequests.length === 0) {
        this.rateLimiter.delete(ip);
      } else {
        this.rateLimiter.set(ip, validRequests);
      }
    }
  }

  /**
   * Protection contre les bots
   */
  protectAgainstBots() {
    // Ajouter des champs honeypot aux formulaires
    const forms = document.querySelectorAll('form:not(.no-protection)');
    forms.forEach(form => {
      this.addHoneypot(form);
      this.addTimestamp(form);
    });
  }

  addHoneypot(form) {
    if (form.querySelector('input[name="website"]')) return;

    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0;';
    honeypot.setAttribute('tabindex', '-1');
    honeypot.setAttribute('autocomplete', 'off');
    form.appendChild(honeypot);
  }

  addTimestamp(form) {
    if (form.querySelector('input[name="form_timestamp"]')) return;

    const timestamp = document.createElement('input');
    timestamp.type = 'hidden';
    timestamp.name = 'form_timestamp';
    timestamp.value = Date.now().toString();
    form.appendChild(timestamp);
  }

  /**
   * Gestion des erreurs
   */
  showFieldError(input, message) {
    this.clearFieldError(input);

    if (message) {
      input.classList.add('error');
      
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.textContent = message;
      errorEl.style.cssText = `
        color: #dc2626;
        font-size: 12px;
        margin-top: 4px;
        display: block;
      `;

      input.parentNode.appendChild(errorEl);
    } else {
      input.classList.remove('error');
    }
  }

  clearFieldError(input) {
    input.classList.remove('error');
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  showError(form, message) {
    let errorContainer = form.querySelector('.form-error');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'form-error';
      errorContainer.style.cssText = `
        background: #dc2626;
        color: white;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
      `;
      form.insertBefore(errorContainer, form.firstChild);
    }
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }

  focusFirstError(form) {
    const firstError = form.querySelector('.error');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  logSuspiciousActivity(activity) {
    console.warn('Activité suspecte détectée:', activity);
    // En production, envoyer au serveur de sécurité
  }
}

// Initialisation automatique
if (typeof window !== 'undefined') {
  window.FormProtection = FormProtection;
  
  document.addEventListener('DOMContentLoaded', function() {
    new FormProtection();
  });

  // Styles CSS pour les erreurs
  const style = document.createElement('style');
  style.textContent = `
    .error {
      border-color: #dc2626 !important;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
    }
    
    .field-error {
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormProtection;
}