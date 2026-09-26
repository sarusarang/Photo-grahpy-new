import { CommonApi } from '@/lib/CommonApi';
import type { LiveEvent, Gallery, MediaItem } from '@/types/atelier';

export interface CreateEventPayload {
  title: string;
  event_type: string;
  venue?: string;
  qr_duration_hours?: number;
  client_name?: string;
  event_date?: string;
}

export interface MoveEventToGalleryPayload {
  target_mode: 'new' | 'existing';
  target_gallery_id?: string | null;
  new_gallery_title?: string;
  category_assignments: Record<string, string>; // mediaId -> Section Title
}

/**
 * 1. List Photographer Live Events
 * Endpoint: GET /api/events/
 */
export const GetEventsApi = async (): Promise<LiveEvent[]> => {
  const res = await CommonApi<LiveEvent[] | { results?: LiveEvent[]; data?: LiveEvent[] }>('GET', '/api/events/');
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as any).results)) return (res as any).results;
  if (res && Array.isArray((res as any).data)) return (res as any).data;
  return [];
};

/**
 * 2. Create Live Event with Automatic QR Expiry
 * Endpoint: POST /api/events/
 */
export const CreateEventApi = async (payload: CreateEventPayload): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('POST', '/api/events/', payload);
};

/**
 * 3. Retrieve Event Detail & Stats
 * Endpoint: GET /api/events/{id_or_slug}/
 */
export const GetEventDetailApi = async (idOrSlug: string): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('GET', `/api/events/${idOrSlug}/`);
};

/**
 * 4. Update Event Info
 * Endpoint: PATCH /api/events/{id}/
 */
export const UpdateEventApi = async (id: string, updates: Partial<LiveEvent>): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('PATCH', `/api/events/${id}/`, updates);
};

/**
 * 5. Delete Event
 * Endpoint: DELETE /api/events/{id}/
 */
export const DeleteEventApi = async (id: string): Promise<{ success: boolean; message?: string }> => {
  return CommonApi('DELETE', `/api/events/${id}/`);
};

/**
 * 6. Update QR Security & Expiration Settings
 * Endpoint: POST /api/events/{eventId}/qr-settings/
 */
export const UpdateEventQRExpiryApi = async (
  eventId: string,
  durationHours: number | 'custom',
  expiresAt: string,
  pinCode?: string,
  allowGuestUploads?: boolean
): Promise<{ status: string; qr_settings: any }> => {
  return CommonApi('POST', `/api/events/${eventId}/qr-settings/`, {
    duration_hours: durationHours,
    expires_at: expiresAt,
    pin_code: pinCode,
    allow_guest_uploads: allowGuestUploads,
  });
};

/**
 * 7. Move Event Media to Gallery Drive with Categorized Sections
 * Endpoint: POST /api/events/{eventId}/move-to-gallery/
 */
export const MoveEventToGalleryApi = async (
  eventId: string,
  payload: MoveEventToGalleryPayload
): Promise<Gallery> => {
  return CommonApi<Gallery>('POST', `/api/events/${eventId}/move-to-gallery/`, payload);
};

/**
 * 8. Camera Tethering / Hot-Folder Photo Ingestion
 * Endpoint: POST /api/events/{eventId}/tether/
 */
export const TetherPhotoUploadApi = async (
  eventId: string,
  file: File
): Promise<MediaItem> => {
  const formData = new FormData();
  formData.append('photo', file);
  return CommonApi<MediaItem>('POST', `/api/events/${eventId}/tether/`, formData);
};

/**
 * 9. Guest Public Mobile Portal
 * Endpoint: GET /api/public/events/{id_or_slug}/
 */
export const GetPublicEventDetailApi = async (idOrSlug: string): Promise<LiveEvent> => {
  return CommonApi<LiveEvent>('GET', `/api/public/events/${idOrSlug}/`);
};
