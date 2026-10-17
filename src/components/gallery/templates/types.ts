import React from 'react';
import type { Gallery, GalleryTemplateId } from '@/types';
import type { GalleryGridDesign } from '../UniversalPhotoGrid';

export interface TemplateLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  favoritingMediaIds?: Set<string>;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
  studioName?: string;
  photographerName?: string;
  onShareGallery?: () => void;
  gridDesign?: GalleryGridDesign;
  onSelectGridDesign?: (design: GalleryGridDesign) => void;
  onDownloadSingle?: (e: React.MouseEvent, item: any) => void;
  onCreateStoryVideo?: () => void;
  onOpenContact?: () => void;
}

export interface TemplateConfig {
  id: GalleryTemplateId;
  name: string;
  tagline: string;
  description: string;
  aspectRatioLabel: string;
  theme: 'editorial' | 'masonry' | 'cinematic' | 'minimal' | string;
  component: React.ComponentType<TemplateLayoutProps>;
  previewImage: string;
  badge: string;
  characteristics: string[];
  defaultCover: string;
}
