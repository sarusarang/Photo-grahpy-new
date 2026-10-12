import React from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
  CheckCircle2,
  Maximize2,
  X,
  ExternalLink,
  Zap,
  HardDrive,
  Clock,
  Pause,
  Play,
  FileCheck,
} from 'lucide-react';
import type { UploadProgressMetrics } from '@/utils/batchUploadRunner';

export interface MinimizedUploadWidgetProps {
  isOpen: boolean;
  isUploading: boolean;
  progress: number;
  statusText?: string;
  metrics?: UploadProgressMetrics | null;
  title: string;
  sourceType: 'gallery' | 'event' | 'culling';
  itemCount?: number;
  targetSection?: string;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onExpand: () => void;
  onClose: () => void;
  onViewTarget?: () => void;
}

export const MinimizedUploadWidget: React.FC<MinimizedUploadWidgetProps> = ({
  isOpen,
  isUploading,
  progress,
  statusText,
  metrics,
  title,
  sourceType,
  itemCount,
  targetSection,
  isPaused: isPausedProp = false,
  onPause,
  onResume,
  onExpand,
  onClose,
  onViewTarget,
}) => {
  if (!isOpen) return null;

  const isComplete = progress >= 100;
  const isPaused = isPausedProp || Boolean(metrics?.isPaused);
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const sourceBadge = {
    gallery: 'Gallery Upload',
    event: 'Event Ingestion',
    culling: 'AI Smart Cull',
  }[sourceType];

  return createPortal(
    <aside
      aria-label="Upload Progress Manager"
      className="fixed bottom-5 right-5 z-[150] w-84 sm:w-96 rounded-2xl bg-[#0e1017]/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl p-4 space-y-2.5 text-white animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto ring-1 ring-amber-500/10"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
            isComplete
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isPaused ? (
              <Pause className="w-4 h-4 text-amber-300" />
            ) : isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                {sourceBadge}
              </span>
              {targetSection && (
                <span className="text-[10px] text-neutral-400 font-mono truncate">
                  • {targetSection}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-100 truncate" title={title}>
              {itemCount ? `${itemCount} item(s) • ${title}` : title}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pause / Resume button */}
          {onPause && onResume && isUploading && !isComplete && (
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPaused
                  ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
              title={isPaused ? 'Resume upload' : 'Pause upload'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}
          {onViewTarget && (
            <button
              type="button"
              onClick={onViewTarget}
              className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Open detail page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onExpand}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Expand upload window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Dismiss widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span className="truncate pr-2">
            {statusText ||
              (isComplete
                ? 'Finished'
                : isPaused
                ? 'Paused — click play to resume'
                : 'Transferring files...')}
          </span>
          <span className="font-bold text-amber-400 shrink-0">{clampedProgress}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isPaused
                ? 'bg-amber-500/70'
                : 'bg-gradient-to-r from-amber-500 to-amber-300'
            }`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      {/* Compact Mini Metrics Bar */}
      {metrics && (
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-400">
          <div className="flex items-center gap-1 truncate" title="Transferred MB">
            <HardDrive className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{metrics.uploadedMbText}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {metrics.speedText && (
              <div
                className={`flex items-center gap-0.5 font-bold ${
                  isPaused ? 'text-amber-400' : 'text-emerald-400'
                }`}
                title="Live Upload Speed"
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span>{metrics.speedText}</span>
              </div>
            )}
            <div className="flex items-center gap-0.5 text-sky-300" title="Time / ETA">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{metrics.etaTimeText || `${metrics.elapsedTimeText}`}</span>
            </div>
            {metrics.totalCount > 0 && (
              <div className="flex items-center gap-0.5 text-purple-300" title="Files Progress">
                <FileCheck className="w-3 h-3 shrink-0" />
                <span>{metrics.uploadedCount}/{metrics.totalCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>,
    document.body
  );
};
