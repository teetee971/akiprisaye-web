/**
 * Cloudflare Pages Function — Catalogue Jardin E.Leclerc
 * Route : /api/leclerc-jardin
 */
import { createLeclercCategoryHandlers } from './_leclercSearch';

export const { onRequestOptions, onRequestGet } = createLeclercCategoryHandlers({
  categorySlug: 'jardin',
  source: 'leclerc_jardin',
});
