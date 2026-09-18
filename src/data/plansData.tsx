import React from 'react';

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
