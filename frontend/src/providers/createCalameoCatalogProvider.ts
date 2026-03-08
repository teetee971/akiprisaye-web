/**
 * Fabrique un PriceProvider pour un catalogue Calameo.
 *
 * Les catalogues Calameo sont des documents visuels (flipbooks/PDF).
 * Ce fournisseur retourne le statut PARTIAL avec l'URL du catalogue
 * dans les métadonnées jusqu'à ce qu'une extraction OCR soit intégrée.
 *
 * Usage :
 *   export const myProvider = createCalameoCatalogProvider({
 *     source: 'ecologite_guadeloupe',
 *     bkcode: '005456123ba91a2661670',
 *     authid: 'KEl4wzU8WfzM',
 *     envFlag: 'VITE_PRICE_PROVIDER_ECOLOGITE_GUADELOUPE',
 *     label: 'Ecologite Guadeloupe 2026',
 *   });
 */

import type { PriceSearchInput, PriceSourceId } from '../services/priceSearch/price.types';
import type { PriceProvider, ProviderResult } from './types';

const REQUEST_TIMEOUT_MS = 6000;

const parseFlag = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
};

type CatalogResponse = {
  status?: string;
  warnings?: string[];
  catalog?: Record<string, string | number>;
};

const withTimeoutSignal = (signal: AbortSignal, ms: number): AbortSignal => {
  const ctrl = new globalThis.AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  ctrl.signal.addEventListener('abort', () => clearTimeout(id), { once: true });
  return ctrl.signal;
};

export interface CalameoCatalogProviderConfig {
  /** Identifiant canonique de la source (doit figurer dans PriceSourceId) */
  source: PriceSourceId;
  /** Code livre Calameo (ex: "005456123ba91a2661670") */
  bkcode: string;
  /** Identifiant d'accès Calameo (ex: "KEl4wzU8WfzM") */
  authid?: string;
  /** Variable d'environnement Vite qui active ce fournisseur */
  envFlag: string;
  /** Libellé humain du catalogue (pour les messages d'avertissement) */
  label: string;
}

export function createCalameoCatalogProvider(cfg: CalameoCatalogProviderConfig): PriceProvider {
  return {
    source: cfg.source,
    isEnabled: () => parseFlag(import.meta.env[cfg.envFlag], false),

    async search(input: PriceSearchInput, signal: AbortSignal): Promise<ProviderResult> {
      const params = new URLSearchParams({ bkcode: cfg.bkcode, source: cfg.source });
      if (cfg.authid) params.set('authid', cfg.authid);
      if (input.query) params.set('q', input.query);
      if (input.barcode) params.set('q', input.barcode);

      const base = (import.meta.env.VITE_PRICE_API_BASE ?? '').replace(/\/$/, '');
      const url = `${base}/api/calameo-catalog?${params.toString()}`;

      try {
        const response = await fetch(url, {
          signal: withTimeoutSignal(signal, REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          return {
            source: cfg.source,
            status: 'UNAVAILABLE',
            observations: [],
            warnings: [`Catalogue ${cfg.label} temporairement indisponible.`],
          };
        }

        const payload = (await response.json()) as CatalogResponse;
        const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];

        /*
         * Les catalogues Calameo sont visuels : aucun prix ne peut être
         * extrait automatiquement sans OCR. On retourne PARTIAL afin que
         * l'interface puisse afficher un lien vers le catalogue.
         */
        return {
          source: cfg.source,
          status: 'NO_DATA',
          observations: [],
          warnings:
            warnings.length > 0
              ? warnings
              : [`${cfg.label} : consultation manuelle requise pour l'extraction des prix.`],
        };
      } catch {
        return {
          source: cfg.source,
          status: 'UNAVAILABLE',
          observations: [],
          warnings: [`Catalogue ${cfg.label} indisponible.`],
        };
      }
    },
  };
}
