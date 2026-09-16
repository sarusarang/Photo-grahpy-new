import {
  GetOnboardingStateApi,
  SubmitOnboardingApi,
  GetPhotographerProfileApi,
  UpdatePersonalInformationApi,
  UploadProfileAvatarApi,
  RemoveProfileAvatarApi,
} from './ProfileApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  OnboardingStateResponse,
  SubmitOnboardingPayload,
  SubmitOnboardingResponse,
  PhotographerProfileResponse,
  UpdatePersonalInformationPayload,
  UpdatePersonalInformationResponse,
  UploadAvatarResponse,
  RemoveAvatarResponse,
} from './type';

// Query for current onboarding state
export const useOnboardingState = (enabled = true) => {
  return useQuery<OnboardingStateResponse>({
    queryKey: ['onboarding-state'],
    queryFn: async () => {
      return await GetOnboardingStateApi();
    },
    enabled,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

// Mutation for submitting onboarding profile setup
export const useSubmitOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation<SubmitOnboardingResponse, any, SubmitOnboardingPayload>({
    mutationFn: async (payload) => {
      return await SubmitOnboardingApi(payload);
    },
    onSuccess: (data) => {
      toast.success("Profile Setup Complete", {
        description: data?.message || "Your photographer workspace is ready. Welcome to EX SHARE!",
      });
      queryClient.setQueryData(['onboarding-state'], data);
      queryClient.invalidateQueries({ queryKey: ['onboarding-state'] });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
    },
    onError: (error: any) => {
      toast.error("Profile Setup Failed", {
        description: error?.message || "Failed to complete studio profile. Please verify your details and try again.",
      });
    },
  });
};

// -------------------------------------------------------------
// Settings: Photographer Profile Hooks
// -------------------------------------------------------------

/**
 * Hook to retrieve the authenticated photographer's profile & metrics
 * GET /api/photographers/profiles/me/
 */
export const usePhotographerProfile = (enabled = true) => {
  return useQuery<PhotographerProfileResponse>({
    queryKey: ['photographer-profile'],
    queryFn: async () => {
      return await GetPhotographerProfileApi();
    },
    enabled,
    retry: 1,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to update personal information (Name, Phone, Email, Occupation)
 * PATCH /api/photographers/profiles/me/
 */
export const useUpdatePersonalInformation = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdatePersonalInformationResponse, any, UpdatePersonalInformationPayload>({
    mutationFn: async (payload) => {
      return await UpdatePersonalInformationApi(payload);
    },
    onSuccess: (data) => {
      toast.success("Profile Saved", {
        description: data?.message || "Your personal information was saved successfully.",
      });
      if (data?.data) {
        queryClient.setQueryData(['photographer-profile'], data.data);
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
    },
    onError: (error: any) => {
      toast.error("Save Failed", {
        description: error?.response?.data?.message || error?.message || "Failed to update personal information.",
      });
    },
  });
};

/**
 * Hook to upload / update profile photo (avatar)
 * POST /api/photographers/profiles/me/avatar/
 */
export const useUploadProfileAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadAvatarResponse, any, File>({
    mutationFn: async (file: File) => {
      return await UploadProfileAvatarApi(file);
    },
    onSuccess: (data) => {
      toast.success("Photo Uploaded", {
        description: data?.message || "Profile photo updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
    },
    onError: (error: any) => {
      toast.error("Upload Failed", {
        description: error?.response?.data?.message || error?.message || "Failed to upload profile photo.",
      });
    },
  });
};

/**
 * Hook to remove profile photo
 * DELETE /api/photographers/profiles/me/avatar/
 */
export const useRemoveProfileAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation<RemoveAvatarResponse, any, void>({
    mutationFn: async () => {
      return await RemoveProfileAvatarApi();
    },
    onSuccess: (data) => {
      toast.success("Photo Removed", {
        description: data?.message || "Profile photo removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
    },
    onError: (error: any) => {
      toast.error("Remove Failed", {
        description: error?.response?.data?.message || error?.message || "Failed to remove profile photo.",
      });
    },
  });
};
