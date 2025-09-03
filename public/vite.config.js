import { defineConfig } from "vite";

export default defineConfig({
  root: "public", // dossier de ton site statique
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
