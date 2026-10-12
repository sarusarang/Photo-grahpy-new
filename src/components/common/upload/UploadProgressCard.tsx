import React from 'react';
import {
  Loader2,
  HardDrive,
  Zap,
  Clock,
  X,
  CheckCircle2,
  Pause,
  Play,
  FileCheck,
} from 'lucide-react';
import type { UploadProgressMetrics } from '@/utils/batchUploadRunner';

export interface UploadProgressCardProps {
  progress: number;
  statusText?: string;
  metrics?: UploadProgressMetrics | null;
  itemLabel?: string;
  targetSection?: string;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const UploadProgressCard: React.FC<UploadProgressCardProps> = ({
  progress,
  statusText,
  metrics,
  targetSection,
  isPaused: isPausedProp = false,
  onPause,
  onResume,
  onCancel,
  className = '',
}) => {
  const isComplete = progress >= 100;
  const isPaused = isPausedProp || Boolean(metrics?.isPaused);
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-neutral-900/90 dark:bg-[#111218]/95 border border-amber-500/30 dark:border-amber-500/25 p-4 sm:p-5 shadow-xl shadow-amber-950/10 backdrop-blur-md text-white ${className}`}
    >
      {/* Background ambient gradient glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-400/5 blur-3xl" />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
            isComplete
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isPaused ? (
              <Pause className="w-4 h-4 text-amber-300" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-100 truncate">
                {isComplete
                  ? 'Upload Finished'
                  : isPaused
                  ? 'Upload Paused'
                  : 'Upload in Progress'}
              </span>
              {targetSection && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-300 truncate max-w-[160px]">
                  {targetSection}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-mono">
              {statusText ||
                (isComplete
                  ? 'All files saved successfully'
                  : isPaused
                  ? 'Upload paused by user — click Resume to continue'
                  : 'Streaming media items to server...')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Percentage badge */}
          <div className={`flex items-baseline gap-1 px-2.5 py-1 rounded-xl font-mono font-bold text-xs border ${
            isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            <span>{clampedProgress}%</span>
          </div>

          {/* Pause / Resume Button */}
          {onPause && onResume && !isComplete && (
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isPaused
                  ? 'border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/30 shadow-xs'
                  : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
              }`}
              title={isPaused ? 'Resume uploading remaining items' : 'Pause upload'}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}

          {/* Cancel Button */}
          {onCancel && !isComplete && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
              title="Stop and cancel upload"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar with modern shimmer */}
      <div className="relative z-10 w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700/60 mb-3.5">
        <div
          className={`h-full rounded-full transition-all duration-300 relative shadow-sm ${
            isPaused
              ? 'bg-amber-500/70'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-amber-500/50'
          }`}
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Animated active shimmer pulse */}
          {!isComplete && !isPaused && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Bottom Live Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-neutral-800/80">
        {/* 1. Uploaded MB */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/50 border border-neutral-800/60">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 block font-mono uppercase tracking-wider">
              Transferred
            </span>
            <span className="text-xs font-bold text-neutral-200 font-mono truncate block" title={metrics?.uploadedMbText}>
              {metrics?.uploadedMbText || `${clampedProgress}%`}
            </span>
            <span className="text-[10px] text-neutral-500 block font-mono truncate">
              {clampedProgress}% done
            </span>
          </div>
        </div>

        {/* 2. Live Upload Speed */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/50 border border-neutral-800/60">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isPaused ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 block font-mono uppercase tracking-wider">
              Live Speed
            </span>
            <span className={`text-xs font-bold font-mono truncate block ${
              isPaused ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {isPaused ? 'Paused' : metrics?.speedText || (isComplete ? 'Done' : 'Measuring...')}
            </span>
            <span className="text-[10px] text-neutral-500 block font-mono truncate">
              {isPaused ? 'Holding state' : 'Real-time throughput'}
            </span>
          </div>
        </div>

        {/* 3. Time Remaining (ETA) & Elapsed Duration */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/50 border border-neutral-800/60">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 block font-mono uppercase tracking-wider">
              Time / ETA
            </span>
            <span
              className="text-xs font-bold text-sky-300 font-mono truncate block"
              title={`Elapsed: ${metrics?.elapsedTimeText || '0s'}, ETA: ${metrics?.etaTimeText || 'Calculating'}`}
            >
              {isPaused
                ? 'Paused'
                : isComplete
                ? 'Complete'
                : metrics?.etaTimeText || 'Calculating...'}
            </span>
            <span className="text-[10px] text-neutral-500 block font-mono truncate" title={`Started ${metrics?.elapsedTimeText || '0s'} ago`}>
              Started {metrics?.elapsedTimeText || '0s'} ago
            </span>
          </div>
        </div>

        {/* 4. Files Done / Remaining (Replaced technical Streams with clear user progress) */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/50 border border-neutral-800/60">
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 block font-mono uppercase tracking-wider">
              Files Saved
            </span>
            <span className="text-xs font-bold text-purple-300 font-mono truncate block">
              {metrics ? `${metrics.uploadedCount} / ${metrics.totalCount}` : 'Processing'}
            </span>
            <span className="text-[10px] text-neutral-500 block font-mono truncate">
              {metrics ? `${Math.max(0, metrics.totalCount - metrics.uploadedCount)} left` : 'Batch sync'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
