import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import { GALLERY_TEMPLATES, isVideoMedia, DEFAULT_CINEMATIC_VIDEOS } from '../../data/demoData';
import { formatHeroShootDate } from '../../components/gallery/GalleryHeroBanner';
import type { GalleryTemplateId, MediaItem } from '../../types';
import { UploadMediaModal } from '../../components/gallery/UploadMediaModal';
import { ShareModal } from '../../components/gallery/ShareModal';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { MoveToSectionModal } from '../../components/gallery/MoveToSectionModal';
import {
  ArrowLeft,
  UploadCloud,
  Share2,
  ExternalLink,
  Trash2,
  Heart,
  Image as ImageIcon,
  Film,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckSquare,
  Square,
  Settings,
  ShieldAlert,
  X,
  Check,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  FolderInput,
  Plus,
} from 'lucide-react';
import {
  getExpiryStatus,
  calculateExpiryPreset,
  extendExpiryByDays,
  type ExpiryPresetId,
} from '../../utils/expiryUtils';

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
    setTemplateBannerImage,
    setMasonryBannerImage,
    updateGalleryTemplate,
    addSectionToGallery,
    moveMediaToSection,
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
  const [dashboardSectionFilter, setDashboardSectionFilter] = useState<string>('all');

  // Selected template & filter for banner customization in Design tab
  const [selectedBannerTemplate, setSelectedBannerTemplate] = useState<GalleryTemplateId>(
    gallery?.templateId || 'editorial'
  );
  const [bannerSectionFilter, setBannerSectionFilter] = useState<string>('all');
  const [activeMasonrySlot, setActiveMasonrySlot] = useState<number>(0);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleteGalleryOpen, setIsDeleteGalleryOpen] = useState(false);

  // Move to section modal state
  const [isMoveSectionOpen, setIsMoveSectionOpen] = useState(false);
  const [singleItemToMove, setSingleItemToMove] = useState<MediaItem | null>(null);

  // Quick inline add section state
  const [isCreatingQuickSection, setIsCreatingQuickSection] = useState(false);
  const [newQuickSectionInput, setNewQuickSectionInput] = useState('');

  // Selected media items for bulk deletion preview
  const selectedMediaItems = gallery?.media.filter((m) => selectedIds.includes(m.id)) || [];
  const itemsToMove = singleItemToMove ? [singleItemToMove] : selectedMediaItems;

  const handleCreateQuickSection = () => {
    if (!gallery) return;
    const trimmed = newQuickSectionInput.trim().toUpperCase();
    if (!trimmed) {
      setIsCreatingQuickSection(false);
      return;
    }
    addSectionToGallery(gallery.id, trimmed);
    showToast('Section Created', `"${trimmed}" added to gallery sections.`, 'success');
    setDashboardSectionFilter(trimmed);
    setNewQuickSectionInput('');
    setIsCreatingQuickSection(false);
  };

  // Editing gallery details
  const [editTitle, setEditTitle] = useState(gallery?.title || '');
  const [editClientName, setEditClientName] = useState(gallery?.clientName || '');
  const [editPassword, setEditPassword] = useState(gallery?.password || '');
  const [editProtected, setEditProtected] = useState(gallery?.isPasswordProtected || false);
  const [editAllowDownloads, setEditAllowDownloads] = useState(gallery?.allowDownloads ?? true);
  const [editExpiresAt, setEditExpiresAt] = useState<string | undefined>(gallery?.expiresAt);

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
      expiresAt: editExpiresAt || undefined,
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
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.2]" />
            <span>Upload Media</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <Link
            to={`/gallery/${gallery.slug || gallery.id}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Client View</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Smooth Horizontal Swipe on Mobile) */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800/80 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${activeTab === 'media'
              ? 'bg-amber-500/15 dark:bg-neutral-800 text-amber-700 dark:text-white border border-amber-500/30 dark:border-neutral-700 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Photos & Videos ({gallery.media.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${activeTab === 'design'
              ? 'bg-amber-500/15 dark:bg-neutral-800 text-amber-700 dark:text-white border border-amber-500/30 dark:border-neutral-700 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
        >
          <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Design & Layout ({gallery.templateId})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${activeTab === 'settings'
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
                  type="button"
                  onClick={() => {
                    setSingleItemToMove(null);
                    setIsMoveSectionOpen(true);
                  }}
                  className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold shadow-md shadow-amber-400/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FolderInput className="w-3.5 h-3.5 stroke-[2.2] group-hover:scale-110 transition-transform" />
                  <span>Move to Section ({selectedIds.length})</span>
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
              {/* Gallery Section Filter Pills in Dashboard Workspace */}
              {(() => {
                const allSections = (gallery.sections && gallery.sections.length > 0)
                  ? gallery.sections
                  : Array.from(new Set(gallery.media.map((m) => m.sectionTitle).filter(Boolean) as string[]));

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 shrink-0">
                      Section:
                    </span>
                    <button
                      type="button"
                      onClick={() => setDashboardSectionFilter('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-mono transition-all shrink-0 ${dashboardSectionFilter === 'all'
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-white'
                        }`}
                    >
                      All ({gallery.media.length})
                    </button>
                    {allSections.map((sec) => {
                      const count = gallery.media.filter((m) => (m.sectionTitle || '').toLowerCase() === sec.toLowerCase()).length;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setDashboardSectionFilter(sec)}
                          className={`px-3 py-1 rounded-xl text-xs font-mono uppercase transition-all shrink-0 ${dashboardSectionFilter.toLowerCase() === sec.toLowerCase()
                              ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                              : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-white'
                            }`}
                        >
                          {sec} ({count})
                        </button>
                      );
                    })}

                    {/* Quick Add Section Button / Inline Input */}
                    {isCreatingQuickSection ? (
                      <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-neutral-900 border border-amber-400 p-0.5 rounded-xl shadow-xs">
                        <input
                          type="text"
                          value={newQuickSectionInput}
                          onChange={(e) => setNewQuickSectionInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateQuickSection();
                            if (e.key === 'Escape') setIsCreatingQuickSection(false);
                          }}
                          placeholder="NEW SECTION..."
                          autoFocus
                          className="px-2 py-0.5 text-xs font-mono uppercase bg-transparent text-neutral-900 dark:text-white outline-hidden w-28 placeholder:text-neutral-400"
                        />
                        <button
                          type="button"
                          onClick={handleCreateQuickSection}
                          className="p-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-colors cursor-pointer"
                          title="Save Section"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingQuickSection(false)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingQuickSection(true);
                          setNewQuickSectionInput('');
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-mono transition-all shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 cursor-pointer font-bold"
                        title="Create a new section"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>New Section</span>
                      </button>
                    )}
                  </div>
                );
              })()}

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

              {/* Photo Cards Grid — 2 columns on mobile with comfortable touch targets */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 stagger">
                {gallery.media
                  .filter((item) =>
                    dashboardSectionFilter === 'all'
                      ? true
                      : (item.sectionTitle || '').toLowerCase() === dashboardSectionFilter.toLowerCase()
                  )
                  .map((item, idx) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isCover = gallery.coverImage === item.url;

                    return (
                      <div
                        key={item.id}
                        className={`group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121319] border overflow-hidden card-lift fade-up transition-all duration-200 ${isSelected
                            ? 'ring-2 ring-amber-400 dark:ring-amber-400 border-transparent shadow-xl shadow-amber-500/10 dark:shadow-amber-400/20 scale-[1.01]'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
                          }`}
                      >
                        {/* Thumbnail Container with Portrait aspect ratio 4:5 */}
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

                          {/* Top Action Row — Always visible on touch, hoverable on desktop */}
                          <div
                            className={`absolute top-2 left-2 right-2 flex items-center justify-between transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                              }`}
                          >
                            {/* Selection Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(item.id);
                              }}
                              className={`p-1.5 rounded-lg transition-all shadow-md backdrop-blur-md ${isSelected
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

                          {/* Badges: Cover, Section Title, Video, Favorite */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap max-w-[70%]">
                            {isCover && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                                ★ Hero Banner
                              </span>
                            )}
                            {item.sectionTitle && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSingleItemToMove(item);
                                  setIsMoveSectionOpen(true);
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-black/80 hover:bg-black backdrop-blur-sm text-amber-300 hover:text-amber-200 text-[9px] font-mono border border-white/15 hover:border-amber-400/50 uppercase truncate transition-all cursor-pointer hover:scale-105"
                                title="Click to move photo into another section"
                              >
                                {item.sectionTitle}
                              </button>
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
                            className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${item.isFavorite
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
                            {/* Move to Section Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSingleItemToMove(item);
                                setIsMoveSectionOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                              title="Move photo to another section (e.g. Haldi, Reception, Ceremony)"
                            >
                              <FolderInput className="w-3 h-3 text-amber-500" />
                              <span>Move</span>
                            </button>

                            {!isCover && (
                              <button
                                onClick={() => {
                                  if (gallery.templateId === 'cinematic' && item.type !== 'video') {
                                    setCoverImage(gallery.id, item.url);
                                    showToast(
                                      'Cover Updated',
                                      'Cinematic template uses video reels for its hero banner. Photo saved as general card cover.',
                                      'info'
                                    );
                                    return;
                                  }
                                  setCoverImage(gallery.id, item.url);
                                  setTemplateBannerImage(gallery.id, gallery.templateId, item.url);
                                  showToast(
                                    'Hero Banner Updated',
                                    `${item.type === 'video' ? 'Video reel' : 'Selected photo'} set as gallery hero banner.`,
                                    'success'
                                  );
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Set as Hero Banner for this gallery"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Set Banner</span>
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

      {/* Tab 2: Design & Layout Selector + Hero Banner Customizer */}
      {activeTab === 'design' && (
        <div className="space-y-8">
          {/* Top Banner Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
                Client Design & Hero Styling
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs font-mono text-neutral-500 capitalize">
                Current Active: {gallery.templateId}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-neutral-900 dark:text-white font-bold">
              Template Presentation & Hero Banner
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
              Customize the look and feel of your client gallery. Select signature presentation styles and choose the exact hero banner image that greets your clients when they open the gallery.
            </p>
          </div>

          {/* Dedicated Hero Banner Selector Box for the Selected Template */}
          <div className="rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white">
                    Hero Banner Image Selector
                  </h4>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select which photo from this gallery displays in the hero banner for the{' '}
                  <span className="text-amber-600 dark:text-amber-400 font-semibold capitalize">
                    {selectedBannerTemplate}
                  </span>{' '}
                  template.
                </p>
              </div>

              {/* Quick Template Switcher Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'editorial', label: 'Editorial' },
                    { id: 'masonry', label: 'Masonry' },
                    { id: 'cinematic', label: 'Cinematic' },
                    { id: 'minimal', label: 'Minimal' },
                  ] as const
                ).map((tpl) => {
                  const isCurTemplate = selectedBannerTemplate === tpl.id;
                  const isGalleryActive = gallery.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedBannerTemplate(tpl.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isCurTemplate
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span>{tpl.label}</span>
                      {isGalleryActive && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCurTemplate ? 'bg-neutral-950' : 'bg-amber-400'
                          }`}
                          title="Active Gallery Template"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Active Banner Live Preview */}
            {(() => {
              const activeTemplateInfo = GALLERY_TEMPLATES.find(
                (t) => t.id === selectedBannerTemplate
              );

              const isMasonry = selectedBannerTemplate === 'masonry';
              const galleryPhotos = gallery.media.filter((m) => m.type !== 'video');
              const masonryBanners = gallery.masonryBannerImages && gallery.masonryBannerImages.length >= 4
                ? gallery.masonryBannerImages
                : [
                    gallery.templateBanners?.['masonry'] || gallery.coverImage || galleryPhotos[0]?.url || '',
                    galleryPhotos[1]?.url || galleryPhotos[0]?.url || '',
                    galleryPhotos[2]?.url || galleryPhotos[0]?.url || '',
                    galleryPhotos[3]?.url || galleryPhotos[0]?.url || '',
                  ];

              const currentSingleBanner =
                gallery.templateBanners?.[selectedBannerTemplate] ||
                gallery.coverImage ||
                gallery.media[0]?.url;

              const slotLabels = [
                'Slot 1: Main Focal',
                'Slot 2: Top Detail',
                'Slot 3: Bottom Detail',
                'Slot 4: Right Accent',
              ];

              const isCinematic = selectedBannerTemplate === 'cinematic';
              const isEditorial = selectedBannerTemplate === 'editorial';

              const videos = gallery.media.filter((m) => m.type === 'video');
              const currentCinematicVideo =
                (gallery.templateBanners?.['cinematic'] && isVideoMedia(gallery.templateBanners?.['cinematic']))
                  ? gallery.templateBanners?.['cinematic']
                  : (isVideoMedia(gallery.coverImage)
                      ? gallery.coverImage
                      : (videos[0]?.url || DEFAULT_CINEMATIC_VIDEOS[0].url));

              const formattedDate = formatHeroShootDate(gallery.eventDate);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Banner Preview Screen — Exact Faithful Miniature of Live Client Layout */}
                  <div className="lg:col-span-7 relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-md p-2 flex flex-col justify-between group">
                    {isCinematic ? (
                      /* Exact Cinematic Preview: 2.39:1 Screen with looping Video Reel and Grand Cinema Title */
                      <div className="w-full h-full bg-[#050507] rounded-xl p-3 sm:p-4 flex flex-col justify-center items-center relative overflow-hidden">
                        {/* Ambient Golden Amber Flare behind the screen */}
                        <div className="absolute inset-0 bg-amber-500/15 rounded-xl blur-xl pointer-events-none" />

                        {/* 2.39:1 Anamorphic Cinema Screen Frame (NO Top-Right HUD Badge) */}
                        <div className="relative w-full aspect-[2.39/1] max-h-[220px] rounded-lg overflow-hidden shadow-2xl shadow-black bg-black border border-amber-500/35 ring-1 ring-amber-400/20 group">
                          <video
                            src={currentCinematicVideo}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-amber-500/10 pointer-events-none" />
                        </div>

                        {/* Grand Cinema Title & Date Underneath */}
                        <div className="text-center space-y-0.5 pt-2">
                          <h5 className="text-xs sm:text-sm md:text-base font-serif tracking-widest text-white uppercase drop-shadow-md truncate max-w-md">
                            {gallery.title}
                          </h5>
                          <div className="flex items-center justify-center gap-2 text-amber-400/80">
                            <span className="h-px w-6 bg-amber-800/60" />
                            <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-amber-400 font-semibold">
                              // {formattedDate} //
                            </span>
                            <span className="h-px w-6 bg-amber-800/60" />
                          </div>
                        </div>
                      </div>
                    ) : isMasonry ? (
                      /* Exact Masonry Preview: 4-Photo Curated Mosaic with Floating Glass Atelier Capsule */
                      <div className="w-full h-full relative rounded-xl overflow-hidden bg-[#060c0a] p-1.5">
                        <div className="w-full h-full grid grid-cols-12 gap-1.5">
                          {/* Slot 1: Focal (5 cols) */}
                          <div
                            onClick={() => setActiveMasonrySlot(0)}
                            className={`col-span-5 h-full relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                              activeMasonrySlot === 0
                                ? 'ring-2 ring-amber-400 border border-amber-400 shadow-lg scale-[1.01]'
                                : 'opacity-90 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={masonryBanners[0]}
                              alt="Slot 1 Focal"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-1 left-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                  activeMasonrySlot === 0
                                    ? 'bg-amber-400 text-neutral-950'
                                    : 'bg-black/70 text-white'
                                }`}
                              >
                                Slot 1 (Main)
                              </span>
                            </div>
                          </div>

                          {/* Slots 2 & 3: Stacked (4 cols) */}
                          <div className="col-span-4 h-full flex flex-col gap-1.5">
                            <div
                              onClick={() => setActiveMasonrySlot(1)}
                              className={`flex-1 w-full relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                                activeMasonrySlot === 1
                                  ? 'ring-2 ring-amber-400 border border-amber-400 shadow-lg scale-[1.01]'
                                  : 'opacity-90 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={masonryBanners[1]}
                                alt="Slot 2 Detail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute top-1 left-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                    activeMasonrySlot === 1
                                      ? 'bg-amber-400 text-neutral-950'
                                      : 'bg-black/70 text-white'
                                  }`}
                                >
                                  Slot 2
                                </span>
                              </div>
                            </div>

                            <div
                              onClick={() => setActiveMasonrySlot(2)}
                              className={`flex-1 w-full relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                                activeMasonrySlot === 2
                                  ? 'ring-2 ring-amber-400 border border-amber-400 shadow-lg scale-[1.01]'
                                  : 'opacity-90 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={masonryBanners[2]}
                                alt="Slot 3 Detail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute top-1 left-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                    activeMasonrySlot === 2
                                      ? 'bg-amber-400 text-neutral-950'
                                      : 'bg-black/70 text-white'
                                  }`}
                                >
                                  Slot 3
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Slot 4: Accent (3 cols) */}
                          <div
                            onClick={() => setActiveMasonrySlot(3)}
                            className={`col-span-3 h-full relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                              activeMasonrySlot === 3
                                ? 'ring-2 ring-amber-400 border border-amber-400 shadow-lg scale-[1.01]'
                                : 'opacity-90 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={masonryBanners[3]}
                              alt="Slot 4 Accent"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-1 left-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                  activeMasonrySlot === 3
                                    ? 'bg-amber-400 text-neutral-950'
                                    : 'bg-black/70 text-white'
                                }`}
                              >
                                Slot 4
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Floating Frosted Glass Title Capsule Preview */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-xl bg-[#09110E]/85 backdrop-blur-md border border-emerald-500/30 text-center shadow-lg pointer-events-none">
                          <p className="text-[7px] font-mono uppercase text-emerald-400 font-semibold">// {formattedDate} //</p>
                          <p className="text-[10px] font-serif italic text-white truncate max-w-[190px]">{gallery.title}</p>
                        </div>
                      </div>
                    ) : isEditorial ? (
                      /* Exact Editorial Preview: Vogue spread with delicate fonts and kenburns ambiance */
                      <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center text-center p-4">
                        <img
                          src={currentSingleBanner}
                          alt="Editorial Banner"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />
                        <div className="relative z-10 space-y-0.5 text-white">
                          <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-amber-200/90 block">
                            SHOOT DATE • {formattedDate}
                          </span>
                          <h5 className="text-lg sm:text-xl font-serif font-light tracking-tight text-white leading-tight drop-shadow-md truncate max-w-md">
                            {gallery.title}
                          </h5>
                          <span className="font-script text-base text-amber-200/90 block">Atelier Series</span>
                        </div>
                      </div>
                    ) : (
                      /* Exact Minimal Preview: Scandinavian 50/50 Museum Print Wall */
                      <div className="w-full h-full rounded-xl overflow-hidden bg-[#F8F8F6] text-neutral-900 p-4 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-7 h-full flex items-center justify-center">
                          <div className="p-1.5 bg-white shadow-lg border border-neutral-200 w-full h-full max-h-[190px] relative overflow-hidden">
                            <img src={currentSingleBanner} alt="Minimal Monograph" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="col-span-5 text-left space-y-1">
                          <span className="text-[8px] font-mono tracking-[0.2em] uppercase text-neutral-400 block">EXHIBITION MONOGRAPH</span>
                          <h5 className="text-xs sm:text-sm font-serif font-light text-neutral-900 line-clamp-2 leading-tight">
                            {gallery.title}
                          </h5>
                          <span className="text-[8px] font-mono tracking-[0.2em] uppercase text-neutral-500 block">— {formattedDate} —</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Banner Info & Action Column */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                          {isMasonry ? 'Masonry 4-Banner Suite' : 'Selected Template'}
                        </span>
                        {isMasonry && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-semibold">
                            4 Photos
                          </span>
                        )}
                      </div>
                      <h5 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                        {activeTemplateInfo?.name}
                      </h5>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {isMasonry
                          ? 'The Masonry template hero uses a bespoke 4-photo botanical mosaic spread. Click any slot below to assign its image.'
                          : activeTemplateInfo?.tagline}
                      </p>
                    </div>

                    {/* Masonry 4-Slot Selector Chips */}
                    {isMasonry && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                          Click Slot to Choose Photo:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {slotLabels.map((lbl, sIdx) => {
                            const isSlotActive = activeMasonrySlot === sIdx;
                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => setActiveMasonrySlot(sIdx)}
                                className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                                  isSlotActive
                                    ? 'bg-amber-400/15 border-amber-400 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400 shadow-sm'
                                    : 'bg-neutral-50 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800">
                                  <img
                                    src={masonryBanners[sIdx]}
                                    alt={lbl}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold truncate">{lbl}</p>
                                  <p className="text-[9px] font-mono text-neutral-400">
                                    {isSlotActive ? 'Editing photo' : 'Select slot'}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      {gallery.templateId !== selectedBannerTemplate && (
                        <button
                          onClick={() => {
                            updateGalleryTemplate(gallery.id, selectedBannerTemplate);
                            showToast(
                              'Template Activated',
                              `Switched active presentation to ${activeTemplateInfo?.name}.`,
                              'success'
                            );
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
                        >
                          Make {activeTemplateInfo?.name} Active
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsUploadModalOpen(true)}
                          className="flex-1 py-2.5 px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload New Shot</span>
                        </button>

                        <Link
                          to={`/gallery/${gallery.slug || gallery.id}?previewTemplate=${selectedBannerTemplate}`}
                          target="_blank"
                          className="py-2.5 px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Preview banner live in client layout"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Live</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Media Selection Grid — Pick image or video according to template */}
            <div className="pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
              {(() => {
                const isCinematic = selectedBannerTemplate === 'cinematic';
                const isMasonry = selectedBannerTemplate === 'masonry';
                const galleryVideos = gallery.media.filter((m) => m.type === 'video');
                const galleryPhotos = gallery.media.filter((m) => m.type !== 'video');

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          {isCinematic ? (
                            <>
                              <Film className="w-3.5 h-3.5 text-amber-500" />
                              <span>Choose Banner Video from Gallery</span>
                              <span className="text-neutral-400 font-normal">
                                ({galleryVideos.length} {galleryVideos.length === 1 ? 'video' : 'videos'})
                              </span>
                            </>
                          ) : isMasonry ? (
                            <>
                              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                Choose Photo for Masonry Slot {activeMasonrySlot + 1} ({
                                  ['Main Focal', 'Top Detail', 'Bottom Detail', 'Right Accent'][activeMasonrySlot]
                                })
                              </span>
                              <span className="text-neutral-400 font-normal">
                                ({galleryPhotos.length} photos)
                              </span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>Choose Banner Photo from Gallery</span>
                              <span className="text-neutral-400 font-normal">
                                ({galleryPhotos.length} photos)
                              </span>
                            </>
                          )}
                        </h5>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {isCinematic
                            ? 'Cinematic layout exclusively supports video reels for its hero screen. Only video media items can be set as the banner.'
                            : isMasonry
                            ? `Click any photo below to assign it to Slot ${activeMasonrySlot + 1} of the 4-photo Masonry hero mosaic.`
                            : `Click any photo below to instantly set it as the hero banner for ${selectedBannerTemplate}.`}
                        </p>
                      </div>

                      {/* Section filter pills if not in video mode or if videos have sections */}
                      {!isCinematic && (() => {
                        const distinctSections = Array.from(
                          new Set(galleryPhotos.map((m) => m.sectionTitle).filter(Boolean) as string[])
                        );
                        if (distinctSections.length === 0) return null;

                        return (
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                            <button
                              onClick={() => setBannerSectionFilter('all')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                                bannerSectionFilter === 'all'
                                  ? 'bg-amber-400 text-neutral-950 font-bold'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              All
                            </button>
                            {distinctSections.map((sec) => (
                              <button
                                key={sec}
                                onClick={() => setBannerSectionFilter(sec)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                  bannerSectionFilter === sec
                                    ? 'bg-amber-400 text-neutral-950 font-bold'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                              >
                                {sec}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* CINEMATIC VIDEO-ONLY PICKER */}
                    {isCinematic ? (
                      <div className="space-y-4">
                        {galleryVideos.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {galleryVideos.map((video) => {
                              const isSelected =
                                (gallery.templateBanners?.['cinematic'] || gallery.coverImage) === video.url;

                              return (
                                <button
                                  key={video.id}
                                  type="button"
                                  onClick={() => {
                                    setTemplateBannerImage(gallery.id, 'cinematic', video.url);
                                    setCoverImage(gallery.id, video.url);
                                    showToast(
                                      'Cinematic Video Banner Set',
                                      `"${video.title}" set as active hero video reel.`,
                                      'success'
                                    );
                                  }}
                                  className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all p-2 bg-neutral-50 dark:bg-neutral-900 cursor-pointer ${
                                    isSelected
                                      ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
                                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                                  }`}
                                >
                                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black mb-2">
                                    <img
                                      src={video.thumbnailUrl || video.url}
                                      alt={video.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                      <span className="w-9 h-9 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Film className="w-4 h-4 ml-0.5" />
                                      </span>
                                    </div>
                                    <div className="absolute top-2 left-2">
                                      <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-mono font-semibold text-amber-400 border border-amber-400/30">
                                        VIDEO REEL
                                      </span>
                                    </div>
                                    {video.duration && (
                                      <div className="absolute bottom-2 right-2">
                                        <span className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                                          {video.duration}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between px-1">
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                                      {video.title}
                                    </p>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[9px] font-bold shrink-0">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                              <Film className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h6 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                No Video Reels in this Gallery Yet
                              </h6>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                                The Cinematic template requires an MP4 motion video reel for its widescreen display. You can select one of our studio presets below or upload a video:
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-1">
                              {DEFAULT_CINEMATIC_VIDEOS.map((vid) => (
                                <button
                                  key={vid.id}
                                  type="button"
                                  onClick={() => {
                                    setTemplateBannerImage(gallery.id, 'cinematic', vid.url);
                                    setCoverImage(gallery.id, vid.url);
                                    showToast('Cinematic Reel Set', `Set "${vid.title}" as cinematic video banner.`, 'success');
                                  }}
                                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-amber-400 transition-all text-left flex items-center gap-3 cursor-pointer group"
                                >
                                  <img src={vid.thumbnailUrl} alt={vid.title} className="w-14 h-10 object-cover rounded-lg shrink-0" />
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate group-hover:text-amber-500">
                                      {vid.title}
                                    </p>
                                    <p className="text-[10px] font-mono text-neutral-400">{vid.duration} • Studio Preset</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* PHOTO SELECTION GRID FOR EDITORIAL, MASONRY, MINIMAL */
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto pr-1 no-scrollbar">
                        {galleryPhotos
                          .filter((m) =>
                            bannerSectionFilter === 'all'
                              ? true
                              : (m.sectionTitle || '').toLowerCase() === bannerSectionFilter.toLowerCase()
                          )
                          .map((item) => {
                            const masonryBanners =
                              gallery.masonryBannerImages && gallery.masonryBannerImages.length >= 4
                                ? gallery.masonryBannerImages
                                : [
                                    gallery.templateBanners?.['masonry'] || gallery.coverImage || gallery.media[0]?.url || '',
                                    gallery.media[1]?.url || gallery.media[0]?.url || '',
                                    gallery.media[2]?.url || gallery.media[0]?.url || '',
                                    gallery.media[3]?.url || gallery.media[0]?.url || '',
                                  ];

                            const isSelectedBanner = isMasonry
                              ? masonryBanners[activeMasonrySlot] === item.url
                              : (gallery.templateBanners?.[selectedBannerTemplate] ||
                                  gallery.coverImage ||
                                  gallery.media[0]?.url) === item.url;

                            const masonrySlotIndex = isMasonry ? masonryBanners.indexOf(item.url) : -1;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (isMasonry) {
                                    setMasonryBannerImage(gallery.id, activeMasonrySlot, item.url);
                                    showToast(
                                      `Slot ${activeMasonrySlot + 1} Updated`,
                                      `Set photo for Masonry Slot ${activeMasonrySlot + 1}.`,
                                      'success'
                                    );
                                  } else {
                                    setTemplateBannerImage(gallery.id, selectedBannerTemplate, item.url);
                                    showToast(
                                      'Banner Image Updated',
                                      `Set new hero banner for ${selectedBannerTemplate.toUpperCase()}.`,
                                      'success'
                                    );
                                  }
                                }}
                                className={`group relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                                  isSelectedBanner
                                    ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.03]'
                                    : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.02]'
                                }`}
                                title={`Select "${item.title}"`}
                              >
                                <img
                                  src={item.thumbnailUrl || item.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  loading="lazy"
                                />

                                {/* Selected Indicator Badge */}
                                {isSelectedBanner && (
                                  <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex flex-col justify-between p-1.5 pointer-events-none">
                                    <span className="self-end p-1 rounded-full bg-amber-400 text-neutral-950 shadow-md">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[8px] font-mono font-bold uppercase truncate">
                                      {isMasonry ? `Slot ${activeMasonrySlot + 1}` : 'Banner'}
                                    </span>
                                  </div>
                                )}

                                {/* If in another masonry slot */}
                                {isMasonry && !isSelectedBanner && masonrySlotIndex >= 0 && (
                                  <div className="absolute top-1 left-1">
                                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-neutral-300 text-[8px] font-mono border border-white/20">
                                      Slot {masonrySlotIndex + 1}
                                    </span>
                                  </div>
                                )}

                                {/* Hover Overlay */}
                                {!isSelectedBanner && (
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                                    <span className="px-2 py-1 rounded-lg bg-amber-400 text-neutral-950 text-[10px] font-bold shadow-md">
                                      {isMasonry ? `Set Slot ${activeMasonrySlot + 1}` : 'Set Banner'}
                                    </span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Section: All 4 Signature Templates */}
          <div className="space-y-4">
            <h4 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
              All Available Gallery Themes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
              {GALLERY_TEMPLATES.map((tpl) => {
                const isSelected = gallery.templateId === tpl.id;
                const templateBanner =
                  gallery.templateBanners?.[tpl.id] || gallery.coverImage || tpl.previewImage;

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
                          src={templateBanner}
                          alt={tpl.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold uppercase text-amber-400">
                          {tpl.badge}
                        </div>
                        {gallery.templateBanners?.[tpl.id] && (
                          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-mono text-amber-300 border border-amber-400/20">
                            Custom Banner Assigned
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
                          {tpl.name}
                        </h4>
                        {isSelected && (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                            Active Template
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mb-2">
                        {tpl.tagline}
                      </p>
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

                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        onClick={() => {
                          updateGalleryTemplate(gallery.id, tpl.id);
                          setSelectedBannerTemplate(tpl.id);
                          showToast('Template Applied', `Switched layout to "${tpl.name}".`, 'success');
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/10'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white'
                        }`}
                      >
                        {isSelected ? 'Currently Active' : `Apply ${tpl.name}`}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBannerTemplate(tpl.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          showToast('Banner Selector', `Ready to change banner for ${tpl.name}.`, 'info');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={`Select banner image for ${tpl.name}`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Select Banner</span>
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

            {/* Link Access Time Window & Expiry */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Link Access Validity & Expiry
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Restrict client viewing and downloading to a specific time period
                    </p>
                  </div>
                </div>

                {/* Status indicator */}
                {(() => {
                  const status = getExpiryStatus(editExpiresAt);
                  if (status.isExpired) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Expired</span>
                      </span>
                    );
                  }
                  if (status.hasExpiry) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span>{status.remainingText}</span>
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Permanent</span>
                    </span>
                  );
                })()}
              </div>

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1.5 font-semibold">
                  Quick Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '24h', label: '24 Hours' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: 'never', label: 'Never (Always Active)' },
                  ].map((preset) => {
                    const status = getExpiryStatus(editExpiresAt);
                    const isSelected =
                      preset.id === 'never' && !status.hasExpiry;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const nextIso = calculateExpiryPreset(preset.id as ExpiryPresetId);
                          setEditExpiresAt(nextIso);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono text-[11px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Time Picker */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
                  Or Set Specific Expiry Date & Time:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={
                      editExpiresAt
                        ? (() => {
                            try {
                              return new Date(editExpiresAt).toISOString().slice(0, 16);
                            } catch {
                              return '';
                            }
                          })()
                        : ''
                    }
                    onChange={(e) => {
                      if (!e.target.value) {
                        setEditExpiresAt(undefined);
                      } else {
                        setEditExpiresAt(new Date(e.target.value).toISOString());
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  {editExpiresAt && (
                    <button
                      type="button"
                      onClick={() => setEditExpiresAt(undefined)}
                      className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {editExpiresAt && (
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Valid until: <strong>{getExpiryStatus(editExpiresAt).humanFormatted}</strong>
                  </span>
                </div>
              )}
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
          galleryTitle={gallery.title}
          gallerySlug={gallery.slug || gallery.id}
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
