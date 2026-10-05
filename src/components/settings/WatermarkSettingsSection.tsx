import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Stamp,
  Sparkles,
  Sliders,
  LayoutGrid,
  CheckCircle2,
  Loader2,
  Lock,
  ArrowRight,
  Eye,
  Type,
  ShieldAlert,
} from 'lucide-react';
import { usePhotographerProfile, useUpdateWatermark } from '@/service/profile/useProfile';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal';
import { WatermarkOverlay, type WatermarkPosition } from '@/components/gallery/WatermarkOverlay';
import {
  watermarkSettingsSchema,
  type WatermarkSettingsFormData,
} from '@/schemas/atelierSchemas';

interface WatermarkSettingsSectionProps {
  onManagePlan?: () => void;
}

const POSITION_OPTIONS: { id: WatermarkPosition; label: string; description: string }[] = [
  { id: 'bottom-right', label: 'Bottom Right', description: 'Classic editorial copyright placement' },
  { id: 'bottom-left', label: 'Bottom Left', description: 'Subtle left-aligned studio imprint' },
  { id: 'top-right', label: 'Top Right', description: 'Header corner branding' },
  { id: 'center', label: 'Center Focus', description: 'Direct center copyright security' },
  { id: 'tiled', label: 'Tiled Pattern', description: 'Full-bleed repeating diagonal protection' },
];

export const WatermarkSettingsSection: React.FC<WatermarkSettingsSectionProps> = ({
  onManagePlan,
}) => {
  const planQuota = usePlanQuota();
  const { data: profile, isLoading: isLoadingProfile } = usePhotographerProfile();
  const { mutate: updateWatermark, isPending: isSaving } = useUpdateWatermark();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Sample preview image for live interactive feedback
  const sampleImage =
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<WatermarkSettingsFormData>({
    resolver: zodResolver(watermarkSettingsSchema) as any,
    defaultValues: {
      enable_watermark: true,
      watermark_text: '',
      watermark_opacity: 0.45,
      watermark_position: 'bottom-right',
    },
  });

  const enableWatermark = watch('enable_watermark');
  const watermarkText = watch('watermark_text');
  const watermarkOpacity = watch('watermark_opacity');
  const watermarkPosition = watch('watermark_position');

  // Initialize from live profile API
  useEffect(() => {
    if (profile) {
      // The default watermark name MUST be the photographer's name
      const photographerName =
        profile.name ||
        (profile as any).full_name ||
        (profile as any).user_full_name ||
        profile.user_username ||
        'Photographer';

      const isOldPlaceholder =
        !profile.watermark_text ||
        profile.watermark_text === '© Ex Studio' ||
        profile.watermark_text === 'Ex Studio' ||
        profile.watermark_text === '© ATELIER STUDIO' ||
        profile.watermark_text === '© STUDIO';

      const defaultText = isOldPlaceholder
        ? `© ${photographerName}`
        : profile.watermark_text;

      reset({
        enable_watermark: profile.enable_watermark ?? true,
        watermark_text: defaultText,
        watermark_opacity:
          typeof profile.watermark_opacity === 'number' ? profile.watermark_opacity : 0.45,
        watermark_position:
          (['bottom-right', 'bottom-left', 'top-right', 'center', 'tiled'].includes(profile.watermark_position as any)
            ? (profile.watermark_position as any)
            : 'bottom-right'),
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: WatermarkSettingsFormData) => {
    updateWatermark({
      enable_watermark: Boolean(data.enable_watermark),
      watermark_text: data.watermark_text.trim(),
      watermark_opacity: Number(data.watermark_opacity),
      watermark_position: data.watermark_position,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Plan Entitlement Warning if feature is locked */}
      {!planQuota.watermarkEnabled && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-neutral-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Studio Watermarking Suite
                </h4>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  Plan Upgrade Required
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Included in all Standard and Studio Premium plans. Protect your client deliveries with high-res watermark branding.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onManagePlan) onManagePlan();
              else setIsUpgradeModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      )}

      {/* Main Configuration Card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800/90 space-y-8 shadow-sm"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200/80 dark:border-neutral-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif text-neutral-900 dark:text-white font-bold tracking-tight">
                  Studio Watermarking Suite
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Configure the default copyright branding that appears across your proofing galleries.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !planQuota.watermarkEnabled || !isDirty}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {/* Content Layout: 2 Columns (Controls + Live Interactive Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Watermark Text */}
            <div className="space-y-2">
              <label className="atelier-label">
                <span className="flex items-center gap-1.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                  <Type className="w-3.5 h-3.5 text-amber-500" />
                  <span>Watermark Text / Studio Signature</span>
                </span>
              </label>
              <input
                type="text"
                {...register('watermark_text')}
                placeholder="e.g. © Sarah Jenkins (Photographer Name)"
                className="atelier-input font-medium text-xs sm:text-sm"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Shown along with a subtle copyright glyph to deter unauthorized client downloads.
              </p>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-[#14151f] border border-neutral-200/90 dark:border-neutral-800/90">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Watermark Opacity
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  {Math.round(watermarkOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.0"
                step="0.05"
                {...register('watermark_opacity', { valueAsNumber: true })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>10% (Whisper Subtle)</span>
                <span>45% (Balanced Recommended)</span>
                <span>100% (High Contrast)</span>
              </div>
            </div>

            {/* Position Selector */}
            <div className="space-y-3">
              <label className="atelier-label">
                <span className="flex items-center gap-1.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                  <span>Watermark Screen Placement</span>
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POSITION_OPTIONS.map((pos) => {
                  const isSelected = watermarkPosition === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setValue('watermark_position', pos.id as any, { shouldDirty: true })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400 shadow-xs'
                          : 'bg-neutral-50 dark:bg-[#14151f] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{pos.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                        {pos.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                  Live Client Preview
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                Studio View
              </span>
            </div>

            <div className="relative w-full h-[380px] sm:h-[430px] lg:h-[460px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl group">
              <img
                src={sampleImage}
                alt="Sample Preview"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Watermark Overlay Preview */}
              <WatermarkOverlay
                text={watermarkText}
                opacity={watermarkOpacity}
                position={watermarkPosition}
                size="md"
              />

              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Interactive Sample Photo</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
              Watermarks render in real time on client view. You can also turn watermarks on or off for individual galleries in each gallery's settings.
            </p>
          </div>
        </div>
      </form>

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        errorCode="WATERMARK_LOCKED"
        errorMessage={`Studio Watermarking Suite is not included in your current studio plan (${planQuota.planName}). Upgrade your plan to brand client galleries with your custom copyright watermarks.`}
        lockedFeature="Custom Studio Watermark Suite"
      />
    </div>
  );
};
