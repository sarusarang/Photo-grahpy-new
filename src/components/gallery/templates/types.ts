import React from 'react';
import type { Gallery } from '../../../types';

export interface TemplateLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
  studioName?: string;
  onShareGallery?: () => void;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  aspectRatioLabel: string;
  theme: 'editorial' | 'masonry' | 'cinematic' | 'minimal';
  component: React.ComponentType<TemplateLayoutProps>;
}
