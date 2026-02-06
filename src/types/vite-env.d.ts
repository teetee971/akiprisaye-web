// Correction pour import.meta.env
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  // Ajoute tes autres variables ici si besoin
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
