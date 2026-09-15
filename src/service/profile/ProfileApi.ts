import { CommonApi } from "@/lib/CommonApi";
import type {
  OnboardingStateResponse,
  SubmitOnboardingPayload,
  SubmitOnboardingResponse,
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
 * Handles both JSON payload and multipart/form-data when an avatar image file is provided.
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
  const jsonBody: Record<string, any> = {
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
