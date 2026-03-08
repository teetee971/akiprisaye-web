import { createCalameoCatalogProvider } from './createCalameoCatalogProvider';

/**
 * Fournisseur de référence pour le catalogue Carrefour Milénis Guadeloupe
 * — Spécial Beauté 2026.
 *
 * Source : https://www.calameo.com/books/0067220659b9adde1c784
 * Compte  : 006722065 (déjà surveillé par calameoDynamicProvider)
 * Territoire : Guadeloupe (gp)
 *
 * Note : ce catalogue est également découvert automatiquement via
 * calameoDynamicProvider (compte 006722065 dans VITE_CALAMEO_ACCOUNTS).
 * Ce fournisseur nommé offre une référence directe et stable.
 *
 * Activer via : VITE_PRICE_PROVIDER_CARREFOUR_MILENIS_GUADELOUPE=true
 */
export const carrefourMilenisGuadeloupeProvider = createCalameoCatalogProvider({
  source: 'carrefour_milenis_guadeloupe',
  bkcode: '0067220659b9adde1c784',
  envFlag: 'VITE_PRICE_PROVIDER_CARREFOUR_MILENIS_GUADELOUPE',
  label: 'Carrefour Milénis Guadeloupe — Spécial Beauté 2026',
});
