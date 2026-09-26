import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGalleries } from '@/hooks/useAtelierQueries';
import { normalizeServerGallery } from '@/utils/galleryNormalizer';
import type { PortfolioProject } from '../../types/portfolio';
import type { Gallery } from '../../types';
import { X, Search, Image as ImageIcon, Calendar, Check, Plus } from 'lucide-react';
import { getInitialGalleryCover, handleCoverImageError } from '../../utils/coverImageUtils';

interface GalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (project: PortfolioProject) => void;
  existingProjectGallerySlugs?: string[];
}

const CATEGORY_OPTIONS = ['weddings', 'editorial', 'commercial', 'pre-wedding', 'portrait', 'cinematic'] as const;
type Category = (typeof CATEGORY_OPTIONS)[number];

function inferCategory(gallery: Gallery): Category {
  const title = gallery.title.toLowerCase();
  if (title.includes('wedding') || title.includes('bride') || title.includes('groom')) return 'weddings';
  if (title.includes('editorial') || title.includes('fashion') || title.includes('vogue')) return 'editorial';
  if (title.includes('pre-wedding') || title.includes('prewedding') || title.includes('engagement')) return 'pre-wedding';
  if (title.includes('portrait') || title.includes('headshot')) return 'portrait';
  if (title.includes('cinematic') || title.includes('film') || title.includes('reel')) return 'cinematic';
  return 'commercial';
}

export const GalleryPickerModal: React.FC<GalleryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  existingProjectGallerySlugs = [],
}) => {
  const { data: apiGalleries } = useGalleries();
  const galleries = useMemo<Gallery[]>(() => {
    if (apiGalleries && Array.isArray(apiGalleries)) {
      return apiGalleries.map((g: any) => normalizeServerGallery(g));
    }
    return [];
  }, [apiGalleries]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<Category>('weddings');

  const filtered = useMemo(() =>
    galleries.filter((g) => {
      const matchesSearch = !search ||
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.clientName.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && g.status !== 'archived';
    }),
    [galleries, search]
  );

  const selectedGallery = galleries.find((g) => g.id === selectedId);

  const handleOpen = (gallery: Gallery) => {
    setSelectedId(gallery.id);
    setCategoryOverride(inferCategory(gallery));
  };

  const handleConfirm = () => {
    if (!selectedGallery) return;

    const project: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: selectedGallery.title,
      category: categoryOverride,
      coverUrl: selectedGallery.coverImage,
      year: new Date(selectedGallery.eventDate).getFullYear().toString(),
      location: selectedGallery.clientName,
      description: `A curated selection of ${selectedGallery.media.length} images from this session.`,
      clientName: selectedGallery.clientName,
      gallerySlug: selectedGallery.slug,
      mediaCount: selectedGallery.media.length,
      highlightMedia: selectedGallery.media.slice(0, 4).map((m) => m.url),
    };

    onSelect(project);
    setSelectedId(null);
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#13141b] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
              Add Work from Gallery
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Select one of your galleries to feature in your portfolio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search galleries by title or client..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Gallery List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No galleries found</p>
              <p className="text-xs mt-1">Create a gallery first to add it to your portfolio</p>
            </div>
          ) : (
            filtered.map((gallery) => {
              const isAlreadyAdded = existingProjectGallerySlugs.includes(gallery.slug);
              const isSelected = selectedId === gallery.id;
              return (
                <button
                  key={gallery.id}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => !isAlreadyAdded && handleOpen(gallery)}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10 ring-1 ring-amber-400/30'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/40'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                    <img
                      src={gallery.coverImage || getInitialGalleryCover(gallery.templateId)}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleCoverImageError(e, getInitialGalleryCover(gallery.templateId))}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {gallery.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{gallery.clientName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                        <Calendar className="w-3 h-3" />
                        {gallery.eventDate}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {gallery.media.length} photos
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {isAlreadyAdded ? (
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-400/20">
                        Added
                      </span>
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-neutral-200 dark:border-neutral-700" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Category Override + Confirm */}
        {selectedGallery && (
          <div className="px-6 pb-6 pt-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0 space-y-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
                Portfolio Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryOverride(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                      categoryOverride === cat
                        ? 'bg-amber-400 text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add "{selectedGallery.title}" to Portfolio
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
