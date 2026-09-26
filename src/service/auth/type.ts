/**
 * Re-export all centralized auth types from @/types/auth
 */
export * from '@/types/auth';

import type { AuthUser } from '@/types/auth';

/**
 * Generic Auth Response for loose backend response handling
 */
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
