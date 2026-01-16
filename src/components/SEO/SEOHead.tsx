/**
 * SEOHead Component
 * Comprehensive SEO meta tags using react-helmet-async
 */

import { Helmet } from 'react-helmet-async';
import { generateMetadata, type PageMetadata } from '../../lib/seo/metadata';
import { StructuredData } from './StructuredData';

interface SEOHeadProps extends PageMetadata {
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  nofollow?: boolean;
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author,
  structuredData,
  noindex = false,
  nofollow = false,
}: SEOHeadProps) {
  const meta = generateMetadata({
    title,
    description,
    keywords,
    image,
    url,
    type,
    author,
  });

  const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{meta.title}</title>
        <meta name="title" content={meta.title} />
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="author" content={author || 'A KI PRI SA YÉ'} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={meta.canonical} />
        
        {/* Robots */}
        <meta name="robots" content={robotsContent} />
        <meta name="googlebot" content={`${robotsContent}, max-snippet:-1, max-image-preview:large, max-video-preview:-1`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content={meta.ogType} />
        <meta property="og:url" content={meta.ogUrl} />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content={meta.ogLocale} />
        <meta property="og:site_name" content={meta.ogSiteName} />
        
        {/* Twitter */}
        <meta name="twitter:card" content={meta.twitterCard} />
        <meta name="twitter:url" content={meta.ogUrl} />
        <meta name="twitter:title" content={meta.twitterTitle} />
        <meta name="twitter:description" content={meta.twitterDescription} />
        <meta name="twitter:image" content={meta.twitterImage} />
        <meta name="twitter:creator" content={meta.twitterCreator} />
        
        {/* Additional SEO */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="format-detection" content="telephone=no" />
      </Helmet>
      
      {/* Structured Data */}
      {structuredData && <StructuredData data={structuredData} />}
    </>
  );
}
