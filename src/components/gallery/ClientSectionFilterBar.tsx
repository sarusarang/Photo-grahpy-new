import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Heart,
  Film,
  Camera,
} from 'lucide-react';
import { useLenisScroll } from '../common/SmoothScroll';

export type FilterSelection =
  | { type: 'section'; title: string }
  | { type: 'all' }
  | { type: 'videos' }
  | { type: 'favorites' }
  | { type: 'ai-face' };

interface ClientSectionFilterBarProps {
  sections: string[];
  activeFilter: FilterSelection;
  onSelectFilter: (filter: FilterSelection) => void;
  favoritesCount?: number;
  totalPhotosCount?: number;
  totalVideosCount?: number;
  theme?: 'masonry' | 'editorial' | 'cinematic' | 'minimal';
}

export const ClientSectionFilterBar: React.FC<ClientSectionFilterBarProps> = ({
  sections = [],
  activeFilter,
  onSelectFilter,
  favoritesCount = 0,
  totalPhotosCount = 0,
  totalVideosCount = 0,
  theme = 'masonry',
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isDocked, setIsDocked] = useState(false);

  // Monitor scroll position: dock fixed under navbar when scrolled past initial position
  const checkDockPosition = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    // Top client navbar is ~52px-54px tall. When anchor reaches <= 54px, dock directly under navbar with no gap!
    setIsDocked(rect.top <= 54);
  };

  useLenisScroll(() => {
    checkDockPosition();
  });

  useEffect(() => {
    const handleScroll = () => checkDockPosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    checkDockPosition();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep first 2-3 sections visible in capsule, move others to "More ▾"
  const visibleSections = sections.slice(0, 2);
  const overflowSections = sections.slice(2);
  const hasMore = overflowSections.length > 0 || favoritesCount > 0;

  // Helpers to detect active state
  const isAiFaceActive = activeFilter.type === 'ai-face';
  const isSectionActive = (title: string) =>
    activeFilter.type === 'section' && activeFilter.title.toLowerCase() === title.toLowerCase();

  const isAllActive = activeFilter.type === 'all';
  const isVideosActive = activeFilter.type === 'videos';
  const isFavoritesActive = activeFilter.type === 'favorites';

  // Theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'editorial':
        return {
          container:
            'bg-white/95 text-neutral-900 border-neutral-200/90 shadow-2xl shadow-neutral-950/10 backdrop-blur-xl ring-1 ring-black/5',
          activePill:
            'bg-neutral-950 text-white font-bold shadow-lg shadow-neutral-950/25 scale-[1.02]',
          inactivePill:
            'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 font-medium',
          searchPill:
            'bg-neutral-100/90 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-200/70 border border-neutral-200 font-medium',
          dropdown:
            'bg-white text-neutral-900 border-neutral-200 shadow-2xl ring-1 ring-black/5',
          dropdownItemHover:
            'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950',
          accentBadge:
            'bg-neutral-100 text-neutral-900 font-bold',
        };

      case 'cinematic':
        return {
          container:
            'bg-neutral-950/95 text-neutral-200 border-neutral-800 shadow-2xl shadow-amber-950/25 backdrop-blur-2xl ring-1 ring-white/5',
          activePill:
            'bg-amber-400 text-neutral-950 font-bold shadow-xl shadow-amber-400/25 ring-2 ring-amber-400/50 scale-[1.02]',
          inactivePill:
            'text-neutral-400 hover:text-white hover:bg-neutral-900 font-medium',
          searchPill:
            'bg-neutral-900 text-amber-400 hover:text-amber-300 border border-neutral-800 font-medium',
          dropdown:
            'bg-neutral-950 text-neutral-200 border-neutral-800 shadow-2xl ring-1 ring-white/10',
          dropdownItemHover:
            'hover:bg-neutral-900 text-neutral-300 hover:text-white',
          accentBadge:
            'bg-amber-500/20 text-amber-400 font-bold',
        };

      case 'minimal':
        return {
          container:
            'bg-white/95 text-neutral-900 border-neutral-300 shadow-2xl shadow-neutral-950/10 backdrop-blur-xl',
          activePill:
            'bg-neutral-950 text-white font-bold shadow-md scale-[1.02]',
          inactivePill:
            'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 font-medium',
          searchPill:
            'bg-neutral-100 text-neutral-800 hover:text-neutral-950 border border-neutral-200 font-medium',
          dropdown:
            'bg-white text-neutral-900 border-neutral-200 shadow-2xl',
          dropdownItemHover:
            'hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950',
          accentBadge:
            'bg-neutral-100 text-neutral-900 font-bold',
        };

      case 'masonry':
      default:
        return {
          container:
            'bg-[#0C1311]/95 text-neutral-200 border-emerald-900/60 shadow-2xl shadow-black/70 backdrop-blur-2xl ring-1 ring-emerald-500/10',
          activePill:
            'bg-emerald-500 text-neutral-950 font-bold shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/50 scale-[1.02]',
          inactivePill:
            'text-neutral-400 hover:text-white hover:bg-emerald-950/50 font-medium',
          searchPill:
            'bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-emerald-900/60 font-medium',
          dropdown:
            'bg-[#090F0D] text-neutral-200 border-emerald-950 shadow-2xl ring-1 ring-emerald-950',
          dropdownItemHover:
            'hover:bg-emerald-950/70 text-neutral-300 hover:text-white',
          accentBadge:
            'bg-emerald-500/20 text-emerald-400 font-bold',
        };
    }
  };

  const st = getThemeStyles();

  return (
    <div ref={anchorRef} className="w-full relative py-6 sm:py-7">
      {/* Seamless spacer when docked so photos do not jump and no excess gap appears */}
      {isDocked && <div className="h-12 sm:h-14 w-full pointer-events-none" />}

      <div
        className={
          isDocked
            ? 'fixed top-[52px] sm:top-[54px] left-0 right-0 z-35 flex justify-center py-1 sm:py-1.5 px-3 sm:px-6 pointer-events-none transition-all duration-200 animate-in fade-in'
            : 'w-full flex justify-center px-3 sm:px-6 pointer-events-none'
        }
      >
        {/* Floating Pill Capsule Bar matching Reference Screenshot */}
        <div
          className={`pointer-events-auto relative inline-flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-2.5 rounded-full border transition-all duration-300 ${st.container} ${isDocked ? 'shadow-2xl shadow-black/25' : ''}`}
        >
        {/* ─── 1. AI Face Search Pill Button (Matching Screenshot) ─── */}
        <button
          type="button"
          onClick={() =>
            onSelectFilter(
              activeFilter.type === 'ai-face' ? { type: 'all' } : { type: 'ai-face' }
            )
          }
          className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] transition-all duration-200 cursor-pointer whitespace-nowrap ${
            isAiFaceActive ? st.activePill : st.inactivePill
          }`}
          title="AI Search: Find your photos using selfie face recognition"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAiFaceActive ? 'text-amber-400' : 'text-amber-500'}`} />
          <span className="font-semibold">AI Search</span>
        </button>

        {/* ─── 2. Visible Section Title Pills (e.g. BEGRUTA EDITED, HALDI EDITED) ─── */}
        {visibleSections.map((sec) => {
          const active = isSectionActive(sec);
          return (
            <button
              key={sec}
              type="button"
              onClick={() => onSelectFilter({ type: 'section', title: sec })}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap truncate max-w-[170px] sm:max-w-[220px] ${
                active ? st.activePill : st.inactivePill
              }`}
              title={sec}
            >
              {sec}
            </button>
          );
        })}

        {/* ─── 3. All Photos Pill ─── */}
        <button
          type="button"
          onClick={() => onSelectFilter({ type: 'all' })}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
            isAllActive ? st.activePill : st.inactivePill
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>All Photos {totalPhotosCount > 0 && `(${totalPhotosCount})`}</span>
        </button>

        {/* ─── 4. All Videos Pill (if videos exist) ─── */}
        {totalVideosCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectFilter({ type: 'videos' })}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isVideosActive ? st.activePill : st.inactivePill
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">All Videos</span>
            <span className="xs:hidden">Videos</span>
            <span className="text-[11px]">({totalVideosCount})</span>
          </button>
        )}

        {/* ─── 5. More ▾ Dropdown for Overflow Sections & Favorites ─── */}
        {hasMore && (
          <div className="relative" ref={moreDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer ${
                overflowSections.some((s) => isSectionActive(s)) || isFavoritesActive
                  ? st.activePill
                  : st.inactivePill
              }`}
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 border z-50 animate-scaleIn origin-top-right ${st.dropdown}`}
              >
                {/* Overflow Sections */}
                {overflowSections.length > 0 && (
                  <div className="space-y-1 pb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 block text-neutral-400 opacity-70">
                      Sections
                    </span>
                    {overflowSections.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          onSelectFilter({ type: 'section', title: sec });
                          setIsMoreOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-colors ${
                          isSectionActive(sec)
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : st.dropdownItemHover
                        }`}
                      >
                        <span className="truncate">{sec}</span>
                        {isSectionActive(sec) && <span className="text-[10px] uppercase">Active</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Favorites option */}
                <div className="pt-1 border-t border-current/10">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFilter({ type: 'favorites' });
                      setIsMoreOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-colors ${
                      isFavoritesActive
                        ? 'bg-rose-500 text-white font-bold'
                        : st.dropdownItemHover
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Starred Photos
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                      {favoritesCount}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
