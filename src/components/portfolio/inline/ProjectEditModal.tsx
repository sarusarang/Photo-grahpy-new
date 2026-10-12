import React, { useState } from 'react';
import type { PortfolioProject } from '../../../types/portfolio';
import { CURATED_HERO_PRESETS } from '../../../services/portfolioService';
import { X, Check, Images, Trash2 } from 'lucide-react';

export interface ProjectEditModalProps {
  project?: PortfolioProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedProject: PortfolioProject) => void;
  onDelete?: (projectId: string) => void;
}

const CATEGORIES: PortfolioProject['category'][] = [
  'weddings',
  'editorial',
  'commercial',
  'pre-wedding',
  'cinematic',
  'portrait',
];

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = !project;

  const [title, setTitle] = useState(project?.title || '');
  const [category, setCategory] = useState<PortfolioProject['category']>(project?.category || 'weddings');
  const [coverUrl, setCoverUrl] = useState(project?.coverUrl || CURATED_HERO_PRESETS[0].url);
  const [year, setYear] = useState(project?.year || '2026');
  const [location, setLocation] = useState(project?.location || '');
  const [description, setDescription] = useState(project?.description || '');
  const [clientName, setClientName] = useState(project?.clientName || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverUrl.trim()) return;

    const saved: PortfolioProject = {
      id: project?.id || `proj-${Date.now()}`,
      title: title.trim(),
      category,
      coverUrl: coverUrl.trim(),
      year: year.trim() || '2026',
      location: location.trim() || 'Studio',
      description: description.trim(),
      clientName: clientName.trim() || undefined,
      mediaCount: project?.mediaCount || 24,
      highlightMedia: project?.highlightMedia || [coverUrl],
    };

    onSave(saved);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
              <Images className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isNew ? 'Add Featured Project' : 'Edit Project Details'}
              </h3>
              <p className="text-[11px] text-neutral-400">Directly edit project information shown on your portfolio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Royal Palace Udaipur Celebration"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          {/* Category & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PortfolioProject['category'])}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 text-xs font-mono capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
          </div>

          {/* Location & Client Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Taj Lake Palace, Udaipur"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Client / Couple Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Ananya & Kabir"
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Cover Photo *
              </label>
              <label className="text-[11px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const res = event.target?.result as string;
                        if (res) setCoverUrl(res);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://... or upload a photo"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
            {/* Quick Preview & Presets */}
            <div className="flex items-center gap-2 mt-2">
              {coverUrl && (
                <div className="w-12 h-10 rounded-lg overflow-hidden border border-amber-400/50 shrink-0">
                  <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] text-neutral-400 items-center">
                <span className="shrink-0 text-neutral-500">Presets:</span>
                {CURATED_HERO_PRESETS.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverUrl(p.url)}
                    className="shrink-0 w-12 h-8 rounded-md overflow-hidden border border-neutral-800 hover:border-amber-400 transition-colors"
                    title={p.title}
                  >
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Story / Description */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Story / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story behind this shoot..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            {!isNew && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this project from your portfolio?')) {
                    onDelete(project.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isNew ? 'Add to Works' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
