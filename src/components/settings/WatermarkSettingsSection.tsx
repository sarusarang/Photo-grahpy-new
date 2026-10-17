import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Type,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Palette,
  RotateCcw,
  Check,
} from 'lucide-react';
import { usePhotographerProfile, useUpdateWatermark } from '@/service/profile/useProfile';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal';
import {
  WatermarkOverlay,
  type WatermarkPosition,
  type WatermarkFontSize,
  type WatermarkFontStyle,
} from '@/components/gallery/WatermarkOverlay';
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

const FONT_STYLE_OPTIONS: { id: WatermarkFontStyle; label: string; preview: string; fontClass: string }[] = [
  { id: 'serif', label: 'Editorial Serif', preview: 'Cinzel Serif', fontClass: 'font-serif uppercase tracking-[0.2em]' },
  { id: 'sans', label: 'Modern Sans', preview: 'Inter Sans', fontClass: 'font-sans uppercase font-bold tracking-[0.16em]' },
  { id: 'script', label: 'Signature Script', preview: 'Artisan Script', fontClass: 'font-script capitalize tracking-[0.05em] text-sm sm:text-base' },
  { id: 'mono', label: 'Minimal Mono', preview: 'Studio Mono', fontClass: 'font-mono uppercase font-medium tracking-[0.14em]' },
];

const FONT_SIZE_OPTIONS: { id: WatermarkFontSize; label: string; desc: string }[] = [
  { id: 'sm', label: 'Small', desc: 'Subtle & discreet' },
  { id: 'md', label: 'Medium', desc: 'Balanced standard' },
  { id: 'lg', label: 'Large', desc: 'High visibility' },
  { id: 'xl', label: 'X-Large', desc: 'Bold statement' },
];

const COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: '#FFFFFF', label: 'Pure White' },
  { hex: '#F5F5F0', label: 'Studio Ivory' },
  { hex: '#D4AF37', label: 'Imperial Gold' },
  { hex: '#E2A792', label: 'Warm Rose' },
  { hex: '#CBD5E1', label: 'Sleek Silver' },
  { hex: '#18181B', label: 'Deep Onyx' },
];

const SAMPLE_PREVIEWS = [
  {
    id: 'wedding',
    label: 'Golden Hour Wedding',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'portrait',
    label: 'Low-Key Dark Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'editorial',
    label: 'Bright High-Key Studio',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  },
];

export const WatermarkSettingsSection: React.FC<WatermarkSettingsSectionProps> = ({
  onManagePlan,
}) => {
  const planQuota = usePlanQuota();
  const { data: profile } = usePhotographerProfile();
  const { mutate: updateWatermark, isPending: isSaving } = useUpdateWatermark();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Logo file upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sample image in preview
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);

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
      watermark_type: 'text',
      watermark_text: '',
      watermark_opacity: 0.45,
      watermark_position: 'bottom-right',
      watermark_font_size: 'md',
      watermark_font_color: '#FFFFFF',
      watermark_font_style: 'serif',
    },
  });

  const watermarkType = watch('watermark_type');
  const watermarkText = watch('watermark_text') || '';
  const watermarkOpacity = watch('watermark_opacity');
  const watermarkPosition = watch('watermark_position');
  const watermarkFontSize = watch('watermark_font_size');
  const watermarkFontColor = watch('watermark_font_color') || '#FFFFFF';
  const watermarkFontStyle = watch('watermark_font_style');

  // Initialize from live profile API
  useEffect(() => {
    if (profile) {
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

      const profileType = profile.watermark_type === 'image' ? 'image' : 'text';

      const profilePosition = [
        'bottom-right',
        'bottom-left',
        'top-right',
        'center',
        'tiled',
      ].includes(profile.watermark_position as any)
        ? (profile.watermark_position as any)
        : 'bottom-right';

      const profileFontSize = ['sm', 'md', 'lg', 'xl'].includes(
        profile.watermark_font_size as any
      )
        ? (profile.watermark_font_size as any)
        : 'md';

      const profileFontStyle = ['serif', 'sans', 'script', 'mono'].includes(
        profile.watermark_font_style as any
      )
        ? (profile.watermark_font_style as any)
        : 'serif';

      reset({
        enable_watermark: profile.enable_watermark ?? true,
        watermark_type: profileType as any,
        watermark_text: defaultText,
        watermark_opacity:
          typeof profile.watermark_opacity === 'number'
            ? profile.watermark_opacity
            : 0.45,
        watermark_position: profilePosition,
        watermark_font_size: profileFontSize,
        watermark_font_color: profile.watermark_font_color || '#FFFFFF',
        watermark_font_style: profileFontStyle,
      });

      // Set existing logo preview if available
      if (profile.watermark_image) {
        setLogoPreviewUrl(profile.watermark_image);
      }
      setLogoFile(null);
      setIsLogoRemoved(false);
    }
  }, [profile, reset]);

  // Handle Logo file selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setIsLogoRemoved(false);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreviewUrl(objectUrl);
      setValue('watermark_type', 'image', { shouldDirty: true });
    }
  };

  // Handle remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setIsLogoRemoved(true);
    setValue('watermark_type', 'text', { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick reset to Photographer Name
  const handleResetToMyName = () => {
    const photographerName =
      profile?.name ||
      (profile as any)?.full_name ||
      (profile as any)?.user_full_name ||
      profile?.user_username ||
      'Photographer';
    setValue('watermark_text', `© ${photographerName}`, { shouldDirty: true });
  };

  // Quick insert copyright symbol
  const handleInsertCopyright = () => {
    if (!watermarkText.includes('©')) {
      setValue('watermark_text', `© ${watermarkText.trim()}`, { shouldDirty: true });
    }
  };

  const hasUnsavedFileChanges = logoFile !== null || isLogoRemoved;
  const canSave = isDirty || hasUnsavedFileChanges;

  const onSubmit = (data: WatermarkSettingsFormData) => {
    const payload: any = {
      enable_watermark: Boolean(data.enable_watermark),
      watermark_type: data.watermark_type,
      watermark_text: (data.watermark_text || '').trim(),
      watermark_opacity: Number(data.watermark_opacity),
      watermark_position: data.watermark_position,
      watermark_font_size: data.watermark_font_size,
      watermark_font_color: data.watermark_font_color,
      watermark_font_style: data.watermark_font_style,
    };

    if (logoFile) {
      payload.watermark_image = logoFile;
    } else if (isLogoRemoved) {
      payload.remove_watermark_image = true;
      payload.watermark_image = null;
    }

    updateWatermark(payload);
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
                  Configure custom text typography or high-resolution logo imprints for client proofing.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !planQuota.watermarkEnabled || !canSave}
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
            {/* Watermark Mode Switcher (Text vs Image Logo) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Watermark Type & Branding Mode
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-[#14151f] border border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setValue('watermark_type', 'text', { shouldDirty: true })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    watermarkType === 'text'
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Text Signature</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('watermark_type', 'image', { shouldDirty: true })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    watermarkType === 'image'
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Logo</span>
                </button>
              </div>
            </div>

            {/* TAB 1: TEXT WATERMARK CONTROLS */}
            {watermarkType === 'text' && (
              <div className="space-y-6 p-5 rounded-2xl bg-neutral-50 dark:bg-[#14151f]/60 border border-neutral-200/90 dark:border-neutral-800/90 animate-in fade-in duration-200">
                {/* Watermark Text Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                      <Type className="w-3.5 h-3.5 text-amber-500" />
                      <span>Watermark Signature Text</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleInsertCopyright}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 hover:bg-amber-400/20 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        title="Add copyright symbol"
                      >
                        + Add ©
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToMyName}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 hover:bg-amber-400/20 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Reset to photographer name"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Use My Name</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    {...register('watermark_text')}
                    placeholder="e.g. © Sarah Jenkins Photography"
                    className="atelier-input font-medium text-xs sm:text-sm"
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Your studio copyright text stamped cleanly across client proof images.
                  </p>
                </div>

                {/* Font Style Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Font Family & Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {FONT_STYLE_OPTIONS.map((style) => {
                      const isSelected = watermarkFontStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setValue('watermark_font_style', style.id, { shouldDirty: true })}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400 shadow-xs'
                              : 'bg-white dark:bg-[#101117] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <span className={`text-xs ${style.fontClass} truncate max-w-full`}>
                            {style.preview}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {style.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Font Size
                    </label>
                    <span className="text-[10px] font-mono text-amber-500 font-bold uppercase">
                      {FONT_SIZE_OPTIONS.find((s) => s.id === watermarkFontSize)?.label || 'Medium'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FONT_SIZE_OPTIONS.map((size) => {
                      const isSelected = watermarkFontSize === size.id;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => setValue('watermark_font_size', size.id, { shouldDirty: true })}
                          className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400 text-neutral-900 dark:text-white ring-1 ring-amber-400'
                              : 'bg-white dark:bg-[#101117] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <span className="text-xs font-bold block">{size.label}</span>
                          <span className="text-[9px] text-neutral-400 block mt-0.5">{size.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Color Selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                      <Palette className="w-3.5 h-3.5 text-amber-500" />
                      <span>Watermark Color</span>
                    </label>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      {watermarkFontColor}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Preset color swatches */}
                    {COLOR_PRESETS.map((color) => {
                      const isSelected = watermarkFontColor.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setValue('watermark_font_color', color.hex, { shouldDirty: true })}
                          title={color.label}
                          className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer relative flex items-center justify-center ${
                            isSelected
                              ? 'scale-115 ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#101117]'
                              : 'hover:scale-105'
                          } ${
                            color.hex === '#18181B' ? 'border-neutral-700' : 'border-neutral-300 dark:border-neutral-700'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                color.hex === '#FFFFFF' || color.hex === '#F5F5F0' || color.hex === '#CBD5E1'
                                  ? 'text-neutral-950'
                                  : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}

                    {/* Native Custom Color Picker */}
                    <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-700 cursor-pointer shadow-xs">
                        <input
                          type="color"
                          value={watermarkFontColor}
                          onChange={(e) => setValue('watermark_font_color', e.target.value, { shouldDirty: true })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          title="Choose custom color"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: watermarkFontColor }}
                        />
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        Custom
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE LOGO WATERMARK CONTROLS */}
            {watermarkType === 'image' && (
              <div className="space-y-5 p-5 rounded-2xl bg-neutral-50 dark:bg-[#14151f]/60 border border-neutral-200/90 dark:border-neutral-800/90 animate-in fade-in duration-200">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                {logoPreviewUrl ? (
                  /* Logo uploaded state */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#0c0d12] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Checkered pattern background for logo preview */}
                        <div
                          className="w-16 h-16 rounded-lg border border-neutral-300 dark:border-neutral-700 p-1 flex items-center justify-center shrink-0 overflow-hidden"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
                            backgroundSize: '12px 12px',
                            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                          }}
                        >
                          <img
                            src={logoPreviewUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {logoFile ? logoFile.name : 'Active Studio Logo'}
                          </h4>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {logoFile
                              ? `${(logoFile.size / 1024).toFixed(1)} KB • Staged for saving`
                              : 'Stored on photographer profile'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remove logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Logo upload dropzone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-amber-400/5 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      Upload Studio Watermark Logo
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                      Drag & drop or click to upload. Transparent PNG, SVG, or WEBP recommended (Max 5MB).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SHARED CONTROL 1: Opacity Slider */}
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

            {/* SHARED CONTROL 2: Placement Selector */}
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
                      onClick={() => setValue('watermark_position', pos.id, { shouldDirty: true })}
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
                Interactive Studio View
              </span>
            </div>

            {/* Preview Card */}
            <div className="relative w-full h-[400px] sm:h-[460px] lg:h-[500px] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl group">
              <img
                src={SAMPLE_PREVIEWS[selectedSampleIndex].url}
                alt="Sample Preview"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Watermark Overlay Preview */}
              <WatermarkOverlay
                text={watermarkText}
                imageUrl={watermarkType === 'image' ? logoPreviewUrl : null}
                opacity={watermarkOpacity}
                position={watermarkPosition}
                watermarkType={watermarkType}
                fontSize={watermarkFontSize}
                fontColor={watermarkFontColor}
                fontStyle={watermarkFontStyle}
                size="md"
              />

              {/* Notice when Image mode is active but no logo is uploaded */}
              {watermarkType === 'image' && !logoPreviewUrl && (
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  <div className="px-4 py-3 rounded-2xl bg-black/80 border border-dashed border-amber-400/60 text-center max-w-xs shadow-xl backdrop-blur-md">
                    <p className="text-xs font-bold text-amber-400">No Logo Uploaded Yet</p>
                    <p className="text-[11px] text-neutral-300 mt-1">
                      Upload your PNG or SVG studio logo in the controls to see your live brand imprint.
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Rendering</span>
              </div>
            </div>

            {/* Sample Photo Switcher (Test watermark on dark vs light photos) */}
            <div className="flex items-center justify-between gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#14151f] border border-neutral-200 dark:border-neutral-800">
              {SAMPLE_PREVIEWS.map((sample, idx) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => setSelectedSampleIndex(idx)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer truncate ${
                    selectedSampleIndex === idx
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
              Real-time watermark rendering across client view and proof downloads. You can toggle watermarking on individual galleries in their settings.
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
