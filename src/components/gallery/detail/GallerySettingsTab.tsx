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
    },
  });

  const isProtected = watch('is_password_protected');
  const allowDownloads = watch('allow_downloads');
  const expiresAt = watch('expires_at');

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
      password: data.password ? data.password.trim() : undefined,
      isPasswordProtected: data.is_password_protected,
      allowDownloads: data.allow_downloads,
      expiresAt: data.expires_at || null,
      status: gallery.status === 'delivered' ? 'delivered' : 'active',
    });
  };

  const expiryStatus = getExpiryStatus(expiresAt || undefined);

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-sm"
      >
        <h3 className="text-lg font-serif text-neutral-900 dark:text-white font-bold">
          Gallery Configuration
        </h3>

        {/* Gallery Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
            Gallery Title <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Elena & Marcus Wedding"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
          />
          {errors.title && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Client Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
            Client Name
          </label>
          <input
            type="text"
            {...register('client_name')}
            placeholder="e.g. Elena Rostova"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
          />
          {errors.client_name && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.client_name.message}</p>
          )}
        </div>

        {/* Password Protection */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">Require PIN Password</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Protect this gallery with client PIN code</p>
            </div>
            <input
              type="checkbox"
              checked={isProtected}
              onChange={(e) => setValue('is_password_protected', e.target.checked, { shouldValidate: true })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {isProtected && (
            <div>
              <input
                type="text"
                placeholder="Set Password PIN (min 3 characters)"
                {...register('password')}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-amber-400"
              />
              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Downloads Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold text-neutral-900 dark:text-white">Allow Client Downloads</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Permit downloading single files or full-gallery ZIPs</p>
          </div>
          <input
            type="checkbox"
            checked={allowDownloads}
            onChange={(e) => setValue('allow_downloads', e.target.checked, { shouldValidate: true })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Link Access Time Window & Expiry */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Link Access Validity & Expiry
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Restrict client viewing and downloading to a specific time period
                </p>
              </div>
            </div>

            {/* Status indicator */}
            {expiryStatus.isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Link Expired</span>
              </span>
            ) : expiryStatus.isExpiringSoon ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>Active ({expiryStatus.remainingText})</span>
              </span>
            ) : expiresAt ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active ({expiryStatus.daysRemaining} days left)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold shrink-0">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Never Expires</span>
              </span>
            )}
          </div>

          {/* Validity Duration Preset Pills */}
          <div>
            <span className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Set Validity Duration:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EXPIRY_PRESETS.map((preset) => {
                const isSelected =
                  (!expiresAt && preset.id === 'never') ||
                  (activePresetId === preset.id);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
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
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPreset('never')}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  Clear Expiry
                </button>
              </div>

              {customDateTime && (
                <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                  {expiryStatus.isExpired ? (
                    <span className="text-rose-500">
                      Warning: Selected time is in the past. The link will expire immediately upon saving.
                    </span>
                  ) : (
                    <span>
                      Access closes on: <strong className="text-amber-400">{expiryStatus.humanFormatted}</strong> ({expiryStatus.remainingText})
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Save Changes</span>
        </button>
      </form>

      {/* Danger Zone: Delete Gallery */}
      <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Permanently delete this gallery and all of its uploaded photos. This action cannot be undone.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDeleteConfirm}
          className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Gallery</span>
        </button>
      </div>
    </div>
  );
};
