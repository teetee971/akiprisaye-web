import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/services/openFoodFacts.test.ts', 'functions/**/*.test.ts', 'src/test/alerts.filterActive.test.ts', 'src/test/observations.normalize.test.ts', 'src/test/storeSelection.test.ts'],
  },
});
