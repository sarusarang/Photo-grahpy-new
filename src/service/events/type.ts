import type { MediaItem } from '@/types/atelier';

// -------------------------------------------------------------
// Live Events & Camera Tethering API Types
// -------------------------------------------------------------

export interface CreateEventPayload {
  title: string;
  event_type: string;
  venue?: string;
  city?: string;
  client_name?: string;
  client_contact?: string;
  event_date?: string;
  event_time?: string;
  status?: string;
  banner_url?: string;
  qr_valid_from?: string;
  qr_expires_at?: string;
  qr_duration_hours?: number | 'custom';
  qr_pin_code?: string;
  allow_guest_uploads?: boolean;
}

export interface MoveEventToGalleryPayload {
  target_mode: 'new' | 'existing';
  target_gallery_id?: string | null;
  new_gallery_title?: string;
  category_assignments: Record<string, string>; // mediaId -> Section Title
}

export interface GetEventsParams {
  status?: string;
  search?: string;
}

export interface DeleteEventResponse {
  success: boolean;
  message?: string;
}

export interface BulkDeleteEventMediaResponse {
  deleted_count: number;
  freed_bytes?: number;
}

export interface UpdateEventQRResponse {
  status: string;
  qr_settings: any;
}

export interface BulkUploadEventMediaResponse {
  message?: string;
  total_uploaded: number;
  media: MediaItem[];
}

export interface DeleteEventMediaResponse {
  success: boolean;
  message?: string;
}

export interface GetEventDetailParams {
  all_media?: boolean;
  section?: string;
}
