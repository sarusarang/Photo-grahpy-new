/**
 * Ultra-High-Resolution Initial & Fallback Covers for Client Galleries
 * Provides curated, aesthetic default covers when a gallery is newly created,
 * when all images have been removed, or if an uploaded cover URL fails to load.
 */

export const INITIAL_GALLERY_COVERS: Record<string, string> = {
  editorial:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
  masonry:
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
  cinematic:
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=85',
  minimal:
    'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
  default:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
};

export const FALLBACK_GALLERY_COVER = INITIAL_GALLERY_COVERS.default;

/**
 * Returns a template-tailored, aesthetic initial cover image URL
 */
export function getInitialGalleryCover(templateId?: string): string {
  if (templateId && templateId in INITIAL_GALLERY_COVERS) {
    return INITIAL_GALLERY_COVERS[templateId];
  }
  return FALLBACK_GALLERY_COVER;
}

/**
 * Safe Image error event handler that prevents broken image icons
 * and smoothly falls back to the clean initial cover
 */
export function handleCoverImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  fallback?: string
): void {
  const img = e.currentTarget;
  img.onerror = null; // Prevent infinite error loop
  img.src = fallback || FALLBACK_GALLERY_COVER;
}
