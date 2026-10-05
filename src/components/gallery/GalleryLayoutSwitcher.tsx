import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  LayoutGrid,
  Columns3,
  Grid,
  Square,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { GalleryGridDesign } from './UniversalPhotoGrid';

export interface GalleryLayoutSwitcherProps {
  currentDesign: GalleryGridDesign;
  onChangeDesign: (design: GalleryGridDesign) => void;
  theme?: 'editorial' | 'masonry' | 'cinematic' | 'minimal';
  variant?: 'pill' | 'navbar' | 'floating' | 'segment';
  className?: string;
}

export interface GridOptionConfig {
  id: GalleryGridDesign;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const GRID_LAYOUT_OPTIONS: GridOptionConfig[] = [
  {
    id: 'default',
    label: 'Default Layout',
    shortLabel: 'Default',
    description: 'Template signature curated layout',
    icon: Sparkles,
  },
  {
    id: 'masonry',
    label: 'Masonry Flow',
    shortLabel: 'Masonry',
    description: 'Natural 4-column waterfall preserving photo proportions',
    icon: LayoutGrid,
  },
  {
    id: 'collage',
    label: 'Editorial Collage',
    shortLabel: 'Collage',
    description: 'Vogue-style mosaic with asymmetric featured spans',
    icon: Columns3,
  },
  {
    id: 'grid',
    label: 'Balanced Grid',
    shortLabel: 'Grid',
    description: 'Uniform aspect ratio tiles in synchronized 4 columns',
    icon: Grid,
  },
  {
    id: 'large',
    label: 'Large Cinema Feed',
    shortLabel: 'Large',
    description: 'Expansive storytelling stream for high-impact viewing',
    icon: Square,
  },
];

export const GalleryLayoutSwitcher: React.FC<GalleryLayoutSwitcherProps> = ({
  currentDesign,
  onChangeDesign,
  theme = 'editorial',
  variant = 'pill',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getThemeStyles = () => {
    switch (theme) {
      case 'cinematic':
        return {
          pillContainer:
            'bg-neutral-950/95 text-neutral-200 border-neutral-800 shadow-2xl shadow-amber-950/25 backdrop-blur-2xl ring-1 ring-white/5',
          pillButton:
            'bg-neutral-900/90 text-neutral-200 hover:text-white hover:bg-neutral-850 border border-neutral-800/80',
          pillButtonActive:
            'bg-amber-400 text-neutral-950 font-bold shadow-xl shadow-amber-400/25 ring-2 ring-amber-400/50 scale-[1.02]',
          dropdown:
            'bg-neutral-950/98 border-neutral-800 text-neutral-200 shadow-2xl shadow-black/80 ring-1 ring-white/10',
          dropdownActive:
            'bg-amber-400 text-neutral-950 font-bold shadow-sm',
          dropdownHover:
            'hover:bg-neutral-900 text-neutral-300 hover:text-white',
          activeDot: 'bg-amber-400',
          accentIcon: 'text-amber-400',
        };
      case 'masonry':
        return {
          pillContainer:
            'bg-[#0C1311]/95 text-neutral-200 border-emerald-900/60 shadow-2xl shadow-black/70 backdrop-blur-2xl ring-1 ring-emerald-500/10',
          pillButton:
            'bg-emerald-950/50 text-neutral-200 hover:text-white hover:bg-emerald-950/80 border border-emerald-900/50',
          pillButtonActive:
            'bg-emerald-500 text-neutral-950 font-bold shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/50 scale-[1.02]',
          dropdown:
            'bg-[#090F0D]/98 border-emerald-950/80 text-neutral-200 shadow-2xl ring-1 ring-emerald-950',
          dropdownActive:
            'bg-emerald-500 text-neutral-950 font-bold shadow-sm',
          dropdownHover:
            'hover:bg-emerald-950/70 text-neutral-300 hover:text-white',
          activeDot: 'bg-emerald-400',
          accentIcon: 'text-emerald-400',
        };
      case 'minimal':
        return {
          pillContainer:
            'bg-white/95 text-neutral-900 border-neutral-300 shadow-2xl shadow-neutral-950/10 backdrop-blur-xl',
          pillButton:
            'bg-neutral-100 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/80 border border-neutral-200',
          pillButtonActive:
            'bg-neutral-950 text-white font-bold shadow-md scale-[1.02]',
          dropdown:
            'bg-white/98 border-neutral-200 text-neutral-900 shadow-2xl ring-1 ring-black/5',
          dropdownActive:
            'bg-neutral-950 text-white font-bold shadow-sm',
          dropdownHover:
            'hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950',
          activeDot: 'bg-neutral-950',
          accentIcon: 'text-neutral-900',
        };
      case 'editorial':
      default:
        return {
          pillContainer:
            'bg-white/95 text-neutral-900 border-neutral-200/90 shadow-2xl shadow-neutral-950/10 backdrop-blur-xl ring-1 ring-black/5',
          pillButton:
            'bg-neutral-100 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/80 border border-neutral-200',
          pillButtonActive:
            'bg-neutral-950 text-white font-bold shadow-lg shadow-neutral-950/25 scale-[1.02]',
          dropdown:
            'bg-white/98 border-neutral-200 text-neutral-900 shadow-2xl ring-1 ring-black/5',
          dropdownActive:
            'bg-neutral-950 text-white font-bold shadow-sm',
          dropdownHover:
            'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950',
          activeDot: 'bg-neutral-950',
          accentIcon: 'text-neutral-900',
        };
    }
  };

  const st = getThemeStyles();
  const currentOption = GRID_LAYOUT_OPTIONS.find((o) => o.id === currentDesign) || GRID_LAYOUT_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  // ─────────────────────────────────────────────────────────────
  // 1. PILL DROPDOWN PILL (Twin companion pill beside filter bar)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'pill') {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`} ref={dropdownRef}>
        <div
          className={`relative inline-flex items-center p-1 sm:p-2.5 rounded-full border transition-all duration-300 ${st.pillContainer}`}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-[13px] uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 touch-manipulation ${
              currentDesign !== 'default' ? st.pillButtonActive : st.pillButton
            }`}
            title={`Layout: ${currentOption.label} (Click to switch)`}
          >
            <CurrentIcon className="w-3.5 h-3.5" />
            <span className="font-semibold">{currentOption.shortLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl p-2 border z-50 animate-in fade-in zoom-in-95 origin-top-right backdrop-blur-2xl shadow-2xl ${st.dropdown}`}
          >
            <div className="px-3 py-2 border-b border-current/10 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest opacity-60">
                Gallery Layout
              </span>
              <span className="text-[10px] font-mono opacity-50 px-1.5 py-0.5 rounded-md bg-current/5">
                {GRID_LAYOUT_OPTIONS.length} Options
              </span>
            </div>

            <div className="space-y-1">
              {GRID_LAYOUT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = currentDesign === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChangeDesign(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 touch-manipulation ${
                      isActive ? st.dropdownActive : st.dropdownHover
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-black/15 text-current' : 'bg-current/10'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold leading-tight truncate">{opt.label}</p>
                          {opt.id === 'default' && (
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-current/10 opacity-75 shrink-0">
                              Curated
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] opacity-75 font-light leading-tight truncate mt-0.5">{opt.description}</p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 stroke-[2.5] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. FLOATING THUMB BUTTON (Mobile app level action pill)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'floating') {
    return (
      <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-neutral-950/92 hover:bg-neutral-900 border border-neutral-700/80 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl text-xs font-semibold cursor-pointer active:scale-95 touch-manipulation ring-1 ring-white/10"
          title="Change Grid Layout"
        >
          <CurrentIcon className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider">{currentOption.shortLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 bottom-full mb-2 w-64 rounded-2xl p-2 border z-50 animate-in fade-in zoom-in-95 origin-bottom-right backdrop-blur-2xl shadow-2xl ${st.dropdown}`}
          >
            <div className="px-2.5 py-1.5 border-b border-current/10 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest opacity-60">
                Grid Layout Design
              </span>
              <span className="text-[10px] font-mono opacity-50 px-1.5 py-0.5 rounded-md bg-current/5">
                {GRID_LAYOUT_OPTIONS.length} Options
              </span>
            </div>

            <div className="space-y-1">
              {GRID_LAYOUT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = currentDesign === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChangeDesign(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 touch-manipulation ${
                      isActive ? st.dropdownActive : st.dropdownHover
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-black/15 text-current' : 'bg-current/10'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold leading-tight truncate">{opt.label}</p>
                          {opt.id === 'default' && (
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-current/10 opacity-75 shrink-0">
                              Curated
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] opacity-75 font-light leading-tight truncate mt-0.5">{opt.description}</p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 stroke-[2.5] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. NAVBAR BUTTON (Header trigger fallback)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-amber-300 transition-colors text-xs font-medium cursor-pointer active:scale-95"
        title={`Change layout design (current: ${currentOption.label})`}
      >
        <CurrentIcon className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">{currentOption.shortLabel}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 hidden xs:inline ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 rounded-2xl p-2 border z-50 animate-in fade-in zoom-in-95 origin-top-right backdrop-blur-2xl shadow-2xl ${st.dropdown}`}
        >
          <div className="px-2.5 py-1.5 border-b border-current/10 mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest opacity-60">
              Grid Layout Design
            </span>
            <span className="text-[10px] font-mono opacity-50 px-1.5 py-0.5 rounded-md bg-current/5">
              {GRID_LAYOUT_OPTIONS.length} Options
            </span>
          </div>

          <div className="space-y-1">
            {GRID_LAYOUT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = currentDesign === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChangeDesign(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-98 touch-manipulation ${
                    isActive ? st.dropdownActive : st.dropdownHover
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-black/15 text-current' : 'bg-current/10'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold leading-tight truncate">{opt.label}</p>
                        {opt.id === 'default' && (
                          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-current/10 opacity-75 shrink-0">
                            Curated
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] opacity-75 font-light leading-tight truncate mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 stroke-[2.5] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
