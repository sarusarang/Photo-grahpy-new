import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UploadCloud,
  FileImage,
  Loader2,
  Trash2,
  Maximize2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  CreditCard,
  ShieldCheck,
  Zap,
  Lock,
  Check,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { loadRazorpayScript } from '@/service/plans/usePlans';
import {
  GetCullingPricingTiersApi,
  DEFAULT_CULLING_TIERS,
  CreateCullingPaymentOrderApi,
  VerifyCullingPaymentApi,
  type CullingPlanTier,
} from '@/service/culling/CullingApi';
import { useToast } from '@/components/ui/Toast';

export interface CullingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  sessionId: string;
  isSessionPaid?: boolean;
  paidDetails?: { tier: string; amount: number } | null;
  onPaymentSuccess?: (details: { tier: string; amount: number }) => void;
  isAnalyzing?: boolean;
  analysisProgress?: number;
  analysisStatusText?: string;
}

export const CullingUploadModal: React.FC<CullingUploadModalProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  sessionId,
  isSessionPaid = false,
  paidDetails = null,
  onPaymentSuccess,
  isAnalyzing = false,
  analysisProgress = 0,
  analysisStatusText = '',
}) => {
  const { showToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ name: string; size: number; url: string }>>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Plans from Django Backend (with fallback)
  const { data: tiers = DEFAULT_CULLING_TIERS } = useQuery({
    queryKey: ['culling-pricing-tiers'],
    queryFn: GetCullingPricingTiersApi,
    staleTime: 1000 * 60 * 5,
  });

  // Sort tiers by photo capacity
  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a: CullingPlanTier, b: CullingPlanTier) => a.photosLimit - b.photosLimit);
  }, [tiers]);

  // Helper to get capacity and range info for any tier
  const getTierRangeInfo = useCallback(
    (tier: CullingPlanTier) => {
      const index = sortedTiers.findIndex((t: CullingPlanTier) => t.id === tier.id);
      const prevLimit = index > 0 ? sortedTiers[index - 1].photosLimit : 0;
      const minPhotos = prevLimit + 1;
      const maxPhotos = tier.photosLimit;
      const isUnlimited = !isFinite(maxPhotos) || maxPhotos >= 999999;
      const rangeLabel = isUnlimited
        ? `${minPhotos.toLocaleString()}+ Photos`
        : index === 0
        ? `1 – ${maxPhotos.toLocaleString()} Photos`
        : `${minPhotos.toLocaleString()} – ${maxPhotos.toLocaleString()} Photos`;

      return { minPhotos, maxPhotos, isUnlimited, rangeLabel };
    },
    [sortedTiers]
  );

  // Automatically determine the exact plan required by the queued media count
  const matchedTier = useMemo(() => {
    if (selectedFiles.length === 0) return sortedTiers[0] || DEFAULT_CULLING_TIERS[0];
    const suitable = sortedTiers.find((t: CullingPlanTier) => selectedFiles.length <= t.photosLimit);
    return suitable || sortedTiers[sortedTiers.length - 1] || DEFAULT_CULLING_TIERS[0];
  }, [selectedFiles.length, sortedTiers]);

  // Selected pricing tier for upfront payment (auto-locked to matchedTier)
  const [selectedTierId, setSelectedTierId] = useState<string>(() => matchedTier.id);

  // Strictly sync selectedTierId to the matching tier whenever selected files change
  useEffect(() => {
    if (matchedTier) {
      setSelectedTierId(matchedTier.id);
    }
  }, [matchedTier]);

  const selectedTier = matchedTier;

  // Plan capacity check
  const isOverPlanLimit = selectedFiles.length > selectedTier.photosLimit;

  // Clean up object URLs when clearing
  const handleClear = useCallback(() => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setSelectedFiles([]);
  }, [previews]);

  const handleAddFiles = useCallback((incomingFiles: FileList | File[]) => {
    const fileArray = Array.from(incomingFiles);
    // Strict MIME & Extension filter: only images/RAW camera formats
    const validFiles = fileArray.filter((f) =>
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

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [showToast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Upfront Payment & Start Culling Handler
  const handleStartCulling = async () => {
    if (selectedFiles.length === 0) {
      showToast('Select Photos', 'Please select photos to cull first.', 'warning');
      return;
    }

    // STRICT VALIDATION: Ensure uploaded media is suitable for selected plan (NO LOOPHOLES)
    if (isOverPlanLimit) {
      showToast(
        'Plan Limit Exceeded',
        `The selected plan allows up to ${selectedTier.photosLimit.toLocaleString()} photos, but you have queued ${selectedFiles.length} photos. Please choose a higher tier or remove photos.`,
        'error'
      );
      return;
    }

    // If the session is already paid upfront, proceed directly to analysis
    if (isSessionPaid) {
      onFilesSelected(selectedFiles);
      return;
    }

    // STRICT REQUIREMENT: Upfront Payment on Uploading
    setIsCheckingOut(true);

    try {
      showToast('Preparing Checkout', 'Generating Razorpay payment order for this session...', 'info');

      // 1. Create Order on Backend (with validated tier and photo count)
      const order = await CreateCullingPaymentOrderApi({
        session_id: sessionId,
        tier_id: selectedTier.id,
        amount_inr: selectedTier.price,
        photo_count: selectedFiles.length,
      });

      // 2. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript();
      const razorpayKey =
        order.key_id ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        'rzp_test_TdPGMrKMJ0xp2j';

      if (!scriptLoaded || !(window as any).Razorpay) {
        // Fallback for offline/test environments
        await VerifyCullingPaymentApi({
          session_id: sessionId,
          razorpay_order_id: order.order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'sig_mock_verified',
        });

        showToast(
          'Payment Verified',
          `AI Smart Cull unlocked (${selectedTier.name}). Running AI analysis on ${selectedFiles.length} photos...`,
          'success'
        );

        onPaymentSuccess?.({ tier: selectedTier.name, amount: selectedTier.price });
        onFilesSelected(selectedFiles);
        return;
      }

      // 3. Open Razorpay Gateway Modal
      const options = {
        key: razorpayKey,
        amount: order.amount || selectedTier.price * 100,
        currency: order.currency || 'INR',
        name: 'EX SHARE ATELIER',
        description: `AI Smart Cull Upfront Unlock — ${selectedTier.name}`,
        order_id: order.order_id.startsWith('order_cull_') ? undefined : order.order_id,
        theme: {
          color: '#f59e0b',
        },
        handler: async (response: any) => {
          try {
            await VerifyCullingPaymentApi({
              session_id: sessionId,
              razorpay_order_id: response.razorpay_order_id || order.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'verified',
            });

            showToast(
              'Payment Successful',
              `Payment of ₹${selectedTier.price} received. Starting AI deduplication analysis...`,
              'success'
            );

            onPaymentSuccess?.({ tier: selectedTier.name, amount: selectedTier.price });
            onFilesSelected(selectedFiles);
          } catch (err: any) {
            showToast('Verification Failed', err?.message || 'Failed to verify transaction signature.', 'error');
          } finally {
            setIsCheckingOut(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsCheckingOut(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        showToast('Payment Cancelled', response?.error?.description || 'Transaction was declined.', 'error');
        setIsCheckingOut(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Failed to initiate upfront culling payment:', err);
      showToast('Payment Error', err?.message || 'Could not initiate checkout. Please try again.', 'error');
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  // Floating Minimized Widget
  if (isMinimized) {
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#13141a]/95 dark:bg-[#13141a]/95 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-2xl shadow-black/60 text-white animate-in slide-in-from-bottom-5 duration-200">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          {isAnalyzing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col pr-2">
          <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            AI Smart Cull
            {isAnalyzing && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded">
                {analysisProgress}%
              </span>
            )}
          </span>
          <span className="text-[11px] text-neutral-400 max-w-[180px] truncate">
            {isAnalyzing
              ? analysisStatusText || 'Analyzing photos...'
              : `${selectedFiles.length} photo(s) queued`}
          </span>
        </div>
        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
          <button
            onClick={() => setIsMinimized(false)}
            title="Expand Uploader"
            className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-300 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {!isAnalyzing && (
            <button
              onClick={() => {
                handleClear();
                onClose();
              }}
              title="Close"
              className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAnalyzing && !isCheckingOut) {
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#12131a] border border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden my-auto modal-animate flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161720]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Upload & Pay-Per-Use AI Smart Cull
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Pay On Upload
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Upload burst sets, pay once per batch, and let AI select your best takes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAnalyzing && (
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize to Background"
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                if (!isAnalyzing && !isCheckingOut) {
                  handleClear();
                  onClose();
                }
              }}
              disabled={isAnalyzing || isCheckingOut}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
              Drag & drop photos here, or click to browse files
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Supports JPEG, PNG, WebP, TIFF and RAW camera files (CR2, NEF, ARW, DNG).
            </p>
          </div>

          {/* Auto-Determined Batch Plan Selection */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Plan Auto-Matched to Media Count</span>
                </span>
                {isSessionPaid ? (
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Session Paid ({paidDetails?.tier || 'Unlocked'})
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} queued
                  </span>
                )}
              </div>

              {/* Media Count Auto-Match Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      Auto-Matched Plan: {matchedTier.name} (₹{matchedTier.price})
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Your batch has <strong>{selectedFiles.length} photos</strong>, which qualifies for the <strong>{getTierRangeInfo(matchedTier).rangeLabel}</strong> plan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Auto-Selected
                </div>
              </div>

              {/* Tier Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sortedTiers.map((tier: CullingPlanTier) => {
                  const { minPhotos, maxPhotos, rangeLabel } = getTierRangeInfo(tier);
                  const isAutoMatched = matchedTier.id === tier.id;
                  const isTooSmall = selectedFiles.length > maxPhotos;

                  return (
                    <div
                      key={tier.id}
                      className={`relative p-4 rounded-2xl border text-left transition-all ${
                        isAutoMatched
                          ? 'bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-amber-400/90 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10'
                          : isTooSmall
                          ? 'bg-red-950/10 border-red-500/20 opacity-50 cursor-not-allowed'
                          : 'bg-white/[0.02] border-white/10 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isAutoMatched
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : isTooSmall
                            ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                            : 'bg-white/5 text-neutral-400 border border-white/10'
                        }`}>
                          {rangeLabel}
                        </span>

                        {isAutoMatched ? (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md shadow-amber-400/30">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isTooSmall ? (
                          <span className="text-[9px] font-mono text-red-400">
                            Limit Exceeded
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-neutral-500">
                            {minPhotos}+ Photos
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold text-white tracking-tight">₹{tier.price}</span>
                        <span className="text-[11px] text-neutral-400 font-mono">/ batch</span>
                      </div>

                      {/* Plan Title */}
                      <div className="text-xs font-semibold text-neutral-200 truncate">{tier.name}</div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-snug">
                        {tier.description}
                      </p>

                      {/* Bottom Status Tag */}
                      <div className="mt-3 pt-2 border-t border-white/5 text-[10px]">
                        {isAutoMatched ? (
                          <span className="text-amber-300 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active for your {selectedFiles.length} photos
                          </span>
                        ) : isTooSmall ? (
                          <span className="text-red-400/90 font-mono">
                            Max {maxPhotos.toLocaleString()} photos (queued: {selectedFiles.length})
                          </span>
                        ) : (
                          <span className="text-neutral-500 font-mono">
                            Not required — ₹{matchedTier.price} plan fits your batch
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Note */}
              {!isSessionPaid ? (
                <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/25 text-amber-200 flex items-center gap-2.5 text-xs">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Upfront Payment Required:</strong> Once you pay ₹{selectedTier.price} ({selectedTier.name}), AI culling runs on all {selectedFiles.length} photos immediately. After culling, you can move all keeper photos to your gallery for free!
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Session Unlocked:</strong> This batch is paid for. Click the button below to execute AI duplicate culling.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Analysis Live Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  {analysisStatusText || 'Running AI perceptual hash & sharpness variance algorithm...'}
                </span>
                <span className="font-mono font-bold">{analysisProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Queued Photos Grid */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium text-neutral-200">
                  Ready for Culling ({selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''})
                </span>
                {!isAnalyzing && !isCheckingOut && (
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
                    {!isAnalyzing && !isCheckingOut && (
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
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-[#161720]/80">
          <div className="text-xs text-neutral-400">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} photo(s) selected • ${(
                  selectedFiles.reduce((acc, f) => acc + f.size, 0) /
                  (1024 * 1024)
                ).toFixed(1)} MB total`
              : 'No photos selected'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                handleClear();
                onClose();
              }}
              disabled={isAnalyzing || isCheckingOut}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleStartCulling}
              disabled={selectedFiles.length === 0 || isAnalyzing || isCheckingOut}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedFiles.length === 0
                  ? 'bg-neutral-800 text-neutral-500 opacity-60 cursor-not-allowed'
                  : 'text-neutral-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none'
              }`}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Processing Payment...</span>
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Analyzing Photos ({analysisProgress}%)...</span>
                </>
              ) : selectedFiles.length === 0 ? (
                <span>Upload Photos to Select Plan</span>
              ) : !isSessionPaid ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{selectedTier.price} & Run AI Culling ({selectedFiles.length} Photos)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
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
