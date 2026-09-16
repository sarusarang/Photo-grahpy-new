import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Camera, AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkLoginError, refetchAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  // 1. Loading State during session validation (only brief, if not authenticated)
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-400/5">
              <Camera className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-neutral-950 bg-amber-400 border-t-transparent animate-spin" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
              Loading Studio
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Setting up your photography workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. If backend auth is offline or unreachable, smoothly fallback to demo studio
  if (checkLoginError && !isAuthenticated) {
    return children ? <>{children}</> : <Outlet />;
  }

  // 3. Unauthenticated State: Smooth redirect to login with return destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Authenticated: Render protected child routes
  return children ? <>{children}</> : <Outlet />;
};
