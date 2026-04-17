/**
 * SEOComparateurSlugPage.tsx — Dynamic comparator long-tail page (V2/V3)
 *
 * Route: /comparateur/:slug
 *
 * Examples:
 *   /comparateur/coca-cola-guadeloupe
 *   /comparateur/huile-tournesol-martinique
 *   /comparateur/riz-basmati-guyane
 *
 * Targets long-tail queries like:
 *   "comparateur coca cola guadeloupe"
 *   "prix huile tournesol martinique"
 *   "meilleur prix riz guyane"
 *
 * Features:
 *   - Unique H1 per product × territory combination
 *   - 2–3 territory-specific paragraphs (local prices, local retailers)
 *   - Comparative price table (live API only)
 *   - "Top deals du jour" block (TopDealsSection)
 *   - Schema.org Product + AggregateOffer JSON-LD
 *   - Sticky mobile CTA
 *   - trackEvent('page_view') on mount
 */

import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick } from '../utils/priceClickTracker';
import { getTerritoryName, TERRITORY_SLUG_MAP, SITE_URL } from '../utils/seoHelpers';
import {
  getPageAngle,
  generatePageIntro,
  generatePriceTip,
  generateFaqItems,
} from '../utils/seoContentEngine';
import ConversionStickyBar from '../components/business/ConversionStickyBar';
import TopDealsSection from '../components/ui/TopDealsSection';
import { trackEvent } from '../utils/eventTracker';
import { useEffect } from 'react';
import type { Deal } from '../modules/topDealsEngine';
import { liveApiFetchJson } from '../services/liveApiClient';

// ── Price coefficients per territory ─────────────────────────────────────────

const PRICE_COEFFICIENTS: Record<string, number> = {
  GP: 1.18,
  MQ: 1.16,
  GF: 1.22,
  RE: 1.14,
  YT: 1.25,
};

const LOCAL_RETAILERS: Record<string, string[]> = {
  GP: ['Carrefour', 'E.Leclerc', 'Super U', 'Leader Price', 'Intermarché'],
  MQ: ['Carrefour', 'E.Leclerc', 'Super U', 'Leader Price'],
  GF: ['Carrefour', 'Super U', 'Géant Casino'],
  RE: ['Carrefour', 'E.Leclerc', 'Super U', 'Jumbo'],
  YT: ['Carrefour', 'Super U'],
};

const LOCAL_ENSEIGNE_NOTES: Record<string, string> = {
  GP: "En Guadeloupe, les enseignes principales sont Carrefour, E.Leclerc et Super U. Les écarts de prix peuvent dépasser 20 % selon l'enseigne.",
  MQ: 'En Martinique, Carrefour et E.Leclerc dominent le marché. Leader Price propose souvent les tarifs les plus compétitifs sur les produits du quotidien.',
  GF: 'En Guyane, le coût de la vie est parmi les plus élevés de France. Carrefour et Super U sont les principaux points de vente.',
  RE: 'À La Réunion, la concurrence entre E.Leclerc et Carrefour bénéficie aux consommateurs. Jumbo Score propose également des offres régulières.',
  YT: "À Mayotte, l'offre commerciale est plus limitée. Carrefour reste la référence principale pour la grande distribution.",
};

type RetailerPrice = { retailer: string; price: number; isBest?: boolean };

// ── Slug parser: "coca-cola-guadeloupe" → { product, territory } ─────────────

function parseSlug(slug: string): {
  productSlug: string;
  territory: string;
  territoryName: string;
} {
  const territories = Object.entries(TERRITORY_SLUG_MAP);
  for (const [tSlug, tCode] of territories) {
    if (slug.endsWith(`-${tSlug}`)) {
      const productSlug = slug.slice(0, slug.length - tSlug.length - 1);
      return { productSlug, territory: tCode, territoryName: getTerritoryName(tCode) };
    }
  }
  // No territory found — default to Guadeloupe
  return { productSlug: slug, territory: 'GP', territoryName: 'Guadeloupe' };
}

function humanise(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Simple sanitizer for strings included in JSON-LD, to constrain user-controlled
// values coming from the URL before they are passed to dangerouslySetInnerHTML.
function sanitizeJsonLdString(value: string): string {
  // Ensure value is a string and remove characters outside a conservative allow-list.
  const str = String(value);
  // Allow letters (including basic accented), digits, spaces and common punctuation.
  return str.replace(/[^\p{L}\p{N}\s.,'’\-]/gu, ' ');
}

// ── Seed deals for TopDealsSection (same territory) ──────────────────────────

function makeSeedDeals(productSlug: string, territory: string): Deal[] {
  return [];
}

// ── Page component ────────────────────────────────────────────────────────────

export default function SEOComparateurSlugPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [livePrices, setLivePrices] = useState<RetailerPrice[]>([]);

  const { productSlug, territory, territoryName } = useMemo(() => parseSlug(slug), [slug]);
  const productName = humanise(productSlug);
  const prices = livePrices;
  const bestPrice = prices[0] ?? { retailer: 'N/A', price: 0 };
  const worstPrice = prices[prices.length - 1] ?? bestPrice;
  const saving = +(worstPrice.price - bestPrice.price).toFixed(2);

  const angle = getPageAngle(slug);
  const intro = generatePageIntro(productName, territory, angle);
  const tip = generatePriceTip(productName, territory, angle);
  const faqs = generateFaqItems(productName, territory, angle);
  const deals = useMemo(() => makeSeedDeals(productSlug, territory), [productSlug, territory]);

  const enseigneNote = LOCAL_ENSEIGNE_NOTES[territory] ?? LOCAL_ENSEIGNE_NOTES.GP;
  const pageUrl = `${SITE_URL}/comparateur/${slug}`;

  useEffect(() => {
    trackEvent('page_view', { page: `/comparateur/${slug}`, product: productName });
  }, [slug, productName]);

  useEffect(() => {
    let cancelled = false;

    const loadLivePrices = async () => {
      try {
        const payload = await liveApiFetchJson<{
          prices?: Array<{ retailer: string; price: number }>;
        }>(`/comparateur/${encodeURIComponent(slug)}/prices`, {
          incidentReason: 'seo_comparator_api_unavailable',
          timeoutMs: 8000,
        });
        const rows = Array.isArray(payload?.prices) ? payload.prices : [];
        const normalized = rows
          .filter((row) => typeof row?.retailer === 'string' && typeof row?.price === 'number')
          .sort((a, b) => a.price - b.price)
          .map((row, index) => ({ ...row, isBest: index === 0 }));

        if (!cancelled) {
          setLivePrices(normalized);
        }
      } catch {
        if (!cancelled) setLivePrices([]);
      }
    };

    if (!slug) return undefined;
    void loadLivePrices();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // JSON-LD
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: sanitizeJsonLdString(productName),
    description: `Comparateur de prix ${sanitizeJsonLdString(productName)} en ${territoryName}`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: bestPrice.price,
      highPrice: worstPrice.price,
      offerCount: prices.length,
      offers: prices.map((p) => ({
        '@type': 'Offer',
        seller: { '@type': 'Organization', name: p.retailer },
        price: p.price,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      })),
    },
  });

  // Affiliate URL for the sticky bar
  const affiliateUrl = buildRetailerUrl(bestPrice.retailer, undefined);

  return (
    <>
      <SEOHead
        title={`Prix ${productName} en ${territoryName} — Comparateur | A KI PRI SA YÉ`}
        description={`Comparez le prix de ${productName} entre Carrefour, E.Leclerc et Super U en ${territoryName}. Économisez jusqu'à ${formatEur(saving)} sur ce produit.`}
        canonical={pageUrl}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-zinc-500">
          <Link to="/" className="hover:text-zinc-300">
            Accueil
          </Link>
          {' / '}
          <Link to="/comparateur" className="hover:text-zinc-300">
            Comparateur
          </Link>
          {' / '}
          <span className="text-zinc-400">
            {productName} — {territoryName}
          </span>
        </nav>

        {/* ── H1 unique ──────────────────────────────────────────── */}
        <h1 className="mb-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Prix {productName} en {territoryName}
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Comparez les prix entre {prices.map((p) => p.retailer).join(', ')} — données locales mises
          à jour régulièrement.
        </p>

        {/* ── Urgency + proof ────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap gap-3">
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
            ⏱ Mis à jour récemment
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            📊 +500 comparaisons aujourd'hui
          </span>
        </div>

        {/* ── Price table ────────────────────────────────────────── */}
        <section aria-label="Tableau comparatif des prix" className="mb-8">
          <h2 className="mb-4 text-base font-bold text-white">
            Tableau comparatif — {territoryName}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-4 py-3 text-left font-semibold text-zinc-400">Enseigne</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-400">Prix</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-400">Écart</th>
                  <th className="sr-only">Lien</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p, i) => {
                  const diff = +(p.price - bestPrice.price).toFixed(2);
                  const url = buildRetailerUrl(p.retailer, undefined);
                  return (
                    <tr
                      key={p.retailer}
                      className={`border-b border-white/5 ${p.isBest ? 'bg-emerald-400/[0.06]' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        <span className="mr-2 text-zinc-600">{i + 1}.</span>
                        {p.retailer}
                        {p.isBest && (
                          <span className="ml-2 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                            Meilleur prix
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold tabular-nums ${p.isBest ? 'text-emerald-400' : 'text-white'}`}
                      >
                        {formatEur(p.price)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {diff === 0 ? (
                          <span className="text-emerald-400 font-bold">—</span>
                        ) : (
                          <span className="text-rose-400">+{formatEur(diff)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              trackRetailerClick(slug, p.retailer, territory, p.price);
                              trackEvent('affiliate_click', {
                                product: productName,
                                retailer: p.retailer,
                                price: p.price,
                              });
                            }}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
                            aria-label={`🔥 Voir le meilleur prix pour ${productName} chez ${p.retailer}`}
                          >
                            🔥 Voir le meilleur prix maintenant
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-right text-xs text-zinc-600">
            Économisez jusqu'à{' '}
            <span className="font-bold text-emerald-400">{formatEur(saving)}</span> sur ce produit
          </p>
        </section>

        {/* ── Territory context paragraphs ───────────────────────── */}
        <section
          className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          aria-label="Contexte local"
        >
          <h2 className="text-base font-bold text-white">
            {productName} en {territoryName} : ce qu'il faut savoir
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {intro ??
              `${productName} fait partie des produits les plus achetés en ${territoryName}. Les prix varient selon l'enseigne et la période.`}
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">{enseigneNote}</p>
          {tip && <p className="text-sm leading-relaxed text-emerald-400/80">💡 {tip}</p>}
          {angle === 0 && saving > 0 && (
            <p className="text-sm leading-relaxed text-zinc-400">
              Sur ce seul produit, vous pouvez économiser{' '}
              <strong className="text-white">{formatEur(saving)}</strong> selon l'enseigne choisie.
              Sur un panier complet de 30 produits, l'écart peut atteindre 50–80 € par mois.
            </p>
          )}
        </section>

        {/* ── Top deals du jour (same territory) ────────────────── */}
        <TopDealsSection
          deals={deals}
          title={`🔥 Top deals du jour — ${territoryName}`}
          limit={4}
        />

        {/* ── FAQ ───────────────────────────────────────────────── */}
        {faqs.length > 0 && (
          <section className="mb-8" aria-label="Questions fréquentes">
            <h2 className="mb-4 text-base font-bold text-white">Questions fréquentes</h2>
            <div className="space-y-4">
              {faqs.slice(0, 3).map((faq) => (
                <div key={faq.q} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="mb-1 text-sm font-semibold text-white">{faq.q}</p>
                  <p className="text-sm text-zinc-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Internal links ─────────────────────────────────────── */}
        <section className="text-sm text-zinc-500" aria-label="Voir aussi">
          <p className="mb-2 font-semibold text-zinc-400">Voir aussi</p>
          <ul className="space-y-1">
            <li>
              <Link to={`/prix/${slug}`} className="text-emerald-400/80 hover:text-emerald-400">
                Prix {productName} en {territoryName} →
              </Link>
            </li>
            <li>
              <Link to="/comparateur" className="hover:text-zinc-300">
                Comparateur de prix →
              </Link>
            </li>
            <li>
              <Link to={`/moins-cher/${territory.toLowerCase()}`} className="hover:text-zinc-300">
                Produits les moins chers en {territoryName} →
              </Link>
            </li>
          </ul>
        </section>
      </div>

      {/* ── Sticky mobile CTA ──────────────────────────────────────── */}
      {affiliateUrl && (
        <ConversionStickyBar
          bestPrice={bestPrice.price}
          savings={saving}
          retailer={bestPrice.retailer}
          retailerUrl={affiliateUrl}
          productName={productName}
          territory={territory}
          onCTAClick={() => {
            trackRetailerClick(slug, bestPrice.retailer, territory, bestPrice.price);
            trackEvent('affiliate_click', {
              product: productName,
              retailer: bestPrice.retailer,
              price: bestPrice.price,
            });
          }}
        />
      )}
    </>
  );
}
