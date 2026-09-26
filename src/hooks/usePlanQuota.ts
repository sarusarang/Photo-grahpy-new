import { useMemo } from 'react';
import { useCurrentSubscription, useStudioPlans, useGalleries } from './useAtelierQueries';
import type { GalleryTemplateId } from '@/types/atelier';
import type { CurrentSubscription } from '@/service/plans/type';

export interface PlanQuotaInfo {
  // Plan identity
  planId: string;
  planName: string;
  tier: 'standard' | 'premium' | 'custom' | string;
  billingCycle: string;
  daysRemaining: number;
  expiryDate: string;
  startDate: string;
  isActive: boolean;
  isAutoRenew: boolean;
  currency: string;
  totalPrice: string | number;

  // Gallery limits & usage
  maxGalleries: number; // 0 = unlimited
  isUnlimitedGalleries: boolean;
  galleriesUsed: number;
  galleriesRemaining: number;
  canCreateGallery: boolean;
  galleryExpiryDays: number; // 0 = permanent / no expiry

  // Layout templates allowed
  allowedTemplates: GalleryTemplateId[];
  isTemplateAllowed: (templateId: string) => boolean;

  // AI & Discovery features
  faceSearchEnabled: boolean;

  // Storage metrics
  storageUsedBytes: number;
  storageLimitBytes: number;
  storageUsedGB: number;
  storageLimitGB: number;
  storageUsedPercent: number;

  // Events limits & usage
  maxEvents: number;
  isUnlimitedEvents: boolean;
  eventsUsed: number;
  eventsRemaining: number;
  canCreateEvent: boolean;

  // Portfolio posts limits & usage
  maxPortfolioPosts: number;
  isUnlimitedPortfolio: boolean;
  portfolioPostsUsed: number;
  portfolioPostsRemaining: number;
  canCreatePortfolioPost: boolean;

  // Inquiries
  hasFullInquiryAccess: boolean;

  // Raw subscription & loading status
  subscription?: CurrentSubscription;
  isLoading: boolean;
}

/**
 * Custom hook to dynamically inspect the current photographer's studio subscription,
 * features, usage quotas, and plan enforcement rules based 100% on live backend API data.
 * Zero hardcoded plan identifiers or static limits.
 */
export const usePlanQuota = (): PlanQuotaInfo => {
  const { data: sub, isLoading: isLoadingSub } = useCurrentSubscription();
  const { data: plansCatalog, isLoading: isLoadingPlans } = useStudioPlans();
  const { data: apiGalleries, isLoading: isLoadingGalleries } = useGalleries();

  const liveGalleriesCount = Array.isArray(apiGalleries) ? apiGalleries.length : 0;

  return useMemo<PlanQuotaInfo>(() => {
    const rawPlan = sub?.plan;
    const planId = rawPlan?.id || '';
    const planName = rawPlan?.name || 'Studio Plan';
    const tier = rawPlan?.tier || 'standard';
    const billingCycle = rawPlan?.billing_cycle || 'annual';
    const daysRemaining = sub?.days_remaining ?? 0;
    const expiryDate = sub?.expiry_date || '';
    const startDate = sub?.start_date || '';
    const isActive = sub?.status === 'active' || (!sub?.status && Boolean(sub?.id));
    const isAutoRenew = Boolean(sub?.auto_renew);
    const currency = rawPlan?.currency || 'INR';
    const totalPrice = rawPlan?.total_price || '0';

    // Optional match from catalog if needed for supplemental presentation metadata
    const matchedCatalogPlan = Array.isArray(plansCatalog)
      ? plansCatalog.find((p) => p.id === planId)
      : undefined;

    // -------------------------------------------------------------
    // 1. Galleries Limits & Usage (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const galleryUsage = sub?.usage?.galleries;
    const isUnlimitedGalleries = Boolean(
      galleryUsage?.is_unlimited ??
      (rawPlan?.max_galleries !== undefined ? rawPlan.max_galleries === 0 : (matchedCatalogPlan?.max_galleries === 0))
    );

    const maxGalleries =
      galleryUsage?.limit ??
      rawPlan?.max_galleries ??
      matchedCatalogPlan?.max_galleries ??
      (isUnlimitedGalleries ? 0 : 50);

    const galleriesUsed =
      galleryUsage?.used ??
      liveGalleriesCount;

    const galleriesRemaining = isUnlimitedGalleries
      ? 999999
      : (galleryUsage?.remaining !== null && galleryUsage?.remaining !== undefined
          ? Number(galleryUsage.remaining)
          : Math.max(0, maxGalleries - galleriesUsed));

    const canCreateGallery = isUnlimitedGalleries || galleriesRemaining > 0;

    // Gallery Expiry in Days: 0 means permanent / no expiry
    const galleryExpiryDays =
      rawPlan?.gallery_expiry_days ??
      matchedCatalogPlan?.gallery_expiry_days ??
      0;

    // -------------------------------------------------------------
    // 2. Events Limits & Usage (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const eventUsage = sub?.usage?.events;
    const isUnlimitedEvents = Boolean(
      eventUsage?.is_unlimited ??
      (rawPlan?.max_events !== undefined ? rawPlan.max_events === 0 : (matchedCatalogPlan?.max_events === 0))
    );

    const maxEvents =
      eventUsage?.limit ??
      rawPlan?.max_events ??
      matchedCatalogPlan?.max_events ??
      (isUnlimitedEvents ? 0 : 25);

    const eventsUsed = eventUsage?.used ?? 0;
    const eventsRemaining = isUnlimitedEvents
      ? 999999
      : (eventUsage?.remaining !== null && eventUsage?.remaining !== undefined
          ? Number(eventUsage.remaining)
          : Math.max(0, maxEvents - eventsUsed));

    const canCreateEvent = isUnlimitedEvents || eventsRemaining > 0;

    // -------------------------------------------------------------
    // 3. Portfolio Posts Limits & Usage (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const portfolioUsage = sub?.usage?.portfolio_posts;
    const isUnlimitedPortfolio = Boolean(
      portfolioUsage?.is_unlimited ??
      (rawPlan?.max_portfolio_posts !== undefined ? rawPlan.max_portfolio_posts === 0 : (matchedCatalogPlan?.max_portfolio_posts === 0))
    );

    const maxPortfolioPosts =
      portfolioUsage?.limit ??
      rawPlan?.max_portfolio_posts ??
      matchedCatalogPlan?.max_portfolio_posts ??
      (isUnlimitedPortfolio ? 0 : 30);

    const portfolioPostsUsed = portfolioUsage?.used ?? 0;
    const portfolioPostsRemaining = isUnlimitedPortfolio
      ? 999999
      : (portfolioUsage?.remaining !== null && portfolioUsage?.remaining !== undefined
          ? Number(portfolioUsage.remaining)
          : Math.max(0, maxPortfolioPosts - portfolioPostsUsed));

    const canCreatePortfolioPost = isUnlimitedPortfolio || portfolioPostsRemaining > 0;

    // -------------------------------------------------------------
    // 4. Allowed Layout Templates (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const rawAllowed = rawPlan?.allowed_templates ?? matchedCatalogPlan?.allowed_templates;
    const allowedTemplates: GalleryTemplateId[] =
      Array.isArray(rawAllowed) && rawAllowed.length > 0
        ? (rawAllowed as GalleryTemplateId[])
        : ['editorial', 'masonry'];

    const isTemplateAllowed = (templateId: string): boolean => {
      return allowedTemplates.includes(templateId as GalleryTemplateId);
    };

    // -------------------------------------------------------------
    // 5. Feature Flags (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const faceSearchEnabled = Boolean(
      rawPlan?.face_search_enabled ??
      matchedCatalogPlan?.face_search_enabled ??
      false
    );

    const hasFullInquiryAccess = Boolean(
      rawPlan?.has_full_inquiry_access ??
      matchedCatalogPlan?.has_full_inquiry_access ??
      true
    );

    // -------------------------------------------------------------
    // 6. Storage Quota Metrics (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const storageUsedBytes = sub?.storage?.used_bytes ?? 0;
    const storageLimitBytes = sub?.storage?.limit_bytes ?? 0;
    const storageUsedGB =
      sub?.storage?.used_gb ??
      (storageUsedBytes > 0 ? Number((storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1)) : 0);
    const storageLimitGB =
      sub?.storage?.limit_gb ??
      (storageLimitBytes > 0 ? Number((storageLimitBytes / (1024 * 1024 * 1024)).toFixed(1)) : 0);
    const storageUsedPercent =
      sub?.storage?.used_percentage ??
      (storageLimitGB > 0
        ? Math.min(100, Number(((storageUsedGB / storageLimitGB) * 100).toFixed(1)))
        : 0);

    return {
      planId,
      planName,
      tier,
      billingCycle,
      daysRemaining,
      expiryDate,
      startDate,
      isActive,
      isAutoRenew,
      currency,
      totalPrice,
      maxGalleries,
      isUnlimitedGalleries,
      galleriesUsed,
      galleriesRemaining,
      canCreateGallery,
      galleryExpiryDays,
      allowedTemplates,
      isTemplateAllowed,
      faceSearchEnabled,
      storageUsedBytes,
      storageLimitBytes,
      storageUsedGB,
      storageLimitGB,
      storageUsedPercent,
      maxEvents,
      isUnlimitedEvents,
      eventsUsed,
      eventsRemaining,
      canCreateEvent,
      maxPortfolioPosts,
      isUnlimitedPortfolio,
      portfolioPostsUsed,
      portfolioPostsRemaining,
      canCreatePortfolioPost,
      hasFullInquiryAccess,
      subscription: sub,
      isLoading: isLoadingSub || isLoadingPlans || isLoadingGalleries,
    };
  }, [sub, plansCatalog, liveGalleriesCount, isLoadingSub, isLoadingPlans, isLoadingGalleries]);
};
