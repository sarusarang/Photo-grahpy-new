import { CommonApi } from '@/lib/CommonApi';

export interface FaceSearchResult {
  matched_media_ids: string[];
  total_matches: number;
  confidence?: number;
}

/**
 * 1. AI Biometric Face Search in Gallery
 * Endpoint: POST /api/galleries/{galleryId}/face-search/
 */
export const SearchGalleryByFaceApi = async (
  galleryId: string,
  selfieFile: File | Blob
): Promise<FaceSearchResult> => {
  const formData = new FormData();
  formData.append('selfie', selfieFile);
  return CommonApi<FaceSearchResult>('POST', `/api/galleries/${galleryId}/face-search/`, formData);
};

/**
 * 2. AI Biometric Face Search in Live Event (Guest Portal)
 * Endpoint: POST /api/events/{eventId}/face-search/
 */
export const SearchEventByFaceApi = async (
  eventId: string,
  selfieFile: File | Blob
): Promise<FaceSearchResult> => {
  const formData = new FormData();
  formData.append('selfie', selfieFile);
  return CommonApi<FaceSearchResult>('POST', `/api/events/${eventId}/face-search/`, formData);
};
