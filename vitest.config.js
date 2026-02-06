import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,

    // ✅ Autorise les fichiers avec 0 test
    failOnNoTests: false,

    // ✅ Tests uniquement côté src
    include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}"],

    // ✅ Ignore complètement frontend
    exclude: ["frontend/**"],
  },
});