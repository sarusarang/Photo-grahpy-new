/**
 * EX SHARE ATELIER — Dynamic SEO and Social Graph Utility
 * Dynamically updates document title and OpenGraph / Twitter meta tags
 * for social platforms (WhatsApp, Facebook, Twitter/X, LinkedIn, iMessage).
 */

export interface SeoMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const DEFAULT_SEO_TITLE = 'EX SHARE — Premium Photography Gallery Platform & Client Proofing';
export const DEFAULT_SEO_DESCRIPTION =
  'Delivering bespoke editorial client proofing, high-resolution photo galleries, 4K cinematic video reels, and AI biometric search for professional photographers.';
export const DEFAULT_SEO_IMAGE = 'https://exshare.ai/ex-share-white-logo.png';
export const PRODUCTION_DOMAIN = 'https://exshare.ai';

/**
 * Updates browser title and social Open Graph / Twitter Card meta tags dynamically.
 */
export function updatePageSeo(meta: SeoMetadata = {}): void {
  if (typeof document === 'undefined') return;

  const fullTitle = meta.title
    ? `${meta.title} | EX SHARE`
    : DEFAULT_SEO_TITLE;
  const description = meta.description || DEFAULT_SEO_DESCRIPTION;
  const image = meta.image
    ? (meta.image.startsWith('http') ? meta.image : `${PRODUCTION_DOMAIN}${meta.image.startsWith('/') ? '' : '/'}${meta.image}`)
    : DEFAULT_SEO_IMAGE;

  // Resolve canonical URL against production domain https://exshare.ai
  let currentUrl = meta.url;
  if (!currentUrl) {
    const path = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/';
    currentUrl = `${PRODUCTION_DOMAIN}${path.startsWith('/') ? '' : '/'}${path}`;
  } else if (!currentUrl.startsWith('http')) {
    currentUrl = `${PRODUCTION_DOMAIN}${currentUrl.startsWith('/') ? '' : '/'}${currentUrl}`;
  } else if (currentUrl.includes('localhost') || currentUrl.includes('devtunnels.ms')) {
    currentUrl = currentUrl.replace(/https?:\/\/[^/]+/, PRODUCTION_DOMAIN);
  }

  // 1. Update Document Title
  document.title = fullTitle;

  // 2. Canonical Link Tag
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', currentUrl);

  // 3. Helper to set or create meta tag
  const setMetaTag = (attribute: 'name' | 'property', attributeValue: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 4. Primary Search Engine Meta
  setMetaTag('name', 'title', fullTitle);
  setMetaTag('name', 'description', description);

  // 5. OpenGraph Tags (WhatsApp, Facebook, LinkedIn, iMessage, Slack)
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:secure_url', image);
  setMetaTag('property', 'og:image:type', 'image/png');
  setMetaTag('property', 'og:image:alt', fullTitle);
  setMetaTag('property', 'og:url', currentUrl);
  setMetaTag('property', 'og:type', meta.type || 'website');
  setMetaTag('property', 'og:site_name', 'EX SHARE Atelier');

  // 6. Twitter / X Card Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
  setMetaTag('name', 'twitter:image:alt', fullTitle);
}
