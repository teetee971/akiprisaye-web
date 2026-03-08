import { createCalameoCatalogProvider } from './createCalameoCatalogProvider';

/**
 * Fournisseur de référence pour le catalogue Huit à 8 Guadeloupe — Carême Février 2026.
 * Valable du 25 février au 8 mars 2026.
 *
 * Source : https://www.calameo.com/books/00672206587e18c17d3bd
 * Territoire : Guadeloupe (gp)
 *
 * Activer via : VITE_PRICE_PROVIDER_HUIT_A_HUIT_GUADELOUPE=true
 */
export const huitAHuitGuadeloupeProvider = createCalameoCatalogProvider({
  source: 'huit_a_huit_guadeloupe',
  bkcode: '00672206587e18c17d3bd',
  envFlag: 'VITE_PRICE_PROVIDER_HUIT_A_HUIT_GUADELOUPE',
  label: 'Huit à 8 Guadeloupe — Carême Février 2026',
});
