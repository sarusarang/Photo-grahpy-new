export type GalleryTemplateId = 'editorial' | 'masonry' | 'cinematic' | 'minimal';

export interface PhotographerProfile {
  id: string;
  studioName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
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
  tier: 'starter' | 'pro' | 'studio' | 'master';
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
  expiresAt?: string;
  coverImage: string;
  templateId: GalleryTemplateId;
  status: 'active' | 'delivered' | 'draft' | 'archived';
  isPasswordProtected: boolean;
  password?: string;
  allowDownloads: boolean;
  allowFavorites: boolean;
  media: MediaItem[];
  viewsCount: number;
  downloadsCount: number;
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
