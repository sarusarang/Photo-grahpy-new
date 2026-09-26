import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  SendLoginOtpApi,
  VerifyLoginOtpApi,
  ResendLoginOtpApi,
  SendRegOtpApi,
  VerifyRegOtpApi,
  ResendRegOtpApi,
  CheckLoginStatusApi,
  UserLogoutApi,
  RefreshTokenApi,
} from './AuthApi';
import type {
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  CheckLoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
} from './type';

/**
 * React Query Keys for Auth Domain
 */
export const AUTH_QUERY_KEYS = {
  checkLogin: ['check-login'] as const,
  onboardingState: ['onboarding-state'] as const,
  photographerProfile: ['photographer-profile'] as const,
};

// ============================================================================
// 1. Passwordless Login Flow
// ============================================================================

/**
 * Dispatch verification OTP for passwordless login
 */
export const useSendLoginOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => SendLoginOtpApi(data),
    onSuccess: (data) => {
      toast.success("Verification Code Sent", {
        description: data?.message || "A 6-digit verification code has been dispatched to your email address.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to Send OTP", {
        description: error?.message || "Could not dispatch verification code. Please check your email and retry.",
      });
    },
  });
};

/**
 * Verify OTP for passwordless login and initialize session
 */
export const useVerifyLoginOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: async (data) => VerifyLoginOtpApi(data),
    onSuccess: (data) => {
      toast.success("Authentication Successful", {
        description: data?.message || "Welcome back to your photographer workspace.",
      });
      // Invalidate session checks so the app updates with fresh server state
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.checkLogin });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.onboardingState });
    },
    onError: (error: Error) => {
      toast.error("Verification Failed", {
        description: error?.message || "Invalid or expired passcode. Please re-enter the code or request a new one.",
      });
    },
  });
};

/**
 * Resend OTP code for passwordless login
 */
export const useResendLoginOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => ResendLoginOtpApi(data),
    onSuccess: (data) => {
      toast.success("Code Resent", {
        description: data?.message || "A fresh 6-digit verification code has been dispatched to your email.",
      });
    },
    onError: (error: Error) => {
      toast.error("Resend Failed", {
        description: error?.message || "Unable to resend verification code. Please wait a moment and try again.",
      });
    },
  });
};

// ============================================================================
// 2. Passwordless Registration Flow
// ============================================================================

/**
 * Dispatch verification OTP for new photographer registration
 */
export const useSendRegOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => SendRegOtpApi(data),
    onSuccess: (data) => {
      toast.success("Registration Code Sent", {
        description: data?.message || "A 6-digit registration code has been sent to your email address.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to Send Registration Code", {
        description: error?.message || "Could not dispatch registration code. Please check your email and retry.",
      });
    },
  });
};

/**
 * Verify registration OTP and activate user account
 */
export const useVerifyRegOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: async (data) => VerifyRegOtpApi(data),
    onSuccess: (data) => {
      toast.success("Email Verified", {
        description: data?.message || "Your email has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.checkLogin });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.onboardingState });
    },
    onError: (error: Error) => {
      toast.error("Verification Failed", {
        description: error?.message || "Invalid or expired passcode. Please re-enter the code or request a new one.",
      });
    },
  });
};

/**
 * Resend registration OTP code
 */
export const useResendRegOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => ResendRegOtpApi(data),
    onSuccess: (data) => {
      toast.success("Registration Code Resent", {
        description: data?.message || "A fresh 6-digit registration code has been dispatched to your email.",
      });
    },
    onError: (error: Error) => {
      toast.error("Resend Failed", {
        description: error?.message || "Unable to resend registration code. Please wait a moment and try again.",
      });
    },
  });
};

// Backward-compatible flow aliases
export const useSendOtp = useSendLoginOtp;
export const useVerifyOtp = useVerifyLoginOtp;
export const useResendOtp = useResendLoginOtp;

// ============================================================================
// 3. Session Management & Validation
// ============================================================================

/**
 * Check Login Status & Session Validity (Cookie-based Single Source of Truth)
 */
export const useCheckLogin = (options?: { enabled?: boolean }) => {
  return useQuery<CheckLoginResponse, Error>({
    queryKey: AUTH_QUERY_KEYS.checkLogin,
    queryFn: async () => CheckLoginStatusApi(),
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Terminate user session & purge auth caches
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: async () => UserLogoutApi(),
    onSuccess: (data) => {
      toast.success(data?.message || "Logged out successfully");
      queryClient.setQueryData(AUTH_QUERY_KEYS.checkLogin, {
        is_logged_in: false,
        message: "Logged out successfully",
      });
      queryClient.setQueryData(AUTH_QUERY_KEYS.onboardingState, null);
      queryClient.setQueryData(AUTH_QUERY_KEYS.photographerProfile, null);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.checkLogin });
    },
    onError: (error: Error) => {
      toast.error("Sign Out Notice", {
        description: error?.message || "Session cleared.",
      });
      queryClient.setQueryData(AUTH_QUERY_KEYS.checkLogin, {
        is_logged_in: false,
        message: "Logged out",
      });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.checkLogin });
    },
  });
};

/**
 * Explicitly refresh session cookie
 */
export const useRefreshToken = () => {
  return useMutation<RefreshTokenResponse, Error, void>({
    mutationFn: async () => RefreshTokenApi(),
    onSuccess: (data) => {
      toast.success("Session Active", {
        description: data?.message || "Session cookies refreshed.",
      });
    },
    onError: (error: Error) => {
      toast.error("Session Refresh Failed", {
        description: error?.message || "Please log in again.",
      });
    },
  });
};
