import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FolderKanban,
  Check,
  Plus,
  Tag,
  ArrowRight,
  FolderPlus,
  Sparkles,
  Layers,
  CheckCheck,
} from 'lucide-react';
import type { LiveEvent } from '../../types/event';
import { useEvent } from '../../context/EventContext';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import { useNavigate } from 'react-router-dom';

interface MoveToGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
}

const DEFAULT_CATEGORY_PRESETS = [
  'CEREMONY',
  'HALDI',
  'SANGEET',
  'RECEPTION',
  'PORTRAITS',
  'CANDIDS',
  'BEGRUTA EDITED',
  'DETAILS',
];

export const MoveToGalleryModal: React.FC<MoveToGalleryModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { moveEventToGallery } = useEvent();
  const { galleries } = useGallery();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Target Mode: 'new' or 'existing'
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new');
  const [newGalleryTitle, setNewGalleryTitle] = useState(event.title);
  const [selectedExistingGalleryId, setSelectedExistingGalleryId] = useState(
    galleries[0]?.id || ''
  );

  // Category titles available (presets + custom ones added)
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    const fromEvent = event.media.map((m) => m.sectionTitle).filter(Boolean) as string[];
    const merged = Array.from(new Set([...fromEvent, ...DEFAULT_CATEGORY_PRESETS]));
    return merged.map((c) => c.toUpperCase());
  });

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCustomInput, setShowAddCustomInput] = useState(false);

  // Photo assignments: mediaId -> sectionTitle
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    event.media.forEach((m) => {
      initial[m.id] = (m.sectionTitle || 'CEREMONY').toUpperCase();
    });
    return initial;
  });

  // Selected media IDs for batch categorization
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

  // Filter view: 'all' | 'unassigned' | or specific category
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Toggle selection for an item
  const toggleSelect = (id: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedMediaIds(new Set(event.media.map((m) => m.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMediaIds(new Set());
  };

  // Add a new custom category title
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!availableCategories.includes(trimmed)) {
      setAvailableCategories((prev) => [...prev, trimmed]);
    }
    // If photos are selected, assign immediately
    if (selectedMediaIds.size > 0) {
      applyCategoryToSelected(trimmed);
    }
    setNewCategoryInput('');
    setShowAddCustomInput(false);
    showToast('Category Added', `Created "${trimmed}" category title.`, 'info');
  };

  // Assign a category to all currently selected photos
  const applyCategoryToSelected = (categoryTitle: string) => {
    if (selectedMediaIds.size === 0) {
      showToast('Select Photos First', 'Click or tap photos below to assign them to this category.', 'info');
      return;
    }

    setAssignments((prev) => {
      const next = { ...prev };
      selectedMediaIds.forEach((id) => {
        next[id] = categoryTitle.toUpperCase();
      });
      return next;
    });

    showToast(
      'Photos Categorized',
      `Assigned ${selectedMediaIds.size} photo(s) to "${categoryTitle.toUpperCase()}".`,
      'success'
    );
    setSelectedMediaIds(new Set());
  };

  // Filtered media list based on category filter
  const displayedMedia = useMemo(() => {
    if (activeCategoryFilter === 'all') return event.media;
    if (activeCategoryFilter === 'unassigned') {
      return event.media.filter((m) => !assignments[m.id]);
    }
    return event.media.filter((m) => assignments[m.id] === activeCategoryFilter);
  }, [event.media, activeCategoryFilter, assignments]);

  // Statistics by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    event.media.forEach((m) => {
      const cat = assignments[m.id] || 'UNASSIGNED';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [event.media, assignments]);

  const assignedSectionsList = useMemo(() => {
    return Array.from(new Set(Object.values(assignments).filter(Boolean)));
  }, [assignments]);

  // Execute Move to Gallery
  const handleConfirmMove = () => {
    if (event.media.length === 0) {
      showToast('No Photos', 'This event has no photos to move.', 'error');
      return;
    }

    const createdGallery = moveEventToGallery(
      event.id,
      targetMode,
      targetMode === 'existing' ? selectedExistingGalleryId : undefined,
      assignments,
      newGalleryTitle
    );

    showToast(
      'Moved to Studio Drive',
      `Event successfully archived and published into "${
        createdGallery?.title || newGalleryTitle
      }" with ${assignedSectionsList.length} categories.`,
      'success'
    );

    onClose();

    if (createdGallery?.id) {
      navigate(`/dashboard/drive/${createdGallery.id}`);
    }
  };

  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white dark:bg-[#101116] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl rounded-3xl my-auto modal-animate max-h-[min(92vh,840px)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Studio Drive Integration
              </span>
              <h3 className="text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Move Event to Gallery & Categorize Photos
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Step 1: Destination Gallery Selection */}
          <div className="bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>1. Choose Gallery Destination</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Create New Gallery */}
              <button
                type="button"
                onClick={() => setTargetMode('new')}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  targetMode === 'new'
                    ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Create New Gallery
                  </span>
                  {targetMode === 'new' && <Check className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Create Fresh Collection</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Creates a dedicated client proofing gallery in Studio Drive.
                </p>
              </button>

              {/* Option B: Merge into Existing Gallery */}
              <button
                type="button"
                onClick={() => setTargetMode('existing')}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  targetMode === 'existing'
                    ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Merge Into Existing
                  </span>
                  {targetMode === 'existing' && <Check className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Append to Drive Collection</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Adds these photos into an existing client drive folder.
                </p>
              </button>
            </div>

            {/* Input for New Gallery Name or Dropdown for Existing */}
            {targetMode === 'new' ? (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-400 font-medium">Gallery Title in Drive</label>
                <input
                  type="text"
                  value={newGalleryTitle}
                  onChange={(e) => setNewGalleryTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Royal Palace Wedding • Ananya & Kabir"
                />
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-400 font-medium">Select Existing Gallery</label>
                <select
                  value={selectedExistingGalleryId}
                  onChange={(e) => setSelectedExistingGalleryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                >
                  {galleries.map((gal) => (
                    <option key={gal.id} value={gal.id}>
                      {gal.title} ({gal.media.length} photos)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 2: Categorization Workspace */}
          <div className="bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>2. Categorize Event Photos Under Titles</span>
              </span>
              <div className="flex items-center gap-2">
                {selectedMediaIds.size > 0 && (
                  <span className="text-xs font-mono text-amber-700 dark:text-amber-300 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                    {selectedMediaIds.size} Selected
                  </span>
                )}
                <button
                  type="button"
                  onClick={
                    selectedMediaIds.size === event.media.length
                      ? handleDeselectAll
                      : handleSelectAll
                  }
                  className="px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
                >
                  {selectedMediaIds.size === event.media.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Category Assign Buttons (Pills Bar) */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 block">
                Select photos below, then click a category title to assign them:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {availableCategories.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => applyCategoryToSelected(cat)}
                      className="group px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-semibold border border-neutral-200 dark:border-neutral-800 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                      title={`Assign selected photos to ${cat}`}
                    >
                      <span>{cat}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-950 group-hover:text-amber-400 text-neutral-600 dark:text-neutral-400 font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Add Custom Category Trigger */}
                {showAddCustomInput ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. HALDI EDITED"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-amber-400 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none uppercase w-36"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-2.5 py-1 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomInput(false)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCustomInput(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-amber-600 dark:text-amber-400 text-xs font-mono border border-dashed border-amber-500/40 hover:border-amber-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Category Title</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs to View Specific Category */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-900 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategoryFilter === 'all'
                    ? 'bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                All Photos ({event.media.length})
              </button>
              {availableCategories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                      activeCategoryFilter === cat
                        ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-400/30'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Photos Grid with Selection & Category Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
              {displayedMedia.map((item) => {
                const isSelected = selectedMediaIds.has(item.id);
                const assigned = assignments[item.id] || 'UNASSIGNED';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden group border-2 transition-all cursor-pointer bg-neutral-900 ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/60 scale-[1.01]'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Selection Checkbox */}
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                          : 'bg-black/50 text-white/60 border border-white/20 opacity-80 group-hover:opacity-100'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[3]' : 'stroke-2'}`} />
                    </div>

                    {/* Category Title Badge */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="inline-block max-w-full px-2 py-0.5 rounded-md bg-neutral-950/80 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase truncate shadow">
                        {assigned}
                      </span>
                      <p className="text-[10px] text-white/80 font-mono truncate mt-0.5">
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer & Move Action (Fixed Footer) */}
        <div className="p-4 sm:p-6 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-[#101116]/90 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>
              Moving {event.media.length} photos into {assignedSectionsList.length} gallery
              categories
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmMove}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-amber-400/20 cursor-pointer"
            >
              <span>Move to Gallery Drive</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
