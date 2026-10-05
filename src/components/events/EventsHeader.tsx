import React from 'react';
import { Clock, Plus, Lock } from 'lucide-react';
import type { usePlanQuota } from '@/hooks/usePlanQuota';

export interface EventsHeaderProps {
  planQuota: ReturnType<typeof usePlanQuota>;
  liveCount: number;
  onOpenCreateModal: (status: 'live' | 'upcoming') => void;
  onOpenUpgradeModal: () => void;
}

export const EventsHeader: React.FC<EventsHeaderProps> = ({
  planQuota,
  liveCount,
  onOpenCreateModal,
  onOpenUpgradeModal,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-500 font-bold">
              Live Tethering & Event Engine
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              {planQuota.isUnlimitedEvents
                ? 'Unlimited Live Events'
                : `${planQuota.eventsUsed}/${planQuota.maxEvents} Active Events Used`}
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {liveCount} Active Now
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight mt-1">
            Live & Upcoming Events
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl font-light">
            Capture photos on the fly with hardware camera tethering, pre-generate time-expiring guest QR
            codes, and deliver an AI Face Search guest portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenCreateModal('upcoming')}
            className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-200 text-xs font-mono font-bold border border-neutral-300 dark:border-neutral-800 transition-all cursor-pointer flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>+ Upcoming Event</span>
          </button>

          <button
            onClick={() => onOpenCreateModal('live')}
            className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Start Live Event</span>
          </button>
        </div>
      </div>

      {planQuota.isExpired ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-300">
            <Lock className="w-4 h-4 text-rose-500 shrink-0" />
            <span>
              <strong>Studio Plan Expired:</strong> Your {planQuota.planName} has expired. Live event creation, guest QR codes, and tethered shooting are locked until renewed.
            </span>
          </div>
          <button
            onClick={onOpenUpgradeModal}
            className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold transition-all cursor-pointer shrink-0 shadow-sm"
          >
            Renew Membership
          </button>
        </div>
      ) : !planQuota.canCreateEvent ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Event Limit Reached:</strong> You are currently using {planQuota.eventsUsed} of {planQuota.maxEvents} live events included in your {planQuota.planName}. Upgrade to create unlimited events.
            </span>
          </div>
          <button
            onClick={onOpenUpgradeModal}
            className="py-1.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-all cursor-pointer shrink-0"
          >
            Upgrade Plan
          </button>
        </div>
      ) : null}
    </div>
  );
};
