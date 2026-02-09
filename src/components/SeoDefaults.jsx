import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_TITLE = 'A KI PRI SA YÉ';
const BASE_DESCRIPTION =
  "Plateforme citoyenne d'observation et de comparaison des prix en Outre-mer.";

export default function SeoDefaults() {
  const location = useLocation();
  const canonical =
    typeof window !== 'undefined'
      ? `${window.location.origin}/#${location.pathname}`
      : undefined;

  return (
    <Helmet>
      <title>{BASE_TITLE}</title>
      <meta name="description" content={BASE_DESCRIPTION} />
      <meta name="robots" content="index,follow" />
      <meta property="og:site_name" content={BASE_TITLE} />
      <meta property="og:title" content={BASE_TITLE} />
      <meta property="og:description" content={BASE_DESCRIPTION} />
      <meta property="og:type" content="website" />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={BASE_TITLE} />
      <meta name="twitter:description" content={BASE_DESCRIPTION} />
    </Helmet>
  );
}
