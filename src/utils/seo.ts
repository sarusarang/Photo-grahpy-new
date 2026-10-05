/**
 * EX SHARE ATELIER — Dynamic SEO and Social Graph Utility
 * Dynamically updates document title and OpenGraph / Twitter meta tags
 * for social platforms (WhatsApp, Facebook, Twitter/X, LinkedIn, iMessage, Slack, Pinterest).
 */

import {
  getFrontendBaseUrl,
  getGalleryShareUrl,
  getEventShareUrl,
  getPortfolioShareUrl,
} from './domain';
import {
  getInitialGalleryCover,
  FALLBACK_GALLERY_COVER,
  INITIAL_GALLERY_COVERS,
} from './coverImageUtils';
import type { Gallery } from '../types';
import type { LiveEvent } from '../types/event';
import type { PortfolioConfig } from '../types/portfolio';

export interface SeoMetadata {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  keywords?: string[];
  twitterCard?: 'summary_large_image' | 'summary';
}

export const DEFAULT_SEO_TITLE = 'EX SHARE — Premium Photography Gallery Platform & Client Proofing';
export const DEFAULT_SEO_DESCRIPTION =
  'Delivering bespoke editorial client proofing, high-resolution photo galleries, 4K cinematic video reels, and AI biometric search for professional photographers.';
export const DEFAULT_SEO_IMAGE = 'https://exshare.ai/ex-share-balck-logo.png';
export const PRODUCTION_DOMAIN = 'https://exshare.ai';

/**
 * Normalizes any image URL to a clean, absolute HTTPS URL required by
 * social scrapers (WhatsApp, Facebook, iMessage, Twitter, etc.).
 */
export function resolveAbsoluteImageUrl(
  imageUrl?: string | null,
  fallbackUrl: string = DEFAULT_SEO_IMAGE
): string {
  if (!imageUrl || !imageUrl.trim()) {
    return fallbackUrl;
  }

  const clean = imageUrl.trim();

  // Already a full absolute HTTP/HTTPS URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const activeDomain = getFrontendBaseUrl();

  // Relative path starting with slash or without
  if (clean.startsWith('/')) {
    return `${activeDomain}${clean}`;
  }

  return `${activeDomain}/${clean}`;
}

/**
 * Updates browser title and social Open Graph / Twitter Card meta tags dynamically in the DOM.
 */
export function updatePageSeo(meta: SeoMetadata = {}): void {
  if (typeof document === 'undefined') return;

  const activeDomain = getFrontendBaseUrl();
  const fullTitle = meta.title
    ? (meta.title.includes('EX SHARE') ? meta.title : `${meta.title} | EX SHARE`)
    : DEFAULT_SEO_TITLE;
  const description = meta.description?.trim() || DEFAULT_SEO_DESCRIPTION;
  const image = resolveAbsoluteImageUrl(meta.image, DEFAULT_SEO_IMAGE);
  const imageAlt = meta.imageAlt || fullTitle;
  const imageWidth = String(meta.imageWidth || 1200);
  const imageHeight = String(meta.imageHeight || 630);
  const type = meta.type || 'website';
  const siteName = meta.siteName || 'EX SHARE Atelier';

  // Resolve canonical URL against active domain
  let currentUrl = meta.url;
  if (!currentUrl) {
    const path = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/';
    currentUrl = `${activeDomain}${path.startsWith('/') ? '' : '/'}${path}`;
  } else if (!currentUrl.startsWith('http')) {
    currentUrl = `${activeDomain}${currentUrl.startsWith('/') ? '' : '/'}${currentUrl}`;
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
  if (meta.author) {
    setMetaTag('name', 'author', meta.author);
  }
  if (meta.keywords && meta.keywords.length > 0) {
    setMetaTag('name', 'keywords', meta.keywords.join(', '));
  }

  // 5. OpenGraph Tags (WhatsApp, Facebook, LinkedIn, iMessage, Slack, Telegram)
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:secure_url', image);
  setMetaTag('property', 'og:image:type', image.endsWith('.png') ? 'image/png' : 'image/jpeg');
  setMetaTag('property', 'og:image:width', imageWidth);
  setMetaTag('property', 'og:image:height', imageHeight);
  setMetaTag('property', 'og:image:alt', imageAlt);
  setMetaTag('property', 'og:url', currentUrl);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:site_name', siteName);

  if (meta.publishedTime) {
    setMetaTag('property', 'article:published_time', meta.publishedTime);
  }
  if (meta.author) {
    setMetaTag('property', 'article:author', meta.author);
  }

  // 6. Twitter / X Card Tags
  setMetaTag('name', 'twitter:card', meta.twitterCard || 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
  setMetaTag('name', 'twitter:image:alt', imageAlt);
}

/**
 * Formats tailored SEO and social metadata for a client gallery.
 * Uses the gallery's cover/hero banner or active photo as the primary shareable image.
 */
export function getGallerySeoMeta(
  gallery: Gallery,
  options?: {
    activePhotoId?: string;
    photographerName?: string;
  }
): SeoMetadata {
  const activePhoto = options?.activePhotoId
    ? gallery.media.find((m) => m.id === options.activePhotoId)
    : undefined;

  // Primary share image: active photo > template banner > gallery cover > first media > default template cover
  const rawImage =
    activePhoto?.url ||
    (gallery.templateId && gallery.templateBanners?.[gallery.templateId]) ||
    gallery.coverImage ||
    gallery.media?.[0]?.url ||
    getInitialGalleryCover(gallery.templateId);

  const heroImage = resolveAbsoluteImageUrl(rawImage, DEFAULT_SEO_IMAGE);

  const clientName = gallery.clientName?.trim() || 'Valued Client';
  const photoCount = gallery.media?.length || gallery.photosCount || 0;
  const countLabel = photoCount > 0 ? `${photoCount} high-resolution photograph${photoCount === 1 ? '' : 's'}` : 'curated collection';

  const dateFormatted = gallery.eventDate
    ? new Date(gallery.eventDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const title = activePhoto?.title
    ? `${activePhoto.title} — ${gallery.title}`
    : `${gallery.title} — Photography Collection`;

  const description = activePhoto?.caption
    ? `${activePhoto.caption} • From the curated collection "${gallery.title}" for ${clientName} on EX SHARE.`
    : `Explore the private client photography collection "${gallery.title}" for ${clientName}${
        options?.photographerName ? ` by ${options.photographerName}` : ''
      }${dateFormatted ? ` • ${dateFormatted}` : ''}. Featuring ${countLabel}, bespoke proofing, and instant downloads.`;

  return {
    title,
    description,
    image: heroImage,
    imageAlt: `${gallery.title} — Curated by ${options?.photographerName || 'EX SHARE Atelier'}`,
    imageWidth: 1200,
    imageHeight: 630,
    url: getGalleryShareUrl(gallery.slug || gallery.id, options?.activePhotoId),
    type: 'article',
    author: options?.photographerName,
    publishedTime: gallery.createdAt,
    keywords: [
      'photography gallery',
      'client proofing',
      gallery.title,
      clientName,
      'EX SHARE',
      gallery.templateId,
    ],
    twitterCard: 'summary_large_image',
  };
}

/**
 * Formats tailored SEO and social metadata for a live event.
 * Uses the event's hero banner as the primary shareable image.
 */
export function getEventSeoMeta(
  event: LiveEvent,
  photographerName?: string
): SeoMetadata {
  const rawImage =
    event.bannerUrl ||
    event.media?.[0]?.url ||
    INITIAL_GALLERY_COVERS.editorial;

  const heroImage = resolveAbsoluteImageUrl(rawImage, DEFAULT_SEO_IMAGE);

  const dateFormatted = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const locationPart = [event.venue, event.city].filter(Boolean).join(', ');

  const title = `${event.title} — Live Event & AI Photo Discovery`;

  const description =
    event.description?.trim() ||
    `Live photography gallery for "${event.title}"${locationPart ? ` at ${locationPart}` : ''}${
      photographerName ? ` by ${photographerName}` : ''
    }${dateFormatted ? ` • ${dateFormatted}` : ''}. Find your photos instantly with AI facial recognition search and download high-resolution captures.`;

  return {
    title,
    description,
    image: heroImage,
    imageAlt: `${event.title} — Event Photography Stream`,
    imageWidth: 1200,
    imageHeight: 630,
    url: getEventShareUrl(event.slug || event.id),
    type: 'article',
    author: photographerName,
    publishedTime: event.eventDate,
    keywords: [
      'event photography',
      'AI face search',
      'live photos',
      event.title,
      event.eventType,
      'EX SHARE',
    ],
    twitterCard: 'summary_large_image',
  };
}

/**
 * Formats tailored SEO and social metadata for a photographer's portfolio showcase.
 * Uses the portfolio's hero banner or avatar as the primary shareable image.
 */
export function getPortfolioSeoMeta(
  portfolio: PortfolioConfig,
  photographerId?: string
): SeoMetadata {
  const rawImage =
    portfolio.bannerUrl ||
    portfolio.avatarUrl ||
    portfolio.featuredWorks?.[0]?.coverUrl;

  const heroImage = resolveAbsoluteImageUrl(rawImage, DEFAULT_SEO_IMAGE);

  const studio =
    portfolio.studioName?.trim() ||
    portfolio.artistName?.trim() ||
    'Professional Photographer';

  const title = `${studio} — Photography Portfolio & Editorial Works`;

  const description =
    portfolio.tagline?.trim() ||
    portfolio.bio?.trim() ||
    portfolio.aboutStory?.trim() ||
    `Explore bespoke editorial collections, wedding photography portfolios, and commissioned visual works by ${studio}.`;

  return {
    title,
    description,
    image: heroImage,
    imageAlt: `${studio} Portfolio Showcase`,
    imageWidth: 1200,
    imageHeight: 630,
    url: getPortfolioShareUrl(photographerId || 'studio'),
    type: 'profile',
    author: studio,
    keywords: [
      'photography portfolio',
      'editorial photographer',
      studio,
      portfolio.templateId || 'portfolio',
      'EX SHARE',
    ],
    twitterCard: 'summary_large_image',
  };
}

export { INITIAL_GALLERY_COVERS, FALLBACK_GALLERY_COVER };
