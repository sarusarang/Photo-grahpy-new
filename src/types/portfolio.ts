// types/portfolio.ts

export type SubdomainStatus = 'pending' | 'provisioning' | 'active' | 'failed';

export interface SubdomainAvailabilityResponse {
  subdomain: string;
  available: boolean;
  url: string;
  message: string;
  name?: string;
  reason?: 'already_taken' | 'reserved' | 'invalid_format' | null;
  error?: string;
  is_current_owner?: boolean;
  domain?: string;
  live_url?: string;
}

export interface ClaimSubdomainResponse {
  status: 'active' | 'pending';
  subdomain: string;
  domain: string;
  url: string;
  live_url: string;
  direct_url: string;
  message: string;
}

export interface PortfolioWorkPhoto {
  id: number;
  photoUrl: string;
  photo_url?: string;
  caption?: string;
  order: number;
}

export interface PortfolioWork {
  id: string | number;
  title: string;
  category: 'weddings' | 'editorial' | 'commercial' | 'pre-wedding' | 'cinematic' | 'portrait' | string;
  coverUrl: string;
  cover_url?: string;
  year?: string;
  location?: string;
  description?: string;
  clientName?: string;
  client_name?: string;
  order?: number;
  mediaCount: number;
  highlightMedia: string[];
  photos?: PortfolioWorkPhoto[];
  gallerySlug?: string;
}

export interface PortfolioProject extends PortfolioWork {
  id: string;
  order?: number;
  gallerySlug?: string;
}

export interface PortfolioConfig {
  id?: number;
  photographerId?: number;
  studioName: string;
  artistName: string;
  tagline: string;
  bio: string;
  aboutStory: string;
  location: string;
  avatarUrl: string;
  bannerUrl: string;
  contactEmail: string;
  contactPhone: string;
  instagramHandle: string;
  youtubeHandle: string;
  websiteUrl: string;
  templateId: 'editorial-vogue' | 'darkroom-atelier' | 'cinematic-luxury' | 'minimal-zen' | string;
  subdomain: string | null;
  subdomainStatus?: SubdomainStatus | null;
  subdomain_status?: SubdomainStatus | null;
  customDomain?: string | null;
  isPublished?: boolean;
  isBookingOpen: boolean;
  portfolioUrl?: string;
  fullDomain?: string;
  featuredWorks: PortfolioProject[];
  accentColor?: string;
  pricingStartingAt?: string;
  philosophyQuote?: string;
  philosophyAuthor?: string;
  whatsappEnabled?: boolean;
  whatsappNumber?: string;
  whatsappPrefillMessage?: string;
  whatsappButtonLabel?: string;
}

// -------------------------------------------------------------
// Extended Application Types (Backward Compatibility)
// -------------------------------------------------------------

export type PortfolioTemplateId = 'editorial-vogue' | 'darkroom-atelier' | 'cinematic-luxury' | 'minimal-zen' | string;

export type SubdomainAvailability = SubdomainAvailabilityResponse;

export interface SubdomainStatusResponse {
  subdomain: string | null;
  status: SubdomainStatus;
  domain: string | null;
  url: string | null;
  live_url?: string | null;
  provisioned_at?: string;
  dns_checked_at?: string;
  error: string | null;
  retry_allowed: boolean;
  retry_after_seconds?: number;
  retry_count?: number;
}

export type FeaturedWork = PortfolioProject;

export interface TenantPortfolioData {
  templateId: string;
  studioName: string;
  artistName: string;
  tagline?: string;
  bio?: string;
  aboutStory?: string;
  location?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  websiteUrl?: string;
  isBookingOpen: boolean;
  pricingStartingAt?: string;
  philosophyQuote?: string;
  philosophyAuthor?: string;
  accentColor?: string;
  subdomain: string;
  featuredWorks: PortfolioProject[];

  // WhatsApp Integration
  whatsappEnabled?: boolean;
  whatsappNumber?: string;
  whatsappPrefillMessage?: string;
  whatsappButtonLabel?: string;
  cleanWhatsappNumber?: string;
}

export interface ClientInquiryPayload {
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type?: string;
  event_date?: string;
  event_location?: string;
  location?: string;
  estimated_budget?: string;
  budget?: string;
  message: string;
}

export interface PortfolioAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  inquiryConversions: number;
  conversionRate: number;
  avgEngagementDuration: string;
  viewsByDevice: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topProjects: {
    title: string;
    views: number;
    category: string;
  }[];
  recentVisitors: {
    id: string;
    city: string;
    country: string;
    time: string;
    device: 'desktop' | 'mobile' | 'tablet';
  }[];
}

export interface PortfolioTemplateMeta {
  id: PortfolioTemplateId;
  name: string;
  subtitle: string;
  description: string;
  styleBadge: string;
  previewThumb: string;
  highlights: string[];
}
