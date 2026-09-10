import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import type { MediaItem } from '../../types';
import {
  X,
  UploadCloud,
  Film,
  Sparkles,
  CheckCircle2,
  FileImage,
  Loader2,
} from 'lucide-react';

interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
}

export const UploadMediaModal: React.FC<UploadMediaModalProps> = ({
  isOpen,
  onClose,
  galleryId,
}) => {
  const { addMediaToGallery } = useGallery();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Custom photo input state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');

  // Video input state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoThumb, setVideoThumb] = useState('');

  if (!isOpen) return null;

  // Preset batches to simulate rich photo uploads effortlessly
  const presetPhotoSets = [
    {
      label: 'Fine-Art Wedding Highlights (4 Photos)',
      items: [
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
          title: 'Candlelight Courtyard Dinner',
          caption: 'Under Italian festoon lights with olive garland centerpieces',
          aspectRatio: 1.5,
          width: 2400,
          height: 1600,
          sizeMB: 7.2,
        },
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80',
          title: 'Heirloom Diamond Earrings & Ring',
          caption: 'Natural window daylight on antique limestone mantle',
          aspectRatio: 0.75,
          width: 1500,
          height: 2000,
          sizeMB: 5.4,
        },
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
          title: 'Recessional Flower Petal Rain',
          caption: 'White peony and dried lavender confetti cascade',
          aspectRatio: 1.4,
          width: 2100,
          height: 1500,
          sizeMB: 8.1,
        },
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=500&q=80',
          title: 'Champagne Tower Cheers',
          caption: 'Spontaneous laughter under twilight torches',
          aspectRatio: 0.8,
          width: 1600,
          height: 2000,
          sizeMB: 6.8,
        },
      ],
    },
    {
      label: 'Editorial & Haute Couture (3 Photos)',
      items: [
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
          title: 'Atelier Golden Ochre Coat',
          caption: 'Vogue feature editorial series in Paris',
          aspectRatio: 1.5,
          width: 2400,
          height: 1600,
          sizeMB: 7.9,
        },
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=500&q=80',
          title: 'Monochrome Dramatic Profile',
          caption: 'Studio strobe lighting at 45-degree key angle',
          aspectRatio: 0.75,
          width: 1500,
          height: 2000,
          sizeMB: 6.3,
        },
        {
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80',
          title: 'Flowing Emerald Silk Motion',
          caption: 'High-speed capture 1/2000s shutter',
          aspectRatio: 0.8,
          width: 1600,
          height: 2000,
          sizeMB: 7.5,
        },
      ],
    },
  ];

  const handleSimulatedBatchUpload = (items: Omit<MediaItem, 'id' | 'galleryId' | 'dateAdded'>[]) => {
    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            addMediaToGallery(galleryId, items);
            setIsUploading(false);
            setUploadProgress(100);
            showToast('Upload Complete', `Added ${items.length} high-resolution items to gallery!`, 'success');
            onClose();
          }, 400);
          return 90;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleCustomPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;

    handleSimulatedBatchUpload([
      {
        type: 'photo',
        url: photoUrl.trim(),
        thumbnailUrl: photoUrl.trim(),
        title: photoTitle.trim() || 'Imported Shoot Photo',
        aspectRatio: 1.5,
        width: 2400,
        height: 1600,
        sizeMB: 7.5,
      },
    ]);
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVideo =
      videoUrl.trim() ||
      'https://assets.mixkit.co/videos/preview/mixkit-bride-holding-a-bouquet-of-flowers-43183-large.mp4';

    handleSimulatedBatchUpload([
      {
        type: 'video',
        url: finalVideo,
        thumbnailUrl:
          videoThumb.trim() ||
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
        title: videoTitle.trim() || 'Cinematic Film Highlights (4K)',
        caption: 'Director highlight reel',
        aspectRatio: 1.77,
        width: 1920,
        height: 1080,
        sizeMB: 42.0,
        duration: '02:30',
        videoEmbedUrl: finalVideo,
      },
    ]);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overlay-animate">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto modal-animate text-neutral-900 dark:text-neutral-100 my-auto">
        <div className="flex items-center justify-between pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">Upload Media to Gallery</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Add full-resolution RAW, JPEGs, or 4K video teasers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Progress Bar if active */}
        {isUploading && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Uploading high-res media...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
              Accelerating via Cloud CDN • Generating multi-resolution client previews
            </p>
          </div>
        )}

        {/* Tabs: Photos vs Video */}
        <div className="mt-6 flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'photos'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <FileImage className="w-4 h-4" /> Add Photos
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Film className="w-4 h-4" /> Add Video Highlight
          </button>
        </div>

        {activeTab === 'photos' ? (
          <div className="mt-6 space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onClick={() => handleSimulatedBatchUpload(presetPhotoSets[0].items)}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-400/60 rounded-3xl p-8 text-center cursor-pointer bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Drag photos here or click to batch upload
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Supports JPG, PNG, TIFF, and RAW files up to 100MB each
              </p>
              <span className="inline-block mt-4 px-4 py-1.5 rounded-xl bg-amber-400 text-neutral-950 text-xs font-bold shadow-md hover:bg-amber-300 transition-colors">
                Click to Simulate 4-Photo Batch
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Demo Shoot Packs
              </p>
              <div className="space-y-2.5">
                {presetPhotoSets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulatedBatchUpload(preset.items)}
                    disabled={isUploading}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {preset.items.slice(0, 3).map((item, i) => (
                          <img
                            key={i}
                            src={item.thumbnailUrl || item.url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover ring-2 ring-white dark:ring-neutral-950"
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                          {preset.label}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {preset.items.length} items • ~
                          {preset.items.reduce((a, b) => a + b.sizeMB, 0).toFixed(1)} MB total
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 group-hover:bg-amber-400 group-hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 font-semibold transition-all">
                      Add Pack
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Or add custom image URL */}
            <form onSubmit={handleCustomPhotoSubmit} className="pt-4 border-t border-neutral-200 dark:border-neutral-850">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Or Add Custom Photo URL
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!photoUrl.trim() || isUploading}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  Add Image
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleVideoSubmit} className="mt-6 space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Video Title
              </label>
              <input
                type="text"
                placeholder="e.g. Balbiano Highlight Reel (4K)"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 mb-3"
              />

              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Video Stream URL (MP4 or Direct Video link)
              </label>
              <input
                type="url"
                placeholder="Leave blank to use pre-configured high-def wedding teaser reel"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400 mb-3"
              />

              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Custom Poster / Thumbnail Image URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={videoThumb}
                onChange={(e) => setVideoThumb(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Encoded for smooth 4K streaming
              </span>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Film className="w-4 h-4" /> Add Video Reel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
