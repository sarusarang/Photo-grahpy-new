// ===========================================================================
// EX SHARE Atelier — Complete TypeScript Domain Models & Types
// ===========================================================================

export type PlanTier = 'standard' | 'premium' | 'custom';
export type BillingCycle = 'quarterly' | 'annual' | 'monthly';
export type GalleryTemplateId = 'editorial' | 'masonry' | 'cinematic' | 'minimal';
export type GalleryStatus = 'active' | 'delivered' | 'draft' | 'archived';
export type MediaType = 'photo' | 'video';
export type InquiryStatus = 'new' | 'contacted' | 'booked' | 'archived';

// ---------------------------------------------------------------------------
// Studio Plans & Subscriptions
// ---------------------------------------------------------------------------
export interface StudioPlan {
  id: string; // 'plan-standard-3m' | 'plan-standard-1y' | 'plan-premium-elite'
  name: string;
  subtitle: string;
  tier: PlanTier;
  billing_cycle: BillingCycle;
  period_label: string;
  duration_months: number;
  monthly_price: number | string;
  original_monthly_price?: number | string | null;
  total_price: number | string;
  billing_text: string;
  currency: string;
  image_storage_gb: number;
  video_storage_gb: number;
  image_storage: string;
  video_storage: string;
  storage_limit_bytes: number;
  tag: string;
  tag_type: 'default' | 'popular' | 'current';
  cta_text: string;
  features: string[];
  max_galleries: number; // 0 = unlimited
  gallery_expiry_days: number; // 0 = permanent
  face_search_enabled: boolean;
  max_events: number;
  allowed_templates: GalleryTemplateId[];
  allowed_portfolio_templates: string[];
  max_portfolio_posts: number;
  max_inquiries: number;
  has_full_inquiry_access: boolean;
  can_upgrade_storage: boolean;
  max_upgrade_image_gb: number;
  is_active: boolean;
  sort_order: number;
}

export interface ResourceUsageMetric {
  used: number;
  limit: number;
  remaining: number | null;
  is_unlimited: boolean;
}

export interface SubscriptionUsageSummary {
  galleries: ResourceUsageMetric;
  events: ResourceUsageMetric;
  portfolio_posts: ResourceUsageMetric;
}

export interface CurrentSubscription {
  id: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  plan: {
    id: string;
    name: string;
    tier: PlanTier | string;
    billing_cycle: BillingCycle | string;
    max_galleries?: number;
    allowed_templates?: GalleryTemplateId[];
    face_search_enabled?: boolean;
    gallery_expiry_days?: number;
    max_events?: number;
    max_portfolio_posts?: number;
    has_full_inquiry_access?: boolean;
    duration_months?: number;
    total_price?: string | number;
    currency?: string;
  };
  start_date: string;
  expiry_date: string;
  days_remaining: number;
  storage: {
    used_bytes: number;
    limit_bytes: number;
    used_gb: number;
    limit_gb: number;
    used_percentage: number;
  };
  usage?: SubscriptionUsageSummary;
  auto_renew: boolean;
  payment_gateway_ref?: string | null;
}

// ---------------------------------------------------------------------------
// Photographer Profile & Studio Branding
// ---------------------------------------------------------------------------
export interface PhotographerProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  occupation: string;
  studio_name: string;
  bio: string;
  location: string;
  website_url?: string | null;
  instagram_handle: string;
  avatar_url?: string | null;
  default_template: GalleryTemplateId;
  enable_watermark: boolean;
  watermark_text: string;
  watermark_opacity: number;
  watermark_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tiled';
  is_onboarded: boolean;
  onboarding_step: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  storage_remaining_bytes: number;
  quick_info?: {
    member_since: string;
    galleries_created: number;
    total_photos: number;
    total_videos: number;
    storage_used_formatted: string;
    storage_limit_formatted: string;
    storage_display: string;
  };
  plan_details?: {
    name: string;
    tier: string;
    billing_cycle: string;
    headline: string;
    description: string;
  };
}

// ---------------------------------------------------------------------------
// Client Gallery & Media
// ---------------------------------------------------------------------------
export interface GallerySection {
  id?: number | string;
  title: string;
  order: number;
  count?: number;
}

export interface MediaItem {
  id: string;
  gallery?: string;
  galleryId?: string;
  section_title?: string;
  sectionTitle?: string;
  type: MediaType;
  file_url: string;
  url?: string;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  title?: string;
  caption?: string;
  original_filename?: string;
  aspect_ratio?: number;
  width?: number;
  height?: number;
  file_size?: number;
  size?: number;
  is_cover?: boolean;
  is_favorite?: boolean;
  isFavorite?: boolean;
  duration?: string;
  video_embed_url?: string;
  sort_order?: number;
  created_at?: string;
  dateAdded?: string;
}

export interface Gallery {
  id: string;
  slug: string;
  title: string;
  client_name?: string;
  clientName?: string;
  client_email?: string;
  clientEmail?: string;
  event_date: string;
  eventDate?: string;
  cover_image?: string;
  coverImage?: string;
  template_id: GalleryTemplateId;
  templateId?: GalleryTemplateId;
  template_banners?: Record<string, string>;
  templateBanners?: Record<string, string>;
  masonry_banner_images?: string[];
  masonryBannerImages?: string[];
  status: GalleryStatus;
  is_password_protected: boolean;
  isPasswordProtected?: boolean;
  password?: string;
  allow_downloads: boolean;
  allowDownloads?: boolean;
  allow_favorites: boolean;
  allowFavorites?: boolean;
  expires_at: string | null;
  expiresAt?: string | null;
  is_expired?: boolean;
  isExpired?: boolean;
  views_count?: number;
  viewsCount?: number;
  downloads_count?: number;
  downloadsCount?: number;
  favorites_count?: number;
  favoritesCount?: number;
  photos_count?: number;
  photosCount?: number;
  videos_count?: number;
  videosCount?: number;
  share_token?: string;
  share_url?: string;
  shareUrl?: string;
  sections?: GallerySection[];
  media?: MediaItem[];
  created_at?: string;
  updated_at?: string;
  next_cursor?: string | null;
  nextCursor?: string | null;
  has_more?: boolean;
  hasMore?: boolean;
  total_media_count?: number;
  totalMediaCount?: number;
}

// ---------------------------------------------------------------------------
// Live Events & Tethering
// ---------------------------------------------------------------------------
export interface LiveEvent {
  id: string;
  slug: string;
  title: string;
  event_type: string;
  eventType?: string;
  venue: string;
  client_name?: string;
  clientName?: string;
  event_date: string;
  eventDate?: string;
  status: 'live' | 'upcoming' | 'completed' | 'moved_to_gallery';
  auto_sync_enabled?: boolean;
  autoSyncEnabled?: boolean;
  tether_count?: number;
  tetherCount?: number;
  guest_views?: number;
  guestViews?: number;
  qr_scans?: number;
  qrScans?: number;
  ai_searches?: number;
  aiSearches?: number;
  matches_found?: number;
  matchesFound?: number;
  downloads_count?: number;
  downloadsCount?: number;
  banner_url?: string;
  qr_settings: {
    duration_hours: number | string;
    expires_at: string;
    pin_code?: string;
    is_active: boolean;
    allow_guest_uploads?: boolean;
  };
  associated_gallery_id?: string | null;
  media?: MediaItem[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Client Inquiries
// ---------------------------------------------------------------------------
export interface PortfolioInquiry {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  location: string;
  budget: string;
  message: string;
  status: InquiryStatus;
  notes?: string;
  createdAt: string;
  is_locked?: boolean;
}

// ---------------------------------------------------------------------------
// Plan Enforcement Error Structure
// ---------------------------------------------------------------------------
export interface PlanEnforcementError {
  error_code:
    | 'NO_ACTIVE_SUBSCRIPTION'
    | 'GALLERY_LIMIT_EXCEEDED'
    | 'TEMPLATE_TIER_LOCKED'
    | 'FACE_SEARCH_LOCKED'
    | 'EVENT_LIMIT_EXCEEDED'
    | 'STORAGE_LIMIT_EXCEEDED'
    | 'STORAGE_UPGRADE_LIMIT_EXCEEDED';
  message: string;
  upgrade_required: boolean;
}

// ---------------------------------------------------------------------------
// Portfolio Studio & Showcase
// ---------------------------------------------------------------------------
export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  cover_url: string;
  year?: string;
  description?: string;
  media_urls?: string[];
  sort_order?: number;
}

export interface PortfolioConfig {
  photographer_id?: number | string;
  slug?: string;
  studio_name?: string;
  tagline?: string;
  philosophy_quote?: string;
  template_id: string;
  custom_domain?: string | null;
  featured_projects: PortfolioProject[];
  accent_color?: string;
}

// ---------------------------------------------------------------------------
// Analytics Telemetry
// ---------------------------------------------------------------------------
export interface GalleryAnalyticsData {
  gallery_id: string;
  total_views: number;
  total_downloads: number;
  total_favorites: number;
  unique_visitors: number;
  views_timeline: Array<{ date: string; views: number; downloads: number }>;
  device_breakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  top_photos: Array<{
    media_id: string;
    file_url: string;
    views: number;
    favorites: number;
    downloads: number;
  }>;
  recent_activity: Array<{
    id: string;
    type: 'view' | 'download' | 'favorite' | 'share';
    device: string;
    timestamp: string;
    details?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Soundtrack / Audio
// ---------------------------------------------------------------------------
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  audio_url: string;
  cover_art_url?: string;
  genre?: string;
  mood?: string;
  is_custom?: boolean;
}
