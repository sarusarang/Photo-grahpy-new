import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingLayout } from './layouts/LandingLayout';

import { ProtectedRoute, GuestRoute } from './components/auth';

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
const GalleryPage = lazy(() =>
  import('./pages/dashboard/GalleryPage').then((m) => ({ default: m.GalleryPage }))
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
const EventsPage = lazy(() =>
  import('./pages/dashboard/EventsPage').then((m) => ({ default: m.EventsPage }))
);
const EventDetailPage = lazy(() =>
  import('./pages/dashboard/EventDetailPage').then((m) => ({ default: m.EventDetailPage }))
);
const GuestEventPage = lazy(() =>
  import('./pages/events/GuestEventPage').then((m) => ({ default: m.GuestEventPage }))
);

import { SuspenseLoader } from './components/common/SuspenseLoader';

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
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          {/* Public Landing Page Layout & Placeholder */}
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPlaceholder />} />
          </Route>

          {/* Authentication & Onboarding Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <OnboardingPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <OnboardingPage />
              </GuestRoute>
            }
          />
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
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="gallery/:galleryId" element={<GalleryDetailPage />} />
            <Route path="drive" element={<Navigate to="/dashboard/gallery" replace />} />
            <Route path="drive/:galleryId" element={<GalleryDetailPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="portfolio" element={<PortfolioStudioPage />} />
            <Route path="tutorials" element={<TutorialPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Public Photographer Portfolio Route (No Auth Required) */}
          <Route path="/portfolio/:photographerId" element={<PortfolioPage />} />

          {/* Public Client Gallery Route (Separate Layout) */}
          <Route path="/gallery/:galleryId" element={<ClientGalleryPage />} />

          {/* Public Guest Event QR Code Destination (Editorial Template with AI-Only Search) */}
          <Route path="/events/:eventId" element={<GuestEventPage />} />

          {/* Preview route for SuspenseLoader */}
          <Route path="/loader-preview" element={<SuspenseLoader />} />

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
