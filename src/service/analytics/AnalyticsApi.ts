import { CommonApi } from '@/lib/CommonApi';
import type { GalleryAnalyticsData } from '@/types/atelier';

/**
 * 1. Retrieve 30-Day Gallery Analytics & Telemetry
 * Endpoint: GET /api/galleries/{id}/analytics/ or /api/analytics/{id}/
 */
export const GetGalleryAnalyticsApi = async (
  galleryId: string,
  timeRange: string = '30d'
): Promise<GalleryAnalyticsData> => {
  try {
    return await CommonApi<GalleryAnalyticsData>('GET', `/api/galleries/${galleryId}/analytics/`, {
      time_range: timeRange,
    });
  } catch {
    return await CommonApi<GalleryAnalyticsData>('GET', `/api/analytics/${galleryId}/`, {
      time_range: timeRange,
    });
  }
};

/**
 * 2. Log Client Activity Telemetry (Public or Auth)
 * Endpoint: POST /api/public/galleries/{id}/track-activity/ or /api/galleries/{id}/track-activity/
 */
export const TrackGalleryActivityApi = async (
  galleryId: string,
  payload: {
    type: 'view' | 'download' | 'favorite' | 'share';
    device?: string;
    details?: string;
  }
): Promise<{ success: boolean }> => {
  try {
    return await CommonApi('POST', `/api/public/galleries/${galleryId}/track-activity/`, payload);
  } catch {
    return await CommonApi('POST', `/api/galleries/${galleryId}/track-activity/`, payload);
  }
};
