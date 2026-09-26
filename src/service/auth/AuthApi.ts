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

/**
 * Send OTP for Passwordless Login
 * Endpoint: POST /api/auth/passwordless/login/send-otp/
 */
export const SendLoginOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/login/send-otp/", data)) as SendOtpResponse;
};

/**
 * Verify OTP for Passwordless Login
 * Endpoint: POST /api/auth/passwordless/login/verify-otp/
 * On success, backend sets session cookies in Set-Cookie response header.
 */
export const VerifyLoginOtpApi = async (data: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/login/verify-otp/", data)) as VerifyOtpResponse;
};

/**
 * Resend OTP for Passwordless Login
 * Endpoint: POST /api/auth/passwordless/login/resend-otp/
 */
export const ResendLoginOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/login/resend-otp/", data)) as SendOtpResponse;
};

/**
 * Send OTP for Passwordless Registration
 * Endpoint: POST /api/auth/passwordless/reg/send-otp/
 */
export const SendRegOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/reg/send-otp/", data)) as SendOtpResponse;
};

/**
 * Verify OTP for Passwordless Registration
 * Endpoint: POST /api/auth/passwordless/reg/verify-otp/
 * On success, backend sets session cookies in Set-Cookie response header.
 */
export const VerifyRegOtpApi = async (data: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/reg/verify-otp/", data)) as VerifyOtpResponse;
};

/**
 * Resend OTP for Passwordless Registration
 * Endpoint: POST /api/auth/passwordless/reg/resend-otp/
 */
export const ResendRegOtpApi = async (data: SendOtpPayload): Promise<SendOtpResponse> => {
  return (await CommonApi("POST", "/api/auth/passwordless/reg/resend-otp/", data)) as SendOtpResponse;
};

/**
 * Check Login Status & Active Session
 * Endpoint: GET /api/auth/check-login/
 * Authenticated with HTTP-only cookies (withCredentials: true).
 * Returns { is_logged_in: true, user: ... } on 200 OK.
 * Returns { is_logged_in: false, message: ... } on 401 Unauthenticated.
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

    // 401 is normal when session is absent or expired
    if (err?.status === 401 && err?.data?.is_logged_in === false) {
      return err.data as CheckLoginResponse;
    }
    if (err?.response?.status === 401 && err?.response?.data?.is_logged_in === false) {
      return err.response.data as CheckLoginResponse;
    }
    if (err?.status === 401 || err?.response?.status === 401) {
      return {
        is_logged_in: false,
        message: err?.message || err?.response?.data?.message || "Unauthenticated",
      };
    }
    throw error;
  }
};

/**
 * Refresh Session Cookies
 * Endpoint: POST /api/auth/token/refresh/
 */
export const RefreshTokenApi = async (): Promise<RefreshTokenResponse> => {
  return (await CommonApi("POST", "/api/auth/token/refresh/")) as RefreshTokenResponse;
};

/**
 * Logout User Session
 * Endpoint: POST /api/auth/logout/
 * Backend clears all session & authentication cookies.
 */
export const UserLogoutApi = async (): Promise<LogoutResponse> => {
  return (await CommonApi("POST", "/api/auth/logout/")) as LogoutResponse;
};
