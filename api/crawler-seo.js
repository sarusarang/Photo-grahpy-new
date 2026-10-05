/**
 * EX SHARE ATELIER — Dynamic Social Media Crawler SEO Proxy (Vercel Serverless Function)
 *
 * Intercepts requests from social bots (WhatsApp, Facebook, Twitter/X, Telegram,
 * LinkedIn, Slack, Discord, Apple iMessage, Pinterest, Googlebot, etc.) and
 * dynamically generates full HTML Open Graph and Twitter Card tags featuring
 * the gallery or event's hero cover photo, title, photographer name, and description.
 *
 * Real browser visitors are immediately redirected to the React Single Page App.
 */

// Curated high-resolution fallback covers matching frontend template defaults
const TEMPLATE_COVERS = {
  editorial: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
  masonry: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
  cinematic: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=85',
  minimal: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
  default: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
};

/**
 * Resilient fetch helper that tries a list of candidate API endpoints with a per-request timeout
 */
async function fetchFromApi(urls, timeoutMs = 3500) {
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'EXSHARE-SEO-Crawler/2.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object') {
          return json;
        }
      }
    } catch {
      // Continue to next candidate endpoint
    }
  }
  return null;
}

/**
 * Formats a clean title fallback from a URL slug, avoiding garbled UUID strings
 */
function humanizeSlug(slug, fallbackTitle) {
  if (!slug) return fallbackTitle;
  // If slug is a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000), return elegant fallback
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return fallbackTitle;
  }
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Normalizes any relative or absolute image path to a clean absolute HTTPS URL
 */
function normalizeImageUrl(imageUrl, siteDomain, fallbackUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return fallbackUrl;
  }
  const clean = imageUrl.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('/')) {
    return `${siteDomain}${clean}`;
  }
  return `${siteDomain}/${clean}`;
}

export default async function handler(req, res) {
  // 1. Resolve Request Parameters
  let rawSlug = req.query.slug || req.query.path || '';
  if (Array.isArray(rawSlug)) rawSlug = rawSlug[0] || '';
  if (!rawSlug && req.url) {
    const urlMatch = req.url.match(/\/(?:gallery|events?|portfolio)\/([^/?#]+)/i);
    if (urlMatch) rawSlug = urlMatch[1];
  }
  const cleanSlug = String(rawSlug).split('?')[0].replace(/^\/+|\/+$/g, '');

  let type = String(req.query.type || '').toLowerCase();
  if (!type && req.url) {
    if (req.url.includes('/events') || req.url.includes('/event')) type = 'event';
    else if (req.url.includes('/portfolio')) type = 'portfolio';
    else type = 'gallery';
  }
  if (!['gallery', 'event', 'portfolio'].includes(type)) {
    type = 'gallery';
  }

  const photoId = String(req.query.photo || '').trim();

  // 2. Resolve Domain and Backend Base URL
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const autoDomain = forwardedHost ? `${forwardedProto}://${forwardedHost}` : 'https://exshare.ai';

  const siteDomain =
    (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL) &&
    !(process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL).includes('localhost')
      ? (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL).replace(/\/+$/, '')
      : autoDomain;

  const defaultShareLogo = `${siteDomain}/ex-share-balck-logo.png`;

  const apiBase = (
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    'https://server.exshare.ai/api'
  ).replace(/\/+$/, '');

  // 3. Defaults
  let title = 'EX SHARE — Premium Photography Gallery Platform & Client Proofing';
  let description =
    'Delivering bespoke editorial client proofing, high-resolution photo galleries, 4K cinematic video reels, and AI biometric search for professional photographers.';
  let imageUrl = defaultShareLogo;
  let canonicalUrl = `${siteDomain}/`;

  // 4. Fetch Dynamic Metadata from Backend
  try {
    if (type === 'gallery' && cleanSlug) {
      canonicalUrl = `${siteDomain}/gallery/${encodeURIComponent(cleanSlug)}${
        photoId ? `?photo=${encodeURIComponent(photoId)}` : ''
      }`;

      const candidateUrls = [
        `${apiBase}/public/galleries/${encodeURIComponent(cleanSlug)}/`,
        `${apiBase}/galleries/${encodeURIComponent(cleanSlug)}/`,
      ];

      const data = await fetchFromApi(candidateUrls);

      if (data) {
        const galleryTitle = data.title || data.name || humanizeSlug(cleanSlug, 'Client Gallery');
        const clientName = data.client_name || data.clientName || 'Valued Client';
        const photographerName =
          data.photographer_name ||
          data.photographerName ||
          data.photographer?.name ||
          data.studio_name ||
          data.studioName ||
          '';

        const photoCount =
          data.photos_count ??
          data.photosCount ??
          (Array.isArray(data.media) ? data.media.length : 0);
        const countLabel =
          photoCount > 0
            ? `${photoCount} high-resolution photograph${photoCount === 1 ? '' : 's'}`
            : 'curated collection';

        // Check if a specific photo was linked
        let rawPhoto = null;
        if (photoId && Array.isArray(data.media)) {
          rawPhoto = data.media.find((m) => String(m.id) === photoId);
        }

        if (rawPhoto) {
          const photoTitle = rawPhoto.title || rawPhoto.original_filename || 'Photograph';
          title = `${photoTitle} — ${galleryTitle} | EX SHARE`;
          description = rawPhoto.caption
            ? `${rawPhoto.caption} • From "${galleryTitle}" on EX SHARE.`
            : `View photo from the private collection "${galleryTitle}" on EX SHARE.`;
          const rawUrl =
            rawPhoto.url || rawPhoto.file_url || rawPhoto.thumbnail_url || rawPhoto.file;
          imageUrl = normalizeImageUrl(rawUrl, siteDomain, defaultShareLogo);
        } else {
          title = `${galleryTitle} — Photography Collection | EX SHARE`;
          description = `Explore the private client photography collection "${galleryTitle}" for ${clientName}${
            photographerName ? ` by ${photographerName}` : ''
          }. Featuring ${countLabel}, bespoke proofing, and instant downloads.`;

          const rawCover =
            data.cover_image ||
            data.coverImage ||
            (data.template_id && data.template_banners?.[data.template_id]) ||
            (data.templateId && data.templateBanners?.[data.templateId]) ||
            data.media?.[0]?.url ||
            data.media?.[0]?.file_url ||
            data.media?.[0]?.preview_url ||
            TEMPLATE_COVERS[data.template_id || data.templateId || 'default'] ||
            defaultShareLogo;

          imageUrl = normalizeImageUrl(rawCover, siteDomain, defaultShareLogo);
        }
      } else {
        const fallbackTitle = humanizeSlug(cleanSlug, 'Private Photography Collection');
        title = `${fallbackTitle} | EX SHARE`;
        description =
          'Explore this private client photography collection on EX SHARE. Bespoke proofing, high-resolution downloads, and editorial captures.';
      }
    } else if (type === 'event' && cleanSlug) {
      canonicalUrl = `${siteDomain}/events/${encodeURIComponent(cleanSlug)}`;

      const candidateUrls = [
        `${apiBase}/public/events/${encodeURIComponent(cleanSlug)}/`,
        `${apiBase}/events/${encodeURIComponent(cleanSlug)}/`,
      ];

      const data = await fetchFromApi(candidateUrls);

      if (data) {
        const eventTitle = data.title || data.name || humanizeSlug(cleanSlug, 'Live Event');
        const venue = [data.venue, data.city].filter(Boolean).join(', ');
        const photographerName =
          data.photographer_name ||
          data.photographerName ||
          data.photographer?.name ||
          data.studio_name ||
          '';

        title = `${eventTitle} — Live Event & AI Photo Discovery | EX SHARE`;
        description =
          data.description?.trim() ||
          `Live photography gallery for "${eventTitle}"${venue ? ` at ${venue}` : ''}${
            photographerName ? ` by ${photographerName}` : ''
          }. Find your photos instantly with AI facial recognition search and download high-resolution captures.`;

        const rawBanner =
          data.banner_url ||
          data.bannerUrl ||
          data.cover_image ||
          data.coverImage ||
          data.media?.[0]?.url ||
          data.media?.[0]?.file_url ||
          TEMPLATE_COVERS.editorial;

        imageUrl = normalizeImageUrl(rawBanner, siteDomain, defaultShareLogo);
      } else {
        const fallbackTitle = humanizeSlug(cleanSlug, 'Live Event Gallery');
        title = `${fallbackTitle} & AI Photo Discovery | EX SHARE`;
        description =
          'Find your photos instantly with AI facial recognition search on EX SHARE live event galleries.';
      }
    } else if (type === 'portfolio' && cleanSlug) {
      canonicalUrl = `${siteDomain}/portfolio/${encodeURIComponent(cleanSlug)}`;

      const candidateUrls = [
        `${apiBase}/public/portfolio/${encodeURIComponent(cleanSlug)}/`,
        `${apiBase}/portfolio/${encodeURIComponent(cleanSlug)}/`,
      ];

      const data = await fetchFromApi(candidateUrls);

      if (data) {
        const studio =
          data.studio_name ||
          data.studioName ||
          data.artist_name ||
          data.artistName ||
          data.photographer_name ||
          humanizeSlug(cleanSlug, 'Professional Photographer');

        title = `${studio} — Photography Portfolio & Editorial Works | EX SHARE`;
        description =
          data.tagline ||
          data.bio ||
          data.about_story ||
          `Explore bespoke editorial collections and fine art portfolios by ${studio} on EX SHARE.`;

        const rawHero =
          data.hero_image ||
          data.heroImage ||
          data.banner_url ||
          data.bannerUrl ||
          data.avatar_url ||
          data.avatarUrl ||
          data.featured_works?.[0]?.cover_url ||
          defaultShareLogo;

        imageUrl = normalizeImageUrl(rawHero, siteDomain, defaultShareLogo);
      } else {
        const fallbackStudio = humanizeSlug(cleanSlug, 'Photography Portfolio');
        title = `${fallbackStudio} | EX SHARE`;
        description =
          'Explore bespoke editorial collections, wedding galleries, and portfolios on EX SHARE.';
      }
    }
  } catch {
    // Retain default metadata on any unexpected error
  }

  // 5. Detect Image Format MIME Type
  let imageType = 'image/jpeg';
  if (imageUrl.toLowerCase().includes('.png')) {
    imageType = 'image/png';
  } else if (imageUrl.toLowerCase().includes('.webp')) {
    imageType = 'image/webp';
  }

  // 6. Prevent XSS Injections in Generated HTML
  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safeUrl = escapeHtml(canonicalUrl);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    <meta name="title" content="${safeTitle}" />
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${safeUrl}" />

    <!-- Open Graph / WhatsApp / Facebook / LinkedIn / iMessage / Telegram / Discord -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="EX SHARE Atelier" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:secure_url" content="${safeImage}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${safeTitle}" />
    <meta property="og:url" content="${safeUrl}" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@exshare" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta name="twitter:image:alt" content="${safeTitle}" />

    <!-- Fast browser redirect in case of non-crawler navigation -->
    <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07080b; color: #fff; padding: 3rem 1.5rem; text-align: center;">
    <h2 style="font-weight: 600; margin-bottom: 0.5rem;">${safeTitle}</h2>
    <p style="color: #9ca3af; max-width: 600px; margin: 0 auto 1.5rem;">${safeDesc}</p>
    <p style="color: #6b7280; font-size: 0.875rem;">Opening gallery... <a href="${safeUrl}" style="color: #f59e0b; text-decoration: underline;">Click here if not redirected</a></p>
    <script>window.location.replace("${safeUrl}");</script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  res.status(200).send(html);
}
