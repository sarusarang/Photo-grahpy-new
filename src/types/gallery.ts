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
  downloadUrl?: string;
  previewUrl?: string;
  rawUrl?: string;
  originalFilename?: string;
  mimeType?: string;
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
  watermarkText?: string;
  watermark_opacity?: number;
  watermarkOpacity?: number;
  watermark_position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tiled' | string;
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tiled' | string;
  watermark_image?: string | null;
  watermarkImage?: string | null;
  watermark_type?: 'text' | 'image' | string;
  watermarkType?: 'text' | 'image' | string;
  watermark_font_size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  watermarkFontSize?: 'sm' | 'md' | 'lg' | 'xl' | string;
  watermark_font_color?: string;
  watermarkFontColor?: string;
  watermark_font_style?: 'serif' | 'sans' | 'script' | 'mono' | string;
  watermarkFontStyle?: 'serif' | 'sans' | 'script' | 'mono' | string;
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
  photographerId?: string | number;
  photographerSlug?: string;
  photographerName?: string;
  photographerEmail?: string;
  studioName?: string;
  studioEmail?: string;
}

export interface GallerySection {
  title: string;
  itemCount: number;
}
