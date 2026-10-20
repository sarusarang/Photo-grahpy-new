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
const SmartCullPage = lazy(() =>
  import('./pages/dashboard/SmartCullPage').then((m) => ({ default: m.SmartCullPage }))
);
const PublicTenantPortfolioPage = lazy(() =>
  import('./pages/PublicTenantPortfolioPage').then((m) => ({ default: m.PublicTenantPortfolioPage }))
);

import { SuspenseLoader } from './components/common/SuspenseLoader';
import { detectTenantHost } from './utils/tenantResolver';

export default function App() {
  const tenant = detectTenantHost();

  // ── Public Tenant Subdomain Mode (e.g. mridhul.exshare.ai or mridhul.localhost:5173) ──
  if (tenant.isTenant) {
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
            <Route path="/" element={<PublicTenantPortfolioPage subdomain={tenant.subdomain} />} />
            <Route path="/inquiry" element={<PublicTenantPortfolioPage subdomain={tenant.subdomain} />} />
            <Route path="/about" element={<PublicTenantPortfolioPage subdomain={tenant.subdomain} />} />
            <Route path="/contact" element={<PublicTenantPortfolioPage subdomain={tenant.subdomain} />} />
            {/* Direct client gallery deep links preserved on tenant host */}
            <Route path="/gallery/:galleryId" element={<ClientGalleryPage />} />
            <Route path="/events/:eventId" element={<GuestEventPage />} />
            {/* Catch-all on tenant domain serves portfolio */}
            <Route path="*" element={<PublicTenantPortfolioPage subdomain={tenant.subdomain} />} />
          </Routes>
        </Suspense>
      </>
    );
  }
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
          <Route
            path="/onboarding"
            element={
              <GuestRoute>
                <OnboardingPage />
              </GuestRoute>
            }
          />

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
            <Route path="culling" element={<SmartCullPage />} />
            <Route path="smart-cull" element={<Navigate to="/dashboard/culling" replace />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="portfolio" element={<PortfolioStudioPage />} />
            <Route path="tutorials" element={<TutorialPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Public Photographer Portfolio Route (No Auth Required - Path-Based e.g. exshare.ai/p/mrudul) */}
          <Route path="/portfolio/:photographerId" element={<PortfolioPage />} />
          <Route path="/p/:photographerId" element={<PortfolioPage />} />
          <Route path="/portfolios/:photographerId" element={<PortfolioPage />} />

          {/* Public Tenant Portfolio Route (Direct Preview & Development Testing) */}
          <Route path="/tenant-portfolio" element={<PublicTenantPortfolioPage />} />
          <Route path="/tenant-portfolio/:subdomain" element={<PublicTenantPortfolioPage />} />

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
