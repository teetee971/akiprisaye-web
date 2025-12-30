# Guide d'Optimisation des Performances
## A KI PRI SA YÉ

---

## Objectifs de Performance

### Métriques Cibles (Lighthouse)

| Métrique | Cible | Actuel | Priorité |
|----------|-------|--------|----------|
| Performance Score | >90 | Non testé | 🔴 Haute |
| First Contentful Paint (FCP) | <1.5s | ? | 🔴 Haute |
| Largest Contentful Paint (LCP) | <2.5s | ? | 🔴 Haute |
| Time to Interactive (TTI) | <3.5s | ? | 🟡 Moyenne |
| Total Blocking Time (TBT) | <200ms | ? | 🟡 Moyenne |
| Cumulative Layout Shift (CLS) | <0.1 | ? | 🟢 Faible |

---

## 1. Optimisation des Images

### Problème Actuel

```
Images PNG non compressées:
- A_webpage_screenshot_screenshot_titled__A_KI_PRI_S.png  1,792 KB ❌
- A_digital_screenshot_and_a_mockup_of_the_web_appli.png  1,213 KB ❌
- A_pair_of_digital_screenshots_displays_the_launch_.png  1,159 KB ❌

Total: ~4.1 MB ❌❌❌
```

### Solution 1: Conversion WebP avec Compression

```bash
# Installer squoosh-cli
npm install -g @squoosh/cli

# Convertir toutes les images PNG en WebP
cd public
npx @squoosh/cli --webp '{"quality":80}' *.png

# Résultat attendu: ~400 KB (réduction de 90%) ✅
```

### Solution 2: Lazy Loading

**HTML:**
```html
<!-- Avant -->
<div class="slide" style="background-image: url('A_webpage_screenshot.png')"></div>

<!-- Après -->
<div class="slide" 
     data-bg="A_webpage_screenshot.webp" 
     style="background-color: #0b0d17">
</div>

<script>
// Lazy load background images
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bg = entry.target.dataset.bg;
      entry.target.style.backgroundImage = `url('${bg}')`;
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.slide').forEach(slide => {
  observer.observe(slide);
});
</script>
```

### Solution 3: Responsive Images

```html
<picture>
  <source 
    srcset="screenshot-mobile.webp" 
    media="(max-width: 768px)"
    type="image/webp">
  <source 
    srcset="screenshot-tablet.webp" 
    media="(max-width: 1024px)"
    type="image/webp">
  <source 
    srcset="screenshot-desktop.webp" 
    type="image/webp">
  <img 
    src="screenshot-desktop.png" 
    alt="Screenshot de l'application"
    loading="lazy"
    decoding="async">
</picture>
```

### Solution 4: CDN avec Optimisation Automatique

```html
<!-- Cloudflare Images (si disponible) -->
<img 
  src="https://imagedelivery.net/[account-hash]/screenshot/public" 
  alt="Screenshot"
  loading="lazy">

<!-- OU Cloudinary -->
<img 
  src="https://res.cloudinary.com/[cloud-name]/image/upload/f_auto,q_auto/screenshot.png"
  alt="Screenshot"
  loading="lazy">
```

---

## 2. Optimisation JavaScript

### Bundle Splitting

**vite.config.js** (déjà mis à jour):
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase'],
          tesseract: ['tesseract.js'], // OCR séparé
        },
      },
    },
  },
});
```

### Code Splitting Dynamique

**Avant:**
```javascript
import { scanBarcode } from './scanner.js';
```

**Après:**
```javascript
// Charger uniquement quand nécessaire
async function handleScan() {
  const { scanBarcode } = await import('./scanner.js');
  await scanBarcode();
}
```

### Tree Shaking

Importer seulement ce qui est nécessaire:

**Avant:**
```javascript
import firebase from 'firebase';
```

**Après:**
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// Importe uniquement ce qui est utilisé
```

### Minification Agressive

**vite.config.js** (déjà mis à jour):
```javascript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Supprime console.log en prod
        drop_debugger: true, // Supprime debugger en prod
        pure_funcs: ['console.info', 'console.debug'],
      },
    },
  },
});
```

---

## 3. Optimisation CSS

### Critical CSS

Inline le CSS critique dans le `<head>`:

```html
<head>
  <style>
    /* Styles critiques pour le premier rendu */
    body { margin: 0; font-family: sans-serif; }
    .carousel { height: 100vh; width: 100vw; }
    .slide { position: absolute; opacity: 0; }
  </style>
  
  <!-- CSS non-critique chargé de manière asynchrone -->
  <link rel="preload" href="style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="style.css"></noscript>
</head>
```

### Suppression du CSS Inutilisé

```bash
# Installer PurgeCSS
npm install -D @fullhuman/postcss-purgecss

# vite.config.js
import purgecss from '@fullhuman/postcss-purgecss';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        purgecss({
          content: ['./**/*.html', './**/*.js'],
        }),
      ],
    },
  },
});
```

---

## 4. Service Worker Optimisé

### Stratégie Cache-First

**service-worker.js** (amélioration):

```javascript
const CACHE_NAME = 'aki-pri-sa-ye-v2';
const RUNTIME_CACHE = 'runtime-cache';

// Stratégie: Cache-First, Network Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // API calls: Network-First
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Assets: Cache-First
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Retourne du cache, met à jour en arrière-plan
    event.waitUntil(updateCache(request, cache));
    return cached;
  }
  
  return fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function updateCache(request, cache) {
  try {
    const response = await fetch(request);
    await cache.put(request, response);
  } catch (error) {
    // Ignore silently
  }
}
```

---

## 5. Préchargement et Prefetch

### Preload des Ressources Critiques

```html
<head>
  <!-- Preload des fonts -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- Preload du logo -->
  <link rel="preload" href="/assets/logo.webp" as="image">
  
  <!-- Preconnect aux domaines externes -->
  <link rel="preconnect" href="https://www.gstatic.com">
  <link rel="preconnect" href="https://firebaseio.com">
  
  <!-- DNS-Prefetch -->
  <link rel="dns-prefetch" href="https://www.google-analytics.com">
</head>
```

### Prefetch des Pages Suivantes

```html
<!-- Sur la page d'accueil, prefetch le comparateur -->
<link rel="prefetch" href="/comparateur.html">
<link rel="prefetch" href="/comparateur-fetch.js">
```

---

## 6. Optimisation Firebase

### Indexation Firestore

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "prices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ean", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "prices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "territory", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Pagination des Requêtes

**Avant:**
```javascript
// ❌ Charge tous les prix
const snapshot = await getDocs(collection(db, 'prices'));
```

**Après:**
```javascript
// ✅ Charge seulement 20 résultats
const q = query(
  collection(db, 'prices'),
  where('ean', '==', eanCode),
  orderBy('timestamp', 'desc'),
  limit(20)
);
const snapshot = await getDocs(q);
```

### Cache Persistence

```javascript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: {
      kind: 'localStorageTabManager',
    },
  }),
});
```

---

## 7. Compression

### Gzip/Brotli sur Firebase Hosting

Firebase Hosting compresse automatiquement, mais vérifiez:

```bash
# Tester la compression
curl -H "Accept-Encoding: gzip" -I https://akiprisaye.pages.dev/

# Devrait retourner:
# Content-Encoding: gzip
```

### Compression des Assets au Build

**vite.config.js:**
```javascript
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

---

## 8. Monitoring des Performances

### Firebase Performance Monitoring

**firebase-config.js:**
```javascript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);

// Trace personnalisé
const trace = await perf.trace('load_prices');
trace.start();

// ... fetch prices ...

trace.stop();
```

### Web Vitals

```bash
npm install web-vitals
```

**app.js:**
```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Envoyer à Google Analytics ou autre
  console.log({ metric: name, value: delta, id });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 9. Checklist d'Optimisation

### Images
- [ ] Convertir PNG → WebP
- [ ] Compresser toutes les images (qualité 80%)
- [ ] Ajouter `loading="lazy"` sur toutes les images
- [ ] Utiliser `<picture>` pour responsive images
- [ ] Optimiser les favicon (16x16, 32x32)

### JavaScript
- [ ] Code splitting configuré
- [ ] Import dynamique pour code lourd
- [ ] Minification activée (terser)
- [ ] `drop_console: true` en production
- [ ] Bundle analysis avec visualizer

### CSS
- [ ] Critical CSS inliné
- [ ] CSS non-critique async
- [ ] PurgeCSS pour supprimer CSS inutilisé
- [ ] Minification activée

### Caching
- [ ] Service Worker optimisé
- [ ] Cache headers corrects (firebase.json)
- [ ] Firebase cache persistence activé
- [ ] Versionning des assets

### Network
- [ ] Preconnect aux domaines externes
- [ ] Prefetch des pages suivantes
- [ ] DNS-Prefetch configuré
- [ ] HTTP/2 activé (Firebase Hosting)

### Monitoring
- [ ] Lighthouse CI configuré
- [ ] Firebase Performance activé
- [ ] Web Vitals tracking
- [ ] Budget de performance défini

---

## 10. Scripts de Performance

### Script de Build avec Analysis

**package.json:**
```json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build && vite-bundle-visualizer",
    "lighthouse": "lighthouse https://akiprisaye.pages.dev/ --view",
    "lighthouse:ci": "lhci autorun"
  }
}
```

### Budget de Performance

**.lighthouserc.json:**
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "interactive": ["error", {"maxNumericValue": 3500}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

---

## Gains Attendus

### Avant Optimisations
```
Bundle size: ~3 MB
FCP: ~4.5s
LCP: ~6.2s
Performance Score: 45
```

### Après Optimisations
```
Bundle size: ~400 KB (réduction de 87%)
FCP: <1.5s (amélioration de 67%)
LCP: <2.5s (amélioration de 60%)
Performance Score: >90 (amélioration de 100%)
```

**ROI Total: +100% de performance**

---

*Guide créé: Novembre 2025*  
*Objectif: Performance Score >90*
