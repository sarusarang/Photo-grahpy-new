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
} from '@/service/auth/AuthApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  CheckLoginResponse,
  LogoutResponse,
  RefreshTokenResponse,
} from '@/service/auth/type';

// Login OTP Send
export const useSendLoginOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => {
      return await SendLoginOtpApi(data);
    },
    onSuccess: (data) => {
      toast.success("Verification Code Sent", {
        description: data?.message || "A 6-digit verification passcode has been sent to your email address.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to Send OTP", {
        description: error?.message || "Could not dispatch verification code. Please check your email and retry.",
      });
    },
  });
};

// Login OTP Verify
export const useVerifyLoginOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: async (data) => {
      return await VerifyLoginOtpApi(data);
    },
    onSuccess: (data) => {
      toast.success("Authentication Successful", {
        description: data?.message || "Welcome back to your photographer workspace.",
      });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-state'] });
    },
    onError: (error: Error) => {
      toast.error("Verification Failed", {
        description: error?.message || "Invalid or expired passcode. Please re-enter the code or request a new one.",
      });
    },
  });
};

// Login OTP Resend
export const useResendLoginOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => {
      return await ResendLoginOtpApi(data);
    },
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

// Registration OTP Send
export const useSendRegOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => {
      return await SendRegOtpApi(data);
    },
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

// Registration OTP Verify
export const useVerifyRegOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: async (data) => {
      return await VerifyRegOtpApi(data);
    },
    onSuccess: (data) => {
      toast.success("Email Verified", {
        description: data?.message || "Your email has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-state'] });
    },
    onError: (error: Error) => {
      toast.error("Verification Failed", {
        description: error?.message || "Invalid or expired passcode. Please re-enter the code or request a new one.",
      });
    },
  });
};

// Registration OTP Resend
export const useResendRegOtp = () => {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: async (data) => {
      return await ResendRegOtpApi(data);
    },
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

// Aliases for backward compatibility (defaults to Login)
export const useSendOtp = useSendLoginOtp;
export const useVerifyOtp = useVerifyLoginOtp;
export const useResendOtp = useResendLoginOtp;

// User Logout
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: async () => {
      return await UserLogoutApi();
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Logged out successfully");
      localStorage.removeItem('photo_saas_auth_v2');
      localStorage.removeItem('photo_saas_profile_v2');
      localStorage.removeItem('photo_saas_user_v2');
      queryClient.setQueryData(['check-login'], { is_logged_in: false, message: "Logged out successfully" });
      queryClient.setQueryData(['onboarding-state'], null);
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
      localStorage.setItem('logout', Date.now().toString());
    },
    onError: (error: Error) => {
      toast.error("Sign Out Notice", {
        description: error?.message || "Cleared local session.",
      });
      localStorage.removeItem('photo_saas_auth_v2');
      localStorage.removeItem('photo_saas_profile_v2');
      localStorage.removeItem('photo_saas_user_v2');
      queryClient.setQueryData(['check-login'], { is_logged_in: false, message: "Logged out" });
      queryClient.invalidateQueries({ queryKey: ['check-login'] });
      localStorage.setItem('logout', Date.now().toString());
    },
  });
};

// Check Login Status & Session Validity
export const useCheckLogin = (options?: { enabled?: boolean }) => {
  return useQuery<CheckLoginResponse, Error>({
    queryKey: ['check-login'],
    queryFn: async () => {
      return await CheckLoginStatusApi();
    },
    retry: 1,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

// Refresh Access Token Mutation
export const useRefreshToken = () => {
  return useMutation<RefreshTokenResponse, Error, void>({
    mutationFn: async () => {
      return await RefreshTokenApi();
    },
    onSuccess: (data) => {
      toast.success("Session Active", {
        description: data?.message || "Access token refreshed",
      });
    },
    onError: (error: Error) => {
      toast.error("Session Refresh Failed", {
        description: error?.message || "Please log in again.",
      });
    },
  });
};
