import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Trash2,
  FolderKanban,
  Trophy,
  Layers,
  ArrowRight,
  Maximize2,
  Eye,
  Sliders,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Check,
  Filter,
  Loader2,
  Download,
  FileImage,
  Lock,
  Zap,
  Images,
  Copy,
  X,
} from 'lucide-react';
import {
  runAICullPipeline,
  type AnalyzedPhoto,
  type DuplicateCluster,
  type CullingResult,
} from '@/utils/deduplicationEngine';
import { downloadMultipleAsZip, resolveImageUrl } from '@/utils/downloadUtils';
import { CullingUploadModal } from '@/components/culling/CullingUploadModal';
import { MoveCullToGalleryModal } from '@/components/culling/MoveCullToGalleryModal';
import { ClusterCompareModal } from '@/components/culling/ClusterCompareModal';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import {
  UploadCullingPhotosApi,
  GetActiveCullingSessionApi,
  SyncCullingSessionApi,
  DiscardCullingSessionApi,
  TriggerAICullingAnalysisApi,
} from '@/service/culling/CullingApi';
import { useToast } from '@/components/ui/Toast';
import { usePlanQuota } from '@/hooks/usePlanQuota';

const PAGE_CHUNK_SIZE = 40;

export const SmartCullPage: React.FC = () => {
  const { showToast } = useToast();
  const {
    aiCullingEnabled,
    planName,
    tier,
    isNoPlan,
    isExpired,
    isLoading: isPlanLoading,
    validateStorageQuota,
    availableStorageDisplay,
    isStorageFull,
  } = usePlanQuota();

  // State
  const [sessionId, setSessionId] = useState<string>(() => `cull_session_${Date.now()}`);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMoveGalleryModalOpen, setIsMoveGalleryModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activeCompareClusterId, setActiveCompareClusterId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [apiError, setApiError] = useState<{
    title: string;
    message: string;
    status?: number;
    details?: string;
  } | null>(null);

  // ZIP Download & Session Discard State
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [showPostZipModal, setShowPostZipModal] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<AnalyzedPhoto | null>(null);

  // Processing & Data State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [isRestoring, setIsRestoring] = useState(true);

  const [photos, setPhotos] = useState<AnalyzedPhoto[]>([]);
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(88);

  // View & Pagination
  const [activeTab, setActiveTab] = useState<'all' | 'keepers' | 'duplicates' | 'clusters'>('clusters');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Query backend for active session on mount
  useEffect(() => {
    let isMounted = true;
    setIsRestoring(true);

    GetActiveCullingSessionApi()
      .then((activeSession) => {
        if (!isMounted) return;
        if (activeSession && activeSession.photos.length > 0) {
          setSessionId(activeSession.id);
          const mappedPhotos: AnalyzedPhoto[] = activeSession.photos.map((p) => {
            const sizeBytes = p.sizeBytes || 0;
            const sizeMB =
              p.sizeMB > 0
                ? p.sizeMB
                : sizeBytes > 0
                ? Math.round((sizeBytes / (1024 * 1024)) * 10) / 10
                : 1.5;

            return {
              id: p.id,
              name: p.name,
              previewUrl: resolveImageUrl(p.previewUrl || ''),
              sizeBytes,
              sizeMB,
              sharpnessScore: p.sharpnessScore,
              rawSharpnessVariance: p.rawSharpnessVariance ?? p.sharpnessScore ?? 0,
              clusterId: p.clusterId,
              isBestPick: Boolean(p.isBestPick),
              status: (p.status === 'discard' ? 'discard' : 'keep') as 'keep' | 'discard',
              similarityWithBest: p.similarityWithBest,
              hash: p.hash || '',
            };
          });
          setPhotos(mappedPhotos);
          setClusters(activeSession.clusters);
        }
      })
      .catch((err) => {
        console.warn('[SmartCull] Failed to fetch active session:', err);
      })
      .finally(() => {
        if (isMounted) setIsRestoring(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Computed metrics
  const totalPhotos = photos.length;
  const keepers = useMemo(() => photos.filter((p) => p.status === 'keep'), [photos]);
  const duplicates = useMemo(() => photos.filter((p) => p.status === 'discard'), [photos]);

  const totalSavedBytes = useMemo(() => {
    return duplicates.reduce((acc, p) => acc + (p.sizeBytes || 0), 0);
  }, [duplicates]);

  const totalSavedMB = useMemo(() => {
    if (totalSavedBytes > 0) {
      return (totalSavedBytes / (1024 * 1024)).toFixed(1);
    }
    const mbSum = duplicates.reduce((acc, p) => acc + (p.sizeMB || 0), 0);
    return mbSum.toFixed(1);
  }, [duplicates, totalSavedBytes]);

  const storageReducedPercentage = useMemo(() => {
    if (totalPhotos === 0) return 0;
    return Math.round((duplicates.length / totalPhotos) * 100);
  }, [duplicates.length, totalPhotos]);

  // Tab Filtering
  const activePhotoList = useMemo(() => {
    switch (activeTab) {
      case 'keepers':
        return keepers;
      case 'duplicates':
        return duplicates;
      case 'all':
      default:
        return photos;
    }
  }, [activeTab, keepers, duplicates, photos]);

  // Reset pagination when active tab changes
  useEffect(() => {
    setVisibleCount(PAGE_CHUNK_SIZE);
  }, [activeTab]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_CHUNK_SIZE);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, photos.length, clusters.length]);

  const visiblePhotos = useMemo(
    () => activePhotoList.slice(0, visibleCount),
    [activePhotoList, visibleCount]
  );
  const visibleClusters = useMemo(
    () => clusters.slice(0, visibleCount),
    [clusters, visibleCount]
  );

  const hasMore =
    activeTab === 'clusters'
      ? visibleClusters.length < clusters.length
      : visiblePhotos.length < activePhotoList.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_CHUNK_SIZE);
  }, []);

  // Sync to backend helper
  const syncToBackend = useCallback(
    async (updatedPhotos: AnalyzedPhoto[], updatedClusters: DuplicateCluster[]) => {
      try {
        await SyncCullingSessionApi({
          session_id: sessionId,
          photos: updatedPhotos.map((p) => ({
            id: p.id,
            name: p.name,
            previewUrl: p.previewUrl,
            sizeBytes: p.sizeBytes,
            sizeMB: p.sizeMB,
            sharpnessScore: p.sharpnessScore,
            status: p.status,
            isBestPick: p.isBestPick,
            clusterId: p.clusterId,
            hash: p.hash,
            similarityWithBest: p.similarityWithBest,
          })),
          clusters: updatedClusters.map((c) => ({
            id: c.id,
            title: c.title,
            averageSimilarity: c.averageSimilarity,
            bestPickId: c.bestPickId,
            photoIds: c.photoIds,
            totalPhotos: c.totalPhotos,
            duplicatesCount: c.duplicatesCount,
            wastedBytes: c.wastedBytes,
          })),
        });
      } catch (err) {
        console.warn('[SmartCull] Failed to sync session to backend:', err);
      }
    },
    [sessionId]
  );

  // File Upload & Pipeline Execution (100% Backend-Driven)
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    if (!aiCullingEnabled || isNoPlan || isExpired) {
      showToast('Plan Required', 'AI Smart Cull requires an active Studio plan. Please choose or renew your plan.', 'warning');
      setIsUpgradeModalOpen(true);
      return;
    }

    // Strict Storage Quota Validation
    const quotaCheck = validateStorageQuota(files);
    if (!quotaCheck.valid) {
      showToast(
        quotaCheck.errorTitle || 'Storage Quota Exceeded',
        quotaCheck.errorMessage || 'The selected photos exceed your studio cloud storage quota.',
        'error'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    setApiError(null);
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStatusText(`Uploading ${files.length} photos to studio staging storage...`);

    try {
      // 1. Upload files to backend staging storage in chunks (prevents 413 Content Too Large)
      const uploadRes = await UploadCullingPhotosApi(
        sessionId,
        files,
        (pct, statusText) => {
          setAnalysisProgress(Math.round(pct * 0.45)); // 0% - 45%
          setAnalysisStatusText(statusText);
        }
      );

      if (uploadRes?.session_id) {
        setSessionId(uploadRes.session_id);
      }

      const uploadedPhotos = uploadRes?.photos || [];
      if (uploadedPhotos.length === 0) {
        throw new Error('Backend upload finished, but no photo records were returned by the server.');
      }

      const activeSid = uploadRes?.session_id || sessionId;

      // 2. Trigger Server-Side AI Analysis on Backend
      setAnalysisProgress(50);
      setAnalysisStatusText(`Running AI Analysis on studio server...`);

      let backendAnalyzedSession = null;
      try {
        backendAnalyzedSession = await TriggerAICullingAnalysisApi(activeSid, similarityThreshold);
      } catch (beErr: any) {
        console.error('[SmartCull] Server analysis error:', beErr);
        throw beErr;
      }

      if (backendAnalyzedSession && backendAnalyzedSession.photos.length > 0) {
        const mappedBackendPhotos: AnalyzedPhoto[] = backendAnalyzedSession.photos.map((p) => ({
          id: p.id,
          name: p.name,
          previewUrl: resolveImageUrl(p.previewUrl || ''),
          sizeBytes: p.sizeBytes,
          sizeMB: p.sizeMB,
          sharpnessScore: p.sharpnessScore,
          rawSharpnessVariance: p.rawSharpnessVariance ?? p.sharpnessScore ?? 0,
          clusterId: p.clusterId,
          isBestPick: Boolean(p.isBestPick),
          status: p.status,
          similarityWithBest: p.similarityWithBest,
          hash: p.hash || '',
        }));

        setPhotos(mappedBackendPhotos);
        setClusters(backendAnalyzedSession.clusters);
        setAnalysisProgress(100);
        setAnalysisStatusText('Backend AI analysis complete!');
        showToast(
          `AI Culling complete! Loaded ${backendAnalyzedSession.clusters.length} burst sets from backend.`,
          'success'
        );
        setIsUploadModalOpen(false);
        return;
      }

      // If backend analysis returned empty or null, inform the user with error fallback
      throw new Error(
        `Photos were uploaded to backend staging storage, but the server-side analysis endpoint (/api/culling/sessions/${activeSid}/analyze/) returned 404 or an empty response. Please register the backend analyze route.`
      );
    } catch (error: any) {
      console.error('[SmartCull] Backend API Error:', error);
      const statusCode = error?.response?.status || error?.status;
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to process photos with backend culling service.';

      const errorTitle =
        statusCode === 413
          ? 'Upload Size Too Large'
          : statusCode === 404
          ? 'Service Temporarily Unavailable'
          : 'Unable to Process Photos';

      const userMessage =
        statusCode === 413
          ? 'The selected batch exceeds the upload limit. Please try selecting a smaller batch of photos.'
          : statusCode === 404
          ? 'The smart culling service is momentarily unreachable. Please try again shortly.'
          : serverMsg || 'An error occurred while analyzing photos. Please check your connection and retry.';

      setApiError({
        title: errorTitle,
        message: userMessage,
        status: statusCode,
      });

      showToast(userMessage, 'error');
      setIsUploadModalOpen(false);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStatusText('');
    }
  };

  // Status Toggles
  const handleToggleStatus = (photoId: string) => {
    const updated = photos.map((p) => {
      if (p.id === photoId) {
        return {
          ...p,
          status: (p.status === 'keep' ? 'discard' : 'keep') as 'keep' | 'discard',
        };
      }
      return p;
    });
    setPhotos(updated);
    syncToBackend(updated, clusters);
  };

  const handleSetBestPick = (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target || !target.clusterId) return;

    const updatedPhotos = photos.map((p) => {
      if (p.clusterId === target.clusterId) {
        if (p.id === photoId) {
          return { ...p, isBestPick: true, status: 'keep' as const };
        }
        return { ...p, isBestPick: false, status: 'discard' as const };
      }
      return p;
    });

    const updatedClusters = clusters.map((c) => {
      if (c.id === target.clusterId) {
        return { ...c, bestPickId: photoId };
      }
      return c;
    });

    setPhotos(updatedPhotos);
    setClusters(updatedClusters);
    syncToBackend(updatedPhotos, updatedClusters);
    showToast(`Marked ${target.name} as Best Pick!`, 'info');
  };

  // Discard Session
  const handleDiscardSession = async (silent = false) => {
    setIsDiscarding(true);
    try {
      await DiscardCullingSessionApi(sessionId);
      setPhotos([]);
      setClusters([]);
      setSessionId(`cull_session_${Date.now()}`);
      setIsDiscardModalOpen(false);
      setShowPostZipModal(false);
      if (!silent) {
        showToast('Session discarded and staging storage freed.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to discard session.', 'error');
    } finally {
      setIsDiscarding(false);
    }
  };

  // ZIP Download
  const handleDownloadKeepersZip = async () => {
    if (keepers.length === 0) {
      showToast('No approved keeper photos to download.', 'error');
      return;
    }

    setIsZipping(true);
    setZipProgress(5);
    try {
      const itemsToDownload = keepers.map((k) => ({
        url: k.previewUrl,
        name: k.name,
      }));

      await downloadMultipleAsZip({
        items: itemsToDownload,
        zipFilename: `AI_Culled_Keepers_${Date.now()}.zip`,
        onProgress: (pct: number) => setZipProgress(pct),
      });

      showToast(`Downloaded ${keepers.length} keeper photos as ZIP!`, 'success');
      setShowPostZipModal(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to create ZIP download.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const handleMoveSuccess = () => {
    showToast('Photos moved to gallery successfully!', 'success');
    setIsMoveGalleryModalOpen(false);
    setPhotos([]);
    setClusters([]);
    setSessionId(`cull_session_${Date.now()}`);
  };

  // Active Cluster for comparison
  const activeCluster = useMemo(() => {
    if (!activeCompareClusterId) return null;
    return clusters.find((c) => c.id === activeCompareClusterId) || null;
  }, [activeCompareClusterId, clusters]);

  const activeClusterPhotos = useMemo(() => {
    if (!activeCluster) return [];
    return photos.filter((p) => p.clusterId === activeCluster.id);
  }, [activeCluster, photos]);

  return (
    <div className="min-h-screen bg-[#0d0e12] text-neutral-200">
      {/* Top Banner / Studio Plan Gate Notice */}
      {!aiCullingEnabled && !isPlanLoading && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-amber-500/20 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <span>AI Smart Culling is locked on your current plan</span>
                {planName && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                    {planName}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-neutral-400">
                Upgrade your Studio Subscription to enable unlimited AI photo culling, facial sharpness scoring, and instant gallery transfers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Upgrade Studio Plan</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* User-friendly Error Alert */}
        {apiError && (
          <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 text-white space-y-4 animate-in fade-in duration-200 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {apiError.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                    {apiError.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setApiError(null)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs shrink-0"
              >
                Dismiss
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setApiError(null);
                  setIsUploadModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-400/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Upload</span>
              </button>
              <button
                type="button"
                onClick={() => setApiError(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {aiCullingEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Main Plan Included • {planName || 'Studio Plan'}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Culling Locked • Upgrade {planName || 'Plan'}</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Storage Quota: {availableStorageDisplay} Free</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              AI Smart Cull & Deduplicator
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Upload raw shoot batches without limits. Our AI analyzes blur, facial sharpness, closed eyes, and burst clusters, automatically recommending the best picks and saving gigabytes of cloud storage.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {totalPhotos > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDiscardModalOpen(true)}
                  disabled={isDiscarding}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-neutral-300 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  title="Discard this culling session and free staging storage"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Discard Batch</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadKeepersZip}
                  disabled={isZipping || keepers.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Packaging ZIP ({zipProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Keepers ({keepers.length})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMoveGalleryModalOpen(true)}
                  disabled={keepers.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Move to Gallery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (!aiCullingEnabled || isNoPlan || isExpired) {
                  setIsUpgradeModalOpen(true);
                } else if (isStorageFull) {
                  showToast('Storage Limit Reached', 'Your storage quota is currently full. Please upgrade your plan storage.', 'error');
                  setIsUpgradeModalOpen(true);
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {!aiCullingEnabled || isNoPlan || isExpired ? (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>Upgrade Plan to Unlock</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{totalPhotos > 0 ? 'Upload More Photos' : 'Upload Photos'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Restoring indicator */}
        {isRestoring && (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center gap-3 text-neutral-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span>Restoring active culling session from studio staging...</span>
          </div>
        )}

        {/* Empty State */}
        {!isRestoring && totalPhotos === 0 && (
          <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {!aiCullingEnabled ? 'AI Smart Cull is Included in Studio Plans' : 'No Photos in Active Culling Session'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {!aiCullingEnabled
                  ? `AI Culling is included in our Studio Pro & Elite tiers. Your current plan (${planName || 'Standard'}) does not have this feature active. Upgrade your plan to process unlimited photos with automatic duplicate grouping and sharpness scoring.`
                  : 'Upload your raw camera batch to get started. Just like gallery uploads, you can upload as many photos as you need with zero individual fees.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!aiCullingEnabled || isNoPlan || isExpired) {
                    setIsUpgradeModalOpen(true);
                  } else {
                    setIsUploadModalOpen(true);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-amber-500/20"
              >
                {!aiCullingEnabled ? (
                  <>
                    <Lock className="w-5 h-5 text-black" />
                    <span>Upgrade Plan to Enable AI Culling</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    <span>Upload Shoot Photos</span>
                  </>
                )}
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 text-left border-t border-white/10 mt-8">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="text-sm font-bold text-white">Burst Sequence Grouping</h3>
                <p className="text-xs text-neutral-400">
                  Perceptual AI groups similar poses, expressions, and burst sequences automatically.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="text-sm font-bold text-white">Sharpness & Eye Scoring</h3>
                <p className="text-xs text-neutral-400">
                  Detects micro-blur and picks the sharpest keeper so you don't have to zoom in 50 times.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="text-sm font-bold text-white">1-Click Client Delivery</h3>
                <p className="text-xs text-neutral-400">
                  Export approved keepers directly into any client gallery or section in seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Culling Session Content */}
        {!isRestoring && totalPhotos > 0 && (
          <div className="space-y-6">
            {/* Session Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Uploaded */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Uploaded</p>
                  <p className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-2">
                    <span>{totalPhotos}</span>
                    <span className="text-xs font-normal font-mono text-neutral-400">photos</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 text-neutral-200 flex items-center justify-center shrink-0 shadow-inner">
                  <Images className="w-5 h-5 text-neutral-300" />
                </div>
              </div>

              {/* Approved Keepers */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Approved Keepers</p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-300 flex items-baseline gap-2">
                    <span>{keepers.length}</span>
                    <span className="text-xs font-normal font-mono text-emerald-400/80">photos</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Duplicates Detected */}
              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Duplicates Detected</p>
                  <p className="text-2xl sm:text-3xl font-black text-red-300 flex items-baseline gap-2">
                    <span>{duplicates.length}</span>
                    <span className="text-xs font-normal font-mono text-red-400/80">photos</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
                  <Copy className="w-5 h-5" />
                </div>
              </div>

              {/* Cloud Storage Saved */}
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Cloud Storage Saved</p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-300 flex items-baseline gap-1.5 flex-wrap">
                    <span>{totalSavedMB} MB</span>
                    <span className="text-xs font-normal font-mono text-amber-400/80">
                      ({storageReducedPercentage}%)
                    </span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Tabs & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('clusters')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'clusters'
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                      : 'bg-transparent text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Duplicate Clusters ({clusters.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('keepers')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'keepers'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-transparent text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Keepers ({keepers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('duplicates')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'duplicates'
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                      : 'bg-transparent text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Duplicates ({duplicates.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'all'
                      ? 'bg-white/20 text-white shadow-md'
                      : 'bg-transparent text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>All Photos ({photos.length})</span>
                </button>
              </div>

              {/* Threshold control */}
              <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-neutral-400">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Sensitivity: {similarityThreshold}%</span>
              </div>
            </div>

            {/* Clusters View */}
            {activeTab === 'clusters' && (
              <div className="space-y-6">
                {visibleClusters.map((cluster) => {
                  const clusterPhotos = photos.filter((p) => p.clusterId === cluster.id);
                  const bestPick = clusterPhotos.find((p) => p.isBestPick) || clusterPhotos[0];
                  const alternates = clusterPhotos.filter((p) => p.id !== bestPick?.id);

                  return (
                    <div
                      key={cluster.id}
                      className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{cluster.title}</span>
                              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {cluster.averageSimilarity}% Match
                              </span>
                            </h3>
                            <p className="text-[11px] text-neutral-400">
                              {clusterPhotos.length} photos in sequence • 1 keeper, {clusterPhotos.length - 1} duplicates
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveCompareClusterId(cluster.id);
                            setIsCompareModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Compare Side-by-Side</span>
                        </button>
                      </div>

                      {/* Photo Thumbnails */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {clusterPhotos.map((photo) => {
                          const isBest = photo.isBestPick;
                          const isDiscarded = photo.status === 'discard';

                          return (
                            <div
                              key={photo.id}
                              className={`group relative rounded-2xl overflow-hidden border bg-[#111218] transition-all duration-300 shadow-md hover:shadow-xl flex flex-col ${
                                isBest
                                  ? 'border-amber-400/80 ring-2 ring-amber-400/25 shadow-amber-500/10'
                                  : isDiscarded
                                  ? 'border-red-500/30 opacity-75 hover:opacity-100'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div
                                className="aspect-[4/5] bg-neutral-950 relative overflow-hidden cursor-pointer"
                                onClick={() => setPreviewPhoto(photo)}
                              >
                                <img
                                  src={photo.previewUrl}
                                  alt={photo.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                  loading="lazy"
                                />

                                {/* Best Pick Badge */}
                                {isBest && (
                                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-black/50">
                                    <Trophy className="w-3.5 h-3.5 fill-current" />
                                    <span>BEST PICK</span>
                                  </div>
                                )}

                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                  {isDiscarded ? (
                                    <span className="px-2.5 py-1 rounded-xl bg-red-500/90 text-white text-xs font-bold shadow-md backdrop-blur-md">
                                      Duplicate
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-xs font-bold shadow-md backdrop-blur-md">
                                      Keeper
                                    </span>
                                  )}
                                </div>

                                {/* Hover Inspect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                  <span className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 transform scale-90 group-hover:scale-100 transition-transform">
                                    <Maximize2 className="w-5 h-5" />
                                  </span>
                                </div>
                              </div>

                              <div className="p-3.5 bg-[#14151d] border-t border-white/5 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate" title={photo.name}>
                                    {photo.name}
                                  </p>
                                  <p className="text-[11px] font-mono text-neutral-400">
                                    {photo.sizeMB ? `${photo.sizeMB} MB` : 'In sequence'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(photo.id);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                    isDiscarded
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30'
                                      : 'bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30'
                                  }`}
                                >
                                  {isDiscarded ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span>Keep</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remove</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Flat Photos View (Keepers, Duplicates, or All) */}
            {activeTab !== 'clusters' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                {visiblePhotos.map((photo) => {
                  const isDiscarded = photo.status === 'discard';
                  const isBest = photo.isBestPick;

                  return (
                    <div
                      key={photo.id}
                      className={`group relative rounded-2xl overflow-hidden border bg-[#111218] transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col ${
                        isBest
                          ? 'border-amber-400/80 ring-2 ring-amber-400/25 shadow-amber-500/10'
                          : isDiscarded
                          ? 'border-red-500/30 opacity-80 hover:opacity-100'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Generous Height & Width Image Container */}
                      <div
                        className="relative aspect-[4/5] w-full bg-neutral-950 overflow-hidden cursor-pointer"
                        onClick={() => setPreviewPhoto(photo)}
                      >
                        <img
                          src={photo.previewUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                          {isBest ? (
                            <div className="px-2.5 py-1 rounded-xl bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-black/50 backdrop-blur-md">
                              <Trophy className="w-3.5 h-3.5 fill-current" />
                              <span>BEST PICK</span>
                            </div>
                          ) : (
                            <span />
                          )}

                          <div className="pointer-events-auto">
                            {isDiscarded ? (
                              <span className="px-2.5 py-1 rounded-xl bg-red-500/90 text-white text-xs font-bold shadow-md backdrop-blur-md">
                                Duplicate
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-xs font-bold shadow-md backdrop-blur-md">
                                Keeper
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover Overlay with Inspect Icon */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                          <span className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 transform scale-90 group-hover:scale-100 transition-transform">
                            <Maximize2 className="w-5 h-5" />
                          </span>
                        </div>
                      </div>

                      {/* Card Info & Actions Footer */}
                      <div className="p-4 bg-[#14151d] border-t border-white/5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate" title={photo.name}>
                            {photo.name}
                          </p>
                          <p className="text-[11px] font-mono text-neutral-400">
                            {photo.sizeMB ? `${photo.sizeMB} MB` : 'Analyzed frame'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(photo.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm ${
                            isDiscarded
                              ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30'
                              : 'bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30'
                          }`}
                        >
                          {isDiscarded ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Keep</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="pt-6 pb-12 flex flex-col items-center justify-center">
              {hasMore ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-300">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>
                      {activeTab === 'clusters'
                        ? `Loading more clusters (${visibleClusters.length} of ${clusters.length})...`
                        : `Loading more photos (${visiblePhotos.length} of ${activePhotoList.length})...`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadMore}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Click to load more immediately
                  </button>
                </div>
              ) : (
                (activeTab === 'clusters' ? clusters.length > 0 : activePhotoList.length > 0) && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500 py-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                    <span>
                      {activeTab === 'clusters'
                        ? `Showing all ${clusters.length} duplicate clusters`
                        : `Showing all ${activePhotoList.length} photos`}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal (Connected to Main Plan Quota) */}
      <CullingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFilesSelected={handleFilesSelected}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        analysisStatusText={analysisStatusText}
        validateStorageQuota={validateStorageQuota}
        planName={planName}
        availableStorageDisplay={availableStorageDisplay}
      />

      {/* Move to Gallery Modal */}
      <MoveCullToGalleryModal
        isOpen={isMoveGalleryModalOpen}
        onClose={() => setIsMoveGalleryModalOpen(false)}
        photos={photos}
        sessionId={sessionId}
        onMoveSuccess={handleMoveSuccess}
      />

      {/* Side-by-Side Dual Frame Compare Modal */}
      <ClusterCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        cluster={activeCluster}
        clusterPhotos={activeClusterPhotos}
        onSetBestPick={handleSetBestPick}
        onToggleStatus={handleToggleStatus}
      />

      {/* Discard Session Confirmation Modal */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#14151e] border border-red-500/30 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Discard Active Culling Session?</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                This will permanently delete all {totalPhotos} culled photos from your staging storage. Your session will be closed and cannot be recovered.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                disabled={isDiscarding}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDiscardSession(false)}
                disabled={isDiscarding}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
              >
                {isDiscarding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Discarding...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Discard & Free Storage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-ZIP Download Action Modal */}
      {showPostZipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#14151e] border border-amber-500/30 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ZIP Download Complete!</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                All {keepers.length} approved keeper photos have been downloaded to your computer. Would you like to clear this session from staging storage to start your next shoot?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPostZipModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
              >
                Keep Session Active
              </button>
              <button
                type="button"
                onClick={() => handleDiscardSession(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <span>Finish & Clear Storage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Full-Frame Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold truncate">{previewPhoto.name}</span>
              {previewPhoto.isBestPick && (
                <span className="px-2 py-0.5 rounded bg-amber-400 text-black text-[10px] font-extrabold flex items-center gap-1">
                  <Trophy className="w-3 h-3 fill-current" />
                  <span>BEST</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="relative max-h-[82vh] max-w-5xl w-full flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhoto.previewUrl}
              alt={previewPhoto.name}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
          <div className="py-2 text-xs font-mono text-neutral-400">
            Click outside or press close to exit full screen
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCullPage;