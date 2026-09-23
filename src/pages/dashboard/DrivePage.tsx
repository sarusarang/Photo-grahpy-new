import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import type { Gallery } from '../../types';
import { CreateGalleryModal } from '../../components/gallery/CreateGalleryModal';
import { ShareModal } from '../../components/gallery/ShareModal';
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
} from 'lucide-react';

export const DrivePage: React.FC = () => {
  const {
    galleries,
    deleteGallery,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useGallery();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name' | 'photos'>('date-desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [dateFilterTab, setDateFilterTab] = useState<'presets' | 'custom'>('presets');
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

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

  // Filter and sort galleries
  const filteredGalleries = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
    const halfYearAgo = now - 180 * 24 * 60 * 60 * 1000;
    const currentYear = new Date(now).getFullYear().toString();
    const lastYear = (new Date(now).getFullYear() - 1).toString();

    return galleries
      .filter((gal) => {
        const matchesQuery =
          gal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gal.eventDate.includes(searchQuery);

        const matchesStatus =
          statusFilter === 'all' || gal.status === statusFilter;

        // Date filter matching
        let matchesDate = true;
        if (dateFilter === 'this-year') {
          matchesDate = gal.eventDate.startsWith(currentYear);
        } else if (dateFilter === 'last-year') {
          matchesDate = gal.eventDate.startsWith(lastYear);
        } else if (dateFilter === 'last-30-days') {
          const galleryTime = new Date(gal.eventDate).getTime();
          matchesDate = galleryTime >= thirtyDaysAgo;
        } else if (dateFilter === 'last-3-months') {
          const galleryTime = new Date(gal.eventDate).getTime();
          matchesDate = galleryTime >= ninetyDaysAgo;
        } else if (dateFilter === 'last-6-months') {
          const galleryTime = new Date(gal.eventDate).getTime();
          matchesDate = galleryTime >= halfYearAgo;
        } else if (dateFilter.startsWith('year-')) {
          const targetYear = dateFilter.replace('year-', '');
          matchesDate = gal.eventDate.startsWith(targetYear);
        } else if (dateFilter === 'custom') {
          if (customRange.from && gal.eventDate < customRange.from) matchesDate = false;
          if (customRange.to && gal.eventDate > customRange.to) matchesDate = false;
        }

        return matchesQuery && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        if (sortBy === 'date-asc') return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'photos') return b.media.length - a.media.length;
        return 0;
      });
  }, [galleries, searchQuery, statusFilter, sortBy, dateFilter, customRange]);

  const handleDelete = (e: React.MouseEvent, gal: Gallery) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${gal.title}"? This cannot be undone.`)) {
      deleteGallery(gal.id);
      showToast('Gallery Deleted', `"${gal.title}" has been permanently removed.`, 'info');
    }
  };

  const getGalleryStats = (gal: Gallery) => {
    const photos = gal.media.filter((m) => m.type === 'photo').length;
    const videos = gal.media.filter((m) => m.type === 'video').length;
    const sizeMB = Math.round(gal.media.reduce((acc, m) => acc + (m.sizeMB || 5), 0));
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
              MASTER CLOUD DRIVE
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-neutral-950 dark:text-white tracking-tight">
              Client Galleries & Media
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed font-normal">
              Manage your high-resolution client shoots, layouts, downloads, and proofing sets.
            </p>
          </div>

          {/* Right Action CTA: Create New Gallery */}
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateModalOpen(true)}
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
        {/* Left Filter Pills: All, Active, Delivered, Draft */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'all', label: `All (${galleries.length})` },
            { id: 'active', label: 'Active' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'draft', label: 'Draft' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
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

      {/* 3. Galleries Display (2-Column Grid matching screenshot) */}
      {filteredGalleries.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
          <p className="text-base text-neutral-800 dark:text-neutral-200 font-semibold">
            No galleries match your search criteria.
          </p>
          <p className="text-xs text-neutral-500">Try clearing search or filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDateFilter('all');
              setCustomRange({ from: '', to: '' });
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs shadow-sm hover:bg-amber-300 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 stagger">
          {filteredGalleries.map((gal) => {
            const { photos, videos, sizeMB } = getGalleryStats(gal);

            return (
              <div
                key={gal.id}
                onClick={() => navigate(`/dashboard/drive/${gal.id}`)}
                className="group relative rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm dark:shadow-xl overflow-hidden cursor-pointer flex flex-col justify-between card-lift fade-up"
              >
                {/* Cover Image Header — Proportionate height for 3-card layout */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={gal.coverImage}
                    alt={gal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                  />
                  {/* Bottom dark gradient overlay so text is crystal clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-400/20 shadow-xs">
                      {gal.templateId} layout
                    </span>

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
                        navigate(`/dashboard/drive/${gal.id}?tab=analytics`);
                      }}
                      className="text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-medium transition-colors cursor-pointer group/stat"
                      title="View Gallery Analytics"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-amber-500 group-hover/stat:scale-110 transition-transform" />
                      <span>{gal.viewsCount || 0} views</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/drive/${gal.id}?tab=analytics`);
                        }}
                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Gallery Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <Link
                        to={`/gallery/${gal.slug || gal.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
                        title="Client View Preview"
                      >
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Link>

                      <button
                        onClick={(e) => handleDelete(e, gal)}
                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                        title="Delete Gallery"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
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
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
              {filteredGalleries.map((gal) => {
                const { photos, videos, sizeMB } = getGalleryStats(gal);
                return (
                  <tr
                    key={gal.id}
                    onClick={() => navigate(`/dashboard/drive/${gal.id}`)}
                    className="group hover:bg-neutral-100/80 dark:hover:bg-[#1a1c24] cursor-pointer transition-all duration-200"
                  >
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="relative overflow-hidden rounded-lg w-12 h-9 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700/80 group-hover:ring-amber-400/50 transition-all">
                        <img
                          src={gal.coverImage}
                          alt={gal.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm truncate max-w-[200px] group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          {gal.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                          /gallery/{gal.slug}
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
                    <td className="py-4 px-4 font-mono text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/drive/${gal.id}?tab=analytics`);
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
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/drive/${gal.id}?tab=analytics`);
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
                        <Link
                          to={`/gallery/${gal.slug || gal.id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 hover:!text-black dark:hover:!text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                          title="Client View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => handleDelete(e, gal)}
                          className="p-1.5 rounded-lg text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 hover:!text-rose-600 dark:hover:!text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          navigate(`/dashboard/drive/${newGal.id}`);
        }}
      />
    </div>
  );
};
