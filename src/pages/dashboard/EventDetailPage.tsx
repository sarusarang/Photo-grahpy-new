import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveIngestion } from '@/hooks/useLiveIngestion';
import {
  useEventDetail,
  useDeleteEventMedia,
  useBulkDeleteEventMedia,
  useUpdateEvent,
} from '@/hooks/useAtelierQueries';
import { normalizeServerEvent } from '@/utils/eventNormalizer';
import { GetEventDetailApi } from '@/service/events/EventApi';
import { ErrorState } from '@/components/common/ErrorState';
import { EventListSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import {
  EventDetailHeader,
  EventHeroBanner,
  EventAnalyticsGrid,
  EventIngestionHub,
  EventQRCard,
  EventMediaStream,
  EventBulkToolbar,
  EventDeleteMediaModal,
} from '@/components/events/detail';
import {
  EventQRCodeModal,
  EventPrintStandModal,
  ChangeBannerModal,
  MoveToGalleryModal,
  LiveCameraCaptureModal,
  EventUploadMediaModal,
  EditEventModal,
} from '@/components/events';
import { LightboxModal } from '@/components/gallery/LightboxModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { downloadSingleImage, downloadMultipleAsZip } from '@/utils/downloadUtils';
import { Lock, Sparkles } from 'lucide-react';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal';
import { LockedPageScreen } from '@/components/common/ExpiredPlanLock';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    data: apiEvent,
    isLoading: isLoadingEvent,
    refetch: refetchEvent,
  } = useEventDetail(eventId || '');

  const { mutateAsync: deleteMediaMutation, isPending: isDeletingMedia } = useDeleteEventMedia(
    eventId || ''
  );
  const { mutateAsync: bulkDeleteMutation, isPending: isBulkDeleting } = useBulkDeleteEventMedia(
    eventId || ''
  );
  const { mutateAsync: updateEventMutation } = useUpdateEvent();

  // Normalize server live event strictly from API response — zero dummy fallbacks
  const event = useMemo(() => {
    if (apiEvent && (apiEvent as any).id) {
      return normalizeServerEvent(apiEvent);
    }
    return null;
  }, [apiEvent]);

  // Modals state
  const [isCameraStationOpen, setIsCameraStationOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPrintStandOpen, setIsPrintStandOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isMoveToGalleryOpen, setIsMoveToGalleryOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [cameraStationTab, setCameraStationTab] = useState<'camera' | 'folder' | 'manual'>('camera');
  const planQuota = usePlanQuota();

  // Unified live camera shutter and hot-folder watcher session controller
  const ingestion = useLiveIngestion({
    eventId: eventId || '',
    eventSlug: event?.slug,
    onPhotoUploaded: () => refetchEvent(),
  });

  // Single Photo Lightbox & Infinite Scroll State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Single photo deletion confirmation
  const [mediaToDelete, setMediaToDelete] = useState<{ id: string; title: string } | null>(null);

  // Multi-selection & Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0);

  const handleDownloadSelected = async () => {
    if (!event || selectedIds.length === 0) return;
    const selectedMediaList = event.media.filter((m) => selectedIds.includes(m.id));
    if (selectedMediaList.length === 0) return;

    setIsDownloadingBulk(true);
    setBulkDownloadProgress(5);

    try {
      if (selectedMediaList.length === 1) {
        const item = selectedMediaList[0];
        const downloadUrl = item.url || item.thumbnailUrl;
        if (!downloadUrl) return;
        const filename = item.title || `${event.slug}-photo.jpg`;
        showToast('Downloading Photo', `Saving "${filename}"...`, 'info');
        const success = await downloadSingleImage(downloadUrl, filename);
        if (success) {
          showToast('Photo Saved', `"${filename}" saved to downloads.`, 'success');
        }
        return;
      }

      showToast(
        'Packaging Selected',
        `Bundling ${selectedMediaList.length} selected photographs into a ZIP file...`,
        'info'
      );

      const items = selectedMediaList
        .map((m, idx) => ({
          url: (m.url || m.thumbnailUrl || '') as string,
          title: m.title || `${event.slug}-selected-${idx + 1}`,
        }))
        .filter((item) => Boolean(item.url));

      await downloadMultipleAsZip({
        items,
        zipFilename: `${event.slug}-selected-${selectedMediaList.length}-photos.zip`,
        onProgress: (percent) => setBulkDownloadProgress(percent),
      });

      showToast(
        'Archive Downloaded',
        `Downloaded ${selectedMediaList.length} selected photographs.`,
        'success'
      );
    } catch {
      showToast('Download Failed', 'Could not generate ZIP archive.', 'error');
    } finally {
      setIsDownloadingBulk(false);
      setBulkDownloadProgress(0);
    }
  };

  // Section categorization & infinite scroll filtering
  const availableSections = useMemo(() => {
    if (!event?.media) return [];
    const set = new Set<string>();
    event.media.forEach((m) => {
      if (m.sectionTitle && m.sectionTitle.trim()) {
        set.add(m.sectionTitle.trim().toUpperCase());
      }
    });
    return Array.from(set);
  }, [event?.media]);

  const filteredMedia = useMemo(() => {
    if (!event?.media) return [];
    if (selectedSectionFilter === 'all') return event.media;
    return event.media.filter(
      (m) => (m.sectionTitle || '').trim().toUpperCase() === selectedSectionFilter.toUpperCase()
    );
  }, [event?.media, selectedSectionFilter]);

  const visibleMedia = useMemo(() => {
    return filteredMedia.slice(0, visibleCount);
  }, [filteredMedia, visibleCount]);

  const selectedMediaItems = useMemo(() => {
    if (!event?.media) return [];
    const idSet = new Set(selectedIds);
    return event.media.filter((m) => idSet.has(m.id));
  }, [event?.media, selectedIds]);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // True total matching media count in this section / filter (across entire server database, not just loaded slice)
  const totalMatchingCount = useMemo(() => {
    if (!event) return 0;
    if (selectedSectionFilter === 'all') {
      return (
        event.totalMediaCount ||
        (event.photosCount !== undefined ? event.photosCount + (event.videosCount || 0) : undefined) ||
        event.media.length
      );
    }
    const secKey = selectedSectionFilter.toUpperCase();
    const countFromRecord =
      event.sectionCounts?.[selectedSectionFilter] ??
      event.sectionCounts?.[secKey];
    if (countFromRecord !== undefined) {
      return countFromRecord;
    }
    return filteredMedia.length;
  }, [event, selectedSectionFilter, filteredMedia.length]);

  const isAllSelected = totalMatchingCount > 0 && selectedIds.length >= totalMatchingCount;

  const [isSelectingAll, setIsSelectingAll] = useState(false);

  const selectAll = async () => {
    if (!event) return;

    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }

    const currentLoadedIds = filteredMedia.map((m) => m.id);
    if (totalMatchingCount <= currentLoadedIds.length) {
      setSelectedIds(currentLoadedIds);
      return;
    }

    // Select currently loaded items immediately
    setSelectedIds(currentLoadedIds);
    setIsSelectingAll(true);
    showToast(
      'Selecting All Media',
      `Loading all ${totalMatchingCount} items across this event...`,
      'info'
    );

    try {
      const fullEvent = await GetEventDetailApi(event.id, {
        all_media: true,
        section: selectedSectionFilter,
      });

      const normalizedFull = normalizeServerEvent(fullEvent);
      const allItemIds = normalizedFull.media
        .filter((m) => {
          if (selectedSectionFilter === 'all') return true;
          return (m.sectionTitle || '').trim().toUpperCase() === selectedSectionFilter.toUpperCase();
        })
        .map((m) => m.id);

      if (allItemIds.length > 0) {
        setSelectedIds(Array.from(new Set([...currentLoadedIds, ...allItemIds])));
        showToast(
          'All Media Selected',
          `Selected all ${allItemIds.length} items in this event view.`,
          'success'
        );
      }
    } catch (err) {
      console.warn('Failed to fetch full media list for event select-all:', err);
    } finally {
      setIsSelectingAll(false);
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const hasMoreMedia = visibleCount < filteredMedia.length;

  useEffect(() => {
    if (!hasMoreMedia) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMedia) {
          setVisibleCount((prev) => Math.min(prev + 16, filteredMedia.length));
        }
      },
      { rootMargin: '350px', threshold: 0.05 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreMedia, filteredMedia.length]);

  const handleStartLiveShoot = async () => {
    if (!event) return;
    try {
      await updateEventMutation({
        id: event.id,
        updates: { status: 'live' },
      });
      showToast('Live Mode Started!', `"${event.title}" is now active and ready for live shooting.`, 'success');
      refetchEvent();
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Could not start live shoot.', 'error');
    }
  };

  const handleConfirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    try {
      await deleteMediaMutation(mediaToDelete.id);
      showToast('Photo Deleted', `Removed "${mediaToDelete.title}" from event stream.`, 'info');
      setMediaToDelete(null);
      refetchEvent();
    } catch (err: any) {
      showToast('Delete Failed', err?.message || 'Failed to remove photo.', 'error');
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!event || selectedIds.length === 0 || isBulkDeleting) return;
    const count = selectedIds.length;
    const idsToDelete = [...selectedIds];
    const isAllMatching = isAllSelected || count >= totalMatchingCount;

    try {
      await bulkDeleteMutation({
        mediaIds: idsToDelete,
        deleteAll: isAllMatching,
        section: selectedSectionFilter,
      });
      showToast('Photos Deleted', `Successfully removed ${count} items from event.`, 'success');
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      refetchEvent();
    } catch (err: any) {
      showToast('Bulk Delete Failed', err?.message || 'Failed to remove selected items.', 'error');
    }
  };

  const handleOpenStation = (tab: 'camera' | 'folder' | 'manual') => {
    setCameraStationTab(tab);
    setIsCameraStationOpen(true);
  };

  if (isLoadingEvent && !event) {
    return (
      <div className="dashboard-container p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <EventListSkeleton count={2} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <ErrorState
          title="Event Not Found"
          message="The requested event could not be located on the server, or may have been deleted."
          onRetry={() => refetchEvent()}
          actionLabel="Return to Events"
          onAction={() => navigate('/dashboard/events')}
        />
      </div>
    );
  }

  if (planQuota.isExpired) {
    return (
      <div className="dashboard-container p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <LockedPageScreen
          resourceType="event"
          resourceTitle={event?.title}
          onRenew={() => setIsUpgradeModalOpen(true)}
          onBack={() => navigate('/dashboard/events')}
        />
        <UpgradePlanModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          errorCode="PLAN_EXPIRED"
          lockedFeature="Live Events"
          errorMessage={`Your studio plan has expired. Renew your plan to unlock and manage ${event?.title || 'this live event'}.`}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ─── Studio Plan Expired Warning Banner ─── */}
      {planQuota.isExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/50 to-neutral-900/80 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <Lock className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Guest Link Suspended
                </span>
                <span className="font-bold text-white text-sm">Studio Plan Expired</span>
              </div>
              <p className="text-neutral-300">
                Public guest QR codes, live event streaming, and AI face search downloads for this event are temporarily locked until your plan is renewed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Renew Membership</span>
          </button>
        </div>
      )}

      {/* ─── Back Navigation & Primary Actions ─── */}
      <EventDetailHeader
        event={event}
        onStartLiveShoot={handleStartLiveShoot}
        onOpenEditModal={() => setIsEditModalOpen(true)}
        onOpenMoveToGallery={() => setIsMoveToGalleryOpen(true)}
      />

      {/* ─── Hero Banner & Metadata ─── */}
      <EventHeroBanner
        event={event}
        onOpenBannerModal={() => setIsBannerModalOpen(true)}
      />

      {/* ─── Real-Time Live Analytics & Performance Metrics ─── */}
      <EventAnalyticsGrid event={event} />

      {/* ─── Ingestion Command Bar & QR Code Summary ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <EventIngestionHub
            ingestion={ingestion}
            onOpenStation={handleOpenStation}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        </div>

        <div className="lg:col-span-5">
          <EventQRCard
            event={event}
            onOpenQRModal={() => setIsQRModalOpen(true)}
            onOpenPrintStand={() => setIsPrintStandOpen(true)}
          />
        </div>
      </div>

      {/* ─── Live Event Photo Stream ─── */}
      <EventMediaStream
        media={visibleMedia}
        allMedia={event.media}
        totalCount={
          event.totalMediaCount ||
          (event.photosCount !== undefined ? event.photosCount + (event.videosCount || 0) : undefined) ||
          event.media.length
        }
        sectionCounts={event.sectionCounts}
        availableSections={availableSections}
        selectedSectionFilter={selectedSectionFilter}
        onSelectSection={(sec) => {
          setSelectedSectionFilter(sec);
          setVisibleCount(24);
        }}
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onOpenBulkDelete={() => setIsBulkDeleteOpen(true)}
        onToggleSelect={toggleSelect}
        onOpenLightbox={(idx) => setLightboxIndex(idx)}
        onDeleteSingleMedia={(m) => setMediaToDelete(m)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenStation={() => setIsCameraStationOpen(true)}
        hasMoreMedia={hasMoreMedia}
        loadMoreRef={loadMoreRef}
        visibleCount={visibleMedia.length}
        filteredCount={totalMatchingCount}
      />

      {/* ─── Floating Bulk Toolbar ─── */}
      <EventBulkToolbar
        selectedCount={selectedIds.length}
        totalCount={totalMatchingCount}
        isAllSelected={isAllSelected}
        isSelectingAll={isSelectingAll}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onOpenBulkDelete={() => setIsBulkDeleteOpen(true)}
        onDownloadSelected={handleDownloadSelected}
        isDownloading={isDownloadingBulk}
        downloadProgress={bulkDownloadProgress}
      />

      {/* ─── Modals ─── */}
      <EventDeleteMediaModal
        isOpen={Boolean(mediaToDelete)}
        mediaTitle={mediaToDelete?.title || 'Photo'}
        isDeleting={isDeletingMedia}
        onClose={() => setMediaToDelete(null)}
        onConfirm={handleConfirmDeleteMedia}
      />

      <ConfirmDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => !isBulkDeleting && setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        isDeleting={isBulkDeleting}
        title={`Delete ${selectedIds.length} Event Items`}
        description={`Are you sure you want to delete ${selectedIds.length} selected photos/videos? This will permanently remove them from the live event and update studio storage.`}
        confirmLabel={`Delete ${selectedIds.length} Items`}
        items={selectedMediaItems}
        itemCount={selectedIds.length}
      />

      <EventUploadMediaModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        event={event}
        onUploadComplete={refetchEvent}
      />

      {lightboxIndex !== null && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={event.media}
          currentIndex={lightboxIndex}
          onNavigate={(idx) => setLightboxIndex(idx)}
          onDelete={async (mediaId) => {
            await deleteMediaMutation(mediaId);
            refetchEvent();
            setLightboxIndex(null);
          }}
          allowDownloads={true}
          galleryTitle={event.title}
          gallerySlug={event.slug || event.id}
        />
      )}

      <LiveCameraCaptureModal
        isOpen={isCameraStationOpen}
        onClose={() => setIsCameraStationOpen(false)}
        event={event}
        onPhotoUploaded={refetchEvent}
        ingestion={ingestion}
        defaultTab={cameraStationTab}
      />

      <EventQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        event={event}
        onOpenPrintStand={() => {
          setIsQRModalOpen(false);
          setIsPrintStandOpen(true);
        }}
        onUpdated={refetchEvent}
      />

      <EventPrintStandModal
        isOpen={isPrintStandOpen}
        onClose={() => setIsPrintStandOpen(false)}
        event={event}
      />

      <ChangeBannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        event={event}
        onUpdated={refetchEvent}
      />

      <MoveToGalleryModal
        isOpen={isMoveToGalleryOpen}
        onClose={() => setIsMoveToGalleryOpen(false)}
        event={event}
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={event}
        onUpdated={refetchEvent}
      />

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
