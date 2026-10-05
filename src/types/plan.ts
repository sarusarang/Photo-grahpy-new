import type { GalleryTemplateId } from './template';
import type { StudioPlan, CurrentSubscription } from '@/service/plans/type';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'starter' | 'pro' | 'studio' | 'master' | 'standard' | 'premium' | 'custom' | string;
  priceMonthly: number;
  billingCycle: 'monthly' | 'annual' | string;
  storageLimitGB: number;
  storageUsedGB: number;
  daysRemaining: number;
  expiryDate: string;
  status: 'active' | 'trial' | 'past_due' | 'expired' | 'inactive' | string;
  features: string[];
}

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
  isCancelledAtPeriodEnd: boolean;
  cancelledAt: string | null;
  currency: string;
  totalPrice: string | number;

  // Gallery limits & usage
  maxGalleries: number;
  isUnlimitedGalleries: boolean;
  galleriesUsed: number;
  galleriesRemaining: number;
  canCreateGallery: boolean;
  galleryExpiryDays: number;

  // Layout templates allowed
  allowedTemplates: GalleryTemplateId[];
  isTemplateAllowed: (templateId: string) => boolean;

  // AI & Discovery features
  faceSearchEnabled: boolean;

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

  // Raw subscription, error & entitlement status
  subscription?: CurrentSubscription;
  isLoading: boolean;
  isNoPlan: boolean;
  hasActivePlan: boolean;
  isApiError: boolean;
  isFallback: boolean;
  apiError?: unknown;
  refetchPlan: () => void;
}

export type { StudioPlan, CurrentSubscription };
