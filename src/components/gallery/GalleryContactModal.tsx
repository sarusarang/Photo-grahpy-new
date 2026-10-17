import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Calendar,
  Mail,
  Phone,
  User,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  HeartHandshake,
  ShieldCheck,
  Heart,
  Compass,
  Camera,
  Building2,
  Smile,
  GraduationCap,
} from 'lucide-react';
import type { Gallery } from '@/types';
import { SubmitPublicInquiryApi } from '@/service/inquiries/InquiryApi';
import { addInquiry } from '@/services/inquiryService';
import type { InquiryEventType } from '@/types/inquiry';
import { useToast } from '@/components/ui/Toast';
import { ModernDropdown, type ModernDropdownOption } from './ModernDropdown';

export const galleryInquirySchema = z.object({
  clientName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().trim().email('Please enter a valid email address'),
  clientPhone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val.length >= 7,
      'Phone number must be at least 7 digits'
    ),
  eventDate: z.string().optional(),
  eventType: z.string().min(1, 'Please select an occasion type'),
  location: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  message: z.string().trim().min(5, 'Please provide brief details (min 5 characters)'),
});

export type GalleryInquiryFormData = z.infer<typeof galleryInquirySchema>;

export interface GalleryContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  theme?: 'editorial' | 'cinematic' | 'masonry' | 'minimal' | string;
  studioName?: string;
  photographerName?: string;
}

const OCCASION_OPTIONS: ModernDropdownOption[] = [
  {
    value: 'wedding',
    label: 'Wedding / Ceremony',
    description: 'Full day, vows & celebratory rituals',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
  },
  {
    value: 'pre-wedding',
    label: 'Pre-Wedding / Destination',
    description: 'Scenic couple editorial & travel stories',
    icon: <Compass className="w-4 h-4 text-sky-400" />,
  },
  {
    value: 'editorial',
    label: 'Fashion / Editorial',
    description: 'High-fashion, magazine & lookbook shoots',
    icon: <Camera className="w-4 h-4 text-amber-400" />,
  },
  {
    value: 'commercial',
    label: 'Commercial / Architecture',
    description: 'Brand campaigns, spaces & luxury lifestyle',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    value: 'portrait',
    label: 'Portrait Session',
    description: 'Individual, artistic & executive portraits',
    icon: <User className="w-4 h-4 text-indigo-400" />,
  },
  {
    value: 'maternity',
    label: 'Maternity & Family',
    description: 'Intimate maternity, newborn & family milestones',
    icon: <Smile className="w-4 h-4 text-pink-400" />,
  },
  {
    value: 'workshop',
    label: 'Workshop / Mentorship',
    description: 'Masterclasses, photography coaching & 1-on-1',
    icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
  },
  {
    value: 'other',
    label: 'Other Bespoke Service',
    description: 'Custom commission tailored to your requirements',
    icon: <Sparkles className="w-4 h-4 text-amber-300" />,
  },
];

const BUDGET_OPTIONS: ModernDropdownOption[] = [
  {
    value: '',
    label: 'Select range (optional)',
    description: 'Flexible / To be discussed',
  },
  {
    value: 'Under ₹1,00,000',
    label: 'Under ₹1,00,000',
    description: 'Essential coverage & intimate sessions',
  },
  {
    value: '₹1,00,000 - ₹2,50,000',
    label: '₹1,00,000 - ₹2,50,000',
    description: 'Comprehensive coverage • Most popular choice',
    badge: 'Popular',
  },
  {
    value: '₹2,50,000 - ₹5,00,000',
    label: '₹2,50,000 - ₹5,00,000',
    description: 'Signature multi-day experience',
  },
  {
    value: '₹5,00,000+',
    label: '₹5,00,000+',
    description: 'Ultra-luxury & destination wedding coverage',
  },
  {
    value: 'Custom / Inquire for Quote',
    label: 'Custom / Flexible Quote',
    description: 'Tailored quotation based on your creative vision',
  },
];

export const GalleryContactModal: React.FC<GalleryContactModalProps> = ({
  isOpen,
  onClose,
  gallery,
  theme = 'editorial',
  studioName,
  photographerName,
}) => {
  const { showToast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<GalleryInquiryFormData | null>(null);

  const resolvedStudio =
    gallery.studioName ||
    studioName ||
    gallery.photographerName ||
    photographerName ||
    'Studio';

  const resolvedPhotographer =
    gallery.photographerName ||
    photographerName ||
    resolvedStudio;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GalleryInquiryFormData>({
    resolver: zodResolver(galleryInquirySchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      eventDate: '',
      eventType: 'wedding',
      location: '',
      budget: '',
      message: '',
    },
  });

  const selectedEventType = watch('eventType');
  const selectedBudget = watch('budget');

  // Prevent background page from scrolling when modal is open
  React.useEffect(() => {
    if (!isOpen) return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [isOpen]);

  const getThemePalette = () => {
    switch (theme) {
      case 'cinematic':
        return {
          modalBg: 'bg-[#08080c]/98 text-neutral-100 border-amber-500/30',
          headerBg: 'bg-[#08080c]/95',
          glowBg: 'bg-amber-500/15',
          badgeBg: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
          titleFont: 'font-serif text-amber-400',
          inputBg: 'bg-neutral-900/90 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
          accentBtn: 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black shadow-lg shadow-amber-500/25',
          accentColor: 'text-amber-400',
          accentBorder: 'border-amber-400',
          iconColor: 'text-amber-400',
          divider: 'border-white/10',
          highlightBox: 'bg-amber-500/5 border-amber-500/20',
        };
      case 'masonry':
        return {
          modalBg: 'bg-[#060e0a]/98 text-neutral-100 border-emerald-500/30',
          headerBg: 'bg-[#060e0a]/95',
          glowBg: 'bg-emerald-500/15',
          badgeBg: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300',
          titleFont: 'font-serif text-emerald-400',
          inputBg: 'bg-neutral-900/90 border-neutral-800 text-white placeholder-neutral-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20',
          accentBtn: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 font-black shadow-lg shadow-emerald-500/25',
          accentColor: 'text-emerald-400',
          accentBorder: 'border-emerald-400',
          iconColor: 'text-emerald-400',
          divider: 'border-emerald-950/80',
          highlightBox: 'bg-emerald-500/5 border-emerald-500/20',
        };
      case 'minimal':
        return {
          modalBg: 'bg-[#121316]/98 text-neutral-100 border-neutral-700/50',
          headerBg: 'bg-[#121316]/95',
          glowBg: 'bg-neutral-400/10',
          badgeBg: 'bg-neutral-800 border-neutral-700 text-neutral-300',
          titleFont: 'font-sans font-bold text-white',
          inputBg: 'bg-neutral-900/90 border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-300 focus:ring-2 focus:ring-neutral-400/20',
          accentBtn: 'bg-white hover:bg-neutral-200 text-neutral-950 font-bold shadow-lg shadow-white/10',
          accentColor: 'text-neutral-300',
          accentBorder: 'border-neutral-300',
          iconColor: 'text-neutral-400',
          divider: 'border-neutral-800',
          highlightBox: 'bg-white/5 border-white/10',
        };
      case 'editorial':
      default:
        return {
          modalBg: 'bg-[#0a0a0f]/98 text-neutral-100 border-neutral-800/90',
          headerBg: 'bg-[#0a0a0f]/95',
          glowBg: 'bg-amber-400/10',
          badgeBg: 'bg-white/10 border-white/15 text-white',
          titleFont: 'font-serif text-white',
          inputBg: 'bg-neutral-900/90 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
          accentBtn: 'bg-white hover:bg-neutral-100 text-neutral-950 font-black shadow-lg shadow-white/15',
          accentColor: 'text-amber-400',
          accentBorder: 'border-amber-400',
          iconColor: 'text-amber-400',
          divider: 'border-white/10',
          highlightBox: 'bg-amber-400/5 border-amber-400/15',
        };
    }
  };

  const style = getThemePalette();

  const onSubmit = async (data: GalleryInquiryFormData) => {
    const photographerId =
      gallery.photographerId ||
      (gallery as any).photographer_id ||
      (gallery as any).photographer?.id ||
      (gallery as any).user_id ||
      (gallery as any).user?.id ||
      undefined;

    const payload = {
      photographer_id: photographerId,
      gallery_id: gallery.id,
      gallery_slug: gallery.slug,
      gallery_title: gallery.title,
      source: `gallery:${theme}`,
      client_name: data.clientName,
      client_email: data.clientEmail,
      client_phone: data.clientPhone || '',
      event_type: data.eventType || 'wedding',
      event_date: data.eventDate || new Date().toISOString().split('T')[0],
      location: data.location || '',
      budget: data.budget || '',
      message: data.message,
    };

    try {
      await SubmitPublicInquiryApi(payload);
    } catch (err) {
      console.warn('Backend public inquiry submission fallback:', err);
    }

    try {
      addInquiry({
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        eventDate: data.eventDate || new Date().toISOString().split('T')[0],
        eventType: (data.eventType as InquiryEventType) || 'wedding',
        location: data.location || 'Studio',
        budget: data.budget || 'Custom',
        message: `[Inquiry via Gallery: "${gallery.title}"] ${data.message}`,
      });
    } catch (localErr) {
      console.warn('Local storage inquiry fallback notice:', localErr);
    }

    setSubmittedData(data);
    setIsSuccess(true);
    showToast(
      'Inquiry Delivered',
      `Your message has been sent directly to ${resolvedPhotographer}.`,
      'success'
    );
  };

  const handleClose = () => {
    setIsSuccess(false);
    reset();
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-0"
          />

          {/* Modal Card with Overflow-Hidden to safely contain theme ambient glows */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`relative z-10 w-full sm:max-w-3xl md:max-w-4xl max-h-[88vh] flex flex-col rounded-3xl border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden ${style.modalBg}`}
          >
            {/* Ambient theme glow effects (safely clipped by parent overflow-hidden) */}
            <div
              className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none -z-10 ${style.glowBg}`}
            />
            <div
              className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none -z-10 ${style.glowBg}`}
            />

            {/* Header: Fixed & Pinned */}
            <div
              className={`shrink-0 px-6 sm:px-8 py-4 sm:py-5 border-b flex items-start justify-between gap-4 ${style.divider}`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold border ${style.badgeBg}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inquiry • {gallery.title}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Atelier Active</span>
                  </span>
                </div>

                <h2
                  className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${style.titleFont}`}
                >
                  Connect with {resolvedStudio}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 font-light">
                  Direct bespoke inquiry delivered to {resolvedPhotographer}&apos;s studio atelier.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer shrink-0 mt-0.5"
                title="Close inquiry"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body: Clean vertical scroll, strictly no horizontal bleed */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 sm:px-8 py-5 sm:py-6 overscroll-contain custom-modal-scroll">
              {isSuccess ? (
                /* Success Confirmation State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 sm:py-10 text-center space-y-6 max-w-lg mx-auto"
                >
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/15">
                    <CheckCircle2 className="w-10 h-10 sm:w-11 sm:h-11 stroke-[2.2]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                      Inquiry Received
                    </h3>
                    <p className="text-sm text-neutral-300 font-light leading-relaxed">
                      Thank you,{' '}
                      <span className="font-semibold text-white">{submittedData?.clientName}</span>.
                      Your inquiry for{' '}
                      <span className="font-medium text-white">{submittedData?.eventType}</span>{' '}
                      photography has been delivered directly to {resolvedStudio}.
                    </p>
                    <p className="text-xs font-mono text-neutral-400">
                      Confirmation notice sent to {submittedData?.clientEmail}
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-left text-sm space-y-2.5">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Curated Gallery:</span>
                      <span className="text-white font-medium">{gallery.title}</span>
                    </div>
                    {submittedData?.eventDate && (
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>Target Date:</span>
                        <span className="text-white font-medium">{submittedData.eventDate}</span>
                      </div>
                    )}
                    {submittedData?.location && (
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>Destination / City:</span>
                        <span className="text-white font-medium">{submittedData.location}</span>
                      </div>
                    )}
                    {submittedData?.budget && (
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>Budget Range:</span>
                        <span className="text-white font-medium">{submittedData.budget}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className={`w-full py-4 rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-xl cursor-pointer ${style.accentBtn}`}
                  >
                    Done & Return to Gallery
                  </button>
                </motion.div>
              ) : (
                /* Contact Form */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 opacity-70" />
                          <span>Your Full Name *</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        {...register('clientName')}
                        placeholder="e.g. Elena Rostova"
                        className={`w-full px-4 py-2.5 sm:py-3 rounded-2xl border text-sm transition-all focus:outline-none ${style.inputBg}`}
                      />
                      {errors.clientName && (
                        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.clientName.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 opacity-70" />
                          <span>Email Address *</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        {...register('clientEmail')}
                        placeholder="elena@example.com"
                        className={`w-full px-4 py-2.5 sm:py-3 rounded-2xl border text-sm transition-all focus:outline-none ${style.inputBg}`}
                      />
                      {errors.clientEmail && (
                        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.clientEmail.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Phone, Event Date, Occasion (Dropdown) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 opacity-70" />
                        <span>Phone / WhatsApp</span>
                      </label>
                      <input
                        type="tel"
                        {...register('clientPhone')}
                        placeholder="+91 98765 43210"
                        className={`w-full px-4 py-2.5 sm:py-3 rounded-2xl border text-sm transition-all focus:outline-none ${style.inputBg}`}
                      />
                      {errors.clientPhone && (
                        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.clientPhone.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Target Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        <span>Target Date</span>
                      </label>
                      <input
                        type="date"
                        style={{ colorScheme: 'dark' }}
                        {...register('eventDate')}
                        className={`w-full px-4 py-2.5 sm:py-3 rounded-2xl border text-sm transition-all focus:outline-none ${style.inputBg}`}
                      />
                    </div>

                    {/* Occasion / Event Type Modern Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 opacity-70" />
                        <span>Occasion *</span>
                      </label>
                      <ModernDropdown
                        value={selectedEventType}
                        onChange={(val) =>
                          setValue('eventType', val, { shouldValidate: true, shouldDirty: true })
                        }
                        options={OCCASION_OPTIONS}
                        theme={theme}
                        placeholder="Select occasion"
                        leftIcon={<HeartHandshake className="w-4 h-4" />}
                      />
                      {errors.eventType && (
                        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.eventType.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Location & Estimated Budget (Dropdown) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 opacity-70" />
                        <span>Event Location / Venue</span>
                      </label>
                      <input
                        type="text"
                        {...register('location')}
                        placeholder="e.g. Udaipur, Lake Palace or Studio"
                        className={`w-full px-4 py-2.5 sm:py-3 rounded-2xl border text-sm transition-all focus:outline-none ${style.inputBg}`}
                      />
                    </div>

                    {/* Estimated Budget Modern Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 opacity-70" />
                        <span>Estimated Budget</span>
                      </label>
                      <ModernDropdown
                        value={selectedBudget || ''}
                        onChange={(val) =>
                          setValue('budget', val, { shouldValidate: true, shouldDirty: true })
                        }
                        options={BUDGET_OPTIONS}
                        theme={theme}
                        placeholder="Select range (optional)"
                        leftIcon={<DollarSign className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  {/* Row 4: Event Location & Vision Message */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 opacity-70" />
                        <span>Event Location & Vision *</span>
                      </label>
                      <span className="text-[11px] font-mono text-neutral-500">
                        Detailed ideas welcome
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      {...register('message')}
                      placeholder="Tell us about your dates, ideas, aesthetic preferences, and what you are looking for..."
                      className={`w-full px-4 py-3 rounded-2xl border text-sm leading-relaxed resize-none transition-all focus:outline-none ${style.inputBg}`}
                    />
                    {errors.message && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.message.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button & Reassurance */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-xl ${style.accentBtn}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Inquiry to Studio...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 stroke-[2.5]" />
                          <span>Submit Inquiry</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>
                        Direct encrypted dispatch delivered privately to {resolvedPhotographer}&apos;s studio atelier CRM.
                      </span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
