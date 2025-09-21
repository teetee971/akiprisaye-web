#!/usr/bin/env node

/**
 * Image Optimization Script for A KI PRI SA YÉ
 * Converts images to WebP format for better performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const inputFormats = ['.png', '.jpg', '.jpeg'];
const outputFormat = '.webp';
const quality = 85; // WebP quality (0-100)

// Directories to process
const imageDirectories = [
  'public',
  'public/assets/brands',
  'public/icons',
  'public/img'
];

/**
 * Convert a single image to WebP
 */
function convertToWebP(inputPath, outputPath) {
  try {
    const command = `cwebp -q ${quality} "${inputPath}" -o "${outputPath}"`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
    return false;
  }
}

/**
 * Check if file is a valid image
 */
function isValidImage(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size > 0; // Skip empty files
  } catch {
    return false;
  }
}

/**
 * Process images in a directory
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  console.log(`\n📁 Processing directory: ${dirPath}`);
  
  const files = fs.readdirSync(dirPath);
  let converted = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const fileExt = path.extname(file).toLowerCase();
    
    // Skip if not an image format we want to convert
    if (!inputFormats.includes(fileExt)) return;
    
    // Skip if file is empty or invalid
    if (!isValidImage(filePath)) {
      console.log(`⚠️  Skipping empty/invalid file: ${file}`);
      return;
    }
    
    // Generate WebP output path
    const baseName = path.basename(file, fileExt);
    const outputPath = path.join(dirPath, baseName + outputFormat);
    
    // Skip if WebP version already exists and is newer
    if (fs.existsSync(outputPath)) {
      const inputStats = fs.statSync(filePath);
      const outputStats = fs.statSync(outputPath);
      if (outputStats.mtime > inputStats.mtime && outputStats.size > 0) {
        console.log(`⏭️  Skipping (WebP exists): ${file}`);
        return;
      }
    }
    
    if (convertToWebP(filePath, outputPath)) {
      converted++;
    }
  });
  
  console.log(`📊 Converted ${converted} images in ${dirPath}`);
}

/**
 * Update HTML files to use WebP with fallbacks
 */
function updateHTMLFilesForWebP() {
  console.log('\n🔄 Updating HTML files for WebP usage...');
  
  const publicDir = path.join(__dirname, 'public');
  const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace specific meta tags with WebP versions
    if (content.includes('og-cover.jpg')) {
      content = content.replace(/og-cover\.jpg/g, 'og-cover.webp');
      modified = true;
    }
    
    if (content.includes('splash_lancement_appli.png')) {
      content = content.replace(/splash_lancement_appli\.png/g, 'splash_lancement_appli.webp');
      modified = true;
    }
    
    // Convert simple img tags to picture elements with WebP support
    content = content.replace(
      /<img([^>]*)\ssrc=["']([^"']*\.(png|jpg|jpeg))["']([^>]*)>/gi,
      (match, beforeSrc, imagePath, ext, afterSrc) => {
        // Skip if already has loading or this is not a local image
        if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
          return match;
        }
        
        const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        
        // Create picture element with WebP and fallback
        return `<picture>
  <source srcset="${webpPath}" type="image/webp">
  <img${beforeSrc} src="${imagePath}"${afterSrc}>
</picture>`;
      }
    );
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Updated HTML: ${file}`);
    }
  });
}

/**
 * Main optimization function
 */
function optimizeImages() {
  console.log('🖼️  Starting image optimization to WebP...\n');
  
  // Check if cwebp is available
  try {
    execSync('cwebp -version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ cwebp not found. Please install WebP tools:');
    console.error('   sudo apt-get install webp');
    process.exit(1);
  }
  
  const rootDir = __dirname;
  
  // Process each directory
  imageDirectories.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    processDirectory(fullPath);
  });
  
  // Update HTML files
  updateHTMLFilesForWebP();
  
  console.log('\n✅ Image optimization completed!');
  console.log('\n📋 Summary:');
  console.log('  • Converted images to WebP format');
  console.log('  • Applied 85% quality compression');
  console.log('  • Updated HTML meta tags for WebP');
  console.log('  • Maintained original images as fallbacks');
  console.log('\n💡 Tip: WebP images are typically 25-35% smaller than PNG/JPEG');
}

// Run optimization
if (require.main === module) {
  optimizeImages();
}

module.exports = { optimizeImages, convertToWebP, processDirectory };