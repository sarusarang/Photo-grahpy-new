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

// -------------------------------------------------------------
// Photographer Profile Section API Specification Types
// -------------------------------------------------------------

export interface QuickInfoStats {
  member_since?: string;
  member_since_iso?: string;
  galleries_created?: number;
  total_photos?: number;
  total_videos?: number;
  storage_used_bytes?: number;
  storage_limit_bytes?: number;
  storage_used_formatted?: string;
  storage_limit_formatted?: string;
  storage_display?: string;
}

export interface ProfilePlanDetails {
  name?: string;
  tier?: string;
  billing_cycle?: string;
  headline?: string;
  description?: string;
}

export interface PhotographerProfileResponse {
  id: number;
  user?: number;
  user_username?: string;
  user_email?: string;
  name: string;
  phone: string;
  email: string;
  occupation: string;
  studio_name?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  instagram_handle?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  profile_image?: string | null;
  default_template?: string;
  enable_watermark?: boolean;
  watermark_text?: string;
  watermark_image?: string | null;
  watermark_opacity?: number;
  watermark_position?: string;
  is_onboarded?: boolean;
  onboarding_step?: number;
  storage_used_bytes?: number;
  storage_reserved_bytes?: number;
  storage_limit_bytes?: number;
  storage_remaining_bytes?: number;
  quick_info?: QuickInfoStats;
  plan_details?: ProfilePlanDetails;
  created_at?: string;
  updated_at?: string;
}

export interface UpdatePersonalInformationPayload {
  name: string;
  phone: string;
  email: string;
  occupation: string;
}

export interface UpdatePersonalInformationResponse {
  message: string;
  data: PhotographerProfileResponse;
}

export interface UploadAvatarResponse {
  message: string;
  avatar_url: string;
  data?: {
    id: number;
    name: string;
    avatar_url: string;
  };
}

export interface RemoveAvatarResponse {
  message: string;
  avatar_url: string;
  data?: {
    id: number;
    name: string;
    avatar: null;
    avatar_url: string;
    profile_image: null;
  };
}
