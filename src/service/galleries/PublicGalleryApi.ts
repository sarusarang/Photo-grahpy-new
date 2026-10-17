import { CommonApi } from '@/lib/CommonApi';
import type { Gallery } from '@/types/atelier';
import type {
  VerifyGalleryPinResponse,
  TrackGalleryViewResponse,
  TrackGalleryFavoriteResponse,
} from './type';

/**
 * 1. Retrieve Public Client Gallery (no auth required)
 * Endpoint: GET /api/public/galleries/{id_or_slug}/
 */
export const GetPublicGalleryApi = async (
  slugOrId: string,
  params?: { all_media?: boolean }
): Promise<Gallery> => {
  const query = params?.all_media ? '?all_media=true' : '';
  return CommonApi<Gallery>('GET', `/api/public/galleries/${slugOrId}/${query}`);
};

/**
 * 2. Verify Gallery PIN for Password-Protected Galleries
 * Endpoint: POST /api/public/galleries/{id_or_slug}/verify-pin/
 */
export const VerifyGalleryPinApi = async (
  slugOrId: string,
  pin: string
): Promise<VerifyGalleryPinResponse> => {
  return CommonApi<VerifyGalleryPinResponse>('POST', `/api/public/galleries/${slugOrId}/verify-pin/`, { pin });
};

/**
 * 3. Track Public Gallery Views for Telemetry
 * Endpoint: POST /api/public/galleries/{id_or_slug}/track-view/
 */
export const TrackGalleryViewApi = async (
  slugOrId: string,
  device: 'desktop' | 'mobile' | 'tablet' = 'desktop',
  referrer: string = 'direct'
): Promise<TrackGalleryViewResponse> => {
  return CommonApi<TrackGalleryViewResponse>('POST', `/api/public/galleries/${slugOrId}/track-view/`, { device, referrer });
};

/**
 * 4. Client Heart Favorite Selection on Public Gallery
 * Endpoint: POST /api/public/galleries/{id_or_slug}/favorite/
 */
export const TrackGalleryFavoriteApi = async (
  slugOrId: string,
  mediaId: string,
  isFavorite: boolean = true
): Promise<TrackGalleryFavoriteResponse> => {
  return CommonApi<TrackGalleryFavoriteResponse>('POST', `/api/public/galleries/${slugOrId}/favorite/`, {
    media_id: mediaId,
    is_favorite: isFavorite,
  });
};

/**
 * 5. Stream High-Speed ZIP Download URL
 * Endpoint: GET /api/public/galleries/{id_or_slug}/download-zip/
 */
export const GetGalleryDownloadZipUrl = (slugOrId: string, section?: string, format?: string): string => {
  const base = (import.meta.env.VITE_API_BASE_URL || 'https://server.exshare.ai/api').trim();
  const normalized = base.endsWith('/') ? base : `${base}/`;
  const url = new URL(`${normalized}public/galleries/${slugOrId}/download-zip/`);
  if (section) url.searchParams.set('section', section);
  if (format) url.searchParams.set('format', format === 'original' ? 'raw' : 'jpeg');
  return url.toString();
};
