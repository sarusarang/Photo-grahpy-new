import React, { useState } from 'react';
import {
  Clock,
  RotateCcw,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { OtpInputGroup } from './OtpInputGroup';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import { cn } from '../../lib/utils';

export interface OtpSectionProps {
  /** The email address where the OTP was sent */
  email: string;
  /** Callback fired when user submits the 6-digit code */
  onVerify: (otp: string) => Promise<void> | void;
  /** Callback fired when user clicks 'Resend code' */
  onResend: () => Promise<void> | void;
  /** Callback fired when user wants to change their email address */
  onChangeEmail?: () => void;
  /** Whether the verification request is pending */
  isVerifying?: boolean;
  /** Whether the resend request is pending */
  isResending?: boolean;
  /** Optional custom title (defaults to "Check your email") */
  title?: string;
  /** Optional custom submit button label (defaults to "Verify & Sign In") */
  submitLabel?: string;
  /** Total validity period for OTP in minutes (defaults to 10 minutes) */
  validityMinutes?: number;
  /** Cooldown in seconds between resends (defaults to 30 seconds) */
  resendCooldownSeconds?: number;
  /** Prefix for OTP inputs IDs (defaults to "auth-otp") */
  idPrefix?: string;
  /** Whether to hide the default h1 title and subtitle */
  hideHeader?: boolean;
  /** Any external error message from mutation or schema */
  errorMessage?: string | null;
  /** Container class name */
  className?: string;
}

export const OtpSection: React.FC<OtpSectionProps> = ({
  email,
  onVerify,
  onResend,
  onChangeEmail,
  isVerifying = false,
  isResending = false,
  title = 'Check your email',
  submitLabel = 'Verify & Sign In',
  validityMinutes = 10,
  resendCooldownSeconds = 30,
  idPrefix = 'auth-otp',
  hideHeader = false,
  errorMessage = null,
  className,
}) => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Hook for 10-minute validity and resend cooldown logic
  const {
    formattedTime,
    isExpired,
    isExpiringSoon,
    resendCooldown,
    resendCooldownFormatted,
    canResend,
    resetTimer,
    clearTimer,
  } = useOtpTimer({
    email,
    validityDurationSeconds: validityMinutes * 60,
    resendCooldownSeconds,
    autoStart: true,
  });

  // Clear local error when user types
  const handleOtpChange = (newVal: string) => {
    setOtp(newVal);
    if (localError) {
      setLocalError(null);
    }
  };

  // Resend handler: triggers API mutation, clears inputs, resets 10-minute clock
  const handleResendClick = async () => {
    if (!canResend || isResending) return;
    setLocalError(null);
    setOtp('');

    try {
      await onResend();
      resetTimer(); // Reset 10-minute validity and resend cooldown
    } catch {
      // Handled by parent mutation toast
    }
  };

  // Change email handler: clears timer and signals parent
  const handleChangeEmailClick = () => {
    clearTimer();
    setOtp('');
    setLocalError(null);
    if (onChangeEmail) {
      onChangeEmail();
    }
  };

  // Form submit handler with expiry guard
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isExpired) {
      setLocalError('This verification code has expired (10-minute limit). Please request a new code.');
      return;
    }

    if (otp.length < 6) {
      setLocalError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLocalError(null);
    await onVerify(otp);
  };

  // Auto-submit when all 6 digits entered if not expired
  const handleComplete = async (completedOtp: string) => {
    if (!isExpired && !isVerifying && completedOtp.length === 6) {
      setLocalError(null);
      try {
        await onVerify(completedOtp);
      } catch {
        // Handled by parent or toast
      }
    }
  };

  const displayedError = localError || errorMessage;

  return (
    <div className={cn('w-full flex flex-col', className)}>
      {/* Title & Subtitle */}
      {!hideHeader && (
        <>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight mb-1">
            {title}
          </h1>
          <p className="text-xs sm:text-[13px] text-neutral-400 mb-4 sm:mb-5 leading-relaxed">
            We sent a 6-digit code to{' '}
            <strong className="text-amber-400 font-semibold break-all">{email}</strong>
          </p>
        </>
      )}

      {/* 10-Minute Validity & Status Bar */}
      <div className="mb-4">
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-300 border',
            isExpired
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : isExpiringSoon
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
          )}
        >
          <div className="flex items-center gap-2">
            {isExpired ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Clock
                className={cn(
                  'w-4 h-4 shrink-0',
                  isExpiringSoon ? 'text-amber-400' : 'text-neutral-400'
                )}
              />
            )}
            <span className="font-medium text-[11px] sm:text-xs">
              {isExpired
                ? 'Code expired'
                : isExpiringSoon
                ? 'Expiring soon'
                : 'Code valid for'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-[13px]">
            {isExpired ? (
              <span className="text-rose-400">00:00</span>
            ) : (
              <span className={cn(isExpiringSoon ? 'text-amber-300' : 'text-neutral-200')}>
                {formattedTime}
              </span>
            )}
          </div>
        </div>

        {/* Expired Warning Banner */}
        {isExpired && (
          <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                Your 10-minute code has expired. Please request a new verification code to continue.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResending}
              className="w-full py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Resend New Code</span>
            </button>
          </div>
        )}
      </div>

      {/* OTP Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* 6-Digit Boxes */}
        <OtpInputGroup
          value={otp}
          onChange={handleOtpChange}
          onComplete={handleComplete}
          disabled={isVerifying}
          isExpired={isExpired}
          hasError={!!displayedError}
          idPrefix={idPrefix}
          autoFocus={true}
        />

        {/* Error message */}
        {displayedError && !isExpired && (
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] justify-center text-center px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{displayedError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isVerifying || isExpired || otp.length < 6}
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>{submitLabel}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </>
          )}
        </button>
      </form>

      {/* Footer Actions: Resend & Change Email */}
      <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 mt-4 select-none">
        <span>Didn't receive the code?</span>
        <button
          type="button"
          onClick={handleResendClick}
          disabled={!canResend || isResending}
          className={cn(
            'font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed',
            canResend
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-neutral-500 disabled:opacity-60'
          )}
          title={
            !canResend
              ? `You can request another code in ${resendCooldown} seconds`
              : 'Request a new verification code'
          }
        >
          {isResending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Sending...</span>
            </>
          ) : !canResend ? (
            <span>Resend in {resendCooldownFormatted}</span>
          ) : (
            <>
              <RotateCcw className="w-3 h-3" />
              <span>Resend</span>
            </>
          )}
        </button>

        {onChangeEmail && (
          <>
            <span className="text-neutral-700">•</span>
            <button
              type="button"
              onClick={handleChangeEmailClick}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Change email
            </button>
          </>
        )}
      </div>
    </div>
  );
};
