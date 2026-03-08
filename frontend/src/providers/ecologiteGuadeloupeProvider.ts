import { createCalameoCatalogProvider } from './createCalameoCatalogProvider';

/**
 * Fournisseur de référence pour le catalogue Ecologite Guadeloupe 2026.
 *
 * Source : https://www.calameo.com/books/005456123ba91a2661670
 *
 * Ce catalogue est un document visuel (flipbook Calameo). L'extraction
 * automatique des prix nécessite une étape OCR (extension future via
 * /api/ocr-ticket). En attendant, ce fournisseur retourne le statut
 * NO_DATA avec l'URL du catalogue pour consultation manuelle.
 *
 * Activer via : VITE_PRICE_PROVIDER_ECOLOGITE_GUADELOUPE=true
 */
export const ecologiteGuadeloupeProvider = createCalameoCatalogProvider({
  source: 'ecologite_guadeloupe',
  bkcode: '005456123ba91a2661670',
  authid: 'KEl4wzU8WfzM',
  envFlag: 'VITE_PRICE_PROVIDER_ECOLOGITE_GUADELOUPE',
  label: 'Ecologite Guadeloupe 2026',
});
