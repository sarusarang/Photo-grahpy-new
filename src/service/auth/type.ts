export interface AuthUser {
  id: number;
  username: string;
  email: string;
  phone?: string | null;
  unique_id?: string;
  fullname?: string;
  role?: string;
  is_email_verified?: boolean;
  avatar_url?: string;
}

export interface SendOtpPayload {
  email: string;
}

export interface SendOtpResponse {
  status: string;
  message: string;
  email?: string;
  is_registered: boolean;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  fullname?: string;
  role?: string;
}

export interface VerifyOtpResponse {
  status: string;
  message: string;
  is_new_user: boolean;
  user: AuthUser;
  access_token?: string;
  refresh_token?: string;
}

/** Check Login Success (200 OK) */
export interface CheckLoginSuccessResponse {
  is_logged_in: true;
  user: AuthUser;
  message?: string;
}

/** Check Login Unauthenticated (401 Unauthorized or not logged in) */
export interface CheckLoginUnauthenticatedResponse {
  is_logged_in: false;
  message: string;
}

export type CheckLoginResponse = CheckLoginSuccessResponse | CheckLoginUnauthenticatedResponse;

/** Logout Response */
export interface LogoutResponse {
  message: string;
  status?: string | number;
}

/** Refresh Token Response */
export interface RefreshTokenResponse {
  message: string;
}

/** Normalized API Error */
export interface ApiErrorResponse {
  status?: number;
  message: string;
  data?: unknown;
}

export interface AuthResponse {
  status?: string | boolean | number;
  is_logged_in?: boolean;
  message?: string;
  user?: AuthUser;
  is_new_user?: boolean;
  is_registered?: boolean;
  data?: unknown;
  [key: string]: unknown;
}

