/**
 * Améliore l'accessibilité en ajoutant des attributs alt significatifs
 * et en configurant le lazy loading pour les images
 */

function enhanceImageAccessibility() {
  // Add lazy loading to images that don't have it
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    if (img.getBoundingClientRect().top > window.innerHeight * 2) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }
  });
  
  // Add meaningful alt attributes to images without them
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  imagesWithoutAlt.forEach(img => {
    const src = img.getAttribute('src') || '';
    const filename = src.split('/').pop().split('.')[0];
    
    // Generate more meaningful alt text based on context
    let altText = '';
    
    // Check if it's a logo
    if (img.className && img.className.includes('logo')) {
      altText = `Logo de ${filename}`;
    }
    // Check if it's in a product context
    else if (src.includes('/products/') || src.includes('/items/')) {
      altText = `Image du produit ${filename}`;
    }
    // Check if it's a user avatar or profile image
    else if (src.includes('/avatars/') || src.includes('/users/')) {
      altText = `Photo de profil de ${filename}`;
    }
    // Check if it's a territory flag or icon
    else if (src.includes('/flags/') || filename.toLowerCase().includes('flag')) {
      altText = `Drapeau ou icône de ${filename}`;
    }
    // Check if it's an icon or symbol
    else if (src.includes('/icons/') || filename.toLowerCase().includes('icon')) {
      altText = `Icône ${filename}`;
    }
    // Check for common image types
    else if (filename.toLowerCase().includes('banner') || filename.toLowerCase().includes('hero')) {
      altText = `Image bannière ${filename}`;
    }
    // Default descriptive text
    else {
      altText = `Illustration : ${filename}`;
    }
    
    img.setAttribute('alt', altText);
  });
}

// Enhanced keyboard navigation support
function enhanceKeyboardNavigation() {
  // Add skip-to-content link if it doesn't exist
  if (!document.querySelector('.skip-to-content')) {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-to-content';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Aller au contenu principal';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--accent, #26d1ff);
      color: var(--bg, #0b1220);
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      font-weight: bold;
      transition: top 0.2s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  // Ensure main content area has proper id
  const main = document.querySelector('main') || document.querySelector('.container');
  if (main && !main.id) {
    main.id = 'main-content';
  }
}

// Initialize accessibility enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  enhanceImageAccessibility();
  enhanceKeyboardNavigation();
});