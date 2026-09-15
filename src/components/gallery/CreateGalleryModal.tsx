import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import { GALLERY_TEMPLATES } from '../../data/demoData';
import type { GalleryTemplateId, Gallery } from '../../types';
import { X, FolderPlus, Sparkles, Lock, Calendar, User } from 'lucide-react';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newGallery: Gallery) => void;
}

export const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createGallery } = useGallery();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [templateId, setTemplateId] = useState<GalleryTemplateId>('editorial');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
  );

  if (!isOpen) return null;

  const sampleCovers = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title Required', 'Please enter a gallery name.', 'error');
      return;
    }

    const newGal = createGallery({
      title,
      clientName: clientName.trim() || 'Private Client',
      clientEmail: clientEmail.trim(),
      eventDate,
      templateId,
      isPasswordProtected,
      password: isPasswordProtected ? password : '',
      coverImage,
    });

    showToast('Gallery Created', `"${title}" is ready for photo and video uploads!`, 'success');
    if (onCreated) onCreated(newGal);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overlay-animate">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto modal-animate text-neutral-900 dark:text-neutral-100 my-auto">
        <div className="flex items-center justify-between pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-neutral-900 dark:text-white tracking-tight font-bold">Create New Client Gallery</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Provision a high-speed cloud drive for this shoot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Gallery Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Client Details */}
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
                Client Notification Email (optional)
              </label>
              <input
                type="email"
                placeholder="client@domain.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Template Selection */}
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
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => setTemplateId(tpl.id)}
                  className={`relative p-3 rounded-2xl border text-left transition-all ${
                    templateId === tpl.id
                      ? 'bg-amber-500/10 dark:bg-neutral-800 border-amber-500 ring-1 ring-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-neutral-50 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={tpl.previewImage}
                    alt={tpl.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{tpl.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {tpl.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cover Photo Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              Select Initial Cover Style
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {sampleCovers.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCoverImage(img)}
                  className={`shrink-0 relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    coverImage === img
                      ? 'border-amber-500 ring-2 ring-amber-500/50 scale-105'
                      : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="cover option" className="w-full h-full object-cover" />
                </button>
              ))}
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
              onClick={onClose}
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
