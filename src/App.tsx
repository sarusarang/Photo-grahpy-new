import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GalleryProvider } from './context/GalleryContext';
import { ToastProvider } from './components/ui/Toast';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingLayout } from './layouts/LandingLayout';

// Lazy loaded page components for optimal production performance
const LandingPlaceholder = lazy(() =>
  import('./pages/LandingPlaceholder').then((m) => ({ default: m.LandingPlaceholder }))
);
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const OnboardingPage = lazy(() =>
  import('./pages/auth/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const DrivePage = lazy(() =>
  import('./pages/dashboard/DrivePage').then((m) => ({ default: m.DrivePage }))
);
const GalleryDetailPage = lazy(() =>
  import('./pages/dashboard/GalleryDetailPage').then((m) => ({
    default: m.GalleryDetailPage,
  }))
);
const TutorialPage = lazy(() =>
  import('./pages/dashboard/TutorialPage').then((m) => ({ default: m.TutorialPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ClientGalleryPage = lazy(() =>
  import('./pages/client/ClientGalleryPage').then((m) => ({
    default: m.ClientGalleryPage,
  }))
);

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      <span className="text-xs uppercase tracking-widest font-mono text-neutral-500">
        Loading Atelier...
      </span>
    </div>
  );
}

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GalleryProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Landing Page Layout & Placeholder */}
                <Route element={<LandingLayout />}>
                  <Route path="/" element={<LandingPlaceholder />} />
                </Route>

                {/* Authentication & Onboarding Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* Authenticated Photographer Dashboard Routes (Outlet based) */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard/home" replace />} />
                  <Route path="home" element={<DrivePage />} />
                  <Route path="drive" element={<DrivePage />} />
                  <Route path="drive/:galleryId" element={<GalleryDetailPage />} />
                  <Route path="tutorials" element={<TutorialPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Public Client Gallery Route (Separate Layout) */}
                <Route path="/gallery/:galleryId" element={<ClientGalleryPage />} />

                {/* Catch all fallback */}
                <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </GalleryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

