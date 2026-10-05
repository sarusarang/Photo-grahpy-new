import type { GalleryTemplateId } from './template';

export interface MediaItem {
  id: string;
  galleryId: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  title: string;
  caption?: string;
  sectionTitle?: string; // e.g. "Highlights", "Ceremony", "Reception", "Portraits"
  aspectRatio: number; // width / height
  width: number;
  height: number;
  sizeMB: number;
  dateAdded: string;
  isCover?: boolean;
  isFavorite?: boolean;
  duration?: string; // For videos e.g. "01:45"
  videoEmbedUrl?: string;
}

export interface Gallery {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  eventDate: string;
  createdAt: string;
  expiresAt?: string | null;
  isExpired?: boolean;
  coverImage: string;
  templateId: GalleryTemplateId;
  templateBanners?: Partial<Record<GalleryTemplateId, string>>;
  masonryBannerImages?: string[];
  status: 'active' | 'delivered' | 'draft' | 'archived';
  isPasswordProtected: boolean;
  password?: string;
  allowDownloads: boolean;
  allowFavorites: boolean;
  face_search_enabled?: boolean;
  faceSearchEnabled?: boolean;
  watermark_enabled?: boolean;
  watermarkEnabled?: boolean;
  watermark_text?: string;
  watermark_opacity?: number;
  watermark_position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tiled' | string;
  watermark_image?: string | null;
  media: MediaItem[];
  sections?: string[]; // Custom section titles created by photographer
  viewsCount: number;
  downloadsCount: number;
  favoritesCount?: number;
  photosCount?: number;
  videosCount?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
  totalMediaCount?: number;
  filteredMediaCount?: number;
  sectionCounts?: Record<string, number>;
  totalSizeBytes?: number;
  totalSizeMB?: number;
  totalSizeFormatted?: string;
  photographerName?: string;
  studioName?: string;
}

export interface GallerySection {
  title: string;
  itemCount: number;
}
