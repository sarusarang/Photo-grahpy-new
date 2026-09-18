import React, { useRef } from 'react';
import type { PortfolioProject } from '../../types/portfolio';
import {
  Camera,
  Trash2,
  UploadCloud,
  Tag,
  Calendar,
  MapPin,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

interface PortfolioWorkCardProps {
  project: PortfolioProject;
  index: number;
  onUpdate: (id: string, updates: Partial<PortfolioProject>) => void;
  onDelete: (id: string) => void;
}

export const PortfolioWorkCard: React.FC<PortfolioWorkCardProps> = ({
  project,
  index,
  onUpdate,
  onDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onUpdate(project.id, { coverUrl: result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formattedIndex = `#${(index + 1).toString().padStart(2, '0')}`;

  return (
    <div className="group relative rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#13141b] shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40 dark:hover:border-neutral-700 transition-all duration-300 overflow-hidden flex flex-col">
      {/* ─── HERO COVER IMAGE SECTION ─── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
        {project.coverUrl ? (
          <img
            src={project.coverUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900 text-neutral-500">
            <ImageIcon className="w-8 h-8 stroke-1 text-neutral-600" />
            <span className="text-xs">No cover image</span>
          </div>
        )}

        {/* Ambient Gradients for Badge Contrast */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-2">
          {/* Index & Category Pill */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-amber-400 font-mono text-[11px] font-bold shadow-sm">
              {formattedIndex}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-neutral-200 text-[10px] uppercase font-bold tracking-wider shadow-sm">
              {project.category}
            </span>
          </div>

          {/* Quick Glass Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-neutral-200 hover:text-amber-400 hover:bg-black/90 transition-all cursor-pointer shadow-sm"
              title="Change cover photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(project.id)}
              className="p-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-neutral-300 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm"
              title="Remove work"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Stats */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-center justify-between text-[11px]">
          {project.mediaCount ? (
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-neutral-300 text-[10px] font-mono flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-amber-400" />
              {project.mediaCount} Photos
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-neutral-400 text-[10px] font-mono">
              Cover Frame
            </span>
          )}

          {project.gallerySlug && (
            <span className="text-[10px] font-mono text-amber-300/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15">
              Drive Synced
            </span>
          )}
        </div>

        {/* Hover Center Overlay */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
        >
          <span className="px-3.5 py-1.5 rounded-xl bg-white text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all">
            <UploadCloud className="w-4 h-4 text-neutral-900" />
            Change Cover
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ─── CARD DETAILS & METADATA SECTION ─── */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Title Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Project Title
            </label>
          </div>
          <input
            type="text"
            value={project.title}
            onChange={(e) => onUpdate(project.id, { title: e.target.value })}
            placeholder="e.g. Royal Palace Udaipur"
            className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-all"
          />
        </div>

        {/* Category & Year */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Category
            </label>
            <div className="relative">
              <select
                value={project.category}
                onChange={(e) => onUpdate(project.id, { category: e.target.value as any })}
                className="w-full pl-7 pr-6 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-all appearance-none cursor-pointer capitalize"
              >
                <option value="weddings">Weddings</option>
                <option value="editorial">Editorial</option>
                <option value="pre-wedding">Pre-Wedding</option>
                <option value="commercial">Commercial</option>
                <option value="portrait">Portrait</option>
                <option value="cinematic">Cinematic</option>
              </select>
              <Tag className="w-3 h-3 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Year
            </label>
            <div className="relative">
              <input
                type="text"
                value={project.year}
                onChange={(e) => onUpdate(project.id, { year: e.target.value })}
                placeholder="2026"
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-all"
              />
              <Calendar className="w-3 h-3 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Location / Venue */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Location / Venue
          </label>
          <div className="relative">
            <input
              type="text"
              value={project.location}
              onChange={(e) => onUpdate(project.id, { location: e.target.value })}
              placeholder="Location or venue..."
              className="w-full pl-7 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-all"
            />
            <MapPin className="w-3 h-3 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ─── CARD FOOTER STATUS STRIP ─── */}
        <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Featured in Showcase</span>
          </div>

          {project.gallerySlug ? (
            <a
              href={`/gallery/${project.gallerySlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors text-[10px]"
            >
              <span>View Client Gallery</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[10px] text-neutral-400 font-mono">3:2 Preview</span>
          )}
        </div>
      </div>
    </div>
  );
};
