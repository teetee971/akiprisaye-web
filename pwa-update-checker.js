// Agent : PWAUpdateChecker
const fs = require('fs');

function validateIcons(icons) {
  if (!Array.isArray(icons) || icons.length === 0) {
    console.error('Aucune icône trouvée dans le manifest !');
    process.exit(1);
  }
  icons.forEach((icon, idx) => {
    if (!icon.src || !icon.sizes || !icon.type) {
      console.error(`Icône #${idx + 1} invalide : src, sizes ou type manquant.`);
      process.exit(1);
    }
    // Vérification des tailles courantes
    const validSizes = ['192x192', '256x256', '512x512'];
    if (!validSizes.includes(icon.sizes)) {
      console.warn(`Icône #${idx + 1} : taille inhabituelle (${icon.sizes}).`);
    }
    // Vérification du type
    if (!icon.type.startsWith('image/')) {
      console.warn(`Icône #${idx + 1} : type non standard (${icon.type}).`);
    }
  });
}

function validateManifestFields(manifest) {
  const requiredFields = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
  let valid = true;
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      console.error(`Champ manquant dans le manifest : ${field}`);
      valid = false;
    }
  });
  if (!valid) {
    process.exit(1);
  }
  validateIcons(manifest.icons);
}

function checkManifest() {
  const manifestPath = 'dist/client/manifest.webmanifest';
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('Manifest trouvé. Version :', manifest.version || 'non spécifiée');
    validateManifestFields(manifest);
  } else {
    console.error('Manifest PWA manquant !');
    process.exit(1);
  }
}

function analyzeServiceWorker() {
  const swPath = 'dist/client/service-worker.js';
  if (!fs.existsSync(swPath)) {
    console.error('Service Worker manquant !');
    process.exit(1);
  }
  const swContent = fs.readFileSync(swPath, 'utf8');
  // Vérification de la taille
  const stats = fs.statSync(swPath);
  if (stats.size < 1000) {
    console.warn('Service Worker très petit, vérifier la logique.');
  }
  // Recherche de méthodes clés
  const requiredMethods = ['self.addEventListener', 'fetch', 'install', 'activate'];
  requiredMethods.forEach(method => {
    if (!swContent.includes(method)) {
      console.warn(`Service Worker : méthode clé absente (${method})`);
    }
  });
  // Détection de pièges courants
  if (swContent.includes('skipWaiting()')) {
    console.log('Service Worker : skipWaiting() détecté.');
  }
  if (swContent.includes('clients.claim()')) {
    console.log('Service Worker : clients.claim() détecté.');
  }
}

function checkServiceWorker() {
  const swPath = 'dist/client/service-worker.js';
  if (fs.existsSync(swPath)) {
    console.log('Service Worker trouvé.');
    analyzeServiceWorker();
  } else {
    console.error('Service Worker manquant !');
    process.exit(1);
  }
}

function finalAuditReport() {
  console.log('\n--- Audit de finalisation PWA ---');
  let score = 100;
  // Vérification du manifest
  const manifestPath = 'dist/client/manifest.webmanifest';
  if (!fs.existsSync(manifestPath)) {
    console.error('Manifest PWA manquant !');
    score -= 30;
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
    requiredFields.forEach(field => {
      if (!manifest[field]) score -= 5;
    });
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) score -= 10;
  }
  // Vérification du service worker
  const swPath = 'dist/client/service-worker.js';
  if (!fs.existsSync(swPath)) {
    console.error('Service Worker manquant !');
    score -= 30;
  } else {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const requiredMethods = ['self.addEventListener', 'fetch', 'install', 'activate'];
    requiredMethods.forEach(method => {
      if (!swContent.includes(method)) score -= 5;
    });
  }
  // Synthèse
  if (score >= 90) {
    console.log('✅ PWA conforme. Score :', score);
  } else if (score >= 70) {
    console.warn('⚠️ PWA partiellement conforme. Score :', score);
  } else {
    console.error('❌ PWA non conforme. Score :', score);
  }
  // Conseils
  if (score < 100) {
    console.log('Conseils : Vérifiez le manifest, les icônes, le service worker et les méthodes clés.');
  }
  console.log('--- Fin audit PWA ---\n');
}

checkManifest();
checkServiceWorker();
finalAuditReport();
console.log('PWAUpdateChecker : vérification terminée.');
process.exit(0);