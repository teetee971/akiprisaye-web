import { createCalameoCatalogProvider } from './createCalameoCatalogProvider';

/**
 * Fournisseur de référence pour le Catalogue Mars 2026 Connexion Guadeloupe.
 * Électroménager, high-tech et équipements de la maison.
 *
 * Source  : https://www.calameo.com/books/0077620289340a0cc1cc8
 * Compte  : 7762028 (Connexion Guadeloupe) — ajouté à VITE_CALAMEO_ACCOUNTS
 * Territoire : Guadeloupe (gp)
 *
 * Note : ce catalogue est également découvert automatiquement via
 * calameoDynamicProvider dès que le compte 7762028 figure dans
 * VITE_CALAMEO_ACCOUNTS.
 *
 * Activer via : VITE_PRICE_PROVIDER_CONNEXION_GUADELOUPE=true
 */
export const connexionGuadeloupeProvider = createCalameoCatalogProvider({
  source: 'connexion_guadeloupe',
  bkcode: '0077620289340a0cc1cc8',
  envFlag: 'VITE_PRICE_PROVIDER_CONNEXION_GUADELOUPE',
  label: 'Connexion Guadeloupe — Catalogue Mars 2026',
});
