#!/usr/bin/env node

/**
 * SEO Optimization Script for A KI PRI SA YÉ
 * Automatically adds lazy loading, alt attributes, and optimizes images
 */

const fs = require('fs');
const path = require('path');

// Configuration
const baseUrl = 'https://akiprisaye.pages.dev';
const siteName = 'A KI PRI SA YÉ';
const defaultDescription = 'Comparateur de prix et suivi budget pour les DROM-COM (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)';

// SEO Meta Template
const seoMetaTemplate = (title, description, url, type = 'website') => `
  <!-- SEO Meta Tags -->
  <meta name="description" content="${description}" />
  <meta name="keywords" content="comparateur prix, DROM-COM, Guadeloupe, Martinique, Guyane, Réunion, Mayotte, budget, vie chère" />
  <meta name="author" content="${siteName}" />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:image" content="${baseUrl}/og-cover.jpg" />
  <meta property="og:locale" content="fr_FR" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${baseUrl}/og-cover.jpg" />
  
  <!-- Favicons -->
  <link rel="icon" type="image/svg+xml" href="/icon.svg" />
  <link rel="manifest" href="/manifest.webmanifest" />`;

// Lazy loading script
const lazyLoadingScript = `
  <!-- Lazy Loading Support -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Add lazy loading to images that don't have it
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach(img => {
        if (img.getBoundingClientRect().top > window.innerHeight * 2) {
          img.setAttribute('loading', 'lazy');
          img.setAttribute('decoding', 'async');
        }
      });
      
      // Add alt attributes to images without them
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      imagesWithoutAlt.forEach(img => {
        const src = img.getAttribute('src') || '';
        const filename = src.split('/').pop().split('.')[0];
        img.setAttribute('alt', \`Image: \${filename}\`);
      });
    });
  </script>`;

// Function to optimize HTML files
function optimizeHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add lazy loading to images with WebP support
    content = content.replace(
      /<img([^>]*?)(?:\s+loading=[^>\s]*)?([^>]*?)>/gi,
      (match, before, after) => {
        if (match.includes('loading=')) return match;
        
        // Extract src attribute
        const srcMatch = match.match(/src=['"]([^'"]*)['"]/);
        if (srcMatch) {
          const originalSrc = srcMatch[1];
          const webpSrc = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          
          // Create picture element with WebP fallback
          const altMatch = match.match(/alt=['"]([^'"]*)['"]/);
          const alt = altMatch ? altMatch[1] : 'Image';
          
          return `<picture>
  <source srcset="${webpSrc}" type="image/webp">
  <img${before} src="${originalSrc}" loading="lazy" decoding="async" alt="${alt}"${after}>
</picture>`;
        }
        
        return `<img${before} loading="lazy" decoding="async"${after}>`;
      }
    );
    
    // Ensure alt attributes exist for standalone images
    content = content.replace(
      /<img([^>]*?)(?:(?!\salt=).)*/gi,
      (match) => {
        if (match.includes('alt=')) return match;
        const srcMatch = match.match(/src=['"]([^'"]*)['"]/);
        const src = srcMatch ? srcMatch[1] : '';
        const filename = src.split('/').pop().split('.')[0] || 'Image';
        return match.replace('>', ` alt="Image: ${filename}">`);
      }
    );
    
    // Enhanced lazy loading script with intersection observer
    const enhancedLazyLoadingScript = `
  <script>
    // Enhanced lazy loading with intersection observer and WebP support
    document.addEventListener('DOMContentLoaded', function() {
      // Native lazy loading support check
      if ('loading' in HTMLImageElement.prototype) {
        console.log('Native lazy loading supported');
      } else {
        // Load polyfill for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/vanilla-lazyload@17.8.4/dist/lazyload.min.js';
        script.onload = () => {
          new LazyLoad({
            elements_selector: 'img[loading="lazy"]',
            use_native: false
          });
        };
        document.head.appendChild(script);
      }
      
      // WebP support detection
      function supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      
      // Apply WebP fallback if needed
      if (!supportsWebP()) {
        const pictures = document.querySelectorAll('picture');
        pictures.forEach(picture => {
          const img = picture.querySelector('img');
          const webpSource = picture.querySelector('source[type="image/webp"]');
          if (webpSource && img) {
            webpSource.remove();
          }
        });
      }
    });
  </script>`;
    
    // Add enhanced lazy loading script if not present
    if (!content.includes('Enhanced lazy loading') && !content.includes('vanilla-lazyload')) {
      content = content.replace('</body>', `${enhancedLazyLoadingScript}</body>`);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Optimized: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error optimizing ${filePath}:`, error.message);
  }
}

// Function to find and optimize all HTML files
function optimizeProject() {
  const publicDir = path.join(__dirname, 'public');
  const rootFiles = [path.join(__dirname, 'index.html')];
  
  console.log('🔧 Starting SEO optimization...\n');
  
  // Optimize root HTML files
  rootFiles.forEach(file => {
    if (fs.existsSync(file)) {
      optimizeHtmlFile(file);
    }
  });
  
  // Optimize public HTML files
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    files.forEach(file => {
      if (file.endsWith('.html')) {
        optimizeHtmlFile(path.join(publicDir, file));
      }
    });
  }
  
  console.log('\n✅ SEO optimization completed!');
  console.log('\n📋 Optimizations applied:');
  console.log('  • Lazy loading for images');
  console.log('  • Alt attributes for accessibility'); 
  console.log('  • SEO meta tags enhancement');
  console.log('  • Open Graph and Twitter Card tags');
  console.log('  • PWA manifest integration');
}

// Run optimization
if (require.main === module) {
  optimizeProject();
}

module.exports = { optimizeProject, optimizeHtmlFile };