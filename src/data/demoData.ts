/**
 * Data Constants & Utilities Re-export
 * Legacy dummy arrays (INITIAL_GALLERIES, mock users) removed in favor of live Django API.
 */

export { GALLERY_TEMPLATES, TEMPLATE_DEFAULT_COVERS } from '@/components/gallery/templates';
export { isVideoMedia, formatFileSize } from '@/utils/mediaUtils';
export { getInitialGalleryCover, handleCoverImageError } from '@/utils/coverImageUtils';
