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
  const { isAuthenticated, isLoading } = useAuth();
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
    const from = (location.state as any)?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default GuestRoute;
