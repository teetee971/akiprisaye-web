import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_TITLE = 'A KI PRI SA YÉ';
const BASE_DESCRIPTION =
  "Plateforme citoyenne d'observation et de comparaison des prix en Outre-mer.";

const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';

const ROUTE_SEO = {
  '/': {
    title: 'A KI PRI SA YÉ – Accueil',
    description:
      "Accueil de la plateforme citoyenne pour comparer les prix et suivre l'évolution du coût de la vie en Outre-mer.",
  },
  '/comparateur': {
    title: 'Comparateur des prix – A KI PRI SA YÉ',
    description:
      'Comparez les prix par enseigne et par territoire pour identifier rapidement les écarts les plus importants.',
  },
  '/observatoire': {
    title: 'Observatoire des prix – A KI PRI SA YÉ',
    description:
      "Explorez les indicateurs de l'observatoire citoyen des prix en Outre-mer, mis à jour avec des données terrain.",
  },
};

export default function SeoDefaults() {
  const location = useLocation();
  const routeSeo = ROUTE_SEO[location.pathname] ?? {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
  };
  const canonical = `${SITE_URL}${location.pathname}`;

  return (
    <Helmet>
      <title>{routeSeo.title}</title>
      <meta name="description" content={routeSeo.description} />
      <meta name="robots" content="index,follow" />
      <meta property="og:site_name" content={BASE_TITLE} />
      <meta property="og:title" content={routeSeo.title} />
      <meta property="og:description" content={routeSeo.description} />
      <meta property="og:type" content="website" />
      {<meta property="og:url" content={canonical} />}
      {<link rel="canonical" href={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={routeSeo.title} />
      <meta name="twitter:description" content={routeSeo.description} />
    </Helmet>
  );
}
