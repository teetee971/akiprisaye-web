// Agent : SiteAudit
const fs = require('fs');
const path = require('path');

function checkFileExists(filePath, label) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${label} présent : ${filePath}`);
    return true;
  } else {
    console.error(`❌ ${label} manquant : ${filePath}`);
    return false;
  }
}

function auditSEO() {
  console.log('\n--- Audit SEO ---');
  checkFileExists('dist/client/robots.txt', 'robots.txt');
  checkFileExists('dist/client/sitemap.xml', 'sitemap.xml');
  checkFileExists('dist/client/_headers', '_headers');
  checkFileExists('dist/client/manifest.webmanifest', 'manifest.webmanifest');
  console.log('--- Fin audit SEO ---\n');
}

function auditAccessibility() {
  console.log('\n--- Audit Accessibilité ---');
  // Vérification basique : présence d'index.html et d'attributs aria
  const indexPath = 'dist/client/index.html';
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    if (html.includes('aria-')) {
      console.log('✅ Attributs aria détectés dans index.html');
    } else {
      console.warn('⚠️ Aucun attribut aria détecté dans index.html');
    }
  } else {
    console.error('❌ index.html manquant !');
  }
  console.log('--- Fin audit Accessibilité ---\n');
}

function auditPerformance() {
  console.log('\n--- Audit Performance ---');
  // Vérification basique : taille des assets principaux
  const assets = ['dist/client/main.js', 'dist/client/style.css'];
  assets.forEach(asset => {
    if (fs.existsSync(asset)) {
      const stats = fs.statSync(asset);
      console.log(`Asset : ${asset}, taille : ${stats.size} octets`);
      if (stats.size > 500000) {
        console.warn(`⚠️ Asset volumineux : ${asset}`);
      }
    } else {
      console.warn(`Asset manquant : ${asset}`);
    }
  });
  console.log('--- Fin audit Performance ---\n');
}

function auditSecurity() {
  console.log('\n--- Audit Sécurité ---');
  // Vérification basique : présence de headers de sécurité
  const headersPath = 'dist/client/_headers';
  if (fs.existsSync(headersPath)) {
    const headers = fs.readFileSync(headersPath, 'utf8');
    if (headers.includes('Strict-Transport-Security')) {
      console.log('✅ Header HSTS présent');
    } else {
      console.warn('⚠️ Header HSTS absent');
    }
    if (headers.includes('Content-Security-Policy')) {
      console.log('✅ Header CSP présent');
    } else {
      console.warn('⚠️ Header CSP absent');
    }
  } else {
    console.warn('Fichier _headers absent, sécurité non vérifiable.');
  }
  console.log('--- Fin audit Sécurité ---\n');
}

function auditPWA() {
  console.log('\n--- Audit PWA ---');
  checkFileExists('dist/client/manifest.webmanifest', 'manifest.webmanifest');
  checkFileExists('dist/client/service-worker.js', 'service-worker.js');
  console.log('--- Fin audit PWA ---\n');
}

function finalReport() {
  console.log('\n=== Rapport global d’audit du site ===');
  auditSEO();
  auditAccessibility();
  auditPerformance();
  auditSecurity();
  auditPWA();
  console.log('=== Fin du rapport ===\n');
}

finalReport();
