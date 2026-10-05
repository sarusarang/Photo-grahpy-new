import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Loader2,
  Lock,
  Sparkles,
  User,
  Download,
  KeyRound,
  Save,
  CheckCircle2,
  Stamp,
} from 'lucide-react';
import type { Gallery } from '@/types';
import {
  gallerySettingsSchema,
  type GallerySettingsFormData,
} from '@/schemas/atelierSchemas';
import {
  getExpiryStatus,
  calculateExpiryPreset,
  EXPIRY_PRESETS,
  type ExpiryPresetId,
} from '@/utils/expiryUtils';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal';

interface GallerySettingsTabProps {
  gallery: Gallery;
  onSaveSettings: (payload: {
    title: string;
    clientName: string;
    password?: string;
    isPasswordProtected: boolean;
    allowDownloads: boolean;
    expiresAt?: string | null;
    status: 'active' | 'delivered';
    face_search_enabled: boolean;
    watermark_enabled: boolean;
  }) => Promise<void> | void;
  onOpenDeleteConfirm: () => void;
  isSaving: boolean;
}

export const GallerySettingsTab: React.FC<GallerySettingsTabProps> = ({
  gallery,
  onSaveSettings,
  onOpenDeleteConfirm,
  isSaving,
}) => {
  const planQuota = usePlanQuota();
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    isOpen: boolean;
    errorCode: string;
    errorMessage: string;
    lockedFeature: string;
  }>({
    isOpen: false,
    errorCode: '',
    errorMessage: '',
    lockedFeature: '',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GallerySettingsFormData>({
    resolver: zodResolver(gallerySettingsSchema) as any,
    defaultValues: {
      title: gallery.title || '',
      client_name: gallery.clientName || '',
      status: gallery.status === 'delivered' ? 'delivered' : 'active',
      is_password_protected: gallery.isPasswordProtected || false,
      password: gallery.password || '',
      allow_downloads: gallery.allowDownloads ?? true,
      expires_at: gallery.expiresAt || undefined,
      face_search_enabled: Boolean(
        gallery.face_search_enabled ?? (gallery as any).faceSearchEnabled ?? false
      ),
      watermark_enabled: Boolean(
        gallery.watermark_enabled ?? (gallery as any).watermarkEnabled ?? false
      ),
    },
  });

  const isProtected = watch('is_password_protected');
  const allowDownloads = watch('allow_downloads');
  const expiresAt = watch('expires_at');
  const isFaceSearchActive = watch('face_search_enabled');
  const isWatermarkActive = watch('watermark_enabled');

  const [activePresetId, setActivePresetId] = useState<ExpiryPresetId | 'custom' | null>(() => {
    if (!gallery.expiresAt) return 'never';
    return null;
  });

  const [showCustomExpiry, setShowCustomExpiry] = useState(false);
  const [customDateTime, setCustomDateTime] = useState(() => {
    if (gallery.expiresAt) {
      try {
        return new Date(gallery.expiresAt).toISOString().slice(0, 16);
      } catch {
        return '';
      }
    }
    return '';
  });

  // Keep customDateTime in sync when form expiresAt changes
  useEffect(() => {
    if (expiresAt) {
      try {
        setCustomDateTime(new Date(expiresAt).toISOString().slice(0, 16));
      } catch {
        // fallback
      }
    } else {
      setCustomDateTime('');
    }
  }, [expiresAt]);

  const handleApplyPreset = (presetId: ExpiryPresetId) => {
    setActivePresetId(presetId);
    setShowCustomExpiry(false);

    if (presetId === 'never') {
      setValue('expires_at', null as any, { shouldValidate: true });
      setCustomDateTime('');
      return;
    }

    const nextDate = calculateExpiryPreset(presetId);
    setValue('expires_at', nextDate || undefined, { shouldValidate: true });
    if (nextDate) {
      setCustomDateTime(new Date(nextDate).toISOString().slice(0, 16));
    }
  };

  const handleCustomDateTimeChange = (val: string) => {
    setCustomDateTime(val);
    setActivePresetId('custom');

    if (!val) {
      setValue('expires_at', null as any, { shouldValidate: true });
      return;
    }
    try {
      const parsed = new Date(val).toISOString();
      setValue('expires_at', parsed, { shouldValidate: true });
    } catch {
      // Invalid format
    }
  };

  const onFormSubmit = (data: GallerySettingsFormData) => {
    onSaveSettings({
      title: data.title.trim(),
      clientName: (data.client_name || '').trim(),
      password: data.is_password_protected && data.password ? data.password.trim() : '',
      isPasswordProtected: Boolean(data.is_password_protected),
      allowDownloads: data.allow_downloads,
      expiresAt: data.expires_at || null,
      status: gallery.status === 'delivered' ? 'delivered' : 'active',
      face_search_enabled: Boolean(data.face_search_enabled),
      watermark_enabled: Boolean(data.watermark_enabled),
    });
  };

  const expiryStatus = getExpiryStatus(expiresAt || undefined);

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/90 space-y-8 shadow-sm backdrop-blur-sm"
      >
        {/* ─── Header: Title & Context ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200/80 dark:border-neutral-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-serif text-neutral-900 dark:text-white font-bold tracking-tight">
                Gallery Configuration
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20">
                {gallery.status || 'Active'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Manage delivery details, guest authentication, download permissions, and automated lifecycle policies.
            </p>
          </div>
        </div>

        {/* ─── Section 1: General Details (2 Fields in a Row) ─── */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold block">
            General Information
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Field 1: Gallery Title */}
            <div>
              <label className="atelier-label">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span>Gallery Title</span>
                  <span className="text-amber-500">*</span>
                </span>
              </label>
              <div className="atelier-input-wrapper">
                <div className="atelier-input-icon">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. Elena & Marcus Wedding"
                  className="atelier-input font-medium atelier-input-with-icon"
                />
              </div>
              {errors.title && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Field 2: Client Name */}
            <div>
              <label className="atelier-label">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span>Client Name</span>
                </span>
              </label>
              <div className="atelier-input-wrapper">
                <div className="atelier-input-icon">
                  <User className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="text"
                  {...register('client_name')}
                  placeholder="e.g. Elena Rostova"
                  className="atelier-input font-medium atelier-input-with-icon"
                />
              </div>
              {errors.client_name && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium">{errors.client_name.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Section 2: Security, Access & Branding (Balanced 2x2 Grid) ─── */}
        <div className="space-y-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold block">
              Client Access, Security & Protection
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Control authentication, client download permissions, copyright watermarking, and AI discovery tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* ─── Card 1: Require PIN Password ─── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-[#14151f] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between space-y-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isProtected
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isProtected ? (
                        <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <Lock className="w-5 h-5 stroke-[2]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">Require PIN Password</p>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isProtected
                              ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {isProtected ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {isProtected
                          ? 'Clients must enter this PIN code before accessing or downloading the collection.'
                          : 'Password protection is turned off. Anyone with the direct link can view the gallery.'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isProtected}
                    onClick={() => {
                      const nextVal = !isProtected;
                      setValue('is_password_protected', nextVal, { shouldValidate: true });
                      if (!nextVal) {
                        setValue('password', '', { shouldValidate: true });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                      isProtected ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                        isProtected ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Password Input Drawer */}
                {isProtected && (
                  <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 animate-in fade-in duration-200 space-y-1.5">
                    <label className="atelier-label">
                      <span className="flex items-center gap-1.5 font-semibold text-xs">
                        <span>Client Access PIN / Password</span>
                        <span className="text-amber-500">*</span>
                      </span>
                    </label>
                    <div className="atelier-input-wrapper">
                      <div className="atelier-input-icon">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Set Password PIN (min 3 characters, e.g. 2026 or secret)"
                        {...register('password')}
                        className="atelier-input font-mono text-xs atelier-input-with-icon"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Card 2: Allow Client Downloads ─── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-[#14151f] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between space-y-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        allowDownloads
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Download className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">Allow Client Downloads</p>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            allowDownloads
                              ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {allowDownloads ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        Permit clients and guests to download full-resolution single images or bundle entire collections into ZIP archives.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowDownloads}
                    onClick={() => setValue('allow_downloads', !allowDownloads, { shouldValidate: true })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                      allowDownloads ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                        allowDownloads ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Card 3: Watermark Photos ─── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-[#14151f] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between space-y-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isWatermarkActive
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Stamp className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">Watermark Photos</p>
                        {!planQuota.watermarkEnabled ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Plan Upgrade Required
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isWatermarkActive
                                ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {isWatermarkActive ? 'Active' : 'Off'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        Brand every photo in this gallery with your studio watermark when viewed online or downloaded.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch or Upgrade Trigger */}
                  {planQuota.watermarkEnabled ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isWatermarkActive}
                      onClick={() => {
                        setValue('watermark_enabled', !isWatermarkActive, { shouldValidate: true });
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                        isWatermarkActive ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                          isWatermarkActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeModalConfig({
                          isOpen: true,
                          errorCode: 'WATERMARK_LOCKED',
                          errorMessage: `Studio Watermarking Suite is not included in your current studio plan (${planQuota.planName}). Upgrade your plan to brand client galleries with your custom copyright watermarks.`,
                          lockedFeature: 'Custom Studio Watermark Suite',
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade</span>
                    </button>
                  )}
                </div>

                {isWatermarkActive && (
                  <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 animate-in fade-in duration-200">
                    <span className="font-mono truncate">
                      Watermark: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">"{gallery.watermark_text || gallery.photographerName || gallery.studioName || 'Photographer'}"</strong>
                    </span>
                    <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0 font-medium ml-2">
                      {gallery.watermark_position || 'bottom-right'}
                    </span>
                  </div>
                )}

                {!planQuota.watermarkEnabled && (
                  <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Available on all Standard and Studio Premium plans.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeModalConfig({
                          isOpen: true,
                          errorCode: 'WATERMARK_LOCKED',
                          errorMessage: `Studio Watermarking Suite is not included in your current studio plan (${planQuota.planName}). Upgrade your plan to brand client galleries with your custom copyright watermarks.`,
                          lockedFeature: 'Custom Studio Watermark Suite',
                        });
                      }}
                      className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer underline underline-offset-2 shrink-0 ml-2"
                    >
                      View Plans →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Card 4: AI Biometric Face Search ─── */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-[#14151f] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between space-y-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isFaceSearchActive
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">AI Biometric Face Search</p>
                        {!planQuota.faceSearchEnabled ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Plan Upgrade Required
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isFaceSearchActive
                                ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {isFaceSearchActive ? 'Active' : 'Off'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        Allows clients and guests to upload a selfie to instantly find all photographs featuring their face.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch or Upgrade Trigger */}
                  {planQuota.faceSearchEnabled ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isFaceSearchActive}
                      onClick={() => {
                        setValue('face_search_enabled', !isFaceSearchActive, { shouldValidate: true });
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                        isFaceSearchActive ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                          isFaceSearchActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeModalConfig({
                          isOpen: true,
                          errorCode: 'AI_FACE_SEARCH_LOCKED',
                          errorMessage: `AI Biometric Face Search is not included in your current studio plan (${planQuota.planName}). Upgrade your plan to enable AI facial indexing and selfie guest lookup across all your galleries.`,
                          lockedFeature: 'AI Biometric Face Search',
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade</span>
                    </button>
                  )}
                </div>

                {!planQuota.faceSearchEnabled && (
                  <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Available on Standard Annual and Studio Premium plans.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeModalConfig({
                          isOpen: true,
                          errorCode: 'AI_FACE_SEARCH_LOCKED',
                          errorMessage: `AI Biometric Face Search is not included in your current studio plan (${planQuota.planName}). Upgrade your plan to enable AI facial indexing and selfie guest lookup across all your galleries.`,
                          lockedFeature: 'AI Biometric Face Search',
                        });
                      }}
                      className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer underline underline-offset-2 shrink-0 ml-2"
                    >
                      View Plans →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 3: Link Lifecycle & Expiration Policy (Spacious Full-Width Card) ─── */}
        <div className="space-y-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold block">
              Link Lifecycle & Expiration Policy
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Set automated access windows or keep your client galleries permanently active online.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-neutral-50 dark:bg-[#14151f] border border-neutral-200/90 dark:border-neutral-800/90 space-y-6 transition-all hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-xs">
            {/* Header: Title + Status Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Link Access Validity Period
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Automatically restrict client viewing and downloads after the chosen deadline.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-auto shrink-0">
                {expiryStatus.isExpired ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Link Expired</span>
                  </span>
                ) : expiryStatus.isExpiringSoon ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Active ({expiryStatus.remainingText})</span>
                  </span>
                ) : expiresAt ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active ({expiryStatus.daysRemaining} days left)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold border border-neutral-300/60 dark:border-neutral-700/60">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Never Expires (Permanent)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Presets Button Row */}
            <div className="space-y-2 pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
              <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Select Validity Duration:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {EXPIRY_PRESETS.map((preset) => {
                  const isSelected =
                    (!expiresAt && preset.id === 'never') ||
                    (activePresetId === preset.id);

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-400/80 dark:hover:border-amber-400/80 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowCustomExpiry(!showCustomExpiry)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    showCustomExpiry || activePresetId === 'custom'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-400 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Custom Date...</span>
                </button>
              </div>
            </div>

            {/* Custom Date Input Drawer */}
            {showCustomExpiry && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:max-w-xs">
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                      className="w-full atelier-input font-mono text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('never')}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-medium cursor-pointer transition-colors shrink-0"
                  >
                    Clear Expiry
                  </button>
                </div>

                {customDateTime && (
                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {expiryStatus.isExpired ? (
                      <span className="text-rose-500">
                        Warning: Selected time is in the past. The link will expire immediately upon saving.
                      </span>
                    ) : (
                      <span>
                        Access closes on: <strong className="text-amber-500 font-semibold">{expiryStatus.humanFormatted}</strong> ({expiryStatus.remainingText})
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Save Action Bar ─── */}
        <div className="pt-6 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All settings take effect across live client links and download portals immediately upon saving.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      {/* ─── Danger Zone: Delete Gallery (Full Width Card) ─── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-rose-500/[0.04] dark:bg-rose-500/[0.03] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h4>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Permanently delete this gallery and all of its uploaded photos. This action cannot be reversed.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDeleteConfirm}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shrink-0"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Gallery</span>
        </button>
      </div>

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={upgradeModalConfig.isOpen}
        onClose={() => setUpgradeModalConfig((prev) => ({ ...prev, isOpen: false }))}
        errorCode={upgradeModalConfig.errorCode}
        errorMessage={upgradeModalConfig.errorMessage}
        lockedFeature={upgradeModalConfig.lockedFeature}
      />
    </div>
  );
};
