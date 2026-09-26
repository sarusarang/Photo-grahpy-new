import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateGallery } from '@/hooks/useAtelierQueries';
import { useToast } from '../ui/Toast';
import { GALLERY_TEMPLATES } from '../../data/demoData';
import { getInitialGalleryCover } from '@/utils/coverImageUtils';
import type { GalleryTemplateId, Gallery, GalleryTemplate } from '../../types';
import { createGallerySchema, type CreateGalleryFormData } from '@/schemas/atelierSchemas';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { X, FolderPlus, Sparkles, Lock, Calendar, User, Loader2, AlertTriangle } from 'lucide-react';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newGallery: Gallery) => void;
}

interface TemplateCardProps {
  template: GalleryTemplate;
  isSelected: boolean;
  isAllowed: boolean;
  onSelect: (id: GalleryTemplateId) => void;
  onLockedClick: (templateName: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  isAllowed,
  onSelect,
  onLockedClick,
}) => (
  <button
    type="button"
    onClick={() => {
      if (!isAllowed) {
        onLockedClick(template.name);
      } else {
        onSelect(template.id);
      }
    }}
    className={`group relative p-3 rounded-2xl border text-left transition-all cursor-pointer ${
      !isAllowed
        ? 'opacity-70 bg-neutral-100/50 dark:bg-neutral-900/40 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-amber-400'
        : isSelected
        ? 'bg-amber-500/10 dark:bg-neutral-800 border-amber-500 ring-1 ring-amber-500 shadow-md shadow-amber-500/10'
        : 'bg-neutral-50 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
    }`}
  >
    <div className="relative">
      <img
        src={template.previewImage}
        alt={template.name}
        className="w-full h-20 object-cover rounded-lg mb-2 group-hover:scale-[1.02] transition-transform duration-200"
      />
      {!isAllowed && (
        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-bold text-[9px] tracking-wider uppercase flex items-center gap-1 shadow-md">
          <Lock className="w-2.5 h-2.5" /> PRO
        </span>
      )}
    </div>
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
  const planQuota = usePlanQuota();
  const { showToast } = useToast();
  const { mutateAsync: apiCreateGallery, isPending } = useCreateGallery();

  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    errorCode?: string;
    errorMessage?: string;
    lockedFeature?: string;
  }>({ isOpen: false });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateGalleryFormData>({
    resolver: zodResolver(createGallerySchema) as any,
    defaultValues: {
      title: '',
      client_name: '',
      client_email: '',
      event_date: new Date().toISOString().split('T')[0],
      description: '',
      template_id: 'editorial',
      visibility: 'public',
      password: '',
      allow_downloads: true,
      allow_favorites: true,
      face_search_enabled: planQuota.faceSearchEnabled,
    },
  });

  const selectedTemplate = watch('template_id');
  const visibility = watch('visibility');
  const isPasswordProtected = visibility === 'password_protected';

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateGalleryFormData) => {
    const initialCover = getInitialGalleryCover(data.template_id);

    try {
      // 1. Try real Backend API call
      const createdFromApi = await apiCreateGallery({
        title: data.title.trim(),
        client_name: data.client_name?.trim() || 'Private Client',
        client_email: data.client_email?.trim() || undefined,
        event_date: data.event_date,
        description: data.description,
        template_id: data.template_id,
        visibility: data.visibility,
        password: isPasswordProtected ? data.password : undefined,
        allow_downloads: data.allow_downloads,
        allow_favorites: data.allow_favorites,
        face_search_enabled: data.face_search_enabled,
        cover_image: initialCover,
      });

      showToast('Gallery Created', `"${data.title}" is ready for photo and video uploads!`, 'success');
      reset();
      if (onCreated) onCreated(createdFromApi as any);
      onClose();
    } catch (err: any) {
      // Plan Enforcement Interceptor
      const errData = err?.response?.data || err?.data;
      if (errData?.upgrade_required || errData?.error_code) {
        setUpgradeModal({
          isOpen: true,
          errorCode: errData.error_code || 'GALLERY_LIMIT_EXCEEDED',
          errorMessage: errData.message || 'Gallery quota reached for your current studio plan.',
          lockedFeature: 'Client Galleries',
        });
        return;
      }

      const message =
        errData?.message ||
        errData?.detail ||
        (typeof errData === 'string' ? errData : null) ||
        err?.message ||
        'Failed to create gallery. Please try again.';
      showToast('Creation Failed', message, 'error');
    }
  };

  return createPortal(
    <>
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
                  Provision high-resolution storage and proofing for this shoot
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isPending}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* Plan Quota Badge */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Studio Plan: <strong className="font-semibold">{planQuota.planName}</strong></span>
              </div>
              <div className="text-[11px] font-mono font-semibold">
                {planQuota.isUnlimitedGalleries ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Unlimited Galleries</span>
                ) : (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    <strong className="text-amber-600 dark:text-amber-400">{planQuota.galleriesRemaining}</strong> of {planQuota.maxGalleries} slots left
                  </span>
                )}
              </div>
            </div>

            {/* Quota Exceeded Warning */}
            {!planQuota.canCreateGallery && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-bold">Gallery Limit Reached ({planQuota.galleriesUsed}/{planQuota.maxGalleries})</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      Your current plan allows up to {planQuota.maxGalleries} client galleries.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUpgradeModal({
                    isOpen: true,
                    errorCode: 'GALLERY_LIMIT_EXCEEDED',
                    errorMessage: `Your ${planQuota.planName} gallery quota of ${planQuota.maxGalleries} has been reached. Upgrade to unlock more client galleries.`,
                    lockedFeature: 'Client Galleries',
                  })}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {/* Gallery Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Gallery Name / Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Villa Balbiano Wedding"
                {...register('title')}
                className={`w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none transition-colors ${
                  errors.title
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-400'
                }`}
              />
              {errors.title && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.title.message}</p>
              )}
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
                    {...register('client_name')}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-400 transition-colors pl-10"
                  />
                  <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Shoot / Event Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    {...register('event_date')}
                    className={`w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border text-neutral-900 dark:text-white text-sm focus:outline-none transition-colors ${
                      errors.event_date
                        ? 'border-rose-500'
                        : 'border-neutral-200 dark:border-neutral-800 focus:border-amber-400'
                    }`}
                  />
                  <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                {errors.event_date && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.event_date.message}</p>
                )}
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
                    isSelected={selectedTemplate === tpl.id}
                    isAllowed={planQuota.isTemplateAllowed(tpl.id)}
                    onSelect={(id) => setValue('template_id', id)}
                    onLockedClick={(name) =>
                      setUpgradeModal({
                        isOpen: true,
                        errorCode: 'PREMIUM_TEMPLATE_LOCKED',
                        errorMessage: `The ${name} layout is a premium template not included in your current studio plan (${planQuota.planName}). Upgrade your plan to unlock premium templates.`,
                        lockedFeature: `${name} Layout`,
                      })
                    }
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/70 dark:bg-neutral-900/60 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Hero cover is chosen automatically. You can customize or change it anytime in Gallery Settings.
                </span>
              </div>
            </div>

            {/* AI Biometric Face Search Option */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white">AI Biometric Face Search</p>
                      {!planQuota.faceSearchEnabled && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                          Upgrade Required
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Allows guests to upload a selfie to find all their photos instantly
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={watch('face_search_enabled')}
                  onChange={(e) => {
                    if (!planQuota.faceSearchEnabled) {
                      setUpgradeModal({
                        isOpen: true,
                        errorCode: 'AI_FACE_SEARCH_LOCKED',
                        errorMessage: `AI Biometric Face Search is not included in your current studio plan (${planQuota.planName}). Upgrade your plan to enable AI facial indexing and selfie guest lookup.`,
                        lockedFeature: 'AI Biometric Face Search',
                      });
                      return;
                    }
                    setValue('face_search_enabled', e.target.checked);
                  }}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
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
                  onChange={(e) =>
                    setValue('visibility', e.target.checked ? 'password_protected' : 'public')
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {isPasswordProtected && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <input
                    type="text"
                    placeholder="Set Access Password (e.g. Balbiano2026)"
                    {...register('password')}
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
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !planQuota.canCreateGallery}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Provisioning...
                  </>
                ) : !planQuota.canCreateGallery ? (
                  <>Limit Reached</>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 stroke-[2.2]" /> Create Gallery
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quota Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false })}
        errorCode={upgradeModal.errorCode}
        errorMessage={upgradeModal.errorMessage}
        lockedFeature={upgradeModal.lockedFeature}
      />
    </>,
    document.body
  );
};

export default CreateGalleryModal;
