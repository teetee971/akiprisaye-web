/**
 * Image optimization and WebP conversion utility
 * A KI PRI SA YÉ - Performance optimization
 */

class ImageOptimizer {
  constructor() {
    this.supportsWebP = false;
    this.lazyImages = [];
    this.imageObserver = null;
    
    this.detectWebPSupport();
    this.initLazyLoading();
    this.optimizeExistingImages();
  }
  
  /**
   * Détecter le support WebP
   */
  async detectWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        this.supportsWebP = (webP.height === 2);
        console.log('WebP support:', this.supportsWebP);
        resolve(this.supportsWebP);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
  
  /**
   * Initialiser le lazy loading intelligent
   */
  initLazyLoading() {
    // Configuration de l'Intersection Observer
    const config = {
      rootMargin: '50px 0px',
      threshold: 0.01
    };
    
    // Créer l'observer
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.imageObserver.unobserve(entry.target);
        }
      });
    }, config);
    
    // Observer toutes les images lazy
    this.observeImages();
  }
  
  /**
   * Observer les images pour le lazy loading
   */
  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]:not([src])');
    
    lazyImages.forEach(img => {
      this.imageObserver.observe(img);
    });
    
    // Écouter les nouvelles images ajoutées dynamiquement
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'IMG') {
            this.processNewImage(node);
          } else if (node.querySelectorAll) {
            const newImages = node.querySelectorAll('img');
            newImages.forEach(img => this.processNewImage(img));
          }
        });
      });
    });
    
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Traiter une nouvelle image
   */
  processNewImage(img) {
    // Ajouter les attributs nécessaires
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
    
    // Ajouter alt si manquant
    if (!img.hasAttribute('alt')) {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      const filename = src.split('/').pop().split('.')[0] || 'Image';
      img.setAttribute('alt', `Image: ${filename}`);
    }
    
    // Observer pour lazy loading si nécessaire
    if (img.hasAttribute('data-src') || !img.hasAttribute('src')) {
      this.imageObserver.observe(img);
    }
    
    // Optimiser pour WebP si supporté
    this.optimizeImageForWebP(img);
  }
  
  /**
   * Charger une image lazy
   */
  loadImage(img) {
    // Vérifier si l'image a un data-src
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) {
      img.setAttribute('src', dataSrc);
      img.removeAttribute('data-src');
    }
    
    // Ajouter les classes pour l'animation
    img.classList.add('lazy-loading');
    
    // Quand l'image est chargée
    img.onload = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
    };
    
    // En cas d'erreur
    img.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      console.warn('Erreur chargement image:', img.src);
    };
  }
  
  /**
   * Optimiser toutes les images existantes
   */
  optimizeExistingImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => this.processNewImage(img));
  }
  
  /**
   * Optimiser une image pour WebP
   */
  optimizeImageForWebP(img) {
    if (!this.supportsWebP) return;
    
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (!src) return;
    
    // Vérifier si l'image n'est pas déjà en WebP
    if (src.endsWith('.webp')) return;
    
    // Créer la version WebP
    const webpSrc = this.getWebPVersion(src);
    
    // Tester si la version WebP existe
    this.testImageExists(webpSrc).then(exists => {
      if (exists) {
        if (img.hasAttribute('data-src')) {
          img.setAttribute('data-src', webpSrc);
        } else {
          img.setAttribute('src', webpSrc);
        }
      }
    });
  }
  
  /**
   * Obtenir la version WebP d'une image
   */
  getWebPVersion(src) {
    // Remplacer l'extension par .webp
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  /**
   * Tester si une image existe
   */
  testImageExists(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
  
  /**
   * Créer un placeholder responsive
   */
  createPlaceholder(width, height, color = '#1a2330') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Ajouter un icône
    ctx.fillStyle = '#9fb0c0';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', width / 2, height / 2 + 8);
    
    return canvas.toDataURL();
  }
  
  /**
   * Compresser une image (pour les uploads futurs)
   */
  async compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Redimensionner sur le canvas
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Obtenir les statistiques d'optimisation
   */
  getOptimizationStats() {
    const images = document.querySelectorAll('img');
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const webpImages = document.querySelectorAll('img[src$=".webp"]');
    const imagesWithAlt = document.querySelectorAll('img[alt]');
    
    return {
      total: images.length,
      lazy: lazyImages.length,
      webp: webpImages.length,
      withAlt: imagesWithAlt.length,
      optimizationRate: ((lazyImages.length + webpImages.length + imagesWithAlt.length) / (images.length * 3) * 100).toFixed(1)
    };
  }
}

// Styles CSS pour les animations de lazy loading
const lazyLoadingStyles = `
  <style>
    img[loading="lazy"] {
      transition: opacity 0.3s ease;
    }
    
    img.lazy-loading {
      opacity: 0.6;
      background: linear-gradient(90deg, #1a2330 25%, #121923 50%, #1a2330 75%);
      background-size: 200% 100%;
      animation: lazy-skeleton 1.5s infinite;
    }
    
    img.lazy-loaded {
      opacity: 1;
    }
    
    img.lazy-error {
      opacity: 0.3;
      background: #ff5d5d;
    }
    
    @keyframes lazy-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Responsive images */
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* Picture element support */
    picture {
      display: block;
    }
    
    picture img {
      width: 100%;
      height: auto;
    }
  </style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', lazyLoadingStyles);

// Initialiser l'optimiseur d'images
let imageOptimizer;

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    imageOptimizer = new ImageOptimizer();
  });
} else {
  imageOptimizer = new ImageOptimizer();
}

// Exporter pour utilisation globale
window.ImageOptimizer = ImageOptimizer;
window.imageOptimizer = imageOptimizer;

// Utilitaires pour la conversion WebP
window.convertToWebP = async function(file) {
  if (!imageOptimizer) return file;
  
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/webp', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

console.log('🖼️ Image Optimizer initialized');