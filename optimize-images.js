#!/usr/bin/env node

/**
 * Image Optimization Script for A KI PRI SA YÉ
 * Optimizes images with lazy loading and prepares WebP alternatives
 */

const fs = require('fs');
const path = require('path');

// Configuration
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
const webpExtensions = ['.webp'];
const maxFileSize = 500 * 1024; // 500KB

// Function to check if file is an image
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext) || webpExtensions.includes(ext);
}

// Function to analyze image files
function analyzeImages(dir) {
  const results = {
    total: 0,
    large: [],
    needsWebp: [],
    totalSize: 0
  };

  function scanDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (isImageFile(file)) {
          results.total++;
          results.totalSize += stat.size;
          
          // Check if image is large
          if (stat.size > maxFileSize) {
            results.large.push({
              path: filePath,
              size: stat.size,
              sizeKB: Math.round(stat.size / 1024)
            });
          }
          
          // Check if needs WebP version
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            const webpPath = filePath.replace(ext, '.webp');
            if (!fs.existsSync(webpPath)) {
              results.needsWebp.push({
                original: filePath,
                webp: webpPath,
                size: stat.size
              });
            }
          }
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}:`, error.message);
    }
  }

  scanDirectory(dir);
  return results;
}

// Function to optimize HTML files for image lazy loading
function optimizeHtmlForImages(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add loading="lazy" to images that don't have it
    content = content.replace(
      /<img([^>]*?)(?:\s+loading=(["'][^"']*["']))?([^>]*?)>/gi,
      (match, before, loadingAttr, after) => {
        if (loadingAttr) return match; // Already has loading attribute
        modified = true;
        return `<img${before} loading="lazy" decoding="async"${after}>`;
      }
    );
    
    // Add alt attributes to images without them
    content = content.replace(
      /<img([^>]*?)>/gi,
      (match, attrs) => {
        if (attrs.includes('alt=')) return match; // Already has alt
        
        // Extract src for generating alt text
        const srcMatch = attrs.match(/src=(["'])([^"']*)\1/);
        const src = srcMatch ? srcMatch[2] : '';
        const filename = src.split('/').pop().split('.')[0] || 'Image';
        const altText = `A KI PRI SA YÉ - ${filename}`;
        
        modified = true;
        return `<img${attrs} alt="${altText}">`;
      }
    );
    
    // Add WebP support with fallback
    content = content.replace(
      /<img([^>]*?)src=(["'])([^"']*\.(jpg|jpeg|png))\2([^>]*?)>/gi,
      (match, beforeSrc, quote, src, ext, afterSrc) => {
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        modified = true;
        
        return `<picture>
  <source srcset="${webpSrc}" type="image/webp">
  <img${beforeSrc}src=${quote}${src}${quote}${afterSrc}>
</picture>`;
      }
    );
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Optimized images in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error optimizing ${filePath}:`, error.message);
    return false;
  }
}

// Function to create WebP conversion instructions
function createWebPInstructions(needsWebp) {
  if (needsWebp.length === 0) return;
  
  const instructions = [
    '#!/bin/bash',
    '# WebP Conversion Script',
    '# Install webp tools first: sudo apt-get install webp',
    '',
    'echo "Converting images to WebP format..."',
    ''
  ];
  
  needsWebp.forEach(({ original, webp }) => {
    const quality = original.includes('og-cover') ? '85' : '80';
    instructions.push(`cwebp -q ${quality} "${original}" -o "${webp}"`);
  });
  
  instructions.push('', 'echo "WebP conversion completed!"');
  
  fs.writeFileSync(
    path.join(__dirname, 'convert-to-webp.sh'),
    instructions.join('\n')
  );
  
  // Make script executable
  try {
    fs.chmodSync(path.join(__dirname, 'convert-to-webp.sh'), 0o755);
  } catch (error) {
    console.warn('Could not make script executable:', error.message);
  }
  
  console.log('📝 Created convert-to-webp.sh script for WebP conversion');
}

// Main optimization function
function optimizeImages() {
  console.log('🖼️  Starting image optimization...\n');
  
  // Analyze current images
  const publicDir = path.join(__dirname, 'public');
  const rootDir = __dirname;
  
  console.log('📊 Analyzing images...');
  const publicResults = fs.existsSync(publicDir) ? analyzeImages(publicDir) : { total: 0, large: [], needsWebp: [], totalSize: 0 };
  const rootResults = analyzeImages(rootDir);
  
  // Combine results
  const totalImages = publicResults.total + rootResults.total;
  const largeImages = [...publicResults.large, ...rootResults.large];
  const needsWebp = [...publicResults.needsWebp, ...rootResults.needsWebp];
  const totalSize = publicResults.totalSize + rootResults.totalSize;
  
  console.log(`  📸 Found ${totalImages} images (${Math.round(totalSize / 1024 / 1024 * 100) / 100} MB total)`);
  console.log(`  ⚠️  ${largeImages.length} large images (>${Math.round(maxFileSize / 1024)}KB)`);
  console.log(`  🔄 ${needsWebp.length} images need WebP versions\n`);
  
  // Show large images
  if (largeImages.length > 0) {
    console.log('🔍 Large images that should be optimized:');
    largeImages.forEach(img => {
      console.log(`  • ${path.relative(__dirname, img.path)} (${img.sizeKB}KB)`);
    });
    console.log('');
  }
  
  // Optimize HTML files
  console.log('🔧 Optimizing HTML files for lazy loading...');
  let optimizedFiles = 0;
  
  // Optimize root HTML files
  const rootHtmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
  rootHtmlFiles.forEach(file => {
    if (optimizeHtmlForImages(path.join(__dirname, file))) {
      optimizedFiles++;
    }
  });
  
  // Optimize public HTML files
  if (fs.existsSync(publicDir)) {
    const publicHtmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));
    publicHtmlFiles.forEach(file => {
      if (optimizeHtmlForImages(path.join(publicDir, file))) {
        optimizedFiles++;
      }
    });
  }
  
  console.log(`  ✓ Optimized ${optimizedFiles} HTML files\n`);
  
  // Create WebP conversion script
  if (needsWebp.length > 0) {
    createWebPInstructions(needsWebp);
  }
  
  console.log('✅ Image optimization completed!\n');
  console.log('📋 Optimizations applied:');
  console.log('  • Added lazy loading to all images');
  console.log('  • Added decoding="async" for better performance');
  console.log('  • Generated alt attributes for accessibility');
  console.log('  • Added WebP support with fallback');
  console.log('  • Created WebP conversion script (if needed)');
  
  if (largeImages.length > 0) {
    console.log(`\n⚠️  Recommendation: Optimize ${largeImages.length} large images manually`);
  }
}

// Run if called directly
if (require.main === module) {
  optimizeImages();
}

module.exports = { optimizeImages, analyzeImages, optimizeHtmlForImages };