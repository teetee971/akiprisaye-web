import { useEffect } from 'react';

const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';
const SITE_LOGO = `${SITE_URL}/logo-akiprisaye.svg`;

export default function StructuredData() {
  useEffect(() => {
    // Organization Schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'A KI PRI SA YÉ',
      alternateName: 'AKPSY',
      url: SITE_URL,
      logo: SITE_LOGO,
      description: 'Plateforme citoyenne de transparence des prix en Outre-mer',
      foundingDate: '2025',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'FR',
        addressRegion: 'Outre-mer',
      },
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['French', 'Creole', 'Spanish'],
      },
    };

    // WebSite Schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'A KI PRI SA YÉ',
      url: SITE_URL,
      description: 'Comparez les prix et luttez contre la vie chère en Outre-mer',
      inLanguage: 'fr-FR',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/comparateur?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    // WebApplication Schema
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'A KI PRI SA YÉ',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    };

    // LocalBusiness Schema (for each territory)
    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#organization`,
      name: 'A KI PRI SA YÉ',
      image: SITE_LOGO,
      description: "Comparateur de prix citoyen pour l'Outre-mer français",
      url: SITE_URL,
      priceRange: 'Gratuit',
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Guadeloupe' },
        { '@type': 'AdministrativeArea', name: 'Martinique' },
        { '@type': 'AdministrativeArea', name: 'Guyane' },
        { '@type': 'AdministrativeArea', name: 'La Réunion' },
        { '@type': 'AdministrativeArea', name: 'Mayotte' },
      ],
    };

    // Add schemas to head
    const addSchema = (schema, id) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    addSchema(organizationSchema, 'organization-schema');
    addSchema(websiteSchema, 'website-schema');
    addSchema(webAppSchema, 'webapp-schema');
    addSchema(localBusinessSchema, 'localbusiness-schema');

    // Cleanup on unmount
    return () => {
      ['organization-schema', 'website-schema', 'webapp-schema', 'localbusiness-schema'].forEach((id) => {
        const script = document.getElementById(id);
        if (script) {
          script.remove();
        }
      });
    };
  }, []);

  return null; // This component doesn't render anything
}
