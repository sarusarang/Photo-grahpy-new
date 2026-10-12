import React from 'react';
import type { Gallery } from './gallery';

/**
 * Extensible Gallery Template Identifier.
 * Provides rich autocomplete for default templates while allowing dynamic new templates.
 */
export type GalleryTemplateId = 'editorial' | 'masonry' | 'cinematic' | 'minimal' | (string & {});

/**
 * Metadata defining a Gallery Template presentation card.
 */
export interface GalleryTemplate {
  id: GalleryTemplateId;
  name: string;
  tagline: string;
  description: string;
  previewImage: string;
  badge: string;
  characteristics: string[];
}

/**
 * Contract for all Gallery Template Layout Components.
 */
export interface TemplateLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
  studioName?: string;
  photographerName?: string;
  onShareGallery?: () => void;
  gridDesign?: string;
  onSelectGridDesign?: (design: string) => void;
  onCreateStoryVideo?: () => void;
}

/**
 * Configuration schema for registered Gallery Templates.
 */
export interface TemplateConfig {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  aspectRatioLabel: string;
  theme: 'editorial' | 'masonry' | 'cinematic' | 'minimal' | string;
  component: React.ComponentType<TemplateLayoutProps>;
  previewImage?: string;
  badge?: string;
  characteristics?: string[];
  defaultCover?: string;
}

/**
 * Definition for creating and registering new templates in the system.
 */
export type GalleryTemplateDefinition = TemplateConfig;
