/**
 * productKey.ts — Clé produit stable (slug ASCII hyphen)
 *
 * Génère un identifiant stable pour un produit à partir de son libellé normalisé.
 *
 * Exemples:
 *   toProductKey("Coca-Cola PET 2L")          → "coca-cola-pet-2l"
 *   toProductKey("Lait UHT demi-écrémé U Bio 1L") → "lait-uht-demi-ecreme-u-bio-1l"
 *   toProductKey("Tortillas chips nature U 300g") → "tortillas-chips-nature-u-300g"
 */

import { removeAccents } from './productLabelNormalizer';

/**
 * Génère une clé produit stable à partir d'un libellé normalisé.
 * La clé est un slug ASCII lowercase hyphen-separated, max 80 chars.
 *
 * @param label  - Libellé normalisé (ex: "Coca-Cola PET 2L")
 * @param brand  - Marque optionnelle (non utilisée pour l'instant, réservée extension)
 * @param size   - Grammage optionnel (non utilisé pour l'instant, réservée extension)
 */
export function toProductKey(label: string, _brand?: string | null, _size?: string | null): string {
  return removeAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ') // Garder lettres, chiffres, espaces, tirets
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/-{2,}/g, '-') // Tirets multiples → un seul
    .replace(/^-+|-+$/g, '') // Trim tirets de début/fin
    .slice(0, 80);
}

/** Alias de toProductKey (compatibilité) */
export const generateProductKey = toProductKey;
