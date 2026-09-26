import { CommonApi } from "@/lib/CommonApi";
import type {
  OnboardingStateResponse,
  SubmitOnboardingPayload,
  SubmitOnboardingResponse,
  PhotographerProfileResponse,
  UpdatePersonalInformationPayload,
  UpdatePersonalInformationResponse,
  UploadAvatarResponse,
  RemoveAvatarResponse,
} from "./type";

/**
 * Inspect Current Onboarding State
 * GET /api/photographers/onboarding/
 */
export const GetOnboardingStateApi = async (): Promise<OnboardingStateResponse> => {
  return (await CommonApi("GET", "/api/photographers/onboarding/")) as OnboardingStateResponse;
};

/**
 * Submit Profile Setup & Complete Onboarding
 * POST /api/photographers/onboarding/ or /api/photographers/onboarding/complete/
 */
export const SubmitOnboardingApi = async (
  payload: SubmitOnboardingPayload
): Promise<SubmitOnboardingResponse> => {
  const step = payload.onboarding_step ?? 3;

  if (payload.avatar instanceof File) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("phone", payload.phone || "");
    formData.append("occupation", payload.occupation || "");
    formData.append("avatar", payload.avatar);
    formData.append("onboarding_step", step.toString());

    try {
      return (await CommonApi(
        "POST",
        "/api/photographers/onboarding/",
        formData
      )) as SubmitOnboardingResponse;
    } catch {
      return (await CommonApi(
        "POST",
        "/api/photographers/onboarding/complete/",
        formData
      )) as SubmitOnboardingResponse;
    }
  }

  // JSON payload (Option A: without custom image file)
  const jsonBody: Record<string, string | number> = {
    name: payload.name,
    phone: payload.phone || "",
    occupation: payload.occupation || "",
    onboarding_step: step,
  };
  if (payload.avatar_url) {
    jsonBody.avatar_url = payload.avatar_url;
  }

  try {
    return (await CommonApi(
      "POST",
      "/api/photographers/onboarding/",
      jsonBody
    )) as SubmitOnboardingResponse;
  } catch {
    return (await CommonApi(
      "POST",
      "/api/photographers/onboarding/complete/",
      jsonBody
    )) as SubmitOnboardingResponse;
  }
};

/**
 * 1. GET Current Photographer Profile & Metrics
 * Endpoint: GET /api/photographers/profiles/me/
 */
export const GetPhotographerProfileApi = async (): Promise<PhotographerProfileResponse> => {
  return (await CommonApi("GET", "/api/photographers/profiles/me/")) as PhotographerProfileResponse;
};

/**
 * 2. Update Personal Information (Save Changes)
 * Endpoint: PATCH /api/photographers/profiles/me/
 */
export const UpdatePersonalInformationApi = async (
  payload: UpdatePersonalInformationPayload
): Promise<UpdatePersonalInformationResponse> => {
  return (await CommonApi(
    "PATCH",
    "/api/photographers/profiles/me/",
    payload
  )) as UpdatePersonalInformationResponse;
};

/**
 * 3. Upload / Update Profile Photo (Avatar)
 * Endpoint: POST /api/photographers/profiles/me/avatar/
 */
export const UploadProfileAvatarApi = async (
  file: File
): Promise<UploadAvatarResponse> => {
  const formData = new FormData();
  formData.append("avatar", file);
  return (await CommonApi(
    "POST",
    "/api/photographers/profiles/me/avatar/",
    formData
  )) as UploadAvatarResponse;
};

/**
 * 4. Remove Profile Photo
 * Endpoint: DELETE /api/photographers/profiles/me/avatar/
 */
export const RemoveProfileAvatarApi = async (): Promise<RemoveAvatarResponse> => {
  return (await CommonApi(
    "DELETE",
    "/api/photographers/profiles/me/avatar/"
  )) as RemoveAvatarResponse;
};

/**
 * 5. Update Watermark Configuration
 * Endpoint: PATCH /api/photographers/profiles/me/watermark/ or /api/photographers/profiles/me/
 */
export const UpdateWatermarkApi = async (payload: {
  enable_watermark?: boolean;
  watermark_text?: string;
  watermark_opacity?: number;
  watermark_position?: string;
  watermark_image?: File;
}) => {
  if (payload.watermark_image instanceof File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined) formData.append(k, v as any);
    });
    return CommonApi('PATCH', '/api/photographers/profiles/me/watermark/', formData);
  }
  try {
    return await CommonApi('PATCH', '/api/photographers/profiles/me/watermark/', payload);
  } catch {
    return await CommonApi('PATCH', '/api/photographers/profiles/me/', payload);
  }
};

// Aliases matching implementation guide
export const GetMyProfileApi = GetPhotographerProfileApi;
export const UpdateMyProfileApi = UpdatePersonalInformationApi;
export const UploadAvatarApi = UploadProfileAvatarApi;
export const DeleteAvatarApi = RemoveProfileAvatarApi;
export const CompleteOnboardingApi = SubmitOnboardingApi;

