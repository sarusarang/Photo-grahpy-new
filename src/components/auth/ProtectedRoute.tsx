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


  // 1. Loading State during session validation
  if (isLoading) {
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
              Verifying Session
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Connecting to Ex Studio secure services...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State if check-login encountered a network or server failure
  if (checkLoginError && !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full p-8 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Authentication Service Unavailable</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We were unable to reach the authentication server. Please check your internet connection or try again.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={() => refetchAuth()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>

            <button
              onClick={() => navigate('/login', { state: { from: location } })}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Go to Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated State: Smooth redirect to login with return destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Authenticated: Render protected child routes
  return children ? <>{children}</> : <Outlet />;
};
