/**
 * EX SHARE ATELIER — High-Performance Client Download & ZIP Packaging Utilities
 *
 * Core Capabilities:
 * 1. Single Image Direct Download:
 *    Fetches images as Blobs to bypass cross-origin download restrictions and force
 *    native OS save dialogs without opening new browser tabs.
 * 2. Multi-Image Concurrent ZIP Bundling:
 *    Streams and bundles high-resolution images directly in the browser with live
 *    progress tracking (0% → 100%) and DEFLATE compression via JSZip.
 * 3. Multi-Strategy Blob Extraction:
 *    Supports authenticated Devtunnel sessions, Django media endpoints, public CDNs,
 *    and HTML5 Canvas fallback with cache-busting.
 * 4. URL & Filename Normalization:
 *    Resolves relative API paths, rewrites localhost media paths to API origin,
 *    sanitizes illegal OS characters, and guarantees unique archive filenames.
 */

import JSZip from 'jszip';
import { axiosInstance } from '@/lib/axiosInstance';

// ─── TYPES & INTERFACES ────────────────────────────────────────────────────────

export interface WatermarkDownloadOptions {
  /** Whether watermarking is active */
  enabled: boolean;
  /** Mode: 'text' or 'image' */
  watermarkType?: 'text' | 'image' | string;
  /** Studio brand or photographer name text */
  text?: string;
  /** Custom logo image URL (optional) */
  imageUrl?: string | null;
  /** Opacity 10-100 (defaults to 45) */
  opacity?: number;
  /** Positioning: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tiled' */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tiled' | string;
  /** Font size preset */
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | string;
  /** Font color hex code */
  fontColor?: string;
  /** Font style */
  fontStyle?: 'serif' | 'sans' | 'script' | 'mono' | string;
}

export interface ZipDownloadItem {
  /** Source URL of the photo (absolute or relative API endpoint) */
  url: string;
  /** Optional display title for filename generation */
  title?: string;
  /** Explicit filename override (e.g., 'ceremony_001.jpg') */
  filename?: string;
  /** Media type (e.g. 'image' or 'video') */
  type?: 'image' | 'video' | string;
  /** Item-specific watermark override */
  watermarkOptions?: WatermarkDownloadOptions;
}

export type DownloadProgressCallback = (
  progressPercent: number,
  completedCount: number,
  totalCount: number
) => void;

export interface DownloadMultipleAsZipOptions {
  /** Array of items to bundle into the ZIP */
  items: ZipDownloadItem[];
  /** Destination filename for the downloaded ZIP archive (e.g., 'wedding-collection.zip') */
  zipFilename: string;
  /** Optional real-time progress callback */
  onProgress?: DownloadProgressCallback;
  /** Watermark configuration applied to all image items in this archive */
  watermarkOptions?: WatermarkDownloadOptions;
}

// ─── PURE UTILITY FUNCTIONS ────────────────────────────────────────────────────

/**
 * Resolves full URL for relative paths against the configured API/backend origin.
 * Also rewrites localhost:8000 media URLs to API tunnel origin when running in remote/tunnel mode.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';

  const rawBaseURL = (
    import.meta.env.VITE_API_BASE_URL || 'https://server.exshare.ai/api'
  ).trim();

  const baseOrigin = (() => {
    try {
      return new URL(rawBaseURL).origin;
    } catch {
      return window.location.origin;
    }
  })();

  // If URL starts with http://localhost:8000 or http://127.0.0.1:8000, and our API base is a remote tunnel,
  // rewrite localhost to tunnel origin so the browser doesn't fail on mixed content or unreachable port
  if (baseOrigin && !baseOrigin.includes('localhost') && !baseOrigin.includes('127.0.0.1')) {
    if (url.startsWith('http://localhost:8000') || url.startsWith('http://127.0.0.1:8000')) {
      return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, baseOrigin);
    }
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  return `${baseOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Sanitizes a filename string, removing illegal OS characters and ensuring a valid extension.
 */
export function sanitizeFilename(name: string, defaultExt: string = 'jpg'): string {
  const clean = (name || 'photo')
    .trim()
    .toLowerCase()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  if (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp')
  ) {
    return clean;
  }
  return `${clean}.${defaultExt}`;
}

/**
 * Triggers a native OS download of an in-memory Blob without navigating away or opening tabs.
 */
export function saveBlobAs(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke object URL after delay to prevent memory leaks
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);
}

// ─── MULTI-STRATEGY BLOB EXTRACTION ENGINE ─────────────────────────────────────

/**
 * Fetches an image URL and converts it to a binary Blob using a resilient 4-layer fallback:
 * 1. Fetch with credentials & devtunnel header (authenticated backend/tunnel session)
 * 2. Fetch with CORS mode (public CDN / wildcard Access-Control-Allow-Origin)
 * 3. AxiosInstance GET with responseType='blob'
 * 4. HTML5 Canvas draw with cache-busting parameter
 */
async function fetchImageBlob(rawUrl: string): Promise<Blob> {
  const url = resolveImageUrl(rawUrl);

  // Strategy 1: Fetch with credentials & devtunnel header
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
      },
    });
    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0 && !blob.type.includes('text/html')) {
        return blob;
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Fetch without credentials (works when server sends Access-Control-Allow-Origin: *)
  try {
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
      },
    });
    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0 && !blob.type.includes('text/html')) {
        return blob;
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: AxiosInstance with responseType 'blob' (inherits configured auth & interceptors)
  try {
    const axiosRes = await axiosInstance.get(url, {
      responseType: 'blob',
      headers: {
        'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
      },
    });
    if (axiosRes.data && axiosRes.data instanceof Blob && axiosRes.data.size > 0) {
      return axiosRes.data;
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 4: HTML5 Image + Canvas Draw fallback
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/jpeg',
          0.95
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from ${url}`));
    };

    // Cache-busting query parameter ensures browser does not reuse non-CORS cached entry
    const sep = url.includes('?') ? '&' : '?';
    img.src = `${url}${sep}_cors=${Date.now()}`;
  });
}

// ─── WATERMARK CANVAS STAMPING ENGINE ──────────────────────────────────────────

/**
 * Loads an image from a blob into an HTMLImageElement safely.
 */
function blobToImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Loads a logo image by URL safely with CORS enabled.
 */
function loadLogoImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = resolveImageUrl(url);
  });
}

/**
 * Stretches or tiles a watermark (custom logo or studio text) onto an image Blob via HTML5 Canvas.
 * Returns the original blob unchanged if watermarking is disabled or if processing fails.
 */
export async function stampWatermarkOnBlob(
  blob: Blob,
  options?: WatermarkDownloadOptions
): Promise<Blob> {
  // If watermarking is disabled, return untouched raw blob (100% original quality)
  if (!options || !options.enabled) {
    return blob;
  }

  // Skip video or non-image blobs
  if (blob.type && !blob.type.startsWith('image/')) {
    return blob;
  }

  try {
    const img = await blobToImageElement(blob);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      return blob;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return blob;
    }

    // 1. Draw base photo
    ctx.drawImage(img, 0, 0, width, height);

    // Correctly normalize opacity whether supplied as 0.0 - 1.0 or 1 - 100
    const rawOpacity = typeof options.opacity === 'number' ? options.opacity : 0.45;
    const opacity = rawOpacity > 1 ? rawOpacity / 100 : Math.max(0.1, Math.min(1, rawOpacity));
    const position = options.position || 'bottom-right';

    // 2. Check if a custom logo image should be stamped (strictly in image mode)
    const isImageMode = options.watermarkType === 'image' && Boolean(options.imageUrl);
    let logoDrawn = false;
    if (isImageMode && options.imageUrl) {
      try {
        const logo = await loadLogoImage(options.imageUrl);
        if (logo && logo.naturalWidth > 0 && logo.naturalHeight > 0) {
          const maxLogoW = width * 0.22;
          const maxLogoH = height * 0.18;
          const scale = Math.min(maxLogoW / logo.naturalWidth, maxLogoH / logo.naturalHeight);
          const logoW = Math.round(logo.naturalWidth * scale);
          const logoH = Math.round(logo.naturalHeight * scale);
          const padding = Math.max(20, Math.round(Math.min(width, height) * 0.035));

          let lx = width - logoW - padding;
          let ly = height - logoH - padding;

          if (position === 'bottom-left') {
            lx = padding;
            ly = height - logoH - padding;
          } else if (position === 'top-right') {
            lx = width - logoW - padding;
            ly = padding;
          } else if (position === 'center') {
            lx = (width - logoW) / 2;
            ly = (height - logoH) / 2;
          }

          ctx.save();
          ctx.globalAlpha = opacity;
          if (position === 'tiled') {
            const stepX = Math.max(logoW * 2.2, 280);
            const stepY = Math.max(logoH * 2.2, 180);
            for (let x = -width * 0.3; x < width * 1.3; x += stepX) {
              for (let y = -height * 0.3; y < height * 1.3; y += stepY) {
                ctx.drawImage(logo, x, y, logoW, logoH);
              }
            }
          } else {
            ctx.drawImage(logo, lx, ly, logoW, logoH);
          }
          ctx.restore();
          logoDrawn = true;
        }
      } catch {
        logoDrawn = false;
      }
    }

    // 3. Fallback or primary: Stamp typographic watermark with accurate font style & color
    if (!logoDrawn) {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Continue if fonts ready check fails
        }
      }

      const isScript = options.fontStyle === 'script';
      const rawText = isScript
        ? (options.text || 'Photographer').trim()
        : (options.text || 'PHOTOGRAPHER').trim().toUpperCase();
      const minDimension = Math.min(width, height);

      let fontMultiplier = 0.032;
      if (options.fontSize === 'sm') fontMultiplier = 0.022;
      else if (options.fontSize === 'lg') fontMultiplier = 0.044;
      else if (options.fontSize === 'xl') fontMultiplier = 0.058;

      let fontSize = Math.max(16, Math.round(minDimension * fontMultiplier));
      if (isScript) {
        fontSize = Math.round(fontSize * 1.3);
      }
      if (position === 'center') {
        fontSize = Math.round(fontSize * 1.35);
      } else if (position === 'tiled') {
        fontSize = Math.round(fontSize * 0.9);
      }

      let fontStyleStr = '600';
      let fontFamily = '"Cormorant Garamond", "Cinzel", Georgia, serif';
      if (options.fontStyle === 'sans') {
        fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif';
        fontStyleStr = '700';
      } else if (options.fontStyle === 'script') {
        fontFamily = '"Alex Brush", "Caveat", "Playfair Display", Georgia, cursive, serif';
        fontStyleStr = 'normal 600';
      } else if (options.fontStyle === 'mono') {
        fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        fontStyleStr = '500';
      }

      ctx.save();
      ctx.font = `${fontStyleStr} ${fontSize}px ${fontFamily}`;

      const fontColor = (options.fontColor || '#FFFFFF').trim();
      const lowerColor = fontColor.toLowerCase();
      const isDark =
        lowerColor === '#000000' ||
        lowerColor === '#18181b' ||
        lowerColor === '#111827';

      if (position === 'tiled') {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((-25 * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = fontColor;
        ctx.globalAlpha = opacity * 0.85;
        ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${opacity * 0.75})` : `rgba(0, 0, 0, ${opacity * 0.7})`;
        ctx.lineWidth = Math.max(1.5, Math.round(fontSize * 0.06));

        const stepX = Math.max(fontSize * 12, 320);
        const stepY = Math.max(fontSize * 6, 160);

        for (let x = -width * 0.6; x < width * 1.6; x += stepX) {
          for (let y = -height * 0.6; y < height * 1.6; y += stepY) {
            ctx.strokeText(rawText, x, y);
            ctx.fillText(rawText, x, y);
          }
        }
        ctx.restore();
      } else {
        const padding = Math.max(20, Math.round(minDimension * 0.035));
        let tx = width - padding;
        let ty = height - padding;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        if (position === 'bottom-left') {
          tx = padding;
          ty = height - padding;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
        } else if (position === 'top-right') {
          tx = width - padding;
          ty = padding;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
        } else if (position === 'center') {
          tx = width / 2;
          ty = height / 2;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        }

        // Drop shadow and stroke for visibility across both light and dark photos
        ctx.shadowColor = isDark
          ? `rgba(255, 255, 255, ${Math.min(0.85, opacity * 1.5)})`
          : `rgba(0, 0, 0, ${Math.min(0.9, opacity * 1.8)})`;
        ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.3));
        ctx.shadowOffsetX = Math.max(1, Math.round(fontSize * 0.05));
        ctx.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.05));

        ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.09));
        ctx.strokeStyle = isDark
          ? `rgba(255, 255, 255, ${Math.min(0.9, opacity * 1.2)})`
          : `rgba(0, 0, 0, ${Math.min(1, opacity * 1.2)})`;
        ctx.strokeText(rawText, tx, ty);

        ctx.fillStyle = fontColor;
        ctx.globalAlpha = opacity;
        ctx.fillText(rawText, tx, ty);
      }
      ctx.restore();
    }

    // 4. Export watermarked canvas as high-quality Blob
    const mimeType = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const outputBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || blob),
        mimeType,
        0.95
      );
    });

    return outputBlob;
  } catch (err) {
    console.warn('Canvas watermark stamping encountered an issue, preserving original file:', err);
    return blob;
  }
}

/**
 * Extracts and normalizes watermark download options from any gallery object.
 * Strictly guarantees that the photographer's name is the default watermark text.
 */
export function getGalleryWatermarkOptions(
  gallery?: {
    watermark_enabled?: boolean;
    watermarkEnabled?: boolean;
    watermark_text?: string;
    watermarkText?: string;
    watermark_opacity?: number;
    watermarkOpacity?: number;
    watermark_position?: string;
    watermarkPosition?: string;
    watermark_image?: string | null;
    watermarkImage?: string | null;
    watermark_type?: string;
    watermarkType?: string;
    watermark_font_size?: string;
    watermarkFontSize?: string;
    watermark_font_color?: string;
    watermarkFontColor?: string;
    watermark_font_style?: string;
    watermarkFontStyle?: string;
    photographerName?: string;
    photographer_name?: string;
    photographer?: { fullName?: string; name?: string };
    studioName?: string;
    studio_name?: string;
    watermark_config?: {
      enabled?: boolean;
      type?: string;
      text?: string;
      opacity?: number;
      position?: string;
      image?: string | null;
      font_size?: string;
      font_color?: string;
      font_style?: string;
    };
  } | null,
  fallbackPhotographerName?: string
): WatermarkDownloadOptions {
  if (!gallery) return { enabled: false };

  const enabled = Boolean(
    gallery.watermark_enabled ??
    gallery.watermarkEnabled ??
    gallery.watermark_config?.enabled ??
    false
  );

  // The default watermark name MUST be the photographer's name
  const photographerFallback =
    gallery.photographerName ||
    gallery.photographer_name ||
    gallery.photographer?.fullName ||
    gallery.photographer?.name ||
    fallbackPhotographerName ||
    gallery.studioName ||
    gallery.studio_name ||
    'PHOTOGRAPHER';

  let text = gallery.watermark_text || gallery.watermarkText || gallery.watermark_config?.text;
  if (!text || text === 'Ex Studio' || text === '© Ex Studio' || text === 'ATELIER STUDIO' || text === 'ATELIER PHOTOGRAPHY' || text === '© STUDIO') {
    text = photographerFallback.startsWith('©') ? photographerFallback : `© ${photographerFallback}`;
  }

  const rawOpacity = gallery.watermark_opacity ?? gallery.watermarkOpacity ?? gallery.watermark_config?.opacity ?? (gallery as any).photographer?.watermark_opacity ?? 0.45;
  const opacity = typeof rawOpacity === 'number' ? (rawOpacity > 1 ? rawOpacity / 100 : rawOpacity) : 0.45;
  const position =
    gallery.watermark_position ||
    gallery.watermarkPosition ||
    gallery.watermark_config?.position ||
    (gallery as any).photographer?.watermark_position ||
    'bottom-right';

  const rawType =
    gallery.watermark_type ||
    gallery.watermarkType ||
    gallery.watermark_config?.type ||
    (gallery as any).photographer?.watermark_type;
  const watermarkType = rawType === 'image' ? 'image' : 'text';

  const rawImageUrl =
    gallery.watermark_image ||
    gallery.watermarkImage ||
    gallery.watermark_config?.image ||
    (gallery as any).photographer?.watermark_image ||
    null;

  // Strict one-at-a-time for downloads:
  // In text mode, imageUrl is null so image logo is NEVER drawn over or instead of text!
  const imageUrl = watermarkType === 'image' ? rawImageUrl : null;

  const fontSize = gallery.watermark_font_size || gallery.watermarkFontSize || gallery.watermark_config?.font_size || (gallery as any).photographer?.watermark_font_size || 'md';
  const fontColor = gallery.watermark_font_color || gallery.watermarkFontColor || gallery.watermark_config?.font_color || (gallery as any).photographer?.watermark_font_color || '#FFFFFF';
  const fontStyle = gallery.watermark_font_style || gallery.watermarkFontStyle || gallery.watermark_config?.font_style || (gallery as any).photographer?.watermark_font_style || 'serif';

  return {
    enabled,
    watermarkType,
    text,
    opacity,
    position,
    imageUrl,
    fontSize,
    fontColor,
    fontStyle,
  };
}

// ─── HIGH-LEVEL DOWNLOAD ACTIONS ───────────────────────────────────────────────

/**
 * Downloads a single image directly to the user's computer without opening a new tab.
 * Automatically bakes in the watermark if watermarkOptions.enabled is true.
 *
 * @param url Target image URL
 * @param preferredFilename Suggested filename for saving
 * @param watermarkOptions Optional watermark configuration
 * @returns Promise resolving to boolean indicating whether download succeeded
 */
export async function downloadSingleImage(
  url: string,
  preferredFilename?: string,
  watermarkOptions?: WatermarkDownloadOptions
): Promise<boolean> {
  const filename = sanitizeFilename(preferredFilename || 'photo');
  const targetUrl = resolveImageUrl(url);

  try {
    let blob = await fetchImageBlob(targetUrl);
    if (watermarkOptions?.enabled) {
      blob = await stampWatermarkOnBlob(blob, watermarkOptions);
    }
    saveBlobAs(blob, filename);
    return true;
  } catch (err) {
    console.warn('Direct blob download failed, attempting browser trigger fallback:', err);
    // Ultimate fallback: standard hidden anchor without _blank target
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return false;
  }
}

/**
 * Downloads multiple image URLs concurrently, bundles them into a structured ZIP archive,
 * stamps watermarks on each image if enabled, and triggers an instant download to the client's device.
 */
export async function downloadMultipleAsZip({
  items,
  zipFilename,
  onProgress,
  watermarkOptions,
}: DownloadMultipleAsZipOptions): Promise<void> {
  if (!items || items.length === 0) {
    throw new Error('No items provided to download');
  }

  const zip = new JSZip();
  const total = items.length;
  let completed = 0;
  const usedFilenames = new Set<string>();

  // Ensure unique filenames inside the archive to prevent accidental overwrites
  const getUniqueName = (desiredName: string, index: number): string => {
    let name = sanitizeFilename(desiredName || `photo-${index + 1}`);
    if (usedFilenames.has(name)) {
      const parts = name.split('.');
      const ext = parts.pop() || 'jpg';
      const base = parts.join('.');
      name = `${base}-${index + 1}.${ext}`;
    }
    usedFilenames.add(name);
    return name;
  };

  // Download items in concurrent batches of 4 to maximize throughput without network saturation
  const BATCH_SIZE = 4;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item, batchIdx) => {
        const itemIndex = i + batchIdx;
        const entryName = getUniqueName(
          item.filename || item.title || `photo-${itemIndex + 1}`,
          itemIndex
        );

        try {
          let blob = await fetchImageBlob(item.url);
          const activeWatermark = item.watermarkOptions || watermarkOptions;
          if (activeWatermark?.enabled && item.type !== 'video') {
            blob = await stampWatermarkOnBlob(blob, activeWatermark);
          }
          zip.file(entryName, blob);
        } catch {
          // If individual image download fails, continue with remaining items
        } finally {
          completed += 1;
          const fetchProgress = Math.round((completed / total) * 80); // 0% to 80% for network fetch
          onProgress?.(fetchProgress, completed, total);
        }
      })
    );
  }

  onProgress?.(85, total, total);

  // Generate the compressed ZIP archive
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    },
    (metadata) => {
      // 85% to 99% during compression stage
      const compressionProgress = 85 + Math.round(metadata.percent * 0.14);
      onProgress?.(compressionProgress, total, total);
    }
  );

  onProgress?.(100, total, total);

  const cleanZipName = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  saveBlobAs(zipBlob, cleanZipName);
}
