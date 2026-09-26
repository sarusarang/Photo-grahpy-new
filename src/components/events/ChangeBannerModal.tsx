import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Upload, Check, Eye } from 'lucide-react';
import type { LiveEvent } from '../../types/event';
import { CURATED_EVENT_BANNERS } from '../../data/eventData';
import { useEvent } from '../../context/EventContext';
import { useToast } from '../ui/Toast';

interface ChangeBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LiveEvent;
}

export const ChangeBannerModal: React.FC<ChangeBannerModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { updateEventBanner } = useEvent();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'event-photos' | 'presets' | 'upload'>('event-photos');
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string>(event.bannerUrl);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyBanner = (url: string) => {
    setSelectedBannerUrl(url);
    updateEventBanner(event.id, url);
    showToast('Banner Updated', 'Editorial template banner changed successfully.', 'success');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedBannerUrl(dataUrl);
      updateEventBanner(event.id, dataUrl);
      showToast('Custom Banner Uploaded', 'New banner image applied to event template.', 'success');
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white dark:bg-[#111218] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl rounded-3xl my-auto modal-animate max-h-[min(90vh,780px)] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Template Customization
              </span>
              <h3 className="text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Change Event Editorial Banner
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Current Banner Live Preview */}
          <div className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg group">
            <img
              src={selectedBannerUrl}
              alt="Current Banner Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

            {/* Typography overlay simulating editorial hero */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-amber-200/90 mb-1">
                EDITORIAL HERO BANNER
              </span>
              <h4 className="text-xl sm:text-2xl font-serif font-light text-white drop-shadow-lg line-clamp-1">
                {event.title}
              </h4>
              <span className="text-xs font-mono text-neutral-300 mt-1">
                {event.venue}
              </span>
            </div>

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-amber-300 flex items-center gap-1.5 border border-amber-400/20">
              <Eye className="w-3 h-3" />
              <span>Active Guest View</span>
            </div>
          </div>

          {/* Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <button
              onClick={() => setActiveTab('event-photos')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'event-photos'
                  ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              From Event Photos ({event.media.length})
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              Curated Presets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              Upload / Custom URL
            </button>
          </div>

          {/* Tab 1: From Event Photos */}
          {activeTab === 'event-photos' && (
            <div className="space-y-3">
              {event.media.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                  No photos uploaded to this event yet. Upload photos first or choose a curated preset.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                  {event.media.map((item) => {
                    const isSelected = selectedBannerUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleApplyBanner(item.url)}
                        className={`relative aspect-[16/10] rounded-xl overflow-hidden group border-2 transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.title || 'Event visual'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-2 py-1 rounded bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold">
                            Select Banner
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 p-1 rounded-full bg-amber-400 text-neutral-950 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-mono text-white truncate drop-shadow">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {CURATED_EVENT_BANNERS.map((preset) => {
                const isSelected = selectedBannerUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyBanner(preset.url)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden group border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-amber-400 text-neutral-950 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-serif font-bold text-white truncate">{preset.name}</p>
                      <span className="text-[9px] font-mono text-amber-300">{preset.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Upload from Computer or Enter URL */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-amber-400/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-neutral-50 dark:bg-neutral-950/50 group">
                <Upload className="w-8 h-8 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-500 transition-colors mb-2" />
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Click to upload banner image</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                  JPEG, PNG or WebP • Recommended 1920x1080 or higher
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-700 dark:text-neutral-400">Or Paste Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        handleApplyBanner(customUrlInput.trim());
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-[#111218]/90 backdrop-blur-xs flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-xs font-mono transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
