import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { UploadMediaModal } from '../components/gallery/UploadMediaModal';

export interface UploadContextType {
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
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

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

  /**
   * Request to open upload modal for a specific gallery.
   * If another gallery is currently uploading, blocks the request and notifies the user.
   */
  const openUploadModal = useCallback((galleryId: string, galleryTitle?: string): boolean => {
    // Strictly prevent concurrent uploads to different galleries
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
  }, [isUploading, uploadingGalleryId, uploadingGalleryTitle, showToast]);

  const closeUploadModal = useCallback(() => {
    if (isUploading) {
      // If uploading, closing the modal minimizes it so the background transfer continues uninterrupted
      setIsMinimized(true);
      setIsUploadModalOpen(false);
    } else {
      setIsUploadModalOpen(false);
      setIsMinimized(false);
      setActiveGalleryId(null);
      setActiveGalleryTitle(null);
    }
  }, [isUploading]);

  const minimizeUploadModal = useCallback(() => {
    setIsMinimized(true);
    setIsUploadModalOpen(false);
  }, []);

  const expandUploadModal = useCallback(() => {
    setIsMinimized(false);
    setIsUploadModalOpen(true);
  }, []);

  const cancelActiveUpload = useCallback(() => {
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
    showToast('Upload Cancelled', 'File upload was stopped.', 'info');
  }, [showToast]);

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
  }, []);

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
