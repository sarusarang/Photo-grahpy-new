import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Check, X, Upload, Sparkles } from 'lucide-react';
import { CURATED_HERO_PRESETS } from '../../../services/portfolioService';
import { cn } from '../../../lib/utils';

export interface EditableImageProps {
  src: string;
  alt: string;
  onSave: (newUrl: string) => void;
  isEditable?: boolean;
  className?: string;
  containerClassName?: string;
  label?: string;
  presets?: { title: string; url: string }[];
}

export const EditableImage: React.FC<EditableImageProps> = ({
  src,
  alt,
  onSave,
  isEditable = false,
  className = '',
  containerClassName = '',
  label = 'Photo',
  presets = CURATED_HERO_PRESETS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(src);
  const [activeTab, setActiveTab] = useState<'url' | 'presets' | 'upload'>('presets');

  const handleApply = () => {
    if (draftUrl.trim() && draftUrl !== src) {
      onSave(draftUrl.trim());
    }
    setIsOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setDraftUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn('relative group', containerClassName)}>
      <img src={src} alt={alt} className={className} />

      {/* In-Place Edit Trigger Badge */}
      {isEditable && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDraftUrl(src);
              setIsOpen(true);
            }}
            className="pointer-events-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-2xl flex items-center gap-2 transform group-hover:scale-105 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Change {label}</span>
          </button>
        </div>
      )}

      {/* In-Place Image Editor Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Update {label}</h3>
                  <p className="text-[11px] text-neutral-400">Choose a luxury preset or enter a direct image URL</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-neutral-950 border border-neutral-800 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'presets' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                )}
              >
                <Sparkles className="w-3 h-3" />
                <span>Curated Presets</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'url' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                )}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Image URL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'upload' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                )}
              >
                <Upload className="w-3 h-3" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDraftUrl(preset.url)}
                    className={cn(
                      'relative aspect-video rounded-xl overflow-hidden border-2 text-left group transition-all',
                      draftUrl === preset.url ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-neutral-800 hover:border-neutral-700'
                    )}
                  >
                    <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
                      <span className="text-[10px] font-medium text-white line-clamp-1 leading-tight">{preset.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'url' && (
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Direct Image URL</label>
                <input
                  type="url"
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="border-2 border-dashed border-neutral-800 rounded-xl p-6 text-center hover:border-amber-400/50 transition-colors">
                <input
                  type="file"
                  id="image-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="image-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-medium text-neutral-300">Click to select photo from your device</span>
                  <span className="text-[10px] text-neutral-500 font-mono">JPG, PNG, WEBP (under 10MB)</span>
                </label>
              </div>
            )}

            {/* Preview Banner */}
            {draftUrl && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                <img src={draftUrl} alt="Preview" className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-amber-400 font-bold">
                  Preview
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!draftUrl.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Apply Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
