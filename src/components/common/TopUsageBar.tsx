import React, { useState } from 'react';
import { useGallery } from '../../context/GalleryContext';
import { UpgradePlanModal } from './UpgradePlanModal';
import { HardDrive, Calendar, Zap, ShieldCheck } from 'lucide-react';

export const TopUsageBar: React.FC = () => {
  const { subscription } = useGallery();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const percentageUsed = Math.min(
    100,
    Math.round((subscription.storageUsedGB / subscription.storageLimitGB) * 100)
  );

  return (
    <>
      <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Plan badge & Storage meter */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1.5 bg-neutral-800/90 px-2.5 py-1 rounded-md border border-neutral-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-neutral-100 tracking-wide">
                  {subscription.name}
                </span>
              </div>
            </div>

            {/* Storage Progress Card */}
            <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[260px]">
              <HardDrive className="w-4 h-4 text-neutral-400 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[11px] font-medium tracking-tight mb-1.5">
                  <span className="text-neutral-300">
                    <strong className="text-white font-semibold">{subscription.storageUsedGB} GB</strong> of {subscription.storageLimitGB} GB
                  </span>
                  <span className="text-amber-400 font-mono font-medium">{percentageUsed}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${percentageUsed}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Days remaining, Expiry Date & Upgrade CTA */}
          <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 pt-1 md:pt-0 border-t md:border-t-0 border-neutral-800/60">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="hidden sm:inline">Billing Cycle:</span>
              <span className="text-neutral-200 font-medium">
                <span className="text-amber-400 font-semibold">{subscription.daysRemaining} days remaining</span>
                <span className="text-neutral-400 text-[11px] ml-1.5">(Expires {subscription.expiryDate})</span>
              </span>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-amber-500/10"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Upgrade Plan</span>
            </button>
          </div>
        </div>
      </div>

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
};
