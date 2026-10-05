import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  Film,
  Music,
  Sliders,
  Download,
  Share2,
  Sparkles,
  Smartphone,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Loader2,
  ArrowRight,
  MessageCircle,
  Copy,
  Edit2,
  User,
  Heart,
  Maximize2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type { MediaItem, Gallery } from '@/types';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useToast } from '@/components/ui/Toast';
import { CURATED_TRACKS, TRACK_CATEGORIES, type Track } from '@/services/musicService';
import {
  renderStoryVideo,
  downloadRenderedVideo,
  shareStoryVideo,
  getCanvasDimensions,
  type StoryAspectRatio,
  type StoryTransitionStyle,
  type RenderStoryResult,
} from '@/utils/videoStoryRenderer';
import { getStoredGuestProfile, saveGuestProfile } from '@/utils/guestIdentity';

export interface StoryVideoCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  initialMedia?: MediaItem[];
  defaultPhotographerName?: string;
}

export const StoryVideoCreatorModal: React.FC<StoryVideoCreatorModalProps> = ({
  isOpen,
  onClose,
  gallery,
  initialMedia = [],
  defaultPhotographerName = 'Photographer',
}) => {
  const { showToast } = useToast();
  useScrollLock(isOpen);

  // Guest/Creator profile identity state
  const [creatorProfile, setCreatorProfile] = useState(() => getStoredGuestProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameInput, setEditNameInput] = useState(creatorProfile.name);

  // Photos sequence in the story
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isAddPhotosOpen, setIsAddPhotosOpen] = useState(false);

  // Aspect ratio & video configuration
  const [aspectRatio, setAspectRatio] = useState<StoryAspectRatio>('9:16');
  const [transitionStyle, setTransitionStyle] = useState<StoryTransitionStyle>('ken-burns');
  const [durationPerPhoto, setDurationPerPhoto] = useState<number>(3.0);

  // Titles & Branding
  const [titleText, setTitleText] = useState(gallery.title || 'Our Story');
  const [subtitleText, setSubtitleText] = useState(gallery.clientName || 'Celebration');
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(
    Boolean(gallery.watermark_enabled ?? gallery.watermarkEnabled)
  );

  // Soundtrack
  const [activeMusicCategory, setActiveMusicCategory] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<Track>(CURATED_TRACKS[0]);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.85);

  // Interactive Live Preview Player State
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewProgress, setPreviewProgress] = useState(0); // 0 to 1
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Rendering & Export State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedResult, setRenderedResult] = useState<RenderStoryResult | null>(null);

  // Active Editor Sidebar Tab: 'photos' | 'soundtrack' | 'style'
  const [activeTab, setActiveTab] = useState<'photos' | 'soundtrack' | 'style'>('photos');

  // Audio preview element for live playback in editor
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const canvasPreviewRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize selected photos when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMedia.length > 0) {
        setSelectedItems(initialMedia);
      } else if (gallery.media && gallery.media.length > 0) {
        // Default to first 8 photos or favorites
        const favs = gallery.media.filter((m) => m.isFavorite);
        setSelectedItems(favs.length >= 3 ? favs.slice(0, 12) : gallery.media.slice(0, 8));
      }
      setRenderedResult(null);
      setRenderProgress(0);
      setIsPreviewPlaying(true);
    }
  }, [isOpen, initialMedia, gallery.media]);

  // Audio element management for live preview
  useEffect(() => {
    const audioSrc = customAudioUrl || selectedTrack.audioUrl;
    if (!audioSrc) return;

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }
    const audio = audioPreviewRef.current;
    audio.src = audioSrc;
    audio.loop = true;
    audio.volume = isAudioMuted ? 0 : audioVolume;

    if (isOpen && isPreviewPlaying) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
    };
  }, [selectedTrack, customAudioUrl, isOpen]);

  // Volume & Mute listener
  useEffect(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = isAudioMuted ? 0 : audioVolume;
    }
  }, [isAudioMuted, audioVolume]);

  // Total duration calculation
  const totalDuration = useMemo(
    () => selectedItems.length * durationPerPhoto,
    [selectedItems.length, durationPerPhoto]
  );

  // Live Canvas Preview Animation Loop
  useEffect(() => {
    if (!isOpen || selectedItems.length === 0) return;

    const canvas = canvasPreviewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions(aspectRatio);
    canvas.width = width;
    canvas.height = height;

    let startTime = performance.now();
    let isRunning = true;

    // Preload image elements for fast preview rendering
    const imgMap = new Map<string, HTMLImageElement>();
    selectedItems.forEach((item) => {
      const src = item.url || item.thumbnailUrl;
      if (src && !imgMap.has(src)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        imgMap.set(src, img);
      }
    });

    const drawPreviewFrame = (now: number) => {
      if (!isRunning) return;

      if (!isPreviewPlaying) {
        animationFrameRef.current = requestAnimationFrame(drawPreviewFrame);
        return;
      }

      const elapsed = (now - startTime) / 1000;
      const loopTime = elapsed % (totalDuration || 1);
      const overallProg = loopTime / (totalDuration || 1);
      setPreviewProgress(overallProg);

      const slideIdx = Math.min(
        selectedItems.length - 1,
        Math.floor(loopTime / durationPerPhoto)
      );
      setActiveSlideIndex(slideIdx);

      const slideLocalTime = loopTime % durationPerPhoto;
      const slideProgress = slideLocalTime / durationPerPhoto;

      const currentItem = selectedItems[slideIdx];
      const nextItem = selectedItems[(slideIdx + 1) % selectedItems.length];

      const imgA = currentItem ? imgMap.get(currentItem.url || currentItem.thumbnailUrl || '') : null;
      const imgB = nextItem ? imgMap.get(nextItem.url || nextItem.thumbnailUrl || '') : null;

      // Clear Canvas
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, width, height);

      // Draw Slide A with Ken Burns motion
      if (imgA && imgA.complete && imgA.naturalWidth > 0) {
        ctx.save();
        let zoom = 1.0;
        let panX = 0;
        if (transitionStyle === 'ken-burns') {
          zoom = 1.0 + slideProgress * 0.12;
          panX = (slideIdx % 2 === 0 ? 1 : -1) * (slideProgress * 15);
        } else if (transitionStyle === 'burst') {
          zoom = 1.0 + Math.pow(slideProgress, 2) * 0.12;
        }

        const imgRatio = imgA.width / imgA.height;
        const canvasRatio = width / height;
        let rW = width;
        let rH = height;
        if (imgRatio > canvasRatio) {
          rH = height;
          rW = height * imgRatio;
        } else {
          rW = width;
          rH = width / imgRatio;
        }
        rW *= zoom;
        rH *= zoom;
        const ox = (width - rW) / 2 + panX;
        const oy = (height - rH) / 2;

        ctx.drawImage(imgA, ox, oy, rW, rH);
        ctx.restore();
      }

      // Draw Transition to Slide B
      const isTransitioning = slideProgress > 0.75 && selectedItems.length > 1;
      if (isTransitioning && imgB && imgB.complete && imgB.naturalWidth > 0) {
        const transProg = (slideProgress - 0.75) / 0.25;
        ctx.save();
        ctx.globalAlpha = transProg;

        const imgRatio = imgB.width / imgB.height;
        const canvasRatio = width / height;
        let rW = width;
        let rH = height;
        if (imgRatio > canvasRatio) {
          rH = height;
          rW = height * imgRatio;
        } else {
          rW = width;
          rH = width / imgRatio;
        }
        const ox = (width - rW) / 2;
        const oy = (height - rH) / 2;

        ctx.drawImage(imgB, ox, oy, rW, rH);
        ctx.restore();
      }

      // Vignette
      const grad = ctx.createLinearGradient(0, height * 0.7, 0, height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      // Overlays: Titles
      if (titleText || subtitleText) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 10;
        if (titleText) {
          ctx.font = `bold ${Math.round(width * 0.048)}px "Playfair Display", Georgia, serif`;
          ctx.fillText(titleText, width / 2, height - (subtitleText ? 80 : 50));
        }
        if (subtitleText) {
          ctx.font = `600 ${Math.round(width * 0.026)}px system-ui, sans-serif`;
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(subtitleText.toUpperCase(), width / 2, height - 42);
        }
        ctx.restore();
      }

      // Watermark
      if (includeWatermark) {
        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = `600 ${Math.round(width * 0.024)}px monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText(`© ${defaultPhotographerName}`, width - 24, height - 20);
        ctx.restore();
      }

      // Top Instagram Story progress bars
      const barH = 3;
      const gap = 4;
      const totalBars = selectedItems.length;
      const availW = width - 32 - gap * (totalBars - 1);
      const bW = availW / totalBars;
      ctx.save();
      for (let i = 0; i < totalBars; i++) {
        const bx = 16 + i * (bW + gap);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(bx, 16, bW, barH);
        if (i < slideIdx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, 16, bW, barH);
        } else if (i === slideIdx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, 16, bW * slideProgress, barH);
        }
      }
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(drawPreviewFrame);
    };

    animationFrameRef.current = requestAnimationFrame(drawPreviewFrame);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isOpen,
    selectedItems,
    aspectRatio,
    transitionStyle,
    durationPerPhoto,
    totalDuration,
    titleText,
    subtitleText,
    includeWatermark,
    defaultPhotographerName,
    isPreviewPlaying,
  ]);

  // Handle Play / Pause Toggle
  const togglePlayPause = () => {
    setIsPreviewPlaying((prev) => {
      const next = !prev;
      if (audioPreviewRef.current) {
        if (next) {
          audioPreviewRef.current.play().catch(() => {});
        } else {
          audioPreviewRef.current.pause();
        }
      }
      return next;
    });
  };

  // Reorder Photos Handlers
  const handleMovePhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= selectedItems.length) return;
    const next = [...selectedItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setSelectedItems(next);
  };

  const handleRemovePhoto = (idx: number) => {
    if (selectedItems.length <= 1) {
      showToast('Minimum Photos', 'Story video requires at least 1 photograph.', 'warning');
      return;
    }
    const next = selectedItems.filter((_, i) => i !== idx);
    setSelectedItems(next);
  };

  // Custom Audio Upload Handler
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showToast('Invalid File', 'Please upload a valid audio file (.mp3, .m4a, .wav).', 'error');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCustomAudioUrl(objectUrl);
    setCustomAudioName(file.name);
    showToast('Soundtrack Added', `Using custom audio: ${file.name}`, 'success');
  };

  // Update Creator Profile
  const handleSaveProfile = () => {
    if (!editNameInput.trim()) return;
    const updated = saveGuestProfile({ name: editNameInput.trim() });
    setCreatorProfile(updated);
    setIsEditingProfile(false);
    showToast('Profile Updated', `Creator set to "${updated.name}"`, 'success');
  };

  // Render & Export Video
  const handleGenerateVideo = async () => {
    if (selectedItems.length === 0) {
      showToast('No Photos', 'Please select at least 1 photograph.', 'error');
      return;
    }

    // Pause editor preview while recording
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPreviewPlaying(false);

    setIsRendering(true);
    setRenderProgress(0);

    try {
      showToast('Rendering Video', 'Generating high-definition story reel...', 'info');

      const photos = selectedItems.map((item) => ({
        url: item.url || item.thumbnailUrl || '',
        title: item.title,
      }));

      const activeAudio = customAudioUrl || selectedTrack.audioUrl;

      const result = await renderStoryVideo({
        photos,
        audioUrl: isAudioMuted ? undefined : activeAudio,
        aspectRatio,
        durationPerPhoto,
        transitionStyle,
        title: titleText,
        subtitle: subtitleText,
        watermarkText: includeWatermark ? `© ${defaultPhotographerName}` : undefined,
        watermarkEnabled: includeWatermark,
        onProgress: (percent) => {
          setRenderProgress(percent);
        },
      });

      setRenderedResult(result);
      showToast('Reel Ready!', 'Your story video has been successfully generated.', 'success');
    } catch (err: any) {
      console.error('[VideoCreator] Generation failed:', err);
      showToast('Export Error', err?.message || 'Failed to render story video.', 'error');
    } finally {
      setIsRendering(false);
    }
  };

  // Download Handler
  const handleDownload = () => {
    if (!renderedResult) return;
    downloadRenderedVideo(renderedResult.blob, renderedResult.filename);
    showToast('Downloading', `Saving "${renderedResult.filename}" to your device.`, 'success');
  };

  // Native Web Share to Instagram/WhatsApp
  const handleShare = async () => {
    if (!renderedResult) return;
    const shared = await shareStoryVideo(
      renderedResult.blob,
      renderedResult.filename,
      titleText || 'Our Photo Story',
      `Created with EX SHARE Atelier by ${creatorProfile.name}`
    );
    if (shared) {
      showToast('Shared', 'Story sent to social app.', 'success');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRendering) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0e0f14] border border-neutral-800 text-white shadow-2xl overflow-hidden">
        {/* Top Luxury Header */}
        <header className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between gap-3 shrink-0 bg-[#12131a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Story & Reel Video Creator
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Social Ready
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Turn your favorite photos into vertical reels, stories, or slideshows with music.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Creator Profile Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              {isEditingProfile ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    className="w-24 px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    placeholder="Your Name"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="text-amber-400 hover:text-amber-300 text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-300 text-[11px]">
                    By <strong className="text-white">{creatorProfile.name}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setEditNameInput(creatorProfile.name);
                      setIsEditingProfile(true);
                    }}
                    title="Change creator name"
                    className="text-neutral-500 hover:text-white"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              disabled={isRendering}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Body: Live Player (Left) + Editor Controls (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Live Interactive Canvas Player */}
          <div className="lg:col-span-5 bg-[#090a0d] p-4 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-neutral-800/80">
            {/* Aspect Ratio Frame Container */}
            <div className="relative w-full flex items-center justify-center flex-1 max-h-[52vh] lg:max-h-[58vh]">
              <div
                className={`relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-neutral-800 transition-all duration-300 ${
                  aspectRatio === '9:16'
                    ? 'aspect-[9/16] h-full max-h-[460px]'
                    : aspectRatio === '1:1'
                    ? 'aspect-square h-full max-h-[420px]'
                    : 'aspect-video w-full max-w-[460px]'
                }`}
              >
                <canvas ref={canvasPreviewRef} className="w-full h-full object-cover block" />

                {/* Overlaid Play/Pause Control on Click */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-active:scale-95">
                    {isPreviewPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Player Controls */}
            <div className="w-full max-w-sm mt-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
                  >
                    {isPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <span>
                    Photo {activeSlideIndex + 1} of {selectedItems.length}
                  </span>
                </div>
                <span>
                  {Math.round(previewProgress * totalDuration)}s / {Math.round(totalDuration)}s
                </span>
              </div>

              {/* Scrubber Bar */}
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-100"
                  style={{ width: `${previewProgress * 100}%` }}
                />
              </div>

              {/* Soundtrack preview badge */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-neutral-300 truncate max-w-[200px]">
                  <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {customAudioName || selectedTrack.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="p-1 rounded text-neutral-400 hover:text-white"
                  >
                    {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs & Sequence */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#0e0f14]">
            {/* Tab Navigation */}
            <div className="px-5 pt-3 border-b border-neutral-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'photos'
                      ? 'border-amber-400 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Photos ({selectedItems.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('soundtrack')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'soundtrack'
                      ? 'border-amber-400 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Soundtrack</span>
                </button>

                <button
                  onClick={() => setActiveTab('style')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'style'
                      ? 'border-amber-400 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Format & Style</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-amber-400/90 hidden sm:inline">
                {aspectRatio} • {totalDuration.toFixed(0)}s total
              </span>
            </div>

            {/* Tab Content Panel (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* TAB 1: PHOTOS SEQUENCE */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Reel Sequence ({selectedItems.length} photos)
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Photos play in order from left to right. Reorder or remove photos.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddPhotosOpen(!isAddPhotosOpen)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddPhotosOpen ? 'Close Picker' : 'Add Photos'}</span>
                    </button>
                  </div>

                  {/* Add Photos Picker from Gallery Media */}
                  {isAddPhotosOpen && (
                    <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-medium text-neutral-300">
                        <span>Select photos from gallery to add to reel:</span>
                        <button
                          onClick={() => {
                            setSelectedItems(gallery.media);
                            showToast('Added All', 'Added all gallery photos to reel.', 'info');
                          }}
                          className="text-amber-400 hover:underline text-[11px]"
                        >
                          Add All ({gallery.media.length})
                        </button>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                        {gallery.media.map((item) => {
                          const isInStory = selectedItems.some((s) => s.id === item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                if (isInStory) {
                                  setSelectedItems(selectedItems.filter((s) => s.id !== item.id));
                                } else {
                                  setSelectedItems([...selectedItems, item]);
                                }
                              }}
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                isInStory
                                  ? 'border-amber-400 ring-2 ring-amber-400/40 opacity-100'
                                  : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={item.thumbnailUrl || item.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isInStory && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Photos Filmstrip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`group relative rounded-xl overflow-hidden bg-neutral-900 border transition-all ${
                          idx === activeSlideIndex
                            ? 'border-amber-400 ring-2 ring-amber-400/30'
                            : 'border-neutral-800'
                        }`}
                      >
                        <div className="aspect-[4/5] w-full relative">
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-white">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Card Hover Action Bar */}
                        <div className="p-1.5 bg-[#14151d] flex items-center justify-between text-neutral-400 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, idx - 1)}
                              disabled={idx === 0}
                              title="Move left"
                              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, idx + 1)}
                              disabled={idx === selectedItems.length - 1}
                              title="Move right"
                              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Remove photo from reel"
                            className="p-1 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: SOUNDTRACK & MUSIC */}
              {activeTab === 'soundtrack' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Select Background Soundtrack
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Choose from curated royalty-free tracks or upload your own favorite song.
                    </p>
                  </div>

                  {/* Custom Audio Upload Button */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">
                        Upload Your Own Song (.mp3, .m4a)
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {customAudioName ? `Selected: ${customAudioName}` : 'Add custom wedding song or speech audio'}
                      </span>
                    </div>

                    <label className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-amber-500/20">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Audio File</span>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.m4a,.wav"
                        onChange={handleCustomAudioUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Curated Categories */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {TRACK_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveMusicCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          activeMusicCategory === cat.id
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Curated Tracks List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {CURATED_TRACKS.map((track) => {
                      const isSelected = selectedTrack.id === track.id && !customAudioUrl;
                      return (
                        <div
                          key={track.id}
                          onClick={() => {
                            setSelectedTrack(track);
                            setCustomAudioUrl(null);
                            setCustomAudioName('');
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={track.coverUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold text-white truncate">{track.title}</p>
                              <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {track.badge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-amber-300 font-mono">
                                {track.badge}
                              </span>
                            )}
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: FORMAT & STYLE */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  {/* Aspect Ratio Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                      Target Social Format (Aspect Ratio)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setAspectRatio('9:16')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          aspectRatio === '9:16'
                            ? 'bg-amber-500/10 border-amber-400 text-white ring-1 ring-amber-400/30'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                        <span className="text-xs font-bold block">9:16 Vertical</span>
                        <span className="text-[10px] text-neutral-500 block">Reel / Story / Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAspectRatio('1:1')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          aspectRatio === '1:1'
                            ? 'bg-amber-500/10 border-amber-400 text-white ring-1 ring-amber-400/30'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Film className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                        <span className="text-xs font-bold block">1:1 Square</span>
                        <span className="text-[10px] text-neutral-500 block">Instagram Post</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAspectRatio('16:9')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          aspectRatio === '16:9'
                            ? 'bg-amber-500/10 border-amber-400 text-white ring-1 ring-amber-400/30'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Maximize2 className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                        <span className="text-xs font-bold block">16:9 Landscape</span>
                        <span className="text-[10px] text-neutral-500 block">Cinematic / TV</span>
                      </button>
                    </div>
                  </div>

                  {/* Transition Style */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                      Motion & Transition Style
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'ken-burns', label: 'Ken Burns (Cinematic Drift)' },
                        { id: 'crossfade', label: 'Dreamy Dissolve (Crossfade)' },
                        { id: 'burst', label: 'Dynamic Burst (Fast Scale)' },
                        { id: 'fade-black', label: 'Classic Noir (Fade to Black)' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setTransitionStyle(style.id as StoryTransitionStyle)}
                          className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            transitionStyle === style.id
                              ? 'bg-amber-500/10 border-amber-400 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration per photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white">
                      <span>Pacing per Photo</span>
                      <span className="text-amber-400 font-mono">{durationPerPhoto}s</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { seconds: 2.0, label: 'Fast (2.0s)' },
                        { seconds: 3.0, label: 'Standard (3.0s)' },
                        { seconds: 4.5, label: 'Cinematic (4.5s)' },
                      ].map((item) => (
                        <button
                          key={item.seconds}
                          type="button"
                          onClick={() => setDurationPerPhoto(item.seconds)}
                          className={`py-2 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                            durationPerPhoto === item.seconds
                              ? 'bg-amber-400 text-neutral-950 font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography & Titles */}
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                      Titles & Overlays
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">Story Title</span>
                        <input
                          type="text"
                          value={titleText}
                          onChange={(e) => setTitleText(e.target.value)}
                          placeholder="e.g. Wedding Highlights"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">Subtitle / Names</span>
                        <input
                          type="text"
                          value={subtitleText}
                          onChange={(e) => setSubtitleText(e.target.value)}
                          placeholder="e.g. Sarah & Alex"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-1 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeWatermark}
                        onChange={(e) => setIncludeWatermark(e.target.checked)}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Include Studio Watermark Attribution (© {defaultPhotographerName})</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Export Action Footer */}
            <div className="p-4 border-t border-neutral-800 bg-[#12131a] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-neutral-400 font-mono">
                Output: <strong className="text-white">{selectedItems.length} photos</strong> •{' '}
                <strong className="text-amber-400">{totalDuration.toFixed(0)} seconds</strong> (
                {aspectRatio})
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isRendering}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isRendering || selectedItems.length === 0}
                  className="flex-[2] sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generate Story Reel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rendering Progress Modal */}
      {isRendering && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#14151d] border border-amber-500/30 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 animate-pulse">
              <Film className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Rendering High-Def Video...</h3>
              <p className="text-xs text-neutral-400">
                Encoding {selectedItems.length} photos with Ken Burns motion & soundtrack.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-150"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>Encoding frames...</span>
                <span className="text-amber-400 font-bold">{renderProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-Generation Completion Modal */}
      {renderedResult && !isRendering && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#12131a] border border-amber-500/40 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Story Reel Generated!</span>
              </div>

              <button
                onClick={() => setRenderedResult(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rendered Video Player Preview */}
            <div className="aspect-[9/16] max-h-72 mx-auto rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-xl">
              <video
                src={renderedResult.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Your Video is Ready to Share!</h3>
              <p className="text-xs text-neutral-400">
                Saved as <strong className="text-neutral-200">{renderedResult.filename}</strong> (
                {renderedResult.durationSeconds.toFixed(0)}s • {aspectRatio})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Video</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share to Story / WhatsApp</span>
              </button>
            </div>

            <div className="pt-2 text-center border-t border-neutral-800/80">
              <button
                type="button"
                onClick={() => setRenderedResult(null)}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Edit Video Settings & Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
