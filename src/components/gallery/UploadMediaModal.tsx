import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import type { MediaItem } from '../../types';
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
} from 'lucide-react';

interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
}

interface QueuedFile {
  id: string;
  file?: File;
  previewUrl: string;
  title: string;
  sizeMB: number;
  aspectRatio: number;
}

const DEFAULT_SECTION_SUGGESTIONS = [
  'BEGRUTA EDITED',
  'HALDI EDITED',
  'CEREMONY',
  'RECEPTION',
  'PORTRAITS',
  'GETTING READY',
];

export const UploadMediaModal: React.FC<UploadMediaModalProps> = ({
  isOpen,
  onClose,
  galleryId,
}) => {
  const { getGalleryByIdOrSlug, addMediaToGallery, addSectionToGallery } = useGallery();
  const { showToast } = useToast();
  const gallery = getGalleryByIdOrSlug(galleryId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');

  // Section State
  const existingSections = gallery?.sections && gallery.sections.length > 0
    ? gallery.sections
    : ['BEGRUTA EDITED', 'HALDI EDITED', 'CEREMONY', 'RECEPTION'];

  const [selectedSection, setSelectedSection] = useState<string>(existingSections[0] || 'BEGRUTA EDITED');
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionInput, setNewSectionInput] = useState('');

  // Queued Files
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Upload Simulation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Video State
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoThumb, setVideoThumb] = useState('');

  if (!isOpen) return null;

  // Handle adding a newly typed section title
  const handleAddNewSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSectionInput.trim().toUpperCase();
    if (!trimmed) return;

    addSectionToGallery(galleryId, trimmed);
    setSelectedSection(trimmed);
    setNewSectionInput('');
    setIsCreatingNewSection(false);
    showToast('Section Created', `Added "${trimmed}" as an upload section.`, 'success');
  };

  // Process selected native files
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newQueued: QueuedFile[] = [];
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const previewUrl = URL.createObjectURL(file);
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();

      newQueued.push({
        id: `queued-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        title: cleanTitle || `Photo ${index + 1}`,
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(2)) || 2.5,
        aspectRatio: 1.5, // Default photo ratio
      });
    });

    if (newQueued.length === 0) {
      showToast('Invalid Files', 'Please select valid image files (JPG, PNG, WebP).', 'warning');
      return;
    }

    setQueuedFiles((prev) => [...prev, ...newQueued]);
    showToast('Files Queued', `Added ${newQueued.length} photos ready to upload to "${selectedSection}".`, 'info');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAllQueued = () => {
    queuedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setQueuedFiles([]);
  };

  // Perform Batch Upload of Queued Photos
  const handleBatchUpload = () => {
    if (queuedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const itemsToAdd: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[] = queuedFiles.map((q) => ({
      type: 'photo',
      url: q.previewUrl,
      thumbnailUrl: q.previewUrl,
      title: q.title,
      sectionTitle: selectedSection,
      aspectRatio: q.aspectRatio,
      width: 2400,
      height: 1600,
      sizeMB: q.sizeMB,
    }));

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            addMediaToGallery(galleryId, itemsToAdd);
            setIsUploading(false);
            setUploadProgress(100);
            showToast(
              'Upload Successful',
              `Added ${itemsToAdd.length} photos to section "${selectedSection}".`,
              'success'
            );
            setQueuedFiles([]);
            onClose();
          }, 350);
          return 90;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Handle Video Highlight Submission
  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVideo =
      videoUrl.trim() ||
      'https://assets.mixkit.co/videos/preview/mixkit-bride-holding-a-bouquet-of-flowers-43183-large.mp4';

    setIsUploading(true);
    setUploadProgress(40);

    setTimeout(() => {
      addMediaToGallery(galleryId, [
        {
          type: 'video',
          url: finalVideo,
          thumbnailUrl:
            videoThumb.trim() ||
            'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
          title: videoTitle.trim() || 'Cinematic Highlights (4K)',
          sectionTitle: selectedSection,
          caption: 'Director highlight reel',
          aspectRatio: 1.77,
          width: 1920,
          height: 1080,
          sizeMB: 42.0,
          duration: '02:30',
          videoEmbedUrl: finalVideo,
        },
      ]);
      setIsUploading(false);
      setUploadProgress(100);
      showToast('Video Added', `Teaser video added to section "${selectedSection}".`, 'success');
      onClose();
    }, 400);
  };

  const totalQueuedMB = queuedFiles.reduce((acc, f) => acc + f.sizeMB, 0).toFixed(1);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overlay-animate">
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-neutral-950 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-5 sm:p-8 pb-safe shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sheet-animate sm:modal-animate text-neutral-900 dark:text-neutral-100">
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">
                Upload Media to Gallery
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                Organize your photos by section for seamless client proofing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── SECTION SELECTOR & CREATOR (HERO FEATURE) ─── */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Upload Target Section:
              </span>
            </div>

            {!isCreatingNewSection && (
              <button
                type="button"
                onClick={() => setIsCreatingNewSection(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors cursor-pointer"
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
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-md ring-2 ring-amber-400/40 scale-102'
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
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 animate-fadeIn">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
                Create a distinct category title for client gallery tabs:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SANGEET NIGHT, BRIDE PORTRAITS..."
                  value={newSectionInput}
                  onChange={(e) => setNewSectionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewSection();
                    }
                  }}
                  autoFocus
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddNewSection()}
                  disabled={!newSectionInput.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  Create & Select
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewSection(false);
                    setNewSectionInput('');
                  }}
                  className="px-3 py-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-400 uppercase font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
                </span>
                {DEFAULT_SECTION_SUGGESTIONS.filter((s) => !existingSections.includes(s)).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      addSectionToGallery(galleryId, sug);
                      setSelectedSection(sug);
                      setIsCreatingNewSection(false);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-amber-500 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress Bar if active */}
        {isUploading && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Uploading to section &ldquo;{selectedSection}&rdquo;...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
              Accelerating via CDN • Optimizing full museum-grade resolutions
            </p>
          </div>
        )}

        {/* Tabs: Photos vs Video */}
        <div className="mt-5 flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <FileImage className="w-4 h-4" /> Batch Photos
            {queuedFiles.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold">
                {queuedFiles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Film className="w-4 h-4" /> Video Highlight
          </button>
        </div>

        {/* Photos Tab Body */}
        {activeTab === 'photos' ? (
          <div className="mt-5 space-y-5">
            {/* Native Multi-File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all group ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                  : 'border-neutral-300 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-400/60 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Drag multiple photos here or click to browse
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Select multiple JPG, PNG, TIFF, or RAW files at once
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-bold shadow-md hover:bg-amber-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Choose Photos from Computer
              </div>
            </div>

            {/* Queued Photos Preview */}
            {queuedFiles.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {queuedFiles.length} photo{queuedFiles.length > 1 ? 's' : ''} queued ({totalQueuedMB} MB)
                  </span>
                  <button
                    type="button"
                    onClick={clearAllQueued}
                    className="text-neutral-400 hover:text-rose-500 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                  {queuedFiles.map((q) => (
                    <div
                      key={q.id}
                      className="group relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 aspect-square shadow-sm"
                    >
                      <img
                        src={q.previewUrl}
                        alt={q.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQueuedFile(q.id);
                          }}
                          className="self-end p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-colors"
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
                </div>

                {/* Upload Action Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={isUploading}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading to &ldquo;{selectedSection}&rdquo;...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 stroke-[2.5]" /> Upload {queuedFiles.length} Photos to &ldquo;{selectedSection}&rdquo;
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Video Tab Body */
          <form onSubmit={handleVideoSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Video Highlight Title
              </label>
              <input
                type="text"
                placeholder="e.g. 4K Cinematic Highlights Reel"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Video MP4 / Direct Stream URL
              </label>
              <input
                type="url"
                placeholder="https://assets.mixkit.co/videos/preview/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Custom Poster Thumbnail (Optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={videoThumb}
                onChange={(e) => setVideoThumb(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Film className="w-4 h-4" /> Add Video to &ldquo;{selectedSection}&rdquo;
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
