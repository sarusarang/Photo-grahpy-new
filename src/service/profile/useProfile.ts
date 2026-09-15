import {
  GetOnboardingStateApi,
  SubmitOnboardingApi,
} from './ProfileApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  OnboardingStateResponse,
  SubmitOnboardingPayload,
  SubmitOnboardingResponse,
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
        description: data?.message || "Your photographer workspace is ready. Welcome to Ex Studio!",
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
