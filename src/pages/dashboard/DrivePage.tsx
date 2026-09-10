import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name' | 'photos'>('date-desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter and sort galleries
  const filteredGalleries = useMemo(() => {
    return galleries
      .filter((gal) => {
        const matchesQuery =
          gal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gal.eventDate.includes(searchQuery);

        const matchesStatus =
          statusFilter === 'all' || gal.status === statusFilter;

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        if (sortBy === 'date-asc') return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'photos') return b.media.length - a.media.length;
        return 0;
      });
  }, [galleries, searchQuery, statusFilter, sortBy]);

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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 1. Master Cloud Drive Hero Banner (Exact match to screenshot) */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200/90 dark:border-neutral-800/80 shadow-sm dark:shadow-lg transition-all min-h-[175px] sm:min-h-[195px] flex items-center bg-gradient-to-r from-[#faf8f5] via-[#f7f4ec] to-[#f2ebde] dark:bg-[#13151b]">
        {/* Background Image: Dark Sony camera vs Light warm aesthetic Sony camera */}
        <div className="absolute inset-0 z-0">
          <img
            src={theme === 'dark' ? '/sony_camera_dark.jpg' : '/sony_camera_light.jpg'}
            alt="Studio Camera Banner"
            className="w-full h-full object-cover object-right opacity-95 dark:opacity-85"
          />
          {/* Gradient Overlay to ensure text readability */}
          <div
            className={`absolute inset-0 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-[#0c0d12] via-[#0e1016]/95 to-transparent'
                : 'bg-gradient-to-r from-[#faf8f5] via-[#faf8f5]/92 to-transparent'
            }`}
          />
        </div>

        {/* Banner Content Container */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="max-w-xl">
            <span className="text-[11px] uppercase tracking-widest font-mono font-bold text-amber-700 dark:text-amber-400 block mb-1">
              MASTER CLOUD DRIVE
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-neutral-950 dark:text-white tracking-tight">
              Client Galleries & Media
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed font-normal">
              Manage your high-resolution client shoots, layouts, downloads, and proofing sets.
            </p>
          </div>

          {/* Right Action CTA: Create New Gallery */}
          <div className="flex items-center gap-4 shrink-0">
            {theme === 'light' && (
              <span className="hidden xl:inline text-sm font-serif italic text-neutral-800 tracking-wide font-medium">
                Good Photos Better Stories
              </span>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md shadow-amber-500/15 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
              <span>Create New Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar: Status Filter Pills, Sort Dropdown, View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Left Filter Pills: All, Active, Delivered, Draft */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Sort Dropdown & Layout Buttons */}
        <div className="flex items-center gap-3">
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
                          setSortBy(opt.value as any);
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
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs shadow-sm hover:bg-amber-300"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
          {filteredGalleries.map((gal) => {
            const { photos, videos, sizeMB } = getGalleryStats(gal);

            return (
              <div
                key={gal.id}
                onClick={() => navigate(`/dashboard/drive/${gal.id}`)}
                className="group relative rounded-3xl bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm dark:shadow-xl overflow-hidden cursor-pointer flex flex-col justify-between card-lift fade-up"
              >
                {/* Cover Image Header — Proportionate height */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={gal.coverImage}
                    alt={gal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                  />
                  {/* Bottom dark gradient overlay so text is crystal clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-400/20 shadow-xs">
                      {gal.templateId} layout
                    </span>

                    <div className="flex items-center gap-2">
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
                        className="p-1.5 rounded-full bg-black/75 hover:bg-amber-400 hover:text-neutral-950 text-white backdrop-blur-md transition-colors border border-white/10"
                        title="Share Gallery"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3.5 left-4 right-4 text-white">
                    <p className="text-[11px] text-neutral-300 font-medium tracking-wide drop-shadow-sm">
                      {gal.clientName}
                    </p>
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-white truncate drop-shadow-md mt-0.5">
                      {gal.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Card Stats: Photos, Videos, Size (Exact 3 columns) */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 p-3 grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-800 text-center">
                    <div className="px-2">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono font-semibold">
                        PHOTOS
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {photos}
                      </span>
                    </div>

                    <div className="px-2">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono font-semibold">
                        VIDEOS
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {videos}
                      </span>
                    </div>

                    <div className="px-2">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block font-mono font-semibold">
                        SIZE
                      </span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        {sizeMB} MB
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800/70">
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 text-xs font-mono font-medium">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                      {gal.eventDate}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/gallery/${gal.slug || gal.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                        title="Client View Preview"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={(e) => handleDelete(e, gal)}
                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800/50 transition-colors"
                        title="Delete Gallery"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="rounded-3xl bg-white dark:bg-[#12141a] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-xl">
          <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono font-semibold">
              <tr>
                <th className="py-3.5 px-6">Gallery</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Shoot Date</th>
                <th className="py-3.5 px-4">Media</th>
                <th className="py-3.5 px-4">Storage</th>
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
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-850/60 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img
                        src={gal.coverImage}
                        alt={gal.title}
                        className="w-12 h-9 rounded-lg object-cover ring-1 ring-neutral-200 dark:ring-neutral-700 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-sm truncate max-w-[200px]">
                          {gal.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 font-mono">/gallery/{gal.slug}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-neutral-800 dark:text-neutral-200">
                      {gal.clientName}
                    </td>
                    <td className="py-4 px-4 text-neutral-500 dark:text-neutral-400 font-mono">{gal.eventDate}</td>
                    <td className="py-4 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                      {photos} photos, {videos} videos
                    </td>
                    <td className="py-4 px-4 font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {sizeMB} MB
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 text-[10px] uppercase font-mono font-semibold">
                        {gal.templateId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareGallery(gal);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                          title="Share Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/gallery/${gal.slug || gal.id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                          title="Client View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => handleDelete(e, gal)}
                          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
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
