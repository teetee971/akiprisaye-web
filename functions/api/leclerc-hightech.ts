/**
 * Cloudflare Pages Function — Catalogue High-Tech E.Leclerc
 * Route : /api/leclerc-hightech
 */
import { createLeclercCategoryHandlers } from './_leclercSearch';

export const { onRequestOptions, onRequestGet } = createLeclercCategoryHandlers({
  categorySlug: 'high-tech',
  source: 'leclerc_hightech',
});
