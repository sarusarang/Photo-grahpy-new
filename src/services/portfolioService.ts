import type { PortfolioConfig, PortfolioAnalytics, PortfolioTemplateMeta, PortfolioProject } from '../types/portfolio';
import { getInquiries } from './inquiryService';

const PORTFOLIO_STORAGE_KEY = 'photo_saas_portfolio_config_v2';

export const AVAILABLE_TEMPLATES: PortfolioTemplateMeta[] = [
  {
    id: 'editorial-vogue',
    name: 'Editorial Vogue',
    subtitle: 'High-Fashion & Luxury Editorial',
    description: 'Clean editorial magazine typography, full-bleed hero banner, split-grid philosophy statement, and curated dynamic masonry works.',
    styleBadge: 'Magazine Luxe',
    previewThumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    highlights: ['Serif Magazine Layout', 'Full-Bleed Parallax Hero', 'Masonry Works Grid', 'Luxury Booking Form'],
  },
  {
    id: 'darkroom-atelier',
    name: 'Darkroom Atelier',
    subtitle: 'Cinematic Noir & Film Showcase',
    description: 'High-contrast darkroom moodboard, film-strip reel project inspection, atmospheric ambient lighting, and interactive contact drawer.',
    styleBadge: 'Cinematic Noir',
    previewThumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
    highlights: ['Film Reel Showcase', 'Atmospheric Ambient Glow', 'Interactive Audio Atmosphere', 'Full-Screen Contact Drawer'],
  },
];

export const DEFAULT_PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-1',
    title: 'Ananya & Kabir • Royal Palace Udaipur',
    category: 'weddings',
    coverUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&auto=format&fit=crop&q=85',
    year: '2026',
    location: 'Taj Lake Palace, Udaipur',
    description: 'A 3-day royal palace celebration capturing grand Rajput rituals and intimate lakeside moments.',
    clientName: 'Ananya Sharma & Kabir Roy',
    mediaCount: 142,
    highlightMedia: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1000&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'proj-2',
    title: 'Ethereal Silk • Haute Couture Editorial',
    category: 'editorial',
    coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=85',
    year: '2026',
    location: 'Studio Noir, Mumbai',
    description: 'A high-concept fashion series exploring minimalist silhouettes, raw shadows, and silk motion.',
    clientName: 'Vogue India Atelier',
    mediaCount: 48,
    highlightMedia: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'proj-3',
    title: 'Mediterranean Solitude • Pre-Wedding',
    category: 'pre-wedding',
    coverUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&auto=format&fit=crop&q=85',
    year: '2025',
    location: 'Positano, Amalfi Coast',
    description: 'Sun-drenched cliffside portraits celebrating love, vintage convertibles, and Italian coastlines.',
    clientName: 'Rhea & Dev',
    mediaCount: 86,
    highlightMedia: [
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1000&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'proj-4',
    title: 'Monolithic Spaces • Architectural Digest',
    category: 'commercial',
    coverUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=85',
    year: '2025',
    location: 'Alibaug, Maharashtra',
    description: 'Brutalist concrete villa documentation focusing on brutalist geometry, daylight, and nature.',
    clientName: 'Architectural Digest India',
    mediaCount: 35,
    highlightMedia: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'proj-5',
    title: 'Rhea & Siddharth • Traditional South Indian',
    category: 'weddings',
    coverUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&auto=format&fit=crop&q=85',
    year: '2025',
    location: 'Kumarakom Lake Resort, Kerala',
    description: 'Lush backwater serenity, jasmine garlands, and candid temple rituals captured in gold tones.',
    clientName: 'Rhea Kurien & Siddharth Nair',
    mediaCount: 160,
    highlightMedia: [
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1000&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'proj-6',
    title: 'Verve Haute Horlogerie • Watch Campaign',
    category: 'commercial',
    coverUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=85',
    year: '2026',
    location: 'Zurich & Mumbai',
    description: 'Macro Swiss watch craftsmanship photography with dramatic studio lighting and water droplets.',
    clientName: 'Verve Chrono Geneva',
    mediaCount: 24,
    highlightMedia: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80',
    ],
  },
];

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  templateId: 'editorial-vogue',
  studioName: 'Sarang Varma Studio',
  artistName: 'Sarang Varma',
  tagline: 'Visual Poetry • High-Fashion Weddings & Destination Documentaries',
  bio: 'Documenting raw emotion, modern romanticism, and high-fashion aesthetics across India and worldwide destinations. Every frame is treated as a piece of timeless fine-art.',
  aboutStory: 'Founded in 2018, our studio blends the candid honesty of photojournalism with the refined sophistication of high-fashion magazine editorials. We work with a select few couples and commercial clients each season to ensure bespoke attention to every detail.',
  location: 'Mumbai & Kochi • Available Worldwide',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1800&auto=format&fit=crop&q=85',
  contactEmail: 'hello@sarangvarma.com',
  contactPhone: '+91 98201 44521',
  instagramHandle: '@sarangvarmastudio',
  youtubeHandle: '@sarangvarmacinema',
  websiteUrl: 'https://sarangvarma.com',
  isBookingOpen: true,
  pricingStartingAt: '₹4,50,000 / Day',
  philosophyQuote: '“Photography is not about mere moments frozen in time; it is about how those moments felt when your breath was taken away.”',
  philosophyAuthor: 'Sarang Varma, Creative Director',
  accentColor: '#F59E0B',
  featuredWorks: DEFAULT_PORTFOLIO_PROJECTS,
};

type PortfolioConfigListener = (config: PortfolioConfig) => void;
const listeners: Set<PortfolioConfigListener> = new Set();

export function getPortfolioConfig(): PortfolioConfig {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return DEFAULT_PORTFOLIO_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PORTFOLIO_CONFIG,
      ...parsed,
      featuredWorks: parsed.featuredWorks && parsed.featuredWorks.length > 0
        ? parsed.featuredWorks
        : DEFAULT_PORTFOLIO_CONFIG.featuredWorks,
    };
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
  const conversionRate = leadsCount > 0 ? Math.round((bookedCount / leadsCount) * 100) : 38;

  return {
    totalViews: 3840 + leadsCount * 45,
    uniqueVisitors: 2180 + leadsCount * 28,
    inquiryConversions: leadsCount,
    conversionRate: Math.max(12, conversionRate),
    avgEngagementDuration: '3m 42s',
    viewsByDevice: {
      mobile: 68,
      desktop: 26,
      tablet: 6,
    },
    topProjects: [
      { title: 'Ananya & Kabir • Royal Palace Udaipur', views: 1420, category: 'Weddings' },
      { title: 'Ethereal Silk • Haute Couture Editorial', views: 980, category: 'Editorial' },
      { title: 'Mediterranean Solitude • Pre-Wedding', views: 760, category: 'Pre-Wedding' },
      { title: 'Monolithic Spaces • Architectural Digest', views: 540, category: 'Commercial' },
    ],
    recentVisitors: [
      { id: 'v1', city: 'Mumbai', country: 'India', time: '4 mins ago', device: 'mobile' },
      { id: 'v2', city: 'London', country: 'United Kingdom', time: '22 mins ago', device: 'desktop' },
      { id: 'v3', city: 'Dubai', country: 'UAE', time: '1 hour ago', device: 'mobile' },
      { id: 'v4', city: 'New York', country: 'United States', time: '3 hours ago', device: 'desktop' },
      { id: 'v5', city: 'Delhi', country: 'India', time: '5 hours ago', device: 'mobile' },
    ],
  };
}
