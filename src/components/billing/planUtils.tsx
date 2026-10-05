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
 * High-visibility feature badge and strikethrough renderer.
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

/**
 * Renders the billing commitment text with prominent highlighting for "Billed Annually (₹9,600)"
 * and "Billed Quarterly (₹2,400)", cleanly omitting duplicate monthly rate prefixes.
 */
export const renderPlanBillingText = (billing: string): React.ReactNode => {
  if (!billing) return null;
  const period = getBillingPeriodText(billing);

  return (
    <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-400/20 border border-amber-500/30 dark:border-amber-400/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shadow-xs tracking-wide whitespace-nowrap shrink-0">
      {period}
    </span>
  );
};

/**
 * Returns formatted autopay label with full "Months" spelling.
 */
export const getAutopayBadgeText = (durationMonths: number): string => {
  if (durationMonths === 1) return 'Autopay: Every 1 Month';
  if (durationMonths === 3) return 'Autopay: Every 3 Months';
  if (durationMonths === 12) return 'Autopay: Every 12 Months';
  return `Autopay: Every ${durationMonths} Months`;
};

/**
 * Extracts and formats the billing period term (e.g., "Billed Annually (₹9,600)")
 */
export const getBillingPeriodText = (billing: string): string => {
  if (!billing) return '';
  if (billing.includes('•')) {
    return billing.split('•')[1]?.trim() || billing;
  }
  return billing;
};

/**
 * Ensures plan CTA text includes the duration (e.g., "(1 Year)" or "(3 Months)")
 */
export const formatPlanCtaText = (plan: {
  cta_text?: string;
  ctaText?: string;
  name: string;
  duration_months?: number;
  durationMonths?: number;
  billing_cycle?: string;
}): string => {
  const baseCta = plan.cta_text || plan.ctaText || `Choose ${plan.name}`;

  // If already has duration like "(1 Year)" or "(3 Months)", return as is
  if (/\(\s*\d+\s*(month|year)/i.test(baseCta)) {
    return baseCta;
  }

  const duration =
    plan.duration_months ||
    plan.durationMonths ||
    (plan.billing_cycle === 'annual' ? 12 : plan.billing_cycle === 'quarterly' ? 3 : 1);
  const durationLabel =
    duration === 12 ? '1 Year' : duration === 3 ? '3 Months' : duration === 1 ? '1 Month' : `${duration} Months`;

  return `${baseCta} (${durationLabel})`;
};

/**
 * Ensures plan subtitle has duration prefix if applicable
 */
export const formatPlanSubtitle = (plan: {
  subtitle?: string;
  duration_months?: number;
  durationMonths?: number;
  billing_cycle?: string;
}): string => {
  const subtitle = plan.subtitle || '';
  if (!subtitle) return '';

  if (/for \d+/i.test(subtitle)) {
    return subtitle;
  }

  const duration =
    plan.duration_months ||
    plan.durationMonths ||
    (plan.billing_cycle === 'annual' ? 12 : plan.billing_cycle === 'quarterly' ? 3 : 1);
  const durationLabel = duration === 12 ? '01 Year' : duration === 3 ? '03 Months' : `${duration} Months`;

  const cleanSub = subtitle.replace(/^2xStandard Plan\s*•\s*/i, '');
  return `For ${durationLabel} • ${cleanSub}`;
};



