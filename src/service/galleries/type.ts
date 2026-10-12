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
