import type { AuthUser } from '@/service/auth/type';

export interface OnboardingStateResponse {
  status: string;
  is_onboarded: boolean;
  onboarding_step: number;
  name: string;
  phone: string;
  occupation: string;
  avatar_url: string;
}

export interface SubmitOnboardingPayload {
  name: string;
  phone?: string;
  occupation?: string;
  avatar?: File | null;
  avatar_url?: string;
  onboarding_step?: number;
}

export interface PhotographerProfileData {
  id: number;
  name: string;
  phone: string;
  occupation: string;
  avatar_url: string;
  is_onboarded: boolean;
  onboarding_step: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

export interface SubmitOnboardingResponse {
  status: string;
  message: string;
  is_onboarded: boolean;
  onboarding_step: number;
  profile: PhotographerProfileData;
  user: AuthUser;
}
