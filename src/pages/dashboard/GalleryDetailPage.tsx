import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useUpload } from '../../context/UploadContext';
import { useToast } from '../../components/ui/Toast';
import type { GalleryTemplateId, MediaItem, Gallery } from '../../types';
import { getInitialGalleryCover } from '@/utils/coverImageUtils';
import { ShareModal } from '../../components/gallery/ShareModal';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { DeleteGalleryModal } from '../../components/gallery/DeleteGalleryModal';
import { MoveToSectionModal } from '../../components/gallery/MoveToSectionModal';
import { GalleryAnalyticsView } from '../../components/gallery/GalleryAnalyticsView';
import {
  GalleryDetailHeader,
  GallerySectionControlBar,
  GalleryMediaGrid,
  GalleryDesignLayoutTab,
  GallerySettingsTab,
  type GalleryTabType,
} from '@/components/gallery/detail';
import {
  useGalleryDetailInfinite,
  useUpdateGallery,
  useDeleteGallery,
  useArchiveGallery,
  useDeleteGalleryMedia,
  useBulkDeleteGalleryMedia,
  useAddGallerySection,
  useDeleteGallerySection,
  useRenameGallerySection,
  useSetGalleryTemplate,
  useSetGalleryTemplateBanner,
  useSetMasonrySlotBanner,
  useSetGalleryCover,
  useReorderGalleryMedia,
  useToggleMediaFavorite,
} from '@/hooks/useAtelierQueries';
import { GalleryDetailSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { normalizeServerGallery } from '@/utils/galleryNormalizer';
import { useSmoothScroll } from '@/components/common/SmoothScroll';
import { AlertTriangle, Archive } from 'lucide-react';
import { usePlanQuota } from '@/hooks/usePlanQuota';

export const GalleryDetailPage: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const navigate = useNavigate();
  const { lenis } = useSmoothScroll();
  const [searchParams, setSearchParams] = useSearchParams();
  const planQuota = usePlanQuota();

  // Context & Global Notifications
  const {
    updateGallery,
    deleteGallery,
    removeMediaFromGallery,
    toggleMediaFavorite,
    addSectionToGallery,
    deleteSectionFromGallery,
    renameSectionInGallery,
    updateGalleryTemplate,
    setTemplateBannerImage,
    setMasonryBannerImage,
  } = useGallery();
  const { showToast } = useToast();

  // Section & Liked Filter State
  const [dashboardSectionFilter, setDashboardSectionFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // TanStack Infinite Query Hook
  const {
    data: infiniteGalleryData,
    isLoading: isLoadingGallery,
    isError: isGalleryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchGallery,
  } = useGalleryDetailInfinite(galleryId || '', {
    section: dashboardSectionFilter,
    isFavorite: showFavoritesOnly,
    limit: 48,
  });

  // Mutation Hooks
  const updateGalleryMutation = useUpdateGallery();
  const deleteGalleryMutation = useDeleteGallery();
  const archiveGalleryMutation = useArchiveGallery();
  const deleteMediaMutation = useDeleteGalleryMedia();
  const bulkDeleteMutation = useBulkDeleteGalleryMedia();
  const addSectionMutation = useAddGallerySection();
  const deleteSectionMutation = useDeleteGallerySection();
  const renameSectionMutation = useRenameGallerySection();
  const setTemplateMutation = useSetGalleryTemplate();
  const setTemplateBannerMutation = useSetGalleryTemplateBanner();
  const setMasonryBannerMutation = useSetMasonrySlotBanner();
  const setCoverMutation = useSetGalleryCover();
  const reorderMediaMutation = useReorderGalleryMedia();
  const toggleFavoriteMutation = useToggleMediaFavorite();

  // Optimistic Sections State for instant responsive UI updates
  const [optimisticSections, setOptimisticSections] = useState<string[]>([]);
  const [deletedSections, setDeletedSections] = useState<string[]>([]);

  // Optimistic Template State for instant layout switching
  const [optimisticTemplateId, setOptimisticTemplateId] = useState<GalleryTemplateId | null>(null);

  // Optimistic Banner & Cover State for instant responsive visual feedback
  const [optimisticTemplateBanners, setOptimisticTemplateBanners] = useState<Record<string, string>>({});
  const [optimisticMasonryBanners, setOptimisticMasonryBanners] = useState<string[]>([]);
  const [optimisticCoverImage, setOptimisticCoverImage] = useState<string | null>(null);
  const [settingBannerMediaId, setSettingBannerMediaId] = useState<string | null>(null);

  // Optimistic Favorites & Loading State for card and lightbox
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});
  const [favoritingMediaIds, setFavoritingMediaIds] = useState<Set<string>>(new Set());

  // Base gallery metadata (from first page)
  const firstPageRaw = infiniteGalleryData?.pages[0];

  // Real Server Gallery Entity — Pure Backend Sync with Accumulated Infinite Media
  const gallery: Gallery | undefined = useMemo<Gallery | undefined>(() => {
    if (firstPageRaw && (firstPageRaw as any).id) {
      const normalizedFirst = normalizeServerGallery(firstPageRaw);

      // Accumulate unique media items from all loaded pages
      const seenMediaIds = new Set<string>();
      const accumulatedMedia: MediaItem[] = [];

      infiniteGalleryData?.pages.forEach((page) => {
        const normalizedPage = normalizeServerGallery(page);
        normalizedPage.media.forEach((item) => {
          if (!seenMediaIds.has(item.id)) {
            seenMediaIds.add(item.id);
            accumulatedMedia.push(item);
          }
        });
      });

      const combined = Array.from(
        new Set([
          ...(normalizedFirst.sections || []),
          ...optimisticSections,
        ])
      ).filter(
        (sec) => !deletedSections.some((del) => del.toUpperCase() === sec.toUpperCase())
      );

      const rawMedia = accumulatedMedia.length > 0 ? accumulatedMedia : normalizedFirst.media;
      const mediaWithOptimistic = rawMedia.map((m) =>
        optimisticFavorites[m.id] !== undefined
          ? { ...m, isFavorite: optimisticFavorites[m.id] }
          : m
      );

      const mediaUrls = new Set(mediaWithOptimistic.map((m) => m.url));
      const firstPhoto = mediaWithOptimistic.find((m) => m.type !== 'video') || mediaWithOptimistic[0];

      const currentResolvedTemplateId = optimisticTemplateId || normalizedFirst.templateId;

      // Clean template banners: filter out dead deleted storage objects
      const cleanTemplateBanners: Record<string, string> = {};
      Object.entries({
        ...(normalizedFirst.templateBanners || {}),
        ...optimisticTemplateBanners,
      }).forEach(([k, u]) => {
        if (!u) return;
        if (mediaWithOptimistic.length > 0 && u.includes('/storage_objects/') && !mediaUrls.has(u)) {
          return;
        }
        cleanTemplateBanners[k] = u;
      });

      if (!cleanTemplateBanners[currentResolvedTemplateId] && firstPhoto?.url) {
        cleanTemplateBanners[currentResolvedTemplateId] = firstPhoto.url;
      }

      // Sync active masonry banner
      const activeMasonryBanner =
        cleanTemplateBanners['masonry'] ||
        optimisticMasonryBanners[0] ||
        (normalizedFirst.masonryBannerImages?.[0] !== getInitialGalleryCover('masonry') ? normalizedFirst.masonryBannerImages?.[0] : undefined) ||
        cleanTemplateBanners[currentResolvedTemplateId] ||
        firstPhoto?.url;

      if (activeMasonryBanner && !cleanTemplateBanners['masonry']) {
        cleanTemplateBanners['masonry'] = activeMasonryBanner;
      }

      const activeBanner = cleanTemplateBanners[currentResolvedTemplateId];
      const isDeadCover =
        (optimisticCoverImage && optimisticCoverImage.includes('/storage_objects/') && !mediaUrls.has(optimisticCoverImage)) ||
        (normalizedFirst.coverImage && normalizedFirst.coverImage.includes('/storage_objects/') && !mediaUrls.has(normalizedFirst.coverImage));

      const isInitialFallback =
        normalizedFirst.coverImage === getInitialGalleryCover(currentResolvedTemplateId);

      const dynamicCover =
        mediaWithOptimistic.length > 0 && (isDeadCover || isInitialFallback)
          ? (activeBanner || firstPhoto?.url || getInitialGalleryCover(currentResolvedTemplateId))
          : (optimisticCoverImage || activeBanner || normalizedFirst.coverImage);

      const resolvedMasonryList =
        optimisticMasonryBanners.length > 0
          ? [...optimisticMasonryBanners]
          : (normalizedFirst.masonryBannerImages && normalizedFirst.masonryBannerImages.length > 0
              ? [...normalizedFirst.masonryBannerImages]
              : [activeMasonryBanner || getInitialGalleryCover('masonry')]);

      if (activeMasonryBanner && resolvedMasonryList[0] !== activeMasonryBanner) {
        resolvedMasonryList[0] = activeMasonryBanner;
      }

      return {
        ...normalizedFirst,
        templateId: currentResolvedTemplateId,
        media: mediaWithOptimistic,
        sections: combined,
        templateBanners: cleanTemplateBanners,
        masonryBannerImages: resolvedMasonryList,
        coverImage: dynamicCover,
      };
    }
    return undefined;
  }, [
    firstPageRaw,
    infiniteGalleryData?.pages,
    optimisticSections,
    deletedSections,
    optimisticTemplateId,
    optimisticTemplateBanners,
    optimisticMasonryBanners,
    optimisticCoverImage,
    optimisticFavorites,
  ]);

  // Sync optimistic template ID when server confirms update
  useEffect(() => {
    if (firstPageRaw && (firstPageRaw as any).id) {
      const serverTpl = ((firstPageRaw as any).template_id || (firstPageRaw as any).templateId || '').toLowerCase();
      if (serverTpl && serverTpl === optimisticTemplateId) {
        setOptimisticTemplateId(null);
      }
    }
  }, [firstPageRaw, optimisticTemplateId]);

  // Auto-sync cover image to real photo if gallery has media but cover was stale/initial
  useEffect(() => {
    if (!gallery || gallery.media.length === 0) return;
    const firstPhoto = gallery.media.find((m) => m.type !== 'video') || gallery.media[0];
    if (!firstPhoto?.url) return;

    const isInitial = gallery.coverImage === getInitialGalleryCover(gallery.templateId);
    const isOrphan =
      Boolean(gallery.coverImage?.includes('/storage_objects/')) &&
      !gallery.media.some((m) => m.url === gallery.coverImage);

    if (isInitial || isOrphan) {
      setOptimisticCoverImage(firstPhoto.url);
      setOptimisticTemplateBanners((prev) => ({
        ...prev,
        [gallery.templateId]: firstPhoto.url,
      }));
      Promise.allSettled([
        setCoverMutation.mutateAsync({
          galleryId: gallery.id,
          mediaUrl: firstPhoto.url,
          mediaId: firstPhoto.id,
        }),
        setTemplateBannerMutation.mutateAsync({
          galleryId: gallery.id,
          templateId: gallery.templateId,
          mediaUrl: firstPhoto.url,
          mediaId: firstPhoto.id,
        }),
      ]);
    }
  }, [gallery?.id, gallery?.media.length, gallery?.coverImage, gallery?.templateId]);

  // Tab State
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<GalleryTabType>(
    tabParam === 'design'
      ? 'design'
      : tabParam === 'settings'
        ? 'settings'
        : tabParam === 'analytics'
          ? 'analytics'
          : 'media'
  );

  useEffect(() => {
    if (tabParam === 'design') setActiveTab('design');
    else if (tabParam === 'settings') setActiveTab('settings');
    else if (tabParam === 'analytics') setActiveTab('analytics');
    else if (tabParam === 'media') setActiveTab('media');
  }, [tabParam]);

  const handleTabChange = (newTab: GalleryTabType) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'media' ? {} : { tab: newTab });
  };

  // Sync Lenis scroll container when switching tabs or filter dimensions
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      lenis.resize();
    }
  }, [activeTab, lenis]);

  // Media Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Global Upload Integration (Singleton across all pages)
  const { openUploadModal, isUploading, uploadingGalleryId, uploadingGalleryTitle } = useUpload();
  const isAnotherGalleryUploading = Boolean(isUploading && uploadingGalleryId && gallery && uploadingGalleryId !== gallery.id);

  // Modals & Action States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDeleteGalleryOpen, setIsDeleteGalleryOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  // Move to section modal state
  const [isMoveSectionOpen, setIsMoveSectionOpen] = useState(false);
  const [singleItemToMove, setSingleItemToMove] = useState<MediaItem | null>(null);

  // Selected media items for bulk deletion preview
  const selectedMediaItems = gallery?.media.filter((m) => selectedIds.includes(m.id)) || [];
  const itemsToMove = singleItemToMove ? [singleItemToMove] : selectedMediaItems;

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleSetGalleryStatus = async (newStatus: 'active' | 'delivered') => {
    if (!gallery || updateGalleryMutation.isPending) return;
    updateGallery(gallery.id, { status: newStatus });
    showToast(
      'Status Updated',
      `Gallery marked as ${newStatus === 'delivered' ? 'Delivered' : 'Active'}.`,
      'success'
    );
    try {
      await updateGalleryMutation.mutateAsync({ id: gallery.id, updates: { status: newStatus } });
    } catch {
      // safe fallback
    }
  };

  const handleCreateSection = async (title: string) => {
    if (!gallery) return;
    const cleanTitle = title.trim().toUpperCase();
    if (!cleanTitle) return;

    // Immediately reflect in UI optimistically
    setOptimisticSections((prev) => {
      if (prev.some((s) => s.toUpperCase() === cleanTitle)) return prev;
      return [...prev, cleanTitle];
    });
    setDeletedSections((prev) => prev.filter((d) => d.toUpperCase() !== cleanTitle));
    setDashboardSectionFilter(cleanTitle);

    addSectionToGallery(gallery.id, cleanTitle);

    try {
      await addSectionMutation.mutateAsync({
        galleryId: galleryId || gallery.id,
        title: cleanTitle,
      });
      await refetchGallery();
      showToast('Section Created', `"${cleanTitle}" added to gallery sections.`, 'success');
    } catch (err: any) {
      // Rollback on failure
      setOptimisticSections((prev) => prev.filter((s) => s.toUpperCase() !== cleanTitle));
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.title?.[0] ||
        err?.message ||
        'Failed to create section';
      showToast('Creation Failed', msg, 'error');
      throw err;
    }
  };

  const handleRenameSection = async (oldName: string, newName: string) => {
    if (!gallery || renameSectionMutation.isPending) return;
    const cleanOld = oldName.trim().toUpperCase();
    const cleanNew = newName.trim().toUpperCase();
    if (cleanOld === cleanNew) return;

    setOptimisticSections((prev) =>
      prev.map((s) => (s.toUpperCase() === cleanOld ? cleanNew : s))
    );
    renameSectionInGallery(gallery.id, cleanOld, cleanNew);

    try {
      await renameSectionMutation.mutateAsync({
        galleryId: galleryId || gallery.id,
        oldTitle: cleanOld,
        newTitle: cleanNew,
      });
      await refetchGallery();
      showToast('Section Renamed', `"${cleanOld}" renamed to "${cleanNew}".`, 'success');
      if (dashboardSectionFilter.toUpperCase() === cleanOld) {
        setDashboardSectionFilter(cleanNew);
      }
    } catch (err: any) {
      setOptimisticSections((prev) =>
        prev.map((s) => (s.toUpperCase() === cleanNew ? cleanOld : s))
      );
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to rename section';
      showToast('Rename Failed', msg, 'error');
    }
  };

  const handleDeleteSection = (sectionName: string) => {
    setSectionToDelete(sectionName);
  };

  const handleConfirmDeleteSection = async () => {
    if (!gallery || !sectionToDelete || deleteSectionMutation.isPending) return;
    const targetSection = sectionToDelete;

    // Optimistic removal
    setDeletedSections((prev) => [...prev, targetSection]);
    setOptimisticSections((prev) =>
      prev.filter((s) => s.toUpperCase() !== targetSection.toUpperCase())
    );
    deleteSectionFromGallery(gallery.id, targetSection);

    try {
      await deleteSectionMutation.mutateAsync({
        galleryId: galleryId || gallery.id,
        sectionTitle: targetSection,
      });
      await refetchGallery();
      showToast(
        'Section Deleted',
        `Section "${targetSection}" removed. Media items moved to unassigned.`,
        'info'
      );
      if (dashboardSectionFilter.toUpperCase() === targetSection.toUpperCase()) {
        setDashboardSectionFilter('all');
      }
      setSectionToDelete(null);
    } catch (err: any) {
      // Rollback on failure
      setDeletedSections((prev) =>
        prev.filter((d) => d.toUpperCase() !== targetSection.toUpperCase())
      );
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete section';
      showToast('Delete Failed', msg, 'error');
    }
  };

  const handleSaveSettings = async (settings: {
    title: string;
    clientName: string;
    password?: string;
    isPasswordProtected: boolean;
    allowDownloads: boolean;
    expiresAt?: string | null;
    status: 'active' | 'delivered';
  }) => {
    if (!gallery || updateGalleryMutation.isPending) return;
    const resolvedExpiresAt = settings.expiresAt || null;
    const updates = {
      title: settings.title,
      clientName: settings.clientName,
      password: settings.password,
      isPasswordProtected: settings.isPasswordProtected,
      allowDownloads: settings.allowDownloads,
      expiresAt: resolvedExpiresAt,
      status: settings.status,
    };
    updateGallery(gallery.id, updates);

    showToast('Settings Saved', 'Gallery settings updated successfully.', 'success');
    try {
      await updateGalleryMutation.mutateAsync({
        id: gallery.id,
        updates: {
          title: settings.title,
          client_name: settings.clientName,
          is_password_protected: settings.isPasswordProtected,
          password: settings.password,
          allow_downloads: settings.allowDownloads,
          expires_at: resolvedExpiresAt,
          status: settings.status,
        } as any,
      });
      await refetchGallery();
    } catch {
      // safe fallback
    }
  };

  const handleApplyTemplate = async (templateId: GalleryTemplateId) => {
    if (!gallery || setTemplateMutation.isPending) return;
    if (!planQuota.isTemplateAllowed(templateId)) {
      showToast(
        'Template Locked',
        `The ${templateId} layout is a premium template not included in your studio plan (${planQuota.planName}). Please upgrade to unlock it.`,
        'error'
      );
      return;
    }

    setOptimisticTemplateId(templateId);
    updateGalleryTemplate(gallery.id, templateId);

    const assignedBanner =
      optimisticTemplateBanners[templateId] ||
      gallery.templateBanners?.[templateId] ||
      (templateId === 'masonry' ? (gallery.masonryBannerImages?.[0] || optimisticMasonryBanners[0]) : undefined) ||
      gallery.coverImage ||
      gallery.media.find((m) => m.type !== 'video')?.url ||
      gallery.media[0]?.url;

    if (assignedBanner && assignedBanner !== getInitialGalleryCover(templateId)) {
      setOptimisticCoverImage(assignedBanner);
    }

    showToast('Template Applied', `Switched layout to "${templateId}".`, 'success');
    try {
      await Promise.allSettled([
        setTemplateMutation.mutateAsync({ galleryId: gallery.id, templateId }),
        ...(assignedBanner && assignedBanner !== getInitialGalleryCover(templateId)
          ? [
            setCoverMutation.mutateAsync({
              galleryId: gallery.id,
              mediaUrl: assignedBanner,
            }),
          ]
          : []),
      ]);
      await refetchGallery();
    } catch {
      // safe fallback
    }
  };

  const handleSetTemplateBanner = async (
    templateId: GalleryTemplateId,
    mediaUrl: string,
    mediaId?: string
  ) => {
    if (!gallery) return;

    // 1. Optimistic state
    setOptimisticTemplateBanners((prev) => ({
      ...prev,
      [templateId]: mediaUrl,
    }));
    setTemplateBannerImage(gallery.id, templateId, mediaUrl);

    // 2. If masonry, update slot 0
    if (templateId === 'masonry') {
      setOptimisticMasonryBanners((prev) => {
        const base =
          prev.length >= 4
            ? [...prev]
            : (gallery.masonryBannerImages && gallery.masonryBannerImages.length >= 4
              ? [...gallery.masonryBannerImages]
              : [
                mediaUrl,
                gallery.media[1]?.url || mediaUrl,
                gallery.media[2]?.url || mediaUrl,
                gallery.media[3]?.url || mediaUrl,
              ]);
        base[0] = mediaUrl;
        return base;
      });
      setMasonryBannerImage(gallery.id, 0, mediaUrl);
    }

    // 3. If setting banner for the currently active template, immediately sync cover image
    const isActive = gallery.templateId === templateId;
    if (isActive) {
      setOptimisticCoverImage(mediaUrl);
    }

    showToast('Banner Image Updated', `Set new hero banner for ${templateId.toUpperCase()}.`, 'success');

    // 4. Backend sync
    try {
      const calls: Promise<any>[] = [
        setTemplateBannerMutation.mutateAsync({
          galleryId: gallery.id,
          templateId,
          mediaUrl,
          mediaId,
        }),
      ];

      if (isActive) {
        calls.push(
          setCoverMutation.mutateAsync({
            galleryId: gallery.id,
            mediaUrl,
            mediaId,
          })
        );
      }

      if (templateId === 'masonry') {
        calls.push(
          setMasonryBannerMutation.mutateAsync({
            galleryId: gallery.id,
            slotIndex: 0,
            mediaUrl,
          })
        );
      }

      await Promise.allSettled(calls);
      await refetchGallery();
    } catch {
      // safe fallback
    }
  };

  const handleSetMasonryBanner = async (slotIndex: number, mediaUrl: string) => {
    if (!gallery) return;
    setOptimisticMasonryBanners((prev) => {
      const base =
        prev.length >= 4
          ? [...prev]
          : (gallery.masonryBannerImages && gallery.masonryBannerImages.length >= 4
            ? [...gallery.masonryBannerImages]
            : [
              mediaUrl,
              gallery.media[1]?.url || mediaUrl,
              gallery.media[2]?.url || mediaUrl,
              gallery.media[3]?.url || mediaUrl,
            ]);
      base[slotIndex] = mediaUrl;
      return base;
    });
    setMasonryBannerImage(gallery.id, slotIndex, mediaUrl);
    showToast(`Slot ${slotIndex + 1} Updated`, `Set photo for Masonry Slot ${slotIndex + 1}.`, 'success');
    try {
      await setMasonryBannerMutation.mutateAsync({
        galleryId: gallery.id,
        slotIndex,
        mediaUrl,
      });
      await refetchGallery();
    } catch {
      // safe fallback
    }
  };

  const handleSetBannerFromCard = async (item: MediaItem) => {
    if (!gallery || settingBannerMediaId) return;

    const currentTemplate: GalleryTemplateId = gallery.templateId || 'editorial';
    setSettingBannerMediaId(item.id);

    // 1. Instant Optimistic State Update for active template, cover, AND masonry
    setOptimisticTemplateBanners((prev) => ({
      ...prev,
      [currentTemplate]: item.url,
      masonry: prev.masonry || item.url,
    }));
    setOptimisticCoverImage(item.url);

    // Always update masonry slot 0 so masonry stays in sync
    setOptimisticMasonryBanners((prev) => {
      const base =
        prev.length >= 4
          ? [...prev]
          : (gallery.masonryBannerImages && gallery.masonryBannerImages.length >= 4
            ? [...gallery.masonryBannerImages]
            : [
              item.url,
              gallery.media[1]?.url || item.url,
              gallery.media[2]?.url || item.url,
              gallery.media[3]?.url || item.url,
            ]);
      base[0] = item.url;
      return base;
    });

    setTemplateBannerImage(gallery.id, currentTemplate, item.url);
    setTemplateBannerImage(gallery.id, 'masonry', item.url);
    setMasonryBannerImage(gallery.id, 0, item.url);

    showToast(
      'Hero Banner Updated',
      `"${item.title || 'Selected photo'}" set as hero banner.`,
      'success'
    );

    // 2. Persist to Backend for both template, cover, and masonry
    try {
      const calls: Promise<any>[] = [
        setTemplateBannerMutation.mutateAsync({
          galleryId: gallery.id,
          templateId: currentTemplate,
          mediaUrl: item.url,
          mediaId: item.id,
        }),
        setCoverMutation.mutateAsync({
          galleryId: gallery.id,
          mediaUrl: item.url,
          mediaId: item.id,
        }),
        setMasonryBannerMutation.mutateAsync({
          galleryId: gallery.id,
          slotIndex: 0,
          mediaUrl: item.url,
        }),
      ];

      if (currentTemplate !== 'masonry') {
        calls.push(
          setTemplateBannerMutation.mutateAsync({
            galleryId: gallery.id,
            templateId: 'masonry',
            mediaUrl: item.url,
            mediaId: item.id,
          })
        );
      }

      await Promise.allSettled(calls);
      await refetchGallery();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to set hero banner on server';
      showToast('Banner Update Failed', msg, 'error');
    } finally {
      setSettingBannerMediaId(null);
    }
  };

  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    if (!gallery) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.media.length) return;

    const newMedia = [...gallery.media];
    const [movedItem] = newMedia.splice(index, 1);
    newMedia.splice(targetIndex, 0, movedItem);

    updateGallery(gallery.id, { media: newMedia });
    showToast('Reordered', `Moved "${movedItem.title}" ${direction}.`, 'info');

    reorderMediaMutation.mutateAsync({
      galleryId: gallery.id,
      mediaIds: newMedia.map((m) => m.id),
    }).catch(() => {
      // safe fallback
    });
  };

  const handleToggleFavorite = async (itemId: string) => {
    if (!gallery || favoritingMediaIds.has(itemId)) return;

    const currentItem = gallery.media.find((m) => m.id === itemId);
    const nextFavorite = currentItem ? !currentItem.isFavorite : true;

    // 1. Instant optimistic UI feedback
    setOptimisticFavorites((prev) => ({ ...prev, [itemId]: nextFavorite }));
    setFavoritingMediaIds((prev) => new Set(prev).add(itemId));
    toggleMediaFavorite(gallery.id, itemId);

    try {
      await toggleFavoriteMutation.mutateAsync({
        mediaId: itemId,
        galleryId: gallery.id,
        isFavorite: nextFavorite,
      });
    } catch (err) {
      console.warn('Favorite API call failed:', err);
    } finally {
      setFavoritingMediaIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!gallery || !itemToDelete || deleteMediaMutation.isPending) return;
    const idToDelete = itemToDelete.id;
    removeMediaFromGallery(gallery.id, idToDelete);
    setSelectedIds((prev) => prev.filter((id) => id !== idToDelete));
    showToast('Photo Deleted', `Deleted "${itemToDelete.title}".`, 'info');
    setItemToDelete(null);

    const remainingPhotos = gallery.media.filter((m) => m.id !== idToDelete);
    if (remainingPhotos.length === 0) {
      setOptimisticCoverImage(getInitialGalleryCover(gallery.templateId));
      setOptimisticTemplateBanners({});
      setOptimisticMasonryBanners([]);
      try {
        await setCoverMutation.mutateAsync({ galleryId: gallery.id, mediaUrl: '' });
      } catch {
        // safe fallback
      }
    } else if (gallery.coverImage === itemToDelete.url) {
      const nextPhoto = remainingPhotos.find((m) => m.type !== 'video') || remainingPhotos[0];
      if (nextPhoto?.url) {
        setOptimisticCoverImage(nextPhoto.url);
        try {
          await Promise.allSettled([
            setCoverMutation.mutateAsync({
              galleryId: gallery.id,
              mediaUrl: nextPhoto.url,
              mediaId: nextPhoto.id,
            }),
            setTemplateBannerMutation.mutateAsync({
              galleryId: gallery.id,
              templateId: gallery.templateId,
              mediaUrl: nextPhoto.url,
              mediaId: nextPhoto.id,
            }),
          ]);
        } catch {
          // safe fallback
        }
      }
    }

    try {
      await deleteMediaMutation.mutateAsync({ galleryId: gallery.id, mediaId: idToDelete });
    } catch {
      // safe fallback
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!gallery || selectedIds.length === 0 || bulkDeleteMutation.isPending) return;
    const count = selectedIds.length;
    const idsToDelete = [...selectedIds];
    idsToDelete.forEach((id) => removeMediaFromGallery(gallery.id, id));
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    showToast('Photos Deleted', `Successfully removed ${count} items.`, 'success');

    const remainingPhotos = gallery.media.filter((m) => !idsToDelete.includes(m.id));
    if (remainingPhotos.length === 0) {
      setOptimisticCoverImage(getInitialGalleryCover(gallery.templateId));
      setOptimisticTemplateBanners({});
      setOptimisticMasonryBanners([]);
      try {
        await setCoverMutation.mutateAsync({ galleryId: gallery.id, mediaUrl: '' });
      } catch {
        // safe fallback
      }
    } else {
      const nextPhoto = remainingPhotos.find((m) => m.type !== 'video') || remainingPhotos[0];
      if (nextPhoto?.url) {
        setOptimisticCoverImage(nextPhoto.url);
        try {
          await Promise.allSettled([
            setCoverMutation.mutateAsync({
              galleryId: gallery.id,
              mediaUrl: nextPhoto.url,
              mediaId: nextPhoto.id,
            }),
            setTemplateBannerMutation.mutateAsync({
              galleryId: gallery.id,
              templateId: gallery.templateId,
              mediaUrl: nextPhoto.url,
              mediaId: nextPhoto.id,
            }),
          ]);
        } catch {
          // safe fallback
        }
      }
    }

    try {
      await bulkDeleteMutation.mutateAsync({ galleryId: gallery.id, mediaIds: idsToDelete });
    } catch {
      // safe fallback
    }
  };

  const handleConfirmDeleteGallery = async () => {
    if (!gallery) return;
    const isCurrentlyArchived = gallery.status === 'archived';
    try {
      if (isCurrentlyArchived) {
        deleteGallery(gallery.id);
        showToast('Gallery Permanently Deleted', `"${gallery.title}" has been permanently removed.`, 'info');
        setIsDeleteGalleryOpen(false);
        navigate('/dashboard/gallery?tab=archived');
        await deleteGalleryMutation.mutateAsync({ id: gallery.id, permanent: true });
      } else {
        showToast('Moved to Archive', `"${gallery.title}" has been moved to Archive / Trash.`, 'info');
        setIsDeleteGalleryOpen(false);
        navigate('/dashboard/gallery?tab=archived');
        await archiveGalleryMutation.mutateAsync(gallery.id);
      }
    } catch (err: any) {
      showToast('Action Failed', err?.message || 'Failed to complete gallery removal.', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Currently visible / filtered media based on section & liked filter
  const currentFilteredMedia = useMemo(() => {
    if (!gallery?.media) return [];
    return gallery.media.filter((item) => {
      const matchesSection =
        dashboardSectionFilter === 'all'
          ? true
          : (item.sectionTitle || '').toLowerCase() === dashboardSectionFilter.toLowerCase();
      const matchesFavorite = !showFavoritesOnly || Boolean(item.isFavorite);
      return matchesSection && matchesFavorite;
    });
  }, [gallery?.media, dashboardSectionFilter, showFavoritesOnly]);

  const isAllCurrentSelected =
    currentFilteredMedia.length > 0 &&
    currentFilteredMedia.every((m) => selectedIds.includes(m.id));

  const selectAll = () => {
    if (!gallery) return;
    const currentItemIds = currentFilteredMedia.map((m) => m.id);
    if (currentItemIds.length === 0) return;

    if (isAllCurrentSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentItemIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentItemIds])));
    }
  };

  // Loading, Error & Fallback Empty UI
  if (isLoadingGallery) {
    return <GalleryDetailSkeleton />;
  }

  if (isGalleryError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState
          title="Failed to Load Gallery"
          message="Could not connect to the gallery server. Please verify your connection or try again."
          onRetry={() => refetchGallery()}
        />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center pt-16">
        <EmptyState
          icon={AlertTriangle}
          title="Gallery Not Found"
          description="The requested gallery was not found on the server or may have been deleted."
          actionLabel="Back to Galleries"
          onAction={() => navigate('/dashboard/gallery')}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Archived Status Warning / Recovery Banner */}
      {gallery.status === 'archived' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Archive className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                This Gallery is Currently in Archive / Trash
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                It is hidden from your active portfolio. You can restore it anytime or permanently delete it.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await updateGalleryMutation.mutateAsync({ id: gallery.id, updates: { status: 'active' } });
                  showToast('Gallery Restored', `"${gallery.title}" has been restored to your active galleries.`, 'success');
                } catch (e: any) {
                  showToast('Error', e?.message || 'Failed to restore', 'error');
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              Restore Gallery
            </button>
            <button
              onClick={() => setIsDeleteGalleryOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              Delete Forever
            </button>
          </div>
        </div>
      )}

      {/* 1. Header with Breadcrumbs, Delivery Status, Quick Actions & Tabs */}
      <GalleryDetailHeader
        gallery={gallery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenUpload={() => openUploadModal(gallery.id, gallery.title)}
        onOpenShare={() => setIsShareModalOpen(true)}
        isUploadDisabled={isAnotherGalleryUploading}
        uploadDisabledReason={
          isAnotherGalleryUploading
            ? `An upload is currently in progress for "${uploadingGalleryTitle}". Please wait for it to complete or cancel it.`
            : undefined
        }
        isUpdatingStatus={updateGalleryMutation.isPending}
        onSetStatus={handleSetGalleryStatus}
      />

      {/* 2. Tab: Photos & Videos Management */}
      {activeTab === 'media' && (
        <div className="space-y-4 -mt-3 sm:-mt-4">
          <GallerySectionControlBar
            gallery={gallery}
            selectedIds={selectedIds}
            dashboardSectionFilter={dashboardSectionFilter}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => setShowFavoritesOnly((prev) => !prev)}
            filteredCount={currentFilteredMedia.length}
            isAllSelected={isAllCurrentSelected}
            onSelectSectionFilter={(sec) => setDashboardSectionFilter(sec)}
            onSelectAll={selectAll}
            onClearSelection={() => setSelectedIds([])}
            onOpenBulkMove={() => setIsMoveSectionOpen(true)}
            onOpenBulkDelete={() => setIsBulkDeleteOpen(true)}
            onCreateSection={handleCreateSection}
            onRenameSection={handleRenameSection}
            onDeleteSection={handleDeleteSection}
            isCreatingSection={addSectionMutation.isPending}
            isRenamingSection={renameSectionMutation.isPending}
            isDeletingSection={deleteSectionMutation.isPending}
          />

          <GalleryMediaGrid
            gallery={gallery}
            dashboardSectionFilter={dashboardSectionFilter}
            showFavoritesOnly={showFavoritesOnly}
            onClearFilters={() => {
              setShowFavoritesOnly(false);
              setDashboardSectionFilter('all');
            }}
            selectedIds={selectedIds}
            favoritingMediaIds={favoritingMediaIds}
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={Boolean(isFetchingNextPage)}
            onFetchNextPage={fetchNextPage}
            onOpenUpload={() => openUploadModal(gallery.id, gallery.title)}
            onOpenLightbox={(idx) => setLightboxIndex(idx)}
            onToggleSelect={toggleSelect}
            onMoveSequence={handleMoveMedia}
            onToggleFavorite={handleToggleFavorite}
            onOpenMoveSingle={(item) => {
              setSingleItemToMove(item);
              setIsMoveSectionOpen(true);
            }}
            onSetBanner={handleSetBannerFromCard}
            onDeleteSingle={(item) => setItemToDelete(item)}
            settingBannerMediaId={settingBannerMediaId}
          />
        </div>
      )}

      {/* 3. Tab: Analytics & Telemetry */}
      {activeTab === 'analytics' && (
        <GalleryAnalyticsView
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
        />
      )}

      {/* 4. Tab: Design & Layout Customization */}
      {activeTab === 'design' && (
        <GalleryDesignLayoutTab
          gallery={gallery}
          onApplyTemplate={handleApplyTemplate}
          onSetTemplateBanner={handleSetTemplateBanner}
          onSetMasonryBanner={handleSetMasonryBanner}
          isApplyingTemplate={setTemplateMutation.isPending}
        />
      )}

      {/* 5. Tab: Gallery Settings */}
      {activeTab === 'settings' && (
        <GallerySettingsTab
          gallery={gallery}
          onSaveSettings={handleSaveSettings}
          onOpenDeleteConfirm={() => setIsDeleteGalleryOpen(true)}
          isSaving={updateGalleryMutation.isPending}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gallery={gallery}
      />

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={gallery.media}
          currentIndex={lightboxIndex}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          isFavoriting={
            lightboxIndex !== null && gallery.media[lightboxIndex]
              ? favoritingMediaIds.has(gallery.media[lightboxIndex].id)
              : false
          }
          onDelete={(mId) => {
            removeMediaFromGallery(gallery.id, mId);
          }}
          allowDownloads={gallery.allowDownloads}
          galleryTitle={gallery.title}
          gallerySlug={gallery.slug || gallery.id}
        />
      )}

      {/* Confirm Delete Single Media Item Modal */}
      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        onClose={() => !deleteMediaMutation.isPending && setItemToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        isDeleting={deleteMediaMutation.isPending}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This will permanently remove it from the gallery."
        confirmLabel="Delete Photo"
        item={itemToDelete}
      />

      {/* Confirm Delete Bulk Selected Media Items Modal */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => !bulkDeleteMutation.isPending && setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
        title={`Delete ${selectedIds.length} Photos`}
        description={`Are you sure you want to delete ${selectedIds.length} selected photos? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Photos`}
        items={selectedMediaItems}
        itemCount={selectedIds.length}
      />

      {/* Confirm Delete / Archive Whole Gallery Modal */}
      <DeleteGalleryModal
        isOpen={isDeleteGalleryOpen}
        onClose={() =>
          !deleteGalleryMutation.isPending &&
          !archiveGalleryMutation.isPending &&
          setIsDeleteGalleryOpen(false)
        }
        onConfirm={handleConfirmDeleteGallery}
        gallery={gallery}
        mode={gallery.status === 'archived' ? 'permanent' : 'archive'}
        isProcessing={deleteGalleryMutation.isPending || archiveGalleryMutation.isPending}
      />

      {/* Confirm Delete Section Modal */}
      <ConfirmDeleteModal
        isOpen={sectionToDelete !== null}
        onClose={() => !deleteSectionMutation.isPending && setSectionToDelete(null)}
        onConfirm={handleConfirmDeleteSection}
        isDeleting={deleteSectionMutation.isPending}
        title={`Delete Section "${sectionToDelete || ''}"`}
        description={`Are you sure you want to delete section "${sectionToDelete || ''}"? Media items will safely be moved to General (Unassigned).`}
        confirmLabel="Delete Section"
        itemCount={
          sectionToDelete && gallery
            ? gallery.media.filter(
              (m) => (m.sectionTitle || '').toUpperCase() === sectionToDelete.toUpperCase()
            ).length
            : 0
        }
      />

      {/* Move Photos to Section Modal */}
      <MoveToSectionModal
        isOpen={isMoveSectionOpen}
        onClose={() => {
          setIsMoveSectionOpen(false);
          setSingleItemToMove(null);
        }}
        gallery={gallery}
        mediaItems={itemsToMove}
        onSuccess={(targetSection) => {
          if (!singleItemToMove) {
            setSelectedIds([]);
          }
          if (
            dashboardSectionFilter !== 'all' &&
            targetSection !== 'UNASSIGNED' &&
            dashboardSectionFilter.toUpperCase() !== targetSection.toUpperCase()
          ) {
            setDashboardSectionFilter(targetSection);
          }
        }}
      />
    </div>
  );
};
