// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const abs = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Vitest/Vite considère frontend/ comme racine même si lancé depuis ailleurs
  root: here,

  test: {
    environment: 'jsdom',
    globals: true,

    // ✅ UN SEUL setupFiles (et le bon)
    setupFiles: [abs('./src/test/setupTests.ts')],

    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },

    include: [
      abs('./src/services/openFoodFacts.test.ts'),
      abs('./src/services/alertProductImageService.test.ts'),
      abs('./src/services/photoProductSearchService.test.ts'),
      abs('./src/services/observatoirePriceSeries.test.ts'),
      abs('./src/services/__tests__/basketPricingService.test.ts'),
      // NOTE: si functions/ est à la racine du repo, remplace par ../functions/...
      abs('./functions/**/__tests__/*.test.ts'),
      abs('./src/test/alerts.filterActive.test.ts'),
      abs('./src/test/alerts.searchSort.test.ts'),
      abs('./src/test/alerts.serviceFallback.test.ts'),
      abs('./src/test/sanitaryAlerts.normalizer.test.ts'),
      abs('./src/test/observations.normalize.test.ts'),
      abs('./src/test/storeSelection.test.ts'),
      abs('./src/test/promosService.test.ts'),
      abs('./src/test/freemium.test.ts'),
      abs('./src/test/cloudflareRouting.test.ts'),
      abs('./src/test/portailDeveloppeurs.browserRenderingDocs.test.ts'),
      abs('./src/test/internalNavigationRoutes.test.ts'),
      abs('./src/test/actualites.page.test.jsx'),
      abs('./src/test/serviceWorkerCacheStrategy.test.ts'),
      abs('./src/test/app.aliases.test.ts'),
      abs('./src/test/entitlements.test.ts'),
      abs('./src/test/quotaService.test.ts'),
      abs('./src/test/shoppingListStore.test.ts'),
      abs('./src/test/shoppingListPersistence.test.ts'),
      abs('./src/test/offCacheFallback.test.ts'),
      abs('./src/test/scannerFallback.test.tsx'),
      abs('./src/test/listePage.thumbnails.test.tsx'),
      abs('./src/test/decisionEngine.test.ts'),
      abs('./src/domain/decision/__tests__/decisionEngine.test.ts'),
      abs('./src/domain/shoppingList/premium/tests/*.test.ts'),
      abs('./src/test/mergeConflictMarkers.test.ts'),
      abs('./src/test/produitPage.test.ts'),
      abs('./src/test/upgradeUpsell.test.ts'),
      abs('./src/test/observatoire.unavailable.test.ts'),
      abs('./src/test/observatory.mapping.test.ts'),
      // Temporal aggregation — real observatoire JSON data (no mocks)
      abs('./src/test/temporalAggregation.test.ts'),
      // Inflation barometer — basket computation from real observatoire JSON data
      abs('./src/test/inflationBarometer.test.ts'),
      // NOTE: si scripts/ est à la racine du repo, remplace par ../scripts/...
      abs('./scripts/verify-pages-api.test.ts'),
      abs('./scripts/validate-deployment.test.ts'),
      abs('./scripts/ci-workflows.test.ts'),
      // Firebase API key integrity — prevents re-introducing the wrong hardcoded key
      abs('./scripts/firebase-config.test.ts'),
      // EAN / GTIN validation — GS1 checksum and country label
      abs('./src/test/eanValidator.test.ts'),
      // Structured receipt parser — French ticket OCR
      abs('./src/test/receiptParser.test.ts'),
      // Super U Petit Canal fixture — parser + normalizer end-to-end
      abs('./src/test/superUPetitCanalReceipt.test.ts'),
      // ScanHub classifier — text classification and extraction
      abs('./src/test/scanHubClassifier.test.ts'),
      // Store hours — open/closed status logic and utilities
      abs('./src/test/storeHours.test.ts'),
      // Groupes de Parole — AI moderation text filter
      abs('./src/test/groupesParoleService.test.ts'),
      // Marketplace Enseignes — merchant service (onboarding, stores, products, billing)
      abs('./src/test/merchantService.test.ts'),
      // Devis IA — moteur d'estimation explicable + constantes (Issues #501, #492)
      abs('./src/test/devisService.test.ts'),
      // Catalogue E.Leclerc — fournisseur de prix catalogue DOM-TOM
      abs('./src/providers/__tests__/leclercCatalogProvider.test.ts'),
      // Catalogues E.Leclerc catégories (MaCave, Jardin, High-Tech, Électroménager, Parapharmacie, Seconde Vie)
      abs('./src/providers/__tests__/leclercCategoryProviders.test.ts'),
      // Catalogues visuels Calameo (Ecologite Guadeloupe 2026)
      abs('./src/providers/__tests__/calameoCatalogProvider.test.ts'),
      // Découverte automatique Calameo + fournisseur dynamique
      abs('./src/providers/__tests__/calameoDiscovery.test.ts'),
      // Courses U / Super U — fournisseur de prix catalogue DOM-TOM
      abs('./src/providers/__tests__/coursesUProvider.test.ts'),
      // Intermarché — fournisseur de prix catalogue DOM-TOM
      abs('./src/providers/__tests__/intermarcheProvider.test.ts'),
      // Leader Price — fournisseur de prix catalogue DOM-TOM (Guadeloupe, Martinique)
      abs('./src/providers/__tests__/leaderPriceProvider.test.ts'),
      // Booking links — UTM params et statut commissions
      abs('./src/test/bookingLinks.test.ts'),
      abs('./src/test/home.page.test.tsx'),
      // Comparateurs spécialisés — services de comparaison
      abs('./src/services/__tests__/carRentalService.test.ts'),
      abs('./src/services/__tests__/freightComparisonService.test.ts'),
      abs('./src/services/__tests__/fuelComparisonService.test.ts'),
      abs('./src/services/__tests__/insuranceComparisonService.test.ts'),
      abs('./src/services/__tests__/flightComparisonService.test.ts'),
      abs('./src/services/__tests__/boatComparisonService.test.ts'),
      // Couverture des routes des comparateurs dans App.tsx
      abs('./src/test/comparateurRoutes.test.ts'),
      abs('./src/test/comparateursHubRoutes.test.ts'),
      abs('./src/test/sitemapRoutes.test.ts'),
      // Image upload — validatePhotoFile, validateImageFile, formatFileSize, compression presets, localStorage helpers
      abs('./src/test/photoUpload.test.ts'),
      // Historique des recherches — useSearchHistory hook (localStorage, déduplication, limite 20)
      abs('./src/hooks/__tests__/useSearchHistory.test.ts'),
    ],

    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/coverage/**'],

    testTimeout: 10_000,
    hookTimeout: 10_000,

    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: false,
    unstubEnvs: true,
  },
});
