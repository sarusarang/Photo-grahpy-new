import { CommonApi } from "@/lib/CommonApi";
import type {
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  CheckLoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
} from "./type";

/** Send OTP for Passwordless Login */
export const SendLoginOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/login/send-otp/", data)) as SendOtpResponse;
};

/** Verify OTP for Passwordless Login */
export const VerifyLoginOtpApi = async (data: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/login/verify-otp/", data)) as VerifyOtpResponse;
};

/** Resend OTP for Passwordless Login */
export const ResendLoginOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/login/resend-otp/", data)) as SendOtpResponse;
};

/** Send OTP for Passwordless Registration */
export const SendRegOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/reg/send-otp/", data)) as SendOtpResponse;
};

/** Verify OTP for Passwordless Registration */
export const VerifyRegOtpApi = async (data: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/reg/verify-otp/", data)) as VerifyOtpResponse;
};

/** Resend OTP for Passwordless Registration */
export const ResendRegOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/reg/resend-otp/", data)) as SendOtpResponse;
};

/**
 * Check Login Status & Active Session
 * Returns { is_logged_in: true, user: ... } on 200 OK
 * Returns { is_logged_in: false, message: ... } on 401 Unauthenticated
 */
export const CheckLoginStatusApi = async (): Promise<CheckLoginResponse> => {
  try {
    return (await CommonApi("GET", "/api/auth/check-login/")) as CheckLoginResponse;
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      data?: { is_logged_in?: boolean; message?: string };
      response?: { status?: number; data?: { is_logged_in?: boolean; message?: string } };
      message?: string;
    } | null;

    // 401 is normal when unauthenticated: { is_logged_in: false, message: "No access token found" }
    if (err?.status === 401 && err?.data?.is_logged_in === false) {
      return err.data as CheckLoginResponse;
    }
    if (err?.response?.status === 401 && err?.response?.data?.is_logged_in === false) {
      return err.response.data as CheckLoginResponse;
    }
    // If backend returns 401 without JSON body or other message
    if (err?.status === 401 || err?.response?.status === 401) {
      return {
        is_logged_in: false,
        message: err?.message || err?.response?.data?.message || "No access token found",
      };
    }
    throw error;
  }
};

/** Refresh Access Token */
export const RefreshTokenApi = async (): Promise<RefreshTokenResponse> => {
  return (await CommonApi("POST", "/api/auth/token/refresh/")) as RefreshTokenResponse;
};

/** Logout User Session */
export const UserLogoutApi = async (): Promise<LogoutResponse> => {
  return (await CommonApi("POST", "/api/auth/logout/")) as LogoutResponse;
};

