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
      // NOTE: si scripts/ est à la racine du repo, remplace par ../scripts/...
      abs('./scripts/verify-pages-api.test.ts'),
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
