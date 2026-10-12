import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { useResumeSubscription } from '@/service/plans/usePlans';
import {
  RotateCcw,
  ArrowRight,
  X,
  Loader2,
  ShieldAlert,
  AlertOctagon,
  Zap,
} from 'lucide-react';

interface SubscriptionCancelAlertBannerProps {
  onOpenUpgrade?: () => void;
  className?: string;
}

/**
 * Studio Subscription Status Banner
 * ===================================
 * 1. Plan Expired State: Prominent urgent banner alerting the studio that their paid period
 *    has ended, creative features are paused, and they can select any plan to reactivate.
 * 2. Netflix-Style Cancellation State: Clear reassurance when auto-renew was cancelled
 *    but days remain in the paid period with an instant "Restart Membership" button.
 */
export const SubscriptionCancelAlertBanner: React.FC<SubscriptionCancelAlertBannerProps> = ({
  onOpenUpgrade,
  className = '',
}) => {
  const planQuota = usePlanQuota();
  const { mutate: resumeSubscription, isPending: isResuming } = useResumeSubscription();
  const [isDismissedSession, setIsDismissedSession] = useState(false);

  // If dismissed or no relevant subscription event, render nothing
  if (isDismissedSession) return null;

  const formattedExpiry = planQuota.expiryDate
    ? new Date(planQuota.expiryDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'recently';

  // ---------------------------------------------------------------------------
  // STATE 1: PLAN EXPIRED (Critical Notice)
  // ---------------------------------------------------------------------------
  if (planQuota.isExpired) {
    return (
      <div
        role="alert"
        className={`relative rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-rose-500/15 via-red-500/10 to-rose-500/15 dark:from-[#2a1317]/95 dark:via-[#1e1014]/95 dark:to-[#2a1317]/95 border-2 border-rose-500/50 dark:border-rose-500/40 shadow-xl shadow-rose-500/10 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${className}`}
      >
        {/* Ambient background glow */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Side: Icon & Explanatory Text */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 shadow-inner mt-0.5 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>

            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  MEMBERSHIP EXPIRED
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                  Expired on {formattedExpiry}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Your {planQuota.planName} has expired
              </h4>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Studio creation features are paused. Creating new client galleries, provisioning live event QR galleries, and uploading RAW photos require an active subscription. Select any plan below to reactivate your studio immediately.
              </p>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center pl-13 md:pl-0">
            {onOpenUpgrade && (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Renew / Choose Plan</span>
              </button>
            )}

            <Link
              to="/dashboard/settings?tab=billing"
              className="px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Manage Billing</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={() => setIsDismissedSession(true)}
              aria-label="Dismiss banner for now"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 2: CANCELLATION SCHEDULED (Netflix-Style Grace Period)
  // ---------------------------------------------------------------------------
  if (planQuota.isCancelledAtPeriodEnd && planQuota.daysRemaining > 0) {
    return (
      <div
        role="alert"
        className={`relative rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-[#1e1713]/90 dark:via-[#161218]/90 dark:to-[#1e1713]/90 border border-amber-400/40 dark:border-amber-500/30 shadow-lg shadow-amber-500/5 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${className}`}
      >
        {/* Ambient background glow */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Side: Icon & Explanatory Text */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 shadow-inner mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  MEMBERSHIP ENDING SOON
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  No future charges
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Your {planQuota.planName} plan is active until {formattedExpiry}
              </h4>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                You cancelled recurring autopay. Your studio galleries, client delivery, and{' '}
                <strong className="text-neutral-900 dark:text-white font-semibold">
                  {planQuota.storageLimitGB} GB
                </strong>{' '}
                cloud storage will remain fully operational for the next{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {planQuota.daysRemaining} days
                </span>
                . After that, your membership will expire.
              </p>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center pl-13 md:pl-0">
            <button
              type="button"
              onClick={() => resumeSubscription()}
              disabled={isResuming}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95 disabled:opacity-60"
            >
              {isResuming ? (
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

            {onOpenUpgrade && (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span>Explore Plans</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDismissedSession(true)}
              aria-label="Dismiss banner for now"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

