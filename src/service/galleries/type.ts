import type { Gallery, MediaItem, GalleryTemplateId } from '@/types/atelier';

// -------------------------------------------------------------
// Studio Galleries API Type Definitions
// -------------------------------------------------------------

export interface GalleryFilterParams {
  search?: string;
  status?: string;
  date_filter?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
}

export interface CreateGalleryPayload {
  title: string;
  client_name?: string;
  client_email?: string;
  event_date?: string;
  description?: string;
  template_id?: GalleryTemplateId;
  visibility?: 'public' | 'private' | 'password_protected';
  password?: string;
  allow_downloads?: boolean;
  allow_favorites?: boolean;
  face_search_enabled?: boolean;
  watermark_enabled?: boolean;
  cover_image?: string;
}

export interface GalleryDetailQueryParams {
  cursor?: string | null;
  limit?: number;
  section?: string;
  is_favorite?: boolean;
  type?: 'photo' | 'video';
  all_media?: boolean;
}

export interface DeleteGalleryResponse {
  success: boolean;
  message: string;
  status?: string;
}

export interface MoveMediaToSectionResponse {
  status: string;
  updated_count: number;
  section: string;
}

export interface BulkUploadGalleryMediaResponse {
  message?: string;
  total_uploaded: number;
  media: MediaItem[];
  storage_usage?: any;
}

export interface DeleteGalleryMediaResponse {
  success: boolean;
}

export interface BulkDeleteGalleryMediaResponse {
  deleted_count: number;
  freed_bytes: number;
}

export interface ToggleMediaFavoriteResponse {
  id?: string;
  is_favorite: boolean;
  favorites_count?: number;
}

export interface BulkToggleMediaFavoriteResponse {
  status?: string;
  message?: string;
  updated_count: number;
  is_favorite: boolean;
  media_ids?: string[];
  favorites_count?: number;
}

export interface SetGalleryCoverImageResponse {
  cover_image: string;
}

export interface SetMasonrySlotBannerResponse {
  masonry_banner_images: string[];
}

export interface AddGallerySectionResponse {
  id?: number | string;
  title: string;
  order?: number;
}

export interface DeleteGallerySectionResponse {
  success: boolean;
  message?: string;
}

export interface RenameGallerySectionResponse {
  old_title: string;
  new_title: string;
  updated_count: number;
}

export interface GetGalleryShareDetailsResponse {
  share_url: string;
  qr_code_svg?: string;
  qr_code_png?: string;
  pin_code?: string;
  expires_at: string | null;
  is_password_protected: boolean;
}

export interface SetGalleryTemplateResponse {
  template_id: GalleryTemplateId;
}

export interface SetGalleryTemplateBannerResponse {
  template_banners: Record<string, string>;
}

export interface ReorderGalleryMediaResponse {
  status: string;
  updated_count: number;
}

export interface ReorderGallerySectionsResponse {
  status: string;
  sections: string[];
}

export interface TrackGalleryAnalyticsEventResponse {
  success: boolean;
}

export interface VerifyGalleryPinResponse {
  status: string;
  gallery: Gallery;
  token?: string;
}

export interface TrackGalleryFavoriteResponse {
  status: string;
  is_favorite: boolean;
}

export interface TrackGalleryViewResponse {
  success: boolean;
}

// -------------------------------------------------------------
// Direct-to-R2 Media Upload Types (Method B Unified & Method C)
// -------------------------------------------------------------

export interface DirectR2InitPayload {
  action: 'init' | 'presign';
  filename: string;
  file_size: number;
  mime_type: string;
  media_type?: 'photo' | 'video';
  section_title?: string;
}

export interface DirectR2InitResponse {
  reservation_id: string;
  storage_key: string;
  filename: string;
  original_filename: string;
  media_type: 'photo' | 'video';
  section_title?: string;
  upload_url: string;
  method: 'PUT';
  headers?: Record<string, string>;
  expires_in?: number;
}

export interface DirectR2ConfirmPayload {
  action?: 'confirm';
  storage_key: string;
  reservation_id: string;
  original_filename: string;
  mime_type: string;
  media_type?: 'photo' | 'video';
  section_title?: string;
  file_size?: number;
}

export interface DirectR2StorageUsage {
  used_bytes: number;
  limit_bytes: number;
  used_gb: number;
  limit_gb: number;
  used_percentage: number;
}

export interface DirectR2ConfirmResponse {
  message?: string;
  total_uploaded?: number;
  media?: any;
  storage_usage?: DirectR2StorageUsage;
}

// -------------------------------------------------------------
// Direct-to-R2 Bulk Batch Types (Enterprise 1800+ Photos Scale)
// -------------------------------------------------------------

export interface DirectR2BulkInitFileItem {
  filename: string;
  file_size: number;
  mime_type: string;
  media_type?: 'photo' | 'video';
  section_title?: string;
}

export interface DirectR2BulkInitPayload {
  action: 'bulk-init' | 'bulk_init';
  files: DirectR2BulkInitFileItem[];
}

export interface DirectR2BulkInitItemResponse {
  filename: string;
  original_filename?: string;
  reservation_id: string;
  storage_key: string;
  upload_url: string;
  media_type?: 'photo' | 'video';
  section_title?: string;
  headers?: Record<string, string>;
  expires_in?: number;
}

export interface DirectR2BulkInitResponse {
  items: DirectR2BulkInitItemResponse[];
}

export interface DirectR2BulkConfirmItem {
  reservation_id: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size?: number;
  media_type?: 'photo' | 'video';
  section_title?: string;
}

export interface DirectR2BulkConfirmPayload {
  action: 'bulk-confirm' | 'bulk_confirm';
  items: DirectR2BulkConfirmItem[];
}

export interface DirectR2BulkConfirmResponse {
  message?: string;
  total_uploaded?: number;
  media: any[];
  storage_usage?: DirectR2StorageUsage;
}
