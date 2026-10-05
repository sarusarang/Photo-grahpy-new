import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UploadCloud,
  Film,
  FileImage,
  Loader2,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  ZapOff,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { useBulkUploadEventMedia } from '@/hooks/useAtelierQueries';
import { useUploadGuard } from '@/hooks/useUploadGuard';
import type { LiveEvent } from '@/types/event';

export interface QueuedUploadFile {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  sizeBytes: number;
  sizeMB: number;
  type: 'photo' | 'video';
  duration?: string;
}

const DEFAULT_EVENT_SECTIONS = [
  'HIGHLIGHTS',
  'CEREMONY',
  'RECEPTION',
  'PORTRAITS',
  'GETTING READY',
  'FAMILY',
  'PARTY',
  'SANGEET',
  'COCKTAILS',
];

export interface EventBatchUploadPanelProps {
  event: LiveEvent;
  onUploadComplete?: () => void;
  onClose?: () => void;
  hideFooter?: boolean;
}

export const EventBatchUploadPanel: React.FC<EventBatchUploadPanelProps> = ({
  event,
  onUploadComplete,
  onClose,
  hideFooter = false,
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const planQuota = usePlanQuota();
  const { mutateAsync: bulkUploadMutation } = useBulkUploadEventMedia(event.id);

  const syncEventStateImmediately = async () => {
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['event', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['current-subscription'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] }),
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ['event', event.id], exact: false });
    } catch {
      // safe fallback
    }
  };

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Active Tab: Photos or Videos
  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');

  // Section State
  const [customSections, setCustomSections] = useState<string[]>([]);
  const existingSections = useMemo(() => {
    const list = new Set<string>();
    // Prioritize existing event sections first
    (event.media || []).forEach((m) => {
      if (m.sectionTitle && m.sectionTitle.trim()) {
        list.add(m.sectionTitle.trim().toUpperCase());
      }
    });
    DEFAULT_EVENT_SECTIONS.forEach((s) => list.add(s.toUpperCase()));
    customSections.forEach((s) => {
      if (s && s.trim()) list.add(s.trim().toUpperCase());
    });
    return Array.from(list);
  }, [event.media, customSections]);

  const [selectedSection, setSelectedSection] = useState<string>(() => {
    const firstEventSection = (event.media || [])
      .map((m) => m.sectionTitle?.trim().toUpperCase())
      .find((s) => Boolean(s));
    return firstEventSection || 'HIGHLIGHTS';
  });
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState('');
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        sectionDropdownRef.current &&
        !sectionDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSectionDropdownOpen(false);
      }
    };
    if (isSectionDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSectionDropdownOpen]);

  // Queued Files
  const [queuedPhotos, setQueuedPhotos] = useState<QueuedUploadFile[]>([]);
  const [queuedVideos, setQueuedVideos] = useState<QueuedUploadFile[]>([]);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);

  // Upload progress, cancellation & status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Storage quota calculations (100% Dynamic & Validated from Backend)
  const {
    storageLimitGB,
    availableStorageBytes,
    availableStorageDisplay,
    isUnlimitedStorage: isUnlimited,
    isStorageFull,
    validateStorageQuota,
  } = planQuota;

  const currentQueuedList = activeTab === 'photos' ? queuedPhotos : queuedVideos;
  const currentBatchBytes = useMemo(
    () => currentQueuedList.reduce((sum, item) => sum + item.file.size, 0),
    [currentQueuedList]
  );
  const currentBatchMB = Number((currentBatchBytes / (1024 * 1024)).toFixed(1));
  const currentBatchGB = Number((currentBatchBytes / (1024 * 1024 * 1024)).toFixed(2));
  const currentBatchDisplay = currentBatchBytes > 1024 * 1024 * 1024 ? `${currentBatchGB} GB` : `${currentBatchMB} MB`;
  const wouldExceedLimit = !isUnlimited && currentBatchBytes > availableStorageBytes;

  // Protect active event uploads against page reload & accidental loss
  useUploadGuard({
    id: `event-upload-${event.id}`,
    source: 'event',
    title: `Event: ${event.title}`,
    details: uploadStatusText || `${currentQueuedList.length} files (${uploadProgress}% uploaded)`,
    count: currentQueuedList.length,
    progress: uploadProgress,
    isActive: isUploading,
  });

  // Add new section handler
  const handleAddNewSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSectionInput.trim().toUpperCase();
    if (!trimmed) return;
    setCustomSections((prev) => Array.from(new Set([...prev, trimmed])));
    setSelectedSection(trimmed);
    setNewSectionInput('');
    setIsCreatingNewSection(false);
    showToast('Section Created', `Selected "${trimmed}" for upload.`, 'success');
  };

  // Add files to queue
  const handlePhotoFiles = (files: FileList | null) => {
    if (isUploading || !files || files.length === 0) return;
    setUploadError(null);

    const newItems: QueuedUploadFile[] = [];
    const validExtensions = /\.(jpg|jpeg|png|webp|heic|raw|cr2|nef|arw|dng)$/i;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValidImage = file.type.startsWith('image/') || validExtensions.test(file.name);
      if (!isValidImage) continue;

      const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        title: file.name.replace(/\.[^/.]+$/, ''),
        sizeBytes: file.size,
        sizeMB,
        type: 'photo',
      });
    }

    if (newItems.length === 0) {
      showToast('Unsupported Format', 'Please upload valid JPEG, PNG, WEBP, or RAW image files.', 'warning');
      return;
    }

    // Pre-Upload Storage Validation: Check if incoming files exceed remaining plan storage
    const validation = validateStorageQuota(newItems.map((item) => item.file), currentBatchBytes);
    if (!validation.valid) {
      showToast(
        validation.errorTitle || 'Storage Limit Exceeded',
        validation.errorMessage || 'Storage limit reached.',
        'error'
      );
      setUploadError(validation.errorMessage || 'Storage limit exceeded.');
      return;
    }

    showToast('Photos Queued', `Added ${newItems.length} photo(s) ready for "${selectedSection}".`, 'info');
    setQueuedPhotos((prev) => [...prev, ...newItems]);
  };

  const handleVideoFiles = (files: FileList | null) => {
    if (isUploading || !files || files.length === 0) return;
    setUploadError(null);

    const newItems: QueuedUploadFile[] = [];
    const validExtensions = /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') || validExtensions.test(file.name);
      if (!isVideo) continue;

      const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        title: file.name.replace(/\.[^/.]+$/, ''),
        sizeBytes: file.size,
        sizeMB,
        type: 'video',
      });
    }

    if (newItems.length === 0) {
      showToast('Unsupported Format', 'Please upload MP4, MOV, WEBM, or other video files.', 'warning');
      return;
    }

    // Pre-Upload Storage Validation: Check if incoming videos exceed remaining plan storage
    const validation = validateStorageQuota(newItems.map((item) => item.file), currentBatchBytes);
    if (!validation.valid) {
      showToast(
        validation.errorTitle || 'Storage Limit Exceeded',
        validation.errorMessage || 'Storage limit reached.',
        'error'
      );
      setUploadError(validation.errorMessage || 'Storage limit exceeded.');
      return;
    }

    showToast('Videos Queued', `Added ${newItems.length} video(s) ready for "${selectedSection}".`, 'info');
    setQueuedVideos((prev) => [...prev, ...newItems]);
  };

  const removeQueuedPhoto = (id: string) => {
    setQueuedPhotos((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const removeQueuedVideo = (id: string) => {
    setQueuedVideos((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
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

  // Cancel Upload Handler
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText('');
    syncEventStateImmediately();
    showToast('Upload Cancelled', 'File upload was stopped.', 'info');
  };

  // Execute Upload
  const handleStartUpload = async () => {
    const isPhotos = activeTab === 'photos';
    const queue = isPhotos ? queuedPhotos : queuedVideos;

    const files = queue.map((q) => q.file);

    const validation = validateStorageQuota(files, 0);
    if (!validation.valid) {
      showToast(
        validation.errorTitle || 'Storage Limit Exceeded',
        validation.errorMessage || 'Storage limit reached.',
        'error'
      );
      setUploadError(validation.errorMessage || 'Storage limit reached. Upgrade your plan to continue.');
      return;
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatusText(`Preparing ${files.length} ${isPhotos ? 'photo(s)' : 'video(s)'}...`);

    try {
      await bulkUploadMutation({
        files,
        sectionTitle: selectedSection,
        type: isPhotos ? 'photo' : 'video',
        signal: controller.signal,
        onProgress: (percent, statusText) => {
          setUploadProgress(percent);
          if (statusText) setUploadStatusText(statusText);
        },
      });

      setUploadProgress(100);
      setUploadStatusText('Upload Complete');
      showToast('Upload Successful', `Saved ${files.length} file(s) to "${selectedSection}".`, 'success');

      if (isPhotos) clearAllPhotos();
      else clearAllVideos();

      await syncEventStateImmediately();
      onUploadComplete?.();
    } catch (err: any) {
      // Even on error or abort, some batches may have succeeded, so sync event state immediately
      await syncEventStateImmediately();
      if (controller.signal.aborted) {
        return;
      }
      console.error('Event batch upload error:', err);
      const msg = err?.message || 'Failed uploading files. Please try again.';
      setUploadError(msg);
      showToast('Upload Failed', msg, 'error');
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
      await syncEventStateImmediately();
      onUploadComplete?.();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
        {/* Tab Switcher & Section Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Photos ({queuedPhotos.length})</span>
          </button>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos ({queuedVideos.length})</span>
          </button>
        </div>

        {/* Section Destination Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500 dark:text-neutral-400 font-semibold select-none">Section:</span>
          {!isCreatingNewSection ? (
            <div ref={sectionDropdownRef} className="relative flex items-center gap-1.5">
              {/* Custom Dropdown Trigger Button */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsSectionDropdownOpen((prev) => !prev)}
                className={`h-8 sm:h-9 px-3 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all border cursor-pointer select-none ${
                  isSectionDropdownOpen
                    ? 'bg-neutral-800 text-amber-400 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                    : 'bg-white dark:bg-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-750 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{selectedSection}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${
                    isSectionDropdownOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Add New Section Button */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  setIsSectionDropdownOpen(false);
                  setIsCreatingNewSection(true);
                }}
                className="h-8 sm:h-9 w-8 sm:w-9 rounded-xl bg-white dark:bg-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create new section"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Custom Dropdown Popover */}
              {isSectionDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto custom-scrollbar rounded-2xl bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-2xl border border-neutral-200 dark:border-neutral-800 shadow-[0_12px_32px_rgba(0,0,0,0.4)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.8)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-400 font-bold flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-1.5 mb-1 select-none">
                    <span>Select Section</span>
                    <span className="text-[9px] text-amber-500 dark:text-amber-400 font-semibold">{existingSections.length} sections</span>
                  </div>

                  <div className="space-y-0.5">
                    {existingSections.map((sec) => {
                      const isSelected = sec === selectedSection;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setSelectedSection(sec);
                            setIsSectionDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-400/20'
                              : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isSelected ? 'bg-neutral-950' : 'bg-neutral-400 dark:bg-neutral-600'
                              }`}
                            />
                            <span className="truncate">{sec}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] text-neutral-950 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-neutral-200/80 dark:border-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSectionDropdownOpen(false);
                        setIsCreatingNewSection(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-mono text-amber-600 dark:text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>New Section...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddNewSection} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newSectionInput}
                onChange={(e) => setNewSectionInput(e.target.value)}
                placeholder="NEW SECTION..."
                autoFocus
                className="bg-white dark:bg-neutral-900 border border-amber-400 text-neutral-900 dark:text-white px-3 py-1.5 rounded-xl font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-amber-400/30 w-36 shadow-xs"
              />
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-transform active:scale-95 cursor-pointer shadow-xs"
                title="Save section"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewSection(false)}
                className="p-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Active Uploading Status Card */}
      {isUploading && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-500 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploadStatusText || 'Uploading media files to cloud...'}</span>
            </div>
            <span className="font-bold text-amber-500">{uploadProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Target Section: <strong className="text-neutral-800 dark:text-neutral-200">{selectedSection}</strong>
            </span>

            <button
              type="button"
              onClick={handleCancelUpload}
              className="px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ZapOff className="w-3 h-3" />
              <span>Cancel Upload</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* DROPZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (activeTab === 'photos') setIsDraggingPhotos(true);
          else setIsDraggingVideos(true);
        }}
        onDragLeave={() => {
          setIsDraggingPhotos(false);
          setIsDraggingVideos(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingPhotos(false);
          setIsDraggingVideos(false);
          if (e.dataTransfer.files) {
            if (activeTab === 'photos') handlePhotoFiles(e.dataTransfer.files);
            else handleVideoFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (isUploading) return;
          if (activeTab === 'photos') photoInputRef.current?.click();
          else videoInputRef.current?.click();
        }}
        className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer ${
          (activeTab === 'photos' ? isDraggingPhotos : isDraggingVideos)
            ? 'border-amber-400 bg-amber-400/10'
            : 'border-neutral-300 dark:border-neutral-800 hover:border-amber-400/60 bg-neutral-50/50 dark:bg-neutral-950/40'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          {activeTab === 'photos' ? (
            <FileImage className="w-7 h-7" />
          ) : (
            <Film className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-serif font-bold text-neutral-900 dark:text-white">
            Drag & Drop {activeTab === 'photos' ? 'Event Photographs' : 'Video Footage'} Here
          </p>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            {activeTab === 'photos'
              ? 'Supports RAW, JPEG, PNG, WEBP. Multi-selection enabled.'
              : 'Supports MP4, MOV, WEBM, 4K Footage. Multi-selection enabled.'}
          </p>
        </div>

        <button
          type="button"
          disabled={isUploading}
          className="py-2 px-4 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-mono font-bold transition-all"
        >
          Browse Files from Computer
        </button>

        <input
          ref={photoInputRef}
          type="file"
          multiple
          accept="image/*,.cr2,.nef,.arw,.dng,.heic"
          onChange={(e) => {
            handlePhotoFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
          onChange={(e) => {
            handleVideoFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {/* QUEUED FILES LIST */}
      {currentQueuedList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-neutral-700 dark:text-neutral-300">
              Ready to Ingest ({currentQueuedList.length} files • {currentBatchMB} MB)
            </span>
            <button
              type="button"
              disabled={isUploading}
              onClick={activeTab === 'photos' ? clearAllPhotos : clearAllVideos}
              className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
            {currentQueuedList.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden p-2 space-y-1.5"
              >
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-950 relative">
                  {item.type === 'photo' ? (
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-amber-400">
                      <Film className="w-6 h-6" />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() =>
                      item.type === 'photo'
                        ? removeQueuedPhoto(item.id)
                        : removeQueuedVideo(item.id)
                    }
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-[10px] font-mono leading-tight">
                  <p className="truncate font-semibold text-neutral-800 dark:text-neutral-200">
                    {item.title}
                  </p>
                  <p className="text-neutral-400">{item.sizeMB} MB</p>
                </div>
              </div>
            ))}
          </div>

          {/* Storage Alert Warning */}
          {(wouldExceedLimit || isStorageFull) && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs font-mono text-rose-500 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {isStorageFull
                    ? `Studio storage limit (${storageLimitGB} GB) is full.`
                    : `Batch size (${currentBatchDisplay}) exceeds remaining storage (${availableStorageDisplay}).`}
                </span>
              </div>
              <span className="text-[11px] font-bold">
                Remove files or upgrade
              </span>
            </div>
          )}

          {uploadError && !wouldExceedLimit && !isStorageFull && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs font-mono text-rose-500">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}
      </div>

      {/* ── Sticky Modal Action Footer: ALWAYS visible without scrolling (Matching Gallery Upload Modal) ── */}
      {!hideFooter && (
        <div className="shrink-0 px-5 sm:px-7 py-3.5 sm:py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/95 dark:bg-[#0e0f15]/95 backdrop-blur-md pb-safe flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-20">
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
                {!isUnlimited && (
                  <span className="ml-2 text-neutral-400 text-[11px]">
                    ({availableStorageDisplay} remaining)
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Close
              </button>
            )}

            {isUploading ? (
              <button
                type="button"
                onClick={handleCancelUpload}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <ZapOff className="w-3.5 h-3.5" />
                <span>Cancel Upload</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isUploading || isStorageFull || wouldExceedLimit || currentQueuedList.length === 0}
                onClick={handleStartUpload}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 ${
                  isStorageFull || wouldExceedLimit
                    ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
                    : currentQueuedList.length === 0
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-60'
                    : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-500/20 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isStorageFull || wouldExceedLimit ? (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface EventUploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
  onUploadComplete?: () => void;
}

export const EventUploadMediaModal: React.FC<EventUploadMediaModalProps> = ({
  isOpen,
  onClose,
  event,
  onUploadComplete,
}) => {
  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white dark:bg-[#0e0f15] border border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-900 dark:text-white shadow-2xl my-auto flex flex-col overflow-hidden max-h-[min(94vh,850px)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-[#0e0f15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                  Event Media Ingestion
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  • {event.title}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white">
                Upload Photographs & 4K Videos
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body & Sticky Action Footer (matching gallery upload modal) */}
        <EventBatchUploadPanel
          event={event}
          onClose={onClose}
          onUploadComplete={() => {
            onUploadComplete?.();
            onClose();
          }}
        />
      </div>
    </div>,
    document.body
  );
};
