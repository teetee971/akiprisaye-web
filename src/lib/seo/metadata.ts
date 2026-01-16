/**
 * SEO Metadata Utility for react-helmet-async
 * Generates comprehensive meta tags for optimal SEO
 */

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface MetaTags {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogLocale: string;
  ogSiteName: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCreator: string;
}

const BASE_URL = 'https://akiprisaye.pages.dev';
const SITE_NAME = 'A KI PRI SA YÉ';
const DEFAULT_IMAGE = `${BASE_URL}/splash_lancement_appli.png`;
const DEFAULT_KEYWORDS = [
  'prix',
  'outre-mer',
  'DOM-TOM',
  'comparateur',
  'vie chère',
  'Guadeloupe',
  'Martinique',
  'Réunion',
  'Guyane',
  'Mayotte'
];

/**
 * Generate comprehensive meta tags for SEO
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  author = SITE_NAME,
}: PageMetadata): MetaTags {
  // Ensure URLs are absolute
  const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const absoluteImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  
  // Create full title with site name
  const fullTitle = title.includes(SITE_NAME) 
    ? title 
    : `${title} | ${SITE_NAME}`;
  
  // Combine keywords
  const allKeywords = [...DEFAULT_KEYWORDS, ...keywords].join(', ');
  
  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    canonical: absoluteUrl,
    
    // Open Graph
    ogType: type,
    ogTitle: fullTitle,
    ogDescription: description,
    ogUrl: absoluteUrl,
    ogImage: absoluteImage,
    ogLocale: 'fr_FR',
    ogSiteName: SITE_NAME,
    
    // Twitter
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: description,
    twitterImage: absoluteImage,
    twitterCreator: '@akiprisaye',
  };
}

/**
 * Validate meta tag lengths for SEO best practices
 */
export function validateMetadata(metadata: MetaTags): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Title should be 50-60 characters
  if (metadata.title.length > 60) {
    warnings.push(`Title too long (${metadata.title.length} chars, recommended: <60)`);
  }
  
  // Description should be 150-160 characters
  if (metadata.description.length > 160) {
    warnings.push(`Description too long (${metadata.description.length} chars, recommended: <160)`);
  }
  if (metadata.description.length < 50) {
    warnings.push(`Description too short (${metadata.description.length} chars, recommended: >50)`);
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Generate robots meta content
 */
export function generateRobotsMeta(options: {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  noimageindex?: boolean;
} = {}): string {
  const {
    index = true,
    follow = true,
    noarchive = false,
    noimageindex = false,
  } = options;
  
  const directives: string[] = [];
  
  directives.push(index ? 'index' : 'noindex');
  directives.push(follow ? 'follow' : 'nofollow');
  
  if (noarchive) directives.push('noarchive');
  if (noimageindex) directives.push('noimageindex');
  
  return directives.join(', ');
}
