import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ChevronDown,
  Film,
  Camera,
  Check,
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
  totalPhotosCount = 0,
  totalVideosCount = 0,
  theme = 'masonry',
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isDocked, setIsDocked] = useState(false);

  // Dynamic priority-plus overflow calculation
  const [visibleCount, setVisibleCount] = useState<number>(() => sections.length);
  const sectionMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const aiSearchMeasureRef = useRef<HTMLDivElement>(null);
  const allPhotosMeasureRef = useRef<HTMLDivElement>(null);
  const allVideosMeasureRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLDivElement>(null);

  // Monitor scroll position: dock fixed under navbar when scrolled past initial position
  const checkDockPosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setIsDocked(rect.top <= 60);
  }, []);

  useLenisScroll(() => {
    checkDockPosition();
  });

  useEffect(() => {
    const handleScroll = () => checkDockPosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    checkDockPosition();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkDockPosition]);

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
          dropdown:
            'bg-white/98 text-neutral-900 border-neutral-200 shadow-2xl ring-1 ring-black/5',
          dropdownItemActive:
            'bg-neutral-950 text-white font-bold shadow-sm',
          dropdownItemHover:
            'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950',
          activeDot: 'bg-neutral-950',
        };

      case 'cinematic':
        return {
          container:
            'bg-neutral-950/95 text-neutral-200 border-neutral-800 shadow-2xl shadow-amber-950/25 backdrop-blur-2xl ring-1 ring-white/5',
          activePill:
            'bg-amber-400 text-neutral-950 font-bold shadow-xl shadow-amber-400/25 ring-2 ring-amber-400/50 scale-[1.02]',
          inactivePill:
            'text-neutral-400 hover:text-white hover:bg-neutral-900 font-medium',
          dropdown:
            'bg-neutral-950/98 text-neutral-200 border-neutral-800 shadow-2xl ring-1 ring-white/10',
          dropdownItemActive:
            'bg-amber-400 text-neutral-950 font-bold shadow-sm',
          dropdownItemHover:
            'hover:bg-neutral-900 text-neutral-300 hover:text-white',
          activeDot: 'bg-amber-400',
        };

      case 'minimal':
        return {
          container:
            'bg-white/95 text-neutral-900 border-neutral-300 shadow-2xl shadow-neutral-950/10 backdrop-blur-xl',
          activePill:
            'bg-neutral-950 text-white font-bold shadow-md scale-[1.02]',
          inactivePill:
            'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 font-medium',
          dropdown:
            'bg-white/98 text-neutral-900 border-neutral-200 shadow-2xl ring-1 ring-black/5',
          dropdownItemActive:
            'bg-neutral-950 text-white font-bold shadow-sm',
          dropdownItemHover:
            'hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950',
          activeDot: 'bg-neutral-950',
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
          dropdown:
            'bg-[#090F0D]/98 text-neutral-200 border-emerald-950/80 shadow-2xl ring-1 ring-emerald-950',
          dropdownItemActive:
            'bg-emerald-500 text-neutral-950 font-bold shadow-sm',
          dropdownItemHover:
            'hover:bg-emerald-950/70 text-neutral-300 hover:text-white',
          activeDot: 'bg-emerald-400',
        };
    }
  };

  const st = getThemeStyles();

  // Dynamic overflow calculation: only show "More ▾" when the bar UI cannot fit all sections
  const calculateOverflow = useCallback(() => {
    if (!anchorRef.current || sections.length === 0) {
      setVisibleCount(sections.length);
      return;
    }

    const screenW = window.innerWidth;
    const parentW = anchorRef.current.clientWidth || screenW;
    // Keep breathing room so the capsule never hugs edges or forces horizontal scroll
    const maxCapsuleWidth = Math.min(parentW - 32, screenW - 32);

    const gap = 8;
    const capsulePadding = 24;

    const aiSearchW = (aiSearchMeasureRef.current?.getBoundingClientRect().width || 110) + gap;
    const allPhotosW = (allPhotosMeasureRef.current?.getBoundingClientRect().width || 135) + gap;
    const allVideosW =
      totalVideosCount > 0
        ? (allVideosMeasureRef.current?.getBoundingClientRect().width || 115) + gap
        : 0;
    const moreBtnW = (moreMeasureRef.current?.getBoundingClientRect().width || 85) + gap;

    const fixedW = aiSearchW + allPhotosW + allVideosW + capsulePadding;

    const sectionWidths = sections.map((_, i) => {
      const el = sectionMeasureRefs.current[i];
      return (el?.getBoundingClientRect().width || 120) + gap;
    });

    const totalWidthAll = fixedW + sectionWidths.reduce((sum, w) => sum + w, 0);

    // If all sections fit cleanly, display ALL without the "More" dropdown
    if (totalWidthAll <= maxCapsuleWidth) {
      setVisibleCount(sections.length);
      return;
    }

    // Bar is full: reserve space for the More button and fit as many sections as possible
    const availableForSections = maxCapsuleWidth - fixedW - moreBtnW;

    let currentSum = 0;
    let fittedCount = 0;
    for (let i = 0; i < sectionWidths.length; i++) {
      if (currentSum + sectionWidths[i] <= availableForSections) {
        currentSum += sectionWidths[i];
        fittedCount++;
      } else {
        break;
      }
    }

    // Keep at least 1 section visible if available, unless viewport is extremely constrained
    setVisibleCount(Math.max(1, fittedCount));
  }, [sections, totalVideosCount]);

  useEffect(() => {
    calculateOverflow();

    const handleResize = () => {
      calculateOverflow();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOverflow]);

  // Derived visible and overflow sections based on dynamic capacity
  const visibleSections = sections.slice(0, visibleCount);
  const overflowSections = sections.slice(visibleCount);
  const hasMore = overflowSections.length > 0;

  // Active state helpers
  const isAiFaceActive = activeFilter.type === 'ai-face';
  const isSectionActive = (title: string) =>
    activeFilter.type === 'section' && activeFilter.title.toLowerCase() === title.toLowerCase();
  const isAllActive = activeFilter.type === 'all';
  const isVideosActive = activeFilter.type === 'videos';
  const isOverflowActive = overflowSections.some((s) => isSectionActive(s));

  return (
    <div ref={anchorRef} className="w-full relative py-4 sm:py-5">
      {/* Seamless spacer when docked so photos do not jump */}
      {isDocked && <div className="h-12 sm:h-14 w-full pointer-events-none" />}

      {/* Floating Pill Capsule Bar */}
      <div
        className={
          isDocked
            ? 'fixed top-[56px] sm:top-[60px] left-0 right-0 z-35 flex justify-center py-1 px-3 sm:px-6 pointer-events-none transition-all duration-200 animate-in fade-in'
            : 'w-full flex justify-center px-3 sm:px-6 pointer-events-none'
        }
      >
        <div
          className={`pointer-events-auto relative inline-flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-2.5 rounded-full border transition-all duration-300 max-w-[calc(100vw-24px)] overflow-visible ${st.container} ${
            isDocked ? 'shadow-2xl shadow-black/30' : ''
          }`}
        >
          {/* ─── 1. AI Face Search Pill Button ─── */}
          <button
            type="button"
            onClick={() =>
              onSelectFilter(
                activeFilter.type === 'ai-face' ? { type: 'all' } : { type: 'ai-face' }
              )
            }
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
              isAiFaceActive ? st.activePill : st.inactivePill
            }`}
            title="AI Search: Find your photos using selfie face recognition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiFaceActive ? 'text-amber-400' : 'text-amber-500'}`} />
            <span className="font-semibold">AI Search</span>
          </button>

          {/* ─── 2. Visible Section Title Pills (Dynamically computed to fit without overflow) ─── */}
          {visibleSections.map((sec) => {
            const active = isSectionActive(sec);
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onSelectFilter({ type: 'section', title: sec })}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap truncate max-w-[170px] sm:max-w-[220px] shrink-0 ${
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
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                isVideosActive ? st.activePill : st.inactivePill
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">All Videos</span>
              <span className="xs:hidden">Videos</span>
              <span className="text-[11px]">({totalVideosCount})</span>
            </button>
          )}

          {/* ─── 5. More ▾ Dropdown (ONLY shown when filter bar UI is full) ─── */}
          {hasMore && (
            <div className="relative shrink-0" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isOverflowActive ? st.activePill : st.inactivePill
                }`}
                title="View more sections"
              >
                <span>More</span>
                {isOverflowActive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${st.activeDot} animate-pulse`}
                  />
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMoreOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMoreOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-60 rounded-2xl p-2 border z-50 animate-in fade-in zoom-in-95 origin-top-right ${st.dropdown}`}
                >
                  <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-current/10 mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest opacity-60">
                      More Sections
                    </span>
                    <span className="text-[10px] font-mono opacity-50 px-1.5 py-0.5 rounded-md bg-current/5">
                      {overflowSections.length}
                    </span>
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                    {overflowSections.map((sec) => {
                      const active = isSectionActive(sec);
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            onSelectFilter({ type: 'section', title: sec });
                            setIsMoreOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                            active ? st.dropdownItemActive : st.dropdownItemHover
                          }`}
                        >
                          <span className="truncate font-medium">{sec}</span>
                          {active && (
                            <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Offscreen Measurement Container (Invisible, used to measure exact widths) ─── */}
      <div
        aria-hidden="true"
        className="fixed -top-[9999px] -left-[9999px] invisible opacity-0 pointer-events-none flex items-center gap-2 whitespace-nowrap"
      >
        <div
          ref={aiSearchMeasureRef}
          className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Search</span>
        </div>
        <div
          ref={allPhotosMeasureRef}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] uppercase tracking-wider"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>All Photos {totalPhotosCount > 0 && `(${totalPhotosCount})`}</span>
        </div>
        {totalVideosCount > 0 && (
          <div
            ref={allVideosMeasureRef}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] uppercase tracking-wider"
          >
            <Film className="w-3.5 h-3.5" />
            <span>All Videos ({totalVideosCount})</span>
          </div>
        )}
        <div
          ref={moreMeasureRef}
          className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-medium"
        >
          <span>More</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        {sections.map((sec, idx) => (
          <div
            key={sec}
            ref={(el) => {
              sectionMeasureRefs.current[idx] = el;
            }}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-[13px] uppercase tracking-wider font-semibold"
          >
            {sec}
          </div>
        ))}
      </div>
    </div>
  );
};
