import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import { GALLERY_TEMPLATES } from '../../data/demoData';
import type { GalleryTemplateId, MediaItem } from '../../types';
import { UploadMediaModal } from '../../components/gallery/UploadMediaModal';
import { ShareModal } from '../../components/gallery/ShareModal';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  ArrowLeft,
  UploadCloud,
  Share2,
  ExternalLink,
  Trash2,
  Heart,
  Image as ImageIcon,
  Film,
  Calendar,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Lock,
  Eye,
  CheckSquare,
  Square,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';

export const GalleryDetailPage: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const navigate = useNavigate();
  const {
    getGalleryByIdOrSlug,
    updateGallery,
    deleteGallery,
    removeMediaFromGallery,
    reorderMediaInGallery,
    toggleMediaFavorite,
    setCoverImage,
    updateGalleryTemplate,
  } = useGallery();
  const { showToast } = useToast();

  const gallery = getGalleryByIdOrSlug(galleryId || '');

  // Sub-tabs: 'media' | 'design' | 'settings'
  const [activeTab, setActiveTab] = useState<'media' | 'design' | 'settings'>('media');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleteGalleryOpen, setIsDeleteGalleryOpen] = useState(false);

  // Selected media items for bulk deletion preview
  const selectedMediaItems = gallery?.media.filter((m) => selectedIds.includes(m.id)) || [];

  // Editing gallery details
  const [editTitle, setEditTitle] = useState(gallery?.title || '');
  const [editClientName, setEditClientName] = useState(gallery?.clientName || '');
  const [editPassword, setEditPassword] = useState(gallery?.password || '');
  const [editProtected, setEditProtected] = useState(gallery?.isPasswordProtected || false);
  const [editAllowDownloads, setEditAllowDownloads] = useState(gallery?.allowDownloads ?? true);

  if (!gallery) {
    return (
      <div className="p-12 text-center text-neutral-400 space-y-4">
        <h2 className="text-xl font-serif text-white">Gallery not found</h2>
        <p className="text-xs">The requested gallery ID does not exist or was deleted.</p>
        <button
          onClick={() => navigate('/dashboard/drive')}
          className="px-4 py-2 bg-neutral-800 text-white rounded-xl text-xs"
        >
          Return to Drive
        </button>
      </div>
    );
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === gallery.media.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(gallery.media.map((m) => m.id));
    }
  };

  const handleConfirmSingleDelete = () => {
    if (!itemToDelete) return;
    const title = itemToDelete.title;
    removeMediaFromGallery(gallery.id, itemToDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id));
    setItemToDelete(null);
    showToast('Photo Removed', `"${title}" was removed from gallery.`, 'info');
  };

  const handleConfirmBulkDelete = () => {
    const count = selectedIds.length;
    selectedIds.forEach((id) => removeMediaFromGallery(gallery.id, id));
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    showToast('Photos Removed', `Deleted ${count} selected items.`, 'info');
  };

  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    const newItems = [...gallery.media];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    reorderMediaInGallery(gallery.id, newItems);
    showToast('Reordered', 'Gallery display sequence updated.', 'info');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateGallery(gallery.id, {
      title: editTitle.trim() || gallery.title,
      clientName: editClientName.trim() || gallery.clientName,
      isPasswordProtected: editProtected,
      password: editProtected ? editPassword : '',
      allowDownloads: editAllowDownloads,
    });
    showToast('Saved', 'Gallery settings updated successfully.', 'success');
  };

  const handleConfirmDeleteGallery = () => {
    deleteGallery(gallery.id);
    setIsDeleteGalleryOpen(false);
    showToast('Gallery Deleted', `"${gallery.title}" was permanently removed.`, 'info');
    navigate('/dashboard/drive');
  };

  return (
    <div className="dashboard-container p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/drive')}
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Back to Drive"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
                Gallery Workspace
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-600">•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{gallery.clientName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 dark:text-white font-bold tracking-tight">
              {gallery.title}
            </h1>
          </div>
        </div>

        {/* Top Buttons: Upload, Share, Preview Client */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.2]" />
            <span>Upload Media</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <Link
            to={`/gallery/${gallery.slug || gallery.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Client View</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800/80 pb-2">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'media'
              ? 'bg-amber-500/15 dark:bg-neutral-800 text-amber-700 dark:text-white border border-amber-500/30 dark:border-neutral-700 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Photos & Videos ({gallery.media.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'design'
              ? 'bg-amber-500/15 dark:bg-neutral-800 text-amber-700 dark:text-white border border-amber-500/30 dark:border-neutral-700 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Design & Layout ({gallery.templateId})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-amber-500/15 dark:bg-neutral-800 text-amber-700 dark:text-white border border-amber-500/30 dark:border-neutral-700 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Gallery Settings</span>
        </button>
      </div>

      {/* Tab 1: Photos & Videos Management */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Rich, Premium Floating Selection Action Bar */}
          {selectedIds.length > 0 && (
            <div className="relative rounded-2xl bg-white/95 dark:bg-[#13141c]/95 border border-amber-500/30 shadow-xl shadow-amber-500/5 dark:shadow-black/50 p-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
              {/* Glowing amber accent highlight line */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-t-2xl" />

              {/* Left: Count & Meta */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2.5">
                  <div className="min-w-[28px] h-7 px-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-mono font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
                    {selectedIds.length}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                        {selectedIds.length === 1 ? '1 Photo' : `${selectedIds.length} Photos`} Selected
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono hidden md:inline">
                        ({selectedIds.length} of {gallery.media.length})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Clear Button */}
                <button
                  onClick={() => setSelectedIds([])}
                  className="sm:hidden text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Clear
                </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-700 shadow-sm active:scale-[0.98]"
                >
                  {selectedIds.length === gallery.media.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="hidden sm:flex p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Deselect All"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Media Grid or Empty State */}
          {gallery.media.length === 0 ? (
            <div
              onClick={() => setIsUploadModalOpen(true)}
              className="border-2 border-dashed border-neutral-800 hover:border-amber-400/60 rounded-3xl p-16 text-center cursor-pointer bg-neutral-900/40 hover:bg-neutral-900 transition-all space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif text-white">There are no files in this gallery yet</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Drag photos here or click the button below to upload high-resolution images or 4K videos.
              </p>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider"
              >
                Upload First Photos
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-5 text-xs text-neutral-400">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  {selectedIds.length === gallery.media.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-500" />
                  )}
                  <span>Select All ({gallery.media.length})</span>
                </button>
                <span>Reorder with arrows or click to preview in lightbox</span>
              </div>

              {/* 4 Cards on a Row with extra height & width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 stagger">
                {gallery.media.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isCover = gallery.coverImage === item.url;

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-3xl bg-white dark:bg-[#121319] border overflow-hidden card-lift fade-up transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-amber-400 dark:ring-amber-400 border-transparent shadow-xl shadow-amber-500/10 dark:shadow-amber-400/20 scale-[1.01]'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
                      }`}
                    >
                      {/* Thumbnail Container with Portrait aspect ratio 4:5 for taller, richer display */}
                      <div
                        onClick={() => setLightboxIndex(idx)}
                        className="relative aspect-[4/5] w-full overflow-hidden cursor-pointer bg-neutral-100 dark:bg-neutral-950"
                      >
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* Top Action Row */}
                        <div
                          className={`absolute top-2 left-2 right-2 flex items-center justify-between transition-opacity duration-200 ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(item.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all shadow-md backdrop-blur-md ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950 scale-105 ring-2 ring-amber-300'
                                : 'bg-black/60 hover:bg-black/80 text-white border border-white/20 hover:scale-105'
                            }`}
                            title={isSelected ? 'Deselect photo' : 'Select photo'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <Square className="w-4 h-4 stroke-[1.8]" />
                            )}
                          </button>

                          {/* Reorder Arrows */}
                          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg p-0.5 border border-white/10">
                            <button
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveMedia(idx, 'up');
                              }}
                              className="p-1 text-white hover:text-amber-400 disabled:opacity-30 transition-colors"
                              title="Move left/up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === gallery.media.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveMedia(idx, 'down');
                              }}
                              className="p-1 text-white hover:text-amber-400 disabled:opacity-30 transition-colors"
                              title="Move right/down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Badges: Cover, Video, Favorite */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1">
                          {isCover && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[9px] font-bold uppercase shadow-sm">
                              Cover
                            </span>
                          )}
                          {item.type === 'video' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-amber-400 text-[9px] font-mono flex items-center gap-1 border border-white/10">
                              <Film className="w-2.5 h-2.5" /> Reel
                            </span>
                          )}
                        </div>

                        {/* Favorite star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMediaFavorite(gallery.id, item.id);
                          }}
                          className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                            item.isFavorite
                              ? 'bg-rose-500 text-white opacity-100 shadow-md shadow-rose-500/30'
                              : 'bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${item.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Card Bottom Meta */}
                      <div className="p-2.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span className="truncate pr-1 font-medium text-neutral-800 dark:text-neutral-200">
                          {item.title}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isCover && (
                            <button
                              onClick={() => {
                                setCoverImage(gallery.id, item.url);
                                showToast('Cover Set', 'Cover image updated.', 'success');
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] text-neutral-400 dark:text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
                              title="Set as Gallery Cover"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Design & Layout Selector (4 Distinct Styles) */}
      {activeTab === 'design' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
              Client Design Theme
            </span>
            <h3 className="text-xl font-serif text-neutral-900 dark:text-white font-bold">Select Gallery Presentation Style</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
              Choose one of four signature web layouts. Your client will view their collection through
              this tailored aesthetic. Switch layouts anytime with a single click.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
            {GALLERY_TEMPLATES.map((tpl) => {
              const isSelected = gallery.templateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between card-lift fade-up ${
                    isSelected
                      ? 'bg-amber-500/5 dark:bg-neutral-900 border-amber-500 ring-1 ring-amber-500/50 shadow-xl shadow-amber-500/5'
                      : 'bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-4 bg-neutral-100 dark:bg-neutral-950">
                      <img
                        src={tpl.previewImage}
                        alt={tpl.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold uppercase text-amber-400">
                        {tpl.badge}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">{tpl.name}</h4>
                      {isSelected && (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                          Active Template
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mb-2">{tpl.tagline}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                      {tpl.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {tpl.characteristics.map((char, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-mono"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        updateGalleryTemplate(gallery.id, tpl.id);
                        showToast('Template Applied', `Switched layout to "${tpl.name}".`, 'success');
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white'
                      }`}
                    >
                      {isSelected ? 'Currently Selected' : `Apply ${tpl.name}`}
                    </button>

                    <Link
                      to={`/gallery/${gallery.slug || gallery.id}?previewTemplate=${tpl.id}`}
                      target="_blank"
                      className="px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Preview this design live"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Gallery Settings & Password & Delete */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-sm"
          >
            <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-bold">Gallery Configuration</h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Gallery Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Password Protection */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Require PIN Password</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Protect this gallery with client PIN code</p>
                </div>
                <input
                  type="checkbox"
                  checked={editProtected}
                  onChange={(e) => setEditProtected(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {editProtected && (
                <input
                  type="text"
                  placeholder="Set Password PIN (e.g. Wedding2026)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            {/* Downloads Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">Allow Client Downloads</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Permit downloading single files or full-gallery ZIPs</p>
              </div>
              <input
                type="checkbox"
                checked={editAllowDownloads}
                onChange={(e) => setEditAllowDownloads(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Save Gallery Settings
            </button>
          </form>

          {/* Destructive Zone */}
          <div className="p-6 rounded-3xl bg-rose-50 dark:bg-red-950/20 border border-rose-200 dark:border-red-900/40 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Permanently delete this gallery and all {gallery.media.length} associated media files.
            </p>
            <button
              onClick={() => setIsDeleteGalleryOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
            >
              Delete This Gallery
            </button>
          </div>
        </div>
      )}

      {/* Upload Media Modal */}
      <UploadMediaModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        galleryId={gallery.id}
      />

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
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
          onDelete={(mId) => {
            removeMediaFromGallery(gallery.id, mId);
          }}
          allowDownloads={gallery.allowDownloads}
        />
      )}

      {/* Confirm Delete Single Media Item Modal */}
      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This will permanently remove it from the gallery."
        confirmLabel="Delete Photo"
        item={itemToDelete}
      />

      {/* Confirm Delete Bulk Selected Media Items Modal */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedIds.length} Photos`}
        description={`Are you sure you want to delete ${selectedIds.length} selected photos? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Photos`}
        items={selectedMediaItems}
        itemCount={selectedIds.length}
      />

      {/* Confirm Delete Whole Gallery Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteGalleryOpen}
        onClose={() => setIsDeleteGalleryOpen(false)}
        onConfirm={handleConfirmDeleteGallery}
        title={`Delete "${gallery.title}"`}
        description={`Are you sure you want to permanently delete gallery "${gallery.title}" and all its ${gallery.media.length} photos? This cannot be recovered.`}
        confirmLabel="Delete Gallery"
        itemCount={gallery.media.length}
      />
    </div>
  );
};
