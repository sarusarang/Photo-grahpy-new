import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseOtpTimerOptions {
  /**
   * The email address associated with this OTP session.
   * Used to namespace persisted session timestamps so refreshing does not reset the timer.
   */
  email?: string;
  /**
   * Total validity duration in seconds. Defaults to 600 seconds (10 minutes).
   */
  validityDurationSeconds?: number;
  /**
   * Cooldown in seconds before the user can click 'Resend OTP'. Defaults to 30 seconds.
   */
  resendCooldownSeconds?: number;
  /**
   * Storage key prefix for sessionStorage persistence.
   */
  storageKeyPrefix?: string;
  /**
   * Whether to automatically start the timer on mount or when email changes.
   */
  autoStart?: boolean;
}

export interface UseOtpTimerReturn {
  /** Remaining seconds until the OTP expires (0 to validityDurationSeconds) */
  remainingSeconds: number;
  /** Human-readable validity time remaining, e.g. "09:42" or "00:00" */
  formattedTime: string;
  /** True when the OTP validity period has completely expired */
  isExpired: boolean;
  /** True when less than 2 minutes remain (useful for urgency indicators) */
  isExpiringSoon: boolean;
  /** Percentage of validity remaining (0 to 100) */
  percentageRemaining: number;
  /** Remaining seconds on the resend cooldown */
  resendCooldown: number;
  /** Formatted resend cooldown, e.g. "30s" */
  resendCooldownFormatted: string;
  /** Whether resending is permitted (cooldown elapsed OR OTP expired) */
  canResend: boolean;
  /** Starts or restarts the 10-minute validity timer and resend cooldown */
  startTimer: () => void;
  /** Resets the timer with fresh timestamps (e.g. after a successful resend) */
  resetTimer: () => void;
  /** Clears stored timestamps from session storage */
  clearTimer: () => void;
}

const DEFAULT_VALIDITY_SECONDS = 10 * 60; // 10 minutes = 600s
const DEFAULT_RESEND_COOLDOWN = 60; // 60s rate limit between resends (matches backend otp_send limit)

export const useOtpTimer = ({
  email = '',
  validityDurationSeconds = DEFAULT_VALIDITY_SECONDS,
  resendCooldownSeconds = DEFAULT_RESEND_COOLDOWN,
  storageKeyPrefix = 'photo_otp_',
  autoStart = true,
}: UseOtpTimerOptions = {}): UseOtpTimerReturn => {
  const expiryStorageKey = email ? `${storageKeyPrefix}expires_${email}` : `${storageKeyPrefix}expires_default`;
  const resendStorageKey = email ? `${storageKeyPrefix}resend_${email}` : `${storageKeyPrefix}resend_default`;

  // Safely get timestamp from sessionStorage
  const getStoredTimestamp = useCallback((key: string): number | null => {
    try {
      const val = sessionStorage.getItem(key);
      if (!val) return null;
      const num = parseInt(val, 10);
      return Number.isNaN(num) ? null : num;
    } catch {
      return null;
    }
  }, []);

  // Safely save timestamp to sessionStorage
  const setStoredTimestamp = useCallback((key: string, timestamp: number) => {
    try {
      sessionStorage.setItem(key, timestamp.toString());
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  // Safely remove timestamp from sessionStorage
  const removeStoredTimestamp = useCallback((key: string) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Storage unavailable
    }
  }, []);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const storedExpiry = getStoredTimestamp(expiryStorageKey);
    if (storedExpiry) {
      const diff = Math.ceil((storedExpiry - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    if (autoStart) {
      const now = Date.now();
      const expiresAt = now + validityDurationSeconds * 1000;
      setStoredTimestamp(expiryStorageKey, expiresAt);
      return validityDurationSeconds;
    }
    return 0;
  });

  const [resendCooldown, setResendCooldown] = useState<number>(() => {
    const storedResend = getStoredTimestamp(resendStorageKey);
    if (storedResend) {
      const diff = Math.ceil((storedResend - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    if (autoStart) {
      const now = Date.now();
      const resendAt = now + resendCooldownSeconds * 1000;
      setStoredTimestamp(resendStorageKey, resendAt);
      return resendCooldownSeconds;
    }
    return 0;
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize or start the timer
  const startTimer = useCallback(() => {
    const now = Date.now();
    const expiresAt = now + validityDurationSeconds * 1000;
    const resendAt = now + resendCooldownSeconds * 1000;

    setStoredTimestamp(expiryStorageKey, expiresAt);
    setStoredTimestamp(resendStorageKey, resendAt);

    setRemainingSeconds(validityDurationSeconds);
    setResendCooldown(resendCooldownSeconds);
  }, [
    validityDurationSeconds,
    resendCooldownSeconds,
    expiryStorageKey,
    resendStorageKey,
    setStoredTimestamp,
  ]);

  const resetTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const clearTimer = useCallback(() => {
    removeStoredTimestamp(expiryStorageKey);
    removeStoredTimestamp(resendStorageKey);
    setRemainingSeconds(0);
    setResendCooldown(0);
  }, [expiryStorageKey, resendStorageKey, removeStoredTimestamp]);

  // Synchronize clock on mount and interval ticks
  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const storedExpiry = getStoredTimestamp(expiryStorageKey);
      const storedResend = getStoredTimestamp(resendStorageKey);

      if (storedExpiry) {
        const diff = Math.ceil((storedExpiry - now) / 1000);
        setRemainingSeconds(Math.max(0, diff));
      } else {
        setRemainingSeconds(0);
      }

      if (storedResend) {
        const diff = Math.ceil((storedResend - now) / 1000);
        setResendCooldown(Math.max(0, diff));
      } else {
        setResendCooldown(0);
      }
    };

    // Tick every 1000ms
    timerRef.current = setInterval(updateTime, 1000);

    // Immediate recalculation when tab gains focus or user switches back from email app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTime();
      }
    };

    // Recalculate or synchronize if server throttle 429 event fires
    const handleThrottleEvent = (e: Event) => {
      const custom = e as CustomEvent<{ seconds?: number; url?: string }>;
      if (custom.detail?.seconds) {
        const sec = custom.detail.seconds;
        const resendAt = Date.now() + sec * 1000;
        setStoredTimestamp(resendStorageKey, resendAt);
        setResendCooldown(sec);
      }
    };

    window.addEventListener('focus', updateTime);
    window.addEventListener('api-throttled', handleThrottleEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('focus', updateTime);
      window.removeEventListener('api-throttled', handleThrottleEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    email,
    autoStart,
    expiryStorageKey,
    resendStorageKey,
    getStoredTimestamp,
    startTimer,
  ]);

  // Format MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isExpired = remainingSeconds === 0;
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 120; // Last 2 minutes
  const percentageRemaining = Math.max(
    0,
    Math.min(100, (remainingSeconds / validityDurationSeconds) * 100)
  );

  // Can resend if cooldown reached 0 OR if OTP has expired (instant resend allowed if expired)
  const canResend = resendCooldown === 0 || isExpired;
  const resendCooldownFormatted = `${resendCooldown}s`;

  return {
    remainingSeconds,
    formattedTime,
    isExpired,
    isExpiringSoon,
    percentageRemaining,
    resendCooldown,
    resendCooldownFormatted,
    canResend,
    startTimer,
    resetTimer,
    clearTimer,
  };
};
