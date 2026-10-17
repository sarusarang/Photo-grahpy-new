import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart,
  Mail,
  ArrowRight,
  Loader2,
  X,
  RefreshCw,
  CheckCircle2,
  ClipboardPaste,
  ShieldCheck,
  Edit2,
} from 'lucide-react';
import {
  SendViewerOtpApi,
  VerifyViewerOtpApi,
  type ViewerProfile,
} from '@/service/galleries/ViewerGalleryApi';
import { useToast } from '@/components/ui/Toast';

export interface ViewerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryIdOrSlug: string;
  galleryTitle?: string;
  onSuccess: (profile: ViewerProfile) => void;
  pendingCount?: number;
}

export const ViewerAuthModal: React.FC<ViewerAuthModalProps> = ({
  isOpen,
  onClose,
  galleryIdOrSlug,
  galleryTitle: _galleryTitle,
  onSuccess,
  pendingCount = 1,
}) => {
  const { showToast } = useToast();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessPasted, setIsSuccessPasted] = useState(false);

  // Resend countdown timer
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage('');
      setCountdown(30);
      setCanResend(false);
      setIsSuccessPasted(false);
      // Auto-focus email input
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Auto-focus first OTP digit when entering step 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 120);
    }
  }, [step]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await SendViewerOtpApi(galleryIdOrSlug, cleanEmail);
      showToast('Verification Code Sent', res.message || `Check your inbox at ${cleanEmail}`, 'info');
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(30);
      setCanResend(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Could not send verification code. Please try again.';
      setErrorMessage(msg);
      showToast('Verification Error', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const triggerVerify = async (codeToVerify: string) => {
    if (isLoading) return;
    const cleanOtp = codeToVerify.trim().replace(/\D/g, '');

    if (cleanOtp.length < 4) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await VerifyViewerOtpApi(galleryIdOrSlug, email.trim(), cleanOtp);
      if (res?.viewer) {
        showToast('Signed In', 'Your favorites have been saved to your account!', 'success');
        onSuccess(res.viewer);
      } else {
        throw new Error('Invalid verification response');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Invalid or expired code. Please verify the code and try again.';
      setErrorMessage(msg);
      showToast('Verification Failed', msg, 'error');
      // Highlight/focus the first digit for easy retry
      digitRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerify(otpDigits.join(''));
  };

  // ── Handling Individual Digit Change ──────────────────────────
  const handleDigitChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');

    if (!cleanDigits) {
      const updated = [...otpDigits];
      updated[idx] = '';
      setOtpDigits(updated);
      return;
    }

    // If user pasted/typed multiple digits into a single box
    if (cleanDigits.length > 1) {
      applyPastedDigits(cleanDigits, idx);
      return;
    }

    // Single digit input
    const char = cleanDigits.slice(-1);
    const updated = [...otpDigits];
    updated[idx] = char;
    setOtpDigits(updated);
    if (errorMessage) setErrorMessage('');

    // Auto-advance to next box
    if (idx < 5) {
      digitRefs.current[idx + 1]?.focus();
    }

    // Auto-verify if all 6 digits are complete
    const fullCode = updated.join('');
    if (fullCode.length === 6) {
      triggerVerify(fullCode);
    }
  };

  // ── Handling Backspace & Arrow Keys ───────────────────────────
  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[idx] && idx > 0) {
        // Move to previous box and clear it
        e.preventDefault();
        const updated = [...otpDigits];
        updated[idx - 1] = '';
        setOtpDigits(updated);
        digitRefs.current[idx - 1]?.focus();
      } else {
        const updated = [...otpDigits];
        updated[idx] = '';
        setOtpDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      digitRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      e.preventDefault();
      digitRefs.current[idx + 1]?.focus();
    }
  };

  // ── Helper to apply pasted digits across slots ────────────────
  const applyPastedDigits = (digits: string, startIdx = 0) => {
    const clean = digits.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;

    const updated = [...otpDigits];
    for (let i = 0; i < clean.length; i++) {
      const targetSlot = startIdx + i < 6 ? startIdx + i : i;
      if (targetSlot < 6) {
        updated[targetSlot] = clean[i];
      }
    }
    setOtpDigits(updated);
    setErrorMessage('');
    setIsSuccessPasted(true);
    setTimeout(() => setIsSuccessPasted(false), 1800);

    // Focus last filled box
    const nextIdx = Math.min(startIdx + clean.length, 5);
    digitRefs.current[nextIdx]?.focus();

    // Auto-verify if 6 digits reached!
    const fullCode = updated.join('');
    if (fullCode.length === 6) {
      triggerVerify(fullCode);
    }
  };

  // ── Native Clipboard Paste Event (Ctrl+V / Cmd+V) ─────────────
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    applyPastedDigits(pasted, 0);
  };

  // ── Quick Paste Button (Click to Paste from Clipboard API) ────
  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, '').slice(0, 6);
      if (!clean) {
        showToast('Clipboard Empty', 'No numeric code found in clipboard.', 'info');
        return;
      }
      applyPastedDigits(clean, 0);
      showToast('Code Pasted', `Pasted code: ${clean}`, 'info');
    } catch {
      // If clipboard permission is blocked, focus first box
      digitRefs.current[0]?.focus();
      showToast('Paste Ready', 'Press Ctrl+V or long-press to paste your code.', 'info');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await SendViewerOtpApi(galleryIdOrSlug, email.trim());
      showToast('New Code Sent', res.message || 'A fresh code has been sent.', 'info');
      setCountdown(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      digitRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not resend code. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otpDigits.every((d) => d.length === 1);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#0f1118] border border-neutral-800/90 shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Header with Close Button */}
        <div className="relative p-6 sm:p-8 pb-3 text-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Glowing Heart Emblem Icon */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/25 to-rose-500/10 border border-rose-500/35 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/20 group">
            <Heart className="w-7 h-7 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Save Your Favorites
          </h2>

          {step === 'email' ? (
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              {pendingCount > 1
                ? `Enter your email to like ${pendingCount} selected photos and access them anytime.`
                : 'Enter your email to like photos, create your curated selection, and access them on any device.'}
            </p>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <p className="text-xs text-neutral-400 font-light">
                Enter the 6-digit verification code sent to
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-neutral-200">
                <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-semibold truncate max-w-[220px]">{email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMessage('');
                  }}
                  className="ml-1 text-[11px] text-rose-400 hover:text-rose-300 underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
                  title="Change Email"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Change</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="relative px-6 sm:px-8 pb-8">
          {errorMessage && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'email' ? (
            /* ──────── STEP 1: EMAIL ENTRY ──────── */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-neutral-500 font-mono flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Passwordless login • Instant 6-digit security code</span>
              </div>
            </form>
          ) : (
            /* ──────── STEP 2: 6-DIGIT SEGMENTED OTP WITH FULL PASTE SUPPORT ──────── */
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Security Code
                  </label>
                  {/* Quick Paste from Clipboard Pill */}
                  <button
                    type="button"
                    onClick={handleQuickPaste}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 text-[11px] font-mono text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                    title="Paste code from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3 text-rose-400" />
                    <span>{isSuccessPasted ? 'Pasted!' : 'Paste Code'}</span>
                  </button>
                </div>

                {/* ── 6-Box Segmented OTP Input Grid (3 - 3 format with divider) ── */}
                <div
                  className="flex items-center justify-center gap-2 sm:gap-2.5 py-1"
                  onPaste={handlePaste}
                >
                  {/* Digits 0, 1, 2 */}
                  {[0, 1, 2].map((idx) => {
                    const isFilled = Boolean(otpDigits[idx]);
                    return (
                      <input
                        key={idx}
                        ref={(el) => {
                          digitRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otpDigits[idx]}
                        onChange={(e) => handleDigitChange(idx, e)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onFocus={(e) => e.target.select()}
                        disabled={isLoading}
                        className={`w-11 sm:w-13 h-14 sm:h-16 rounded-2xl text-center font-mono font-bold text-xl sm:text-2xl transition-all select-none focus:outline-none ${
                          isFilled
                            ? 'bg-rose-500/10 border-2 border-rose-500/60 text-white shadow-sm shadow-rose-500/10'
                            : 'bg-neutral-900/90 border-2 border-neutral-800 text-neutral-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                        }`}
                        placeholder="•"
                      />
                    );
                  })}

                  {/* Visual Middle Separator */}
                  <div className="w-2 sm:w-3 h-0.5 bg-neutral-700 rounded-full mx-0.5" />

                  {/* Digits 3, 4, 5 */}
                  {[3, 4, 5].map((idx) => {
                    const isFilled = Boolean(otpDigits[idx]);
                    return (
                      <input
                        key={idx}
                        ref={(el) => {
                          digitRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otpDigits[idx]}
                        onChange={(e) => handleDigitChange(idx, e)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onFocus={(e) => e.target.select()}
                        disabled={isLoading}
                        className={`w-11 sm:w-13 h-14 sm:h-16 rounded-2xl text-center font-mono font-bold text-xl sm:text-2xl transition-all select-none focus:outline-none ${
                          isFilled
                            ? 'bg-rose-500/10 border-2 border-rose-500/60 text-white shadow-sm shadow-rose-500/10'
                            : 'bg-neutral-900/90 border-2 border-neutral-800 text-neutral-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                        }`}
                        placeholder="•"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Verify & Save Button */}
              <button
                type="submit"
                disabled={isLoading || !isOtpComplete}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Save Favorites</span>
                  </>
                )}
              </button>

              {/* Resend Code Section with Countdown */}
              <div className="pt-1 flex items-center justify-between text-xs font-mono text-neutral-400 border-t border-neutral-800/80 pt-3">
                <span>Didn&apos;t receive code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                ) : (
                  <span className="text-neutral-500">Resend in {countdown}s</span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
