import React from 'react';
import { Sprout, Crown, Gem } from 'lucide-react';

export interface PlanItem {
  id: string;
  name: string;
  subtitle: string;
  originalPrice?: number;
  price: number;
  periodLabel: string;
  billing: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  tagType?: 'default' | 'popular' | 'current';
  features: string[];
  ctaText?: string;
  imageStorage: string;
  videoStorage: string;
}

export const STUDIO_PLANS: PlanItem[] = [
  {
    id: 'plan-standard-3m',
    name: 'Standard Quarterly',
    subtitle: 'For 03 Months • Essential Studio Plan',
    periodLabel: 'For 03 Months',
    originalPrice: 1100,
    price: 800,
    billing: '₹800 / Month • Billed for 03 Months (₹2,400)',
    icon: Sprout,
    tag: '3 MONTHS ACCESS',
    tagType: 'default',
    imageStorage: '200 GB',
    videoStorage: '10 GB',
    features: [
      '200 GB Image Storage',
      '10 GB Video Delivery',
      'For 03 Months Studio Access',
      'Unlimited Client Proofing & Lightbox',
      'High-Speed Instant ZIP Bulk Downloads',
      'Editorial & Masonry Gallery Themes',
    ],
    ctaText: 'Choose Standard (3 Months)',
  },
  {
    id: 'plan-standard-1y',
    name: 'Standard Annual',
    subtitle: 'For 01 Year • Best Value For Photographers',
    periodLabel: 'For 01 Year',
    originalPrice: 1100,
    price: 800,
    billing: '₹800 / Month • Billed Annually (₹9,600)',
    icon: Crown,
    tag: 'MOST POPULAR',
    tagType: 'popular',
    imageStorage: '200 GB',
    videoStorage: '10 GB',
    features: [
      '200 GB Image Storage',
      '10 GB Video Delivery',
      'For 01 Year Uninterrupted Hosting',
      'Unlimited Client Galleries',
      'All 4 Layout Templates (Editorial, Masonry, Cinematic, Minimal)',
      'PIN Security & Custom Watermark Suite',
      'Priority Delivery Speeds',
    ],
    ctaText: 'Choose Standard (1 Year)',
  },
  {
    id: 'plan-premium-elite',
    name: 'Studio Premium Elite',
    subtitle: '2x Standard Capacity & Power for Commercial Studios',
    periodLabel: 'Annual • Priority Tier',
    originalPrice: 2200,
    price: 1800,
    billing: '₹1,800 / Month • Billed Annually (₹21,600)',
    icon: Gem,
    tag: '2X POWER',
    tagType: 'default',
    imageStorage: '1000 GB (1 TB)',
    videoStorage: '50 GB',
    features: [
      '2x Standard Plan Performance & Capacity',
      '~~600 GB~~ / 1000 GB Image (Can Upgrade)',
      '50 GB Video Delivery & Streaming',
      '4K Ultra Video Delivery & High-Bitrate CDN',
      'Custom Branding & White-Label Domain',
      'Priority 24/7 Studio VIP Support',
    ],
    ctaText: 'Choose Premium Elite',
  },
];

/**
 * Helper to render features, including highlighted badges for storage and high-visibility strikethroughs
 */
export const renderPlanFeature = (feat: string): React.ReactNode => {
  // Strikethrough feature: ~~600 GB~~ / 1000 GB Image (Can Upgrade)
  if (feat.includes('~~')) {
    const parts = feat.split('~~');
    const struckText = parts[1];
    const restText = parts[2] ? parts[2].replace(/^\s*\/\s*/, '') : '';

    return (
      <span className="leading-snug flex items-center flex-wrap gap-1.5">
        {parts[0] && <span>{parts[0]}</span>}
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/25 border border-rose-500/50 text-rose-200 dark:text-rose-100 font-mono font-black text-xs line-through decoration-rose-400 decoration-[2.5px] shadow-xs">
          {struckText}
        </span>
        <span className="text-neutral-400 font-bold text-xs">/</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-400/25 border border-amber-400/50 text-amber-400 dark:text-amber-300 font-black text-xs shadow-xs tracking-wide">
          {restText}
        </span>
      </span>
    );
  }

  // Highlight 200 GB Image Storage
  if (feat.includes('200 GB Image')) {
    return (
      <span className="leading-snug flex items-center flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-500 dark:text-amber-300 font-bold text-xs shadow-xs">
          200 GB Image
        </span>
        <span className="text-neutral-700 dark:text-neutral-200 font-medium">Storage</span>
      </span>
    );
  }

  // Highlight 10 GB Video Delivery
  if (feat.includes('10 GB Video')) {
    return (
      <span className="leading-snug flex items-center flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-400/20 border border-sky-400/40 text-sky-600 dark:text-sky-300 font-bold text-xs shadow-xs">
          10 GB Video
        </span>
        <span className="text-neutral-700 dark:text-neutral-200 font-medium">Delivery</span>
      </span>
    );
  }

  // Highlight 50 GB Video Delivery
  if (feat.includes('50 GB Video')) {
    return (
      <span className="leading-snug flex items-center flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-400/20 border border-sky-400/40 text-sky-600 dark:text-sky-300 font-bold text-xs shadow-xs">
          50 GB Video
        </span>
        <span className="text-neutral-700 dark:text-neutral-200 font-medium">Delivery & Streaming</span>
      </span>
    );
  }

  // Highlight 2x Standard Plan
  if (feat.includes('2x Standard Plan')) {
    return (
      <span className="leading-snug flex items-center flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 font-bold text-xs shadow-xs">
          2x Standard Plan
        </span>
        <span className="text-neutral-700 dark:text-neutral-200 font-medium">Performance & Capacity</span>
      </span>
    );
  }

  return <span className="leading-snug text-neutral-600 dark:text-neutral-300">{feat}</span>;
};
