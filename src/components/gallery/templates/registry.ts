import type { GalleryTemplate } from '@/types';
import type { TemplateConfig } from './types';
import { EditorialLayout } from './editorial/EditorialLayout';
import { MasonryLayout } from './masonry/MasonryLayout';
import { CinematicLayout } from './cinematic/CinematicLayout';
import { MinimalLayout } from './minimal/MinimalLayout';

/**
 * Built-in Core Gallery Templates Registry.
 *
 * TO ADD A NEW TEMPLATE IN THE FUTURE:
 * 1. Create a folder in `src/components/gallery/templates/<your-template>/`
 * 2. Implement your Layout component conforming to `TemplateLayoutProps`
 * 3. Add an entry to this registry or call `registerGalleryTemplate(config)`!
 * That's it! It will automatically appear in creation modals, design switchers, and client views.
 */
export const GALLERY_TEMPLATES_REGISTRY: Record<string, TemplateConfig> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Vogue & Kinfolk aesthetic with asymmetric magazine spreads',
    description: 'Cinematic full-width framing, refined serif typography, and magazine-style photo pairings that turn weddings and fashion stories into published literature.',
    aspectRatioLabel: '3:2 Landscape',
    theme: 'editorial',
    component: EditorialLayout,
    previewImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    badge: 'Signature',
    characteristics: ['Editorial Typography', 'Asymmetric Pairings', 'Poetic Storytelling', 'Delicate Borders'],
    defaultCover: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
  },
  masonry: {
    id: 'masonry',
    name: 'Masonry',
    tagline: 'Dynamic responsive grid with seamless Pinterest-style fluidity',
    description: 'Dynamic heights, smooth hover interactions, category tags, and instant lightbox view. Ideal for varied shot lists, street photography, and wedding receptions.',
    aspectRatioLabel: 'Natural Aspect Ratio',
    theme: 'masonry',
    component: MasonryLayout,
    previewImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    badge: 'Popular',
    characteristics: ['Pinterest-Style Grid', 'Smooth Hover Zoom', 'Filter by Tags', 'Instant Lightbox'],
    defaultCover: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    tagline: 'Full-bleed darkroom ambiance with hero storytelling and video support',
    description: 'Dark moody aesthetic with dramatic negative space, full-bleed hero sequences, integrated video reel players, and high-contrast typography.',
    aspectRatioLabel: '16:9 & 2.39:1 Widescreen',
    theme: 'cinematic',
    component: CinematicLayout,
    previewImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
    badge: 'Immersive',
    characteristics: ['Darkroom Palette', 'Hero Image Sequences', 'Video Showcase Modal', 'Horizontal Panoramas'],
    defaultCover: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=85',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Pure Scandinavian minimalism where photography speaks alone',
    description: 'Architectural clarity, generous white space, pristine geometric spacing, and zero visual distractions. Ideal for high-end portraits, fine art, and architecture.',
    aspectRatioLabel: '4:5 Archival Plate',
    theme: 'minimal',
    component: MinimalLayout,
    previewImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    badge: 'Fine Art',
    characteristics: ['Generous Whitespace', 'Precision Grid', 'Monochrome Details', 'Zero Clutter'],
    defaultCover: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
  },
};

/**
 * Dynamically register a new gallery template into the system at runtime or initialization.
 */
export const registerGalleryTemplate = (template: TemplateConfig): void => {
  GALLERY_TEMPLATES_REGISTRY[template.id] = template;
};

/**
 * Returns all registered templates configured for UI cards (Create Modal, Layout Switcher, etc.)
 */
export const getAllGalleryTemplates = (): TemplateConfig[] => {
  return Object.values(GALLERY_TEMPLATES_REGISTRY);
};

/**
 * Presentation-ready list of templates matching `GalleryTemplate` interface.
 */
export const GALLERY_TEMPLATES: GalleryTemplate[] = Object.values(GALLERY_TEMPLATES_REGISTRY).map((tpl) => ({
  id: tpl.id,
  name: tpl.name,
  tagline: tpl.tagline,
  description: tpl.description,
  previewImage: tpl.previewImage,
  badge: tpl.badge,
  characteristics: tpl.characteristics,
}));

/**
 * Safely resolves a template by ID, falling back to 'editorial' if not found.
 */
export const getGalleryTemplate = (id?: string): TemplateConfig => {
  if (id && GALLERY_TEMPLATES_REGISTRY[id]) {
    return GALLERY_TEMPLATES_REGISTRY[id];
  }
  return GALLERY_TEMPLATES_REGISTRY['editorial'];
};

/**
 * Default covers indexed by template ID.
 */
export const TEMPLATE_DEFAULT_COVERS: Record<string, string> = Object.values(GALLERY_TEMPLATES_REGISTRY).reduce(
  (acc, tpl) => {
    acc[tpl.id] = tpl.defaultCover;
    return acc;
  },
  {} as Record<string, string>
);
