import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { MediaItem } from '@/types/atelier';
import { useToast } from '@/components/ui/Toast';
import {
  GetViewerLikedMediaApi,
  ToggleViewerFavoriteApi,
  BulkToggleViewerFavoriteApi,
  type ViewerProfile,
} from '@/service/galleries/ViewerGalleryApi';

interface PendingViewerAction {
  type: 'single' | 'bulk';
  mediaId?: string;
  mediaIds?: string[];
  targetFavoriteState?: boolean;
  isAll?: boolean;
}

const STORAGE_KEY_PREFIX = 'exshare_gallery_viewer_';
const GLOBAL_VIEWER_EMAIL_KEY = 'exshare_viewer_email';

export function useGalleryViewerLikes(galleryIdOrSlug: string, initialMedia: MediaItem[]) {
  const { showToast } = useToast();

  // 1. Viewer Identity State
  const [viewer, setViewer] = useState<ViewerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${galleryIdOrSlug}`);
      if (stored) return JSON.parse(stored);
      // Fallback check global viewer email
      const globalEmail = localStorage.getItem(GLOBAL_VIEWER_EMAIL_KEY);
      if (globalEmail) {
        return {
          email: globalEmail,
          session_token: 'stored_session',
        };
      }
    } catch {
      // Storage unavailable
    }
    return null;
  });

  const isViewerAuthenticated = Boolean(viewer?.email);

  // 2. Liked Media IDs Set (Optimistic + Persisted)
  const [likedMediaIds, setLikedMediaIds] = useState<Set<string>>(() => {
    const initialLiked = new Set<string>();
    // Start with photos marked isFavorite in the initial media load
    initialMedia.forEach((m) => {
      if (m.isFavorite) initialLiked.add(m.id);
    });
    // Layer cached likes from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const cachedLikes = localStorage.getItem(`exshare_gallery_likes_${galleryIdOrSlug}`);
        if (cachedLikes) {
          const parsed = JSON.parse(cachedLikes);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => initialLiked.add(id));
          }
        }
      } catch {
        // Storage access error
      }
    }
    return initialLiked;
  });

  // Track which media is currently mutating
  const [favoritingMediaIds, setFavoritingMediaIds] = useState<Set<string>>(new Set());
  const [isBulkFavoriting, setIsBulkFavoriting] = useState(false);

  // 3. Modal & Deferred Action State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pendingActionRef = useRef<PendingViewerAction | null>(null);

  // Persist likedMediaIds to localStorage whenever changed
  useEffect(() => {
    if (typeof window !== 'undefined' && galleryIdOrSlug) {
      try {
        localStorage.setItem(
          `exshare_gallery_likes_${galleryIdOrSlug}`,
          JSON.stringify(Array.from(likedMediaIds))
        );
      } catch {
        // Storage access error
      }
    }
  }, [likedMediaIds, galleryIdOrSlug]);

  // Sync with server if viewer is authenticated
  useEffect(() => {
    let isCancelled = false;
    if (viewer?.email && galleryIdOrSlug) {
      GetViewerLikedMediaApi(galleryIdOrSlug, viewer.email, viewer.session_token)
        .then((res) => {
          if (!isCancelled && res.liked_media_ids && Array.isArray(res.liked_media_ids)) {
            setLikedMediaIds((prev) => {
              const next = new Set(prev);
              res.liked_media_ids.forEach((id) => next.add(id));
              return next;
            });
          }
        })
        .catch(() => {
          // Keep optimistic local state
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [viewer?.email, viewer?.session_token, galleryIdOrSlug]);

  // Execute single favorite mutation
  const executeSingleFavorite = useCallback(
    async (mediaId: string, customViewerEmail?: string) => {
      const emailToUse = customViewerEmail || viewer?.email;
      const isCurrentlyLiked = likedMediaIds.has(mediaId);
      const nextLiked = !isCurrentlyLiked;

      // Optimistic state update
      setLikedMediaIds((prev) => {
        const next = new Set(prev);
        if (nextLiked) next.add(mediaId);
        else next.delete(mediaId);
        return next;
      });

      setFavoritingMediaIds((prev) => new Set(prev).add(mediaId));

      showToast(
        nextLiked ? 'Added to Liked' : 'Removed from Liked',
        nextLiked
          ? 'Photo saved to your liked collection.'
          : 'Photo removed from your liked collection.',
        'success'
      );

      try {
        await ToggleViewerFavoriteApi({
          gallery_id_or_slug: galleryIdOrSlug,
          media_id: mediaId,
          is_favorite: nextLiked,
          email: emailToUse,
          session_token: viewer?.session_token,
        });
      } catch (err) {
        console.warn('Viewer favorite sync failed, preserved locally:', err);
      } finally {
        setFavoritingMediaIds((prev) => {
          const next = new Set(prev);
          next.delete(mediaId);
          return next;
        });
      }
    },
    [likedMediaIds, viewer, galleryIdOrSlug, showToast]
  );

  // Execute bulk favorite mutation
  const executeBulkFavorite = useCallback(
    async (
      targetFavoriteState: boolean,
      mediaIds: string[],
      isAll: boolean = false,
      customViewerEmail?: string
    ) => {
      if (mediaIds.length === 0) return;
      const emailToUse = customViewerEmail || viewer?.email;
      setIsBulkFavoriting(true);

      // Optimistic state update
      setLikedMediaIds((prev) => {
        const next = new Set(prev);
        if (targetFavoriteState) {
          mediaIds.forEach((id) => next.add(id));
        } else {
          mediaIds.forEach((id) => next.delete(id));
        }
        return next;
      });

      showToast(
        targetFavoriteState ? 'Liked Selected Photos' : 'Unliked Selected Photos',
        `${targetFavoriteState ? 'Saved' : 'Removed'} ${mediaIds.length} ${
          mediaIds.length === 1 ? 'photo' : 'photos'
        } ${targetFavoriteState ? 'to' : 'from'} your liked collection.`,
        'success'
      );

      try {
        await BulkToggleViewerFavoriteApi({
          gallery_id_or_slug: galleryIdOrSlug,
          media_ids: mediaIds,
          is_favorite: targetFavoriteState,
          select_all: isAll,
          email: emailToUse,
          session_token: viewer?.session_token,
        });
      } catch (err) {
        console.warn('Bulk viewer favorite sync failed, preserved locally:', err);
      } finally {
        setIsBulkFavoriting(false);
      }
    },
    [viewer, galleryIdOrSlug, showToast]
  );

  // 4. Public API: Request like on single photo (intercepts with login if unauthenticated)
  const handleToggleFavorite = useCallback(
    (mediaId: string) => {
      if (!isViewerAuthenticated) {
        pendingActionRef.current = { type: 'single', mediaId };
        setIsAuthModalOpen(true);
        return;
      }
      executeSingleFavorite(mediaId);
    },
    [isViewerAuthenticated, executeSingleFavorite]
  );

  // 5. Public API: Request bulk like (intercepts with login if unauthenticated)
  const handleBulkFavorite = useCallback(
    (targetFavoriteState: boolean, mediaIds: string[], isAll: boolean = false) => {
      if (!isViewerAuthenticated) {
        pendingActionRef.current = {
          type: 'bulk',
          mediaIds,
          targetFavoriteState,
          isAll,
        };
        setIsAuthModalOpen(true);
        return;
      }
      executeBulkFavorite(targetFavoriteState, mediaIds, isAll);
    },
    [isViewerAuthenticated, executeBulkFavorite]
  );

  // 6. On Successful OTP Verification in ViewerAuthModal
  const handleAuthSuccess = useCallback(
    (profile: ViewerProfile) => {
      setViewer(profile);
      try {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${galleryIdOrSlug}`,
          JSON.stringify(profile)
        );
        localStorage.setItem(GLOBAL_VIEWER_EMAIL_KEY, profile.email);
      } catch {
        // storage fallback
      }

      setIsAuthModalOpen(false);

      showToast(
        'Signed In',
        `Welcome! Saved your session as ${profile.email}.`,
        'success'
      );

      // Execute deferred like action if one triggered the login
      const pending = pendingActionRef.current;
      pendingActionRef.current = null;

      if (pending) {
        if (pending.type === 'single' && pending.mediaId) {
          executeSingleFavorite(pending.mediaId, profile.email);
        } else if (
          pending.type === 'bulk' &&
          pending.mediaIds &&
          pending.targetFavoriteState !== undefined
        ) {
          executeBulkFavorite(
            pending.targetFavoriteState,
            pending.mediaIds,
            pending.isAll,
            profile.email
          );
        }
      }
    },
    [galleryIdOrSlug, showToast, executeSingleFavorite, executeBulkFavorite]
  );

  const handleLogoutViewer = useCallback(() => {
    setViewer(null);
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${galleryIdOrSlug}`);
    } catch {
      // storage
    }
    showToast('Signed Out', 'You have signed out of your favorites session.', 'info');
  }, [galleryIdOrSlug, showToast]);

  const favoritesCount = useMemo(() => likedMediaIds.size, [likedMediaIds]);

  return {
    viewer,
    viewerEmail: viewer?.email,
    isViewerAuthenticated,
    likedMediaIds,
    favoritesCount,
    favoritingMediaIds,
    isBulkFavoriting,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleToggleFavorite,
    handleBulkFavorite,
    handleAuthSuccess,
    handleLogoutViewer,
  };
}
