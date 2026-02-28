// src/test/globalSetup.ts
export default async function globalSetup() {
  // Simple trace pour vérifier que globalSetup s’exécute
  // (Vitest n’affiche pas toujours; mais ça suffit pour déclencher le chargement)
  process.env.VITEST_GLOBAL_SETUP_RAN = '1';
}