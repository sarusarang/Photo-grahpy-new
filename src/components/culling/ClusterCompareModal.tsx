import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Check,
  Trash2,
  Undo2,
  Trophy,
  FileImage,
} from 'lucide-react';
import type { AnalyzedPhoto, DuplicateCluster } from '@/utils/deduplicationEngine';
import { resolveImageUrl } from '@/utils/downloadUtils';

export interface ClusterCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: DuplicateCluster | null;
  clusterPhotos: AnalyzedPhoto[];
  onSetBestPick: (photoId: string) => void;
  onToggleStatus: (photoId: string) => void;
}

export const ClusterCompareModal: React.FC<ClusterCompareModalProps> = ({
  isOpen,
  onClose,
  cluster,
  clusterPhotos,
  onSetBestPick,
  onToggleStatus,
}) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  if (!isOpen || !cluster || clusterPhotos.length === 0) return null;

  const bestPick = clusterPhotos.find((p) => p.isBestPick) || clusterPhotos[0];
  const activeComparisonPhoto =
    clusterPhotos.find((p) => p.id === (selectedPhotoId || clusterPhotos[1]?.id)) ||
    clusterPhotos[1] ||
    bestPick;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl h-[92vh] bg-[#111217] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden text-neutral-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161720]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                {cluster.title}
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {cluster.averageSimilarity}% Match
                </span>
                <span className="text-xs text-neutral-400 font-normal">
                  ({cluster.totalPhotos} photos in burst)
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                AI selected the sharpest frame as winner. You can inspect focus side-by-side or crown an alternate pick.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Split Screen Comparison */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 overflow-hidden bg-black/40">
          {/* Left: AI Best Pick (Winner) */}
          <div className="flex flex-col h-full bg-[#161720]/60 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-lg relative group">
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-950/40 border-b border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Best Pick (Winner)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Sharpness: {bestPick.sharpnessScore}%
                </span>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-3 bg-neutral-950">
              {bestPick.previewUrl ? (
                <img
                  src={resolveImageUrl(bestPick.previewUrl)}
                  alt={bestPick.name}
                  className="max-h-full max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallbackEl = target.nextElementSibling as HTMLElement;
                    if (fallbackEl) fallbackEl.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`img-fallback absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-neutral-950 text-neutral-400 ${bestPick.previewUrl ? 'hidden' : 'flex'}`}>
                <FileImage className="w-10 h-10 text-neutral-600 mb-2" />
                <span className="text-xs text-neutral-300 font-mono">{bestPick.name}</span>
                <span className="text-[10px] text-amber-500/80 mt-1 font-mono">Backend Staged Photo</span>
              </div>
            </div>

            <div className="p-3 bg-[#13141a] border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-neutral-300 truncate max-w-[200px]">{bestPick.name}</span>
              <span className="text-neutral-400">{bestPick.sizeMB} MB</span>
            </div>
          </div>

          {/* Right: Alternate / Duplicate Frame */}
          <div
            className={`flex flex-col h-full bg-[#161720]/60 border rounded-2xl overflow-hidden shadow-lg relative ${
              activeComparisonPhoto.isBestPick
                ? 'border-emerald-500/40'
                : activeComparisonPhoto.status === 'discard'
                ? 'border-red-500/30'
                : 'border-white/20'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/60 border-b border-white/10">
              <div className="flex items-center gap-2">
                {activeComparisonPhoto.isBestPick ? (
                  <Trophy className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Alternate Duplicate Frame
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                  Sharpness: {activeComparisonPhoto.sharpnessScore}%
                </span>
                {activeComparisonPhoto.similarityWithBest && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {activeComparisonPhoto.similarityWithBest}% Match
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-3 bg-neutral-950">
              {activeComparisonPhoto.previewUrl ? (
                <img
                  src={resolveImageUrl(activeComparisonPhoto.previewUrl)}
                  alt={activeComparisonPhoto.name}
                  className="max-h-full max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallbackEl = target.nextElementSibling as HTMLElement;
                    if (fallbackEl) fallbackEl.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`img-fallback absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-neutral-950 text-neutral-400 ${activeComparisonPhoto.previewUrl ? 'hidden' : 'flex'}`}>
                <FileImage className="w-10 h-10 text-neutral-600 mb-2" />
                <span className="text-xs text-neutral-300 font-mono">{activeComparisonPhoto.name}</span>
                <span className="text-[10px] text-amber-500/80 mt-1 font-mono">Backend Staged Photo</span>
              </div>
            </div>

            <div className="p-3 bg-[#13141a] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
              <span className="text-neutral-300 truncate max-w-[180px]">
                {activeComparisonPhoto.name}
              </span>

              <div className="flex items-center gap-2">
                {!activeComparisonPhoto.isBestPick && (
                  <button
                    onClick={() => onSetBestPick(activeComparisonPhoto.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Make This Best Pick
                  </button>
                )}

                <button
                  onClick={() => onToggleStatus(activeComparisonPhoto.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeComparisonPhoto.status === 'discard'
                      ? 'bg-white/10 hover:bg-white/20 text-neutral-200'
                      : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
                  }`}
                >
                  {activeComparisonPhoto.status === 'discard' ? (
                    <>
                      <Undo2 className="w-3.5 h-3.5" />
                      Keep Anyway
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Discard Duplicate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Thumbnail Strip to Switch Comparison */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#161720]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">All photos in this cluster:</span>
            <div className="flex items-center gap-2">
              {clusterPhotos.map((photo) => {
                const isSelected = (selectedPhotoId || clusterPhotos[1]?.id) === photo.id;
                return (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoId(photo.id)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      photo.isBestPick
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : isSelected
                        ? 'border-amber-400'
                        : photo.status === 'discard'
                        ? 'border-red-500/40 opacity-60'
                        : 'border-white/10'
                    }`}
                  >
                    <img src={photo.previewUrl} alt={photo.name} className="w-full h-full object-cover" />
                    {photo.isBestPick && (
                      <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-emerald-500 text-black">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
