import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'A connection issue occurred while syncing with the studio server.',
  errorCode,
  onRetry,
  actionLabel,
  onAction,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center justify-between gap-3 text-rose-300 text-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-neutral-900/40 backdrop-blur-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/5">
        {errorCode?.includes('LIMIT') || errorCode?.includes('LOCKED') ? (
          <ShieldAlert className="w-7 h-7 text-amber-400" />
        ) : (
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        )}
      </div>

      {errorCode && (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
          {errorCode}
        </span>
      )}

      <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-sm leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3 mt-6">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition shadow cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}

        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
