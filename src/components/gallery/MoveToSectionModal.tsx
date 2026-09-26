import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  FolderInput,
  FolderPlus,
  Check,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Gallery, MediaItem } from '../../types';
import { useGallery } from '../../context/GalleryContext';
import { useToast } from '../ui/Toast';
import { useMoveMediaSection } from '@/hooks/useAtelierQueries';
import {
  moveToSectionModalSchema,
  type MoveToSectionModalFormData,
} from '@/schemas/atelierSchemas';

const SUGGESTED_SECTIONS = [
  'HIGHLIGHTS',
  'CEREMONY',
  'RECEPTION',
  'PORTRAITS',
  'GETTING READY',
  'DETAILS',
  'FAMILY',
  'PARTY',
];

interface MoveToSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  mediaItems: MediaItem[];
  onSuccess?: (targetSection: string, count: number) => void;
}

export const MoveToSectionModal: React.FC<MoveToSectionModalProps> = ({
  isOpen,
  onClose,
  gallery,
  mediaItems,
  onSuccess,
}) => {
  const { moveMediaToSection } = useGallery();
  const { showToast } = useToast();
  const { mutateAsync: moveMediaApi, isPending } = useMoveMediaSection(gallery.id);

  // Extract all currently known sections in this gallery
  const gallerySections = useMemo(() => {
    const list = new Set<string>(gallery.sections || []);
    gallery.media.forEach((m) => {
      if (m.sectionTitle && m.sectionTitle.trim()) {
        list.add(m.sectionTitle.trim().toUpperCase());
      }
    });
    return Array.from(list);
  }, [gallery.sections, gallery.media]);

  // Determine current origin sections
  const currentOrigins = useMemo(() => {
    const origins = new Set<string>();
    mediaItems.forEach((m) => {
      origins.add(m.sectionTitle ? m.sectionTitle.toUpperCase() : 'UNASSIGNED');
    });
    return Array.from(origins);
  }, [mediaItems]);

  const {
    watch,
    setValue,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MoveToSectionModalFormData>({
    resolver: zodResolver(moveToSectionModalSchema) as any,
    defaultValues: {
      mode: 'existing',
      selectedSection: '',
      newSectionTitle: '',
    },
  });

  const mode = watch('mode');
  const selectedSection = watch('selectedSection');
  const newSectionTitle = watch('newSectionTitle') || '';

  // Initialize selected section whenever modal opens or media changes
  useEffect(() => {
    if (!isOpen) return;

    if (gallerySections.length > 0) {
      const altSection = gallerySections.find((s) => !currentOrigins.includes(s));
      const initial = altSection || gallerySections[0];
      setValue('mode', 'existing');
      setValue('selectedSection', initial);
      setValue('newSectionTitle', '');
    } else {
      setValue('mode', 'new');
      setValue('newSectionTitle', 'CEREMONY');
      setValue('selectedSection', '');
    }
  }, [isOpen, gallerySections, currentOrigins, setValue]);

  // Lock background scroll & handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isPending, onClose]);

  if (!isOpen || mediaItems.length === 0) return null;

  const onSubmit = async (data: MoveToSectionModalFormData) => {
    let targetSection = '';
    if (data.mode === 'unassigned') {
      targetSection = 'UNASSIGNED';
    } else if (data.mode === 'new') {
      targetSection = (data.newSectionTitle || '').trim().toUpperCase();
    } else {
      targetSection = (data.selectedSection || '').trim().toUpperCase();
    }

    const mediaIds = mediaItems.map((m) => m.id);

    try {
      await moveMediaApi({ mediaIds, targetSection });
      moveMediaToSection(gallery.id, mediaIds, targetSection);

      const displayName = targetSection === 'UNASSIGNED' ? 'General (Unassigned)' : targetSection;
      showToast(
        'Photos Moved',
        `Moved ${mediaItems.length} photo${mediaItems.length > 1 ? 's' : ''} to "${displayName}".`,
        'success'
      );

      if (onSuccess) {
        onSuccess(targetSection, mediaItems.length);
      }

      reset();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to move photos to section.';
      showToast('Move Failed', msg, 'error');
    }
  };

  const destinationLabel =
    mode === 'unassigned'
      ? 'General (Unassigned)'
      : mode === 'new'
      ? newSectionTitle.trim() || 'New Section'
      : selectedSection || 'Selected Section';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#111218] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl rounded-3xl my-auto modal-animate max-h-[min(90vh,740px)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Gallery Organization
              </span>
              <h3 className="text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Move Photos to Section
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Selected Photos Preview Strip */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {mediaItems.length} {mediaItems.length === 1 ? 'Photo' : 'Photos'} Selected
                </span>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  From:{' '}
                  {currentOrigins.map((origin) => (
                    <span
                      key={origin}
                      className="inline-block ml-1 px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold uppercase text-[9px]"
                    >
                      {origin}
                    </span>
                  ))}
                </span>
              </div>

              {/* Thumbnails row */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {mediaItems.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700/80 shadow-xs"
                  >
                    <img
                      src={item.url || item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {mediaItems.length > 6 && (
                  <div className="w-14 h-14 rounded-xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    +{mediaItems.length - 6}
                  </div>
                )}
              </div>
            </div>

            {/* Destination Mode Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Choose Destination Section:
              </label>

              {/* Existing Sections List */}
              {gallerySections.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      Existing Gallery Sections
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gallerySections.map((sec) => {
                      const isSelected = mode === 'existing' && selectedSection === sec;
                      const count = gallery.media.filter(
                        (m) => (m.sectionTitle || '').toUpperCase() === sec
                      ).length;

                      return (
                        <button
                          key={sec}
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            setValue('mode', 'existing', { shouldValidate: true });
                            setValue('selectedSection', sec, { shouldValidate: true });
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400 dark:border-amber-400 ring-1 ring-amber-400 text-neutral-900 dark:text-white shadow-xs'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-500 text-neutral-950'
                                  : 'border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-mono font-bold uppercase truncate">
                              {sec}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0 font-medium">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Create New Section Option */}
              <div
                onClick={() => {
                  if (!isPending) setValue('mode', 'new', { shouldValidate: true });
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  mode === 'new'
                    ? 'bg-amber-400/10 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        mode === 'new'
                          ? 'border-amber-500 bg-amber-500 text-neutral-950'
                          : 'border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {mode === 'new' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Create New Section
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    New Category
                  </span>
                </div>

                {mode === 'new' && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                    <input
                      type="text"
                      {...register('newSectionTitle')}
                      onChange={(e) => {
                        setValue('newSectionTitle', e.target.value.toUpperCase(), {
                          shouldValidate: true,
                        });
                      }}
                      placeholder="e.g. SANGEET, AFTERPARTY, RECEPTION..."
                      disabled={isPending}
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-amber-400 placeholder:text-neutral-400 disabled:opacity-50"
                    />

                    {errors.newSectionTitle && (
                      <p className="text-xs text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.newSectionTitle.message}
                      </p>
                    )}

                    {/* Quick suggestion pills */}
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block mb-1.5">
                        Quick suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_SECTIONS.filter(
                          (s) => !gallerySections.includes(s)
                        ).map((sugg) => (
                          <button
                            key={sugg}
                            type="button"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue('newSectionTitle', sugg, { shouldValidate: true });
                              setValue('mode', 'new', { shouldValidate: true });
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                              newSectionTitle === sugg
                                ? 'bg-amber-400 text-neutral-950 font-bold'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            + {sugg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Unassigned / General Section Option */}
              <div
                onClick={() => {
                  if (!isPending) setValue('mode', 'unassigned', { shouldValidate: true });
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  mode === 'unassigned'
                    ? 'bg-amber-400/10 border-amber-400 ring-1 ring-amber-400 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      mode === 'unassigned'
                        ? 'border-amber-500 bg-amber-500 text-neutral-950'
                        : 'border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {mode === 'unassigned' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                      General / Unassigned
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-mono">
                      Remove from specific section into general gallery pool
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer (Fixed) */}
          <div className="p-4 sm:p-6 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-[#111218]/90 backdrop-blur-xs flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <span>
                    Move {mediaItems.length} Photo{mediaItems.length > 1 ? 's' : ''} to{' '}
                    <span className="underline uppercase">{destinationLabel}</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
