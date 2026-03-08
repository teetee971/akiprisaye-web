/**
 * Fournisseur de prix dynamique pour les catalogues Calameo découverts
 * automatiquement via calameoDiscoveryService.
 *
 * Ce fournisseur se met à jour sans redéploiement : dès qu'un nouveau
 * catalogue est publié sur un compte Calameo surveillé, il apparaît
 * automatiquement dans les résultats de recherche.
 *
 * Comportement :
 *  - Appelle calameoDiscoveryService.getCatalogs() pour obtenir la liste
 *    des catalogues disponibles.
 *  - Retourne status: NO_DATA avec les URLs des catalogues dans les
 *    métadonnées (les catalogues sont des documents visuels sans extraction
 *    automatique de prix pour l'instant).
 *  - L'interface peut afficher des liens "Consulter le catalogue" pour
 *    chaque catalogue trouvé.
 *
 * Activer via : VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC=true
 */

import type { PriceSearchInput } from '../services/priceSearch/price.types';
import {
  getCatalogs,
  getCachedCatalogs,
  type DiscoveredCatalog,
} from '../services/calameoDiscoveryService';
import type { PriceProvider, ProviderResult } from './types';

const parseFlag = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

const normalizeForSearch = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

/**
 * Filtre les catalogues dont le titre correspond à la requête.
 * Si aucune requête, retourne tous les catalogues.
 */
const filterCatalogs = (
  catalogs: DiscoveredCatalog[],
  input: PriceSearchInput,
): DiscoveredCatalog[] => {
  const term = normalizeForSearch(input.query ?? input.barcode ?? '');
  if (!term) return catalogs;
  return catalogs.filter((c) =>
    normalizeForSearch(c.title).split(/\s+/).some((word) => term.includes(word) || word.includes(term.split(/\s+/)[0] ?? term)),
  );
};

const buildWarnings = (catalogs: DiscoveredCatalog[]): string[] => {
  if (catalogs.length === 0) return ['Aucun catalogue Calameo correspondant trouvé.'];
  return catalogs.map(
    (c) =>
      `${c.title}${c.date ? ` (${c.date.slice(0, 10)})` : ''} — Consulter : ${c.publicUrl}`,
  );
};

export const calameoDynamicProvider: PriceProvider = {
  source: 'calameo_catalog',
  isEnabled: () =>
    parseFlag(import.meta.env.VITE_PRICE_PROVIDER_CALAMEO_DYNAMIC, false),

  async search(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult> {
    let catalogs: DiscoveredCatalog[];

    try {
      // Essaie d'abord le cache synchrone pour ne pas bloquer
      const fromCache = getCachedCatalogs();
      if (fromCache.length > 0) {
        catalogs = fromCache;
        // Rafraîchit en arrière-plan sans bloquer la réponse
        getCatalogs().catch(() => undefined);
      } else {
        // Premier appel : attend la réponse réseau (avec timeout via AbortSignal)
        const raceTimeout = new Promise<DiscoveredCatalog[]>((resolve) => {
          const id = setTimeout(() => resolve([]), 7000);
          signal.addEventListener('abort', () => { clearTimeout(id); resolve([]); }, { once: true });
        });
        catalogs = await Promise.race([getCatalogs(), raceTimeout]);
      }
    } catch {
      return {
        source: 'calameo_catalog',
        status: 'UNAVAILABLE',
        observations: [],
        warnings: ['Service de découverte Calameo indisponible.'],
      };
    }

    const matched = filterCatalogs(catalogs, input);

    return {
      source: 'calameo_catalog',
      status: 'NO_DATA',
      observations: [],
      warnings: buildWarnings(matched),
    };
  },
};
