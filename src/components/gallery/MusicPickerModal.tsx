import React, { useState, useEffect, useRef, useTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Play,
  Pause,
  Music,
  Sparkles,
  Heart,
  Film,
  Activity,
  Headphones,
  PartyPopper,
  Volume2,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  type Track,
  type TrackCategory,
  CURATED_TRACKS,
  TRACK_CATEGORIES,
  searchTracks,
  fetchCategoryTracks,
  formatDuration,
} from '../../services/musicService';
import { audioManager } from '../../services/audioManager';
import { useSmoothScroll } from '../common/SmoothScroll';

interface MusicPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track | null) => void;
  currentSelectedTrack?: Track | null;
}

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
  currentSelectedTrack,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tracks, setTracks] = useState<Track[]>(CURATED_TRACKS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(currentSelectedTrack || CURATED_TRACKS[0]);
  const [, startTransition] = useTransition();

  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const { lenis } = useSmoothScroll();

  // Reset selected track when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedTrack(currentSelectedTrack || CURATED_TRACKS[0]);
    }
  }, [isOpen, currentSelectedTrack]);

  // Lock background page scroll and pause Lenis completely while modal is open
  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        lenis?.start();
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isOpen, lenis]);

  // Initial load: fetch live trending songs from iTunes API on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    fetchCategoryTracks('all')
      .then((apiTracks) => {
        if (isMounted) {
          startTransition(() => {
            setTracks(apiTracks);
            setIsLoading(false);
          });
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Listen to audioManager changes (e.g. when preview plays, pauses, or finishes)
  useEffect(() => {
    const unsubscribe = audioManager.subscribe(() => {
      const active = audioManager.getActivePreviewTrack();
      if (active && audioManager.isPreviewPlaying()) {
        setActivePreviewId(active.id);
      } else {
        setActivePreviewId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Stop preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      audioManager.stopPreview();
      setActivePreviewId(null);
    }
  }, [isOpen]);

  // Debounced live search via iTunes Search API when user types
  useEffect(() => {
    if (!isOpen) return;

    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchTracks(searchQuery);
        startTransition(() => {
          setTracks(results);
          setIsLoading(false);
        });
      } catch {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Category switch with dynamic API fetch
  const handleSelectCategory = async (cat: TrackCategory) => {
    setActiveCategory(cat.id);
    setSearchQuery('');
    setIsLoading(true);

    try {
      const apiTracks = await fetchCategoryTracks(cat.id);
      startTransition(() => {
        setTracks(apiTracks);
        setIsLoading(false);
      });
    } catch {
      setIsLoading(false);
    }
  };

  // Horizontal scroll buttons for category pills
  const handleScrollPills = (direction: 'left' | 'right') => {
    if (!pillsContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    pillsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePillsWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (pillsContainerRef.current) {
      pillsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Preview audio toggle (only plays preview, does NOT start slideshow)
  const handleTogglePreview = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (activePreviewId === track.id) {
      audioManager.stopPreview();
      setActivePreviewId(null);
    } else {
      setActivePreviewId(track.id);
      audioManager.playPreview(track, () => {
        setActivePreviewId(null);
      });
    }
  };

  // Row selection: just selects the song, DOES NOT start playing or launch slideshow
  const handleSelectSongRow = (track: Track) => {
    setSelectedTrack(track);
  };

  // Start the slideshow with the chosen track
  const handleStartSlideshow = () => {
    audioManager.stopPreview();
    onSelectTrack(selectedTrack);
    onClose();
  };

  // Play without music option
  const handlePlayWithoutMusic = () => {
    audioManager.stopPreview();
    onSelectTrack(null);
    onClose();
  };

  if (!isOpen) return null;

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'Heart':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'Film':
        return <Film className="w-3.5 h-3.5 text-sky-400" />;
      case 'Activity':
        return <Activity className="w-3.5 h-3.5 text-purple-400" />;
      case 'Headphones':
        return <Headphones className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PartyPopper':
        return <PartyPopper className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Music className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return createPortal(
    <div
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans select-none"
    >
      <div
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="soundtrack-picker-title"
        className="bg-[#121319] border border-neutral-800/80 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden text-white animate-scale-in overscroll-contain"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 via-rose-400/10 to-amber-500/30 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 id="soundtrack-picker-title" className="text-base font-serif tracking-wide text-white font-semibold">
                Select Soundtrack
              </h2>
              <p className="text-xs text-neutral-400">
                Choose a song for your fullscreen movie slideshow
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioManager.stopPreview();
              onClose();
            }}
            aria-label="Close music selector"
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Category Pills */}
        <div className="p-4 pb-2 border-b border-neutral-800/40">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists or songs..."
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-900/90 border border-neutral-700/60 rounded-xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/80 transition-all"
            />
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3.5" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory(
                    TRACK_CATEGORIES.find((c) => c.id === activeCategory) || TRACK_CATEGORIES[0]
                  );
                }}
                className="absolute right-3 p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Instagram-style Categories Scrollable Bar with Arrow Controls */}
          <div className="relative flex items-center py-3">
            <button
              onClick={() => handleScrollPills('left')}
              title="Scroll left"
              className="p-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 shadow-md shrink-0 mr-1.5 transition-all hidden xs:flex items-center justify-center"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={pillsContainerRef}
              data-lenis-prevent="true"
              onWheel={handlePillsWheel}
              className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth overscroll-contain py-1 cursor-grab active:cursor-grabbing"
            >
              {TRACK_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                      isActive
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40 scale-105'
                        : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-800/90 hover:border-neutral-700'
                    }`}
                  >
                    {renderCategoryIcon(cat.icon)}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleScrollPills('right')}
              title="Scroll right"
              className="p-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 shadow-md shrink-0 ml-1.5 transition-all hidden xs:flex items-center justify-center"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Song List (Clicking row selects track WITHOUT playing whole soundtrack) */}
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 overflow-y-auto divide-y divide-neutral-900/80 px-2 sm:px-4 py-2 overscroll-contain"
        >
          {isLoading && tracks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-neutral-400 font-mono">Fetching tracks from Apple Music...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Music className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm text-neutral-400">No tracks found matching "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory(TRACK_CATEGORIES[0]);
                }}
                className="text-xs text-amber-400 hover:underline mt-1"
              >
                Reset to Trending
              </button>
            </div>
          ) : (
            tracks.map((track) => {
              const isSelected = selectedTrack?.id === track.id;
              const isPreviewing = activePreviewId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectSongRow(track)}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-amber-400/10 border border-amber-400/30'
                      : 'hover:bg-neutral-900/80 border border-transparent'
                  }`}
                >
                  {/* Left: Album Cover with Preview Play Button */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-neutral-900">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play / Pause button overlay for 30s preview */}
                      <button
                        onClick={(e) => handleTogglePreview(e, track)}
                        title={isPreviewing ? 'Pause Preview' : 'Listen Preview'}
                        className={`absolute inset-0 flex items-center justify-center backdrop-blur-[2px] transition-all ${
                          isPreviewing
                            ? 'bg-black/60 text-amber-400 opacity-100'
                            : 'bg-black/35 group-hover:bg-black/55 text-white opacity-80 group-hover:opacity-100'
                        }`}
                      >
                        {isPreviewing ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>

                      {isPreviewing && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            isSelected ? 'text-amber-400 font-semibold' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        {track.badge && (
                          <span className="hidden xs:inline text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/40">
                            {track.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="truncate">{track.artist}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-neutral-400 font-medium">
                          {formatDuration(track.duration)}
                        </span>

                        {isPreviewing && (
                          <div className="flex items-end gap-0.5 h-3 ml-1">
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.6s_infinite_ease-in-out]" />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.4s_infinite_ease-in-out]" />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_ease-in-out]" />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.5s_infinite_ease-in-out]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Selected Checkmark / Select Pill */}
                  <div className="shrink-0 ml-3">
                    {isSelected ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/15 px-3 py-1.5 rounded-full border border-amber-400/40">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSongRow(track);
                        }}
                        className="text-xs font-medium text-neutral-400 group-hover:text-white bg-neutral-900 group-hover:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-800 transition-all"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with "Play without Music" & "Start Slideshow" */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between">
          <button
            onClick={handlePlayWithoutMusic}
            className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Play without music</span>
          </button>

          <button
            onClick={handleStartSlideshow}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Slideshow</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
