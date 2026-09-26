import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PhotographerProfile } from '@/types';
import type { AuthUser, AuthContextType } from '@/types/auth';
import { useCheckLogin, useLogout, AUTH_QUERY_KEYS } from '@/service/auth';
import { INITIAL_PHOTOGRAPHER } from '@/data/demoData';

// Re-export type contract for backward compatibility
export type { AuthContextType };

/**
 * Builds a normalized PhotographerProfile combining authenticated AuthUser data
 * with optional in-memory profile overrides.
 */
const buildPhotographerProfile = (
  user?: Partial<AuthUser> | null,
  override?: Partial<PhotographerProfile> | null
): PhotographerProfile => ({
  id: user?.id?.toString() || override?.id || '',
  studioName: user?.fullname ? `${user.fullname} Studio` : override?.studioName || 'Studio',
  fullName: user?.fullname || user?.username || override?.fullName || '',
  email: user?.email || override?.email || '',
  phone: user?.phone || override?.phone || '',
  location: override?.location || '',
  bio: override?.bio || '',
  avatarUrl: user?.avatar_url || override?.avatarUrl || '',
  websiteUrl: override?.websiteUrl || '',
  instagramHandle: override?.instagramHandle || '',
  watermarkText: override?.watermarkText || '© EX SHARE',
  enableWatermark: override?.enableWatermark ?? false,
  isOnboarded: override?.isOnboarded ?? Boolean(user?.id),
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Enterprise AuthProvider
 * - Driven strictly by HTTP-only cookie session validation (/api/auth/check-login/).
 * - Zero reliance on localStorage for tokens or authentication states.
 * - Reactive query-driven session status.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // 1. Single Source of Truth: Backend cookie session validation query
  const {
    data: checkLoginData,
    isLoading: isCheckingLogin,
    error: checkLoginError,
    refetch: refetchAuth,
  } = useCheckLogin();

  const logoutMutation = useLogout();

  // 2. In-memory profile edits for the active session
  const [profileOverride, setProfileOverride] = useState<Partial<PhotographerProfile> | null>(null);

  // 3. Strictly derive authentication status from check-login API
  const isAuthenticated = useMemo(() => {
    return Boolean(checkLoginData?.is_logged_in && checkLoginData.user);
  }, [checkLoginData]);

  const user = useMemo<AuthUser | null>(() => {
    if (checkLoginData?.is_logged_in && checkLoginData.user) {
      return checkLoginData.user;
    }
    return null;
  }, [checkLoginData]);

  const photographer = useMemo<PhotographerProfile>(() => {
    if (user) {
      return buildPhotographerProfile(user, profileOverride);
    }
    return INITIAL_PHOTOGRAPHER;
  }, [user, profileOverride]);

  // 4. Session expired listener (triggered by Axios 401 refresh failure)
  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.checkLogin, {
        is_logged_in: false,
        message: 'Session expired',
      });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.checkLogin });
      setProfileOverride(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [queryClient]);

  // 5. Authentication Actions
  const login = useCallback(
    (userData?: Partial<AuthUser>, profileData?: Partial<PhotographerProfile>) => {
      if (userData && userData.email) {
        queryClient.setQueryData(AUTH_QUERY_KEYS.checkLogin, {
          is_logged_in: true,
          user: userData as AuthUser,
        });
      }
      if (profileData) {
        setProfileOverride((prev) => ({ ...prev, ...profileData }));
      }
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.checkLogin });
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Error handled by mutation toast
    } finally {
      setProfileOverride(null);
      queryClient.setQueryData(AUTH_QUERY_KEYS.checkLogin, {
        is_logged_in: false,
        message: 'Logged out',
      });
      queryClient.clear();
    }
  }, [logoutMutation, queryClient]);

  const updateProfile = useCallback((updates: Partial<PhotographerProfile>) => {
    setProfileOverride((prev) => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback((data: Partial<PhotographerProfile>) => {
    setProfileOverride((prev) => ({
      ...prev,
      ...data,
      isOnboarded: true,
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfileOverride(null);
  }, []);

  // Loading state active only on initial cold check when query is pending and no data exists yet
  const isLoading = isCheckingLogin && checkLoginData === undefined;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isLoggingOut: logoutMutation.isPending,
        user,
        photographer,
        checkLoginError: checkLoginError as Error | null,
        login,
        logout,
        refetchAuth,
        updateProfile,
        completeOnboarding,
        resetProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Access the unified authentication state & actions
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
