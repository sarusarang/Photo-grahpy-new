import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  Share2,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Radio,
  Check,
  ImageIcon,
  BarChart3,
  Layers,
  Settings,
  Loader2,
} from 'lucide-react';
import type { Gallery } from '@/types';
import { formatHeroShootDate } from '../GalleryHeroBanner';

export type GalleryTabType = 'media' | 'analytics' | 'design' | 'settings';

interface GalleryDetailHeaderProps {
  gallery: Gallery;
  activeTab: GalleryTabType;
  onTabChange: (tab: GalleryTabType) => void;
  onOpenUpload: () => void;
  isUploadDisabled?: boolean;
  uploadDisabledReason?: string;
  onOpenShare: () => void;
  isUpdatingStatus: boolean;
  onSetStatus: (status: 'active' | 'delivered') => void;
}

export const GalleryDetailHeader: React.FC<GalleryDetailHeaderProps> = ({
  gallery,
  activeTab,
  onTabChange,
  onOpenUpload,
  isUploadDisabled,
  uploadDisabledReason,
  onOpenShare,
  isUpdatingStatus,
  onSetStatus,
}) => {
  const navigate = useNavigate();
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/gallery')}
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Back to Galleries"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
                Gallery Workspace
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-600">•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{gallery.clientName}</span>
              {gallery.eventDate && (
                <>
                  <span className="text-xs text-neutral-400 dark:text-neutral-600">•</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    {formatHeroShootDate(gallery.eventDate)}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 dark:text-white font-bold tracking-tight mt-0.5">
              {gallery.title}
            </h1>
          </div>
        </div>

        {/* Top Action Buttons: Status Selector, Upload, Share, Preview Client */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Interactive Delivery Status Selector */}
          <div className="relative flex-1 sm:flex-none" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              disabled={isUpdatingStatus}
              className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs select-none active:scale-[0.98] ${
                gallery.status === 'delivered'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              }`}
              title="Click to edit gallery status (Active vs Delivered)"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  Status:
                </span>
                {isUpdatingStatus ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-neutral-600 dark:text-neutral-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Updating...</span>
                  </span>
                ) : gallery.status === 'delivered' ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Delivered</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Active</span>
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${
                  isStatusDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isStatusDropdownOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
                    Edit Gallery Status
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Controls client access stage and gallery filtering
                  </p>
                </div>

                {/* Option: Active */}
                <button
                  type="button"
                  onClick={() => {
                    onSetStatus('active');
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    gallery.status === 'active'
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">Active</span>
                      {gallery.status === 'active' && (
                        <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      Shoot is in progress. Client proofing, favorites, and downloads are active.
                    </p>
                  </div>
                </button>

                {/* Option: Delivered */}
                <button
                  type="button"
                  onClick={() => {
                    onSetStatus('delivered');
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    gallery.status === 'delivered'
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">Delivered</span>
                      {gallery.status === 'delivered' && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      Shoot is complete and delivered. Grouped under the Delivered Galleries tab.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenUpload}
            disabled={isUploadDisabled}
            title={uploadDisabledReason}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md ${
              isUploadDisabled
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-60'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-500/10 active:scale-[0.98] cursor-pointer'
            }`}
          >
            <UploadCloud className="w-4 h-4 stroke-[2.2]" />
            <span>Upload Media</span>
          </button>

          <button
            onClick={onOpenShare}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <a
            href={`https://exshare.ai/gallery/${encodeURIComponent(gallery.slug || gallery.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer active:scale-95"
            title="Open Live Client View (https://exshare.ai)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Client View</span>
          </a>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Smooth Horizontal Swipe on Mobile) */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800/80 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => onTabChange('media')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            activeTab === 'media'
              ? 'bg-amber-400/20 dark:bg-amber-400/15 text-neutral-950 dark:text-white font-bold border-2 border-amber-400 dark:border-amber-400 shadow-sm shadow-amber-400/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 border-2 border-transparent'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Photos & Videos ({gallery.media.length})</span>
        </button>

        <button
          onClick={() => onTabChange('analytics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-amber-400/20 dark:bg-amber-400/15 text-neutral-950 dark:text-white font-bold border-2 border-amber-400 dark:border-amber-400 shadow-sm shadow-amber-400/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 border-2 border-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Analytics</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
            {gallery.viewsCount || 0} views
          </span>
        </button>

        <button
          onClick={() => onTabChange('design')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            activeTab === 'design'
              ? 'bg-amber-400/20 dark:bg-amber-400/15 text-neutral-950 dark:text-white font-bold border-2 border-amber-400 dark:border-amber-400 shadow-sm shadow-amber-400/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 border-2 border-transparent'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Design & Layout ({gallery.templateId})</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-amber-400/20 dark:bg-amber-400/15 text-neutral-950 dark:text-white font-bold border-2 border-amber-400 dark:border-amber-400 shadow-sm shadow-amber-400/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 border-2 border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Gallery Settings</span>
        </button>
      </div>
    </div>
  );
};
