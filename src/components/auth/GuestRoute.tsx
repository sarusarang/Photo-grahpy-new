import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SuspenseLoader } from '@/components/common/SuspenseLoader';

interface GuestRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * GuestRoute (PublicOnlyRoute)
 * Used for login, registration, and onboarding routes.
 * If user is already authenticated via valid cookies, redirects them to dashboard.
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo = '/dashboard/overview',
}) => {
  const { isAuthenticated, isLoading, photographer } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <SuspenseLoader
        message="Loading Studio"
        submessage="Validating session..."
      />
    );
  }

  if (isAuthenticated) {
    const isOnboardingPath = ['/onboarding', '/signup', '/register'].includes(location.pathname);

    // If authenticated but not yet onboarded:
    // Allow user to remain on onboarding screens to complete profile setup.
    // If attempting to access login while un-onboarded, direct them to onboarding.
    if (!photographer.isOnboarded) {
      if (isOnboardingPath) {
        return children ? <>{children}</> : <Outlet />;
      }
      return <Navigate to="/onboarding" replace />;
    }

    // If fully authenticated and onboarded, redirect away from guest-only pages
    const from = (location.state as any)?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default GuestRoute;
