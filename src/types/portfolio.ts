export type PortfolioTemplateId = 'editorial-vogue' | 'darkroom-atelier' | string;

export interface PortfolioProject {
  id: string;
  title: string;
  category: 'weddings' | 'editorial' | 'commercial' | 'pre-wedding' | 'cinematic' | 'portrait';
  coverUrl: string;
  year: string;
  location: string;
  description: string;
  clientName?: string;
  gallerySlug?: string;
  mediaCount?: number;
  highlightMedia?: string[];
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
  featuredWorks: PortfolioProject[];
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
