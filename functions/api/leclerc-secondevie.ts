/**
 * Cloudflare Pages Function — Catalogue Seconde Vie E.Leclerc
 * Produits reconditionnés au meilleur prix.
 * Route : /api/leclerc-secondevie
 */
import { createLeclercCategoryHandlers } from './_leclercSearch';

export const { onRequestOptions, onRequestGet } = createLeclercCategoryHandlers({
  categorySlug: 'seconde-vie',
  source: 'leclerc_secondevie',
});
