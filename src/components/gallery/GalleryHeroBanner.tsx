import React from 'react';
import { ArrowDown } from 'lucide-react';
import { isVideoMedia } from '@/utils/mediaUtils';
import { getInitialGalleryCover, handleCoverImageError } from '@/utils/coverImageUtils';
import { WatermarkOverlay } from './WatermarkOverlay';
import type { GalleryTemplateId } from '@/types';

export type GalleryHeroTemplate = GalleryTemplateId;

export interface GalleryHeroBannerProps {
  template: GalleryHeroTemplate;
  title: string;
  shootDate?: string;
  coverImage?: string;
  videoUrl?: string;
  additionalImages?: string[];
  className?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkImage?: string | null;
}

/**
 * Formats shoot date string cleanly (e.g. '2026-08-14' -> 'JULY 22, 2026')
 */
export const formatHeroShootDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).toUpperCase();
    }
  } catch {
    // Fallback to raw string
  }
  return String(dateStr).toUpperCase();
};

/**
 * Reusable Gallery Hero Banner Component
 * 4 completely distinct, stunning, and unique layouts:
 * 1. Editorial: Haute-Couture Vogue Full-Bleed Cover
 * 2. Masonry: Multi-Photo Botanical Mosaic Cluster with High-Contrast Floating Atelier Badge
 * 3. Cinematic: 2.39:1 Anamorphic IMAX Cinema Screen (Video-Only, Clean Letterbox)
 * 4. Minimal: 50/50 Scandinavian Museum Wall Exhibition Split
 */
export const GalleryHeroBanner: React.FC<GalleryHeroBannerProps> = ({
  template,
  title,
  shootDate,
  coverImage,
  videoUrl,
  className = '',
  watermarkEnabled = false,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  watermarkImage,
}) => {
  const activeCover = coverImage || getInitialGalleryCover(template);
  const formattedDate = formatHeroShootDate(shootDate);

  // ─────────────────────────────────────────────────────────────
  // 1. EDITORIAL TEMPLATE HERO (Haute-Couture Vogue Magazine Edition)
  // ─────────────────────────────────────────────────────────────
  if (template === 'editorial') {
    return (
      <header
        className={`relative w-full h-[94svh] sm:h-[100dvh] min-h-[460px] sm:min-h-[580px] overflow-hidden flex items-center justify-center select-none text-white ${className}`}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={activeCover}
            alt=""
            loading="eager"
            onError={(e) => handleCoverImageError(e, getInitialGalleryCover(template))}
            className="w-full h-full object-cover animate-kenburns scale-105"
          />
          {watermarkEnabled && (
            <WatermarkOverlay
              text={watermarkText}
              imageUrl={watermarkImage}
              opacity={watermarkOpacity}
              position={watermarkPosition}
              size="lg"
            />
          )}
        </div>

        {/* Localized soft radial scrim behind text only for readability (no black inset on banner) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[92%] sm:w-[680px] h-[280px] bg-black/40 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Centerpiece Typography */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-12 text-center flex flex-col items-center gap-1.5 sm:gap-2.5 animate-editorial-hero">
          {formattedDate && (
            <div className="flex items-center justify-center gap-2.5 sm:gap-5 text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
              <span className="h-px w-6 sm:w-16 bg-amber-200/80 shadow-xs" />
              <span className="text-[9px] sm:text-xs font-mono uppercase tracking-[0.25em] sm:tracking-[0.45em] font-medium">
                {formattedDate}
              </span>
              <span className="h-px w-6 sm:w-16 bg-amber-200/80 shadow-xs" />
            </div>
          )}

          <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif sm:font-sans font-normal tracking-[0.03em] sm:tracking-[0.07em] text-white leading-[1.1] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] select-none break-words max-w-full px-2">
            {title}
          </h1>
        </div>

        {/* Subtle Bottom Prompt */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 sm:gap-2 text-white/80 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] pointer-events-none pb-safe">
          <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase">Scroll to explore</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce text-amber-300" />
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MASONRY TEMPLATE HERO (Expansive Botanical Hero with Modern Liquid Glass Capsule)
  // ─────────────────────────────────────────────────────────────
  if (template === 'masonry') {
    return (
      <header
        className={`w-full h-screen min-h-[100dvh] bg-[#070D0B] text-white p-1 sm:p-2.5 md:p-3.5 border-b border-emerald-950/80 relative overflow-hidden select-none flex flex-col justify-center items-center ${className}`}
      >
        {/* Soft Ambient Botanical Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[900px] h-[300px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full h-full max-w-[99.5vw] 2xl:max-w-[2100px] flex flex-col items-center justify-center relative z-10">
          {/* Curated Expansive Single Photo Container */}
          <div className="relative w-full h-full rounded-xl sm:rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl shadow-black/95 border border-emerald-500/25 ring-1 ring-emerald-500/15 group">
            <img
              src={activeCover}
              alt=""
              loading="eager"
              onError={(e) => handleCoverImageError(e, getInitialGalleryCover(template))}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
            />
            {watermarkEnabled && (
              <WatermarkOverlay
                text={watermarkText}
                imageUrl={watermarkImage}
                opacity={watermarkOpacity}
                position={watermarkPosition}
                size="md"
              />
            )}

            {/* Centered Floating Atelier Liquid Glass Title Capsule */}
            <div className="absolute bottom-10 sm:bottom-16 left-1/2 -translate-x-1/2 z-20 w-[94%] sm:w-auto min-w-[280px] sm:min-w-[460px] md:min-w-[560px] max-w-2xl sm:max-w-3xl md:max-w-4xl px-7 sm:px-16 md:px-20 py-5 sm:py-7 md:py-8 rounded-2xl sm:rounded-[32px] bg-white/[0.08] dark:bg-black/35 backdrop-blur-2xl backdrop-saturate-150 border border-white/25 border-t-white/40 border-b-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.35)] text-center space-y-1 sm:space-y-2 pointer-events-auto transition-all duration-300 hover:bg-white/[0.12] dark:hover:bg-black/45 hover:border-white/35">
              {/* Specular glass reflection sheen */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-[32px] bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />

              <div className="relative z-10 space-y-1.5 sm:space-y-2">
                {formattedDate && (
                  <div className="flex items-center justify-center gap-2 sm:gap-3 text-emerald-300">
                    <span className="h-px w-6 sm:w-12 bg-emerald-400/70" />
                    <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] sm:tracking-[0.3em] font-semibold drop-shadow-sm text-emerald-300">
                      // {formattedDate} //
                    </span>
                    <span className="h-px w-6 sm:w-12 bg-emerald-400/70" />
                  </div>
                )}
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic text-white tracking-tight leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words">
                  {title}
                </h1>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] text-emerald-300/85 block pt-0.5 drop-shadow-xs">
                  Atelier Masonry Edition
                </span>
              </div>
            </div>

            {/* Scroll to explore animation */}
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 sm:gap-1.5 text-emerald-300/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] pointer-events-none pb-safe">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase font-semibold">Scroll to explore</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CINEMATIC TEMPLATE HERO (Fullscreen Fitted Cinema Master)
  // ─────────────────────────────────────────────────────────────
  if (template === 'cinematic') {
    const isVideo = isVideoMedia(videoUrl) || isVideoMedia(activeCover);
    const videoSrc = videoUrl || (isVideoMedia(activeCover) ? activeCover : undefined);
    const imageSrc = activeCover;

    return (
      <header
        className={`relative w-full h-screen min-h-[100dvh] bg-[#030304] overflow-hidden border-b border-neutral-900 select-none text-white ${className}`}
      >
        <div className="w-full h-full relative overflow-hidden">
          {isVideo ? (
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <img
              src={imageSrc}
              alt=""
              loading="eager"
              onError={(e) => handleCoverImageError(e, getInitialGalleryCover(template))}
              className="w-full h-full object-cover object-center"
            />
          )}
          {watermarkEnabled && (
            <WatermarkOverlay
              text={watermarkText}
              imageUrl={watermarkImage}
              opacity={watermarkOpacity}
              position={watermarkPosition}
              size="lg"
            />
          )}

          {/* Overlay: Title & Date with Localized Text Scrim Only */}
          <div className="absolute bottom-8 sm:bottom-14 left-4 sm:left-12 right-4 z-10 pointer-events-none">
            <div className="relative max-w-3xl">
              {/* Localized dark blur directly behind title text only */}
              <div className="absolute -inset-4 sm:-inset-8 bg-black/60 rounded-3xl blur-2xl pointer-events-none -z-10" />

              <div className="space-y-2 sm:space-y-3">
                {formattedDate && (
                  <div className="flex items-center gap-2.5 sm:gap-3 text-amber-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    <span className="h-px w-6 sm:w-10 bg-amber-400/80" />
                    <span className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase font-semibold">
                      {formattedDate}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight text-white font-bold drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] leading-none">
                  {title}
                </h1>
              </div>
            </div>
          </div>

          {/* Scroll to explore animation */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 sm:gap-2 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] pointer-events-none pb-safe">
            <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase font-semibold">Scroll to explore</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-amber-400" />
          </div>
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MINIMAL TEMPLATE HERO (Scandinavian Museum Wall Exhibition)
  // ─────────────────────────────────────────────────────────────
  return (
    <header
      className={`w-full h-screen min-h-[100dvh] bg-[#F8F8F6] text-neutral-900 py-4 sm:py-6 px-4 sm:px-8 md:px-12 lg:px-16 border-b border-neutral-200/80 select-none flex items-center justify-center relative ${className}`}
    >
      <div className="max-w-[96vw] 2xl:max-w-[1850px] w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-16 items-center my-auto">
        {/* Left Column: Framed Archival Print - Expansive Museum Scale */}
        <div className="lg:col-span-7 xl:col-span-8 flex justify-center lg:justify-end">
          <div className="p-3 sm:p-5 md:p-6 bg-white shadow-2xl shadow-neutral-900/15 border border-neutral-200/90 w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-none h-[54vh] sm:h-[68vh] md:h-[78vh] lg:h-[84vh] max-h-[880px] relative overflow-hidden group rounded-sm">
            <img
              src={activeCover}
              alt=""
              loading="eager"
              onError={(e) => handleCoverImageError(e, getInitialGalleryCover(template))}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
            />
            {watermarkEnabled && (
              <WatermarkOverlay
                text={watermarkText}
                imageUrl={watermarkImage}
                opacity={watermarkOpacity}
                position={watermarkPosition}
                size="md"
              />
            )}
          </div>
        </div>

        {/* Right Column: Serene Architectural Typography */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3 sm:space-y-5 text-center lg:text-left px-2 sm:px-4">
          <div className="flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-mono tracking-[0.25em] sm:tracking-[0.3em] uppercase text-neutral-400">
            <span className="h-px w-6 sm:w-10 bg-neutral-400" />
            <span>EXHIBITION MONOGRAPH</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-neutral-900 leading-[1.05] font-serif break-words">
            {title}
          </h1>

          <div className="pt-1 sm:pt-2">
            <span className="text-xs sm:text-sm font-mono tracking-[0.2em] sm:tracking-[0.25em] uppercase text-neutral-500 font-medium">
              — {formattedDate} —
            </span>
          </div>
        </div>
      </div>

      {/* Scroll to explore animation */}
      <div className="absolute bottom-2.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 sm:gap-1.5 text-neutral-500 pointer-events-none pb-safe">
        <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase font-semibold">Scroll to explore</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce text-neutral-700" />
      </div>
    </header>
  );
};
