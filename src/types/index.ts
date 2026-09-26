export type GalleryTemplateId = 'editorial' | 'masonry' | 'cinematic' | 'minimal';

export interface PhotographerProfile {
  id: string;
  studioName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  occupation?: string;
  bio: string;
  avatarUrl: string;
  websiteUrl?: string;
  instagramHandle?: string;
  watermarkText?: string;
  enableWatermark: boolean;
  isOnboarded: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'starter' | 'pro' | 'studio' | 'master' | 'standard' | 'premium' | 'custom';
  priceMonthly: number;
  billingCycle: 'monthly' | 'annual';
  storageLimitGB: number;
  storageUsedGB: number;
  daysRemaining: number;
  expiryDate: string;
  status: 'active' | 'trial' | 'past_due';
  features: string[];
}

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
  media: MediaItem[];
  sections?: string[]; // Custom section titles created by photographer e.g. ["Highlights", "Ceremony", "Reception"]
  viewsCount: number;
  downloadsCount: number;
  favoritesCount?: number;
  photosCount?: number;
  videosCount?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
  totalMediaCount?: number;
  filteredMediaCount?: number;
}

export interface GalleryTemplate {
  id: GalleryTemplateId;
  name: string;
  tagline: string;
  description: string;
  previewImage: string;
  badge: string;
  characteristics: string[];
}

export interface TutorialStep {
  id: number;
  title: string;
  shortDesc: string;
  details: string;
  iconName: string;
  videoThumbUrl: string;
  videoDuration: string;
  keyPoints: string[];
  actionLabel?: string;
  actionRoute?: string;
}

export interface NotificationSettings {
  clientVisited: boolean;
  photosDownloaded: boolean;
  favoritesSelected: boolean;
  storageAlerts: boolean;
  marketingUpdates: boolean;
}
