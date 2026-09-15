import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PhotographerProfile } from '../types';
import type { AuthUser } from '../service/auth/type';
import { useCheckLogin, useLogout } from '../service/auth/useAuth';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  user: AuthUser | null;
  photographer: PhotographerProfile;
  checkLoginError: any;
  login: (userData?: Partial<AuthUser>, profileData?: Partial<PhotographerProfile>) => void;
  logout: () => Promise<void>;
  refetchAuth: () => Promise<any>;
  updateProfile: (updates: Partial<PhotographerProfile>) => void;
  completeOnboarding: (data: Partial<PhotographerProfile>) => void;
  resetProfile: () => void;
}

const STORAGE_KEY = 'photo_saas_auth_v2';
const PROFILE_KEY = 'photo_saas_profile_v2';
const USER_KEY = 'photo_saas_user_v2';

const createEmptyProfile = (u?: Partial<AuthUser> | null): PhotographerProfile => ({
  id: u?.id?.toString() || '',
  studioName: u?.fullname ? `${u.fullname} Studio` : '',
  fullName: u?.fullname || u?.username || '',
  email: u?.email || '',
  phone: u?.phone || '',
  location: '',
  occupation: '',
  bio: '',
  avatarUrl: u?.avatar_url || '',
  enableWatermark: false,
  isOnboarded: false,
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [photographer, setPhotographer] = useState<PhotographerProfile>(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return createEmptyProfile();
      }
    }
    return createEmptyProfile();
  });

  // Query check-login API
  const {
    data: checkLoginData,
    isLoading: isCheckingLogin,
    isFetching: isFetchingLogin,
    error: checkLoginError,
    refetch: refetchAuth,
  } = useCheckLogin();

  // Mutation for logout API
  const logoutMutation = useLogout();

  // Sync state when check-login query responds
  useEffect(() => {
    if (!checkLoginData) return;

    if (checkLoginData.is_logged_in && checkLoginData.user) {
      const u = checkLoginData.user;
      setIsAuthenticated(true);
      setUser((prev) => ({
        ...prev,
        ...u,
      }));
      setPhotographer((prev) => ({
        ...prev,
        id: u.id?.toString() || prev.id,
        fullName: u.fullname || prev.fullName || u.username || '',
        email: u.email || prev.email,
        phone: u.phone || prev.phone,
        studioName: u.fullname ? `${u.fullname} Studio` : prev.studioName,
      }));
    } else if (checkLoginData.is_logged_in === false) {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [checkLoginData]);

  // Persist auth & profile to local storage for instant optimistic loads
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(photographer));
  }, [photographer]);

  // Cross-tab logout listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout' || e.key === STORAGE_KEY) {
        const authFlag = localStorage.getItem(STORAGE_KEY);
        if (!authFlag || authFlag === 'false') {
          setIsAuthenticated(false);
          setUser(null);
          setPhotographer(createEmptyProfile());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(
    (userData?: Partial<AuthUser>, profileData?: Partial<PhotographerProfile>) => {
      if (userData) {
        const fullUser = userData as AuthUser;
        setUser(fullUser);
        setPhotographer((prev) => ({
          ...prev,
          id: fullUser.id?.toString() || prev.id,
          fullName: fullUser.fullname || prev.fullName || fullUser.username,
          email: fullUser.email || prev.email,
          phone: fullUser.phone || prev.phone,
          avatarUrl: fullUser.avatar_url || prev.avatarUrl,
          studioName: fullUser.fullname ? `${fullUser.fullname} Studio` : prev.studioName,
          ...profileData,
        }));
      }
      setIsAuthenticated(true);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Local cleanups are also performed in mutation onError/onSuccess
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setPhotographer(createEmptyProfile());
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('access_token');
    }
  }, [logoutMutation]);

  const updateProfile = useCallback((updates: Partial<PhotographerProfile>) => {
    setPhotographer((prev) => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback((data: Partial<PhotographerProfile>) => {
    setPhotographer((prev) => ({
      ...prev,
      ...data,
      isOnboarded: true,
    }));
    setIsAuthenticated(true);
  }, []);

  const resetProfile = useCallback(() => {
    setPhotographer(createEmptyProfile(user));
  }, [user]);

  // Only consider loading on initial check if there is no cached auth
  const isLoading = isCheckingLogin && !checkLoginData;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isLoggingOut: logoutMutation.isPending,
        user,
        photographer,
        checkLoginError,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

