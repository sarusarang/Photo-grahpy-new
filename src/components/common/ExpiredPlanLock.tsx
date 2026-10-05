import React from 'react';
import { Lock, Zap } from 'lucide-react';

export interface LockedCardOverlayProps {
  title?: string;
  subtitle?: string;
  onRenew: () => void;
  badgeOnly?: boolean;
}

/**
 * Reusable Card Overlay to lock cards (Galleries, Events, etc.) when the studio plan is expired.
 * Prevents user interaction with the card and provides a direct CTA to renew/upgrade.
 */
export const LockedCardOverlay: React.FC<LockedCardOverlayProps> = ({
  title = 'Studio Plan Expired',
  subtitle = 'Renew membership to unlock and enter',
  onRenew,
  badgeOnly = false,
}) => {
  if (badgeOnly) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRenew();
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md cursor-pointer hover:bg-rose-500/30 transition-all shadow-sm"
        title="Plan Expired • Click to Renew"
      >
        <Lock className="w-3 h-3 text-rose-400 shrink-0" />
        <span>Locked</span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onRenew();
      }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center rounded-3xl bg-neutral-950/80 backdrop-blur-md transition-all group-hover:bg-neutral-950/85 cursor-pointer animate-in fade-in duration-200"
      role="button"
      tabIndex={0}
      title="Plan Expired • Click to Renew"
    >
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-2.5 group-hover:scale-105 transition-transform">
        <Lock className="w-5 h-5 text-rose-400 stroke-[2.2]" />
      </div>

      <div className="space-y-1 max-w-[240px]">
        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[9px] font-mono font-bold uppercase tracking-widest inline-block mb-0.5">
          Access Locked
        </span>
        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
          {title}
        </h4>
        <p className="text-[11px] text-neutral-300 leading-snug">
          {subtitle}
        </p>
      </div>

      <div className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all hover:scale-105 active:scale-95">
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>Renew to Open</span>
      </div>
    </div>
  );
};

export interface LockedPageScreenProps {
  resourceType: 'gallery' | 'event' | 'section';
  resourceTitle?: string;
  onRenew: () => void;
  onBack: () => void;
}

/**
 * Full-screen lock display for Detail pages (GalleryDetailPage, EventDetailPage)
 * when a user navigates directly to a locked resource while their plan is expired.
 */
export const LockedPageScreen: React.FC<LockedPageScreenProps> = ({
  resourceType,
  resourceTitle,
  onRenew,
  onBack,
}) => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#12131a] border border-rose-500/30 dark:border-rose-500/20 shadow-2xl shadow-rose-500/10 flex flex-col items-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/40 text-rose-500 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest">
            Studio Membership Expired
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            {resourceTitle
              ? `"${resourceTitle}" is Locked`
              : `${resourceType === 'gallery' ? 'Gallery' : 'Event'} Access Locked`}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            This {resourceType} management room is locked because your studio plan has expired. Your high-resolution media and proofing sets are safe in cloud storage. Renew your membership to restore access.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            type="button"
            onClick={onRenew}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Renew Membership</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
