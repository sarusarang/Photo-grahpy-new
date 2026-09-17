import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import { GALLERY_TEMPLATES, getRandomCoverImage } from '../../data/demoData';
import type { GalleryTemplateId, Gallery, GalleryTemplate } from '../../types';
import { X, FolderPlus, Sparkles, Lock, Calendar, User } from 'lucide-react';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newGallery: Gallery) => void;
}

interface TemplateCardProps {
  template: GalleryTemplate;
  isSelected: boolean;
  onSelect: (id: GalleryTemplateId) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(template.id)}
    className={`group relative p-3 rounded-2xl border text-left transition-all cursor-pointer ${
      isSelected
        ? 'bg-amber-500/10 dark:bg-neutral-800 border-amber-500 ring-1 ring-amber-500 shadow-md shadow-amber-500/10'
        : 'bg-neutral-50 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
    }`}
  >
    <img
      src={template.previewImage}
      alt={template.name}
      className="w-full h-20 object-cover rounded-lg mb-2 group-hover:scale-[1.02] transition-transform duration-200"
    />
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
        {template.name}
      </p>
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
        {template.badge}
      </span>
    </div>
  </button>
);

export const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createGallery } = useGallery();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [templateId, setTemplateId] = useState<GalleryTemplateId>('editorial');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setClientName('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setTemplateId('editorial');
    setIsPasswordProtected(false);
    setPassword('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title Required', 'Please enter a gallery name.', 'error');
      return;
    }

    const initialCover = getRandomCoverImage();

    const newGal = createGallery({
      title: title.trim(),
      clientName: clientName.trim() || 'Private Client',
      clientEmail: '',
      eventDate,
      templateId,
      isPasswordProtected,
      password: isPasswordProtected ? password : '',
      coverImage: initialCover,
    });

    showToast('Gallery Created', `"${title}" is ready for photo and video uploads!`, 'success');
    resetForm();
    if (onCreated) onCreated(newGal);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md overlay-animate">
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-neutral-950 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-5 sm:p-8 pb-safe shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sheet-animate sm:modal-animate text-neutral-900 dark:text-neutral-100">
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">
                Create New Client Gallery
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                Provision a high-speed cloud drive for this shoot
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Gallery Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              Gallery Name / Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Villa Balbiano Wedding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Client Name & Shoot Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Client Name(s)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Elena & Julian Rossi"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-400 transition-colors pl-10"
                />
                <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Shoot / Event Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
                <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Layout Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Choose Client Gallery Design Layout
              </label>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Can change anytime
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GALLERY_TEMPLATES.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  isSelected={templateId === tpl.id}
                  onSelect={setTemplateId}
                />
              ))}
            </div>

            {/* Subtle Info Note about Cover Selection */}
            <div className="flex items-center gap-2 mt-3 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/70 dark:bg-neutral-900/60 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                An initial hero cover is chosen automatically. You can customize or change it anytime in Gallery Settings.
              </span>
            </div>
          </div>

          {/* Security & Password */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Client Access PIN / Password</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Require clients to enter a password to view or download</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPasswordProtected}
                onChange={(e) => setIsPasswordProtected(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {isPasswordProtected && (
              <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <input
                  type="text"
                  placeholder="Set Access Password (e.g. Balbiano2026)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FolderPlus className="w-4 h-4 stroke-[2.2]" /> Create Gallery
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
