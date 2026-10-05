import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { useCancelAutoRenew } from '@/service/plans/usePlans';
import { useToast } from '../ui/Toast';
import {
  X,
  AlertTriangle,
  Calendar,
  CreditCard,
  HardDrive,
  ShieldCheck,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export interface CancelPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: () => void;
}

/**
 * CancelPlanModal — Modern Netflix-Style Cancellation Confirmation Dialog
 * =========================================================================
 * Provides a reassuring, crystal-clear cancellation flow:
 * 1. Confirms the user retains full access until their paid expiry date.
 * 2. Guarantees 0 future debits with Razorpay recurring autopay cancelled.
 * 3. Highlights the exact remaining days of access.
 * 4. Provides a prominent "Keep My Subscription" primary button to prevent churn.
 */
export const CancelPlanModal: React.FC<CancelPlanModalProps> = ({
  isOpen,
  onClose,
  onCancelled,
}) => {
  const planQuota = usePlanQuota();
  const { showToast } = useToast();
  const { mutate: cancelAutoRenew, isPending: isCancelling } = useCancelAutoRenew();

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsRendered(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      handleClose();
    }
  }, [isOpen, handleClose, isRendered]);

  if (!isRendered) return null;

  const formattedExpiry = planQuota.expiryDate
    ? new Date(planQuota.expiryDate).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : `${planQuota.daysRemaining} days from now`;

  const handleConfirmCancel = () => {
    cancelAutoRenew(undefined, {
      onSuccess: () => {
        showToast(
          'Subscription Cancelled',
          `Your plan will remain active until ${formattedExpiry}. No further charges will be made.`,
          'success'
        );
        onCancelled?.();
        handleClose();
      },
      onError: (err: any) => {
        showToast('Error', err?.message || 'Failed to cancel recurring autopay. Please try again.', 'error');
      },
    });
  };

  return createPortal(
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-200 ease-out ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 overflow-hidden transition-all duration-200 ease-out ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isCancelling}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Subscription Management
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
              Cancel Recurring Plan?
            </h2>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
          If you cancel now, your membership will <strong className="text-neutral-900 dark:text-white font-semibold">not be deleted immediately</strong>. It works just like Netflix:
        </p>

        {/* 3 Reassurance Cards (Netflix-Style) */}
        <div className="space-y-3 mb-6">
          {/* Card 1: Active until expiry */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Active Until {formattedExpiry}
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                You have <strong className="text-amber-600 dark:text-amber-400">{planQuota.daysRemaining} days left</strong> of full {planQuota.planName} privileges with zero interruption to client delivery.
              </p>
            </div>
          </div>

          {/* Card 2: 0 Future Charges */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                No Future Charges Guaranteed
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Your Razorpay auto-pay mandate will be cancelled. No automated renewal debits will ever be made.
              </p>
            </div>
          </div>

          {/* Card 3: Storage & galleries preserved */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Full {planQuota.storageLimitGB} GB Storage Retained
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Your galleries, downloads, and events remain accessible to your clients until the period ends.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          {/* Secondary: Confirm Cancellation */}
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cancelling Autopay...</span>
              </>
            ) : (
              <span>Yes, Cancel Autopay</span>
            )}
          </button>

          {/* Primary: Keep Subscription (Retention Anchor) */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isCancelling}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all cursor-pointer shadow-lg hover:shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Keep My Subscription</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
