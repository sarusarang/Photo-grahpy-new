import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  GetStudioPlansApi,
  GetCurrentSubscriptionApi,
  CheckoutPlanApi,
  VerifyPaymentApi,
  CancelAutoRenewApi,
  AddStorageAddonApi,
} from '@/service/plans/PlanApi';
import {
  GetGalleriesApi,
  GetGalleryDetailApi,
  CreateGalleryApi,
  UpdateGalleryApi,
  DeleteGalleryApi,
  ArchiveGalleryApi,
  RestoreGalleryApi,
  MoveMediaToSectionApi,
  UploadGalleryMediaApi,
  BulkUploadGalleryMediaApi,
  DeleteGalleryMediaApi,
  BulkDeleteGalleryMediaApi,
  ToggleMediaFavoriteApi,
  SetGalleryCoverImageApi,
  SetMasonrySlotBannerApi,
  AddGallerySectionApi,
  DeleteGallerySectionApi,
  RenameGallerySectionApi,
  GetGalleryShareDetailsApi,
  SetGalleryTemplateApi,
  SetGalleryTemplateBannerApi,
  ReorderGalleryMediaApi,
  ReorderGallerySectionsApi,
  type GalleryFilterParams,
  type CreateGalleryPayload,
} from '@/service/galleries/GalleryApi';
import {
  GetPublicGalleryApi,
  VerifyGalleryPinApi,
  TrackGalleryViewApi,
  TrackGalleryFavoriteApi,
} from '@/service/galleries/PublicGalleryApi';
import {
  GetEventsApi,
  GetEventDetailApi,
  CreateEventApi,
  UpdateEventApi,
  DeleteEventApi,
  UpdateEventQRExpiryApi,
  MoveEventToGalleryApi,
  TetherPhotoUploadApi,
  GetPublicEventDetailApi,
  type CreateEventPayload,
  type MoveEventToGalleryPayload,
} from '@/service/events/EventApi';
import {
  GetInquiriesApi,
  UpdateInquiryStatusApi,
  DeleteInquiryApi,
  SubmitPublicInquiryApi,
  GetInquiriesAnalyticsApi,
  type SubmitInquiryPayload,
} from '@/service/inquiries/InquiryApi';
import {
  GetPhotographerProfileApi,
  UpdatePersonalInformationApi,
  UploadProfileAvatarApi,
  RemoveProfileAvatarApi,
  UpdateWatermarkApi,
  GetOnboardingStateApi,
  SubmitOnboardingApi,
} from '@/service/profile/ProfileApi';
import {
  SearchGalleryByFaceApi,
  SearchEventByFaceApi,
} from '@/service/ai/FaceSearchApi';
import {
  GetPortfolioConfigApi,
  UpdatePortfolioConfigApi,
  AddPortfolioProjectApi,
  DeletePortfolioProjectApi,
  GetPublicPortfolioApi,
  GetPortfolioAnalyticsApi,
} from '@/service/portfolio/PortfolioApi';
import {
  GetGalleryAnalyticsApi,
  TrackGalleryActivityApi,
} from '@/service/analytics/AnalyticsApi';
import {
  GetMusicTracksApi,
  UploadCustomTrackApi,
} from '@/service/music/MusicApi';
import type { Gallery, InquiryStatus, GalleryTemplateId } from '@/types/atelier';

// ===========================================================================
// 1. Studio Subscription & Quota Queries
// ===========================================================================

export const useStudioPlans = () => {
  return useQuery({
    queryKey: ['studio-plans'],
    queryFn: GetStudioPlansApi,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useCurrentSubscription = () => {
  return useQuery({
    queryKey: ['current-subscription'],
    queryFn: GetCurrentSubscriptionApi,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useCheckoutPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CheckoutPlanApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: VerifyPaymentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

export const useCancelAutoRenew = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CancelAutoRenewApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
    },
  });
};

export const useAddStorageAddon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (additionalGb: number) => AddStorageAddonApi(additionalGb),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

// ===========================================================================
// 2. Photographer Profile & Branding
// ===========================================================================

export const usePhotographerProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: GetPhotographerProfileApi,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePersonalInformation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdatePersonalInformationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

export const useUpdateProfile = useUpdatePersonalInformation;

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => UploadProfileAvatarApi(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: RemoveProfileAvatarApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

export const useRemoveAvatar = useDeleteAvatar;

export const useUpdateWatermark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateWatermarkApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

export const useOnboardingState = () => {
  return useQuery({
    queryKey: ['onboarding', 'state'],
    queryFn: GetOnboardingStateApi,
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: SubmitOnboardingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'state'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

// ===========================================================================
// 3. Galleries & Cloud Drive
// ===========================================================================

export const useGalleries = (filters?: GalleryFilterParams) => {
  return useQuery({
    queryKey: ['galleries', filters],
    queryFn: () => GetGalleriesApi(filters),
    staleTime: 1000 * 30, // 30s
  });
};

export const useGalleryDetail = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['gallery', idOrSlug],
    queryFn: () => GetGalleryDetailApi(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
};

export const useGalleryDetailInfinite = (
  idOrSlug: string,
  filters?: {
    section?: string;
    isFavorite?: boolean;
    limit?: number;
  }
) => {
  return useInfiniteQuery({
    queryKey: ['gallery', idOrSlug, 'infinite', filters?.section, filters?.isFavorite],
    queryFn: async ({ pageParam }) => {
      return GetGalleryDetailApi(idOrSlug, {
        cursor: pageParam as string | null,
        limit: filters?.limit ?? 48,
        section: filters?.section,
        is_favorite: filters?.isFavorite,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: any) => {
      return lastPage?.nextCursor || lastPage?.next_cursor || undefined;
    },
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 30,
  });
};

export const useCreateGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGalleryPayload) => CreateGalleryApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

export const useUpdateGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Gallery> }) =>
      UpdateGalleryApi(id, updates),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    },
  });
};

export const useDeleteGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: string | { id: string; permanent?: boolean }) => {
      const id = typeof param === 'string' ? param : param.id;
      const permanent = typeof param === 'string' ? true : Boolean(param.permanent);
      return DeleteGalleryApi(id, permanent);
    },
    onSuccess: (_, param) => {
      const id = typeof param === 'string' ? param : param.id;
      // Optimistically remove from all cached gallery lists
      queryClient.setQueriesData({ queryKey: ['galleries'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((g: any) => String(g.id) !== String(id));
      });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

export const useArchiveGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ArchiveGalleryApi(id),
    onSuccess: (_, id) => {
      // Optimistically mark gallery status as 'archived' across cached gallery queries
      queryClient.setQueriesData({ queryKey: ['galleries'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((g: any) => (String(g.id) === String(id) ? { ...g, status: 'archived' } : g));
      });
      queryClient.invalidateQueries({ queryKey: ['gallery', id] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
    },
  });
};

export const useRestoreGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetStatus }: { id: string; targetStatus?: 'active' | 'delivered' }) =>
      RestoreGalleryApi(id, targetStatus),
    onSuccess: (_, vars) => {
      // Optimistically restore status in cached gallery lists
      queryClient.setQueriesData({ queryKey: ['galleries'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((g: any) =>
          String(g.id) === String(vars.id) ? { ...g, status: vars.targetStatus || 'active' } : g
        );
      });
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
    },
  });
};

export const useMoveMediaSection = (galleryId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      galleryId: gid,
      mediaIds,
      targetSection,
    }: {
      galleryId?: string;
      mediaIds: string[];
      targetSection: string;
    }) => {
      const activeId = gid || galleryId;
      if (!activeId) throw new Error('Gallery ID is required');
      return MoveMediaToSectionApi(activeId, mediaIds, targetSection);
    },
    onSuccess: (_, vars) => {
      const activeId = vars.galleryId || galleryId;
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: ['gallery', activeId] });
      }
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    },
  });
};

export const useUploadGalleryMedia = (galleryId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      sectionTitle,
      type = 'photo',
      onProgress,
    }: {
      file: File;
      sectionTitle?: string;
      type?: 'photo' | 'video';
      onProgress?: (percent: number) => void;
    }) => UploadGalleryMediaApi(galleryId, file, sectionTitle, type, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

export const useBulkUploadGalleryMedia = (galleryId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      files,
      sectionTitle,
      type,
      onProgress,
      signal,
    }: {
      files: File[];
      sectionTitle?: string;
      type?: 'photo' | 'video';
      onProgress?: (percent: number, statusText?: string) => void;
      signal?: AbortSignal;
    }) => BulkUploadGalleryMediaApi(galleryId, files, sectionTitle, type, onProgress, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
  });
};

export const useDeleteGalleryMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId, galleryId }: { mediaId: string; galleryId?: string }) =>
      DeleteGalleryMediaApi(mediaId, galleryId),
    onSuccess: (_, vars) => {
      if (vars.galleryId) {
        queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
      }
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

export const useBulkDeleteGalleryMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaIds }: { mediaIds: string[]; galleryId?: string }) =>
      BulkDeleteGalleryMediaApi(mediaIds),
    onSuccess: (_, vars) => {
      if (vars.galleryId) {
        queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
      }
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
};

export const useToggleMediaFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: string | { mediaId: string; galleryId?: string; isFavorite?: boolean }) => {
      const mediaId = typeof args === 'string' ? args : args.mediaId;
      const galleryId = typeof args === 'string' ? undefined : args.galleryId;
      const isFavorite = typeof args === 'string' ? undefined : args.isFavorite;
      return ToggleMediaFavoriteApi(mediaId, galleryId, isFavorite);
    },
    onSuccess: (_data, vars) => {
      const galleryId = typeof vars === 'string' ? undefined : vars.galleryId;
      if (galleryId) {
        queryClient.invalidateQueries({ queryKey: ['gallery', galleryId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
      }
    },
  });
};

export const useSetGalleryCover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      galleryId,
      mediaIdOrUrl,
      mediaUrl,
      mediaId,
    }: {
      galleryId: string;
      mediaIdOrUrl?: string;
      mediaUrl?: string;
      mediaId?: string;
    }) => SetGalleryCoverImageApi(galleryId, mediaUrl || mediaIdOrUrl || '', mediaId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery'] });
    },
  });
};

export const useSetMasonrySlotBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      galleryId,
      slotIndex,
      mediaUrl,
    }: {
      galleryId: string;
      slotIndex: number;
      mediaUrl: string;
    }) => SetMasonrySlotBannerApi(galleryId, slotIndex, mediaUrl),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery'] });
    },
  });
};

export const useAddGallerySection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, title }: { galleryId: string; title: string }) =>
      AddGallerySectionApi(galleryId, title),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
    },
  });
};

export const useDeleteGallerySection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, sectionTitle }: { galleryId: string; sectionTitle: string }) =>
      DeleteGallerySectionApi(galleryId, sectionTitle),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
    },
  });
};

export const useRenameGallerySection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      galleryId,
      oldTitle,
      newTitle,
    }: {
      galleryId: string;
      oldTitle: string;
      newTitle: string;
    }) => RenameGallerySectionApi(galleryId, oldTitle, newTitle),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
    },
  });
};

export const useSetGalleryTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, templateId }: { galleryId: string; templateId: GalleryTemplateId }) =>
      SetGalleryTemplateApi(galleryId, templateId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery'] });
    },
  });
};

export const useSetGalleryTemplateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      galleryId,
      templateId,
      mediaUrl,
      mediaId,
    }: {
      galleryId: string;
      templateId: GalleryTemplateId;
      mediaUrl: string;
      mediaId?: string;
    }) => SetGalleryTemplateBannerApi(galleryId, templateId, mediaUrl, mediaId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery'] });
    },
  });
};

export const useReorderGalleryMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, mediaIds }: { galleryId: string; mediaIds: string[] }) =>
      ReorderGalleryMediaApi(galleryId, mediaIds),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
    },
  });
};

export const useReorderGallerySections = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ galleryId, sections }: { galleryId: string; sections: string[] }) =>
      ReorderGallerySectionsApi(galleryId, sections),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId] });
    },
  });
};

export const useGalleryAnalytics = (galleryId: string, timeRange: string = '30d') => {
  return useQuery({
    queryKey: ['gallery', galleryId, 'analytics', timeRange],
    queryFn: () => GetGalleryAnalyticsApi(galleryId, timeRange),
    enabled: Boolean(galleryId),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
};

export const useTrackGalleryActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      galleryId,
      type,
      device,
      details,
    }: {
      galleryId: string;
      type: 'view' | 'download' | 'favorite' | 'share';
      device?: string;
      details?: string;
    }) => TrackGalleryActivityApi(galleryId, { type, device, details }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gallery', vars.galleryId, 'analytics'] });
    },
  });
};

export const useGalleryShareDetails = (galleryId: string) => {
  return useQuery({
    queryKey: ['gallery', galleryId, 'share-details'],
    queryFn: () => GetGalleryShareDetailsApi(galleryId),
    enabled: Boolean(galleryId),
  });
};

export const usePublicGallery = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['public', 'gallery', idOrSlug],
    queryFn: () => GetPublicGalleryApi(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 5, // 5 sec to ensure instant sync from studio changes
  });
};

export const useVerifyGalleryPin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slugOrId, pin }: { slugOrId: string; pin: string }) =>
      VerifyGalleryPinApi(slugOrId, pin),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(['public', 'gallery', vars.slugOrId], data.gallery);
    },
  });
};

export const useTrackPublicGalleryView = () => {
  return useMutation({
    mutationFn: ({ slugOrId, device }: { slugOrId: string; device?: 'desktop' | 'mobile' | 'tablet' }) =>
      TrackGalleryViewApi(slugOrId, device),
  });
};

export const useTrackPublicGalleryFavorite = () => {
  return useMutation({
    mutationFn: ({
      slugOrId,
      mediaId,
      isFavorite,
    }: {
      slugOrId: string;
      mediaId: string;
      isFavorite: boolean;
    }) => TrackGalleryFavoriteApi(slugOrId, mediaId, isFavorite),
  });
};

// ===========================================================================
// 4. Live Events, Tethering & Guest QR
// ===========================================================================

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: GetEventsApi,
  });
};

export const useEventDetail = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['event', idOrSlug],
    queryFn: () => GetEventDetailApi(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => CreateEventApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      UpdateEventApi(id, updates),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['event', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DeleteEventApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEventQR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      durationHours,
      expiresAt,
      pinCode,
      allowGuestUploads,
    }: {
      eventId: string;
      durationHours: number | 'custom';
      expiresAt: string;
      pinCode?: string;
      allowGuestUploads?: boolean;
    }) => UpdateEventQRExpiryApi(eventId, durationHours, expiresAt, pinCode, allowGuestUploads),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['event', vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useMoveEventToGallery = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      args:
        | MoveEventToGalleryPayload
        | { eventId?: string; payload: MoveEventToGalleryPayload }
    ) => {
      const hasPayloadProp = typeof args === 'object' && args !== null && 'payload' in args;
      const activeId = (hasPayloadProp ? (args as any).eventId : undefined) || eventId;
      const finalPayload = hasPayloadProp ? (args as any).payload : (args as MoveEventToGalleryPayload);
      if (!activeId) throw new Error('Event ID is required');
      return MoveEventToGalleryApi(activeId, finalPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
    },
  });
};

export const useTetherPhotoUpload = (eventId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => TetherPhotoUploadApi(eventId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
};

export const usePublicEvent = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['public', 'event', idOrSlug],
    queryFn: () => GetPublicEventDetailApi(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
};

// ===========================================================================
// 5. AI Biometric Face Search
// ===========================================================================

export const useGalleryFaceSearch = () => {
  return useMutation({
    mutationFn: ({ galleryId, selfie }: { galleryId: string; selfie: File | Blob }) =>
      SearchGalleryByFaceApi(galleryId, selfie),
  });
};

export const useEventFaceSearch = () => {
  return useMutation({
    mutationFn: ({ eventId, selfie }: { eventId: string; selfie: File | Blob }) =>
      SearchEventByFaceApi(eventId, selfie),
  });
};

// ===========================================================================
// 6. Inquiries & Lead Pipeline
// ===========================================================================

export const useInquiries = () => {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: GetInquiriesApi,
  });
};

export const useUpdateInquiryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: InquiryStatus; notes?: string }) =>
      UpdateInquiryStatusApi(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'analytics'] });
    },
  });
};

export const useDeleteInquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inquiryId: string) => DeleteInquiryApi(inquiryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
};

export const useSubmitPublicInquiry = () => {
  return useMutation({
    mutationFn: (payload: SubmitInquiryPayload) => SubmitPublicInquiryApi(payload),
  });
};

export const useInquiriesAnalytics = () => {
  return useQuery({
    queryKey: ['inquiries', 'analytics'],
    queryFn: GetInquiriesAnalyticsApi,
  });
};

// ===========================================================================
// 7. Portfolio Studio & Showcase
// ===========================================================================

export const usePortfolioConfig = () => {
  return useQuery({
    queryKey: ['portfolio', 'config'],
    queryFn: GetPortfolioConfigApi,
  });
};

export const useUpdatePortfolioConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdatePortfolioConfigApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'config'] });
    },
  });
};

export const useAddPortfolioProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AddPortfolioProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'config'] });
    },
  });
};

export const useDeletePortfolioProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeletePortfolioProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'config'] });
    },
  });
};

export const usePublicPortfolio = (slugOrId: string) => {
  return useQuery({
    queryKey: ['public', 'portfolio', slugOrId],
    queryFn: () => GetPublicPortfolioApi(slugOrId),
    enabled: Boolean(slugOrId),
  });
};

export const usePortfolioAnalytics = () => {
  return useQuery({
    queryKey: ['portfolio', 'analytics'],
    queryFn: GetPortfolioAnalyticsApi,
  });
};


// ===========================================================================
// 9. Soundtrack & Audio Library
// ===========================================================================

export const useMusicTracks = () => {
  return useQuery({
    queryKey: ['music', 'tracks'],
    queryFn: GetMusicTracksApi,
    staleTime: 1000 * 60 * 30, // 30 mins
  });
};

export const useUploadCustomMusic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, artist }: { file: File; title: string; artist?: string }) =>
      UploadCustomTrackApi(file, title, artist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music', 'tracks'] });
    },
  });
};
