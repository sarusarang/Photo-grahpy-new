import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { useBulkUploadGalleryMedia, useAddGallerySection, useGalleryDetail } from '@/hooks/useAtelierQueries';
import { normalizeServerMediaItem, normalizeServerGallery } from '@/utils/galleryNormalizer';
import { SetGalleryCoverImageApi, SetGalleryTemplateBannerApi } from '@/service/galleries/GalleryApi';
import { PlanUpgradeModal } from '../billing/PlanUpgradeModal';
import {
  X,
  UploadCloud,
  Film,
  FileImage,
  Loader2,
  FolderPlus,
  Plus,
  Trash2,
  Check,
  Sparkles,
  HardDrive,
  AlertTriangle,
  ZapOff,
  Minus,
  Maximize2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  galleryId: string;
  galleryTitle?: string;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
  onUploadStart?: (controller: AbortController, count: number) => void;
  onUploadProgress?: (percent: number, statusText: string) => void;
  onUploadComplete?: () => void;
}

interface QueuedFile {
  id: string;
  file?: File;
  previewUrl: string;
  title: string;
  sizeBytes: number;
  sizeMB: number;
  aspectRatio: number;
  type: 'photo' | 'video';
  duration?: string;
}

const DEFAULT_SECTION_SUGGESTIONS = [
  'Highlights',
  'Ceremony',
  'Reception',
  'Portraits',
  'Getting Ready',
  'Family',
  'Party',
];

export const UploadMediaModal: React.FC<UploadMediaModalProps> = ({
  isOpen,
  onClose,
  onOpen,
  galleryId,
  galleryTitle,
  isMinimized: controlledMinimized,
  onMinimize,
  onExpand,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
}) => {
  const navigate = useNavigate();
  const { getGalleryByIdOrSlug, addMediaToGallery, addSectionToGallery } = useGallery();
  const { showToast } = useToast();
  const planQuota = usePlanQuota();
  const { data: serverGallery } = useGalleryDetail(galleryId);
  const gallery = useMemo(() => {
    if (serverGallery && (serverGallery as any).id) {
      return normalizeServerGallery(serverGallery);
    }
    return getGalleryByIdOrSlug(galleryId);
  }, [serverGallery, galleryId, getGalleryByIdOrSlug]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');

  // Section State: combine server sections, media titles, and freshly added sections
  const [extraLocalSections, setExtraLocalSections] = useState<string[]>([]);
  const existingSections = useMemo(() => {
    const list = new Set<string>();
    (gallery?.sections || []).forEach((s) => {
      if (s && s.trim()) list.add(s.trim().toUpperCase());
    });
    (gallery?.media || []).forEach((m) => {
      if (m.sectionTitle && m.sectionTitle.trim()) {
        list.add(m.sectionTitle.trim().toUpperCase());
      }
    });
    extraLocalSections.forEach((s) => {
      if (s && s.trim()) list.add(s.trim().toUpperCase());
    });
    return Array.from(list);
  }, [gallery?.sections, gallery?.media, extraLocalSections]);

  const [selectedSection, setSelectedSection] = useState<string>(() => existingSections[0] || 'HIGHLIGHTS');

  // Keep selectedSection valid if existingSections changes
  useEffect(() => {
    if (!selectedSection && existingSections.length > 0) {
      setSelectedSection(existingSections[0]);
    }
  }, [existingSections, selectedSection]);

  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState('');

  // Queued Files for Photos & Videos
  const [queuedPhotos, setQueuedPhotos] = useState<QueuedFile[]>([]);
  const [queuedVideos, setQueuedVideos] = useState<QueuedFile[]>([]);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);

  // Upload State, Cancellation & Errors
  const [isUploading, setIsUploading] = useState(false);
  const [internalMinimized, setInternalMinimized] = useState(false);
  const isMinimized = controlledMinimized !== undefined ? controlledMinimized : internalMinimized;

  const setMinimizedState = useCallback((val: boolean) => {
    setInternalMinimized(val);
    if (val) {
      onMinimize?.();
    } else {
      onExpand?.();
      onOpen?.();
    }
  }, [onMinimize, onExpand, onOpen]);

  const [isWidgetDismissed, setIsWidgetDismissed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<{ code: string; message: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInternalMinimized(false);
      setIsWidgetDismissed(false);
    }
  }, [isOpen]);

  const { mutateAsync: bulkUploadMutation } = useBulkUploadGalleryMedia(galleryId);
  const addSectionMutation = useAddGallerySection();

  // ── 1. Storage Quota Calculations (Live Backend API) ───────────
  const {
    storageUsedGB,
    storageLimitGB,
    storageUsedPercent,
    isUnlimited,
    availableStorageBytes,
    availableStorageDisplay,
  } = useMemo(() => {
    const usedBytes = planQuota.storageUsedBytes || (planQuota.storageUsedGB * 1024 * 1024 * 1024);
    const limitBytes = planQuota.storageLimitBytes || (planQuota.storageLimitGB * 1024 * 1024 * 1024);
    const unlimited = planQuota.storageLimitGB === 0 && planQuota.storageLimitBytes === 0;
    const available = unlimited ? Infinity : Math.max(0, limitBytes - usedBytes);
    const availableMB = (available / (1024 * 1024)).toFixed(1);
    const availableGB = (available / (1024 * 1024 * 1024)).toFixed(2);
    const display = available > 1024 * 1024 * 1024 ? `${availableGB} GB` : `${availableMB} MB`;

    return {
      storageUsedGB: planQuota.storageUsedGB,
      storageLimitGB: planQuota.storageLimitGB,
      storageUsedPercent: planQuota.storageUsedPercent,
      isUnlimited: unlimited,
      availableStorageBytes: available,
      availableStorageDisplay: display,
    };
  }, [planQuota]);

  // Current batch sizes
  const currentQueuedList = activeTab === 'photos' ? queuedPhotos : queuedVideos;
  const currentBatchBytes = useMemo(
    () => currentQueuedList.reduce((sum, item) => sum + (item.file?.size || item.sizeBytes || item.sizeMB * 1024 * 1024), 0),
    [currentQueuedList]
  );
  const currentBatchMB = Number((currentBatchBytes / (1024 * 1024)).toFixed(1));
  const currentBatchGB = Number((currentBatchBytes / (1024 * 1024 * 1024)).toFixed(2));
  const currentBatchDisplay = currentBatchBytes > 1024 * 1024 * 1024 ? `${currentBatchGB} GB` : `${currentBatchMB} MB`;

  // Status flags
  const isStorageFull = !isUnlimited && availableStorageBytes <= 0;
  const wouldExceedLimit = !isUnlimited && !isStorageFull && currentBatchBytes > availableStorageBytes;

  // ── 3. Cancel Active Upload Handler ───────────────────────────
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadStatusText('');
    onUploadComplete?.();
    showToast('Upload Cancelled', 'File upload was stopped.', 'info');
  };

  const handleAddNewSection = async (e?: React.FormEvent, customTitle?: string) => {
    if (e) e.preventDefault();
    if (addSectionMutation.isPending) return;
    const raw = customTitle || newSectionInput;
    const trimmed = raw.trim().toUpperCase();
    if (!trimmed) return;

    setExtraLocalSections((prev) => Array.from(new Set([...prev, trimmed])));
    setSelectedSection(trimmed);
    addSectionToGallery(galleryId, trimmed);
    setNewSectionInput('');
    setIsCreatingNewSection(false);

    try {
      await addSectionMutation.mutateAsync({ galleryId, title: trimmed });
      showToast('Section Created', `Added "${trimmed}" as an upload section.`, 'success');
    } catch {
      showToast('Section Created', `Added "${trimmed}" as an upload section.`, 'success');
    }
  };

  // ── 4. Photo Files Handler ─────────────────────────────────────
  const handlePhotoFiles = (files: FileList | null) => {
    if (isUploading) return;
    setUploadError(null);
    if (!files || files.length === 0) return;

    // Check if storage is already exhausted
    if (isStorageFull) {
      showToast('Storage Quota Full', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload photos.`, 'error');
      setQuotaError({
        code: 'STORAGE_LIMIT_EXCEEDED',
        message: `Your storage limit of ${storageLimitGB} GB is completely used. Upgrade your plan to continue.`,
      });
      return;
    }

    const newQueued: QueuedFile[] = [];

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const previewUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();

      newQueued.push({
        id: `photo-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        title: cleanTitle || `Photo ${index + 1}`,
        sizeBytes: file.size,
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(2)) || 2.5,
        aspectRatio: 1.5,
        type: 'photo',
      });
    });

    if (newQueued.length === 0) {
      showToast('Invalid Files', 'Please select valid image files (JPG, PNG, WebP, TIFF).', 'warning');
      return;
    }

    // Storage notification
    if (isStorageFull) {
      showToast('Storage Limit Reached', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload photos.`, 'error');
    } else {
      showToast('Photos Queued', `Added ${newQueued.length} photos ready for "${selectedSection}".`, 'info');
    }

    setQueuedPhotos((prev) => [...prev, ...newQueued]);
  };

  // ── 5. Video Files Handler (Exact Same Drag & Drop as Photos) ───
  const handleVideoFiles = (files: FileList | null) => {
    if (isUploading) return;
    setUploadError(null);
    if (!files || files.length === 0) return;

    // Check if storage is already exhausted
    if (isStorageFull) {
      showToast('Storage Quota Full', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload videos.`, 'error');
      setQuotaError({
        code: 'STORAGE_LIMIT_EXCEEDED',
        message: `Your storage limit of ${storageLimitGB} GB is completely used. Upgrade your plan to continue.`,
      });
      return;
    }

    const newQueued: QueuedFile[] = [];

    Array.from(files).forEach((file, index) => {
      const isVideo = file.type.startsWith('video/') ||
        /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(file.name);
      if (!isVideo) return;
      const previewUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();

      newQueued.push({
        id: `video-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        title: cleanTitle || `Video ${index + 1}`,
        sizeBytes: file.size,
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(1)) || 15.0,
        aspectRatio: 1.77,
        type: 'video',
      });
    });

    if (newQueued.length === 0) {
      showToast('Invalid Files', 'Please select valid video files (MP4, MOV, WebM, MKV).', 'warning');
      return;
    }

    // Storage notification
    if (isStorageFull) {
      showToast('Storage Limit Reached', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload videos.`, 'error');
    } else {
      showToast('Videos Queued', `Added ${newQueued.length} video(s) ready for "${selectedSection}".`, 'info');
    }

    setQueuedVideos((prev) => [...prev, ...newQueued]);
  };

  // ── 6. Queue Removals ──────────────────────────────────────────
  const removeQueuedPhoto = (id: string) => {
    setQueuedPhotos((prev) => {
      const t = prev.find((f) => f.id === id);
      if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const removeQueuedVideo = (id: string) => {
    setQueuedVideos((prev) => {
      const t = prev.find((f) => f.id === id);
      if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAllPhotos = () => {
    queuedPhotos.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setQueuedPhotos([]);
  };

  const clearAllVideos = () => {
    queuedVideos.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setQueuedVideos([]);
  };

  // ── 7. Execute Photo Batch Upload ──────────────────────────────
  const handlePhotoBatchUpload = async () => {
    if (isUploading || queuedPhotos.length === 0) return;

    if (isStorageFull) {
      showToast('Storage Limit Exceeded', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload photos.`, 'error');
      setQuotaError({
        code: 'STORAGE_LIMIT_EXCEEDED',
        message: `Your storage limit of ${storageLimitGB} GB is completely used. Upgrade your plan to continue.`,
      });
      return;
    }

    const nativeFiles = queuedPhotos.map((q) => q.file).filter((f): f is File => Boolean(f));
    if (nativeFiles.length === 0) {
      showToast('No Files', 'No valid image files available to upload.', 'warning');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);
    const startTxt = `Preparing ${nativeFiles.length} photo(s)...`;
    setUploadStatusText(startTxt);
    onUploadStart?.(controller, nativeFiles.length);
    onUploadProgress?.(10, startTxt);

    try {
      setUploadProgress(15);
      const uploadTxt = `Uploading ${nativeFiles.length} photo(s) to "${selectedSection}"...`;
      setUploadStatusText(uploadTxt);
      onUploadProgress?.(15, uploadTxt);

      const res = await bulkUploadMutation({
        files: nativeFiles,
        sectionTitle: selectedSection,
        type: 'photo',
        signal: controller.signal,
        onProgress: (percent, statusText) => {
          const p = Math.min(98, Math.max(5, percent));
          const text = statusText || `Uploading photos: ${percent}%...`;
          setUploadProgress(p);
          setUploadStatusText(text);
          onUploadProgress?.(p, text);
        },
      });

      setUploadProgress(95);
      setUploadStatusText('Processing gallery thumbnails & CDN cache...');
      onUploadProgress?.(95, 'Processing gallery thumbnails & CDN cache...');

      if (res?.media && res.media.length > 0) {
        const mappedItems = res.media.map((m) => normalizeServerMediaItem(m, galleryId));
        addMediaToGallery(galleryId, mappedItems);

        const firstPhoto = mappedItems.find((m) => m.type !== 'video') || mappedItems[0];
        if (firstPhoto?.url) {
          const currentTpl = gallery?.templateId || 'editorial';
          try {
            await Promise.allSettled([
              SetGalleryCoverImageApi(galleryId, firstPhoto.url, firstPhoto.id),
              SetGalleryTemplateBannerApi(galleryId, currentTpl, firstPhoto.url, firstPhoto.id),
            ]);
          } catch {
            // safe fallback
          }
        }
      }

      setUploadProgress(100);
      onUploadProgress?.(100, 'Upload Complete');
      showToast('Upload Successful', `Saved ${res?.total_uploaded || nativeFiles.length} photo(s) to "${selectedSection}".`, 'success');
      clearAllPhotos();
      setMinimizedState(false);
      setIsWidgetDismissed(false);
      onUploadComplete?.();
      onClose();
    } catch (err: any) {
      onUploadComplete?.();
      if (err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        if (err?.uploadedMedia && err.uploadedMedia.length > 0) {
          const mappedItems = err.uploadedMedia.map((m: any) => normalizeServerMediaItem(m, galleryId));
          addMediaToGallery(galleryId, mappedItems);
          showToast('Partial Upload Saved', `Saved ${mappedItems.length} photo(s) before cancellation.`, 'info');
        }
        return;
      }

      if (err?.uploadedMedia && err.uploadedMedia.length > 0) {
        const mappedItems = err.uploadedMedia.map((m: any) => normalizeServerMediaItem(m, galleryId));
        addMediaToGallery(galleryId, mappedItems);
        showToast('Partial Upload Saved', `Saved ${mappedItems.length} photos before stopping.`, 'warning');
      }

      const errorData = err?.response?.data;
      if (
        errorData?.upgrade_required ||
        errorData?.error_code === 'STORAGE_LIMIT_EXCEEDED' ||
        err?.response?.status === 403 ||
        err?.response?.status === 413
      ) {
        const errorMsg =
          errorData?.detail ||
          errorData?.message ||
          'Studio cloud storage limit reached. Please upgrade to continue uploading.';
        showToast('Storage Limit Exceeded', errorMsg, 'error');
        setQuotaError({
          code: errorData?.error_code || errorData?.code || 'STORAGE_LIMIT_EXCEEDED',
          message: errorMsg,
        });
        setUploadError(errorMsg);
        return;
      }

      const failureMsg =
        errorData?.detail ||
        errorData?.message ||
        err?.message ||
        'Failed to upload photos to server. Please try again.';
      showToast('Upload Failed', failureMsg, 'error');
      setUploadError(failureMsg);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  // ── 8. Execute Video Batch Upload (Batch Multi-Video API) ───────
  const handleVideoBatchUpload = async () => {
    if (isUploading || queuedVideos.length === 0) return;

    if (isStorageFull) {
      showToast('Storage Limit Exceeded', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload videos.`, 'error');
      setQuotaError({
        code: 'STORAGE_LIMIT_EXCEEDED',
        message: `Your storage limit of ${storageLimitGB} GB is completely used. Upgrade your plan to continue.`,
      });
      return;
    }

    const nativeVideos = queuedVideos.map((q) => q.file).filter((f): f is File => Boolean(f));
    if (nativeVideos.length === 0) {
      showToast('No Files', 'No valid video files available to upload.', 'warning');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);
    const startTxt = `Preparing ${nativeVideos.length} video(s)...`;
    setUploadStatusText(startTxt);
    onUploadStart?.(controller, nativeVideos.length);
    onUploadProgress?.(10, startTxt);

    try {
      setUploadProgress(15);
      const uploadTxt = `Uploading ${nativeVideos.length} video(s) to "${selectedSection}"...`;
      setUploadStatusText(uploadTxt);
      onUploadProgress?.(15, uploadTxt);

      const res = await bulkUploadMutation({
        files: nativeVideos,
        sectionTitle: selectedSection,
        type: 'video',
        signal: controller.signal,
        onProgress: (percent, statusText) => {
          const p = Math.min(98, Math.max(5, percent));
          const text = statusText || `Uploading videos: ${percent}%...`;
          setUploadProgress(p);
          setUploadStatusText(text);
          onUploadProgress?.(p, text);
        },
      });

      setUploadProgress(95);
      setUploadStatusText('Processing video transcodes & thumbnails...');
      onUploadProgress?.(95, 'Processing video transcodes & thumbnails...');

      if (res?.media && res.media.length > 0) {
        const mappedItems = res.media.map((m) => normalizeServerMediaItem(m, galleryId));
        addMediaToGallery(galleryId, mappedItems);

        const firstMedia = mappedItems[0];
        if (firstMedia?.url && (!gallery?.coverImage || gallery.media.length === 0)) {
          const currentTpl = gallery?.templateId || 'editorial';
          try {
            await Promise.allSettled([
              SetGalleryCoverImageApi(galleryId, firstMedia.url, firstMedia.id),
              SetGalleryTemplateBannerApi(galleryId, currentTpl, firstMedia.url, firstMedia.id),
            ]);
          } catch {
            // safe fallback
          }
        }
      }

      setUploadProgress(100);
      onUploadProgress?.(100, 'Upload Complete');
      showToast('Videos Uploaded', `Successfully saved ${res?.total_uploaded || nativeVideos.length} video(s) to "${selectedSection}".`, 'success');
      clearAllVideos();
      setMinimizedState(false);
      setIsWidgetDismissed(false);
      onUploadComplete?.();
      onClose();
    } catch (err: any) {
      onUploadComplete?.();
      if (err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        if (err?.uploadedMedia && err.uploadedMedia.length > 0) {
          const mappedItems = err.uploadedMedia.map((m: any) => normalizeServerMediaItem(m, galleryId));
          addMediaToGallery(galleryId, mappedItems);
          showToast('Partial Upload Saved', `Saved ${mappedItems.length} video(s) before cancellation.`, 'info');
        }
        return;
      }

      if (err?.uploadedMedia && err.uploadedMedia.length > 0) {
        const mappedItems = err.uploadedMedia.map((m: any) => normalizeServerMediaItem(m, galleryId));
        addMediaToGallery(galleryId, mappedItems);
        showToast('Partial Upload Saved', `Saved ${mappedItems.length} video(s) before stopping.`, 'warning');
      }

      const errorData = err?.response?.data;
      if (
        errorData?.upgrade_required ||
        errorData?.error_code === 'STORAGE_LIMIT_EXCEEDED' ||
        err?.response?.status === 403 ||
        err?.response?.status === 413
      ) {
        const msg =
          errorData?.detail ||
          errorData?.message ||
          'Studio cloud storage limit reached. Please upgrade to continue.';
        showToast('Storage Limit Exceeded', msg, 'error');
        setQuotaError({
          code: errorData?.error_code || errorData?.code || 'STORAGE_LIMIT_EXCEEDED',
          message: msg,
        });
        setUploadError(msg);
      } else {
        const failureMsg =
          errorData?.detail ||
          errorData?.message ||
          err?.message ||
          'Failed to upload video(s) to server. Please try again.';
        showToast('Upload Failed', failureMsg, 'error');
        setUploadError(failureMsg);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  if (!isOpen && !isUploading) return null;

  // ── Render Minimized Floating Widget in Bottom Corner ──
  if (!isWidgetDismissed && (isMinimized || (!isOpen && isUploading))) {
    const displayGalleryTitle = gallery?.title || galleryTitle || 'Gallery';
    return createPortal(
      <aside
        aria-label="Upload Progress Manager"
        className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-[#121319]/95 border border-neutral-200 dark:border-neutral-800 shadow-2xl backdrop-blur-xl p-4 space-y-3 text-neutral-900 dark:text-white animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto ring-1 ring-black/5 dark:ring-white/10"
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {isUploading
                  ? `Uploading ${currentQueuedList.length} Item${currentQueuedList.length > 1 ? 's' : ''} • ${displayGalleryTitle}`
                  : `Upload Complete • ${displayGalleryTitle}`}
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                {uploadStatusText || (isUploading ? `Target: ${selectedSection}` : 'All files processed')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigate(`/dashboard/gallery/${galleryId}`);
              }}
              className="p-1.5 text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title={`View ${displayGalleryTitle}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMinimizedState(false);
                setIsWidgetDismissed(false);
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Expand upload window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWidgetDismissed(true);
                setMinimizedState(false);
                onClose();
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Close widget"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        {isUploading && (
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              <span className="truncate pr-2">{uploadStatusText || 'Transferring files...'}</span>
              <span className="font-bold text-amber-500 font-mono shrink-0">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </aside>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overlay-animate">
      <div className="relative w-full sm:max-w-4xl lg:max-w-5xl bg-white dark:bg-neutral-950 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col sheet-animate sm:modal-animate text-neutral-900 dark:text-neutral-100">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3 sm:hidden shrink-0" />

        {/* Modal Header (Pinned at top) */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 sm:py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-serif text-neutral-900 dark:text-white tracking-tight font-bold">
                  Upload Media to Gallery
                </h2>
                {(gallery?.title || galleryTitle) && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 truncate max-w-[320px]">
                    {gallery?.title || galleryTitle}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Organize photos &amp; 4K videos by section for client delivery
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimizedState(true)}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Minimize upload window"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (isUploading) {
                  setMinimizedState(true);
                }
                onClose();
              }}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={isUploading ? 'Minimize and continue in background' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 sm:py-5 space-y-4 overscroll-contain custom-scrollbar">
          {/* ── Dynamic Storage Quota Bar & Status (Live Backend Data) ── */}
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800/90">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <HardDrive className={`w-3.5 h-3.5 ${isStorageFull ? 'text-rose-500' : 'text-neutral-400'}`} />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">
                Studio Cloud Storage Quota
              </span>
            </div>
            <div className="text-[11px] font-mono">
              <span className="text-neutral-900 dark:text-white font-bold">{storageUsedGB} GB</span>
              <span className="text-neutral-400"> / {isUnlimited ? 'Unlimited' : `${storageLimitGB} GB`}</span>
              {!isUnlimited && (
                <span className={`ml-2 font-bold ${isStorageFull ? 'text-rose-500' : storageUsedPercent >= 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  ({storageUsedPercent}%)
                </span>
              )}
            </div>
          </div>

          {!isUnlimited && (
            <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isStorageFull ? 'bg-rose-500' : storageUsedPercent >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, storageUsedPercent)}%` }}
              />
            </div>
          )}

          {/* Warning Banner if Full or Batch Exceeds Quota */}
          {isStorageFull ? (
            <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
              <div className="flex items-center gap-2">
                <ZapOff className="w-4 h-4 shrink-0" />
                <span className="font-medium text-[11px]">
                  Storage limit reached ({storageUsedGB}/{storageLimitGB} GB). Uploads restricted.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuotaError({
                  code: 'STORAGE_LIMIT_EXCEEDED',
                  message: `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade your plan to increase capacity.`,
                })}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          ) : wouldExceedLimit ? (
            <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="font-medium text-[11px]">
                  Batch size ({currentBatchDisplay}) exceeds estimated available {availableStorageDisplay}. Upload will proceed in automatic chunks.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuotaError({
                  code: 'STORAGE_LIMIT_EXCEEDED',
                  message: `Selected media (${currentBatchDisplay}) exceeds available ${availableStorageDisplay}. Upgrade your plan to increase capacity.`,
                })}
                className="shrink-0 px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          ) : null}
        </div>

        {/* ── Error UI State Banner ── */}
        {uploadError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-700 dark:text-rose-400 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">Upload Issue</p>
                <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90 mt-0.5">{uploadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Section Selector & Creator ── */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Target Section:
              </span>
            </div>

            {!isCreatingNewSection && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsCreatingNewSection(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> New Section Title
              </button>
            )}
          </div>

          {/* Section Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {existingSections.map((sec) => (
              <button
                key={sec}
                type="button"
                disabled={isUploading}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedSection === sec
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-md ring-2 ring-amber-400/40'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-amber-400/50'
                }`}
              >
                {selectedSection === sec && <Check className="w-3 h-3 inline mr-1 stroke-[2.5]" />}
                {sec}
              </button>
            ))}
          </div>

          {/* Inline Create New Section Input */}
          {isCreatingNewSection && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
                Create a distinct category title for client gallery tabs:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Ceremony, Reception, Portraits..."
                  value={newSectionInput}
                  disabled={isUploading}
                  onChange={(e) => setNewSectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewSection();
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleAddNewSection()}
                  disabled={isUploading || addSectionMutation.isPending || !newSectionInput.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {addSectionMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>Create &amp; Select</span>
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setIsCreatingNewSection(false);
                    setNewSectionInput('');
                  }}
                  className="px-3 py-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-400 uppercase font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
                </span>
                {DEFAULT_SECTION_SUGGESTIONS.filter(
                  (sug) => !existingSections.some((ex) => ex.toUpperCase() === sug.toUpperCase())
                ).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleAddNewSection(undefined, sug)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-amber-400 dark:hover:bg-amber-400 hover:text-neutral-950 dark:hover:text-neutral-950 hover:font-bold disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title={`Create & select "${sug.toUpperCase()}"`}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Loading State Progress Bar & Cancel Button ── */}
        {isUploading && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-semibold">
              <span className="flex items-center gap-2 truncate">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                <span className="truncate">{uploadStatusText || `Uploading media to "${selectedSection}"...`}</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs font-bold">{uploadProgress}%</span>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-2.5 py-1 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Cancel active upload"
                >
                  <X className="w-3.5 h-3.5" /> Cancel Upload
                </button>
              </div>
            </div>
            <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              <span>Automatic batch processing active</span>
              <span>All original metadata preserved</span>
            </div>
          </div>
        )}

        {/* ── Tabs: Photos vs Videos ── */}
        <div className="mt-5 flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            disabled={isUploading}
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'photos'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <FileImage className="w-4 h-4" /> Batch Photos
            {queuedPhotos.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold">
                {queuedPhotos.length}
              </span>
            )}
          </button>
          <button
            disabled={isUploading}
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'video'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Film className="w-4 h-4" /> Video Highlight Reels
            {queuedVideos.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold">
                {queuedVideos.length}
              </span>
            )}
          </button>
        </div>

        {/* ── PHOTOS TAB CONTENT ── */}
        {activeTab === 'photos' && (
          <div className="mt-5 space-y-5">
            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoFiles(e.target.files)}
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isStorageFull && !isUploading) setIsDraggingPhotos(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingPhotos(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPhotos(false);
                if (!isStorageFull && !isUploading) handlePhotoFiles(e.dataTransfer.files);
              }}
              onClick={() => {
                if (isUploading) return;
                if (isStorageFull) {
                  showToast('Storage Quota Full', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload photos.`, 'error');
                  setQuotaError({
                    code: 'STORAGE_LIMIT_EXCEEDED',
                    message: `Storage quota full (${storageLimitGB} GB). Upgrade your plan to upload photos.`,
                  });
                } else {
                  photoInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-3xl ${
                queuedPhotos.length > 0 ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
              } text-center transition-all group ${
                isStorageFull || isUploading
                  ? 'border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 cursor-not-allowed opacity-75'
                  : isDraggingPhotos
                  ? 'border-amber-500 bg-amber-500/10 scale-[1.01] cursor-pointer'
                  : 'border-neutral-300 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-400/60 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer'
              }`}
            >
              <div className={`${queuedPhotos.length > 0 ? 'w-10 h-10 mb-2' : 'w-14 h-14 mb-3'} rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                <UploadCloud className={queuedPhotos.length > 0 ? 'w-5 h-5' : 'w-7 h-7'} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {isStorageFull
                  ? 'Storage Limit Reached — Uploads Restricted'
                  : isUploading
                  ? 'Upload in Progress...'
                  : queuedPhotos.length > 0
                  ? 'Drop more photos here or click to browse'
                  : 'Drag multiple photos here or click to browse'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {isStorageFull
                  ? `You have reached your ${storageLimitGB} GB storage quota. Please upgrade.`
                  : isUploading
                  ? 'Please wait while current files are securely transferred'
                  : 'Supports JPG, PNG, TIFF, or RAW files'}
              </p>
              {!isStorageFull && !isUploading && (
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-bold shadow-md hover:bg-amber-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> {queuedPhotos.length > 0 ? 'Add More Photos' : 'Choose Photos from Computer'}
                </div>
              )}
            </div>

            {/* Queued Photos Preview */}
            {queuedPhotos.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {queuedPhotos.length} photo{queuedPhotos.length > 1 ? 's' : ''} queued ({currentBatchDisplay})
                  </span>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={clearAllPhotos}
                    className="text-neutral-400 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* Thumbnail Grid (renders up to 48 items to maintain silky performance for 100+ files) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {queuedPhotos.slice(0, 48).map((q) => (
                    <div
                      key={q.id}
                      className="group relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 aspect-square shadow-sm"
                    >
                      <img
                        src={q.previewUrl}
                        alt={q.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQueuedPhoto(q.id);
                          }}
                          className="self-end p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-white/90 truncate font-mono bg-black/60 px-1 rounded">
                          {q.sizeMB} MB
                        </span>
                      </div>
                    </div>
                  ))}
                  {queuedPhotos.length > 48 && (
                    <div className="rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-400/10 flex flex-col items-center justify-center p-3 text-center aspect-square">
                      <span className="text-base font-bold text-amber-500 font-mono">
                        +{queuedPhotos.length - 48}
                      </span>
                      <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-medium leading-tight mt-0.5">
                        more queued
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIDEO TAB CONTENT (IDENTICAL FILE PICKER UI AS PHOTOS, NO EMBED SECTION) ── */}
        {activeTab === 'video' && (
          <div className="mt-5 space-y-5">
            <input
              ref={videoInputRef}
              type="file"
              multiple
              accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v,.3gp"
              className="hidden"
              onChange={(e) => handleVideoFiles(e.target.files)}
            />

            {/* Video Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isStorageFull && !isUploading) setIsDraggingVideos(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingVideos(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingVideos(false);
                if (!isStorageFull && !isUploading) handleVideoFiles(e.dataTransfer.files);
              }}
              onClick={() => {
                if (isUploading) return;
                if (isStorageFull) {
                  showToast('Storage Quota Full', `Your studio storage limit (${storageLimitGB} GB) is full. Upgrade to upload videos.`, 'error');
                  setQuotaError({
                    code: 'STORAGE_LIMIT_EXCEEDED',
                    message: `Storage quota full (${storageLimitGB} GB). Upgrade your plan to upload videos.`,
                  });
                } else {
                  videoInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-3xl ${
                queuedVideos.length > 0 ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
              } text-center transition-all group ${
                isStorageFull || isUploading
                  ? 'border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 cursor-not-allowed opacity-75'
                  : isDraggingVideos
                  ? 'border-amber-500 bg-amber-500/10 scale-[1.01] cursor-pointer'
                  : 'border-neutral-300 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-400/60 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer'
              }`}
            >
              <div className={`${queuedVideos.length > 0 ? 'w-10 h-10 mb-2' : 'w-14 h-14 mb-3'} rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                <Film className={queuedVideos.length > 0 ? 'w-5 h-5' : 'w-7 h-7'} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {isStorageFull
                  ? 'Storage Limit Reached — Uploads Restricted'
                  : isUploading
                  ? 'Upload in Progress...'
                  : queuedVideos.length > 0
                  ? 'Drop more videos here or click to browse'
                  : 'Drag video files here or click to browse'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {isStorageFull
                  ? `You have reached your ${storageLimitGB} GB storage quota. Please upgrade.`
                  : isUploading
                  ? 'Please wait while current video reel is being uploaded'
                  : 'Supports MP4, MOV, WebM, MKV — up to 4K resolution'}
              </p>
              {!isStorageFull && !isUploading && (
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-bold shadow-md hover:bg-amber-300 transition-colors">
                  <Film className="w-3.5 h-3.5" /> {queuedVideos.length > 0 ? 'Add More Videos' : 'Choose Videos from Computer'}
                </div>
              )}
            </div>

            {/* Queued Videos Preview Grid */}
            {queuedVideos.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {queuedVideos.length} video{queuedVideos.length > 1 ? 's' : ''} queued ({currentBatchDisplay})
                  </span>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={clearAllVideos}
                    className="text-neutral-400 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* Video Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {queuedVideos.map((q) => (
                    <div
                      key={q.id}
                      className="group relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 aspect-video shadow-sm flex flex-col justify-between"
                    >
                      {/* Video element for instant visual preview */}
                      <video
                        src={q.previewUrl}
                        preload="metadata"
                        muted
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />

                      {/* Video Type Pill */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-amber-400">
                        <Film className="w-3 h-3" />
                        <span>VIDEO</span>
                      </div>

                      {/* Hover Overlay with Delete & Details */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQueuedVideo(q.id);
                          }}
                          className="self-end p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Remove video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <p className="text-[11px] font-semibold text-white truncate drop-shadow">
                            {q.title}
                          </p>
                          <span className="text-[10px] text-white/80 font-mono bg-black/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {q.sizeMB} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* ── Sticky Modal Action Footer: ALWAYS visible without scrolling ── */}
        <div className="shrink-0 px-5 sm:px-7 py-3.5 sm:py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur-md pb-safe flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-20">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs">
            {currentQueuedList.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono text-[11px] sm:text-xs">
                  {currentQueuedList.length} {activeTab === 'photos' ? 'photo' : 'video'}{currentQueuedList.length > 1 ? 's' : ''} queued ({currentBatchDisplay})
                </span>
                <span className="text-neutral-400">•</span>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={activeTab === 'photos' ? clearAllPhotos : clearAllVideos}
                  className="text-xs text-neutral-400 hover:text-rose-500 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer underline decoration-dotted"
                >
                  Clear All
                </button>
              </div>
            ) : (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                Target Section: <strong className="text-amber-600 dark:text-amber-400">{selectedSection}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (isUploading) {
                  setMinimizedState(true);
                }
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
              title={isUploading ? 'Minimize and continue in background' : 'Close window'}
            >
              {isUploading ? 'Minimize' : 'Close'}
            </button>

            <button
              type="button"
              onClick={activeTab === 'photos' ? handlePhotoBatchUpload : handleVideoBatchUpload}
              disabled={isUploading || isStorageFull || currentQueuedList.length === 0}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 ${
                isUploading
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-60 pointer-events-none'
                  : isStorageFull
                  ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
                  : currentQueuedList.length === 0
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-60'
                  : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-500/20 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading to &ldquo;{selectedSection}&rdquo;...
                </>
              ) : isStorageFull ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Storage Limit Exceeded
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                  Upload {currentQueuedList.length > 0 ? `${currentQueuedList.length} ${activeTab === 'photos' ? 'Photo' : 'Video'}${currentQueuedList.length > 1 ? 's' : ''}` : 'Media'} to &ldquo;{selectedSection}&rdquo;
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Plan Upgrade & Storage Enforcement Modal ── */}
      <PlanUpgradeModal
        isOpen={Boolean(quotaError)}
        onClose={() => setQuotaError(null)}
        errorCode={quotaError?.code || 'STORAGE_LIMIT_EXCEEDED'}
        errorMessage={quotaError?.message || 'Studio cloud storage limit reached. Please upgrade to a higher tier.'}
      />
    </div>,
    document.body
  );
};

