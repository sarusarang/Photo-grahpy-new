import { CommonApi } from '@/lib/CommonApi';
import type { Gallery } from '@/types/atelier';

/**
 * 1. Retrieve Public Client Gallery (no auth required)
 * Endpoint: GET /api/public/galleries/{id_or_slug}/
 */
export const GetPublicGalleryApi = async (slugOrId: string): Promise<Gallery> => {
  return CommonApi<Gallery>('GET', `/api/public/galleries/${slugOrId}/`);
};

/**
 * 2. Verify Gallery PIN for Password-Protected Galleries
 * Endpoint: POST /api/public/galleries/{id_or_slug}/verify-pin/
 */
export const VerifyGalleryPinApi = async (
  slugOrId: string,
  pin: string
): Promise<{ status: string; gallery: Gallery; token?: string }> => {
  return CommonApi('POST', `/api/public/galleries/${slugOrId}/verify-pin/`, { pin });
};

/**
 * 3. Track Public Gallery Views for Telemetry
 * Endpoint: POST /api/public/galleries/{id_or_slug}/track-view/
 */
export const TrackGalleryViewApi = async (
  slugOrId: string,
  device: 'desktop' | 'mobile' | 'tablet' = 'desktop',
  referrer: string = 'direct'
): Promise<{ success: boolean }> => {
  return CommonApi('POST', `/api/public/galleries/${slugOrId}/track-view/`, { device, referrer });
};

/**
 * 4. Client Heart Favorite Selection on Public Gallery
 * Endpoint: POST /api/public/galleries/{id_or_slug}/favorite/
 */
export const TrackGalleryFavoriteApi = async (
  slugOrId: string,
  mediaId: string,
  isFavorite: boolean = true
): Promise<{ status: string; is_favorite: boolean }> => {
  return CommonApi('POST', `/api/public/galleries/${slugOrId}/favorite/`, {
    media_id: mediaId,
    is_favorite: isFavorite,
  });
};

/**
 * 5. Stream High-Speed ZIP Download URL
 * Endpoint: GET /api/public/galleries/{id_or_slug}/download-zip/
 */
export const GetGalleryDownloadZipUrl = (slugOrId: string, section?: string): string => {
  const base = (import.meta.env.VITE_API_BASE_URL || 'https://pv0smzkc-8000.inc1.devtunnels.ms/api').trim();
  const normalized = base.endsWith('/') ? base : `${base}/`;
  const url = new URL(`${normalized}public/galleries/${slugOrId}/download-zip/`);
  if (section) url.searchParams.set('section', section);
  return url.toString();
};
