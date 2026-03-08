import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
}

const SITE_NAME = 'A KI PRI SA YÉ';
const DEFAULT_DESC = 'Observatoire des prix dans les DOM-COM — comparez, analysez et anticipez la vie chère en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte.';

export function SEOHead({ title, description, canonical }: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const desc = description ?? DEFAULT_DESC;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
