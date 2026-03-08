/**
 * Cloudflare Pages Function — Catalogue Parapharmacie E.Leclerc
 * Route : /api/leclerc-parapharmacie
 */
import { createLeclercCategoryHandlers } from './_leclercSearch';

export const { onRequestOptions, onRequestGet } = createLeclercCategoryHandlers({
  categorySlug: 'parapharmacie',
  source: 'leclerc_parapharmacie',
});
