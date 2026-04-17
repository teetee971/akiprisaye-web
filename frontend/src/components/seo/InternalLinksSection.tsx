/**
 * InternalLinksSection.tsx — Dense internal linking component for SEO pages.
 *
 * Renders multiple sections of links to related pages to maximize crawl depth
 * and pass PageRank between related content.
 */

import { Link } from 'react-router-dom';
import { getSimilarProductSlugs } from '../../utils/seoContentEngine';
import { TERRITORY_NAMES } from '../../utils/seoHelpers';

// ── Props ─────────────────────────────────────────────────────────────────────

interface InternalLinksSectionProps {
  productSlug: string;
  productName: string;
  territory: string;
  category: string;
  similarProductSlugs?: string[];
}

// ── Territory config ──────────────────────────────────────────────────────────

const TERRITORY_SLUG_NAMES: Record<string, string> = {
  GP: 'guadeloupe',
  MQ: 'martinique',
  GF: 'guyane',
  RE: 'reunion',
  YT: 'mayotte',
};

const ALL_TERRITORIES = ['GP', 'MQ', 'GF', 'RE', 'YT'];

// ── Small link badge ──────────────────────────────────────────────────────────

function LinkBadge({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-block rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
    >
      {children}
    </Link>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function LinkSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function InternalLinksSection({
  productSlug,
  productName,
  territory,
  category,
  similarProductSlugs,
}: InternalLinksSectionProps) {
  const territoryName = TERRITORY_NAMES[territory] ?? territory;
  const territorySlug = TERRITORY_SLUG_NAMES[territory] ?? 'guadeloupe';
  const otherTerritories = ALL_TERRITORIES.filter((t) => t !== territory);

  // Compute similar product slugs if not pre-supplied
  const similarSlugs =
    similarProductSlugs ?? getSimilarProductSlugs(productSlug, category, territory);

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600">Liens utiles</h2>

      {/* 1 — Other territories */}
      <LinkSection title={`Prix ${productName} dans d'autres territoires`}>
        {otherTerritories.map((t) => (
          <LinkBadge
            key={t}
            to={`/prix/${productSlug}-${TERRITORY_SLUG_NAMES[t] ?? t.toLowerCase()}`}
          >
            {TERRITORY_NAMES[t] ?? t}
          </LinkBadge>
        ))}
      </LinkSection>

      {/* 2 — Similar products */}
      <LinkSection title={`Produits similaires en ${territoryName}`}>
        {similarSlugs.map((slug) => {
          const label = slug
            .replace(new RegExp(`-${territorySlug}$`), '')
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          return (
            <LinkBadge key={slug} to={`/prix/${slug}`}>
              {label}
            </LinkBadge>
          );
        })}
      </LinkSection>

      {/* 3 — Retailer comparisons */}
      <LinkSection title="Comparatifs enseignes">
        <LinkBadge to={`/comparer/carrefour-vs-leclerc-${territorySlug}`}>
          Carrefour vs Leclerc en {territoryName}
        </LinkBadge>
        <LinkBadge to={`/comparer/leclerc-vs-super-u-${territorySlug}`}>
          Leclerc vs Super U en {territoryName}
        </LinkBadge>
        <LinkBadge to={`/comparer/carrefour-vs-super-u-${territorySlug}`}>
          Carrefour vs Super U en {territoryName}
        </LinkBadge>
      </LinkSection>

      {/* 4 — Inflation links */}
      <LinkSection title={`Inflation ${territoryName}`}>
        <LinkBadge to={`/inflation/alimentaire-${territorySlug}-2026`}>
          📈 Inflation alimentaire 2026
        </LinkBadge>
        <LinkBadge to={`/inflation/${category}-${territorySlug}-2026`}>
          📈 Inflation {category} 2026
        </LinkBadge>
        <LinkBadge to={`/inflation/boissons-${territorySlug}-2026`}>
          📈 Inflation boissons 2026
        </LinkBadge>
      </LinkSection>

      {/* 5 — Guide prix */}
      <LinkSection title="Guide prix">
        <LinkBadge to={`/guide-prix/${productSlug}-${territorySlug}`}>
          📖 Guide prix {productName}
        </LinkBadge>
        <LinkBadge to={`/moins-cher/${territorySlug}`}>
          💰 Produits moins chers en {territoryName}
        </LinkBadge>
      </LinkSection>

      {/* 6 — Pillar pages */}
      <LinkSection title="Pages guides">
        <LinkBadge to="/guide-prix-alimentaire-dom">🍽️ Guide prix alimentaire DOM</LinkBadge>
        <LinkBadge to="/comparateur-supermarches-dom">🏪 Comparateur supermarchés DOM</LinkBadge>
        <LinkBadge to="/inflation-alimentaire-dom">📊 Analyse inflation DOM</LinkBadge>
        <LinkBadge to="/ou-faire-courses-dom">🛒 Où faire ses courses en DOM ?</LinkBadge>
      </LinkSection>
    </div>
  );
}
