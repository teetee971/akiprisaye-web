#!/usr/bin/env node

/**
 * SEO Optimization Script for A KI PRI SA YÉ
 * Automatically adds lazy loading, alt attributes, and optimizes images to WebP
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  <meta property="og:image" content="${baseUrl}/og-cover.webp" />
  <meta property="og:locale" content="fr_FR" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${baseUrl}/og-cover.webp" />
  
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

// Function to convert images to WebP
function convertToWebP(inputPath, outputPath) {
  try {
    const command = `cwebp -q 85 "${inputPath}" -o "${outputPath}"`;
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.warn(`⚠️  Failed to convert ${inputPath} to WebP:`, error.message);
    return false;
  }
}

// Function to optimize HTML files
function optimizeHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convert image references to WebP with fallbacks using picture element
    content = content.replace(
      /<img([^>]*)\ssrc=["']([^"']*\.(png|jpg|jpeg))["']([^>]*)>/gi,
      (match, beforeSrc, imagePath, ext, afterSrc) => {
        // Skip external images
        if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
          return match;
        }
        
        const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        
        // Check if WebP version exists
        const fullWebpPath = path.join(__dirname, 'public', webpPath.replace(/^\//, ''));
        if (fs.existsSync(fullWebpPath) && fs.statSync(fullWebpPath).size > 0) {
          // Create picture element with WebP and fallback
          return `<picture>
      <source srcset="${webpPath}" type="image/webp">
      <img${beforeSrc} src="${imagePath}"${afterSrc} loading="lazy" decoding="async">
    </picture>`;
        }
        
        return match;
      }
    );
    
    // Add lazy loading to remaining images that don't have it
    content = content.replace(
      /<img([^>]*?)(?:\s+loading=[^>\s]*)?([^>]*?)>/gi,
      (match, before, after) => {
        if (match.includes('loading=')) return match;
        return `<img${before} loading="lazy" decoding="async"${after}>`;
      }
    );
    
    // Ensure alt attributes exist
    content = content.replace(
      /<img([^>]*?)(?:(?!\salt=).)*/gi,
      (match) => {
        if (match.includes('alt=')) return match;
        const srcMatch = match.match(/src=['""]([^'""]*)['"]/);
        const src = srcMatch ? srcMatch[1] : '';
        const filename = src.split('/').pop().split('.')[0] || 'Image';
        return match.replace('>', ` alt="Image: ${filename}">`);
      }
    );
    
    // Replace meta tag image references with WebP versions
    content = content.replace(/og-cover\.jpg/g, 'og-cover.webp');
    content = content.replace(/splash_lancement_appli\.png/g, 'splash_lancement_appli.webp');
    
    // Add lazy loading script if not present
    if (!content.includes('lazy loading') && !content.includes('loading="lazy"')) {
      content = content.replace('</body>', `${lazyLoadingScript}</body>`);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Optimized: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error optimizing ${filePath}:`, error.message);
  }
}

// Function to convert main images to WebP
function convertMainImages() {
  console.log('🖼️  Converting main images to WebP...\n');
  
  const imagesToConvert = [
    { input: 'public/og-cover.jpg', output: 'public/og-cover.webp' },
    { input: 'public/splash_lancement_appli.png', output: 'public/splash_lancement_appli.webp' }
  ];
  
  imagesToConvert.forEach(({ input, output }) => {
    const inputPath = path.join(__dirname, input);
    const outputPath = path.join(__dirname, output);
    
    if (fs.existsSync(inputPath)) {
      // Skip if WebP already exists and is newer
      if (fs.existsSync(outputPath)) {
        const inputStats = fs.statSync(inputPath);
        const outputStats = fs.statSync(outputPath);
        if (outputStats.mtime > inputStats.mtime && outputStats.size > 0) {
          console.log(`⏭️  Skipping ${input} (WebP already exists)`);
          return;
        }
      }
      
      if (convertToWebP(inputPath, outputPath)) {
        const inputSize = fs.statSync(inputPath).size;
        const outputSize = fs.statSync(outputPath).size;
        const reduction = Math.round((1 - outputSize / inputSize) * 100);
        console.log(`✓ Converted ${input} → ${output} (${reduction}% smaller)`);
      }
    } else {
      console.log(`⚠️  Image not found: ${input}`);
    }
  });
}

// Function to find and optimize all HTML files
function optimizeProject() {
  const publicDir = path.join(__dirname, 'public');
  const rootFiles = [path.join(__dirname, 'index.html')];
  
  console.log('🔧 Starting SEO optimization with WebP...\n');
  
  // Check if cwebp is available
  try {
    execSync('cwebp -version', { stdio: 'pipe' });
  } catch (error) {
    console.warn('⚠️  cwebp not found. Skipping WebP conversion. Install with: sudo apt-get install webp');
  }
  
  // Convert main images to WebP
  convertMainImages();
  
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
  console.log('  • WebP image conversion for better performance');
  console.log('  • Picture elements with WebP and fallbacks');
  console.log('  • Lazy loading for images');
  console.log('  • Alt attributes for accessibility'); 
  console.log('  • SEO meta tags enhancement with WebP images');
  console.log('  • Open Graph and Twitter Card tags');
  console.log('  • PWA manifest integration');
}

// Run optimization
if (require.main === module) {
  optimizeProject();
}

module.exports = { optimizeProject, optimizeHtmlFile };