/**
 * Retailer Search Source Adapter
 *
 * Recherche d'images produit sur les sites d'enseignes de grande distribution.
 *
 * ─── POINTS À BRANCHER ────────────────────────────────────────────────────
 *
 * Ce module définit l'interface et la structure.
 * Les connecteurs réels sont marqués TODO(connect) avec les instructions
 * précises pour brancher chaque enseigne.
 *
 * Enseignes prévues:
 *  1. U / Courses U (magasins-u.com)
 *  2. Carrefour (carrefour.fr)
 *  3. E.Leclerc (leclerc.fr / drive.leclerc.fr)
 *  4. Casino (casino.fr)
 *
 * Pour activer un connecteur:
 *  1. Implémenter la fonction fetchRetailer{Name}(product)
 *  2. L'ajouter à RETAILER_ADAPTERS
 *  3. Vérifier les conditions légales (CGU / robots.txt du site)
 *
 * En attendant: retourne [] (aucune URL inventée, aucun crash).
 *
 * ─── FORMAT CANDIDAT ATTENDU ──────────────────────────────────────────────
 *
 * {
 *   imageUrl: "https://...",        ← URL image produit (https)
 *   pageUrl: "https://...",         ← URL fiche produit
 *   title: "...",                   ← libellé produit sur le site
 *   source: "drive.leclerc.fr",
 *   sourceType: "retailer",
 *   brand: "U",
 *   sizeText: "300g",
 *   matchedQuery: "...",
 *   confidenceScore: 0,
 *   confidenceHints: ["brand_match", "packshot"],
 *   notes: "packshot"
 * }
 */

import type { ImageCandidate, ImageSourceAdapter, ProductDescriptor } from '../../types/product-image';

// ─────────────────────────────────────────────────────────────────────────────
// Retailer connector type
// ─────────────────────────────────────────────────────────────────────────────

interface RetailerConnector {
  name: string;
  domain: string;
  /** Marques ou catégories couverts par ce connecteur */
  covers: RegExp[];
  /** True si le connecteur est implémenté et actif */
  active: boolean;
  /**
   * Recherche un produit sur le site de l'enseigne.
   * Retourner [] si indisponible ou hors périmètre.
   */
  fetch(product: ProductDescriptor): Promise<ImageCandidate[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Courses U / magasins-u.com
//
// TODO(connect):
//   API: https://www.coursesu.com/recherche?q={QUERY}
//   Images: extraire img[data-src] ou og:image depuis la fiche
//   Format image URL: https://medias.coursesu.com/media/...
//   Nécessite: user-agent mobile, gestion cookies, éventuellement proxy
//   Vérifier: CGU Courses U / robots.txt
// ─────────────────────────────────────────────────────────────────────────────

const coursesUConnector: RetailerConnector = {
  name: 'Courses U',
  domain: 'coursesu.com',
  covers: [/\bU\b/i, /\bU\s+bio\b/i, /\bU\s+Express\b/i],
  active: false,  // TODO(connect): passer à true après implémentation

  async fetch(_product: ProductDescriptor): Promise<ImageCandidate[]> {
    // TODO(connect): Implémenter la recherche sur coursesu.com
    // Étapes:
    //   1. GET https://www.coursesu.com/recherche?q={encodeURIComponent(product.normalizedLabel)}
    //   2. Parser le HTML pour extraire les produits (class .product-card ou similaire)
    //   3. Pour chaque produit: extraire titre, imageUrl, pageUrl
    //   4. Mapper vers ImageCandidate[]
    return [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Carrefour Drive
//
// TODO(connect):
//   API partenaire: https://www.carrefour.fr/s?q={QUERY}
//   Format image: https://img.carrefour.fr/...
//   Note: Carrefour dispose d'une API partenaire (accès négocié)
// ─────────────────────────────────────────────────────────────────────────────

const carrefourConnector: RetailerConnector = {
  name: 'Carrefour',
  domain: 'carrefour.fr',
  covers: [/\bcarrefour\b/i],
  active: false,

  async fetch(_product: ProductDescriptor): Promise<ImageCandidate[]> {
    // TODO(connect): API partenaire Carrefour
    return [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: E.Leclerc Drive
//
// TODO(connect):
//   URL: https://www.e.leclerc/recherche/{QUERY}
//   Images: extraire depuis balises JSON-LD ou Open Graph
// ─────────────────────────────────────────────────────────────────────────────

const leclercConnector: RetailerConnector = {
  name: 'E.Leclerc',
  domain: 'e.leclerc',
  covers: [/\bleclerc\b/i],
  active: false,

  async fetch(_product: ProductDescriptor): Promise<ImageCandidate[]> {
    // TODO(connect): scraping E.Leclerc Drive
    return [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Connector: Casino / Monoprix
//
// TODO(connect):
//   URL: https://www.casino.fr/recherche?q={QUERY}
// ─────────────────────────────────────────────────────────────────────────────

const casinoConnector: RetailerConnector = {
  name: 'Casino',
  domain: 'casino.fr',
  covers: [/\bcasino\b/i, /\bmonoprix\b/i],
  active: false,

  async fetch(_product: ProductDescriptor): Promise<ImageCandidate[]> {
    return [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Registered connectors (in priority order)
// ─────────────────────────────────────────────────────────────────────────────

const RETAILER_CONNECTORS: RetailerConnector[] = [
  coursesUConnector,
  carrefourConnector,
  leclercConnector,
  casinoConnector,
];

// ─────────────────────────────────────────────────────────────────────────────
// Public adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adaptateur multi-enseignes.
 *
 * Appelle tous les connecteurs actifs, agrège les candidats.
 * Les connecteurs inactifs retournent [] sans erreur.
 */
export const retailerSearchSource: ImageSourceAdapter = {
  name: 'RetailerSearch',

  async search(product: ProductDescriptor): Promise<ImageCandidate[]> {
    const candidates: ImageCandidate[] = [];
    const seenUrls = new Set<string>();

    for (const connector of RETAILER_CONNECTORS) {
      if (!connector.active) continue;

      try {
        const found = await connector.fetch(product);
        for (const c of found) {
          if (!seenUrls.has(c.imageUrl)) {
            seenUrls.add(c.imageUrl);
            candidates.push(c);
          }
        }
      } catch (err) {
        console.warn(`[RetailerSearchSource] ${connector.name} failed:`, err);
      }

      if (candidates.length >= 5) break;
    }

    return candidates;
  },
};

/** Liste des connecteurs disponibles avec leur statut d'activation */
export function getRetailerConnectorStatus(): Array<{
  name: string;
  domain: string;
  active: boolean;
}> {
  return RETAILER_CONNECTORS.map(({ name, domain, active }) => ({ name, domain, active }));
}
