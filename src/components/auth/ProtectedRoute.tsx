import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SuspenseLoader } from '@/components/common/SuspenseLoader';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Enterprise Protected Route
 * Validates session using backend cookie session (check-login API).
 * - Shows loader during session verification.
 * - Redirects unauthenticated visitors to /login with state.from.
 * - Renders protected child components or <Outlet /> once verified.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Session verification in progress (cold load / cookie validation)
  if (isLoading) {
    return (
      <SuspenseLoader
        message="Verifying Studio Session"
        submessage="Validating authentication & workspace..."
      />
    );
  }

  // 2. Unauthenticated: Redirect to login, preserving destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated: Render protected child routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
