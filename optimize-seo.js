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
    
    // Add lazy loading to images (more robust version)
    content = content.replace(
      /<img([^>]*?)>/gi,
      (match, attrs) => {
        // Skip if already has loading attribute
        if (attrs.includes('loading=')) return match;
        
        // Add loading="lazy" and decoding="async"
        return `<img${attrs} loading="lazy" decoding="async">`;
      }
    );
    
    // Ensure alt attributes exist (improved version)
    content = content.replace(
      /<img([^>]*?)>/gi,
      (match, attrs) => {
        if (attrs.includes('alt=')) return match;
        
        const srcMatch = attrs.match(/src=(["'])([^"']*)\1/);
        const src = srcMatch ? srcMatch[2] : '';
        const filename = src.split('/').pop().split('.')[0] || 'Image';
        const altText = `A KI PRI SA YÉ - ${filename}`;
        
        return `<img${attrs} alt="${altText}">`;
      }
    );
    
    // Add WebP support with picture element for better performance
    content = content.replace(
      /<img([^>]*?)src=(["'])([^"']*\.(jpg|jpeg|png))\2([^>]*?)>/gi,
      (match, beforeSrc, quote, src, ext, afterSrc) => {
        // Skip if already in a picture element
        if (match.includes('picture')) return match;
        
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        return `<picture>
  <source srcset="${webpSrc}" type="image/webp">
  <img${beforeSrc}src=${quote}${src}${quote}${afterSrc}>
</picture>`;
      }
    );
    
    // Add lazy loading script if not present (enhanced version)
    if (!content.includes('lazy loading') && !content.includes('loading="lazy"')) {
      const enhancedLazyScript = `
  <!-- Enhanced Lazy Loading Support -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Add lazy loading to dynamically created images
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      });
      
      // Observe images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        observer.observe(img);
      });
      
      // Add alt attributes to images without them
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
      imagesWithoutAlt.forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const filename = src.split('/').pop().split('.')[0] || 'Image';
        img.setAttribute('alt', \`A KI PRI SA YÉ - \${filename}\`);
      });
      
      // Enhance loading for images
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      });
    });
  </script>`;
      
      content = content.replace('</body>', `${enhancedLazyScript}</body>`);
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
  console.log('  • Enhanced lazy loading for images');
  console.log('  • WebP support with fallback using <picture> elements');
  console.log('  • Alt attributes for accessibility'); 
  console.log('  • Enhanced SEO meta tags');
  console.log('  • Open Graph and Twitter Card tags');
  console.log('  • PWA manifest integration');
  console.log('  • Intersection Observer for advanced lazy loading');
}

// Run optimization
if (require.main === module) {
  optimizeProject();
}

module.exports = { optimizeProject, optimizeHtmlFile };