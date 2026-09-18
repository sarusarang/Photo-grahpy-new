import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingLayout } from './layouts/LandingLayout';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
const OverviewPage = lazy(() =>
  import('./pages/dashboard/OverviewPage').then((m) => ({ default: m.OverviewPage }))
);
const InquiriesPage = lazy(() =>
  import('./pages/dashboard/InquiriesPage').then((m) => ({ default: m.InquiriesPage }))
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
const PortfolioStudioPage = lazy(() =>
  import('./pages/dashboard/PortfolioStudioPage').then((m) => ({ default: m.PortfolioStudioPage }))
);
const PortfolioPage = lazy(() =>
  import('./pages/portfolio/PortfolioPage').then((m) => ({ default: m.PortfolioPage }))
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

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: '#141419',
            borderColor: '#262626',
            color: '#ffffff',
          },
        }}
      />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Landing Page Layout & Placeholder */}
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPlaceholder />} />
          </Route>

          {/* Authentication & Onboarding Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<OnboardingPage />} />
          <Route path="/register" element={<OnboardingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Authenticated Photographer Dashboard Routes (Outlet based, Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="home" element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="drive" element={<DrivePage />} />
            <Route path="drive/:galleryId" element={<GalleryDetailPage />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="portfolio" element={<PortfolioStudioPage />} />
            <Route path="tutorials" element={<TutorialPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Public Photographer Portfolio Route (No Auth Required) */}
          <Route path="/portfolio/:photographerId" element={<PortfolioPage />} />

          {/* Public Client Gallery Route (Separate Layout) */}
          <Route path="/gallery/:galleryId" element={<ClientGalleryPage />} />

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
