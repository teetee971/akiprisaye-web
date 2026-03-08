import { createCalameoCatalogProvider } from './createCalameoCatalogProvider';

/**
 * Fournisseur de référence pour le catalogue SUP ECO / Carrefour Market Guyane
 * — Maxi Économies Mars 2026.
 *
 * Source : https://www.calameo.com/read/0067220656cd5be3f9f3a
 * Territoire : Guyane (gf)
 *
 * Activer via : VITE_PRICE_PROVIDER_SUPECO_GUYANE=true
 */
export const supecoGuyaneProvider = createCalameoCatalogProvider({
  source: 'supeco_guyane',
  bkcode: '0067220656cd5be3f9f3a',
  envFlag: 'VITE_PRICE_PROVIDER_SUPECO_GUYANE',
  label: 'SUP ECO / Carrefour Market Guyane — Maxi Économies Mars 2026',
});
