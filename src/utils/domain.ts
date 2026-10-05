

export const getFrontendBaseUrl = (): string => {
  
  const isProd = Boolean((import.meta as any).env?.PROD);
  const envUrl = (import.meta as any).env?.VITE_FRONTEND_URL || (import.meta as any).env?.VITE_APP_URL;

  // 1. Environment variable override (if not a stale localhost URL in production)
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (!isProd || (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1'))) {
      return trimmed;
    }
  }

  // 2. Dynamic browser window origin (auto-adapts to whatever domain it is hosted on in production or custom ports)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  // 3. Fallback for SSR / build-time evaluation
  return isProd ? 'https://exshare.ai' : 'http://localhost:5173';
};

/**
 * Returns host name for clean display in UI tables & badges (e.g. "localhost:5173" or "exshare.ai")
 */
export const getFrontendHost = (): string => {
  try {
    const url = new URL(getFrontendBaseUrl());
    return url.host;
  } catch {
    return typeof window !== 'undefined' && window.location?.host
      ? window.location.host
      : 'localhost:5173';
  }
};

/**
 * Backward compatibility export
 */
export const FRONTEND_DOMAIN = getFrontendBaseUrl();

/**
 * Returns canonical client share URL for a gallery or specific photo
 * Example: http://localhost:5173/gallery/wedding-shoot
 */
export const getGalleryShareUrl = (slugOrId: string, photoId?: string): string => {
  const cleanSlug = encodeURIComponent(String(slugOrId || '').trim());
  const base = `${getFrontendBaseUrl()}/gallery/${cleanSlug}`;
  return photoId ? `${base}?photo=${encodeURIComponent(photoId)}` : base;
};

/**
 * Returns clean display text for a gallery URL (e.g. "localhost:5173/gallery/wedding-shoot")
 */
export const getGalleryDisplayUrl = (slugOrId: string): string => {
  const host = getFrontendHost();
  const cleanSlug = encodeURIComponent(String(slugOrId || '').trim());
  return `${host}/gallery/${cleanSlug}`;
};

/**
 * Returns preview URL with template overrides
 * Example: http://localhost:5173/gallery/wedding-shoot?previewTemplate=cinematic
 */
export const getGalleryPreviewUrl = (slugOrId: string, templateId?: string): string => {
  const cleanSlug = encodeURIComponent(String(slugOrId || '').trim());
  const base = `${getFrontendBaseUrl()}/gallery/${cleanSlug}`;
  return templateId ? `${base}?previewTemplate=${encodeURIComponent(templateId)}` : base;
};

/**
 * Returns portfolio URL for studio public showcase
 * Example: http://localhost:5173/portfolio/studio-name
 */
export const getPortfolioShareUrl = (portfolioIdOrUsername: string): string => {
  const clean = encodeURIComponent(String(portfolioIdOrUsername || '').trim());
  return `${getFrontendBaseUrl()}/portfolio/${clean}`;
};

/**
 * Returns event guest URL for live QR and guest portal
 * Example: http://localhost:5173/events/event-id
 */
export const getEventShareUrl = (eventIdOrSlug: string): string => {
  const clean = encodeURIComponent(String(eventIdOrSlug || '').trim());
  return `${getFrontendBaseUrl()}/events/${clean}`;
};
