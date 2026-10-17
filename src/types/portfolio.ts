export type PortfolioTemplateId = 'editorial-vogue' | 'darkroom-atelier' | string;

export type SubdomainStatus = 'pending' | 'provisioning' | 'active' | 'failed' | null;

export interface SubdomainAvailability {
  name: string;
  available: boolean;
  reason: 'already_taken' | 'reserved' | 'invalid_format' | string | null;
  error?: string | null;
  is_current_owner: boolean;
  status?: string;
  domain?: string;
  url?: string;
}

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

export interface FeaturedWork {
  id: string;
  title: string;
  category: string;
  coverUrl: string;
  year?: string;
  location?: string;
  description?: string;
  clientName?: string;
  gallerySlug?: string;
  mediaCount: number;
  highlightMedia: string[];
}

export interface PortfolioProject extends FeaturedWork {
  description?: string;
  clientName?: string;
  gallerySlug?: string;
}

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
  featuredWorks: FeaturedWork[];

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

export interface PortfolioConfig {
  templateId: PortfolioTemplateId;
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
  isBookingOpen: boolean;
  pricingStartingAt: string;
  philosophyQuote: string;
  philosophyAuthor: string;
  accentColor?: string;
  subdomain?: string | null;
  subdomainStatus?: SubdomainStatus;
  subdomain_status?: SubdomainStatus;
  customDomain?: string | null;
  featuredWorks: PortfolioProject[];
  whatsappEnabled?: boolean;
  whatsappNumber?: string;
  whatsappPrefillMessage?: string;
  whatsappButtonLabel?: string;
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
