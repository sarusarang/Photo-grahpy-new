import React from 'react';
import { createPortal } from 'react-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import { X, Check, Zap, Sparkles, HardDrive } from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose }) => {
  const { subscription, availablePlans, upgradeSubscription } = useGallery();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSelectPlan = (planId: string, planName: string) => {
    upgradeSubscription(planId);
    showToast('Subscription Updated', `Switched to ${planName} successfully!`, 'success');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overlay-animate">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-neutral-900 dark:text-neutral-100 transition-colors modal-animate my-auto">
        {/* Ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Studio Cloud Tier
              </span>
            </div>
            <h2 className="text-2xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">Upgrade Storage & Studio Plan</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Deliver unlimited ultra-high-resolution galleries without compression to your clients worldwide.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-black dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status summary banner */}
        <div className="mt-6 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Currently Active</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{subscription.name} • {subscription.storageLimitGB} GB Limit</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Storage Used</p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 font-mono">
              {subscription.storageUsedGB} GB of {subscription.storageLimitGB} GB ({Math.round((subscription.storageUsedGB / subscription.storageLimitGB) * 100)}%)
            </p>
          </div>
        </div>

        {/* Plan comparison cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = subscription.id === plan.id;
            const isPro = plan.tier === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 ${
                  isCurrent
                    ? 'bg-amber-50/50 dark:bg-neutral-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                    : isPro
                    ? 'bg-white dark:bg-neutral-900/60 border-neutral-300 dark:border-neutral-700 hover:border-amber-400 shadow-sm'
                    : 'bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-base">{plan.name}</h3>
                  </div>

                  <div className="mt-2 mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-serif text-neutral-900 dark:text-white font-bold">${plan.priceMonthly}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">/ month</span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      Billed {plan.billingCycle} • {plan.storageLimitGB} GB NVMe
                    </span>
                  </div>

                  <ul className="space-y-2.5 my-6 text-xs text-neutral-600 dark:text-neutral-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id, plan.name)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isCurrent
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-neutral-700'
                      : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold shadow-md flex items-center justify-center gap-1.5'
                  }`}
                >
                  {isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" /> Select Plan
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center border-t border-neutral-200 dark:border-neutral-900 pt-5">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No credit card charged in demo mode. Instant simulated provisioning with zero downtime.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
