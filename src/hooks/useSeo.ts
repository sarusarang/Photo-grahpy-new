/**
 * EX SHARE ATELIER — Reusable SEO & Social Graph React Hooks
 * Automatically manages browser title, canonical links, and OpenGraph/Twitter Card
 * meta tags for client galleries, guest events, and portfolio pages.
 */

import { useEffect } from 'react';
import {
  updatePageSeo,
  getGallerySeoMeta,
  getEventSeoMeta,
  getPortfolioSeoMeta,
  type SeoMetadata,
} from '@/utils/seo';
import type { Gallery } from '@/types';
import type { LiveEvent } from '@/types/event';
import type { PortfolioConfig } from '@/types/portfolio';

/**
 * Low-level reactive hook to apply any custom SEO metadata object to the document.
 */
export function useSeo(meta: SeoMetadata | null | undefined): void {
  useEffect(() => {
    if (!meta) return;
    updatePageSeo(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    meta?.title,
    meta?.description,
    meta?.image,
    meta?.url,
    meta?.type,
    meta?.author,
    meta?.publishedTime,
  ]);
}

/**
 * Reusable hook to synchronize a client gallery's details and hero banner image with the page SEO.
 * When a specific photo is active (e.g. in a direct photo link), its image and title take precedence.
 */
export function useGallerySeo(
  gallery: Gallery | null | undefined,
  activePhotoId?: string,
  photographerName?: string
): void {
  useEffect(() => {
    if (!gallery) return;

    const meta = getGallerySeoMeta(gallery, {
      activePhotoId,
      photographerName,
    });

    updatePageSeo(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gallery?.id,
    gallery?.slug,
    gallery?.title,
    gallery?.clientName,
    gallery?.coverImage,
    gallery?.templateId,
    gallery?.eventDate,
    gallery?.media?.length,
    activePhotoId,
    photographerName,
  ]);
}

/**
 * Reusable hook to synchronize a live event's details and hero banner image with the page SEO.
 */
export function useEventSeo(
  event: LiveEvent | null | undefined,
  photographerName?: string
): void {
  useEffect(() => {
    if (!event) return;

    const meta = getEventSeoMeta(event, photographerName);
    updatePageSeo(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    event?.id,
    event?.slug,
    event?.title,
    event?.clientName,
    event?.bannerUrl,
    event?.eventDate,
    event?.venue,
    event?.city,
    photographerName,
  ]);
}

/**
 * Reusable hook to synchronize a photographer's portfolio showcase and hero image with the page SEO.
 */
export function usePortfolioSeo(
  portfolio: PortfolioConfig | null | undefined,
  photographerId?: string
): void {
  useEffect(() => {
    if (!portfolio) return;

    const meta = getPortfolioSeoMeta(portfolio, photographerId);
    updatePageSeo(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    portfolio?.artistName,
    portfolio?.studioName,
    portfolio?.bannerUrl,
    portfolio?.avatarUrl,
    portfolio?.tagline,
    portfolio?.bio,
    portfolio?.templateId,
    photographerId,
  ]);
}
