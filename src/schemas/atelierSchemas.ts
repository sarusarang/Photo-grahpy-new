import { z } from 'zod';

// ===========================================================================
// Gallery Schemas
// ===========================================================================

export const createGallerySchema = z.object({
  title: z
    .string()
    .min(2, 'Gallery title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  client_name: z.string().optional().default(''),
  client_email: z
    .string()
    .email('Please enter a valid client email')
    .or(z.literal(''))
    .optional(),
  event_date: z.string().min(1, 'Please select the event date'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
  template_id: z.enum(['editorial', 'masonry', 'cinematic', 'minimal']).default('editorial'),
  visibility: z.enum(['public', 'private', 'password_protected']).default('public'),
  password: z.string().optional().default(''),
  allow_downloads: z.boolean().default(true),
  allow_favorites: z.boolean().default(true),
  face_search_enabled: z.boolean().default(false),
});

export type CreateGalleryFormData = z.infer<typeof createGallerySchema>;

export const gallerySettingsSchema = z.object({
  title: z
    .string()
    .min(2, 'Gallery title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  client_name: z.string().optional().default(''),
  status: z.enum(['active', 'delivered']).default('active'),
  is_password_protected: z.boolean().default(false),
  password: z.string().optional().default(''),
  allow_downloads: z.boolean().default(true),
  expires_at: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.is_password_protected && (!data.password || data.password.trim().length < 3)) {
      return false;
    }
    return true;
  },
  {
    message: 'Password PIN must be at least 3 characters when protection is active',
    path: ['password'],
  }
);

export type GallerySettingsFormData = z.infer<typeof gallerySettingsSchema>;

export const moveMediaSectionSchema = z.object({
  target_section: z
    .string()
    .min(1, 'Section title cannot be empty')
    .max(60, 'Section title cannot exceed 60 characters')
    .transform((val) => val.trim().toUpperCase()),
});

export type MoveMediaSectionFormData = z.infer<typeof moveMediaSectionSchema>;

export const moveToSectionModalSchema = z
  .object({
    mode: z.enum(['existing', 'new', 'unassigned']).default('existing'),
    selectedSection: z.string().optional().default(''),
    newSectionTitle: z
      .string()
      .max(120, 'Section title cannot exceed 120 characters')
      .optional()
      .default(''),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'new') {
      if (!data.newSectionTitle || !data.newSectionTitle.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a name for the new section',
          path: ['newSectionTitle'],
        });
      }
    } else if (data.mode === 'existing') {
      if (!data.selectedSection || !data.selectedSection.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a destination section',
          path: ['selectedSection'],
        });
      }
    }
  });

export type MoveToSectionModalFormData = z.infer<typeof moveToSectionModalSchema>;

export const createSectionSchema = z.object({
  title: z
    .string()
    .min(1, 'Section title cannot be empty')
    .max(120, 'Section title cannot exceed 120 characters')
    .transform((val) => val.trim().toUpperCase()),
});

export type CreateSectionFormData = z.infer<typeof createSectionSchema>;

// ===========================================================================
// Live Event Schemas
// ===========================================================================

export const createEventSchema = z.object({
  title: z
    .string()
    .min(2, 'Event title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  event_type: z.string().min(1, 'Please select an event type'),
  venue: z.string().min(1, 'Please enter the venue location'),
  qr_duration_hours: z.coerce.number().min(1, 'Duration must be at least 1 hour').default(24),
  client_name: z.string().optional().default(''),
  event_date: z.string().optional().default(''),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;

export const moveEventToGallerySchema = z.object({
  target_mode: z.enum(['new', 'existing']).default('new'),
  new_gallery_title: z.string().optional(),
  target_gallery_id: z.string().optional(),
  category_assignments: z.record(z.string(), z.string()).default({}),
}).refine(
  (data) => {
    if (data.target_mode === 'new') {
      return Boolean(data.new_gallery_title && data.new_gallery_title.trim().length >= 2);
    }
    if (data.target_mode === 'existing') {
      return Boolean(data.target_gallery_id && data.target_gallery_id.trim().length > 0);
    }
    return true;
  },
  {
    message: 'Please provide a valid gallery destination',
    path: ['new_gallery_title'],
  }
);

export type MoveEventToGalleryFormData = z.infer<typeof moveEventToGallerySchema>;

export const eventQrSettingsSchema = z.object({
  duration_hours: z.union([z.coerce.number().min(1), z.literal('custom')]).default(24),
  expires_at: z.string().min(1, 'Expiration timestamp is required'),
  pin_code: z.string().max(8, 'PIN code maximum 8 characters').optional(),
  allow_guest_uploads: z.boolean().default(false),
});

export type EventQrSettingsFormData = z.infer<typeof eventQrSettingsSchema>;

// ===========================================================================
// Profile & Watermark Schemas
// ===========================================================================

export const watermarkSettingsSchema = z.object({
  enable_watermark: z.boolean().default(true),
  watermark_text: z
    .string()
    .min(1, 'Watermark text cannot be empty')
    .max(80, 'Watermark text cannot exceed 80 characters'),
  watermark_opacity: z.coerce.number().min(0.05).max(1).default(0.45),
  watermark_position: z
    .enum(['bottom-right', 'bottom-left', 'top-right', 'center', 'tiled'])
    .default('bottom-right'),
});

export type WatermarkSettingsFormData = z.infer<typeof watermarkSettingsSchema>;

export const personalProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().default(''),
  email: z.string().email('Please enter a valid email'),
  occupation: z.string().optional().default(''),
  studio_name: z.string().optional().default(''),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().default(''),
  location: z.string().optional().default(''),
  website_url: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  instagram_handle: z.string().optional().default(''),
  default_template: z.enum(['editorial', 'masonry', 'cinematic', 'minimal']).default('editorial'),
});

export type PersonalProfileFormData = z.infer<typeof personalProfileSchema>;

// ===========================================================================
// Public Inquiry Schema
// ===========================================================================

export const publicInquirySchema = z.object({
  client_name: z.string().min(2, 'Name is required (min 2 characters)'),
  client_email: z.string().email('Please enter a valid email address'),
  client_phone: z.string().min(6, 'Please enter a valid phone number'),
  event_type: z.string().min(1, 'Please specify the event type'),
  event_date: z.string().min(1, 'Please select your tentative date'),
  location: z.string().min(2, 'Please provide the destination / city'),
  budget: z.string().min(1, 'Please select or enter your budget range'),
  message: z.string().min(10, 'Please share a brief message (min 10 characters)'),
});

export type PublicInquiryFormData = z.infer<typeof publicInquirySchema>;
