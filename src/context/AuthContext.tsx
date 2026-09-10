import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PhotographerProfile } from '../types';
import { INITIAL_PHOTOGRAPHER } from '../data/demoData';

interface AuthContextType {
  isAuthenticated: boolean;
  photographer: PhotographerProfile;
  login: (email?: string, password?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<PhotographerProfile>) => void;
  completeOnboarding: (data: Partial<PhotographerProfile>) => void;
  resetProfile: () => void;
}

const STORAGE_KEY = 'photo_saas_auth_v2';
const PROFILE_KEY = 'photo_saas_profile_v2';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Default logged in for immediate demo experience
  });

  const [photographer, setPhotographer] = useState<PhotographerProfile>(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_PHOTOGRAPHER;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(photographer));
  }, [photographer]);

  const login = (_email?: string, _password?: string) => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfile = (updates: Partial<PhotographerProfile>) => {
    setPhotographer((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (data: Partial<PhotographerProfile>) => {
    setPhotographer((prev) => ({
      ...prev,
      ...data,
      isOnboarded: true,
    }));
    setIsAuthenticated(true);
  };

  const resetProfile = () => {
    setPhotographer(INITIAL_PHOTOGRAPHER);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        photographer,
        login,
        logout,
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
