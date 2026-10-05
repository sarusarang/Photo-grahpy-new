import React from 'react';
import type { TemplateLayoutProps } from './types';
import { getGalleryTemplate } from './registry';

export * from './types';
export * from './registry';
export * from './useGalleryTemplateState';
export { EditorialLayout } from './editorial/EditorialLayout';
export { MasonryLayout } from './masonry/MasonryLayout';
export { CinematicLayout } from './cinematic/CinematicLayout';
export { MinimalLayout } from './minimal/MinimalLayout';

export interface GalleryTemplateRendererProps extends TemplateLayoutProps {
  template?: string;
}

/**
 * Universal Gallery Template Renderer
 * Dynamically resolves and renders any registered gallery template.
 * Automatically defaults to 'editorial' if an unknown template is requested.
 */
export const GalleryTemplateRenderer: React.FC<GalleryTemplateRendererProps> = ({
  template = 'editorial',
  ...props
}) => {
  const config = getGalleryTemplate(template);
  const Component = config.component;

  return <Component {...props} />;
};
