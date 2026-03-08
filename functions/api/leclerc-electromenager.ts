/**
 * Cloudflare Pages Function — Catalogue Électroménager E.Leclerc
 * Route : /api/leclerc-electromenager
 */
import { createLeclercCategoryHandlers } from './_leclercSearch';

export const { onRequestOptions, onRequestGet } = createLeclercCategoryHandlers({
  categorySlug: 'electromenager',
  source: 'leclerc_electromenager',
});
