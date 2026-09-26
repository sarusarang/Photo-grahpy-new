import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitialGalleryCover, handleCoverImageError } from '@/utils/coverImageUtils';
import { useToast } from '../../components/ui/Toast';
import type { Gallery } from '../../types';
import { CreateGalleryModal } from '../../components/gallery/CreateGalleryModal';
import { ShareModal } from '../../components/gallery/ShareModal';
import { DeleteGalleryModal } from '../../components/gallery/DeleteGalleryModal';
import {
  Plus,
  LayoutGrid,
  List,
  Trash2,
  ExternalLink,
  Share2,
  Calendar,
  Lock,
  ArrowUpDown,
  ChevronDown,
  Check,
  X,
  BarChart3,
  Sparkles,
  HardDrive,
  Images,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  useGalleries,
  useDeleteGallery,
  useUpdateGallery,
  useArchiveGallery,
  useRestoreGallery,
} from '@/hooks/useAtelierQueries';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import { normalizeServerGallery } from '@/utils/galleryNormalizer';
import { GalleryGridSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

export const GalleryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'archived'>('all');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name' | 'photos'>('date-desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const planQuota = usePlanQuota();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [dateFilterTab, setDateFilterTab] = useState<'presets' | 'custom'>('presets');
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Gallery target for Delete / Archive Modal
  const [targetGalleryModal, setTargetGalleryModal] = useState<{
    gallery: Gallery;
    mode: 'archive' | 'permanent';
  } | null>(null);
  const [isModalProcessing, setIsModalProcessing] = useState(false);

  // TanStack Query: Live Backend Galleries Sync with backend-driven filtering and sorting
  const {
    data: apiGalleries,
    isLoading: isLoadingGalleries,
    isError: isGalleriesError,
    refetch: refetchGalleries,
  } = useGalleries({
    search: searchQuery.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date_filter: dateFilter !== 'all' ? dateFilter : undefined,
    date_from: dateFilter === 'custom' && customRange.from ? customRange.from : undefined,
    date_to: dateFilter === 'custom' && customRange.to ? customRange.to : undefined,
    sort: sortBy,
  });

  // Query all galleries and dedicated archived list to maintain live, accurate tab counts
  const { data: allUnfilteredGalleries } = useGalleries();
  const { data: archivedGalleriesData } = useGalleries({ status: 'archived' });

  const { mutateAsync: deleteGalleryMutation } = useDeleteGallery();
  const { mutateAsync: updateGalleryMutation } = useUpdateGallery();
  const { mutateAsync: archiveGalleryMutation } = useArchiveGallery();
  const { mutateAsync: restoreGalleryMutation } = useRestoreGallery();

  const handleToggleStatus = async (e: React.MouseEvent, gal: Gallery) => {
    e.stopPropagation();
    const newStatus = gal.status === 'delivered' ? 'active' : 'delivered';
    try {
      await updateGalleryMutation({
        id: gal.id,
        updates: { status: newStatus as any },
      });
      showToast(
        'Status Updated',
        `"${gal.title}" marked as ${newStatus === 'delivered' ? 'Delivered' : 'Active'}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Failed to update gallery status.', 'error');
    }
  };

  // Normalize server galleries strictly from real API response — zero dummy fallbacks
  const effectiveGalleries = useMemo<Gallery[]>(() => {
    if (apiGalleries && Array.isArray(apiGalleries)) {
      return apiGalleries.map((g: any): Gallery => normalizeServerGallery(g));
    }
    return [];
  }, [apiGalleries]);

  const normalizedAllGalleries = useMemo<Gallery[]>(() => {
    if (allUnfilteredGalleries && Array.isArray(allUnfilteredGalleries)) {
      return allUnfilteredGalleries.map((g: any): Gallery => normalizeServerGallery(g));
    }
    return effectiveGalleries;
  }, [allUnfilteredGalleries, effectiveGalleries]);

  // Compute live tab counts with guaranteed real-time accuracy for Archived / Trash
  const counts = useMemo(() => {
    const archivedIds = new Set<string>();

    const recordArchived = (g: any) => {
      if (!g) return;
      const id = String(g.id);
      if (g.status === 'archived') {
        archivedIds.add(id);
      }
    };

    // Check dedicated query for ?status=archived
    if (Array.isArray(archivedGalleriesData)) {
      const hasExplicitNonArchived = archivedGalleriesData.some(
        (g: any) => g.status === 'active' || g.status === 'delivered'
      );
      if (!hasExplicitNonArchived && archivedGalleriesData.length > 0) {
        // Every item returned by backend ?status=archived is an archived gallery
        archivedGalleriesData.forEach((g: any) => archivedIds.add(String(g.id)));
      } else {
        archivedGalleriesData.forEach(recordArchived);
      }
    }

    // Check unfiltered list for any items marked 'archived'
    if (Array.isArray(allUnfilteredGalleries)) {
      allUnfilteredGalleries.forEach(recordArchived);
    }

    // Check currently active query view
    if (Array.isArray(apiGalleries)) {
      if (statusFilter === 'archived') {
        apiGalleries.forEach((g: any) => {
          if (g.status === 'archived' || !g.status) {
            archivedIds.add(String(g.id));
          }
        });
      } else {
        apiGalleries.forEach(recordArchived);
      }
    }

    const archived = archivedIds.size;

    const active = normalizedAllGalleries.filter(
      (g) => (g.status === 'active' || (!g.status && g.status !== 'archived')) && !archivedIds.has(String(g.id))
    ).length;

    const delivered = normalizedAllGalleries.filter(
      (g) => g.status === 'delivered' && !archivedIds.has(String(g.id))
    ).length;

    const allCount = normalizedAllGalleries.filter(
      (g) => g.status !== 'archived' && !archivedIds.has(String(g.id))
    ).length;

    return {
      all: allCount,
      active,
      delivered,
      archived,
    };
  }, [normalizedAllGalleries, allUnfilteredGalleries, archivedGalleriesData, apiGalleries, statusFilter]);

  // Filtered dataset ensuring Archived galleries are isolated strictly to the 'archived' tab
  const filteredGalleries = useMemo(() => {
    if (statusFilter === 'all') {
      return effectiveGalleries.filter((g) => g.status !== 'archived');
    }
    if (statusFilter === 'archived') {
      const direct = effectiveGalleries.filter((g) => g.status === 'archived');
      if (direct.length > 0) return direct;

      if (
        effectiveGalleries.length > 0 &&
        !effectiveGalleries.some((g) => g.status === 'active' || g.status === 'delivered')
      ) {
        return effectiveGalleries;
      }

      if (archivedGalleriesData && Array.isArray(archivedGalleriesData) && archivedGalleriesData.length > 0) {
        return archivedGalleriesData.map((g: any) => normalizeServerGallery(g));
      }

      return normalizedAllGalleries.filter((g) => g.status === 'archived');
    }
    if (statusFilter === 'active') {
      return effectiveGalleries.filter((g) => g.status === 'active');
    }
    if (statusFilter === 'delivered') {
      return effectiveGalleries.filter((g) => g.status === 'delivered');
    }
    return effectiveGalleries;
  }, [effectiveGalleries, statusFilter, archivedGalleriesData, normalizedAllGalleries]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getDateFilterLabel = () => {
    if (dateFilter === 'all') return 'Filter Date';
    if (dateFilter === 'this-year') return 'This Year';
    if (dateFilter === 'last-year') return 'Last Year';
    if (dateFilter === 'last-30-days') return 'Past 30d';
    if (dateFilter === 'last-3-months') return 'Past 3m';
    if (dateFilter === 'last-6-months') return 'Past 6m';
    if (dateFilter.startsWith('year-')) return `Year ${dateFilter.replace('year-', '')}`;
    if (dateFilter === 'custom') {
      if (customRange.from && customRange.to) return `${customRange.from} → ${customRange.to}`;
      if (customRange.from) return `From ${customRange.from}`;
      if (customRange.to) return `Until ${customRange.to}`;
      return 'Custom Range';
    }
    return 'Filter Date';
  };

  const handleOpenArchiveModal = (e: React.MouseEvent, gal: Gallery) => {
    e.stopPropagation();
    setTargetGalleryModal({ gallery: gal, mode: 'archive' });
  };

  const handleOpenPermanentDeleteModal = (e: React.MouseEvent, gal: Gallery) => {
    e.stopPropagation();
    setTargetGalleryModal({ gallery: gal, mode: 'permanent' });
  };

  const handleRestoreGallery = async (e: React.MouseEvent, gal: Gallery) => {
    e.stopPropagation();
    try {
      await restoreGalleryMutation({ id: gal.id, targetStatus: 'active' });
      showToast(
        'Gallery Restored',
        `"${gal.title}" has been restored to your active galleries.`,
        'success'
      );
    } catch (err: any) {
      showToast('Restore Failed', err?.message || 'Failed to restore gallery.', 'error');
    }
  };

  const handleConfirmDeleteOrArchive = async () => {
    if (!targetGalleryModal) return;
    const { gallery, mode } = targetGalleryModal;
    setIsModalProcessing(true);
    try {
      if (mode === 'archive') {
        const res: any = await archiveGalleryMutation(gallery.id);
        console.log('[Gallery Archive API Response]:', res);
        showToast(
          'Moved to Archive',
          `"${gallery.title}" has been moved to Archive / Trash.`,
          'info'
        );
      } else {
        const res: any = await deleteGalleryMutation({ id: gallery.id, permanent: true });
        console.log('[Gallery Permanent Delete API Response]:', res);
        showToast(
          'Gallery Permanently Deleted',
          `"${gallery.title}" and its media have been completely deleted.`,
          'info'
        );
      }
      setTargetGalleryModal(null);
    } catch (err: any) {
      showToast(
        mode === 'archive' ? 'Archive Failed' : 'Delete Failed',
        err?.message || 'Failed to complete action.',
        'error'
      );
    } finally {
      setIsModalProcessing(false);
    }
  };

  const getGalleryStats = (gal: Gallery) => {
    const photos = gal.photosCount ?? gal.media.filter((m) => m.type === 'photo').length;
    const videos = gal.videosCount ?? gal.media.filter((m) => m.type === 'video').length;
    const sizeMB = gal.media.length > 0
      ? Math.round(gal.media.reduce((acc, m) => acc + (m.sizeMB || 5), 0))
      : Math.round((photos * 4.5) + (videos * 25));
    return { photos, videos, sizeMB };
  };

  return (
    <div className="dashboard-container p-4 sm:p-8 max-w-[1440px] mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 1. Master Cloud Drive Hero Banner (Exact match to screenshot) */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200/90 dark:border-neutral-800/80 shadow-sm dark:shadow-lg transition-all min-h-[175px] sm:min-h-[195px] flex items-center bg-gradient-to-r from-[#faf8f5] via-[#f7f4ec] to-[#f2ebde] dark:bg-[#13151b]">
        {/* Background Image: Light warm aesthetic Sony camera */}
        <div className="absolute inset-0 z-0">
          <img
            src="/sony_camera_light.jpg"
            alt="EX SHARE Camera Banner"
            className="w-full h-full object-cover object-right opacity-95 dark:hidden block"
          />
          <img
            src="/sony_camera_dark.jpg"
            alt="EX SHARE Camera Banner"
            className="w-full h-full object-cover object-right opacity-85 hidden dark:block"
          />
          {/* Gradient Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf8f5] via-[#faf8f5]/92 to-transparent dark:from-[#0c0d12] dark:via-[#0e1016]/95" />
        </div>

        {/* Banner Content Container */}
        <div className="relative z-10 p-5 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 w-full">
          <div className="max-w-xl">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-mono font-bold text-amber-700 dark:text-amber-400 block mb-1">
              CLIENT GALLERIES
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-neutral-950 dark:text-white tracking-tight">
              Galleries & Media
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed font-normal">
              Manage your high-resolution client shoots, layouts, downloads, and proofing sets.
            </p>

            {/* Dynamic Plan Usage & Quota Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {planQuota.planName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono">
                <Images className="w-3.5 h-3.5 text-neutral-400" />
                {planQuota.isUnlimitedGalleries
                  ? 'Unlimited Galleries'
                  : `${planQuota.galleriesUsed} / ${planQuota.maxGalleries} Galleries (${planQuota.galleriesRemaining} remaining)`}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono">
                <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                {planQuota.storageUsedGB} GB of {planQuota.storageLimitGB} GB ({planQuota.storageUsedPercent}%)
              </span>
            </div>
          </div>

          {/* Right Action CTA: Create New Gallery */}
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                if (!planQuota.canCreateGallery) {
                  setIsUpgradeModalOpen(true);
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md shadow-amber-500/15 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
              <span>Create New Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar: Status Filter Pills, Sort Dropdown, View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left Filter Pills: All, Active, Delivered, Archive / Trash */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'active', label: `Active (${counts.active})` },
            { id: 'delivered', label: `Delivered (${counts.delivered})` },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-neutral-100 dark:bg-neutral-900/60 sm:bg-transparent border border-neutral-200/60 dark:border-neutral-800/60 sm:border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1 shrink-0" />

          {/* Dedicated Archive / Trash Pill with luxury UI & reactive count badge */}
          <button
            onClick={() => setStatusFilter('archived')}
            className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
              statusFilter === 'archived'
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400 font-extrabold'
                : counts.archived > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 border border-amber-500/40 hover:border-amber-400/60 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-neutral-100 dark:bg-neutral-900/60 sm:bg-transparent border border-neutral-200/60 dark:border-neutral-800/60 sm:border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
            title={
              counts.archived > 0
                ? `${counts.archived} archived ${counts.archived === 1 ? 'gallery' : 'galleries'} in trash • Automatically deleted after 15 days`
                : 'Archive & Trash Storage (Items auto-deleted after 15 days)'
            }
          >
            {/* Live Indicator Dot when items are waiting in trash */}
            {counts.archived > 0 && statusFilter !== 'archived' && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}

            <Trash2
              className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0 ${
                statusFilter === 'archived'
                  ? 'text-neutral-950 stroke-[2.4]'
                  : counts.archived > 0
                  ? 'text-amber-500 dark:text-amber-400 stroke-[2.2]'
                  : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
              }`}
            />

            <span>Archive / Trash</span>

            {/* If there is an archived gallery, show the number with luxury badge */}
            {counts.archived > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono font-bold tracking-tight transition-all duration-200 ${
                  statusFilter === 'archived'
                    ? 'bg-neutral-950 text-amber-400 shadow-xs'
                    : 'bg-amber-500/25 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {counts.archived}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls: Date Filter, Sort Dropdown & Layout Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
          {/* Custom Date Filter Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setDateDropdownOpen((p) => !p)}
              className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all shadow-xs cursor-pointer ${
                dateFilter !== 'all'
                  ? 'bg-amber-400/10 border-amber-400/60 text-amber-500 dark:text-amber-300 ring-1 ring-amber-400/20'
                  : 'bg-white dark:bg-[#12141a] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-300 dark:hover:border-amber-700'
              }`}
              title="Filter galleries by date"
            >
              <Calendar className={`w-3.5 h-3.5 shrink-0 ${dateFilter !== 'all' ? 'text-amber-400' : ''}`} />
              <span className="whitespace-nowrap">{getDateFilterLabel()}</span>
              {dateFilter !== 'all' && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateFilter('all');
                    setCustomRange({ from: '', to: '' });
                  }}
                  className="p-0.5 hover:bg-neutral-800/50 rounded-full transition-colors cursor-pointer text-neutral-400 hover:text-white"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 text-neutral-400 ${
                  dateDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 z-50 rounded-2xl bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-neutral-800/90 shadow-2xl dark:shadow-black/70 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-900 dark:text-neutral-100 p-2.5">
                {/* 2-Tab Segmented Switcher: Presets vs Custom */}
                <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 text-xs mb-2">
                  <button
                    type="button"
                    onClick={() => setDateFilterTab('presets')}
                    className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                      dateFilterTab === 'presets'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterTab('custom')}
                    className={`flex-1 py-1 px-2.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                      dateFilterTab === 'custom'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>

                {/* Tab 1: Presets View */}
                {dateFilterTab === 'presets' ? (
                  <div className="space-y-0.5">
                    {[
                      { id: 'all', label: 'All Dates' },
                      { id: 'this-year', label: `This Year (${new Date().getFullYear()})` },
                      { id: 'last-30-days', label: 'Past 30 Days' },
                      { id: 'last-3-months', label: 'Past 3 Months' },
                      { id: 'last-year', label: `Last Year (${new Date().getFullYear() - 1})` },
                    ].map((opt) => {
                      const isSelected = dateFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setDateFilter(opt.id);
                            setDateDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400/15 text-amber-500 dark:text-amber-300 font-semibold border border-amber-400/30'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-950 dark:hover:text-white'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Tab 2: Custom Date Range Inputs */
                  <div className="p-1 space-y-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={customRange.from}
                        onChange={(e) =>
                          setCustomRange((prev) => ({ ...prev, from: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={customRange.to}
                        onChange={(e) =>
                          setCustomRange((prev) => ({ ...prev, to: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (customRange.from || customRange.to) {
                          setDateFilter('custom');
                          setDateDropdownOpen(false);
                        }
                      }}
                      className="w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      Apply Range
                    </button>
                  </div>
                )}

                {/* Reset link if filter is active */}
                {dateFilter !== 'all' && (
                  <div className="pt-1.5 mt-1.5 border-t border-neutral-100 dark:border-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter('all');
                        setCustomRange({ from: '', to: '' });
                        setDateDropdownOpen(false);
                      }}
                      className="w-full py-1 text-[11px] font-medium text-neutral-400 hover:text-rose-400 text-center transition-colors cursor-pointer"
                    >
                      Reset to All Dates
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setSortDropdownOpen((p) => !p)}
              className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all shadow-xs ${
                sortDropdownOpen
                  ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-amber-200 dark:shadow-amber-900/30'
                  : 'bg-white dark:bg-[#12141a] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-300 dark:hover:border-amber-700'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                {sortBy === 'date-desc' && 'Newest First'}
                {sortBy === 'date-asc' && 'Oldest First'}
                {sortBy === 'name' && 'Alphabetical'}
                {sortBy === 'photos' && 'Most Media'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  sortDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 z-50 rounded-2xl bg-white dark:bg-[#14161f] border border-neutral-200 dark:border-neutral-800 shadow-2xl dark:shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-1.5 space-y-0.5">
                  {[
                    { value: 'date-desc', label: 'Newest First', icon: '↓' },
                    { value: 'date-asc', label: 'Oldest First', icon: '↑' },
                    { value: 'name', label: 'Alphabetical (A–Z)', icon: 'Az' },
                    { value: 'photos', label: 'Most Media', icon: '#' },
                  ].map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value as typeof sortBy);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-950 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[11px] font-mono w-5 text-center rounded-md py-0.5 ${
                            isSelected
                              ? 'bg-amber-300/60 text-neutral-950'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                          }`}>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'border-2 border-amber-400 bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'border-2 border-amber-400 bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Galleries Display */}
      {statusFilter === 'archived' && (
        <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/80 dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
              <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 text-xs">
              <span className="font-bold text-neutral-900 dark:text-white">Archive & Trash</span>
              <span className="text-neutral-400 dark:text-neutral-600 hidden sm:inline">•</span>
              <span className="text-neutral-600 dark:text-neutral-400">
                Hidden from client access and automatically permanently deleted after 15 days.
              </span>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('all')}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700/80 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Back to Active</span>
          </button>
        </div>
      )}

      {isLoadingGalleries ? (
        <GalleryGridSkeleton count={6} />
      ) : isGalleriesError ? (
        <ErrorState
          title="Failed to Load Galleries"
          message="Could not connect to the remote photo repository. Please check your network connection or API tunnel."
          onRetry={() => refetchGalleries()}
        />
      ) : filteredGalleries.length === 0 ? (
        <EmptyState
          icon={statusFilter === 'archived' ? Trash2 : LayoutGrid}
          title={
            statusFilter === 'archived'
              ? 'Archive & Trash is Empty'
              : effectiveGalleries.length === 0
              ? 'No client galleries created yet'
              : 'No galleries match your search criteria'
          }
          description={
            statusFilter === 'archived'
              ? 'No galleries are currently in Archive / Trash. When you delete a gallery from your active galleries, it is placed here first and kept for 15 days before being automatically permanently deleted.'
              : effectiveGalleries.length === 0
              ? 'Create your first private client gallery to deliver high-resolution photos, stories, and proofs.'
              : 'Try adjusting your search terms, date filters, or status tab.'
          }
          actionLabel={statusFilter === 'archived' ? 'Back to All Galleries' : 'Create Gallery'}
          onAction={
            statusFilter === 'archived'
              ? () => setStatusFilter('all')
              : () => setIsCreateModalOpen(true)
          }
          secondaryLabel={effectiveGalleries.length > 0 && statusFilter !== 'archived' ? 'Reset Filters' : undefined}
          onSecondaryAction={
            effectiveGalleries.length > 0 && statusFilter !== 'archived'
              ? () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setCustomRange({ from: '', to: '' });
                }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 stagger">
          {filteredGalleries.map((gal) => {
            const { photos, videos, sizeMB } = getGalleryStats(gal);

            return (
              <div
                key={gal.id}
                onClick={() => navigate(`/dashboard/gallery/${gal.id}`)}
                className="group relative rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm dark:shadow-xl overflow-hidden cursor-pointer flex flex-col justify-between card-lift fade-up"
              >
                {/* Cover Image Header — Proportionate height for 3-card layout */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={gal.coverImage || getInitialGalleryCover(gal.templateId)}
                    alt=""
                    loading="lazy"
                    onError={(e) => handleCoverImageError(e, getInitialGalleryCover(gal.templateId))}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                  />
                  {/* Bottom dark gradient overlay so text is crystal clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-400/20 shadow-xs">
                        {gal.templateId} layout
                      </span>

                      {/* Interactive Status Switcher Button */}
                      {gal.status === 'archived' ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-600/90 text-white backdrop-blur-md border border-rose-400/50 shadow-xs"
                          title="Archived: Automatically deleted after 15 days unless restored"
                        >
                          <Trash2 className="w-3 h-3 text-rose-100" />
                          <span>Archived (15d)</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(e, gal)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border cursor-pointer transition-all shadow-xs hover:scale-105 active:scale-95 ${
                            gal.status === 'delivered'
                              ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/60 shadow-emerald-900/30'
                              : 'bg-neutral-900/90 hover:bg-neutral-900 text-amber-300 border-amber-400/40 shadow-amber-900/20'
                          }`}
                          title={`Status: ${gal.status}. Click to change to ${gal.status === 'delivered' ? 'Active' : 'Delivered'}`}
                        >
                          {gal.status === 'delivered' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                              <span>Delivered</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Active</span>
                            </>
                          )}
                          <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {gal.isPasswordProtected && (
                        <span
                          className="p-1.5 rounded-full bg-black/75 backdrop-blur-md text-amber-400 border border-white/10"
                          title="Password Protected"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareGallery(gal);
                        }}
                        className="p-1.5 rounded-full bg-black/75 hover:bg-amber-400 hover:text-neutral-950 text-white backdrop-blur-md transition-colors border border-white/10 cursor-pointer"
                        title="Share Gallery"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <p className="text-[11px] text-neutral-300 font-medium tracking-wide drop-shadow-sm truncate">
                      {gal.clientName}
                    </p>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-white truncate drop-shadow-md mt-0.5">
                      {gal.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="p-3.5 sm:p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  {/* Card Stats: Photos, Videos, Size (3 compact balanced columns) */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 p-2.5 grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-800 text-center">
                    <div className="px-1">
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono font-semibold">
                        PHOTOS
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        {photos}
                      </span>
                    </div>

                    <div className="px-1">
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono font-semibold">
                        VIDEOS
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        {videos}
                      </span>
                    </div>

                    <div className="px-1">
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono font-semibold">
                        SIZE
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                        {sizeMB} MB
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="flex items-center justify-between text-xs pt-2.5 border-t border-neutral-100 dark:border-neutral-800/70">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/gallery/${gal.id}?tab=analytics`);
                      }}
                      className="text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer group/stat"
                      title="View Gallery Analytics"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-amber-500 group-hover/stat:scale-110 transition-transform" />
                      <span>{gal.viewsCount || 0} views</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {gal.status === 'archived' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleRestoreGallery(e, gal)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400 text-amber-700 dark:text-amber-300 hover:text-neutral-950 border border-amber-400/30 text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Restore gallery to Active Galleries"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenPermanentDeleteModal(e, gal)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Permanently Delete Gallery"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleToggleStatus(e, gal)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              gal.status === 'delivered'
                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10'
                            }`}
                            title={gal.status === 'delivered' ? 'Status: Delivered (Click to mark Active)' : 'Status: Active (Click to mark Delivered)'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/gallery/${gal.id}?tab=analytics`);
                            }}
                            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Gallery Analytics"
                          >
                            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          <a
                            href={`https://exshare.ai/gallery/${encodeURIComponent(gal.slug || gal.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
                            title="Client View Preview (https://exshare.ai)"
                          >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </a>

                          <button
                            onClick={(e) => handleOpenArchiveModal(e, gal)}
                            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                            title="Move to Archive / Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar shadow-sm dark:shadow-xl">
          <table className="w-full min-w-[680px] text-left text-xs text-neutral-700 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono font-semibold">
              <tr>
                <th className="py-3.5 px-6">Gallery</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Shoot Date</th>
                <th className="py-3.5 px-4">Media</th>
                <th className="py-3.5 px-4">Storage</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Design</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
              {filteredGalleries.map((gal) => {
                const { photos, videos, sizeMB } = getGalleryStats(gal);
                return (
                  <tr
                    key={gal.id}
                    onClick={() => navigate(`/dashboard/gallery/${gal.id}`)}
                    className="group hover:bg-neutral-100/80 dark:hover:bg-[#1a1c24] cursor-pointer transition-all duration-200"
                  >
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="relative overflow-hidden rounded-lg w-12 h-9 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700/80 group-hover:ring-amber-400/50 transition-all bg-neutral-900">
                        <img
                          src={gal.coverImage || getInitialGalleryCover(gal.templateId)}
                          alt=""
                          loading="lazy"
                          onError={(e) => handleCoverImageError(e, getInitialGalleryCover(gal.templateId))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm truncate max-w-[200px] group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          {gal.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                          exshare.ai/gallery/{gal.slug || gal.id}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                      {gal.clientName}
                    </td>
                    <td className="py-4 px-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 font-mono text-xs transition-colors">
                      {gal.eventDate}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                      {photos} photos, {videos} videos
                    </td>
                    <td className="py-4 px-4 font-mono text-amber-600 dark:text-amber-400 group-hover:text-amber-500 font-bold text-xs transition-colors">
                      {sizeMB} MB
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/gallery/${gal.id}?tab=analytics`);
                        }}
                        className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold cursor-pointer"
                        title="View Gallery Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{gal.viewsCount || 0}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 text-[10px] uppercase font-mono font-semibold border border-transparent group-hover:border-amber-400/40 group-hover:bg-neutral-200/80 dark:group-hover:bg-neutral-700/60 transition-all">
                        {gal.templateId}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {gal.status === 'archived' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          title="Archived: Automatically deleted after 15 days unless restored"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Archived (15d)</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(e, gal)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider border cursor-pointer transition-all shadow-xs hover:scale-105 active:scale-95 ${
                            gal.status === 'delivered'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                          title={`Click to mark as ${gal.status === 'delivered' ? 'Active' : 'Delivered'}`}
                        >
                          {gal.status === 'delivered' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Delivered</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Active</span>
                            </>
                          )}
                          <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {gal.status === 'archived' ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRestoreGallery(e, gal)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400 text-amber-700 dark:text-amber-300 hover:text-neutral-950 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer"
                              title="Restore gallery to Active Galleries"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenPermanentDeleteModal(e, gal)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/gallery/${gal.id}?tab=analytics`);
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 hover:!text-amber-500 dark:hover:!text-amber-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                              title="Gallery Analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareGallery(gal);
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 hover:!text-amber-500 dark:hover:!text-amber-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                              title="Share Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <a
                              href={`https://exshare.ai/gallery/${encodeURIComponent(gal.slug || gal.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 hover:!text-black dark:hover:!text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                              title="Client View (https://exshare.ai)"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={(e) => handleOpenArchiveModal(e, gal)}
                              className="p-1.5 rounded-lg text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 hover:!text-rose-600 dark:hover:!text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Move to Archive / Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Share Modal */}
      {shareGallery && (
        <ShareModal
          isOpen={Boolean(shareGallery)}
          onClose={() => setShareGallery(null)}
          gallery={shareGallery}
        />
      )}

      {/* Create Modal */}
      <CreateGalleryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newGal) => {
          navigate(`/dashboard/gallery/${newGal.id}`);
        }}
      />

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        errorCode="GALLERY_LIMIT_EXCEEDED"
        lockedFeature="Client Galleries"
        errorMessage={`Your ${planQuota.planName} has reached the limit of ${planQuota.maxGalleries} active client galleries. Upgrade to unlock more client galleries and higher storage.`}
      />

      {/* Delete / Archive Confirmation Modal */}
      <DeleteGalleryModal
        isOpen={Boolean(targetGalleryModal)}
        onClose={() => !isModalProcessing && setTargetGalleryModal(null)}
        onConfirm={handleConfirmDeleteOrArchive}
        gallery={targetGalleryModal?.gallery || null}
        mode={targetGalleryModal?.mode || 'archive'}
        isProcessing={isModalProcessing}
      />
    </div>
  );
};

export const DrivePage = GalleryPage;
export default GalleryPage;
