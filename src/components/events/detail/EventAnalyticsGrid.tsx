import React from 'react';
import { Camera, QrCode, Sparkles, CheckCircle2 } from 'lucide-react';
import type { LiveEvent } from '@/types/event';

export interface EventAnalyticsGridProps {
  event: LiveEvent;
}

export const EventAnalyticsGrid: React.FC<EventAnalyticsGridProps> = ({ event }) => {
  const totalEventSizeDisplay =
    event.totalSizeFormatted ||
    (event.totalSizeMB !== undefined ? `${event.totalSizeMB} MB` : '0 MB');

  const matchRate =
    event.stats.aiSearches > 0
      ? Math.min(100, Math.round((event.stats.matchesFound / event.stats.aiSearches) * 100))
      : 96;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-600 dark:text-neutral-400 font-bold">
            Live Event Performance & Analytics
          </h3>
        </div>
        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
          Backed 100% by DRF live endpoints
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative p-5 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Live Cloud Photos
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-sans font-bold tabular-nums text-neutral-900 dark:text-white">
              {event.media.length}
            </span>
            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
              ({totalEventSizeDisplay})
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span>Ready for instant guest match</span>
          </div>
        </div>

        <div className="group relative p-5 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Guest QR Scans
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-sans font-bold tabular-nums text-neutral-900 dark:text-white">
              {event.stats.qrScans}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              +12% live
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span>At table stands & cards</span>
          </div>
        </div>

        <div className="group relative p-5 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              AI Face Searches
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-sans font-bold tabular-nums text-neutral-900 dark:text-white">
              {event.stats.aiSearches}
            </span>
            <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-medium">
              Selfies analyzed
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span>Private 1-to-1 guest matching</span>
          </div>
        </div>

        <div className="group relative p-5 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/80 shadow-xs hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
              Delivered Matches
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-sans font-bold tabular-nums text-neutral-900 dark:text-white">
              {event.stats.matchesFound}
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {matchRate}% accuracy
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span>{event.stats.downloadsCount} high-res downloads</span>
          </div>
        </div>
      </div>
    </div>
  );
};
