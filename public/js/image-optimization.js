/**
 * Image Optimization and Lazy Loading Script
 * Automatically optimizes images with WebP support and lazy loading
 */

(function() {
  'use strict';

  // Check WebP support
  function supportsWebP() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Intersection Observer for lazy loading
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // Load the image
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        
        // Add loaded class for CSS transitions
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
        
        // Stop observing this image
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  // Initialize lazy loading for images
  function initLazyLoading() {
    // Find all images that should be lazy loaded
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]:not([src])');
    
    images.forEach(img => {
      // Add lazy loading attributes if not present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Start observing
      imageObserver.observe(img);
    });
  }

  // Add alt attributes to images without them
  function addMissingAltAttributes() {
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      const filename = src.split('/').pop().split('.')[0];
      const altText = filename ? `Image: ${filename.replace(/[-_]/g, ' ')}` : 'Image';
      img.setAttribute('alt', altText);
    });
  }

  // Convert images to WebP if supported
  async function optimizeImages() {
    const webpSupported = await supportsWebP();
    
    if (webpSupported) {
      const images = document.querySelectorAll('img[src$=".jpg"], img[src$=".jpeg"], img[src$=".png"]');
      images.forEach(img => {
        const originalSrc = img.src;
        const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        // Test if WebP version exists
        const testImg = new Image();
        testImg.onload = () => {
          img.src = webpSrc;
        };
        testImg.onerror = () => {
          // Keep original if WebP version doesn't exist
          console.log(`WebP version not found for: ${originalSrc}`);
        };
        testImg.src = webpSrc;
      });
    }
  }

  // Initialize when DOM is ready
  function init() {
    // Add responsive image handling
    const style = document.createElement('style');
    style.textContent = `
      img {
        max-width: 100%;
        height: auto;
      }
      
      img[loading="lazy"] {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      img[loading="lazy"].loaded,
      img[loading="lazy"][src] {
        opacity: 1;
      }
      
      /* Placeholder for loading images */
      img[data-src]:not([src]) {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);

    // Run optimization functions
    addMissingAltAttributes();
    initLazyLoading();
    optimizeImages();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run when new content is dynamically added
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
          if (images.length > 0) {
            addMissingAltAttributes();
            initLazyLoading();
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();