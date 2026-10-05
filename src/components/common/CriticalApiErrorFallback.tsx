import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  LogOut,
  ServerCrash,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface CriticalApiErrorFallbackProps {
  title?: string;
  subtitle?: string;
  errorMessage?: string;
  error?: unknown;
  serviceName?: string;
  autoRetrySeconds?: number;
  onRetry?: () => void | Promise<void>;
  onSignOut?: () => void;
}

/**
 * Enterprise Service Error Fallback Component
 * 
 * Used across the application when a mission-critical API (such as current subscription,
 * entitlement check, or core studio auth) fails with a 500, 502/503/504, or network drop.
 * 
 * Instead of caching invalid state in localStorage or rendering a broken/corrupt UI,
 * this component safely pauses the workspace with a clear explanation, automated/manual retry,
 * error diagnostics, and a safe sign-out mechanism.
 */
export const CriticalApiErrorFallback: React.FC<CriticalApiErrorFallbackProps> = ({
  title = 'Studio Service Temporarily Unavailable',
  subtitle = 'We are having trouble communicating with the core studio entitlement servers. To protect your studio data and prevent billing inconsistencies, dashboard access has been temporarily paused.',
  errorMessage,
  error,
  serviceName = 'Subscription & Entitlements Engine',
  autoRetrySeconds = 20,
  onRetry,
  onSignOut,
}) => {
  const { logout } = useAuth();
  const [countdown, setCountdown] = useState<number>(autoRetrySeconds);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Extract human-readable error description
  const errorDetails = React.useMemo(() => {
    if (errorMessage) return errorMessage;
    if (!error) return 'HTTP 500: Server or Network Connection Failure';
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
      const err = error as Record<string, any>;
      const status = err.status || err.response?.status || err.statusCode;
      const data = err.data || err.response?.data;
      const detail = data?.detail || data?.message || err.message;
      if (status) return `HTTP ${status}: ${detail || 'Internal Service Outage'}`;
      if (detail) return String(detail);
    }
    return 'Network Error: Failed to reach API server. Please check your internet or firewall.';
  }, [error, errorMessage]);

  const isNetworkOffline =
    typeof navigator !== 'undefined' && !navigator.onLine;

  // Auto-retry countdown timer
  useEffect(() => {
    if (!onRetry || autoRetrySeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRetry();
          return autoRetrySeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry, autoRetrySeconds]);

  const handleRetry = async () => {
    if (isRetrying || !onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } catch {
      // Re-trigger countdown if still failing
      setCountdown(autoRetrySeconds);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      logout();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-neutral-950 text-neutral-100 select-none">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-red-500/10 rounded-full blur-[140px] opacity-80" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[250px] bg-amber-500/5 rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="relative w-full max-w-xl mx-auto bg-neutral-900/90 border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-medium tracking-wide">
            {isNetworkOffline ? (
              <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ) : (
              <ServerCrash className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            )}
            <span>{isNetworkOffline ? 'Network Offline' : 'Critical Service Outage'}</span>
          </div>

          <div className="text-[11px] font-mono text-neutral-500">
            {serviceName}
          </div>
        </div>

        {/* Hero Visual & Icon */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Automated Retry Progress Indicator */}
        {onRetry && (
          <div className="mb-6 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RefreshCw
                className={`w-4 h-4 text-amber-400 ${
                  isRetrying ? 'animate-spin' : ''
                }`}
              />
              <span className="text-xs text-neutral-300">
                {isRetrying
                  ? 'Reconnecting to studio cluster...'
                  : `Automated retry in ${countdown}s`}
              </span>
            </div>

            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors disabled:opacity-50"
            >
              {isRetrying ? 'Checking...' : 'Retry Now'}
            </button>
          </div>
        )}

        {/* Technical Diagnostics Accordion */}
        <div className="mb-6 rounded-2xl border border-neutral-800/80 overflow-hidden bg-neutral-950/40">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Technical Diagnostics
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="px-4 pb-4 pt-1 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-400 space-y-2">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-red-400 break-words font-mono">
                {errorDetails}
              </div>
              <p className="text-[10px] text-neutral-500 leading-normal">
                If this problem persists, please check your network connection or verify that the backend Django REST API service is healthy.
              </p>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'Reconnecting...' : 'Reconnect Studio'}
            </button>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-sm border border-neutral-700/60 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-neutral-400" />
            Sign Out
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Enterprise Studio Architecture</span>
          <span className="flex items-center gap-1 hover:text-neutral-400 cursor-pointer transition-colors">
            System Status <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
