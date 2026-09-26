import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import {
  X,
  Check,
  Zap,
  Sprout,
  Crown,
  Gem,
  Sliders,
  Cloud,
  Shield,
  Globe,
  Headphones,
  ArrowRight,
  Loader2,
  RefreshCw,
  CreditCard,
  AlertCircle,
  PackageOpen,
  ShieldAlert,
} from 'lucide-react';
import { renderPlanFeature } from '../../data/plansData';
import { useStudioPlans, useCurrentSubscription, usePlanUpgradeFlow } from '@/service/plans/usePlans';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import type { StudioPlan } from '@/service/plans/type';

export interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode?: string;
  errorMessage?: string;
  lockedFeature?: string;
}

const getPlanIcon = (plan: StudioPlan) => {
  if (plan.tier === 'premium' || plan.tag_type === 'popular') return Gem;
  if (plan.billing_cycle === 'annual') return Crown;
  return Sprout;
};

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  errorCode,
  errorMessage,
  lockedFeature,
}) => {
  const { subscription, upgradeSubscription } = useGallery();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const planQuota = usePlanQuota();

  // API hooks for studio plans and active subscription
  const {
    data: apiPlans,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    refetch: refetchPlans,
  } = useStudioPlans();

  const { data: activeApiSub } = useCurrentSubscription(isOpen);

  // Preferred gateway: 'direct' (instant 1-click upgrade for demo/testing) or 'razorpay'
  const [preferredGateway, setPreferredGateway] = useState<'direct' | 'razorpay'>('direct');

  // Smooth enter / exit state management
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsRendered(false);
      onClose();
    }, 240);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      handleClose();
    }
  }, [isOpen, handleClose, isRendered]);

  const { handleUpgrade, upgradingPlanId, isUpgrading } = usePlanUpgradeFlow((plan) => {
    upgradeSubscription(plan.id);
    showToast('Subscription Activated', `Successfully upgraded to ${plan.name}!`, 'success');
    handleClose();
  });

  if (!isRendered) return null;

  // Real API plans
  const plans = (apiPlans || []).map((p: StudioPlan) => {
    const price = typeof p.monthly_price === 'string' ? parseFloat(p.monthly_price) : (Number(p.monthly_price) || 0);
    const originalPrice = p.original_monthly_price != null ? (typeof p.original_monthly_price === 'string' ? parseFloat(p.original_monthly_price) : Number(p.original_monthly_price)) : undefined;
    return {
      ...p,
      price,
      originalPrice,
      billing: p.billing_text || '',
      icon: getPlanIcon(p),
      tagType: p.tag_type || 'default',
      ctaText: p.cta_text,
      features: Array.isArray(p.features) ? p.features : [],
    };
  });

  // Active subscription details (syncing API with GalleryContext fallback)
  const activePlanId = planQuota.planId || activeApiSub?.plan?.id || subscription?.id || '';
  const activePlanName = planQuota.planName || activeApiSub?.plan?.name || 'Current Studio Plan';
  const storageLimit = planQuota.storageLimitGB || (activeApiSub?.storage?.limit_gb ?? 0);
  const storageUsed = planQuota.storageUsedGB || (activeApiSub?.storage?.used_gb ?? 0);
  const usedPercentage = planQuota.storageUsedPercent || (activeApiSub?.storage?.used_percentage ?? 0);

  const handleSelectPlan = async (plan: StudioPlan) => {
    if (plan.id === activePlanId || isUpgrading) return;
    await handleUpgrade(plan, preferredGateway);
  };

  const handleManageStorage = () => {
    handleClose();
    navigate('/dashboard/settings');
  };

  return createPortal(
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-8 bg-black/85 backdrop-blur-md transition-opacity duration-240 ease-out ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full sm:max-w-[1140px] max-h-[92vh] sm:max-h-[94vh] rounded-t-[28px] sm:rounded-3xl bg-[#0c0d12] border-t sm:border border-neutral-800/90 shadow-2xl overflow-y-auto overflow-x-hidden text-neutral-100 flex flex-col p-5 sm:p-8 lg:p-9 pb-safe space-y-6 sm:space-y-7 transition-all duration-240 ease-out transform custom-scrollbar ${
          isClosing
            ? 'opacity-0 scale-[0.96] translate-y-3'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto -mt-1 mb-2 sm:hidden" />
        {/* Close Button at top right */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-30 w-9 h-9 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md active:scale-95"
          aria-label="Close upgrade modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dynamic Context / Plan Limit Notice Banner */}
        {errorMessage && (
          <div className="relative z-20 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex items-start gap-3.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  {errorCode ? errorCode.replace(/_/g, ' ') : 'Plan Quota Limit Reached'}
                </span>
                {lockedFeature && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-bold text-[9px] uppercase tracking-wider">
                    {lockedFeature}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* 1. Hero Header with Camera & Script Artwork */}
        <div className="relative pt-1 pb-2">
          {/* Background Camera & Glow */}
          <div className="absolute -right-5 sm:-right-8 -top-8 -bottom-6 w-3/4 sm:w-2/3 lg:w-1/2 overflow-hidden pointer-events-none select-none">
            <img
              src="/sony_camera_dark.jpg"
              alt="Studio Camera"
              className="w-full h-full object-cover object-right opacity-85 mix-blend-screen scale-105"
            />
            {/* Subtle warm amber radial glow */}
            <div className="absolute top-1/3 right-1/4 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            {/* Smooth gradient blends */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-transparent to-transparent" />
          </div>

          {/* Handwritten Script Quote next to camera */}
          <div className="hidden sm:flex flex-col items-end absolute top-2 right-16 sm:right-24 lg:right-32 z-10 select-none pointer-events-none transform -rotate-[7deg]">
            <span className="font-script text-2xl sm:text-3xl lg:text-4xl text-amber-300/80 tracking-wide drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
              Stories
            </span>
            <span className="font-script text-2xl sm:text-3xl lg:text-4xl text-amber-300/80 tracking-wide -mt-1 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)] pr-3">
              Deserve
            </span>
            <span className="font-script text-2xl sm:text-3xl lg:text-4xl text-amber-300/80 tracking-wide -mt-1 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
              More Space
            </span>
          </div>

          {/* Left Hero Content */}
          <div className="relative z-10 max-w-xl">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-amber-500 uppercase block mb-1.5">
              STUDIO CLOUD TIER
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-[38px] leading-tight font-serif tracking-tight font-bold">
              <span className="text-white block">Upgrade Your Studio.</span>
              <span className="text-amber-400 block font-serif">Create Without Limits.</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2.5 leading-relaxed max-w-md">
              More storage. More galleries. More possibilities.
              <br />
              Choose a plan and take your photography to the next level.
            </p>
          </div>
        </div>

        {/* 2. Currently Active Storage Status Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#13141b]/95 border border-neutral-800/90 flex flex-wrap items-center justify-between gap-4 shadow-inner">
          {/* Active Plan Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-neutral-900/90 border border-neutral-700/70 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
                Currently Active
              </p>
              <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                {activePlanName} • {storageLimit} GB Limit
              </p>
            </div>
          </div>

          {/* Storage Meter */}
          <div className="flex flex-col sm:items-center">
            <div className="flex items-center gap-3">
              <div className="w-44 sm:w-60 md:w-72 h-2 rounded-full bg-neutral-800/90 overflow-hidden ring-1 ring-neutral-700/50">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
                  style={{ width: `${usedPercentage}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                {usedPercentage}% Used
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono mt-1">
              {storageUsed} GB of {storageLimit} GB used
            </p>
          </div>

          {/* Manage Storage Button */}
          <button
            onClick={handleManageStorage}
            className="px-4 py-2.5 rounded-xl border border-neutral-700/80 bg-neutral-900/80 hover:bg-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Storage</span>
          </button>
        </div>

        {/* 2.5 Gateway Selector & Online Sync Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-500">Checkout Mode:</span>
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <button
                type="button"
                onClick={() => setPreferredGateway('direct')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  preferredGateway === 'direct'
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Instant Dev / Demo</span>
              </button>
              <button
                type="button"
                onClick={() => setPreferredGateway('razorpay')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  preferredGateway === 'razorpay'
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Razorpay Gateway</span>
              </button>
            </div>
          </div>

          {/* Sync status indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
            {isLoadingPlans ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Syncing Studio Tiers...
              </span>
            ) : isPlansError ? (
              <button
                onClick={() => refetchPlans()}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 underline"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Cloud Sync
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Pricing Active
              </span>
            )}
          </div>
        </div>

        {/* 3. Pricing Plan Cards Grid / Loader & Error UI */}
        {isLoadingPlans ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching live studio pricing from API (/api/plans/)...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 bg-[#121319]/90 border border-neutral-800 animate-pulse space-y-4 shadow-lg"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800" />
                    <div className="w-20 h-5 rounded-full bg-neutral-800" />
                  </div>
                  <div className="w-3/4 h-5 rounded bg-neutral-800" />
                  <div className="w-full h-3 rounded bg-neutral-800" />
                  <div className="w-1/2 h-8 rounded bg-neutral-800" />
                  <div className="space-y-2.5 pt-4 border-t border-neutral-800">
                    <div className="w-full h-3 rounded bg-neutral-800" />
                    <div className="w-5/6 h-3 rounded bg-neutral-800" />
                    <div className="w-4/6 h-3 rounded bg-neutral-800" />
                  </div>
                  <div className="w-full h-11 rounded-xl bg-neutral-800 mt-4" />
                </div>
              ))}
            </div>
          </div>
        ) : isPlansError ? (
          <div className="rounded-2xl p-8 sm:p-10 bg-[#141217] border border-rose-900/40 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Unable to Load Studio Plans
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Could not connect to the studio plans endpoint at{' '}
                <code className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono text-rose-300 text-xs">
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
        ) : plans.length === 0 ? (
          <div className="rounded-2xl p-8 sm:p-10 bg-[#121319]/90 border border-neutral-800 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <PackageOpen className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-white">No Studio Plans Available</h3>
              <p className="text-xs text-neutral-400">
                There are currently no active studio plans configured on the server.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetchPlans()}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = plan.id === activePlanId;
              const Icon = plan.icon;
              const isCardUpgrading = upgradingPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                    isCurrent
                      ? 'bg-[#151419] border-2 border-amber-400/90 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/30 scale-[1.01]'
                      : 'bg-[#121319]/90 border border-neutral-800 hover:border-neutral-700 hover:bg-[#151620]'
                  }`}
                >
                  <div>
                    {/* Card Header: Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isCurrent
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                            : plan.tagType === 'popular'
                            ? 'bg-neutral-900 border border-neutral-800 text-amber-400'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {isCurrent ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          YOUR PLAN
                        </span>
                      ) : plan.tagType === 'popular' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          MOST POPULAR
                        </span>
                      ) : plan.tag ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          {plan.tag}
                        </span>
                      ) : null}
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-base font-bold text-white mt-4">{plan.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 min-h-[32px]">
                      {plan.subtitle}
                    </p>

                    {/* Price Block */}
                    <div className="mt-3 pb-4 border-b border-neutral-800/80">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {plan.originalPrice && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 shadow-sm">
                            <span className="text-sm font-semibold line-through decoration-rose-400 decoration-[2.5px]">
                              ₹{plan.originalPrice.toLocaleString('en-IN')}/-
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/30 px-1.5 py-0.5 rounded">
                              {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold text-amber-400 tracking-tight">
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-medium text-neutral-400">/ Month</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1.5">
                        {plan.billing}
                      </p>
                    </div>

                    {/* Features List with Amber Checkmarks */}
                    <ul className="space-y-3 my-5 text-xs text-neutral-300">
                      {plan.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{renderPlanFeature(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Action CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isUpgrading}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/20 active:scale-98 cursor-default'
                        : isCardUpgrading
                        ? 'bg-neutral-800 text-amber-400 cursor-wait'
                        : 'bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white hover:text-white active:scale-98'
                    }`}
                  >
                    {isCardUpgrading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Activating...</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Current Plan</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.ctaText || `Choose ${plan.name}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Footer Trust Badges */}
        <div className="pt-6 border-t border-neutral-800/80 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Secure & Encrypted</p>
              <p className="text-[11px] text-neutral-400">Your data is always safe</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Blazing Fast</p>
              <p className="text-[11px] text-neutral-400">NVMe powered storage</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Access Anywhere</p>
              <p className="text-[11px] text-neutral-400">Your studio, worldwide</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">24/7 Support</p>
              <p className="text-[11px] text-neutral-400">We're here for you</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
