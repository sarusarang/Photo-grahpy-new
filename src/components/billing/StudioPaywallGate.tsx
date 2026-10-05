import React from 'react';
import {
  Sparkles,
  Check,
  Crown,
  Gem,
  Sprout,
  LogOut,
  ArrowRight,
  Loader2,
  ShieldCheck,
  HardDrive,
  Zap,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStudioPlans, usePlanUpgradeFlow } from '@/service/plans/usePlans';
import type { StudioPlan } from '@/service/plans/type';
import {
  renderPlanFeature,
  renderPlanBillingText,
  getAutopayBadgeText,
  formatPlanCtaText,
  formatPlanSubtitle,
} from '@/components/billing/planUtils';
import { toast } from 'sonner';

const getPlanIcon = (plan: StudioPlan) => {
  if (plan.tier === 'premium' || plan.id.includes('elite')) return Gem;
  if (plan.billing_cycle === 'annual') return Crown;
  return Sprout;
};

export const StudioPaywallGate: React.FC = () => {
  const { user, photographer, logout } = useAuth();

  const {
    data: plansData,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    refetch: refetchPlans,
  } = useStudioPlans();

  const { handleUpgrade, upgradingPlanId, isUpgrading } = usePlanUpgradeFlow(
    (plan) => {
      toast.success('Studio Activated!', {
        description: `Welcome to ${plan.name}. Your photography workspace is now unlocked!`,
      });
    }
  );

  const photographerName =
    photographer?.studioName ||
    user?.fullname ||
    user?.username ||
    'Photographer';

  // Process plans identical to the dashboard UpgradePlanModal
  const plans = (plansData || []).map((p: StudioPlan) => {
    const price =
      typeof p.monthly_price === 'string'
        ? parseFloat(p.monthly_price)
        : Number(p.monthly_price) || 0;
    const originalPrice =
      p.original_monthly_price != null
        ? typeof p.original_monthly_price === 'string'
          ? parseFloat(p.original_monthly_price)
          : Number(p.original_monthly_price)
        : undefined;

    const durationMonths =
      p.duration_months ||
      (p.billing_cycle === 'annual' ? 12 : p.billing_cycle === 'quarterly' ? 3 : 1);

    const autopayBadge = getAutopayBadgeText(durationMonths);

    // Strictly ONE plan is marked as "MOST POPULAR" (the 1-year standard tier)
    const isPremium = p.id.includes('premium') || p.tier === 'premium';
    const isPopular = (p.id === 'plan-standard-1y' || p.tag === 'MOST POPULAR') && !isPremium;
    const tag = isPremium
      ? (p.tag === 'MOST POPULAR' ? '2XSTANDARD PLAN' : (p.tag || '2XSTANDARD PLAN'))
      : (p.tag === 'MOST POPULAR' && !isPopular ? '' : (p.tag || ''));

    const cta_text = formatPlanCtaText({ ...p, duration_months: durationMonths });
    const subtitle = formatPlanSubtitle({ ...p, duration_months: durationMonths });

    return {
      ...p,
      price,
      originalPrice,
      durationMonths,
      autopayBadge,
      isPopular,
      tag,
      cta_text,
      subtitle,
      billing: p.billing_text || '',
      icon: getPlanIcon(p),
      features: Array.isArray(p.features) ? p.features : [],
    };
  });

  return (
    <div className="min-h-screen w-full bg-[#0a0b0e] text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Header Bar */}
      <header className="w-full border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-black font-serif font-black text-lg shadow-lg shadow-amber-500/20">
              S
            </div>
            <div>
              <span className="font-serif tracking-tight font-bold text-white text-base">
                SARANG STUDIO
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono uppercase tracking-wider text-amber-500/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Workspace Activation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-neutral-200">
                {photographerName}
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                {user?.email || 'Logged in'}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col items-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-10 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Cloud Membership</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-[1.15]">
            Activate Your Studio. <span className="text-amber-400">Create Without Limits.</span>
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Every studio on Sarang Studio runs on dedicated high-speed cloud infrastructure. Choose a membership plan below to immediately activate your client proofing galleries, live tethered events, AI face search, and 4K media delivery.
          </p>
        </div>

        {/* 3. Pricing Plan Cards Grid */}
        {isLoadingPlans ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-xs font-mono">Fetching live studio pricing from API (/api/plans/)...</span>
          </div>
        ) : isPlansError || plans.length === 0 ? (
          <div className="rounded-2xl p-8 sm:p-10 bg-[#141217] border border-rose-900/40 text-center flex flex-col items-center justify-center space-y-4 shadow-xl max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Unable to Load Studio Plans</h3>
              <p className="text-xs text-neutral-400">
                Could not connect to the studio plans endpoint at <code className="font-mono text-rose-300">/api/plans/</code>.
              </p>
            </div>
            <button
              onClick={() => refetchPlans()}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-14">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCardUpgrading = upgradingPlanId === plan.id;
              const isOtherPlanUpgrading = (Boolean(upgradingPlanId) || isUpgrading) && !isCardUpgrading;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative h-full ${
                    plan.isPopular
                      ? 'bg-[#151419] border-2 border-amber-400/90 shadow-2xl shadow-amber-500/15 ring-1 ring-amber-400/30'
                      : 'bg-[#121319]/90 border border-neutral-800 hover:border-neutral-700 hover:bg-[#151620]'
                  } ${isOtherPlanUpgrading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex-1 flex flex-col">
                    {/* Card Header: Icon & Tier Tag */}
                    <div className="flex items-center justify-between mb-3 h-10">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          plan.isPopular
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                            : plan.tier === 'premium'
                            ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Explicit Single Most Popular Badge vs Custom Tag */}
                      {plan.isPopular ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          MOST POPULAR
                        </span>
                      ) : plan.tag ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-[10px] uppercase tracking-wider">
                          {plan.tag}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          {plan.billing_cycle || 'QUARTERLY'}
                        </span>
                      )}
                    </div>

                    {/* Title & Subtitle with guaranteed identical height across all cards */}
                    <div className="h-16 shrink-0 flex flex-col justify-start">
                      <h3 className="text-base font-bold text-white leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 leading-snug line-clamp-2">
                        {plan.subtitle}
                      </p>
                    </div>

                    {/* Price Block with Fixed Heights for Perfect Alignment */}
                    <div className="mt-2 pb-4 border-b border-neutral-800/80 flex flex-col shrink-0">
                      {/* Row 1: Original Strikethrough Discount Pill (exact same height on all cards) */}
                      <div className="h-6 shrink-0 flex items-center">
                        {plan.originalPrice && plan.originalPrice > plan.price ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-200 shadow-xs">
                            <span className="text-xs font-semibold line-through decoration-rose-400 decoration-[1.5px]">
                              ₹{plan.originalPrice.toLocaleString('en-IN')}/-
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/30 px-1 py-0.5 rounded">
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
                          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400 tracking-tight font-mono">
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-medium text-neutral-400">/ Month</span>
                        </div>
                        <div className="shrink-0">
                          {renderPlanBillingText(plan.billing)}
                        </div>
                      </div>

                      {/* Row 3: Autopay Badge */}
                      <div className="mt-2.5 flex items-center shrink-0">
                        <span className="text-[10px] sm:text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold inline-flex items-center gap-1.5 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {plan.autopayBadge}
                        </span>
                      </div>
                    </div>

                    {/* Features List with Rich Highlights */}
                    <ul className="space-y-3 my-5 text-xs text-neutral-300 flex-1">
                      {plan.features.map((feat: string, fIdx: number) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{renderPlanFeature(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action CTA Button pinned to bottom */}
                  <div className="pt-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleUpgrade(plan)}
                      disabled={isUpgrading}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                        plan.isPopular
                          ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-500/20'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isCardUpgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Initializing Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <span>{plan.cta_text || `Choose ${plan.name}`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Trust Badges & Guarantee */}
        <div className="w-full max-w-4xl mx-auto pt-8 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-6 h-6 text-amber-500 mb-2" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Instant Studio Activation
            </h4>
            <p className="text-[11px] text-neutral-400 mt-1">
              Your studio quotas and client proofing engine unlock immediately upon checkout.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <Zap className="w-6 h-6 text-amber-500 mb-2" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cancel Anytime
            </h4>
            <p className="text-[11px] text-neutral-400 mt-1">
              No long-term locks. Switch or cancel your subscription anytime with 1-click in settings.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <HardDrive className="w-6 h-6 text-amber-500 mb-2" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Enterprise Cloud Storage
            </h4>
            <p className="text-[11px] text-neutral-400 mt-1">
              High-speed NVMe storage with automatic multi-datacenter backup and 4K CDN delivery.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
