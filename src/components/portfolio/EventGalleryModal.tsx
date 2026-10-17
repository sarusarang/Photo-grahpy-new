import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioProject } from '../../types/portfolio';
import {
  X,
  MapPin,
  Calendar,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';

export interface EventGalleryModalProps {
  project: PortfolioProject | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (updatedProject: PortfolioProject) => void;
  isEditable?: boolean;
  theme?: 'dark' | 'light';
}

export const EventGalleryModal: React.FC<EventGalleryModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject,
  isEditable = false,
  theme = 'dark',
}) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrlInput, setUploadUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !project) return null;

  const photos: string[] = project.highlightMedia && project.highlightMedia.length > 0
    ? project.highlightMedia
    : [project.coverUrl];

  const isDark = theme === 'dark';

  // Handle local file uploads (supports multi-select)
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: string[] = [];

    const readAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve((event.target?.result as string) || '');
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await readAsDataURL(files[i]);
        if (dataUrl) newPhotos.push(dataUrl);
      }

      if (newPhotos.length > 0 && onUpdateProject) {
        const updatedList = [...photos, ...newPhotos];
        onUpdateProject({
          ...project,
          highlightMedia: updatedList,
          mediaCount: updatedList.length,
        });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle adding photo via URL
  const handleAddPhotoUrl = () => {
    const trimmed = uploadUrlInput.trim();
    if (!trimmed || !onUpdateProject) return;

    const updatedList = [...photos, trimmed];
    onUpdateProject({
      ...project,
      highlightMedia: updatedList,
      mediaCount: updatedList.length,
    });
    setUploadUrlInput('');
    setShowUrlInput(false);
  };

  // Handle deleting a single photo
  const handleDeletePhoto = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateProject) return;

    const updatedList = photos.filter((_, idx) => idx !== indexToDelete);
    onUpdateProject({
      ...project,
      highlightMedia: updatedList,
      mediaCount: updatedList.length,
    });

    if (activeLightboxIndex === indexToDelete) {
      setActiveLightboxIndex(null);
    } else if (activeLightboxIndex !== null && activeLightboxIndex > indexToDelete) {
      setActiveLightboxIndex(activeLightboxIndex - 1);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6 bg-black/85 backdrop-blur-md overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full h-full sm:h-auto sm:max-h-[92vh] max-w-5xl flex flex-col rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border ${
            isDark
              ? 'bg-[#0c0d12] border-white/10 text-white'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* ─── MODAL HEADER ─── */}
          <div
            className={`sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl ${
              isDark
                ? 'bg-[#0c0d12]/90 border-white/10'
                : 'bg-white/90 border-neutral-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold ${
                    isDark
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{project.location || 'Location'}</span>
                </span>
                {project.year && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{project.year}</span>
                  </span>
                )}
                <span
                  className={`text-[11px] font-mono ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  • {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>
              <h2
                className={`text-lg sm:text-2xl font-bold tracking-tight line-clamp-1 ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {project.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Upload trigger button inside modal */}
              {isEditable && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isUploading ? 'Uploading...' : 'Upload Photos'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── HIDDEN MULTI-FILE INPUT ─── */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFilesUpload}
          />

          {/* ─── MODAL SCROLLABLE BODY ─── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Story / Description if provided */}
            {project.description && (
              <p
                className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {project.description}
              </p>
            )}

            {/* In-place Upload Zone (Visible if in Edit Mode or empty) */}
            {isEditable && (
              <div
                className={`p-4 sm:p-6 rounded-2xl border-2 border-dashed transition-all ${
                  isDark
                    ? 'border-amber-400/30 bg-amber-400/5 hover:border-amber-400/50'
                    : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-amber-400/20 text-amber-400' : 'bg-neutral-900 text-white'
                      }`}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          isDark ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        Add Event Photos
                      </h4>
                      <p
                        className={`text-xs ${
                          isDark ? 'text-neutral-400' : 'text-neutral-500'
                        }`}
                      >
                        Upload high-resolution event shots to showcase on this project
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDark
                          ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{isUploading ? 'Uploading...' : 'Choose Files'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                        isDark
                          ? 'border-white/10 text-neutral-300 hover:text-white hover:bg-white/5'
                          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span>URL</span>
                    </button>
                  </div>
                </div>

                {/* Direct Image URL input dropdown */}
                {showUrlInput && (
                  <div className="mt-3 flex gap-2 pt-3 border-t border-white/10">
                    <input
                      type="url"
                      value={uploadUrlInput}
                      onChange={(e) => setUploadUrlInput(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                        isDark
                          ? 'bg-neutral-950 border-white/10 text-white focus:border-amber-400'
                          : 'bg-white border-neutral-300 text-neutral-900 focus:border-neutral-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── PHOTOS GRID ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photoUrl, index) => (
                <div
                  key={index}
                  onClick={() => setActiveLightboxIndex(index)}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 shadow-sm hover:shadow-xl ${
                    isDark
                      ? 'bg-neutral-900 border-white/10 hover:border-amber-400/50'
                      : 'bg-neutral-100 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  <img
                    src={photoUrl}
                    alt={`${project.title} - photo ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="text-[11px] font-mono text-white/90">
                      Photo {index + 1} of {photos.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="p-1.5 rounded-lg bg-black/60 text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                      {isEditable && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePhoto(index, e)}
                          title="Remove photo"
                          className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── FULLSCREEN LIGHTBOX VIEWER ─── */}
        {activeLightboxIndex !== null && (
          <div
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4"
            onClick={() => setActiveLightboxIndex(null)}
          >
            {/* Lightbox Header */}
            <div className="w-full max-w-6xl flex items-center justify-between text-white/80 py-2">
              <span className="text-xs font-mono">
                {project.title} • {activeLightboxIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveLightboxIndex(null)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Center Image with Nav */}
            <div
              className="relative max-w-5xl max-h-[82vh] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveLightboxIndex((prev) =>
                      prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : 0
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={photos[activeLightboxIndex]}
                alt={`${project.title} full frame`}
                className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
              />

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveLightboxIndex((prev) =>
                      prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : 0
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="py-2 text-neutral-400 text-xs font-mono">
              Use arrow keys or buttons to navigate • Click outside to close
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
