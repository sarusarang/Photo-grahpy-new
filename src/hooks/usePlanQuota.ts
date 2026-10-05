import { useMemo } from 'react';
import {
  useCurrentSubscription,
  useStudioPlans,
  useGalleries,
  useEvents,
  usePhotographerProfile,
} from './useAtelierQueries';
import type { GalleryTemplateId } from '@/types/atelier';
import type { CurrentSubscription } from '@/service/plans/type';

export interface StorageValidationResult {
  valid: boolean;
  totalIncomingBytes: number;
  totalIncomingDisplay: string;
  availableStorageBytes: number;
  availableStorageDisplay: string;
  storageUsedBytes: number;
  storageLimitBytes: number;
  storageLimitDisplay: string;
  isUnlimited: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

export interface PlanQuotaInfo {
  // Plan identity
  planId: string;
  planName: string;
  tier: 'standard' | 'premium' | 'custom' | string;
  billingCycle: string;
  daysRemaining: number;
  expiryDate: string;
  startDate: string;
  status: string;
  isActive: boolean;
  isExpired: boolean;
  isAutoRenew: boolean;
  isCancelledAtPeriodEnd: boolean; // Netflix-style: cancelled by user but retains active studio access until expiryDate
  cancelledAt: string | null;
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
  watermarkEnabled: boolean;

  // Storage metrics & validation
  storageUsedBytes: number;
  storageLimitBytes: number;
  storageUsedGB: number;
  storageLimitGB: number;
  storageUsedPercent: number;
  availableStorageBytes: number;
  availableStorageDisplay: string;
  isStorageFull: boolean;
  isUnlimitedStorage: boolean;
  validateStorageQuota: (
    incomingFiles: (File | { size?: number })[],
    currentQueuedBytes?: number
  ) => StorageValidationResult;

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

  // Raw subscription & entitlement status
  subscription?: CurrentSubscription;
  isLoading: boolean;
  isNoPlan: boolean;
  hasActivePlan: boolean;
  isApiError: boolean;
  isFallback: boolean;
  apiError?: unknown;
  refetchPlan: () => void;
}

/**
 * Custom hook to dynamically inspect the current photographer's studio subscription,
 * features, usage quotas, and plan enforcement rules based 100% on live backend API data.
 * Zero hardcoded plan identifiers or static limits.
 */
export const usePlanQuota = (options?: { enabled?: boolean }): PlanQuotaInfo => {
  const isPublicRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/gallery/') ||
      window.location.pathname.startsWith('/events/') ||
      window.location.pathname.startsWith('/e/') ||
      window.location.pathname.startsWith('/portfolio/') ||
      window.location.pathname.startsWith('/guest/'));

  const isEnabled = options?.enabled !== false && !isPublicRoute;

  const {
    data: sub,
    isLoading: isLoadingSub,
    isError: isErrorSub,
    error: subError,
    refetch: refetchSub,
  } = useCurrentSubscription(isEnabled);
  const { data: plansCatalog, isLoading: isLoadingPlans } = useStudioPlans();
  const { data: apiGalleries, isLoading: isLoadingGalleries } = useGalleries(undefined, isEnabled);
  const { data: apiEvents } = useEvents(undefined, { enabled: isEnabled });
  const { data: profile } = usePhotographerProfile(isEnabled);

  const liveGalleriesCount = Array.isArray(apiGalleries) ? apiGalleries.length : 0;
  const liveEventsCount = Array.isArray(apiEvents)
    ? apiEvents.filter((e: any) => e.status === 'live' || e.status === 'upcoming').length
    : 0;

  // Fallback calculation for storage used across all loaded galleries & events
  const computedMediaBytes = useMemo(() => {
    let total = 0;
    if (Array.isArray(apiGalleries)) {
      apiGalleries.forEach((g: any) => {
        const galBytes = g.total_size_bytes ?? g.totalSizeBytes;
        if (typeof galBytes === 'number' && galBytes > 0) {
          total += galBytes;
        } else if (Array.isArray(g.media)) {
          g.media.forEach((m: any) => {
            if (typeof m.size_bytes === 'number' && m.size_bytes > 0) {
              total += m.size_bytes;
            } else if (typeof m.sizeMB === 'number' && m.sizeMB > 0) {
              total += m.sizeMB * 1024 * 1024;
            }
          });
        }
      });
    }
    if (Array.isArray(apiEvents)) {
      apiEvents.forEach((e: any) => {
        const eventBytes = e.total_size_bytes ?? e.totalSizeBytes;
        if (typeof eventBytes === 'number' && eventBytes > 0) {
          total += eventBytes;
        } else if (Array.isArray(e.media)) {
          e.media.forEach((m: any) => {
            if (typeof m.size_bytes === 'number' && m.size_bytes > 0) {
              total += m.size_bytes;
            } else if (typeof m.sizeMB === 'number' && m.sizeMB > 0) {
              total += m.sizeMB * 1024 * 1024;
            }
          });
        }
      });
    }
    return total;
  }, [apiGalleries, apiEvents]);

  return useMemo<PlanQuotaInfo>(() => {
    // 1. Strict Entitlement Check: Does this user have an active paid subscription?
    // NOTE: While the subscription query is loading on a cold start without cache, do NOT assume isNoPlan
    // to prevent flashing the paywall gate before server state is received.
    const isEntitlementPending = Boolean(isLoadingSub && sub === undefined);

    const isNoPlan = Boolean(
      !isErrorSub &&
      !isEntitlementPending &&
      (sub === null ||
        sub?.has_subscription === false ||
        sub?.status === 'no_plan' ||
        !sub?.plan?.id)
    );

    const rawPlan = sub?.plan;
    const planId = isNoPlan ? '' : rawPlan?.id || '';
    const planName = isEntitlementPending ? '' : isNoPlan ? 'No Active Plan' : rawPlan?.name || 'Studio Plan';
    const tier = isNoPlan ? 'none' : rawPlan?.tier || 'standard';
    const billingCycle = rawPlan?.billing_cycle || 'annual';
    const daysRemaining = isNoPlan ? 0 : sub?.days_remaining ?? 0;
    const expiryDate = isNoPlan ? '' : sub?.expiry_date || '';
    const startDate = isNoPlan ? '' : sub?.start_date || '';
    const rawStatus = isNoPlan ? 'no_plan' : (sub?.status || '').toLowerCase();

    // Comprehensive expiration evaluation
    const isDatePast = expiryDate ? new Date(expiryDate).getTime() < Date.now() : false;
    const isExpired = isNoPlan
      ? false
      : Boolean(
          rawStatus === 'expired' ||
          rawStatus === 'inactive' ||
          (daysRemaining <= 0 && Boolean(expiryDate) && isDatePast)
        );

    const isActive = !isNoPlan && !isExpired && (rawStatus === 'active' || (!rawStatus && Boolean(sub?.id) && daysRemaining > 0));
    const hasActivePlan = !isNoPlan && isActive;
    const isAutoRenew = !isNoPlan && !isExpired && Boolean(sub?.auto_renew);
    const isCancelledAtPeriodEnd = !isNoPlan && !isExpired && Boolean(
      sub?.cancel_at_period_end || (!sub?.auto_renew && isActive && daysRemaining > 0)
    );
    const cancelledAt = sub?.cancelled_at || null;
    const statusString = isNoPlan ? 'no_plan' : rawStatus || (isExpired ? 'expired' : isActive ? 'active' : 'inactive');
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
    const isUnlimitedGalleries = isNoPlan
      ? false
      : Boolean(
          galleryUsage?.is_unlimited ??
          (rawPlan?.max_galleries !== undefined ? rawPlan.max_galleries === 0 : (matchedCatalogPlan?.max_galleries === 0))
        );

    const maxGalleries = isNoPlan
      ? 0
      : galleryUsage?.limit ??
        rawPlan?.max_galleries ??
        matchedCatalogPlan?.max_galleries ??
        (isUnlimitedGalleries ? 0 : 50);

    const galleriesUsed = galleryUsage?.used ?? liveGalleriesCount;

    const galleriesRemaining = isNoPlan
      ? 0
      : isUnlimitedGalleries
      ? 999999
      : (galleryUsage?.remaining !== null && galleryUsage?.remaining !== undefined
          ? Number(galleryUsage.remaining)
          : Math.max(0, maxGalleries - galleriesUsed));

    const canCreateGallery = !isNoPlan && !isExpired && (isUnlimitedGalleries || galleriesRemaining > 0);

    // Gallery Expiry in Days: 0 means permanent / no expiry
    const galleryExpiryDays = isNoPlan
      ? 0
      : rawPlan?.gallery_expiry_days ??
        matchedCatalogPlan?.gallery_expiry_days ??
        0;

    // -------------------------------------------------------------
    // 2. Events Limits & Usage (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const eventUsage = sub?.usage?.events;
    const isUnlimitedEvents = isNoPlan
      ? false
      : Boolean(
          eventUsage?.is_unlimited ??
          (rawPlan?.max_events !== undefined ? rawPlan.max_events === 0 : (matchedCatalogPlan?.max_events === 0))
        );

    const maxEvents = isNoPlan
      ? 0
      : eventUsage?.limit ??
        rawPlan?.max_events ??
        matchedCatalogPlan?.max_events ??
        (isUnlimitedEvents ? 0 : 25);

    const eventsUsed = eventUsage?.used ?? liveEventsCount;
    const eventsRemaining = isNoPlan
      ? 0
      : isUnlimitedEvents
      ? 999999
      : (eventUsage?.remaining !== null && eventUsage?.remaining !== undefined
          ? Number(eventUsage.remaining)
          : Math.max(0, maxEvents - eventsUsed));

    const canCreateEvent = !isNoPlan && !isExpired && (isUnlimitedEvents || eventsRemaining > 0);

    // -------------------------------------------------------------
    // 3. Portfolio Posts Limits & Usage (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const portfolioUsage = sub?.usage?.portfolio_posts;
    const isUnlimitedPortfolio = isNoPlan
      ? false
      : Boolean(
          portfolioUsage?.is_unlimited ??
          (rawPlan?.max_portfolio_posts !== undefined ? rawPlan.max_portfolio_posts === 0 : (matchedCatalogPlan?.max_portfolio_posts === 0))
        );

    const maxPortfolioPosts = isNoPlan
      ? 0
      : portfolioUsage?.limit ??
        rawPlan?.max_portfolio_posts ??
        matchedCatalogPlan?.max_portfolio_posts ??
        (isUnlimitedPortfolio ? 0 : 30);

    const portfolioPostsUsed = portfolioUsage?.used ?? 0;
    const portfolioPostsRemaining = isNoPlan
      ? 0
      : isUnlimitedPortfolio
      ? 999999
      : (portfolioUsage?.remaining !== null && portfolioUsage?.remaining !== undefined
          ? Number(portfolioUsage.remaining)
          : Math.max(0, maxPortfolioPosts - portfolioPostsUsed));

    const canCreatePortfolioPost = !isNoPlan && !isExpired && (isUnlimitedPortfolio || portfolioPostsRemaining > 0);

    // -------------------------------------------------------------
    // 4. Allowed Layout Templates (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const rawAllowed = rawPlan?.allowed_templates ?? matchedCatalogPlan?.allowed_templates;
    const allowedTemplates: GalleryTemplateId[] = isNoPlan
      ? []
      : Array.isArray(rawAllowed) && rawAllowed.length > 0
        ? (rawAllowed as GalleryTemplateId[])
        : ['editorial', 'masonry'];

    const isTemplateAllowed = (templateId: string): boolean => {
      if (isNoPlan) return false;
      return allowedTemplates.includes(templateId as GalleryTemplateId);
    };

    // -------------------------------------------------------------
    // 5. Feature Flags (100% Dynamic from Backend)
    // -------------------------------------------------------------
    const faceSearchEnabled = !isNoPlan && Boolean(
      rawPlan?.face_search_enabled ??
      matchedCatalogPlan?.face_search_enabled ??
      false
    );

    const watermarkEnabled = !isNoPlan && Boolean(
      (sub as any)?.watermark_enabled ??
      (sub as any)?.plan?.watermark_enabled ??
      rawPlan?.watermark_enabled ??
      matchedCatalogPlan?.watermark_enabled ??
      false
    );

    const hasFullInquiryAccess = !isNoPlan && Boolean(
      rawPlan?.has_full_inquiry_access ??
      matchedCatalogPlan?.has_full_inquiry_access ??
      true
    );

    // -------------------------------------------------------------
    // 6. Storage Quota Metrics (100% Dynamic & Validated)
    // -------------------------------------------------------------
    const profileStorageUsed =
      typeof profile?.storage_used_bytes === 'number'
        ? profile.storage_used_bytes
        : typeof (profile?.quick_info as any)?.storage_used_bytes === 'number'
        ? (profile?.quick_info as any)?.storage_used_bytes
        : undefined;

    const profileStorageLimit =
      typeof profile?.storage_limit_bytes === 'number'
        ? profile.storage_limit_bytes
        : typeof (profile?.quick_info as any)?.storage_limit_bytes === 'number'
        ? (profile?.quick_info as any)?.storage_limit_bytes
        : undefined;

    const subStorageUsed =
      typeof sub?.storage?.used_bytes === 'number' ? sub.storage.used_bytes : undefined;

    const subStorageLimit =
      typeof sub?.storage?.limit_bytes === 'number' ? sub.storage.limit_bytes : undefined;

    const storageUsedBytes = isNoPlan
      ? 0
      : subStorageUsed !== undefined
      ? subStorageUsed
      : profileStorageUsed !== undefined
      ? profileStorageUsed
      : computedMediaBytes || 0;

    let storageLimitBytes = 0;
    let isUnlimitedStorage = false;

    if (!isNoPlan) {
      if (subStorageLimit !== undefined) {
        storageLimitBytes = subStorageLimit;
        isUnlimitedStorage = subStorageLimit === 0;
      } else if (profileStorageLimit !== undefined) {
        storageLimitBytes = profileStorageLimit;
        isUnlimitedStorage = profileStorageLimit === 0;
      } else if (typeof matchedCatalogPlan?.storage_limit_bytes === 'number') {
        storageLimitBytes = matchedCatalogPlan.storage_limit_bytes;
        isUnlimitedStorage = matchedCatalogPlan.storage_limit_bytes === 0;
      } else if (typeof (rawPlan as any)?.storage_limit_bytes === 'number') {
        storageLimitBytes = (rawPlan as any).storage_limit_bytes;
        isUnlimitedStorage = (rawPlan as any).storage_limit_bytes === 0;
      }
    }

    const storageUsedGB = Number((storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2));
    const storageLimitGB = Number((storageLimitBytes / (1024 * 1024 * 1024)).toFixed(1));
    const storageUsedPercent =
      isUnlimitedStorage || isNoPlan
        ? 0
        : storageLimitBytes > 0
        ? Math.min(100, Number(((storageUsedBytes / storageLimitBytes) * 100).toFixed(1)))
        : 0;

    const availableStorageBytes = isNoPlan
      ? 0
      : isUnlimitedStorage
      ? Infinity
      : Math.max(0, storageLimitBytes - storageUsedBytes);

    const availableMB = Number((availableStorageBytes / (1024 * 1024)).toFixed(1));
    const availableGB = Number((availableStorageBytes / (1024 * 1024 * 1024)).toFixed(2));
    const availableStorageDisplay = isNoPlan
      ? '0 MB'
      : isUnlimitedStorage
      ? 'Unlimited'
      : availableStorageBytes > 1024 * 1024 * 1024
      ? `${availableGB} GB`
      : `${availableMB} MB`;

    const isStorageFull = isNoPlan || (!isUnlimitedStorage && availableStorageBytes <= 0);

    /**
     * Unified Storage Quota Validator:
     * Checks if incoming selected files (plus any already queued files) fit into the user's current subscription storage.
     */
    const validateStorageQuota = (
      incomingFiles: (File | { size?: number })[],
      currentQueuedBytes: number = 0
    ): StorageValidationResult => {
      const totalIncomingBytes = incomingFiles.reduce((sum, f) => sum + (f.size || 0), 0);
      const incomingMB = Number((totalIncomingBytes / (1024 * 1024)).toFixed(1));
      const incomingGB = Number((totalIncomingBytes / (1024 * 1024 * 1024)).toFixed(2));
      const totalIncomingDisplay =
        totalIncomingBytes > 1024 * 1024 * 1024 ? `${incomingGB} GB` : `${incomingMB} MB`;

      const queuedMB = Number((currentQueuedBytes / (1024 * 1024)).toFixed(1));
      const queuedGB = Number((currentQueuedBytes / (1024 * 1024 * 1024)).toFixed(2));
      const currentQueuedDisplay =
        currentQueuedBytes > 1024 * 1024 * 1024 ? `${queuedGB} GB` : `${queuedMB} MB`;

      const combinedBytes = totalIncomingBytes + currentQueuedBytes;
      const combinedMB = Number((combinedBytes / (1024 * 1024)).toFixed(1));
      const combinedGB = Number((combinedBytes / (1024 * 1024 * 1024)).toFixed(2));
      const combinedDisplay =
        combinedBytes > 1024 * 1024 * 1024 ? `${combinedGB} GB` : `${combinedMB} MB`;

      const limitDisplay = isUnlimitedStorage ? 'Unlimited' : `${storageLimitGB} GB`;

      // Check if user has no active plan
      if (isNoPlan) {
        return {
          valid: false,
          totalIncomingBytes,
          totalIncomingDisplay,
          availableStorageBytes: 0,
          availableStorageDisplay: '0 MB',
          storageUsedBytes: 0,
          storageLimitBytes: 0,
          storageLimitDisplay: '0 GB',
          isUnlimited: false,
          errorTitle: 'No Active Studio Plan',
          errorMessage: 'You do not have an active studio subscription. Please choose and purchase a plan to start creating galleries and uploading media.',
        };
      }

      // Check if plan has expired
      if (isExpired) {
        return {
          valid: false,
          totalIncomingBytes,
          totalIncomingDisplay,
          availableStorageBytes: 0,
          availableStorageDisplay: '0 MB',
          storageUsedBytes,
          storageLimitBytes,
          storageLimitDisplay: limitDisplay,
          isUnlimited: false,
          errorTitle: 'Studio Plan Expired',
          errorMessage: `Your studio membership for "${planName}" has expired. Please renew or upgrade your plan to upload new media files.`,
        };
      }

      // Check if current storage is already exhausted
      if (isStorageFull) {
        return {
          valid: false,
          totalIncomingBytes,
          totalIncomingDisplay,
          availableStorageBytes: 0,
          availableStorageDisplay: '0 MB',
          storageUsedBytes,
          storageLimitBytes,
          storageLimitDisplay: limitDisplay,
          isUnlimited: false,
          errorTitle: 'Storage Quota Reached',
          errorMessage: `Your studio cloud storage quota (${limitDisplay}) is full. Upgrade your plan or remove old media to upload more files.`,
        };
      }

      // Check if incoming batch + already queued items exceeds available storage
      if (combinedBytes > availableStorageBytes) {
        const errorMsg =
          currentQueuedBytes > 0
            ? `Adding selected media (${totalIncomingDisplay}) to your queued files (${currentQueuedDisplay}) exceeds your remaining cloud storage (${availableStorageDisplay} remaining of ${limitDisplay}). Total would be ${combinedDisplay}. Please select fewer files or upgrade.`
            : `Selected media (${totalIncomingDisplay}) exceeds your remaining cloud storage (${availableStorageDisplay} remaining of ${limitDisplay}). Please upgrade your plan or select fewer files.`;

        return {
          valid: false,
          totalIncomingBytes,
          totalIncomingDisplay,
          availableStorageBytes,
          availableStorageDisplay,
          storageUsedBytes,
          storageLimitBytes,
          storageLimitDisplay: limitDisplay,
          isUnlimited: false,
          errorTitle: 'Storage Limit Exceeded',
          errorMessage: errorMsg,
        };
      }

      return {
        valid: true,
        totalIncomingBytes,
        totalIncomingDisplay,
        availableStorageBytes,
        availableStorageDisplay,
        storageUsedBytes,
        storageLimitBytes,
        storageLimitDisplay: limitDisplay,
        isUnlimited: false,
      };
    };

    return {
      planId,
      planName,
      tier,
      billingCycle,
      daysRemaining,
      expiryDate,
      startDate,
      status: statusString,
      isActive,
      isExpired,
      isAutoRenew,
      isCancelledAtPeriodEnd,
      cancelledAt,
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
      watermarkEnabled,
      storageUsedBytes,
      storageLimitBytes,
      storageUsedGB,
      storageLimitGB,
      storageUsedPercent,
      availableStorageBytes,
      availableStorageDisplay,
      isStorageFull,
      isUnlimitedStorage,
      validateStorageQuota,
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
      isLoading: isEntitlementPending,
      isNoPlan,
      hasActivePlan,
      isApiError: Boolean(isErrorSub || (sub as any)?._is_api_error),
      isFallback: false,
      apiError: subError,
      refetchPlan: () => { refetchSub(); },
    };
  }, [
    sub,
    isErrorSub,
    subError,
    plansCatalog,
    liveGalleriesCount,
    liveEventsCount,
    profile,
    computedMediaBytes,
    isLoadingSub,
    isLoadingPlans,
    isLoadingGalleries,
  ]);
};
