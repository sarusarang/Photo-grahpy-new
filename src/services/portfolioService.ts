import type { PortfolioConfig, PortfolioAnalytics, PortfolioTemplateMeta, PortfolioProject } from '../types/portfolio';
import { getInquiries } from './inquiryService';

const PORTFOLIO_STORAGE_KEY = 'photo_saas_portfolio_config_v2';

export const AVAILABLE_TEMPLATES: PortfolioTemplateMeta[] = [
  {
    id: 'editorial-vogue',
    name: 'Lumina Pure (Editorial)',
    subtitle: 'High-Fashion Pure White & Minimalist',
    description: 'Full-size bright editorial hero banner, crisp minimalist typography, clean about showcase, interactive works gallery with event photo uploads, and refined contact form.',
    styleBadge: 'Editorial White',
    previewThumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    highlights: ['Full-Size White Hero Banner', 'High-Fashion Typography', 'Expandable Event Photos', 'Refined Minimal Form'],
  },
  {
    id: 'darkroom-atelier',
    name: 'Obsidian Noir (Masonry)',
    subtitle: 'Cinematic Noir & Atmospheric Dark',
    description: 'Full-size cinematic dark hero banner with glowing studio typography, intimate about narrative, expandable works with event photo uploads, and dark glassmorphic inquiry form.',
    styleBadge: 'Cinematic Dark',
    previewThumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
    highlights: ['Full-Size Dark Hero Banner', 'Atmospheric Amber Glow', 'Expandable Event Photos', 'Dark Glassmorphic Form'],
  },
];

export const CURATED_HERO_PRESETS = [
  {
    title: 'Luxury Editorial Wedding',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&auto=format&fit=crop&q=85',
  },
  {
    title: 'Palace Royal Ceremony',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&auto=format&fit=crop&q=85',
  },
  {
    title: 'Cinematic Noir Moody',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&auto=format&fit=crop&q=85',
  },
  {
    title: 'Amalfi Coast Sunset',
    url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1920&auto=format&fit=crop&q=85',
  },
  {
    title: 'Minimal Haute Couture',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1920&auto=format&fit=crop&q=85',
  },
  {
    title: 'Architecture & Daylight',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format&fit=crop&q=85',
  },
];

export const DEFAULT_PORTFOLIO_PROJECTS: PortfolioProject[] = [];

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  templateId: 'editorial-vogue',
  studioName: '',
  artistName: '',
  tagline: '',
  bio: '',
  aboutStory: '',
  location: '',
  avatarUrl: '',
  bannerUrl: '',
  contactEmail: '',
  contactPhone: '',
  instagramHandle: '',
  youtubeHandle: '',
  websiteUrl: '',
  isBookingOpen: true,
  pricingStartingAt: '',
  philosophyQuote: '',
  philosophyAuthor: '',
  accentColor: '#F59E0B',
  featuredWorks: [],
  whatsappEnabled: true,
  whatsappNumber: '',
  whatsappPrefillMessage: "Hi, I'm interested in booking a photography session with your studio!",
  whatsappButtonLabel: 'Chat on WhatsApp',
};

type PortfolioConfigListener = (config: PortfolioConfig) => void;
const listeners: Set<PortfolioConfigListener> = new Set();

export function normalizePortfolioConfig(
  raw: any,
  fallbackUser?: {
    fullName?: string;
    studioName?: string;
    email?: string;
    phone?: string;
    location?: string;
  }
): PortfolioConfig {
  const fallbackStudio = fallbackUser?.studioName || (fallbackUser?.fullName ? `${fallbackUser.fullName} Studio` : 'Studio Portfolio');
  const fallbackArtist = fallbackUser?.fullName || 'Lead Photographer';

  if (!raw || typeof raw !== 'object') {
    const fallbackPhone = fallbackUser?.phone || '';
    return {
      ...DEFAULT_PORTFOLIO_CONFIG,
      studioName: fallbackStudio,
      artistName: fallbackArtist,
      contactEmail: fallbackUser?.email || '',
      contactPhone: fallbackPhone,
      location: fallbackUser?.location || '',
      featuredWorks: [],
      whatsappNumber: fallbackPhone,
    };
  }

  // Normalize works array strictly from server data - zero dummy items
  const rawWorks = raw.featuredWorks || raw.featured_works || raw.works || [];
  const normalizedWorks: PortfolioProject[] = Array.isArray(rawWorks)
    ? rawWorks.map((w: any, idx: number) => ({
        id: w.id || `proj-${idx + 1}`,
        title: w.title || 'Untitled Project',
        category: w.category || 'Showcase',
        coverUrl: w.coverUrl || w.cover_url || '',
        year: w.year || new Date().getFullYear().toString(),
        location: w.location || '',
        description: w.description || '',
        clientName: w.clientName || w.client_name || '',
        gallerySlug: w.gallerySlug || w.gallery_slug || '',
        mediaCount: w.mediaCount || w.media_count || (w.highlightMedia?.length || w.highlight_media?.length || 0),
        highlightMedia: Array.isArray(w.highlightMedia) ? w.highlightMedia : Array.isArray(w.highlight_media) ? w.highlight_media : (w.coverUrl || w.cover_url ? [w.coverUrl || w.cover_url] : []),
      }))
    : [];

  const resolvedPhone = raw.contactPhone || raw.contact_phone || fallbackUser?.phone || '';
  const resolvedWhatsApp = raw.whatsappNumber || raw.whatsapp_number || resolvedPhone;

  return {
    templateId: raw.templateId || raw.template_id || 'editorial-vogue',
    studioName: raw.studioName || raw.studio_name || fallbackStudio,
    artistName: raw.artistName || raw.artist_name || fallbackArtist,
    tagline: raw.tagline || '',
    bio: raw.bio || raw.biography || '',
    aboutStory: raw.aboutStory || raw.about_story || '',
    location: raw.location || fallbackUser?.location || '',
    avatarUrl: raw.avatarUrl || raw.avatar_url || '',
    bannerUrl: raw.bannerUrl || raw.banner_url || '',
    contactEmail: raw.contactEmail || raw.contact_email || fallbackUser?.email || '',
    contactPhone: resolvedPhone,
    instagramHandle: raw.instagramHandle || raw.instagram_handle || '',
    youtubeHandle: raw.youtubeHandle || raw.youtube_handle || '',
    websiteUrl: raw.websiteUrl || raw.website_url || '',
    isBookingOpen: raw.isBookingOpen ?? raw.is_booking_open ?? true,
    pricingStartingAt: raw.pricingStartingAt || raw.pricing_starting_at || '',
    philosophyQuote: raw.philosophyQuote || raw.philosophy_quote || '',
    philosophyAuthor: raw.philosophyAuthor || raw.philosophy_author || fallbackArtist,
    accentColor: raw.accentColor || raw.accent_color || '#F59E0B',
    featuredWorks: normalizedWorks,
    whatsappEnabled: raw.whatsappEnabled ?? raw.whatsapp_enabled ?? true,
    whatsappNumber: resolvedWhatsApp,
    whatsappPrefillMessage: raw.whatsappPrefillMessage || raw.whatsapp_prefill_message || "Hi, I'm interested in booking a photography session with your studio!",
    whatsappButtonLabel: raw.whatsappButtonLabel || raw.whatsapp_button_label || 'Chat on WhatsApp',
  };
}

export function getPortfolioConfig(): PortfolioConfig {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return DEFAULT_PORTFOLIO_CONFIG;
    const parsed = JSON.parse(raw);
    return normalizePortfolioConfig(parsed);
  } catch {
    return DEFAULT_PORTFOLIO_CONFIG;
  }
}

export function savePortfolioConfig(updates: Partial<PortfolioConfig>): PortfolioConfig {
  const current = getPortfolioConfig();
  const next: PortfolioConfig = {
    ...current,
    ...updates,
  };
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to save portfolio config:', err);
  }
  listeners.forEach((fn) => fn(next));
  return next;
}

export function resetPortfolioConfig(): PortfolioConfig {
  try {
    localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset portfolio config:', err);
  }
  listeners.forEach((fn) => fn(DEFAULT_PORTFOLIO_CONFIG));
  return DEFAULT_PORTFOLIO_CONFIG;
}

export function subscribePortfolioConfig(listener: PortfolioConfigListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPortfolioAnalytics(): PortfolioAnalytics {
  const inquiries = getInquiries();
  const leadsCount = inquiries.length;
  const bookedCount = inquiries.filter((i) => i.status === 'booked').length;
  const conversionRate = leadsCount > 0 ? Math.round((bookedCount / leadsCount) * 100) : 0;

  return {
    totalViews: 0,
    uniqueVisitors: 0,
    inquiryConversions: leadsCount,
    conversionRate,
    avgEngagementDuration: '—',
    viewsByDevice: {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    },
    topProjects: [],
    recentVisitors: [],
  };
}
