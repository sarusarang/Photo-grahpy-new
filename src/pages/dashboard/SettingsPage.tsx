import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import { UpgradePlanModal, getPlanRank } from '../../components/common/UpgradePlanModal';
import { CancelPlanModal } from '../../components/common/CancelPlanModal';
import { PersonalInformationSection } from '../../components/settings/PersonalInformationSection';
import { NotificationSettingsSection } from '../../components/settings/NotificationSettingsSection';
import { WatermarkSettingsSection } from '../../components/settings/WatermarkSettingsSection';
import { renderPlanFeature } from '../../data/plansData';
import {
  renderPlanBillingText,
  getAutopayBadgeText,
  formatPlanCtaText,
  formatPlanSubtitle,
} from '@/components/billing/planUtils';
import {
  useStudioPlans,
  useCurrentSubscription,
  usePlanUpgradeFlow,
  useResumeSubscription,
} from '@/service/plans/usePlans';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { getPortfolioShareUrl } from '@/utils/domain';
import type { StudioPlan } from '@/service/plans/type';
import {
  User,
  CreditCard,
  Cloud,
  Bell,
  Shield,
  Crown,
  Check,
  Zap,
  LogOut,
  Loader2,
  Sprout,
  Gem,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  PackageOpen,
  Globe,
  Headphones,
  ExternalLink,
  Lock,
  Clock,
  Ban,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Stamp,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { photographer, user, logout, isLoggingOut } = useAuth();
  const { subscription, upgradeSubscription } = useGallery();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const planQuota = usePlanQuota();

  // Studio Plans & Active Subscription API hooks
  const {
    data: apiPlans,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    refetch: refetchPlans,
  } = useStudioPlans();

  const [activeTab, setActiveTab] = useState<'profile' | 'watermark' | 'billing' | 'notifications' | 'account'>('profile');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { data: activeApiSub } = useCurrentSubscription(activeTab === 'billing');

  const { handleUpgrade, upgradingPlanId, isUpgrading } = usePlanUpgradeFlow((plan) => {
    upgradeSubscription(plan.id);
    showToast('Subscription Activated', `Switched to ${plan.name} successfully!`, 'success');
  });

  const { mutate: resumeSubscription, isPending: isResumingSubscription } = useResumeSubscription();

  const handleOpenCancelModal = () => {
    setIsCancelModalOpen(true);
  };

  const handleResumeAutopay = () => {
    resumeSubscription(undefined, {
      onSuccess: () => {
        showToast('Membership Restarted', 'Recurring autopay is active again. Your plan will renew automatically.', 'success');
      },
      onError: (err: any) => {
        showToast('Error', err?.message || 'Failed to restart subscription.', 'error');
      },
    });
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 1. Hero Banner matching exact screenshot */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200/90 dark:border-neutral-800/80 bg-gradient-to-r from-[#faf8f5] via-[#f7f4ec] to-[#f2ebde] dark:bg-[#0c0d12] p-6 sm:p-8 min-h-[160px] sm:min-h-[175px] flex items-center justify-between shadow-xs dark:shadow-lg">
        {/* Background Image: Sony Alpha Camera Body & Lens on Right */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-1/2 overflow-hidden pointer-events-none select-none">
          <img
            src="/sony_camera_light.jpg"
            alt="Sony Camera"
            className="w-full h-full object-cover object-right opacity-95 dark:hidden block"
          />
          <img
            src="/sony_camera_dark.jpg"
            alt="Sony Camera"
            className="w-full h-full object-cover object-right opacity-90 mix-blend-screen hidden dark:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf8f5] via-[#faf8f5]/85 to-transparent dark:from-[#0c0d12] dark:via-[#0c0d12]/80 dark:to-transparent" />
        </div>

        {/* Left Side: Title & Subtitle */}
        <div className="relative z-10 max-w-xl">
          <span className="text-[11px] uppercase tracking-[0.2em] font-mono font-bold text-amber-600 dark:text-amber-400 block mb-1.5">
            STUDIO PREFERENCES
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-neutral-950 dark:text-white tracking-tight font-bold">
            Settings & Plan
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Manage your photographer branding, billing tier, storage limits, and notification preferences.
          </p>
        </div>

        {/* Right Side: Quote before the camera */}
        <div className="hidden md:flex flex-col items-start relative z-10 mr-48 lg:mr-64 shrink-0 text-left">
          <p className="font-serif italic text-neutral-700 dark:text-neutral-300 text-sm sm:text-base leading-snug">
            “Better photos<br />
            Better stories.”
          </p>
          <div className="w-10 h-[1px] bg-neutral-300 dark:bg-neutral-700 mt-2.5" />
        </div>
      </div>

      {/* 2. Navigation Tabs Bar (Smooth Horizontal Swipe on Mobile) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 w-full sm:w-fit overflow-x-auto no-scrollbar flex-nowrap shadow-xs -mx-4 px-4 sm:mx-0 sm:px-1">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'watermark', label: 'Watermark Suite', icon: Stamp },
          { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'account', label: 'Account', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-500/10'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Content Grid for Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Public Portfolio Quick Access Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-neutral-900/50 to-neutral-900/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-500 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Your Public Monograph Portfolio</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {getPortfolioShareUrl(user?.username || photographer.id || 'studio')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getPortfolioShareUrl(user?.username || photographer.id || 'studio'));
                  showToast('Public portfolio link copied to clipboard!', 'success');
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Copy Link
              </button>

              <Link
                to={`/portfolio/${user?.username || photographer.id || 'studio'}`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-xs"
              >
                <span>Preview</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          <PersonalInformationSection
            onManagePlan={() => setActiveTab('billing')}
          />
        </div>
      )}

      {/* Tab: Watermark Suite */}
      {activeTab === 'watermark' && (
        <WatermarkSettingsSection onManagePlan={() => setActiveTab('billing')} />
      )}

      {/* Tab 2: Plan & Billing */}
      {activeTab === 'billing' && (() => {
        const billingActivePlanId = planQuota.planId || activeApiSub?.plan?.id || subscription?.id || '';
        const billingActivePlanName = planQuota.planName || activeApiSub?.plan?.name || 'Studio Plan';
        const billingStorageLimit = planQuota.storageLimitGB || (activeApiSub?.storage?.limit_gb ?? 0);
        const billingStorageUsed = planQuota.storageUsedGB || (activeApiSub?.storage?.used_gb ?? 0);
        const billingUsedPct = planQuota.storageUsedPercent || (activeApiSub?.storage?.used_percentage ?? 0);

        const hasActivePlan = Boolean(billingActivePlanId) && (activeApiSub?.status === 'active' || planQuota.isActive);
        const isExpired = Boolean(
          activeApiSub?.status === 'expired' ||
          planQuota.isExpired ||
          (typeof planQuota.daysRemaining === 'number' && planQuota.daysRemaining <= 0 && Boolean(activeApiSub?.expiry_date))
        );
        const isRestrictedToUpgrades = hasActivePlan && !isExpired;
        const isAnyPlanUpgrading = Boolean(upgradingPlanId) || isUpgrading;

        const billingPlans = (apiPlans || []).map((p: StudioPlan) => {
          const price = typeof p.monthly_price === 'string' ? parseFloat(p.monthly_price) : (Number(p.monthly_price) || 0);
          const originalPrice = p.original_monthly_price != null ? (typeof p.original_monthly_price === 'string' ? parseFloat(p.original_monthly_price) : Number(p.original_monthly_price)) : undefined;
          const durationMonths = p.duration_months || (p.billing_cycle === 'annual' ? 12 : p.billing_cycle === 'quarterly' ? 3 : 1);
          const isPremium = p.id.includes('premium') || p.tier === 'premium';
          const tag = isPremium && p.tag === 'MOST POPULAR' ? '2XSTANDARD PLAN' : (p.tag || (isPremium ? '2XSTANDARD PLAN' : ''));
          const tagType = isPremium ? 'default' : (p.tag_type || (p.id === 'plan-standard-1y' ? 'popular' : 'default'));
          const ctaText = formatPlanCtaText({ ...p, duration_months: durationMonths });
          const subtitle = formatPlanSubtitle({ ...p, duration_months: durationMonths });
          return {
            ...p,
            price,
            originalPrice,
            duration_months: durationMonths,
            billing: p.billing_text || (p.billing_cycle === 'annual' ? 'billed annually' : 'billed monthly'),
            icon: isPremium ? Gem : p.billing_cycle === 'annual' ? Crown : Sprout,
            tag,
            tagType,
            ctaText,
            subtitle,
            features: Array.isArray(p.features) ? p.features : [],
          };
        });

        const currentPlanRank = activeApiSub?.plan
          ? getPlanRank(activeApiSub.plan)
          : (billingPlans.find((p) => p.id === billingActivePlanId) ? getPlanRank(billingPlans.find((p) => p.id === billingActivePlanId)!) : 0);

        return (
          <div className="space-y-6 fade-up">
            {/* Resilient Fallback Notice Banner */}
            {planQuota.isFallback && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    Viewing cached studio plan details. Your cloud storage and features remain completely accessible.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => planQuota.refetchPlan()}
                  className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Retry Sync
                </button>
              </div>
            )}

            {/* 1. Executive Active Subscription & Autopay Status Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#13141b]/95 border border-neutral-200 dark:border-neutral-800/90 shadow-sm dark:shadow-xl space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-4 border-b border-neutral-100 dark:border-neutral-800/60">
                {/* Left: Plan Identity & Real-time Status Badges */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 shadow-sm">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {isExpired ? 'MEMBERSHIP EXPIRED' : 'ACTIVE MEMBERSHIP'}
                      </span>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold font-mono">
                          <AlertCircle className="w-3 h-3" />
                          EXPIRED
                        </span>
                      ) : activeApiSub?.auto_renew ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          AUTOPAY ACTIVE
                        </span>
                      ) : (activeApiSub?.days_remaining ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          CANCELLATION SCHEDULED
                        </span>
                      ) : planQuota.isFallback ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          STUDIO ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-bold font-mono">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>{billingActivePlanName}</span>
                      <span className="text-xs font-normal text-neutral-400">({billingStorageLimit} GB Storage)</span>
                    </h2>

                    {activeApiSub?.expiry_date && (
                      <p className={`text-xs font-mono flex items-center gap-1.5 ${
                        isExpired ? 'text-rose-500 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isExpired ? (
                            <>
                              Plan expired on{' '}
                              <strong className="text-rose-600 dark:text-rose-300">
                                {new Date(activeApiSub.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </strong>{' '}
                              (Studio creation features paused)
                            </>
                          ) : (
                            <>
                              {activeApiSub.auto_renew ? 'Renews automatically on' : 'Access active until'}{' '}
                              <strong className="text-neutral-800 dark:text-neutral-200">
                                {new Date(activeApiSub.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </strong>{' '}
                              ({activeApiSub.days_remaining} days left)
                            </>
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions Row */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* If expired: Prominent Renew / Select Plan Button */}
                  {isExpired && (
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      disabled={isAnyPlanUpgrading}
                      className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95 ${
                        isAnyPlanUpgrading ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Renew / Select Plan</span>
                    </button>
                  )}

                  {/* If recurring autopay is active and NOT expired: Modern Cancel Autopay Button */}
                  {!isExpired && activeApiSub?.auto_renew && (
                    <button
                      type="button"
                      onClick={handleOpenCancelModal}
                      disabled={isAnyPlanUpgrading}
                      className={`px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700/80 hover:border-rose-400 dark:hover:border-rose-800/80 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                        isAnyPlanUpgrading ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Autopay</span>
                    </button>
                  )}

                  {/* If cancelled: Modern Restart Membership Button */}
                  {!isExpired && !activeApiSub?.auto_renew && (activeApiSub?.days_remaining ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={handleResumeAutopay}
                      disabled={isResumingSubscription || isAnyPlanUpgrading}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isResumingSubscription ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Restarting...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restart Membership</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Upgrade Studio Modal Trigger if NOT expired */}
                  {!isExpired && (
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      disabled={isAnyPlanUpgrading}
                      className={`px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                        isAnyPlanUpgrading ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current text-amber-400 dark:text-amber-500" />
                      <span>{hasActivePlan ? 'Change / Upgrade Plan' : 'Choose Studio Plan'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom: Storage Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Cloud Storage Meter
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {billingStorageUsed} GB of {billingStorageLimit} GB used ({billingUsedPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700/50">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
                    style={{ width: `${billingUsedPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sync Status Banner */}
            <div className="flex items-center justify-between px-1 text-xs text-neutral-500">
              <span className="font-mono uppercase tracking-wider text-[10px]">
                Available Studio Tiers
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {isLoadingPlans ? (
                  <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching latest plans...
                  </span>
                ) : isPlansError ? (
                  <button
                    onClick={() => refetchPlans()}
                    className="flex items-center gap-1 text-rose-500 dark:text-rose-400 hover:underline font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry Sync
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Cloud Pricing Active
                  </span>
                )}
              </div>
            </div>

            {/* 2. Pricing Plan Cards Grid / Loader & Error UI */}
            {isLoadingPlans ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading live studio pricing from API (/api/plans/)...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl p-6 bg-white dark:bg-[#121319]/90 border border-neutral-200 dark:border-neutral-800 animate-pulse space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                        <div className="w-20 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div className="w-3/4 h-5 rounded bg-neutral-200 dark:bg-neutral-800" />
                      <div className="w-full h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
                      <div className="w-1/2 h-8 rounded bg-neutral-200 dark:bg-neutral-800" />
                      <div className="space-y-2.5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="w-full h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="w-5/6 h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="w-4/6 h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div className="w-full h-11 rounded-xl bg-neutral-200 dark:bg-neutral-800 mt-4" />
                    </div>
                  ))}
                </div>
              </div>
            ) : isPlansError ? (
              <div className="rounded-2xl p-8 sm:p-10 bg-rose-50/60 dark:bg-[#151216] border border-rose-200 dark:border-rose-900/50 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    Unable to Load Studio Plans
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Could not fetch pricing tiers from the server at{' '}
                    <code className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 font-mono text-rose-600 dark:text-rose-300 text-xs">
                      /api/plans/
                    </code>
                    . Please verify your backend server or tunnel is running.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => refetchPlans()}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              </div>
            ) : billingPlans.length === 0 ? (
              <div className="rounded-2xl p-8 sm:p-10 bg-white dark:bg-[#121319]/90 border border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                  <PackageOpen className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">No Studio Plans Available</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    There are currently no active studio plans published on the server.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => refetchPlans()}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {billingPlans.map((plan) => {
                  const isCurrent = billingActivePlanId === plan.id;
                  const Icon = plan.icon;
                  const isCardUpgrading = upgradingPlanId === plan.id;
                  const isOtherPlanUpgrading = isAnyPlanUpgrading && !isCardUpgrading;
                  const thisPlanRank = getPlanRank(plan);
                  const isDownward = isRestrictedToUpgrades && !isCurrent && thisPlanRank <= currentPlanRank;
                  const isButtonDisabled = isCardUpgrading || isOtherPlanUpgrading || isDownward || (isCurrent && !isExpired);

                  const durationMonths =
                    plan.duration_months ||
                    (plan.billing_cycle === 'annual' ? 12 : plan.billing_cycle === 'quarterly' ? 3 : 1);

                  const autopayBadge = getAutopayBadgeText(durationMonths);

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                        isCurrent
                          ? 'bg-neutral-50 dark:bg-[#151419] border-2 border-amber-400/90 shadow-xl dark:shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/30 scale-[1.01]'
                          : isDownward
                          ? 'bg-neutral-50/50 dark:bg-[#101015]/60 border border-neutral-200/60 dark:border-neutral-800/60 opacity-60 hover:opacity-75'
                          : 'bg-white dark:bg-[#121319]/90 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-[#151620]'
                      } ${isOtherPlanUpgrading ? 'opacity-50' : ''}`}
                    >
                      <div>
                        {/* Card Header: Icon & Badge */}
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isCurrent
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400'
                                : isDownward
                                ? 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-400'
                                : plan.tagType === 'popular'
                                ? 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-amber-500 dark:text-amber-400'
                                : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          {isCurrent && isExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                              EXPIRED PLAN
                            </span>
                          ) : isCurrent ? (
                            <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                              YOUR PLAN
                            </span>
                          ) : isDownward ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              LOWER TIER
                            </span>
                          ) : plan.tagType === 'popular' ? (
                            <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                              MOST POPULAR
                            </span>
                          ) : plan.tag ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">
                              {plan.tag}
                            </span>
                          ) : null}
                        </div>

                        {/* Title & Subtitle with guaranteed identical height across all cards */}
                        <div className="h-16 shrink-0 flex flex-col justify-start mt-4">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">{plan.name}</h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug line-clamp-2">
                            {plan.subtitle}
                          </p>
                        </div>

                        {/* Price Block with Fixed Heights for Perfect Alignment */}
                        <div className="mt-2 pb-4 border-b border-neutral-200 dark:border-neutral-800/80 flex flex-col shrink-0">
                          {/* Row 1: Original Strikethrough Discount Pill (exact same height on all cards) */}
                          <div className="h-6 shrink-0 flex items-center">
                            {plan.originalPrice && plan.originalPrice > plan.price ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 shadow-xs">
                                <span className="text-xs font-semibold line-through decoration-rose-500 dark:decoration-rose-400 decoration-[1.5px]">
                                  ₹{plan.originalPrice.toLocaleString('en-IN')}/-
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300 bg-rose-500/20 px-1 py-0.5 rounded">
                                  {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                                </span>
                              </div>
                            ) : (
                              <div className="h-6 shrink-0" />
                            )}
                          </div>

                          {/* Row 2: Monthly Price and Billed Section in a single row */}
                          <div className="flex items-center justify-between gap-2 mt-1 shrink-0 h-10">
                            <div className="flex items-baseline gap-1 shrink-0">
                              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-500 dark:text-amber-400 tracking-tight font-mono">
                                ₹{plan.price.toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">/ Month</span>
                            </div>
                            <div className="shrink-0">
                              {renderPlanBillingText(plan.billing)}
                            </div>
                          </div>

                          {/* Row 3: Autopay Badge */}
                          <div className="mt-2.5 flex items-center shrink-0">
                            <span className="text-[10px] sm:text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {autopayBadge}
                            </span>
                          </div>
                        </div>

                        {/* Features List with Amber Checkmarks */}
                        <ul className="space-y-3 my-5 text-xs text-neutral-700 dark:text-neutral-300">
                          {plan.features.map((feat: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{renderPlanFeature(feat)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Bottom Action CTA Button */}
                      <div>
                        <button
                          onClick={async () => {
                            if (!isButtonDisabled) {
                              await handleUpgrade(plan);
                            }
                          }}
                          disabled={isButtonDisabled}
                          className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isCardUpgrading
                              ? 'bg-neutral-800 text-amber-400 cursor-wait'
                              : isOtherPlanUpgrading
                              ? 'bg-neutral-200 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 opacity-40 cursor-not-allowed pointer-events-none shadow-none'
                              : isCurrent && !isExpired
                              ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/20 active:scale-98 cursor-default'
                              : isCurrent && isExpired
                              ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-lg shadow-rose-500/20 active:scale-98 cursor-pointer'
                              : isDownward
                              ? 'bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                              : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold shadow-md shadow-amber-500/20 active:scale-98 cursor-pointer'
                          }`}
                        >
                          {isCardUpgrading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              <span>Initiating Razorpay...</span>
                            </>
                          ) : isCurrent && !isExpired ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Current Plan</span>
                            </>
                          ) : isCurrent && isExpired ? (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>Renew {plan.name}</span>
                            </>
                          ) : isDownward ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Downgrade Unavailable</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isExpired ? `Select ${plan.name}` : `Upgrade to ${plan.name}`}</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                            </>
                          )}
                        </button>
                        {isDownward && (
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 text-center leading-tight">
                            Active plans cannot be downgraded during active billing period
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Footer Trust Badges */}
            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800/80 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Secure & Encrypted</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Your data is always safe</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Blazing Fast</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">NVMe powered storage</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Access Anywhere</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Your studio, worldwide</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">24/7 Support</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">We're here for you</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}





      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && <NotificationSettingsSection />}


      {/* Tab 4: Account & Authentication */}
      {activeTab === 'account' && (
        <div className="max-w-2xl space-y-6 fade-up">
          {/* Account Credentials Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-500 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-bold">
                  Account Credentials & Authentication
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Manage your authenticated session and photographer credentials.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Studio Photographer
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white mt-1 block">
                  {photographer.fullName || user?.username || 'Studio Artist'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Primary Email
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white mt-1 block truncate">
                  {photographer.email || user?.email || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Session & Sign Out Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-900/40 space-y-4">
            <h3 className="text-lg font-serif text-rose-700 dark:text-rose-400 font-bold">Session & Sign Out</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Logged in as <strong className="text-neutral-900 dark:text-white">{photographer.email}</strong>. Logging out returns to the studio sign-in gate.
            </p>
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out of Photographer Session'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Cancel Plan Modal (Netflix-Style) */}
      <CancelPlanModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};
