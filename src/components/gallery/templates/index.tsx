import React from 'react';
import type { TemplateLayoutProps, TemplateConfig } from './types';
import { EditorialLayout } from './editorial/EditorialLayout';
import { MasonryLayout } from './masonry/MasonryLayout';
import { CinematicLayout } from './cinematic/CinematicLayout';
import { MinimalLayout } from './minimal/MinimalLayout';

export * from './types';
export * from './useGalleryTemplateState';
export { EditorialLayout } from './editorial/EditorialLayout';
export { MasonryLayout } from './masonry/MasonryLayout';
export { CinematicLayout } from './cinematic/CinematicLayout';
export { MinimalLayout } from './minimal/MinimalLayout';

/**
 * Extensible Template Registry
 * To add a new template in the future:
 * 1. Create a folder in templates/<template-name>/
 * 2. Add an entry here in GALLERY_TEMPLATES_REGISTRY
 */
export const GALLERY_TEMPLATES_REGISTRY: Record<string, TemplateConfig> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial Vogue',
    description: 'A 3:2 landscape fine-art grid inspired by contemporary bridal publications.',
    aspectRatioLabel: '3:2 Landscape',
    theme: 'editorial',
    component: EditorialLayout,
  },
  masonry: {
    id: 'masonry',
    name: 'Botanical Romance',
    description: 'An organic multi-column masonry preserving native aspect ratios on deep forest slate.',
    aspectRatioLabel: 'Natural Aspect Ratio',
    theme: 'masonry',
    component: MasonryLayout,
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic Anamorphic',
    description: 'An anamorphic 2.39:1 widescreen layout with motion banner and dark letterboxing.',
    aspectRatioLabel: '16:9 & 2.39:1 Widescreen',
    theme: 'cinematic',
    component: CinematicLayout,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Monograph',
    description: 'A Scandinavian architectural archival gallery with 4:5 museum-grade plates.',
    aspectRatioLabel: '4:5 Archival Plate',
    theme: 'minimal',
    component: MinimalLayout,
  },
};

export interface GalleryTemplateRendererProps extends TemplateLayoutProps {
  template?: string;
}

/**
 * Universal Gallery Template Renderer
 * Dynamically resolves and renders any registered gallery template.
 */
export const GalleryTemplateRenderer: React.FC<GalleryTemplateRendererProps> = ({
  template = 'editorial',
  ...props
}) => {
  const registered = GALLERY_TEMPLATES_REGISTRY[template] || GALLERY_TEMPLATES_REGISTRY['editorial'];
  const Component = registered.component;

  return <Component {...props} />;
};
