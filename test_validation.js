#!/usr/bin/env node

/**
 * Comprehensive validation test suite for A KI PRI SA YÉ
 * Tests all the ⚠️ items from the verification report
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 A KI PRI SA YÉ - Suite de tests de validation\n');

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, testFn) {
  try {
    testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// 1. Test PWA setup
test('PWA: Manifest présent et valide', () => {
  const manifestPath = path.join(__dirname, 'public/manifest.webmanifest');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.webmanifest manquant');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.name || !manifest.short_name || !manifest.start_url) {
    throw new Error('Manifest incomplet');
  }
  
  if (!manifest.icons || manifest.icons.length === 0) {
    throw new Error('Icônes manquantes dans le manifest');
  }
});

test('PWA: Service Worker présent', () => {
  const swPath = path.join(__dirname, 'public/service-worker.js');
  if (!fs.existsSync(swPath)) {
    throw new Error('service-worker.js manquant');
  }
  
  const swContent = fs.readFileSync(swPath, 'utf8');
  if (!swContent.includes('addEventListener') || !swContent.includes('install')) {
    throw new Error('Service Worker malformé');
  }
});

test('PWA: Icônes disponibles', () => {
  const iconPath = path.join(__dirname, 'public/icon.svg');
  if (!fs.existsSync(iconPath)) {
    throw new Error('Icône SVG manquante');
  }
});

// 2. Test SEO setup
test('SEO: robots.txt présent et configuré', () => {
  const robotsPath = path.join(__dirname, 'public/robots.txt');
  if (!fs.existsSync(robotsPath)) {
    throw new Error('robots.txt manquant');
  }
  
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsContent.includes('Sitemap:')) {
    throw new Error('Sitemap manquant dans robots.txt');
  }
});

test('SEO: sitemap.xml présent', () => {
  const sitemapPath = path.join(__dirname, 'public/sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error('sitemap.xml manquant');
  }
  
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemapContent.includes('<urlset') || !sitemapContent.includes('<url>')) {
    throw new Error('sitemap.xml malformé');
  }
});

test('SEO: Script d\'optimisation présent', () => {
  const seoScriptPath = path.join(__dirname, 'optimize-seo.js');
  if (!fs.existsSync(seoScriptPath)) {
    throw new Error('optimize-seo.js manquant');
  }
});

// 3. Test pages critiques
test('Page admin sécurisée: structure présente', () => {
  const adminPath = path.join(__dirname, 'public/dashboard-admin.html');
  if (!fs.existsSync(adminPath)) {
    throw new Error('dashboard-admin.html manquant');
  }
  
  const adminContent = fs.readFileSync(adminPath, 'utf8');
  if (!adminContent.includes('onAuthStateChanged') || !adminContent.includes('admin')) {
    throw new Error('Authentification admin manquante');
  }
});

test('Page actualités: présente et fonctionnelle', () => {
  const actualitesPath = path.join(__dirname, 'public/actualites.html');
  if (!fs.existsSync(actualitesPath)) {
    throw new Error('actualites.html manquant');
  }
  
  const actualitesContent = fs.readFileSync(actualitesPath, 'utf8');
  if (!actualitesContent.includes('/news?territory=') || !actualitesContent.includes('fetch(')) {
    throw new Error('Fonctionnalité actualités manquante');
  }
});

// 4. Test authentification structure
test('Authentification: Mon compte présent', () => {
  const monComptePath = path.join(__dirname, 'mon-compte.html');
  if (!fs.existsSync(monComptePath)) {
    throw new Error('mon-compte.html manquant');
  }
  
  const monCompteContent = fs.readFileSync(monComptePath, 'utf8');
  if (!monCompteContent.includes('firebase') || !monCompteContent.includes('getAuth')) {
    throw new Error('Firebase auth manquante');
  }
});

test('Authentification: Configuration Firebase présente', () => {
  const firebaseConfigPath = path.join(__dirname, 'firebase-config.js');
  if (!fs.existsSync(firebaseConfigPath)) {
    throw new Error('firebase-config.js manquant');
  }
  
  const firebaseContent = fs.readFileSync(firebaseConfigPath, 'utf8');
  if (!firebaseContent.includes('firebaseConfig') || !firebaseContent.includes('initializeApp')) {
    throw new Error('Configuration Firebase malformée');
  }
});

// 5. Test export et comparateur
test('Export: Comparateur avec fonctionnalités export', () => {
  const comparateurPath = path.join(__dirname, 'comparateur.html');
  if (!fs.existsSync(comparateurPath)) {
    throw new Error('comparateur.html manquant');
  }
  
  const comparateurContent = fs.readFileSync(comparateurPath, 'utf8');
  if (!comparateurContent.includes('exportToExcel') || !comparateurContent.includes('exportToPDF')) {
    throw new Error('Fonctionnalités export manquantes');
  }
});

test('Suggestions: Alternatives locales implémentées', () => {
  const comparateurPath = path.join(__dirname, 'comparateur.html');
  const comparateurContent = fs.readFileSync(comparateurPath, 'utf8');
  if (!comparateurContent.includes('suggestions') || !comparateurContent.includes('alternatives')) {
    throw new Error('Suggestions d\'alternatives manquantes');
  }
});

// 6. Test validation formulaires
test('Validation: Formulaires avec validation côté client', () => {
  const comparateurPath = path.join(__dirname, 'comparateur.html');
  const comparateurContent = fs.readFileSync(comparateurPath, 'utf8');
  if (!comparateurContent.includes('validateForm') || !comparateurContent.includes('required')) {
    throw new Error('Validation formulaires manquante');
  }
});

// 7. Test responsive design structure
test('Responsive: Media queries présentes', () => {
  const comparateurPath = path.join(__dirname, 'comparateur.html');
  const comparateurContent = fs.readFileSync(comparateurPath, 'utf8');
  if (!comparateurContent.includes('@media') || !comparateurContent.includes('max-width')) {
    throw new Error('Media queries manquantes');
  }
});

test('Responsive: Viewport meta tag présent', () => {
  const files = ['public/index.html', 'comparateur.html', 'public/dashboard-admin.html'];
  let hasViewport = false;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('name="viewport"')) {
        hasViewport = true;
      }
    }
  });
  
  if (!hasViewport) {
    throw new Error('Viewport meta tag manquant');
  }
});

// 8. Test fonctions API
test('API: Fonctions serverless présentes', () => {
  const functionsDir = path.join(__dirname, 'functions');
  if (!fs.existsSync(functionsDir)) {
    throw new Error('Dossier functions manquant');
  }
  
  const newsFunction = path.join(__dirname, 'functions/news.js');
  if (!fs.existsSync(newsFunction)) {
    throw new Error('Fonction news.js manquante');
  }
});

// 9. Test lazy loading
test('Lazy Loading: Script automatique présent', () => {
  const files = ['comparateur.html', 'public/dashboard-admin.html'];
  let hasLazyLoading = false;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('lazy') && content.includes('loading')) {
        hasLazyLoading = true;
      }
    }
  });
  
  if (!hasLazyLoading) {
    throw new Error('Lazy loading automatique manquant');
  }
});

// 10. Test multilingual
test('Multilingual: Support des langues présent', () => {
  const multilangReadme = path.join(__dirname, 'README_multilang_akiprisaye.md');
  if (!fs.existsSync(multilangReadme)) {
    throw new Error('README multilingual manquant');
  }
});

console.log('\n📊 Résultats des tests:');
console.log(`✅ Tests réussis: ${testResults.passed}`);
console.log(`❌ Tests échoués: ${testResults.failed}`);
console.log(`📈 Taux de réussite: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

if (testResults.failed > 0) {
  console.log('\n🔍 Détails des échecs:');
  testResults.tests.filter(t => t.status.includes('FAIL')).forEach(t => {
    console.log(`   ${t.name}: ${t.error}`);
  });
}

console.log('\n✨ Validation terminée!');

// Export results for GitHub Actions
if (process.env.GITHUB_ACTIONS) {
  const output = {
    passed: testResults.passed,
    failed: testResults.failed,
    rate: Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100),
    details: testResults.tests
  };
  
  fs.writeFileSync('test-results.json', JSON.stringify(output, null, 2));
}

process.exit(testResults.failed > 0 ? 1 : 0);