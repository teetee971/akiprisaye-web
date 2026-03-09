import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  /** Absolute URL of the og:image / twitter:image (defaults to site icon) */
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  /** twitter:card type — defaults to 'summary_large_image' */
  twitterCard?: 'summary' | 'summary_large_image';
  /** Set to true for admin / private pages */
  noIndex?: boolean;
}

const SITE_NAME = 'A KI PRI SA YÉ';
const SITE_URL  = 'https://teetee971.github.io/akiprisaye-web/';
const DEFAULT_DESC = 'Observatoire des prix dans les DOM-COM — comparez, analysez et anticipez la vie chère en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte.';
const DEFAULT_OG_IMAGE     = `${SITE_URL}icon-512.png`;
const DEFAULT_OG_IMAGE_ALT = 'Logo A KI PRI SA YÉ — transparence des prix Outre-mer';

export function SEOHead({
  title,
  description,
  canonical,
  ogImage        = DEFAULT_OG_IMAGE,
  ogImageAlt     = DEFAULT_OG_IMAGE_ALT,
  ogImageWidth   = 512,
  ogImageHeight  = 512,
  twitterCard    = 'summary_large_image',
  noIndex        = false,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const desc      = description ?? DEFAULT_DESC;
  const pageUrl   = canonical ?? SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name"    content={SITE_NAME} />
      <meta property="og:type"         content="website" />
      <meta property="og:url"          content={pageUrl} />
      <meta property="og:title"        content={fullTitle} />
      <meta property="og:description"  content={desc} />
      <meta property="og:locale"       content="fr_FR" />
      <meta property="og:image"        content={ogImage} />
      <meta property="og:image:alt"    content={ogImageAlt} />
      <meta property="og:image:width"  content={String(ogImageWidth)} />
      <meta property="og:image:height" content={String(ogImageHeight)} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content={twitterCard} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={ogImage} />
      <meta name="twitter:image:alt"   content={ogImageAlt} />

      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
