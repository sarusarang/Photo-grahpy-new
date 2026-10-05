import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useToast } from '../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { UploadMediaModal } from '../components/gallery/UploadMediaModal';
import {
  UploadReloadWarningModal,
  type ActiveUploadItem,
} from '../components/common/UploadReloadWarningModal';

export type { ActiveUploadItem as ActiveUploadTask };

export interface UploadContextType {
  // Existing Gallery Upload Properties
  isUploading: boolean;
  uploadingGalleryId: string | null;
  uploadingGalleryTitle: string | null;
  activeGalleryId: string | null;
  activeGalleryTitle: string | null;
  isUploadModalOpen: boolean;
  isMinimized: boolean;
  uploadProgress: number;
  uploadStatusText: string;
  queuedFilesCount: number;

  openUploadModal: (galleryId: string, galleryTitle?: string) => boolean;
  closeUploadModal: () => void;
  minimizeUploadModal: () => void;
  expandUploadModal: () => void;
  cancelActiveUpload: () => void;

  // Multi-Upload & Reload Guard Registry
  hasActiveUploads: boolean;
  activeUploadTasks: ActiveUploadItem[];
  registerUploadTask: (task: ActiveUploadItem) => void;
  unregisterUploadTask: (id: string) => void;
  triggerReloadWarning: () => void;
  closeReloadWarning: () => void;
  isReloadWarningOpen: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingGalleryId, setUploadingGalleryId] = useState<string | null>(null);
  const [uploadingGalleryTitle, setUploadingGalleryTitle] = useState<string | null>(null);

  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  const [activeGalleryTitle, setActiveGalleryTitle] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [queuedFilesCount, setQueuedFilesCount] = useState(0);

  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Multi-upload registry for tracking all uploads across galleries, events, and camera tethering
  const [registeredTasks, setRegisteredTasks] = useState<Map<string, ActiveUploadItem>>(new Map());
  const [isReloadWarningOpen, setIsReloadWarningOpen] = useState(false);

  const registerUploadTask = useCallback((task: ActiveUploadItem) => {
    setRegisteredTasks((prev) => {
      const next = new Map(prev);
      next.set(task.id, task);
      return next;
    });
  }, []);

  const unregisterUploadTask = useCallback((id: string) => {
    setRegisteredTasks((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Consolidate all active tasks
  const activeUploadTasks = useMemo<ActiveUploadItem[]>(() => {
    const tasks = Array.from(registeredTasks.values());
    if (isUploading) {
      const galleryTaskExists = tasks.some((t) => t.source === 'gallery');
      if (!galleryTaskExists) {
        tasks.unshift({
          id: `gallery-upload-${uploadingGalleryId || 'active'}`,
          source: 'gallery',
          title: uploadingGalleryTitle ? `Gallery: ${uploadingGalleryTitle}` : 'Gallery Media Upload',
          details: uploadStatusText || `${uploadProgress}% completed`,
          count: queuedFilesCount,
          progress: uploadProgress,
        });
      }
    }
    return tasks;
  }, [
    registeredTasks,
    isUploading,
    uploadingGalleryId,
    uploadingGalleryTitle,
    uploadStatusText,
    uploadProgress,
    queuedFilesCount,
  ]);

  const hasActiveUploads = activeUploadTasks.length > 0;

  // 1. Browser Native beforeunload prompt (protects browser reload button and tab close)
  useEffect(() => {
    if (!hasActiveUploads) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Upload in progress. Reloading or leaving will cancel active media ingestion.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasActiveUploads]);

  // 2. Intercept Keyboard Reload Shortcuts (F5, Ctrl+R, Cmd+R) with Custom Modal
  useEffect(() => {
    if (!hasActiveUploads) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isF5 = e.key === 'F5';
      const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R');

      if (isF5 || isCtrlR) {
        e.preventDefault();
        e.stopPropagation();
        setIsReloadWarningOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [hasActiveUploads]);

  const triggerReloadWarning = useCallback(() => {
    setIsReloadWarningOpen(true);
  }, []);

  const closeReloadWarning = useCallback(() => {
    setIsReloadWarningOpen(false);
  }, []);

  const handleConfirmReload = useCallback(() => {
    setIsReloadWarningOpen(false);
    window.location.reload();
  }, []);

  /**
   * Request to open upload modal for a specific gallery.
   * If another gallery is currently uploading, blocks the request and notifies the user.
   */
  const openUploadModal = useCallback(
    (galleryId: string, galleryTitle?: string): boolean => {
      if (isUploading && uploadingGalleryId && uploadingGalleryId !== galleryId) {
        showToast(
          'Upload in Progress',
          `Cannot upload to "${galleryTitle || 'this gallery'}" while an upload is active for "${uploadingGalleryTitle || 'another gallery'}". Please wait until it completes or cancel the current upload.`,
          'warning'
        );
        return false;
      }

      setActiveGalleryId(galleryId);
      if (galleryTitle) {
        setActiveGalleryTitle(galleryTitle);
      }
      setIsMinimized(false);
      setIsUploadModalOpen(true);
      return true;
    },
    [isUploading, uploadingGalleryId, uploadingGalleryTitle, showToast]
  );

  const syncGalleryCache = useCallback((gId?: string | null) => {
    try {
      if (gId) {
        queryClient.invalidateQueries({ queryKey: ['gallery', gId] });
      }
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.refetchQueries({ queryKey: ['gallery'], exact: false });
    } catch {
      // safe fallback
    }
  }, [queryClient]);

  const closeUploadModal = useCallback(() => {
    if (isUploading) {
      setIsMinimized(true);
      setIsUploadModalOpen(false);
    } else {
      const gId = activeGalleryId;
      setIsUploadModalOpen(false);
      setIsMinimized(false);
      setActiveGalleryId(null);
      setActiveGalleryTitle(null);
      syncGalleryCache(gId);
    }
  }, [isUploading, activeGalleryId, syncGalleryCache]);

  const minimizeUploadModal = useCallback(() => {
    setIsMinimized(true);
    setIsUploadModalOpen(false);
  }, []);

  const expandUploadModal = useCallback(() => {
    setIsMinimized(false);
    setIsUploadModalOpen(true);
  }, []);

  const cancelActiveUpload = useCallback(() => {
    const targetGId = uploadingGalleryId || activeGalleryId;
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadingGalleryId(null);
    setUploadingGalleryTitle(null);
    setUploadProgress(0);
    setUploadStatusText('');
    setIsMinimized(false);
    setIsUploadModalOpen(false);
    setActiveGalleryId(null);
    setActiveGalleryTitle(null);
    syncGalleryCache(targetGId);
    showToast('Upload Cancelled', 'File upload was stopped.', 'info');
  }, [uploadingGalleryId, activeGalleryId, syncGalleryCache, showToast]);

  const handleUploadStart = useCallback((controller: AbortController, count: number) => {
    activeAbortControllerRef.current = controller;
    setIsUploading(true);
    setUploadingGalleryId(activeGalleryId);
    setUploadingGalleryTitle(activeGalleryTitle);
    setQueuedFilesCount(count);
  }, [activeGalleryId, activeGalleryTitle]);

  const handleUploadProgress = useCallback((percent: number, statusText: string) => {
    setUploadProgress(percent);
    setUploadStatusText(statusText);
  }, []);

  const handleUploadComplete = useCallback(() => {
    const targetGId = uploadingGalleryId || activeGalleryId;
    activeAbortControllerRef.current = null;
    setIsUploading(false);
    setUploadingGalleryId(null);
    setUploadingGalleryTitle(null);
    setUploadProgress(0);
    setUploadStatusText('');
    setIsMinimized(false);
    setIsUploadModalOpen(false);
    setActiveGalleryId(null);
    setActiveGalleryTitle(null);
    syncGalleryCache(targetGId);
  }, [uploadingGalleryId, activeGalleryId, syncGalleryCache]);

  return (
    <UploadContext.Provider
      value={{
        isUploading,
        uploadingGalleryId,
        uploadingGalleryTitle,
        activeGalleryId,
        activeGalleryTitle,
        isUploadModalOpen,
        isMinimized,
        uploadProgress,
        uploadStatusText,
        queuedFilesCount,
        openUploadModal,
        closeUploadModal,
        minimizeUploadModal,
        expandUploadModal,
        cancelActiveUpload,
        // Multi-upload guard API
        hasActiveUploads,
        activeUploadTasks,
        registerUploadTask,
        unregisterUploadTask,
        triggerReloadWarning,
        closeReloadWarning,
        isReloadWarningOpen,
      }}
    >
      {children}

      {/* Singleton Global Upload Modal: Persists across ALL routes and pages */}
      {activeGalleryId && (
        <UploadMediaModal
          key={activeGalleryId}
          galleryId={activeGalleryId}
          galleryTitle={activeGalleryTitle || undefined}
          isOpen={isUploadModalOpen}
          isMinimized={isMinimized}
          onClose={closeUploadModal}
          onMinimize={minimizeUploadModal}
          onExpand={expandUploadModal}
          onUploadStart={handleUploadStart}
          onUploadProgress={handleUploadProgress}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Global Reload Warning Modal: Appears when reloading during ANY active upload */}
      <UploadReloadWarningModal
        isOpen={isReloadWarningOpen}
        onClose={closeReloadWarning}
        onConfirmReload={handleConfirmReload}
        activeTasks={activeUploadTasks}
      />
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
