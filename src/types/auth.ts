import type { PhotographerProfile } from './index';

/**
 * Authenticated User Profile returned by backend session
 */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  phone?: string | null;
  unique_id?: string;
  fullname?: string;
  role?: 'photographer' | 'client' | 'admin' | string;
  is_email_verified?: boolean;
  avatar_url?: string;
}

/**
 * Payload for requesting OTP via email
 */
export interface SendOtpPayload {
  email: string;
}

/**
 * Response for OTP dispatch request
 */
export interface SendOtpResponse {
  status: string;
  message: string;
  email?: string;
  is_registered: boolean;
}

/**
 * Payload for verifying 6-digit OTP code
 */
export interface VerifyOtpPayload {
  email: string;
  otp: string;
  fullname?: string;
  role?: string;
}

/**
 * Response returned after verifying OTP
 */
export interface VerifyOtpResponse {
  status: string;
  message: string;
  is_new_user: boolean;
  user: AuthUser;
}

/**
 * Successful response from /api/auth/check-login/ (200 OK)
 */
export interface CheckLoginSuccessResponse {
  is_logged_in: true;
  user: AuthUser;
  message?: string;
}

/**
 * Unauthenticated response from /api/auth/check-login/ (401 or unauthenticated)
 */
export interface CheckLoginUnauthenticatedResponse {
  is_logged_in: false;
  message: string;
  user?: null;
}

/**
 * Combined response type for session validation endpoint
 */
export type CheckLoginResponse = CheckLoginSuccessResponse | CheckLoginUnauthenticatedResponse;

/**
 * Response for user logout endpoint
 */
export interface LogoutResponse {
  message: string;
  status?: string | number;
}

/**
 * Response for cookie token refresh endpoint
 */
export interface RefreshTokenResponse {
  message: string;
}

/**
 * Normalized API error response
 */
export interface ApiErrorResponse {
  status?: number;
  message: string;
  data?: unknown;
}

/**
 * React Auth Context contract consumed across the entire application
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  user: AuthUser | null;
  photographer: PhotographerProfile;
  checkLoginError: Error | null;
  login: (userData?: Partial<AuthUser>, profileData?: Partial<PhotographerProfile>) => void;
  logout: () => Promise<void>;
  refetchAuth: () => Promise<unknown>;
  updateProfile: (updates: Partial<PhotographerProfile>) => void;
  completeOnboarding: (data: Partial<PhotographerProfile>) => void;
  resetProfile: () => void;
}
