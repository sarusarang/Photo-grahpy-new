/**
 * EX SHARE ATELIER — Canonical Domain & Share Link Utilities
 * Production Front-End Domain: https://exshare.ai
 */

export const FRONTEND_DOMAIN = 'https://exshare.ai';

/**
 * Returns canonical client share URL for a gallery or specific photo
 * Example: https://exshare.ai/gallery/wedding-shoot
 */
export const getGalleryShareUrl = (slugOrId: string, photoId?: string): string => {
  const cleanSlug = encodeURIComponent(String(slugOrId || '').trim());
  const base = `${FRONTEND_DOMAIN}/gallery/${cleanSlug}`;
  return photoId ? `${base}?photo=${encodeURIComponent(photoId)}` : base;
};

/**
 * Returns canonical preview URL with template overrides
 * Example: https://exshare.ai/gallery/wedding-shoot?previewTemplate=cinematic
 */
export const getGalleryPreviewUrl = (slugOrId: string, templateId?: string): string => {
  const cleanSlug = encodeURIComponent(String(slugOrId || '').trim());
  const base = `${FRONTEND_DOMAIN}/gallery/${cleanSlug}`;
  return templateId ? `${base}?previewTemplate=${encodeURIComponent(templateId)}` : base;
};

/**
 * Returns canonical portfolio URL for studio public showcase
 * Example: https://exshare.ai/portfolio/studio-name
 */
export const getPortfolioShareUrl = (portfolioIdOrUsername: string): string => {
  const clean = encodeURIComponent(String(portfolioIdOrUsername || '').trim());
  return `${FRONTEND_DOMAIN}/portfolio/${clean}`;
};
