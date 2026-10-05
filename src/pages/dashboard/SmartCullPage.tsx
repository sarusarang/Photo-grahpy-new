import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Undo2,
  FolderKanban,
  Trophy,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
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
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  runAICullPipeline,
  type AnalyzedPhoto,
  type DuplicateCluster,
  type CullingResult,
} from '@/utils/deduplicationEngine';
import { downloadMultipleAsZip, resolveImageUrl } from '@/utils/downloadUtils';
import { CullingUploadModal } from '@/components/culling/CullingUploadModal';
import { CullingPaymentModal } from '@/components/culling/CullingPaymentModal';
import { MoveCullToGalleryModal } from '@/components/culling/MoveCullToGalleryModal';
import { ClusterCompareModal } from '@/components/culling/ClusterCompareModal';
import {
  UploadCullingPhotosApi,
  GetCullingPricingTiersApi,
  DEFAULT_CULLING_TIERS,
  GetActiveCullingSessionApi,
  SyncCullingSessionApi,
  DiscardCullingSessionApi,
  saveLocalCullingSession,
  loadLocalCullingSession,
  clearLocalCullingSession,
} from '@/service/culling/CullingApi';
import { useToast } from '@/components/ui/Toast';

export const SmartCullPage: React.FC = () => {
  const { showToast } = useToast();

  // Dynamic Plans from Django Backend (with fallback)
  const { data: tiers = DEFAULT_CULLING_TIERS } = useQuery({
    queryKey: ['culling-pricing-tiers'],
    queryFn: GetCullingPricingTiersApi,
    staleTime: 1000 * 60 * 5,
  });

  const minStartingPrice = useMemo(() => {
    if (!tiers || tiers.length === 0) return 149;
    return Math.min(...tiers.map((t) => t.price));
  }, [tiers]);

  // Session & Payment State with local cache restoration
  const cached = useMemo(() => loadLocalCullingSession(), []);

  const [sessionId, setSessionId] = useState<string>(
    () => cached?.sessionId || `cull_session_${Date.now()}`
  );
  const [isSessionPaid, setIsSessionPaid] = useState<boolean>(
    () => cached?.isSessionPaid || false
  );
  const [paidDetails, setPaidDetails] = useState<{ tier: string; amount: number } | null>(
    () => cached?.paidDetails || null
  );

  // Modals Visibility
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMoveGalleryModalOpen, setIsMoveGalleryModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activeCompareClusterId, setActiveCompareClusterId] = useState<string | null>(null);

  // ZIP Download & Session Discard State
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [showPostZipModal, setShowPostZipModal] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Culling Processing & Data State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatusText, setAnalysisStatusText] = useState('');

  const [photos, setPhotos] = useState<AnalyzedPhoto[]>(() => cached?.photos || []);
  const [clusters, setClusters] = useState<DuplicateCluster[]>(() => cached?.clusters || []);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(88);

  // Query backend for active session on mount
  useEffect(() => {
    let isMounted = true;
    GetActiveCullingSessionApi()
      .then((activeSession) => {
        if (!isMounted) return;
        if (activeSession && activeSession.photos.length > 0) {
          setSessionId(activeSession.id);
          setIsSessionPaid(activeSession.is_paid);
          if (activeSession.tier) {
            setPaidDetails({
              tier: activeSession.tier.name,
              amount: activeSession.tier.price,
            });
          }
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
          saveLocalCullingSession({
            sessionId: activeSession.id,
            isSessionPaid: activeSession.is_paid,
            paidDetails: activeSession.tier
              ? { tier: activeSession.tier.name, amount: activeSession.tier.price }
              : null,
            photos: mappedPhotos,
            clusters: activeSession.clusters,
          });
        }
      })
      .catch((err) => {
        console.warn('[SmartCull] Failed to fetch active backend session:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Active View Tab: 'clusters' | 'all' | 'keepers' | 'duplicates'
  const [activeTab, setActiveTab] = useState<'clusters' | 'all' | 'keepers' | 'duplicates'>('clusters');

  // Progressive Infinite Scrolling Configuration
  const CLUSTERS_PAGE_SIZE = 8;
  const PHOTOS_PAGE_SIZE = 36;
  const CLUSTERS_INCREMENT = 6;
  const PHOTOS_INCREMENT = 24;

  const [visibleClusterCount, setVisibleClusterCount] = useState<number>(CLUSTERS_PAGE_SIZE);
  const [visiblePhotoCount, setVisiblePhotoCount] = useState<number>(PHOTOS_PAGE_SIZE);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Guard opening upload modal if a batch is already active
  const handleOpenUpload = useCallback(() => {
    if (photos.length > 0) {
      showToast(
        'Batch In Progress',
        `An active batch of ${photos.length} photos is currently in progress. Each plan covers one batch upload. Please move to gallery, download your ZIP, or discard this session to start a new shoot.`,
        'info'
      );
      return;
    }
    setIsUploadModalOpen(true);
  }, [photos.length, showToast]);

  // Handle uploaded files from CullingUploadModal
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setIsAnalyzing(true);
      setAnalysisProgress(5);
      setAnalysisStatusText('Uploading photos to backend staging & preparing AI analysis...');

      try {
        // Concurrent staging upload to Django backend
        const uploadPromise = UploadCullingPhotosApi(sessionId, files).catch((err) => {
          console.warn('[SmartCull] Staging upload notice:', err);
          return null;
        });

        const fileItems = files.map((file, idx) => ({
          id: `photo_${Date.now()}_${idx}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          sizeBytes: file.size,
        }));

        const result: CullingResult = await runAICullPipeline(
          fileItems,
          similarityThreshold,
          (percent, text) => {
            setAnalysisProgress(percent);
            setAnalysisStatusText(text);
          }
        );

        // Await upload response so we can attach backend server URLs
        const uploadRes = await uploadPromise;
        let finalPhotos = result.allPhotos;
        let finalClusters = result.clusters;

        if (uploadRes?.photos && uploadRes.photos.length > 0) {
          const idMap = new Map<string, string>(); // oldId -> newId

          finalPhotos = result.allPhotos.map((p, idx) => {
            const serverMatch =
              uploadRes.photos!.find((sp: any) => sp.name === p.name) ||
              uploadRes.photos![idx];
            if (serverMatch) {
              idMap.set(p.id, serverMatch.id);
              return {
                ...p,
                id: serverMatch.id,
                previewUrl: serverMatch.previewUrl || p.previewUrl,
              };
            }
            return p;
          });

          // Remap cluster photoIds and bestPickId to the backend IDs
          finalClusters = result.clusters.map((c) => ({
            ...c,
            bestPickId: idMap.get(c.bestPickId) || c.bestPickId,
            photoIds: c.photoIds.map((pid) => idMap.get(pid) || pid),
          }));
        }

        setPhotos(finalPhotos);
        setClusters(finalClusters);
        setIsUploadModalOpen(false);

        // Save to resilient local cache immediately
        saveLocalCullingSession({
          sessionId,
          isSessionPaid,
          paidDetails,
          photos: finalPhotos,
          clusters: finalClusters,
        });

        // Persist to Django backend
        SyncCullingSessionApi({
          session_id: sessionId,
          tier_id: paidDetails?.tier,
          is_paid: isSessionPaid,
          photos: finalPhotos,
          clusters: finalClusters,
        }).catch((err) => {
          console.warn('[SmartCull] Backend sync notice:', err);
        });

        showToast(
          'AI Culling Complete',
          `Found ${result.clusters.length} duplicate cluster(s). Identified ${result.totalDuplicates} duplicate photo(s) to remove.`,
          'success'
        );
      } catch (err: any) {
        showToast('Analysis Error', err?.message || 'Failed to analyze photos.', 'error');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sessionId, isSessionPaid, paidDetails, similarityThreshold, showToast]
  );

  // Manual Override: Set a specific photo as "Best Pick"
  const handleSetBestPick = useCallback(
    (targetPhotoId: string) => {
      let updatedPhotos: AnalyzedPhoto[] = [];
      let updatedClusters: DuplicateCluster[] = [];

      setPhotos((prev) => {
        const target = prev.find((p) => p.id === targetPhotoId);
        if (!target || !target.clusterId) return prev;

        updatedPhotos = prev.map((p) => {
          if (p.clusterId === target.clusterId) {
            if (p.id === targetPhotoId) {
              return { ...p, isBestPick: true, status: 'keep' };
            } else {
              return { ...p, isBestPick: false, status: 'discard' };
            }
          }
          return p;
        });
        return updatedPhotos;
      });

      setClusters((prev) => {
        updatedClusters = prev.map((c) => {
          const match = photos.find((p) => p.id === targetPhotoId);
          if (match && match.clusterId === c.id) {
            return { ...c, bestPickId: targetPhotoId };
          }
          return c;
        });
        return updatedClusters;
      });

      // Sync changes to local cache and backend
      setTimeout(() => {
        setPhotos((currentPhotos) => {
          setClusters((currentClusters) => {
            saveLocalCullingSession({
              sessionId,
              isSessionPaid,
              paidDetails,
              photos: currentPhotos,
              clusters: currentClusters,
            });
            SyncCullingSessionApi({
              session_id: sessionId,
              tier_id: paidDetails?.tier,
              is_paid: isSessionPaid,
              photos: currentPhotos,
              clusters: currentClusters,
            }).catch(() => {});
            return currentClusters;
          });
          return currentPhotos;
        });
      }, 50);

      showToast('Best Pick Updated', 'Selected photo is now marked as the keeper.', 'info');
    },
    [photos, sessionId, isSessionPaid, paidDetails, showToast]
  );

  // Manual Override: Toggle Keep / Discard for an individual photo
  const handleToggleStatus = useCallback(
    (photoId: string) => {
      setPhotos((prev) => {
        const updated: AnalyzedPhoto[] = prev.map((p) => {
          if (p.id === photoId) {
            const nextStatus: 'keep' | 'discard' = p.status === 'keep' ? 'discard' : 'keep';
            return { ...p, status: nextStatus };
          }
          return p;
        });

        saveLocalCullingSession({
          sessionId,
          isSessionPaid,
          paidDetails,
          photos: updated,
          clusters,
        });

        SyncCullingSessionApi({
          session_id: sessionId,
          tier_id: paidDetails?.tier,
          is_paid: isSessionPaid,
          photos: updated,
          clusters,
        }).catch(() => {});

        return updated;
      });
    },
    [sessionId, isSessionPaid, paidDetails, clusters]
  );

  // Batch Select All Discarded
  const handleKeepAll = () => {
    const updated = photos.map((p) => ({ ...p, status: 'keep' as const }));
    setPhotos(updated);
    saveLocalCullingSession({
      sessionId,
      isSessionPaid,
      paidDetails,
      photos: updated,
      clusters,
    });
    SyncCullingSessionApi({
      session_id: sessionId,
      tier_id: paidDetails?.tier,
      is_paid: isSessionPaid,
      photos: updated,
      clusters,
    }).catch(() => {});
    showToast('All Kept', 'Marked all photos as keepers.', 'info');
  };

  const handleResetToAI = () => {
    const updated = photos.map((p) => ({
      ...p,
      status: (p.clusterId && !p.isBestPick ? 'discard' : 'keep') as 'keep' | 'discard',
    }));
    setPhotos(updated);
    saveLocalCullingSession({
      sessionId,
      isSessionPaid,
      paidDetails,
      photos: updated,
      clusters,
    });
    SyncCullingSessionApi({
      session_id: sessionId,
      tier_id: paidDetails?.tier,
      is_paid: isSessionPaid,
      photos: updated,
      clusters,
    }).catch(() => {});
    showToast('Reset Complete', 'Restored AI recommended selections.', 'info');
  };

  // Move to Gallery: All photos in this session were already paid upfront during upload
  const handleInitiateMoveToGallery = () => {
    if (photos.length === 0) {
      showToast('No Photos', 'Please upload and cull photos first.', 'warning');
      return;
    }

    if (!isSessionPaid) {
      setIsPaymentModalOpen(true);
      return;
    }

    setIsMoveGalleryModalOpen(true);
  };

  // Payment Success Handler (invoked during upload checkout)
  const handlePaymentSuccess = (details: { tier: string; amount: number }) => {
    setIsSessionPaid(true);
    setPaidDetails(details);
    setIsPaymentModalOpen(false);
    saveLocalCullingSession({
      sessionId,
      isSessionPaid: true,
      paidDetails: details,
      photos,
      clusters,
    });
  };

  // After moving to gallery: purge and delete all photos from the culling staging session
  const handleMoveSuccess = useCallback(() => {
    photos.forEach((p) => {
      if (p.previewUrl && p.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
    setPhotos([]);
    setClusters([]);
    setActiveCompareClusterId(null);
    setIsCompareModalOpen(false);
    setActiveTab('clusters');
    setIsSessionPaid(false);
    setPaidDetails(null);
    clearLocalCullingSession();
    // Signal backend that staging storage is freed
    DiscardCullingSessionApi(sessionId).catch(() => {});
    setSessionId(`cull_session_${Date.now()}`);
  }, [photos, sessionId]);

  // Aggregates
  const totalPhotos = photos.length;
  const keepers = useMemo(() => photos.filter((p) => p.status === 'keep'), [photos]);
  const duplicates = useMemo(() => photos.filter((p) => p.status === 'discard'), [photos]);
  const totalWastedBytes = useMemo(
    () => duplicates.reduce((acc, p) => acc + p.sizeBytes, 0),
    [duplicates]
  );
  const totalWastedMB = Math.round((totalWastedBytes / (1024 * 1024)) * 10) / 10;
  const totalBytes = useMemo(() => photos.reduce((acc, p) => acc + p.sizeBytes, 0), [photos]);
  const percentSaved = totalBytes > 0 ? Math.round((totalWastedBytes / totalBytes) * 100) : 0;

  // Download approved keepers as ZIP archive using browser bundling engine
  const handleDownloadKeepersZip = useCallback(async () => {
    if (keepers.length === 0) {
      showToast('No Keepers', 'No photos are marked as Keep in this session.', 'error');
      return;
    }

    setIsZipping(true);
    setZipProgress(5);

    try {
      const items = keepers.map((photo, index) => ({
        url: photo.previewUrl,
        filename: photo.name || `keeper_${index + 1}.jpg`,
        title: photo.name,
      }));

      const zipFilename = `AI_Keepers_${sessionId.slice(-6)}.zip`;

      await downloadMultipleAsZip({
        items,
        zipFilename,
        onProgress: (percent) => {
          setZipProgress(percent);
        },
      });

      showToast(
        'Download Complete',
        `Successfully downloaded ${keepers.length} keepers in ${zipFilename}.`,
        'success'
      );
      // Prompt user whether to finish & clear session storage to upload next
      setShowPostZipModal(true);
    } catch (err: any) {
      console.error('[SmartCull] ZIP download failed:', err);
      showToast('Download Failed', err?.message || 'Failed to generate ZIP archive.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  }, [keepers, sessionId, showToast]);

  // Discard active batch: frees staging storage, wipes cache, and resets session state
  const handleDiscardSession = useCallback(
    async (silent: boolean = false) => {
      setIsDiscarding(true);
      try {
        await DiscardCullingSessionApi(sessionId);
      } catch (err) {
        console.warn('[SmartCull] Error discarding backend session:', err);
      } finally {
        photos.forEach((p) => {
          if (p.previewUrl && p.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(p.previewUrl);
          }
        });
        setPhotos([]);
        setClusters([]);
        setActiveCompareClusterId(null);
        setIsCompareModalOpen(false);
        setActiveTab('clusters');
        setIsSessionPaid(false);
        setPaidDetails(null);
        clearLocalCullingSession();
        setIsDiscardModalOpen(false);
        setShowPostZipModal(false);
        setIsDiscarding(false);
        setSessionId(`cull_session_${Date.now()}`);

        if (!silent) {
          showToast(
            'Session Discarded',
            'Active culling batch deleted and staging storage cleared. You can now select a plan and upload a new shoot.',
            'info'
          );
        }
      }
    },
    [sessionId, photos, showToast]
  );

  // Active Compare Cluster
  const activeCluster = useMemo(
    () => clusters.find((c) => c.id === activeCompareClusterId) || null,
    [clusters, activeCompareClusterId]
  );
  const activeClusterPhotos = useMemo(
    () => photos.filter((p) => p.clusterId === activeCompareClusterId),
    [photos, activeCompareClusterId]
  );

  // Active photo list depending on tab selection
  const activePhotoList = useMemo(() => {
    if (activeTab === 'all') return photos;
    if (activeTab === 'keepers') return keepers;
    if (activeTab === 'duplicates') return duplicates;
    return [];
  }, [activeTab, photos, keepers, duplicates]);

  // Sliced lists for progressive infinite scroll rendering
  const visibleClusters = useMemo(
    () => clusters.slice(0, visibleClusterCount),
    [clusters, visibleClusterCount]
  );
  const visiblePhotos = useMemo(
    () => activePhotoList.slice(0, visiblePhotoCount),
    [activePhotoList, visiblePhotoCount]
  );

  // Reset infinite scroll pagination when switching tabs or changing dataset size
  useEffect(() => {
    setVisibleClusterCount(CLUSTERS_PAGE_SIZE);
    setVisiblePhotoCount(PHOTOS_PAGE_SIZE);
  }, [activeTab, photos.length, clusters.length]);

  const hasMore = useMemo(() => {
    if (activeTab === 'clusters') {
      return visibleClusterCount < clusters.length;
    }
    return visiblePhotoCount < activePhotoList.length;
  }, [activeTab, visibleClusterCount, clusters.length, visiblePhotoCount, activePhotoList.length]);

  const loadMore = useCallback(() => {
    if (activeTab === 'clusters') {
      setVisibleClusterCount((prev) => Math.min(prev + CLUSTERS_INCREMENT, clusters.length));
    } else {
      setVisiblePhotoCount((prev) => Math.min(prev + PHOTOS_INCREMENT, activePhotoList.length));
    }
  }, [activeTab, clusters.length, activePhotoList.length]);

  // IntersectionObserver for bottom sentinel element
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Fallback scroll listener on containerRef
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadMore]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#0a0a0e] text-neutral-100 min-h-screen">
      {/* Top Banner / Hero Bar */}
      <div className="border-b border-white/10 bg-[#101117]/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Smart Cull & Deduplicator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Studio AI
                </span>
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Perceptual difference hashing & Laplacian focus sharpness detection. Eliminate burst duplicates and move winners directly into your gallery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* When batch is active: Show Batch Pill + Download ZIP + Move to Gallery + Discard */}
            {photos.length > 0 ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Batch Active ({photos.length} Photos)</span>
                </div>

                <button
                  onClick={handleDownloadKeepersZip}
                  disabled={isZipping || keepers.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download approved keeper photos as ZIP archive"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Zipping ({zipProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download ZIP ({keepers.length})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleInitiateMoveToGallery}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Move to Gallery ({keepers.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsDiscardModalOpen(true)}
                  title="Discard this batch and free storage"
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenUpload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                  title="Payment is completed upfront when uploading photos"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pay-On-Upload • From ₹{minStartingPrice}</span>
                </button>

                <button
                  onClick={handleOpenUpload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Photos</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* If no photos uploaded yet: Hero Onboarding */}
        {photos.length === 0 ? (
          <div className="space-y-8 py-8">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#161720] to-[#101117] border border-white/10 p-8 sm:p-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-10 h-10" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight max-w-xl mx-auto mb-3">
                Cut Photography Culling Time by 80% with Instant AI
              </h2>
              <p className="text-sm text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                Upload your RAW or JPEG burst shoots. Our dual-algorithm engine groups duplicate takes, rates focal sharpness using 2D Laplacian edge variance, keeps the razor-sharp winners, and removes the rest.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleOpenUpload}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black font-semibold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5" />
                  Select Photos & Start AI Cull (From ₹{minStartingPrice})
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-3 text-center">
                Pay upfront per upload batch • {tiers.map((t) => `${t.name} (₹${t.price})`).join(' • ')}
              </p>

              {/* Feature Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12 pt-8 border-t border-white/10 text-left">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-amber-400 font-bold text-sm mb-1">64-bit dHash AI</div>
                  <p className="text-xs text-neutral-400">
                    Calculates structural perceptual fingerprints invariant to exposure, lighting, or compression.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-emerald-400 font-bold text-sm mb-1">Laplacian Sharpness</div>
                  <p className="text-xs text-neutral-400">
                    Runs 3x3 convolution edge variance to identify micro-focus and detect out-of-focus burst shots.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-teal-400 font-bold text-sm mb-1">1-Click Gallery Move</div>
                  <p className="text-xs text-neutral-400">
                    Move your culled winners straight into an existing or new client gallery just like Live Events!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Culling Session UI */
          <div className="space-y-6">
            {/* Storage & Session Lifecycle Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Active Staging Batch • Connected to Cloud Storage
                    </h3>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isSessionPaid ? 'Paid & Active' : 'Active Batch'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Batch #{sessionId.slice(-6)} • {photos.length} photos staged in user storage. Once finished, move to gallery or download as ZIP to clear this session and start fresh.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={handleDownloadKeepersZip}
                  disabled={isZipping || keepers.length === 0}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Zipping ({zipProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Download Keepers ZIP ({keepers.length})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsDiscardModalOpen(true)}
                  title="Discard this batch and free storage"
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Paywall Banner (if unpaid) */}
            {!isSessionPaid && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      AI Culling Ready • One-Time Pay-As-You-Go Unlock
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Pay ₹{minStartingPrice} to unlock full resolution export and move all {keepers.length} approved keepers directly into your gallery.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-black font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 shrink-0 transition-all cursor-pointer"
                >
                  Unlock Session (₹{minStartingPrice})
                </button>
              </div>
            )}

            {/* Metrics Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-[#14151e] border border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                  Total Uploaded
                </span>
                <div className="text-2xl font-bold text-white mt-1">{totalPhotos}</div>
                <span className="text-[11px] text-neutral-500">{(totalBytes / (1024 * 1024)).toFixed(1)} MB processed</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14151e] border border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                  Duplicate Clusters
                </span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{clusters.length}</div>
                <span className="text-[11px] text-neutral-500">Burst sequences</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14151e] border border-red-500/20 bg-red-950/10">
                <span className="text-[11px] uppercase tracking-wider text-red-400 font-semibold">
                  To Remove
                </span>
                <div className="text-2xl font-bold text-red-400 mt-1">{duplicates.length}</div>
                <span className="text-[11px] text-red-400/70 font-mono">Inferior/blurry takes</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14151e] border border-emerald-500/20 bg-emerald-950/10">
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                  Approved Keepers
                </span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{keepers.length}</div>
                <span className="text-[11px] text-emerald-400/70 font-mono">Sharpest picks</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#14151e] border border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                  Storage Cleaned
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {totalWastedMB} <span className="text-xs font-normal text-neutral-400">MB</span>
                </div>
                <span className="text-[11px] text-neutral-500">{percentSaved}% storage reduction</span>
              </div>
            </div>

            {/* Navigation Filter Tabs & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('clusters')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    activeTab === 'clusters'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Duplicate Clusters ({clusters.length})
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'all'
                      ? 'bg-white/20 text-white shadow-md'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All Photos ({totalPhotos})
                </button>

                <button
                  onClick={() => setActiveTab('keepers')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    activeTab === 'keepers'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Keepers ({keepers.length})
                </button>

                <button
                  onClick={() => setActiveTab('duplicates')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    activeTab === 'duplicates'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Duplicates to Discard ({duplicates.length})
                </button>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleResetToAI}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  Reset to AI Picks
                </button>
                <button
                  onClick={handleKeepAll}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  Keep All
                </button>
              </div>
            </div>

            {/* TAB CONTENT: DUPLICATE CLUSTERS VIEW */}
            {activeTab === 'clusters' && (
              <div className="space-y-6">
                {clusters.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#14151e] border border-white/10 text-neutral-400">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-white">No Duplicate Clusters Found!</h3>
                    <p className="text-xs mt-1">
                      Every photo in this batch appears structurally distinct and sharp. All {photos.length} photos have been designated as keepers.
                    </p>
                  </div>
                ) : (
                  visibleClusters.map((cluster) => {
                    const clusterItems = photos.filter((p) => p.clusterId === cluster.id);
                    const winner = clusterItems.find((p) => p.isBestPick) || clusterItems[0];
                    const clusterDuplicates = clusterItems.filter((p) => !p.isBestPick);

                    return (
                      <div
                        key={cluster.id}
                        className="rounded-2xl bg-[#13141a] border border-white/10 overflow-hidden shadow-xl"
                      >
                        {/* Cluster Header */}
                        <div className="px-5 py-3.5 bg-[#171822] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                              {cluster.title}
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                {cluster.averageSimilarity}% Similarity
                              </span>
                            </span>
                            <span className="text-xs text-neutral-400">
                              {cluster.totalPhotos} photos in burst • 1 keeper, {cluster.duplicatesCount} duplicate(s)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveCompareClusterId(cluster.id);
                                setIsCompareModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              Side-by-Side Compare
                            </button>
                          </div>
                        </div>

                        {/* Cluster Photos Grid */}
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {clusterItems.map((photo) => {
                            const isWinner = photo.isBestPick;
                            const isDiscarded = photo.status === 'discard';

                            return (
                              <div
                                key={photo.id}
                                className={`group relative rounded-xl overflow-hidden border-2 transition-all flex flex-col bg-neutral-950 ${
                                  isWinner
                                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                                    : isDiscarded
                                    ? 'border-red-500/40 opacity-80 hover:opacity-100'
                                    : 'border-white/20'
                                }`}
                              >
                                {/* Top Badge */}
                                <div className="absolute top-2 left-2 z-10">
                                  {isWinner ? (
                                    <span className="px-2 py-1 rounded-md bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                                      <Trophy className="w-3 h-3" />
                                      Best Pick
                                    </span>
                                  ) : isDiscarded ? (
                                    <span className="px-2 py-1 rounded-md bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                                      <Trash2 className="w-3 h-3" />
                                      Duplicate
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider shadow">
                                      Kept
                                    </span>
                                  )}
                                </div>

                                {/* Sharpness Score Badge */}
                                <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-neutral-300 font-bold border border-white/10">
                                  Sharp: {photo.sharpnessScore}%
                                </div>

                                {/* Photo Thumbnail */}
                                <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-900 relative">
                                  {photo.previewUrl ? (
                                    <img
                                      src={resolveImageUrl(photo.previewUrl)}
                                      alt={photo.name}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const fallbackEl = target.nextElementSibling as HTMLElement;
                                        if (fallbackEl) fallbackEl.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`img-fallback absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-neutral-900 text-neutral-400 ${photo.previewUrl ? 'hidden' : 'flex'}`}>
                                    <FileImage className="w-8 h-8 text-neutral-600 mb-1" />
                                    <span className="text-[10px] text-neutral-400 truncate max-w-full font-mono">{photo.name}</span>
                                    <span className="text-[9px] text-amber-500/80 mt-0.5 font-mono">Backend Photo</span>
                                  </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="p-2.5 bg-[#161720] border-t border-white/10 flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                    <span className="truncate max-w-[110px]" title={photo.name}>
                                      {photo.name}
                                    </span>
                                    <span>{photo.sizeMB} MB</span>
                                  </div>

                                  <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                                    {!isWinner ? (
                                      <button
                                        onClick={() => handleSetBestPick(photo.id)}
                                        className="flex-1 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold transition-colors text-center cursor-pointer"
                                      >
                                        Make Winner
                                      </button>
                                    ) : (
                                      <span className="flex-1 py-1 text-center text-emerald-400 text-[10px] font-bold">
                                        ✓ Kept as Best
                                      </span>
                                    )}

                                    {!isWinner && (
                                      <button
                                        onClick={() => handleToggleStatus(photo.id)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                          isDiscarded
                                            ? 'bg-white/10 hover:bg-white/20 text-neutral-200'
                                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                        }`}
                                      >
                                        {isDiscarded ? 'Keep' : 'Discard'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: ALL / KEEPERS / DUPLICATES GRID VIEW */}
            {activeTab !== 'clusters' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {visiblePhotos.map((photo) => {
                  const isWinner = photo.isBestPick;
                  const isDiscarded = photo.status === 'discard';

                  return (
                    <div
                      key={photo.id}
                      className={`group relative rounded-xl overflow-hidden border-2 transition-all flex flex-col bg-[#13141a] ${
                        isWinner
                          ? 'border-emerald-500 shadow-md shadow-emerald-500/10'
                          : isDiscarded
                          ? 'border-red-500/30 opacity-75 hover:opacity-100'
                          : 'border-white/15'
                      }`}
                    >
                      <div className="absolute top-1.5 left-1.5 z-10">
                        {isWinner ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-bold uppercase tracking-wider">
                            Best
                          </span>
                        ) : isDiscarded ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider">
                            Duplicate
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider">
                            Unique
                          </span>
                        )}
                      </div>

                      <div className="absolute top-1.5 right-1.5 z-10 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-neutral-300">
                        {photo.sharpnessScore}%
                      </div>

                      <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-900 relative">
                        {photo.previewUrl ? (
                          <img
                            src={resolveImageUrl(photo.previewUrl)}
                            alt={photo.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallbackEl = target.nextElementSibling as HTMLElement;
                              if (fallbackEl) fallbackEl.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`img-fallback absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-neutral-900 text-neutral-400 ${photo.previewUrl ? 'hidden' : 'flex'}`}>
                          <FileImage className="w-6 h-6 text-neutral-600 mb-1" />
                          <span className="text-[9px] text-neutral-400 truncate max-w-full font-mono">{photo.name}</span>
                        </div>
                      </div>

                      <div className="p-2 flex items-center justify-between text-[10px] text-neutral-400 bg-[#161720]">
                        <span className="truncate max-w-[80px]">{photo.name}</span>
                        <button
                          onClick={() => handleToggleStatus(photo.id)}
                          className={`font-semibold hover:underline cursor-pointer ${
                            isDiscarded ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isDiscarded ? 'Keep' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel & Progressive Loading Indicator */}
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

      {/* Upload Modal with Upfront Payment on Uploading */}
      <CullingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFilesSelected={handleFilesSelected}
        sessionId={sessionId}
        isSessionPaid={isSessionPaid}
        paidDetails={paidDetails}
        onPaymentSuccess={handlePaymentSuccess}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        analysisStatusText={analysisStatusText}
      />

      {/* Pay-Per-Use Modal (Fallback / Direct Access) */}
      <CullingPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        sessionId={sessionId}
        photoCount={photos.length}
        onPaymentSuccess={handlePaymentSuccess}
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
                This will permanently delete all {totalPhotos} culled photos from your staging storage. Your plan session will be closed and cannot be recovered.
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
                All {keepers.length} approved keeper photos have been downloaded to your computer. Each plan covers one batch upload. Would you like to finish & clear this session from staging storage to start your next shoot?
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
    </div>
  );
};
