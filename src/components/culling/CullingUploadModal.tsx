import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UploadCloud,
  Loader2,
  Trash2,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Minus,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UploadProgressCard, MinimizedUploadWidget } from '@/components/common/upload';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CullingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  isAnalyzing?: boolean;
  analysisProgress?: number;
  analysisStatusText?: string;
  validateStorageQuota?: (files: File[]) => { valid: boolean; errorMessage?: string; errorTitle?: string };
  planName?: string;
  availableStorageDisplay?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CullingUploadModal: React.FC<CullingUploadModalProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  isAnalyzing = false,
  analysisProgress = 0,
  analysisStatusText = '',
  validateStorageQuota,
  planName,
  availableStorageDisplay,
}) => {
  const { showToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ name: string; size: number; url: string }>>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File Management ────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setSelectedFiles([]);
  }, [previews]);

  const handleAddFiles = useCallback(
    (incomingFiles: FileList | File[]) => {
      const fileArray = Array.from(incomingFiles);
      const validFiles = fileArray.filter(
        (f) =>
          f.type.startsWith('image/') ||
          /\.(jpe?g|png|webp|tiff|cr2|nef|arw|dng|raw|heic|heif)$/i.test(f.name)
      );

      const rejectedCount = fileArray.length - validFiles.length;
      if (rejectedCount > 0) {
        showToast(
          'Non-Image Files Ignored',
          `Filtered out ${rejectedCount} invalid/non-image file(s).`,
          'warning'
        );
      }

      if (validFiles.length === 0) return;

      if (validateStorageQuota) {
        const potentialCombined = [...selectedFiles, ...validFiles];
        const quotaCheck = validateStorageQuota(potentialCombined);
        if (!quotaCheck.valid) {
          showToast(
            quotaCheck.errorTitle || 'Storage Quota Limit Reached',
            quotaCheck.errorMessage || 'Adding these files exceeds your remaining studio cloud storage limit.',
            'error'
          );
          return;
        }
      }

      setSelectedFiles((prev) => {
        const next = [...prev, ...validFiles];
        // Only generate in-memory object URLs for up to 36 photos to prevent browser memory freeze on 2,000 photos
        setPreviews((oldPreviews) => {
          const remainingSlots = Math.max(0, 36 - oldPreviews.length);
          if (remainingSlots <= 0) return oldPreviews;
          const filesToPreview = validFiles.slice(0, remainingSlots);
          return [
            ...oldPreviews,
            ...filesToPreview.map((file) => ({
              name: file.name,
              size: file.size,
              url: URL.createObjectURL(file),
            })),
          ];
        });
        return next;
      });
    },
    [showToast]
  );

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleAddFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // ─── Start Culling ──────────────────────────────────────────────────────────

  const handleStartCulling = () => {
    if (selectedFiles.length === 0) {
      showToast('Select Photos', 'Please select photos to cull first.', 'warning');
      return;
    }
    if (validateStorageQuota) {
      const quotaCheck = validateStorageQuota(selectedFiles);
      if (!quotaCheck.valid) {
        showToast(
          quotaCheck.errorTitle || 'Storage Quota Limit',
          quotaCheck.errorMessage || 'The selected photos exceed your active studio plan storage limit.',
          'error'
        );
        return;
      }
    }
    onFilesSelected(selectedFiles);
  };

  if (!isOpen) return null;

  // ─── Minimized Widget ───────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <MinimizedUploadWidget
        isOpen={true}
        isUploading={isAnalyzing}
        progress={analysisProgress}
        statusText={analysisStatusText || 'Analyzing photos...'}
        title="AI Smart Cull Session"
        sourceType="culling"
        itemCount={selectedFiles.length}
        onExpand={() => setIsMinimized(false)}
        onClose={() => {
          handleClear();
          setIsMinimized(false);
          onClose();
        }}
      />
    );
  }

  // ─── Full Modal ─────────────────────────────────────────────────────────────

  const totalSizeMB = (selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAnalyzing) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#12131a] border border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161720]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Upload Photos for AI Smart Cull
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Upload any number of photos — AI deduplication runs instantly, no limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize upload window"
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (isAnalyzing) {
                  setIsMinimized(true);
                } else {
                  handleClear();
                  onClose();
                }
              }}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title={isAnalyzing ? 'Minimize and continue in background' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Analysis Progress Card with Live Speed, Elapsed/ETA & MB */}
          {isAnalyzing && (
            <UploadProgressCard
              progress={analysisProgress}
              statusText={analysisStatusText || 'Running AI sharpness & face variance analysis...'}
              targetSection="SMART CULL"
            />
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-amber-400 bg-amber-400/10 scale-[0.99]'
                : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.cr2,.nef,.arw,.dng,.webp"
              onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Drag & drop photos here, or click to browse
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Supports JPEG, PNG, WebP, TIFF and RAW camera files (CR2, NEF, ARW, DNG). Upload as many as you like.
            </p>
          </div>

          {/* Queued Photos Grid */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium text-neutral-200">
                  Ready for Culling ({selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} • {totalSizeMB} MB)
                </span>
                {!isAnalyzing && (
                  <button
                    onClick={handleClear}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {previews.map((preview, idx) => (
                  <div
                    key={`${preview.name}-${idx}`}
                    className="group relative aspect-square rounded-xl bg-neutral-900 border border-white/10 overflow-hidden"
                  >
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {!isAnalyzing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white/80 hover:text-red-400 hover:bg-black transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-neutral-300 truncate">
                      {preview.name}
                    </div>
                  </div>
                ))}

                {/* Additional overflow badge for large batches (e.g. 500 - 2,000 photos) */}
                {selectedFiles.length > previews.length && (
                  <div className="aspect-square rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-base font-black text-amber-400">
                      +{selectedFiles.length - previews.length}
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                      more photos queued for upload
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-[#161720]/80">
          <div className="text-xs text-neutral-400 space-y-0.5">
            <div>
              {selectedFiles.length > 0
                ? `${selectedFiles.length} photo(s) selected • ${totalSizeMB} MB total`
                : 'No photos selected — upload as many as you like'}
            </div>
            {planName && (
              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-300">
                  Plan: {planName}
                </span>
                {availableStorageDisplay && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">
                    Remaining: {availableStorageDisplay}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                handleClear();
                onClose();
              }}
              disabled={isAnalyzing}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleStartCulling}
              disabled={selectedFiles.length === 0 || isAnalyzing}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedFiles.length === 0
                  ? 'bg-neutral-800 text-neutral-500 opacity-60 cursor-not-allowed'
                  : 'text-neutral-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Analyzing Photos ({analysisProgress}%)...</span>
                </>
              ) : selectedFiles.length === 0 ? (
                <span>Select Photos First</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Run AI Smart Cull ({selectedFiles.length} Photos)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
